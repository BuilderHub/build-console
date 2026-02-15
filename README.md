# BuilderHub Console

Admin console for managing BuilderHub organizations, builders, and infrastructure.

## Development

This project uses Nix flakes for dependency management.

### Getting Started

1. **Enter the development environment:**

   ```bash
   nix develop
   ```

   Or with direnv:

   ```bash
   direnv allow
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Start the development server:**

   ```bash
   pnpm dev
   ```

4. **Open your browser:**

   Navigate to [http://localhost:3001](http://localhost:3001)

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icons
- **Recharts** - Data visualization
- **Nix Flakes** - Reproducible development environment

## Features

- Organization management
- Builder CRUD operations
- Builder configuration (size, cache, regions)
- Usage analytics and monitoring
- Team member management
- API key management
