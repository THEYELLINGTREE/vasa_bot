# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Architecture Overview

VASA Bot is a modern Discord event management platform with a clean separation between Discord bot functionality and web management interface. The project follows a dual-server architecture:

### Core Components

**Backend (`backend/src/`)** - Discord.js bot with Express API
- **Discord Bot Engine** (`index.js`) - Main bot entry point with command loading, interaction handling, and service initialization
- **Commands System** (`commands/`) - Modular slash command implementations with DM-based event creation flow
- **Permission System** (`utils/permissions.js`) - Hierarchical permission checking (Server Management > User-specific > Role-specific > Guild defaults)
- **Scheduler Service** (`services/SchedulerService.js`) - Cron-based event reminder system with DM and channel notifications
- **Database Layer** (`database/init.js`) - SQLite with comprehensive schema for events, RSVPs, permissions, and configuration
- **REST API** (`routes/`) - Express endpoints for web interface integration with Discord OAuth authentication

**Frontend (`frontend/src/`)** - React management dashboard
- **Authentication Flow** (`contexts/AuthContext.jsx`) - Discord OAuth integration
- **Component Architecture** - Modern React with functional components and hooks
- **Page Structure** - Dashboard, Events, Settings, Analytics with protected routes

### Key Architectural Patterns

**Event Creation Flow**: Discord slash command → DM interaction → Modal form → Database storage → Channel posting with RSVP buttons
**Permission Model**: Hierarchical system where Manage Server permission overrides all, then user-specific settings, then role permissions, finally guild defaults
**Reminder System**: Cron-based scheduler that sends both DM reminders to attendees and public channel notifications
**Data Flow**: SQLite database serves both Discord bot operations and web dashboard through shared backend

## Development Commands

### Environment Setup
```bash
# Install all dependencies (root, backend, frontend)
npm run install:all

# Configure backend environment
cd backend
cp .env.example .env
# Edit .env with Discord bot token and application ID
```

### Development Workflow
```bash
# Start both services in development mode
npm run dev

# Or start individually:
npm run dev:backend    # Starts Discord bot + API server on port 3001
npm run dev:frontend   # Starts Vite dev server on port 5173
```

### Backend Development
```bash
cd backend
npm run dev           # Starts bot with nodemon for hot reload
npm start            # Production mode
npm run db:migrate   # Manual database schema updates
```

### Frontend Development
```bash
cd frontend
npm run dev          # Vite dev server with hot reload
npm run build        # Production build
npm run preview      # Preview production build
```

### Production Deployment
```bash
npm run build        # Builds frontend for production
npm start           # Starts backend in production mode
```

## Database Schema

The SQLite database (`backend/data/vasa_bot.db`) contains:
- **events**: Event details with creator, location, restrictions, reminder status
- **event_rsvps**: RSVP tracking with user ID, status (attending/maybe/not_attending), timestamps
- **guild_permissions**: Granular role/user permissions for event creation
- **bot_config**: Per-guild configuration (reminder timing, timezone, creation permissions)
- **user_preferences**: Individual user notification and timezone settings
- **reminders**: Custom reminder scheduling system

## Critical Development Context

### Discord Interaction Patterns
- Bot uses DM-based event creation to avoid channel clutter
- Modal forms collect event details with validation
- Button interactions handle RSVP responses with real-time embed updates
- Permission checks occur at multiple levels for security

### API-Only Mode
The backend gracefully handles missing Discord credentials by running in "API-only mode" - the web interface remains functional while Discord features are disabled.

### Frontend Architecture
- Uses React Router for navigation with protected routes
- AuthContext manages Discord OAuth state
- All API calls go through configured axios instance
- NASA Mission Control theme throughout the UI

### Development Considerations
- Backend uses ES modules (type: "module" in package.json)
- Database operations use callback-style with Promise wrappers for async/await compatibility
- Scheduler service runs independently and handles graceful shutdown
- Frontend assumes backend API availability at localhost:3001 in development

### Testing Event Creation
1. Ensure Discord bot token is configured in `backend/.env`
2. Bot must be added to a Discord server with appropriate permissions
3. Use `/event` command in Discord to test the full DM → Modal → Database → Channel flow
4. Web interface at localhost:5173 provides management capabilities

### Key Files for Modifications
- **Command Logic**: `backend/src/commands/event.js` - Core event creation and RSVP handling
- **Permissions**: `backend/src/utils/permissions.js` - All permission checking logic
- **Scheduling**: `backend/src/services/SchedulerService.js` - Reminder and notification system
- **Database Schema**: `backend/src/database/init.js` - Table definitions and initialization
- **Frontend Pages**: `frontend/src/pages/` - Main UI components for dashboard and management

## Environment Variables

Backend requires:
- `DISCORD_TOKEN` - Bot token from Discord Developer Portal
- `DISCORD_CLIENT_ID` - Application ID from Discord Developer Portal
- `DISCORD_CLIENT_SECRET` - OAuth secret for web authentication
- `JWT_SECRET` - For session management
- `NODE_ENV` - 'development' or 'production'
- `PORT` - API server port (default: 3001)

## WARP Development Rules

### Discord.js Best Practices
- Always use interaction.deferReply() for operations that might take longer than 3 seconds
- Handle Discord API rate limits gracefully with proper error catching
- Use ephemeral replies for error messages and confirmations to reduce channel clutter
- Validate user permissions before executing commands, not just during registration
- Always check if channels/guilds exist before attempting operations
- Use Discord's built-in timestamp formatting: `<t:${timestamp}:F>` for consistent date display
- Implement proper cleanup in button/modal handlers to prevent memory leaks
- Use Collection caching judiciously - clear old data periodically

### SQLite & Database Best Practices
- Always use prepared statements to prevent SQL injection
- Wrap database operations in Promise constructors for proper async/await support
- Use transactions for multi-table operations to ensure data consistency
- Always call stmt.finalize() after prepared statement execution
- Use foreign keys with CASCADE for data integrity (already implemented)
- Index frequently queried columns (user_id, guild_id, event_id)
- Handle database connection errors gracefully and attempt reconnection

### Node.js/Express API Best Practices
- Use helmet middleware for security headers (already implemented)
- Implement rate limiting on all public endpoints (already implemented)
- Validate all input data with proper sanitization
- Use environment-based CORS configuration (already implemented)
- Always use HTTPS in production environments
- Implement proper error logging with structured data
- Use JWT tokens with reasonable expiration times
- Handle graceful shutdown signals (SIGINT/SIGTERM)

### React Frontend Best Practices
- Use functional components with hooks instead of class components
- Implement proper loading states for all API calls
- Use React.memo() for expensive component renders
- Implement error boundaries for graceful error handling
- Use proper key props in lists to prevent React reconciliation issues
- Keep component state minimal - lift state up when needed
- Use custom hooks for reusable stateful logic
- Implement proper cleanup in useEffect hooks

### Authentication & Security
- Never store sensitive data in localStorage - use httpOnly cookies
- Validate JWT tokens on every API request
- Implement CSRF protection for state-changing operations
- Use Discord OAuth scopes minimally (only what's needed)
- Sanitize all user inputs before database storage
- Log security-relevant events (failed auth, permission changes)
- Implement session timeout and refresh token rotation

### Error Handling & Logging
- Log all errors with context (user ID, guild ID, action attempted)
- Use structured logging (JSON format) for better parsing
- Implement different log levels (error, warn, info, debug)
- Never expose internal error details to users
- Use error boundaries in React to catch rendering errors
- Implement retry logic for transient failures (Discord API, database locks)
- Store error logs with timestamps and relevant metadata

### Performance & Scalability
- Use database connection pooling for high-load scenarios
- Implement caching for frequently accessed data (guild configs, permissions)
- Use Discord's gateway compression and proper intents
- Minimize bundle size with code splitting in React
- Use lazy loading for React components when appropriate
- Implement proper database indexing strategy
- Monitor memory usage and implement cleanup routines

### Code Organization & Maintenance
- Keep command files focused on single responsibilities
- Use consistent error message formatting across the application
- Implement proper TypeScript if migrating from JavaScript
- Use consistent naming conventions (camelCase for JS, snake_case for DB)
- Document complex business logic with inline comments
- Use environment variables for all configuration
- Keep dependency versions updated and audit regularly

### Testing & Quality Assurance
- Test Discord commands in a development server before production
- Implement unit tests for utility functions (permissions, date parsing)
- Test database migrations on copies of production data
- Use integration tests for API endpoints
- Test React components with proper mocking of API calls
- Validate environment configuration on startup
- Test bot behavior with various Discord permission levels

### Deployment & Monitoring
- Use PM2 or similar for process management in production
- Implement health check endpoints (already implemented)
- Monitor database file sizes and implement rotation if needed
- Set up alerts for Discord API rate limit warnings
- Monitor memory usage and restart processes if needed
- Back up SQLite database regularly
- Use environment-specific configuration files
- Implement rolling deployments to minimize downtime
