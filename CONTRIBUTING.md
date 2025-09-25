# Contributing to SpeedRunLisk

Thank you for your interest in contributing to SpeedRunLisk! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (>= v22.18.0)
- [Yarn](https://yarnpkg.com/) package manager
- [Git](https://git-scm.com/)
- [Docker Engine](https://docs.docker.com/engine/install/)

### Development Setup

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/SpeedRunLisk.git
   cd SpeedRunLisk
   ```

3. Install dependencies:
   ```bash
   yarn install
   ```

4. Start the development environment:
   ```bash
   docker compose up -d          # Start PostgreSQL database
   yarn drizzle-kit migrate      # Run database migrations
   yarn db:seed                  # Seed database with initial data
   yarn start                    # Start development server
   ```

## Development Workflow

### Code Style and Quality

- Follow the existing code style and conventions
- Run linting before committing:
  ```bash
  yarn lint                     # Run ESLint
  yarn format                   # Format with Prettier
  yarn next:check-types         # TypeScript type checking
  ```

### Database Changes

When modifying the database schema:

1. Update the schema in `packages/nextjs/services/database/config/schema.ts`
2. Generate migration: `yarn drizzle-kit generate`
3. Apply migration: `yarn drizzle-kit migrate`
4. Commit both schema changes and migration files

### Testing

Ensure your changes don't break existing functionality:

```bash
# NextJS tests
yarn workspace @speedrun-lisk/nextjs test

# Smart contract tests
yarn hardhat:test
```

### Commit Guidelines

- Use clear, descriptive commit messages
- Follow conventional commit format when possible
- Keep commits focused and atomic
- Reference related issues in commit messages

### Pull Request Process

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them
3. Push to your fork and create a pull request
4. Ensure all CI checks pass
5. Request review from maintainers

## Project Structure

- `packages/nextjs/` - Frontend Next.js application
- `packages/hardhat/` - Smart contract development environment
- Database schema: `packages/nextjs/services/database/config/schema.ts`
- Database repositories: `packages/nextjs/services/database/repositories/`

## Areas for Contribution

### Frontend Development
- UI/UX improvements
- New challenge types or features
- Performance optimizations
- Accessibility improvements

### Backend Development
- Database optimizations
- API enhancements
- Authentication improvements
- New integrations

### Smart Contracts
- Challenge contract improvements
- Gas optimizations
- Security enhancements
- Lisk-specific features

### Documentation
- Code documentation
- User guides
- Development tutorials
- API documentation

### Testing
- Unit tests
- Integration tests
- End-to-end tests
- Performance tests

## Code of Conduct

This project follows a Code of Conduct to ensure a welcoming environment for all contributors. Please be respectful and professional in all interactions.

## Getting Help

- Check existing [issues](https://github.com/scaffold-eth/SpeedRunLisk/issues) and [discussions](https://github.com/scaffold-eth/SpeedRunLisk/discussions)
- Join our community channels for support
- Review the [README.md](./README.md) for setup instructions
- Check [CLAUDE.md](./CLAUDE.md) for detailed development guidelines

## Reporting Issues

When reporting bugs or requesting features:

1. Search existing issues first
2. Use the appropriate issue template
3. Provide detailed reproduction steps
4. Include relevant system information
5. Add logs or screenshots when helpful

## Security

If you discover a security vulnerability, please email the maintainers privately rather than creating a public issue.

## License

By contributing to SpeedRunLisk, you agree that your contributions will be licensed under the same license as the project.

Thank you for contributing to SpeedRunLisk! 🚀