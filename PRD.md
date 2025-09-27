# Vasa Bot Product Requirements Document (PRD)

## Overview
Vasa Bot is a modular bot management platform with both backend and frontend components. It enables users to manage events, birthdays, user roles, Twitch live notifications, social media post notifications, and dynamic raid detection/response. The platform is designed for extensibility, security, and ease of use.

## Goals
- Provide a unified interface for managing multiple bot features.
- Ensure scalable, maintainable code structure for future features.
- Enable community contributions with clear documentation and roadmap.

## Features

### Current Features
- **Event Management**: Create, list, and RSVP to events.

### Planned Features

**Birthday Reminders**: Notify users of upcoming birthdays.
**User Role Management**: Assign and manage user roles and permissions.
**Twitch Live Notifications**: Alert users when specified Twitch channels go live.
**Social Media Post Notifications**: Notify users of new posts from selected social media accounts.
**Dynamic Raid Detection/Response**: Detect and respond to raid events in real time.
**Club Role Sign-Up & Event Notifications**: Allow users to sign up for existing "club" roles and receive notifications when events are coming up, scheduled, or starting. Current clubs:
  - Movies (role id: 955258542137434112)
  - Gaming Gang (role id: 979225255560241172)
  - Karaoke Kings (role id: 1036886953636929536)
  - Anime Associates (role id: 942265403005083688)

## UI/UX Roadmap
- Implement a sidebar or top navigation for easy access to all features.
- Each feature will have a dedicated page/component in the frontend.
- Route protection for admin-only features.
- Consistent, intuitive design for all user flows.

## Code Organization
- **Frontend**: Feature-specific pages/components under `src/pages/` and `src/components/`. Shared state via React contexts.
- **Backend**: Modular folders for each feature under `src/`. Separate routes, services, and database logic per feature.
- **Utilities**: Shared logic in `utils/`.

## Contribution Guidelines
- See the roadmap above for planned features.
- Follow modular code practices for new features.
- Update this PRD and the README when adding new features.

## Non-Functional Requirements
- Security, performance, scalability, usability, maintainability.

## Additional Requirements
- Please add further requirements, features, or constraints as needed.
