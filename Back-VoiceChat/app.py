from flask import Flask, request, jsonify, send_file, render_template
from openai import OpenAI
import requests
import os
import time
import base64
import gzip
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO
from flask_cors import CORS
import logging
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Configure logging - reduced for production performance
logging.basicConfig(level=logging.WARNING)

app = Flask(__name__)
CORS(app)

# Disable compression for audio endpoints to prevent playback issues
@app.after_request
def disable_compression_for_audio(response):
    """Disable compression for audio endpoints"""
    if (request.path.startswith('/api/voice') or 
        request.path.startswith('/api/test-audio') or
        'audio' in request.path):
        response.headers['Content-Encoding'] = 'identity'
        response.headers['Cache-Control'] = 'no-store'
        # Remove any compression headers
        response.headers.pop('Content-Encoding', None)
        response.direct_passthrough = True
    return response

# Connection pooling and keep-alive optimization
def create_session_with_retries():
    session = requests.Session()
    retry_strategy = Retry(
        total=3,
        backoff_factor=0.1,
        status_forcelist=[429, 500, 502, 503, 504],
    )
    adapter = HTTPAdapter(
        max_retries=retry_strategy,
        pool_connections=10,
        pool_maxsize=20
    )
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session

# Global session for reuse
requests_session = create_session_with_retries()

# Initialize OpenAI client with optimized configuration
openai_client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
    timeout=30.0  # Shorter timeout to prevent hanging
)

# ElevenLabs configuration with regional optimization
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY")
VOICE_ID = "aEO01A4wXwd1O8GPgGlF"
ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1"  # Use closest endpoint

# Thread pool for concurrent operations
executor = ThreadPoolExecutor(max_workers=4)

def exponential_backoff_polling(run, thread_id, max_wait=20):
    """Poll with exponential backoff for better performance"""
    wait_times = [0.1, 0.2, 0.5, 1.0, 1.0, 2.0]  # Exponential backoff sequence
    total_time = 0
    
    for wait_time in wait_times:
        if run.status not in ['queued', 'in_progress', 'cancelling']:
            break
            
        time.sleep(wait_time)
        total_time += wait_time
        
        if total_time > max_wait:
            break
            
        run = openai_client.beta.threads.runs.retrieve(
            thread_id=thread_id,
            run_id=run.id
        )
    
    return run

def stream_transcribe_audio(audio_data):
    """Stream audio directly to OpenAI without temp files"""
    audio_buffer = BytesIO(audio_data)
    audio_buffer.name = "audio.mp3"  # Required for OpenAI API
    
    transcript = openai_client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_buffer
    )
    return transcript.text

def concurrent_tts_request(text):
    """Make TTS request using optimized session with better audio quality"""
    tts_url = f"{ELEVENLABS_BASE_URL}/text-to-speech/{VOICE_ID}"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"  # Explicitly request MP3
    }
    payload = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.8,
            "style": 0.0,
            "use_speaker_boost": True
        },
        "output_format": "mp3_22050_32"  # Standard MP3 format that browsers handle well
    }
    
    response = requests_session.post(tts_url, headers=headers, json=payload, timeout=15)
    return response

# Compression disabled for audio endpoints to prevent playback issues

@app.route('/api/voice', methods=['POST'])
def handle_voice():
    """
    Optimized voice-to-voice AI assistant with concurrent processing.
    """
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file uploaded'}), 400

    audio_file = request.files['audio']
    
    if audio_file.filename == '':
        return jsonify({'error': 'No audio file selected'}), 400

    try:
        # Read audio data into memory (no temp files)
        audio_data = audio_file.read()
        
        # Step 1: Stream transcription directly from memory
        user_text = stream_transcribe_audio(audio_data)

        # Step 2: Start Assistant processing with optimized polling
        thread = openai_client.beta.threads.create()
        
        openai_client.beta.threads.messages.create(
            thread_id=thread.id,
            role="user",
            content=user_text
        )
        
        run = openai_client.beta.threads.runs.create(
            thread_id=thread.id,
            assistant_id="asst_c0LRWpvZJ04MimV8SUgLYJje"
        )
        
        # Use exponential backoff polling for better performance
        run = exponential_backoff_polling(run, thread.id)
        
        if run.status == 'completed':
            messages = openai_client.beta.threads.messages.list(thread_id=thread.id)
            latest_message = messages.data[0]
            ai_reply = ""
            
            if latest_message.content and len(latest_message.content) > 0:
                for content_block in latest_message.content:
                    if content_block.type == 'text':
                        ai_reply = content_block.text.value
                        break
                        
            if not ai_reply:
                ai_reply = "I understand your message, but I don't have a response to provide at the moment."
        else:
            return jsonify({"error": "Assistant processing failed"}), 500

        # Step 3: Concurrent TTS processing - start immediately after getting response
        tts_future = executor.submit(concurrent_tts_request, ai_reply)
        
        # Wait for TTS completion
        tts_response = tts_future.result(timeout=15)
        
        if tts_response.status_code != 200:
            return jsonify({"error": "Failed to generate speech"}), 500

        # Return raw audio bytes without compression
        audio_base64 = base64.b64encode(tts_response.content).decode('utf-8')
        
        response = jsonify({
            "audio": audio_base64,
            "text": ai_reply,
            "transcription": user_text,
            "compressed": False
        })
        
        # Set headers to prevent compression and enable proper audio handling
        response.headers['Content-Type'] = 'application/json'
        response.headers['Cache-Control'] = 'no-store'
        response.headers['Content-Encoding'] = 'identity'
        
        return response, 200

    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "voice-ai-assistant"}), 200

# Decompression endpoint removed - no longer needed since compression is disabled

@app.route('/api/test-audio', methods=['GET'])
def test_audio():
    """Generate a simple test audio for debugging"""
    try:
        test_text = "This is a test of the ElevenLabs text-to-speech system."
        
        # Use the concurrent TTS function
        tts_response = concurrent_tts_request(test_text)
        
        if tts_response.status_code != 200:
            return jsonify({"error": "TTS test failed"}), 500
            
        # Return uncompressed audio with proper headers
        audio_base64 = base64.b64encode(tts_response.content).decode('utf-8')
        
        response = jsonify({
            "audio": audio_base64,
            "text": test_text,
            "compressed": False,
            "size_bytes": len(tts_response.content)
        })
        
        # Set headers to prevent compression
        response.headers['Cache-Control'] = 'no-store'
        response.headers['Content-Encoding'] = 'identity'
        
        return response, 200
        
    except Exception as e:
        return jsonify({"error": f"Test audio failed: {str(e)}"}), 500

@app.route('/api/test-audio-raw', methods=['GET'])
def test_audio_raw():
    """Return raw MP3 audio file for direct testing"""
    try:
        test_text = "This is a direct MP3 file test."
        
        # Use the concurrent TTS function
        tts_response = concurrent_tts_request(test_text)
        
        if tts_response.status_code != 200:
            return jsonify({"error": "TTS test failed"}), 500
        
        # Return raw MP3 file with proper headers for browser compatibility
        response = send_file(
            BytesIO(tts_response.content),
            mimetype='audio/mpeg',
            as_attachment=False,
            download_name='test_audio.mp3'
        )
        
        # Set headers to prevent compression and enable proper audio handling
        response.headers['Accept-Ranges'] = 'bytes'
        response.headers['Content-Length'] = len(tts_response.content)
        response.headers['Cache-Control'] = 'no-store'
        response.headers['Content-Encoding'] = 'identity'
        
        return response
        
    except Exception as e:
        return jsonify({"error": f"Raw audio test failed: {str(e)}"}), 500

@app.route('/api/test-audio-wav', methods=['GET'])  
def test_audio_wav():
    """Test with WAV format that has broader browser support"""
    try:
        test_text = "This is a WAV format test for better browser compatibility."
        
        # Try to get audio in WAV format from ElevenLabs
        tts_url = f"{ELEVENLABS_BASE_URL}/text-to-speech/{VOICE_ID}"
        headers = {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
            "Accept": "audio/wav"
        }
        payload = {
            "text": test_text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.8,
                "style": 0.0,
                "use_speaker_boost": True
            },
            "output_format": "pcm_16000"  # PCM format
        }
        
        tts_response = requests_session.post(tts_url, headers=headers, json=payload, timeout=15)
        
        if tts_response.status_code != 200:
            return jsonify({"error": "WAV TTS test failed"}), 500
        
        # Return as base64 with no compression headers
        audio_base64 = base64.b64encode(tts_response.content).decode('utf-8')
        
        response = jsonify({
            "audio": audio_base64,
            "text": test_text,
            "compressed": False,
            "format": "wav",
            "size_bytes": len(tts_response.content)
        })
        
        # Set headers to prevent compression
        response.headers['Cache-Control'] = 'no-store'
        response.headers['Content-Encoding'] = 'identity'
        
        return response, 200
        
    except Exception as e:
        return jsonify({"error": f"WAV test failed: {str(e)}"}), 500

@app.route('/test', methods=['GET'])
def test_interface():
    """Test interface for the voice AI assistant"""
    return render_template('index.html')

@app.route('/', methods=['GET'])
def root():
    """Simple test interface at root"""
    return render_template('simple_test.html')

if __name__ == '__main__':
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

    # Running on port 3000 as requested by user
    app.run(host="0.0.0.0", port=3000, debug=False)
