# Flying Worker Framework - VS Code Configuration

This directory contains VS Code/Cursor configuration files optimized for the Flying Worker Laravel-like framework for Cloudflare Workers.

## Configuration Files

### `settings.json`
- Framework-specific TypeScript settings
- Biome formatting and linting configuration
- File exclusion patterns (avoiding `package/` directory)
- Path intellisense for the framework structure
- React Router and Hono-specific settings

### `extensions.json`
- Recommended extensions for framework development
- Cloudflare Workers development tools
- React/TypeScript development essentials
- Code quality and productivity tools

### `launch.json`
- Debug configurations for Cloudflare Workers
- React Router debugging setup
- Test runner configuration

### `tasks.json`
- Build and development tasks
- Linting and formatting commands
- Deployment scripts
- Database migration tools

### `snippets.code-snippets`
- Laravel-style code snippets
- Controller, Middleware, and Model templates
- Route definition shortcuts
- React component templates

## Framework Structure Understanding

The configuration is set up to understand the following framework structure:

- `src/` - Core framework code
- `controllers/` - Application controllers (Laravel-style)
- `middlewares/` - Custom middleware
- `config/` - Application configuration
- `routes/` - Route definitions
- `resources/react/` - Frontend React components
- `database/` - Database models and schema
- `events/` & `Listener/` - Event system

## Path Aliases

The following path aliases are configured:

- `@/*` - Root directory
- `@react/*` - React components directory
- `@config/*` - Configuration files
- `@src/*` - Framework source code
- `@controllers/*` - Controllers directory
- `@middlewares/*` - Middlewares directory
- `@database/*` - Database models
- `@events/*` - Event definitions
- `@listeners/*` - Event listeners
- `@routes/*` - Route definitions
- `flying-worker` - Main framework entry point
- `flying-worker/*` - Framework modules

## Excluded Directories

The following directories are excluded from search, file watching, and intellisense:

- `package/` - Internal package build
- `dist/` - Build output
- `node_modules/` - Dependencies
- `.react-router/` - Generated files
- `.wrangler/` - Cloudflare Workers build cache
- `migrations/` - Auto-generated database migrations

## Getting Started

1. Install recommended extensions when prompted
2. The workspace will automatically apply framework-specific settings
3. Use the provided snippets for faster development
4. Access debug configurations through the Run panel
5. Use tasks from the Command Palette (Ctrl+Shift+P → "Tasks: Run Task")

## Laravel-like Development Patterns

This configuration supports Laravel-inspired development patterns:

- Controller-based request handling
- Middleware pipeline architecture
- Event-driven development
- Configuration-based setup
- MVC pattern support

## Cloudflare Workers Optimization

Settings are optimized for Cloudflare Workers development:

- Hono framework integration
- Edge computing considerations
- Cloudflare-specific debugging
- D1 database support
- KV storage integration