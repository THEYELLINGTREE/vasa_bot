# Vasa Bot - Discord Event Management Bot

A comprehensive Discord bot featuring advanced event management, RSVP tracking, and a modern web management interface.

## 🎯 Features Implemented

### Discord Bot Features
- **✅ Streamlined Event Creation**: DM-based event creation flow with `/event` command
- **✅ Interactive RSVP System**: Three-button RSVP system (Attending, Maybe, Not Attending)
- **✅ Automated Reminders**: 15-minute DM reminders to attendees + channel notifications
- **✅ Permission Management**: Role-based permissions with `/settings` commands
- **✅ Event Management**: View, edit, delete events with proper permissions
- **✅ RSVP Tracking**: Complete RSVP management with `/rsvp` commands

### Advanced Features
- **✅ Database Integration**: SQLite with comprehensive schema for events, RSVPs, permissions
- **✅ Scheduler Service**: Automated reminder system with cron jobs
- **✅ Permission System**: Granular role/user permissions for fine-grained control
- **✅ Event Restrictions**: Support for max attendees, role restrictions, signup controls
- **✅ Real-time Updates**: Event embeds update with RSVP counts

### Web Management Interface
- **✅ Modern React Frontend**: Clean, responsive UI with React + Vite
- **✅ Dashboard**: Overview with statistics, recent events, quick actions
- **✅ Event Management**: Complete CRUD operations for events
- **✅ Analytics**: Visual charts showing RSVP trends, popular event types
- **✅ Settings Panel**: Configure bot permissions, reminders, general settings
- **✅ Real-time Data**: Live integration with Discord bot backend

## 🏗️ Architecture

```
vasa_bot/
├── backend/                 # Discord bot + API server
│   ├── src/
│   │   ├── commands/       # Discord slash commands
│   │   │   ├── event.js    # Main /event command with DM flow
│   │   │   ├── rsvp.js     # RSVP management
│   │   │   └── settings.js # Permission management
│   │   ├── database/       # SQLite database layer
│   │   ├── routes/         # Express API routes
│   │   ├── services/       # Background services (scheduler)
│   │   ├── utils/          # Utilities (permissions manager)
│   │   └── index.js        # Main bot entry point
│   └── package.json
├── frontend/                # React management interface
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Main application pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Events.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── Analytics.jsx
│   │   └── App.jsx
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Discord Bot Token
- Discord Application ID

### Installation

1. **Clone and install dependencies:**
```bash
cd E:\repo\vasa_bot
npm run install:all  # Installs both backend and frontend deps
```

2. **Configure Discord Bot:**
```bash
cd backend
cp .env.example .env
# Edit .env with your Discord credentials
```

3. **Start development servers:**
```bash
# Terminal 1 - Backend (Discord bot + API)
npm run dev:backend

# Terminal 2 - Frontend (React app)
npm run dev:frontend
```

4. **Access the management interface:**
- Web UI: http://localhost:5173
- API: http://localhost:3001

## 🎮 Discord Commands

### Main Commands
- `/event` - Create new event with guided DM flow
- `/rsvp list` - View your RSVPs
- `/rsvp change [event_id] [status]` - Change RSVP status
- `/list-events [limit]` - List upcoming events
- `/settings view` - View bot configuration (Admin)
- `/settings role @role create_event true/false` - Set role permissions (Admin)
- `/settings user @user create_event true/false` - Set user permissions (Admin)
- `/settings general` - Configure general bot settings (Admin)

### Event Creation Flow
1. User runs `/event` command
2. Bot sends DM with "Start Creating Event" button
3. User clicks button → Modal opens with event details form
4. Bot validates input and creates event
5. Event posted in channel with RSVP buttons
6. Users can click ✅ Attending, ❓ Maybe, ❌ Not Attending

## 🔧 Key Features Detail

### Permission System
Vasa Bot features a hierarchical permission system:
1. **Manage Server permission** (always allowed)
2. **User-specific permissions** (highest priority)
3. **Role-specific permissions**
4. **General server settings** (lowest priority)

### Reminder System
- **Timing**: Configurable (default: 15 minutes before event)
- **DM Reminders**: Sent to users who RSVP'd as "Attending" or "Maybe"
- **Channel Reminders**: Public reminder posted in event channel
- **One-time**: Each event gets exactly one reminder

### Database Schema
Comprehensive SQLite database with tables for:
- `events` - Event details with status, location, restrictions
- `event_rsvps` - RSVP tracking with timestamps
- `guild_permissions` - Role/user specific permissions
- `user_preferences` - Individual user settings
- `bot_config` - Per-guild configuration
- `reminders` - Custom reminder scheduling

### Web Management Interface
- **Dashboard**: Real-time statistics and recent activity
- **Events Page**: Full event CRUD with filtering and search
- **Analytics**: Visual charts and insights about event performance
- **Settings**: Complete bot configuration management

## 🎨 UI Screenshots

The web interface features:
- Clean, Discord-inspired design
- Responsive layout for all devices
- Real-time data updates
- Interactive charts and statistics
- Comprehensive event management

## 🔮 Advanced Features

### Event Restrictions (Planned/Implemented)
- Max attendee limits
- Required roles for attendance
- Signup time restrictions
- Event approval workflows

### Analytics & Insights
- Event attendance trends
- Popular event types
- RSVP response rates
- User engagement metrics

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run dev  # Starts bot with nodemon
```

### Frontend Development  
```bash
cd frontend
npm run dev  # Starts Vite dev server
```

### Production Build
```bash
npm run build      # Builds frontend
npm run start      # Starts production backend
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Inspired by modern event management applications
- Built with Discord.js, React, and modern web technologies
- Designed for community event management

---

**Note**: This bot provides comprehensive event management functionality with modern enhancements. All features are built from scratch using industry best practices.
