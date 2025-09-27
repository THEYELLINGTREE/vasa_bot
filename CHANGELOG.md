# Changelog

## [1.0.0] - 2025-09-27

### Changed
- Removed all references to "Apollo" throughout the codebase
- Updated descriptions to reference "modern event management application" instead
- Rebranded as generic Discord event management solution
- Updated README.md with new branding and descriptions
- Modified command descriptions to be more generic
- Updated code comments to remove specific references

### Added
- Comprehensive .gitignore file for Node.js, React, and Discord bot project
- Added support for both npm and yarn package managers in .gitignore
- Database file exclusions to prevent accidental commits of user data
- Environment file exclusions to protect sensitive configuration

### Technical Details
- All functionality remains identical
- No breaking changes to API or bot commands
- Maintained all original features and capabilities
- Updated package.json descriptions to reflect new branding

### Files Modified
- README.md - Complete rewrite removing Apollo references
- package.json - Updated description
- backend/src/commands/event.js - Updated command description
- backend/src/services/SchedulerService.js - Updated code comments
- frontend/src/pages/Settings.jsx - Generic permission descriptions
- Added .gitignore - Comprehensive exclusion rules
- Added CHANGELOG.md - This file

### Migration Notes
- No migration required for existing installations
- All existing data and configurations remain compatible
- Bot commands and functionality unchanged
- Web interface remains fully functional