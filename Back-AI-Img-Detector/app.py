import os
import logging
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.utils import secure_filename
from ai_detector import AIImageDetector
import traceback

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Create Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Enable CORS for API endpoints
CORS(app)

# Configure file uploads
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'}

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize AI detector
detector = AIImageDetector()

def allowed_file(filename):
    """Check if the uploaded file has an allowed extension."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    """Render the main page with upload form."""
    return render_template('index.html')

@app.route('/api/detect', methods=['POST'])
def detect_ai_image():
    """
    API endpoint for AI image detection.
    
    Expects:
    - POST request with 'image' file in form data
    
    Returns:
    - JSON response with detection results
    """
    try:
        # Check if file is present in request
        if 'image' not in request.files:
            return jsonify({
                'error': 'No image file provided',
                'success': False
            }), 400
        
        file = request.files['image']
        
        # Check if file was actually selected
        if file.filename == '':
            return jsonify({
                'error': 'No file selected',
                'success': False
            }), 400
        
        # Check if file type is allowed
        if not allowed_file(file.filename):
            return jsonify({
                'error': f'File type not supported. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}',
                'success': False
            }), 400
        
        # Process the image
        logging.info(f"Processing image: {file.filename}")
        results = detector.analyze_image(file)
        
        return jsonify({
            'success': True,
            'results': results
        })
        
    except Exception as e:
        logging.error(f"Error processing image: {str(e)}")
        logging.error(traceback.format_exc())
        
        return jsonify({
            'error': f'Failed to process image: {str(e)}',
            'success': False
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'model_loaded': detector.is_model_loaded(),
        'supported_formats': list(ALLOWED_EXTENSIONS)
    })

@app.errorhandler(413)
def too_large(e):
    """Handle file too large error."""
    return jsonify({
        'error': 'File too large. Maximum size is 16MB.',
        'success': False
    }), 413

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
