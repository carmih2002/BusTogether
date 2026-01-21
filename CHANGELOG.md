# Changelog

All notable changes to BusTogether will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-21

### Added
- Initial release
- Anonymous real-time chat system for bus passengers
- QR code scanning for joining chat sessions
- Time-based automatic chat opening/closing
- Admin dashboard for managing buses and schedules
- Automatic moderation with word filtering
- Report system for inappropriate messages
- RTL support for Hebrew interface
- In-memory data storage (privacy by design)

### Features
- **Passenger Interface**: Simple web chat with nickname selection
- **Admin Dashboard**: Full control over buses, schedules, and active chats
- **Real-time Communication**: Socket.IO based WebSocket connections
- **Privacy First**: No personal data stored, automatic cleanup on chat end
- **Moderation**: Profanity filter, spam detection, user reporting

---

## Version Format

- **MAJOR.MINOR.PATCH**
  - MAJOR: Breaking changes
  - MINOR: New features (backward compatible)
  - PATCH: Bug fixes (backward compatible)
