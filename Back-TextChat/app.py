import os
import logging
import time
import asyncio
import json
from flask import Flask, request, jsonify, render_template, Response, stream_template
from flask_cors import CORS
from openai import OpenAI, AsyncOpenAI
import threading

# Configure logging for debugging
logging.basicConfig(level=logging.DEBUG)

# Create Flask app with async capabilities
app = Flask(__name__)
CORS(app)  # Enable CORS
session_secret = os.environ.get("SESSION_SECRET")
if not session_secret:
    raise RuntimeError("SESSION_SECRET must be set")
app.secret_key = session_secret

# Initialize both sync and async OpenAI clients for hybrid approach
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    logging.warning("OPENAI_API_KEY not found in environment variables")
    openai_client = None
    async_openai_client = None
else:
    # Initialize both sync and async clients
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
    async_openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)

# Assistant ID
assistant_id = "asst_c0LRWpvZJ04MimV8SUgLYJje"

@app.route('/')
def index():
    """Serve the main page with API testing interface"""
    return render_template('index.html')

@app.route('/api/text', methods=['POST'])
def handle_text():
    """
    Handle text requests and forward them to OpenAI's Assistants API
    Expects JSON payload: {"message": "user message"}
    Returns JSON response: {"reply": "AI response"} or {"error": "error message"}
    """
    try:
        # Check if OpenAI client is available
        if not openai_client:
            return jsonify({"error": "OpenAI API key not configured"}), 500
        
        # Validate request content type
        if not request.is_json:
            return jsonify({"error": "Content-Type must be application/json"}), 400
        
        # Get JSON data from request
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        if "message" not in data:
            return jsonify({"error": "Missing required field: message"}), 400
        
        message = data["message"]
        
        # Validate message content (optimized validation)
        if not isinstance(message, str) or len(message.strip()) == 0:
            return jsonify({"error": "Message must be a non-empty string"}), 400
        
        # Trim message for processing
        message = message.strip()
        
        logging.debug("Received text request")
        
        # Step 1: Create a new thread
        thread = openai_client.beta.threads.create()

        # Step 2: Post user's message to the thread
        openai_client.beta.threads.messages.create(
            thread_id=thread.id,
            role="user",
            content=message
        )

        # Step 3: Run the assistant on the thread
        run = openai_client.beta.threads.runs.create(
            assistant_id=assistant_id,
            thread_id=thread.id
        )

        # Step 4: Poll the run until it completes (optimized polling)
        poll_interval = 0.1  # Ultra-fast initial polling
        max_poll_interval = 2.0  # Maximum polling interval
        timeout = 120  # 2 minute timeout
        start_time = time.time()
        
        while True:
            status = openai_client.beta.threads.runs.retrieve(
                thread_id=thread.id,
                run_id=run.id
            )
            if status.status == "completed":
                break
            elif status.status == "failed":
                return jsonify({"error": "Assistant run failed"}), 500
            elif status.status in ["cancelled", "expired"]:
                return jsonify({"error": f"Assistant run {status.status}"}), 500
            
            # Check for timeout
            if time.time() - start_time > timeout:
                return jsonify({"error": "Assistant response timeout"}), 504
            
            # Fast polling with exponential backoff
            time.sleep(poll_interval)
            poll_interval = min(poll_interval * 1.5, max_poll_interval)

        # Step 5: Retrieve messages (optimized retrieval)
        messages = openai_client.beta.threads.messages.list(
            thread_id=thread.id,
            limit=10  # Limit to recent messages for faster retrieval
        )
        
        # Find the assistant's response (optimized search)
        assistant_message = "No response."
        for msg in messages.data:
            if msg.role == "assistant":
                # Get the first text content block more efficiently
                try:
                    for content_block in msg.content:
                        if hasattr(content_block, 'text') and content_block.text:
                            assistant_message = content_block.text.value
                            break
                    break
                except (AttributeError, IndexError):
                    continue
        
        logging.debug("Assistant response received")
        
        return jsonify({"reply": assistant_message})
        
    except Exception as exc:
        logging.exception("Assistant request failed")
        
        # Handle specific OpenAI errors
        if "openai" in str(type(exc)).lower():
            error_text = str(exc).lower()
            if "rate_limit" in error_text:
                return jsonify({"error": "Rate limit exceeded. Please try again later."}), 429
            elif "invalid_api_key" in error_text:
                return jsonify({"error": "Invalid OpenAI API key"}), 401
            elif "insufficient_quota" in error_text:
                return jsonify({"error": "OpenAI API quota exceeded"}), 402
            else:
                return jsonify({"error": "OpenAI request failed"}), 500
        
        # Generic error handling
        return jsonify({"error": "Internal server error occurred"}), 500

@app.route('/api/text/stream', methods=['POST'])
def handle_text_stream():
    """
    Handle text requests with Server-Sent Events streaming
    Provides real-time status updates during processing
    """
    # Get request data outside the generator
    if not openai_client:
        return Response(
            f"data: {json.dumps({'error': 'OpenAI API key not configured'})}\n\n",
            content_type='text/event-stream'
        )

    data = request.get_json()
    if not data or "message" not in data:
        return Response(
            f"data: {json.dumps({'error': 'Missing required field: message'})}\n\n",
            content_type='text/event-stream'
        )

    message = data["message"]
    if not isinstance(message, str) or len(message.strip()) == 0:
        return Response(
            f"data: {json.dumps({'error': 'Message must be a non-empty string'})}\n\n",
            content_type='text/event-stream'
        )

    message = message.strip()
    
    def generate_stream():
        try:
            
            # Send status updates during processing
            yield f"data: {json.dumps({'status': 'creating_thread', 'message': 'Creating conversation thread...'})}\n\n"
            
            # Step 1: Create thread
            thread = openai_client.beta.threads.create()
            
            yield f"data: {json.dumps({'status': 'sending_message', 'message': 'Sending your message...'})}\n\n"
            
            # Step 2: Send message
            openai_client.beta.threads.messages.create(
                thread_id=thread.id,
                role="user",
                content=message
            )
            
            yield f"data: {json.dumps({'status': 'starting_assistant', 'message': 'Starting AI assistant...'})}\n\n"
            
            # Step 3: Start run
            run = openai_client.beta.threads.runs.create(
                assistant_id=assistant_id,
                thread_id=thread.id
            )
            
            yield f"data: {json.dumps({'status': 'processing', 'message': 'AI is thinking...'})}\n\n"
            
            # Step 4: Poll with streaming updates
            poll_interval = 0.1  # Ultra-fast initial polling
            max_poll_interval = 2.0
            timeout = 120
            start_time = time.time()
            
            while True:
                status = openai_client.beta.threads.runs.retrieve(
                    thread_id=thread.id,
                    run_id=run.id
                )
                
                if status.status == "completed":
                    yield f"data: {json.dumps({'status': 'retrieving', 'message': 'Getting response...'})}\n\n"
                    break
                elif status.status == "failed":
                    yield f"data: {json.dumps({'error': 'Assistant run failed'})}\n\n"
                    return
                elif status.status in ["cancelled", "expired"]:
                    yield f"data: {json.dumps({'error': f'Assistant run {status.status}'})}\n\n"
                    return
                
                # Check timeout
                if time.time() - start_time > timeout:
                    yield f"data: {json.dumps({'error': 'Response timeout'})}\n\n"
                    return
                
                # Send periodic status updates
                if poll_interval < 1.0:
                    yield f"data: {json.dumps({'status': 'processing', 'message': 'Still thinking...'})}\n\n"
                
                time.sleep(poll_interval)
                poll_interval = min(poll_interval * 1.5, max_poll_interval)
            
            # Step 5: Get response
            messages = openai_client.beta.threads.messages.list(
                thread_id=thread.id,
                limit=10
            )
            
            assistant_message = "No response."
            for msg in messages.data:
                if msg.role == "assistant":
                    try:
                        for content_block in msg.content:
                            if hasattr(content_block, 'text') and content_block.text:
                                assistant_message = content_block.text.value
                                break
                        break
                    except (AttributeError, IndexError):
                        continue
            
            # Send final response
            yield f"data: {json.dumps({'status': 'complete', 'reply': assistant_message})}\n\n"
            
        except Exception:
            logging.exception("Streaming request failed")
            yield f"data: {json.dumps({'error': 'Server error'})}\n\n"
    
    return Response(generate_stream(), content_type='text/event-stream')

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "openai_configured": openai_client is not None
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
