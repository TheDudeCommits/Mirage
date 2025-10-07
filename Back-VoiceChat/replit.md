# Voice AI Assistant

## Overview

This is an optimized Flask-based voice AI assistant that processes voice input through a high-performance speech-to-speech pipeline. The application accepts audio files, transcribes them using OpenAI's Whisper, generates responses with a custom OpenAI Assistant, and converts the responses back to speech using ElevenLabs text-to-speech. It returns both compressed audio response and text for subtitle functionality. The system is designed as a RESTful API service optimized for minimal latency and maximum throughput.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Framework
- **Flask** serves as the lightweight web framework for the REST API
- **CORS** is enabled to support cross-origin requests from frontend clients
- The application follows a simple request-response pattern with a single main endpoint

### AI Pipeline Architecture
The voice processing follows a three-step pipeline:
1. **Speech-to-Text**: OpenAI Whisper API transcribes uploaded audio files
2. **Text Generation**: Custom OpenAI Assistant (ID: asst_c0LRWpvZJ04MimV8SUgLYJje) processes the transcribed text and generates responses
3. **Text-to-Speech**: ElevenLabs API converts the AI response back to speech

### Performance Optimizations
- **In-Memory Processing**: Audio streams directly to APIs without temporary files
- **Concurrent Processing**: Parallel execution of TTS requests using ThreadPoolExecutor
- **Connection Pooling**: Reusable HTTP connections with keep-alive for API calls
- **Exponential Backoff**: Smart polling (0.1s, 0.2s, 0.5s, 1s, 2s) instead of fixed 1s intervals
- **No Audio Compression**: Raw audio passthrough to prevent browser decoding issues
- **Reduced Logging**: Production-optimized logging (WARNING level) for better performance
- **Audio-Specific Headers**: Cache-Control: no-store and Content-Encoding: identity for audio endpoints

### Error Handling and Monitoring
- Timeout handling with shorter limits to prevent hanging requests
- Retry strategies with automatic backoff for failed API calls
- Structured error responses with minimal performance overhead
- Health check endpoints for system monitoring

### Configuration Management
- Environment variable-based configuration for API keys
- Optimized OpenAI client with 30s timeout limits
- Connection pooling with 10 connections and 20 max pool size
- Regional API endpoint optimization for ElevenLabs

## External Dependencies

### AI Services
- **OpenAI API**: Provides Whisper for speech transcription and custom Assistant (asst_c0LRWpvZJ04MimV8SUgLYJje) for text generation
- **ElevenLabs API**: Handles text-to-speech conversion with voice ID "aEO01A4wXwd1O8GPgGlF"

### Python Libraries
- **Flask**: Web framework and HTTP request handling
- **OpenAI**: Official OpenAI Python client library
- **Requests**: HTTP client for external API calls
- **Flask-CORS**: Cross-origin resource sharing support

### Environment Variables
- `OPENAI_API_KEY`: Authentication for OpenAI services
- `ELEVENLABS_API_KEY`: Authentication for ElevenLabs text-to-speech service

### Runtime Configuration
- Server runs on host 0.0.0.0 port 5000 via Replit workflow (user requested port 3000 but workflow configuration uses 5000)
- Debug mode enabled for development environment  
- Temporary file system storage for audio processing
- Automatic file cleanup after request processing