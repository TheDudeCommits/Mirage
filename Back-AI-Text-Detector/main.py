from flask import Flask, request, jsonify
from flask_cors import CORS
from model import DesklibAIDetectionModel, predict_single_text
from transformers import AutoTokenizer
import torch
import os
from docx import Document
from dotenv import load_dotenv
load_dotenv()
app = Flask(__name__, static_folder=".", static_url_path="")
CORS(app)

# Global variables for lazy loading
tokenizer = None
model = None
device = None

def load_model():
    global tokenizer, model, device
    if model is None:
        MODEL_DIR = "desklib/ai-text-detector-v1.01"
        tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
        model = DesklibAIDetectionModel.from_pretrained(MODEL_DIR)
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model.to(device)
    return model, tokenizer, device

@app.route("/")
def index():
    return app.send_static_file("index.html")

@app.route("/api/detect", methods=["POST"])
def detect_ai_text():
    text = ""

    if "file" in request.files:
        doc_file = request.files["file"]
        if doc_file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        doc = Document(doc_file)
        text = "\n".join([p.text for p in doc.paragraphs])
    elif request.is_json and "text" in request.json:
        text = request.json["text"]
    else:
        return jsonify({"error": "No text or file provided"}), 400

    if not text or text.strip() == "":
        return jsonify({"error": "Empty text provided"}), 400

    try:
        model, tokenizer, device = load_model()
        prob, label = predict_single_text(text, model, tokenizer, device)
        return jsonify({
            "probability": round(prob * 100, 2),
            "label": "AI-Generated" if label == 1 else "Human-Written"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    app.run(host="0.0.0.0", port=3000)
