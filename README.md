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

## Building for Production

### Standard Build

```bash
pnpm build
pnpm start
```

### Docker Images with Nix

Build Docker images for any architecture using pure Nix:

```bash
# Build for current architecture
make docker-build

# Build for specific architectures
make docker-build-amd64    # Build for x86_64
make docker-build-arm64    # Build for ARM64

# Build multi-arch images
make docker-build-multiarch

# Push to registry
make docker-push

# Run locally
make docker-run
```

The Docker images are built entirely with Nix (no Dockerfile required) and support:
- Multi-architecture builds (amd64, arm64)
- Layered images for efficient caching
- Standalone Next.js output
- Production-ready configuration
