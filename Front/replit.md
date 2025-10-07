# AskMira AI Assistant Application

## Overview

This is a full-stack React application built with Express.js backend that appears to be an AI assistant platform called "AskMira". The application features a modern chat interface with multiple interaction modes including text, voice, AI detection, and neural link capabilities. It uses a monorepo structure with shared TypeScript schemas and a component-based architecture built on shadcn/ui.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Development**: tsx for TypeScript execution in development

### Build & Development
- **Monorepo Structure**: Shared code between client and server in `/shared` directory
- **Development Server**: Vite dev server with HMR integrated with Express
- **Production Build**: Separate builds for client (Vite) and server (esbuild)
- **Database Migrations**: Drizzle Kit for schema management

## Key Components

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` for type-safe sharing between client/server
- **Current Schema**: User authentication with username/password
- **Migration Strategy**: Push-based migrations via `drizzle-kit push`

### Authentication System
- **Multi-Provider Authentication**: Twitter OAuth (Passport.js) and Web3 wallet integration (RainbowKit)
- **State Management**: Zustand store with persistent storage for authentication state
- **Session Management**: JWT tokens with HTTP-only cookies for Twitter auth, client-side wallet state
- **Backend Integration**: Express routes for Twitter OAuth callbacks and user session management
- **Frontend Components**: Modal-based authentication UI with dropdown for authenticated users

### UI Components
- **Design System**: shadcn/ui with "new-york" style variant
- **Theme**: Dark mode optimized with custom AskMira brand colors
- **Component Library**: Comprehensive set including forms, dialogs, data display, and navigation
- **Icons**: Lucide React for consistent iconography

### API Architecture  
- **Route Structure**: RESTful API with `/api` prefix
- **Error Handling**: Centralized error middleware with proper HTTP status codes
- **Logging**: Request/response logging for API endpoints
- **Type Safety**: Shared TypeScript types between client and server

## Data Flow

1. **Client Requests**: React components use TanStack Query for server state management
2. **API Layer**: Express routes handle business logic and database operations
3. **Database Operations**: Drizzle ORM provides type-safe database queries
4. **Response Handling**: Standardized JSON responses with proper error handling
5. **State Updates**: React Query automatically updates UI when server state changes

## External Dependencies

### Core Runtime
- **Database**: PostgreSQL via @neondatabase/serverless (prepared for Neon DB)
- **Authentication**: Built-in session management
- **File Upload**: Not currently implemented
- **External APIs**: None currently integrated

### Development Tools
- **Replit Integration**: Configured for Replit development environment
- **Hot Reload**: Vite HMR with Express integration
- **Error Overlay**: Runtime error modal for development
- **Code Mapping**: Source map support for debugging

## Deployment Strategy

### Production Build
- **Client Build**: Vite builds to `dist/public` directory
- **Server Build**: esbuild bundles server to `dist/index.js`
- **Static Assets**: Client build served by Express in production
- **Environment**: NODE_ENV-based configuration

### Database Setup
- **Local Development**: In-memory storage for rapid prototyping
- **Production**: PostgreSQL via DATABASE_URL environment variable
- **Migrations**: Manual push-based migrations using Drizzle Kit
- **Schema Evolution**: Shared TypeScript schemas ensure type safety

### Infrastructure Requirements
- Node.js runtime environment
- PostgreSQL database instance
- Environment variables for database connection
- Static file serving capability for client assets

The application is structured as a modern full-stack TypeScript application with a focus on type safety, developer experience, and scalable architecture patterns. The current implementation provides a solid foundation for an AI assistant platform with room for extending features like real-time chat, external AI integrations, and advanced user management.

## Recent Changes & Checkpoints

### Checkpoint: August 12, 2025 - OpenAI Pre-Analysis Integration Complete
- **OpenAI Text Pre-Analysis**: Added intelligent pre-screening for AI Text Detector using OpenAI API to identify exact matches of known content
- **Three-Step Detection Process**: 
  1. OpenAI checks for exact matches (US Constitution, research articles, etc.)
  2. Returns Human-Written (100% confidence), AI-Generated (100% confidence), or Not Found
  3. Only proceeds to backend API analysis if "Not Found"
- **Backend Integration**: Created `/api/openai/analyze-text` endpoint with GPT-4o model integration
- **Frontend Logic**: Updated `detectAIContent` function to prioritize OpenAI results over backend analysis when exact matches found
- **Performance Optimization**: Reduces unnecessary API calls to expensive detection services for known content
- **Fallback Handling**: Gracefully falls back to normal detection if OpenAI API fails
- **Status**: OpenAI pre-analysis fully integrated and operational

### Checkpoint: August 11, 2025 - Image AI Detector Implementation Complete
- **Image AI Detector Added**: Implemented comprehensive image analysis functionality with support for multiple image formats (JPEG, PNG, GIF, WebP, BMP)
- **API Integration**: Connected to external image detection API endpoint at `https://askmira-backend-imgdetect.replit.app/api/detect`
- **Enhanced Results Display**: Created detailed results interface showing Image Information, Overall Classification, AI Likelihood Score, AI Detection Heatmap, and Detailed Scores by Model
- **Image Preview**: Added real-time image preview functionality for uploaded files with cyberpunk-styled borders and effects
- **File Upload Handling**: Enhanced file upload system to handle different file types based on detector mode (images vs text documents)
- **UI Improvements**: Removed "Coming Soon" overlay for image mode while maintaining it for video/voice modes
- **Error Handling**: Added proper validation and error messages for image file uploads and API responses
- **Status**: Image AI Detector fully operational and ready for user testing

### Previous: August 10, 2025 - Authentication System Implementation Complete
- **Audio Playback Fixed**: Resolved frontend audio decoding issues using proper arrayBuffer handling and MIME type detection
- **Twitter OAuth Integration**: Implemented Passport.js Twitter authentication with Express backend routes
- **RainbowKit Wallet Integration**: Added WalletConnect v2 support with mainnet and Base chain compatibility
- **Authentication Modal**: Created comprehensive auth UI with Twitter and wallet connection options
- **State Management**: Implemented Zustand store for persistent authentication state across sessions
- **Neural Authentication Button**: Updated to show user info dropdown when authenticated, modal when not
- **Environment Configuration**: Created .env.local template with detailed setup instructions
- **Status**: Full authentication system operational, ready for production deployment with API keys

### Previous: August 10, 2025 - Website Optimization & Branding Update Complete
- **API Call Optimization**: Fixed excessive /api/auth/user calls causing server load issues - added 5-second minimum interval, debouncing, and smart caching
- **Authentication Modal**: Made modal box proportionally smaller (sm:max-w-sm), updated X icons to proper social media X icons from react-icons
- **Favicon Implementation**: Added cyberpunk MIRA logo as website favicon in PNG format with proper meta tags
- **SEO & Social Media**: Updated website metadata with comprehensive description "The AI agent for real-time deepfake detection and quality verification across text, image, and video content"
- **Meta Tags**: Implemented Open Graph and Twitter Card tags for enhanced social media sharing appearance
- **Performance**: Eliminated infinite authentication loops that were causing repeated API calls every second
- **Status**: Website performance optimized, branding complete, ready for production deployment