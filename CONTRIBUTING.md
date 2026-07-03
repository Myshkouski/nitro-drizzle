# Contributing to nitro-drizzle

Thank you for your interest in contributing to `nitro-drizzle`! Contributions from the community help make this project better for everyone.

This document outlines the guidelines and steps to help you get started with contributing.

## 🤝 Code of Conduct

By participating in this project, you agree to maintain a respectful, welcoming, and professional environment.

## 🛠️ Development Setup

To set up a local development environment:

1. **Fork and Clone the Repository**

   ```bash
   git clone https://github.com/your-username/nitro-drizzle.git
   cd nitro-drizzle
   ```

2. **Install Dependencies**
   The project uses `pnpm` for managing package dependencies.

   ```bash
   pnpm install
   ```

3. **Explore the Playground**
   The repository includes a playground where you can test your changes inside a Nitro app:
   ```bash
   pnpm playground
   ```

## 🧪 Testing and Quality Control

Before submitting any changes, make sure your code passes all tests and conforms to the project's standards.

- **Typecheck:** `pnpm typecheck`
- **Linting:** `pnpm lint` (using `oxlint`)
- **Formatting:** `pnpm fmt` (using `oxfmt`)
- **Unit Tests:** `pnpm test` (using `vitest`)

To run the production build:

```bash
pnpm build
```

## 🚀 Releasing

The project uses `changelogen` to manage releases and generate the changelog.

1. Create a new release:
   ```bash
   pnpm release
   ```
   This will:
   - Calculate the next version based on conventional commits.
   - Update `CHANGELOG.md` with new changes.
   - Update `package.json` version.
   - Create a git commit and tag.
