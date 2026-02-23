# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Turborepo monorepo structure
- Shared types and utilities package
- ESLint configuration for API
- Prettier configuration
- EditorConfig for consistent editor settings
- Git attributes for cross-platform line endings
- Lint-staged configuration
- Commitlint configuration
- MIT License

### Changed

- Updated API package.json scripts to use `type-check` instead of `typecheck`
- Updated API clean script to work cross-platform
- Updated VSCode settings to reflect current project structure

### Fixed

- Script name inconsistencies between package.json and turbo.json
- Missing task configurations in turbo.json (format, lint:fix)
- Cross-platform compatibility for clean scripts

## [0.1.0] - 2025-01-XX

### Added

- Initial release of Farmers Boot application
- Frontend React application with Vite
- Backend API
- Supabase integration
- Authentication system
- Farm management features
