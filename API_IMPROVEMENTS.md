# Backend Improvements - API v2.0

This document outlines the backend improvements implemented on August 10, 2026.

## Changes Made

### 1. Centralized CORS & Middleware
- Created `middleware.ts` with reusable CORS and request validation utilities
- Eliminated duplicate CORS headers across all endpoints
- Provides consistent response headers and security settings

**Benefits:**
- Single source of truth for CORS configuration
- Easier to update security headers across all endpoints
- Reduced code duplication

### 2. Error Handling Standardization
- Created `errors.ts` with `ApiError` class for consistent error handling
- Defined `ErrorCodes` enum with standardized error codes
- Implemented `sendError()` function for uniform error responses

**Response Format:**
```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "message": "Additional context (optional)"
}
```

**Error Codes:**
- `INVALID_METHOD` - HTTP method not allowed
- `INVALID_INPUT` - Invalid input data
- `MISSING_PARAM` - Required parameter missing
- `TRANSCRIPTION_FAILED` - Transcription API error
- `CHAT_FAILED` - Chat API error
- `TTS_FAILED` - Text-to-speech API error
- `SUMMARIZE_FAILED` - Summarization API error
- `AUTH_FAILED` - Authentication error
- `INTERNAL_ERROR` - Server error

### 3. Fixed Module System
- Converted all endpoints from CommonJS (`require`) to ES Modules (`import`)
- Updated `package.json` to use `"type": "module"`
- All endpoints now use modern ESM syntax for better tree-shaking and Node.js compatibility

**Before:**
```typescript
const { readFileSync } = require('fs')
module.exports = async function handler(req: any, res: any) { ... }
```

**After:**
```typescript
import { readFileSync } from 'fs'
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> { ... }
```

### 4. Improved Temp File Handling
- Created `tempFile.ts` with utilities for safer temporary file management
- Implemented `withTempFile()` wrapper for automatic cleanup
- Generates unique temp file names with timestamps and random suffixes

**Features:**
- Automatic cleanup even if errors occur
- Guaranteed file deletion via finally block
- Unique file naming to prevent conflicts

### 5. Unified API Router
- Consolidated all endpoints into a single `index.ts` router
- Reduces serverless function count for Vercel Hobby plan compatibility
- Internal routing based on URL path
- Maintains backwards compatibility with all existing endpoints

**Available Routes:**
- `POST /api/chat` - Chat with English coach
- `POST /api/transcribe` - Transcribe audio to text
- `POST /api/summarize` - Summarize conversation
- `POST /api/tts` - Text-to-speech synthesis
- `POST /api/login` - User authentication

**Routing:** All routes use internal path matching in `index.ts`:
- `/api/*` -> routes to appropriate handler based on path
- Single `index.ts` file handles all endpoint logic
- Reduces function count: 5 endpoints in 1 function

### 6. Type Safety
- Created `types.ts` with interfaces for all request/response types
- Proper TypeScript types for request and response handlers
- Uses `VercelRequest` and `VercelResponse` types from `@vercel/node`

**Interfaces:**
- `ChatRequest` / `ChatResponse`
- `TranscribeRequest` / `TranscribeResponse`
- `SummarizeRequest` / `SummarizeResponse`
- `TTSRequest` / `TTSResponse`
- `ApiErrorResponse`

### 7. Environment Variable Improvements
- Updated `.env.example` with new authentication variables
- Login endpoint now uses `AUTH_USERNAME` and `AUTH_PASSWORD` from env vars
- Removed hardcoded credentials
- Added validation for required environment variables in handlers

**New Env Vars:**
```
AUTH_USERNAME=admin
AUTH_PASSWORD=your_secure_password_here
```

### 8. Request Validation
- Added `validateNonEmpty()` for string validation
- Added `validateRequiredFields()` for object property validation
- Provides consistent validation error messages

## File Structure

```
api/
├── index.ts                    # Unified API router with all endpoints
├── middleware.ts               # Centralized CORS and validation
├── errors.ts                   # Error handling utilities
├── types.ts                    # TypeScript interfaces
├── tempFile.ts                 # Temporary file utilities
├── dev.ts                      # Local development server (for development only)
└── tsconfig.json               # TypeScript configuration
```

**Key Design:**
- Single `index.ts` consolidates all 5 endpoint handlers
- Internal routing based on URL path matching
- Reduces serverless function count for Vercel Hobby plan
- Cleaner deployment and easier maintenance

## Migration Guide

### No Breaking Changes
All existing endpoints continue to work as before:
- `POST /api/chat` - Still functional
- `POST /api/transcribe` - Still functional
- `POST /api/summarize` - Still functional
- `POST /api/tts` - Still functional
- `POST /api/login` - Still functional

The internal routing is transparent to clients. All requests are routed through the unified `index.ts` handler based on URL path matching.

## Environment Variables Required

```bash
# Core API Keys
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...

# Authentication
AUTH_USERNAME=admin
AUTH_PASSWORD=secure-password

# Frontend (for dev server)
VITE_ID=admin
VITE_PASSWORD=secure-password

# Frontend Config
VITE_API_URL=https://langcoach.vercel.app
```

## Testing

To verify the improvements work:

```bash
# Type checking
npm run type-check

# Local development
npm run dev  # This will start both client and server

# Linting
npm run lint
```

## Future Improvements

Now that the infrastructure is in place, consider these next steps:

1. **Request Validation with Zod** - Add schema validation for all endpoints
2. **Rate Limiting** - Implement per-user/IP rate limits using Vercel KV
3. **Model Configuration** - Move hardcoded model names to environment variables
4. **Structured Logging** - Add pino or winston for production logging
5. **Caching** - Implement caching for repeated requests using Vercel KV
6. **API Documentation** - Create OpenAPI spec for the API
7. **Monitoring** - Add Sentry or similar for error tracking

## Version History

- **v2.0.0** (2026-08-10) - Major refactor with centralized middleware, ESM conversion, and API versioning
- **v1.0.0** - Initial implementation with basic endpoints
