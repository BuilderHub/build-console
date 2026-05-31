# BuilderHub Console

Admin console for managing BuilderHub organizations, builder templates, and builders.

Templates define the runtime configuration for builders (BuildKit image, resources, cache backend, etc.). Builders are then created from these templates with a chosen lifecycle mode (sleepy or persistent).

## License

This project is licensed under the [MIT License](LICENSE).

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
- **Templates**: Create and manage reusable builder templates with custom resources (CPU/memory requests & limits), BuildKit image, cache configuration (PVC, S3, or none), and other settings.
- **Builders**: Create builders from templates. Choose lifecycle mode (sleepy for scale-to-zero with preserved cache, or persistent for always-on). Resources are pulled from the selected template for accurate display.
- Builder list with live resource display from templates
- Team member management
- API key management with fine-grained scopes (including `templates:read` / `templates:write`)
- Settings and organization configuration

Note: Ephemeral mode has been removed. Only `sleepy` and `persistent` modes are supported.

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
