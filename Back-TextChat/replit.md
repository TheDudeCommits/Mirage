# OpenAI Assistant API Tester

## Overview

This is a Flask-based web application that serves as a testing interface for OpenAI's Assistants API. The application provides a simple web interface where users can send messages that are processed by a specific OpenAI Assistant and display the responses. It's designed as a development tool for testing and experimenting with OpenAI Assistant functionality using the beta Assistants API.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Static Web Interface**: Uses vanilla HTML, CSS, and JavaScript with Bootstrap for styling
- **Single Page Application**: Simple form-based interface with AJAX requests
- **Dark Theme**: Implements Bootstrap dark theme with Font Awesome icons
- **Client-Side Validation**: Basic form validation and error handling in JavaScript

### Backend Architecture
- **Flask Framework**: Lightweight Python web framework for rapid development
- **RESTful API Design**: Single POST endpoint `/chat` for message processing
- **Stateless Architecture**: No session management or user persistence
- **Environment-Based Configuration**: Uses environment variables for sensitive data

### API Structure
- **Single Endpoint**: `/api/text` POST endpoint accepts JSON payload with message field
- **Request Format**: `{"message": "user message"}`
- **Response Format**: `{"reply": "AI response"}` or `{"error": "error message"}`
- **Assistant Integration**: Uses OpenAI's Assistants API with specific assistant ID: `asst_c0LRWpvZJ04MimV8SUgLYJje`
- **Threading Model**: Creates new thread for each request, polls for completion, retrieves assistant response
- **Performance Optimizations**: 
  - Exponential backoff polling (starts at 0.2s, max 2.0s intervals)
  - Limited message retrieval (10 most recent messages)
  - Optimized response parsing with error handling
  - 2-minute timeout protection
- **Error Handling**: Comprehensive validation and error responses with appropriate HTTP status codes

### Security Considerations
- **API Key Management**: OpenAI API key stored as environment variable
- **Input Validation**: JSON payload validation and sanitization
- **CORS Handling**: Standard Flask security practices
- **Secret Key**: Session secret key configurable via environment

## External Dependencies

### Core Dependencies
- **Flask**: Python web framework for HTTP server and routing
- **OpenAI Python SDK**: Official client library for OpenAI API integration
- **Bootstrap 5**: Frontend CSS framework with dark theme variant
- **Font Awesome**: Icon library for UI enhancement

### Environment Variables
- **OPENAI_API_KEY**: Required for OpenAI API authentication
- **SESSION_SECRET**: Optional Flask session security (defaults to development key)

### External Services
- **OpenAI Assistants API**: Primary external service for AI assistant functionality using beta API
- **CDN Resources**: Bootstrap CSS and Font Awesome icons served from CDN

### Runtime Requirements
- **Python Environment**: Requires Python with Flask and OpenAI packages
- **Internet Connectivity**: Required for OpenAI API calls and CDN resources
- **Environment Configuration**: Proper setup of API keys for functionality