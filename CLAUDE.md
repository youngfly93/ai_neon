# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI NEON'world is a neon-themed file management system for displaying AI-generated artwork. It's built with Node.js/Express backend and vanilla JavaScript frontend, featuring a cyberpunk aesthetic with dynamic neon backgrounds.

## Development Commands

### Running the Application
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start

# Direct server start
node server.js
```

### Docker Commands
```bash
# Build and start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Update and rebuild
docker-compose down && docker-compose up -d --build
```

### Database
- MongoDB connection via `MONGO_URI` environment variable
- Default: `mongodb://localhost:27017/ai_neon_world`

## Architecture Overview

### Backend Structure
- **server.js**: Main Express server with all API routes
- **middleware/auth.js**: JWT authentication and authorization middleware
- **models/User.js**: MongoDB user model with admin roles
- **routes/auth.js**: Authentication routes (login, register, logout)

### Frontend Structure
- **public/**: Static files served by Express
- **public/js/**: Client-side JavaScript modules
  - `main.js`: Homepage functionality
  - `theme.js`: Theme detail page and image viewer
  - `admin.js`: Admin panel management
  - `auth.js`: Authentication handling
  - `background.js`: Dynamic background system
  - `login.js`: Login page functionality

### Authentication System
- JWT-based authentication with cookie storage
- Three middleware types:
  - `verifyToken`: Requires valid login
  - `isAdmin`: Requires admin role
  - `optionalAuth`: Login optional, adds user context if logged in
- Admin panel requires login + admin role
- Image uploads use separate admin key verification (`adminKeyAuth`)

### File Management
- Dynamic theme folders in project root (excluding system folders)
- Multer for file uploads with validation:
  - Images: 10MB limit, JPG/PNG/WebP/GIF only
  - Backgrounds: 15MB limit
- File storage structure:
  ```
  /[theme-name]/           # Theme folders
    *.jpg|png|webp|gif     # Image files
  /public/backgrounds/     # Custom background images
  ```

### Key API Endpoints
```
GET    /api/themes                    # List all themes
POST   /api/themes                    # Create theme (requires login)
DELETE /api/themes/:name              # Delete theme (requires admin)

GET    /api/themes/:name/images       # Get theme images
POST   /api/themes/:name/images       # Upload images (requires admin key)
DELETE /api/themes/:name/images/:img  # Delete image (requires admin key)

GET    /api/backgrounds               # Get all backgrounds
POST   /api/backgrounds               # Upload background (requires admin)
DELETE /api/backgrounds/:name         # Delete background (requires admin)

# Auth routes
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

### Environment Variables
- `PORT`: Server port (default: 3000)
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `ADMIN_KEY`: Admin key for image operations (default: 'ai-neon-admin-2024')

### Background System
- Preset backgrounds: neon-grid, cyber-matrix, starfield, digital-rain
- Custom background upload and management
- Settings persist in localStorage
- Dynamic CSS background switching

## Development Notes

### File Upload Security
- Strict MIME type validation for images only
- File size limits enforced
- Path traversal protection via cleaned filenames
- Admin key required for image operations

### Theme Management
- Themes are directories in project root
- System folders (node_modules, public, etc.) excluded from theme listing
- Theme names sanitized to prevent directory traversal

### User Roles
- Regular users: Can view content, create themes
- Admin users: Full CRUD operations on themes, backgrounds, and images
- Guest mode: Read-only access to public content

### Frontend Framework
- Pure vanilla JavaScript, no framework dependencies
- Responsive design with CSS Grid and Flexbox
- Dynamic neon theme system with CSS animations
- Image lazy loading and full-screen viewer

## Testing and Deployment

No specific test framework configured. For deployment:
- Docker Compose setup available
- PM2 configuration for production
- NGINX reverse proxy configuration in DEPLOY.md
- MongoDB required for user management