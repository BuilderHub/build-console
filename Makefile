.PHONY: help dev build docker-build docker-build-amd64 docker-build-arm64 docker-build-multiarch docker-push docker-run clean

REGISTRY ?= ghcr.io/builderhub
IMAGE_NAME ?= console
TAG ?= latest

help: ## Show this help message
	@echo "BuilderHub Console - Available targets:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## Start development server
	pnpm dev

install: ## Install dependencies
	pnpm install

build: ## Build the Next.js application
	pnpm build

lint: ## Run linter
	pnpm lint

docker-build: ## Build Docker image for current architecture
	@echo "Building Docker image for current architecture..."
	docker buildx build --load -t $(REGISTRY)/$(IMAGE_NAME):$(TAG) .
	@echo "Image built and tagged as $(REGISTRY)/$(IMAGE_NAME):$(TAG)"

docker-build-amd64: ## Build Docker image for linux/amd64
	@echo "Building Docker image for linux/amd64..."
	docker buildx build --load --platform linux/amd64 -t $(REGISTRY)/$(IMAGE_NAME):$(TAG)-amd64 .
	@echo "Image built and tagged as $(REGISTRY)/$(IMAGE_NAME):$(TAG)-amd64"

docker-build-arm64: ## Build Docker image for linux/arm64
	@echo "Building Docker image for linux/arm64..."
	docker buildx build --load --platform linux/arm64 -t $(REGISTRY)/$(IMAGE_NAME):$(TAG)-arm64 .
	@echo "Image built and tagged as $(REGISTRY)/$(IMAGE_NAME):$(TAG)-arm64"

docker-build-multiarch: docker-build-amd64 docker-build-arm64 ## Build multi-arch Docker images
	@echo "Creating multi-arch manifest..."
	@docker manifest rm $(REGISTRY)/$(IMAGE_NAME):$(TAG) 2>/dev/null || true
	@docker manifest create $(REGISTRY)/$(IMAGE_NAME):$(TAG) \
		$(REGISTRY)/$(IMAGE_NAME):$(TAG)-amd64 \
		$(REGISTRY)/$(IMAGE_NAME):$(TAG)-arm64
	@docker manifest annotate $(REGISTRY)/$(IMAGE_NAME):$(TAG) \
		$(REGISTRY)/$(IMAGE_NAME):$(TAG)-amd64 --arch amd64 --os linux
	@docker manifest annotate $(REGISTRY)/$(IMAGE_NAME):$(TAG) \
		$(REGISTRY)/$(IMAGE_NAME):$(TAG)-arm64 --arch arm64 --os linux
	@echo "Multi-arch manifest created: $(REGISTRY)/$(IMAGE_NAME):$(TAG)"

docker-push: ## Push Docker images and manifest to registry
	@echo "Pushing images to registry..."
	@docker push $(REGISTRY)/$(IMAGE_NAME):$(TAG)-amd64
	@docker push $(REGISTRY)/$(IMAGE_NAME):$(TAG)-arm64
	@docker manifest push $(REGISTRY)/$(IMAGE_NAME):$(TAG)
	@echo "All images and manifest pushed successfully"

docker-run: ## Run the Docker container locally
	@docker run -p 3001:3001 $(REGISTRY)/$(IMAGE_NAME):$(TAG)

docker-inspect: ## Inspect the built Docker image
	@docker inspect $(REGISTRY)/$(IMAGE_NAME):$(TAG)

clean: ## Clean build artifacts
	rm -rf .next
	rm -rf node_modules

nix-build: ## Build the application using Nix
	nix build

nix-shell: ## Enter Nix development shell
	nix develop

update-deps: ## Update pnpm dependencies
	pnpm update

flake-update: ## Update Nix flake inputs
	nix flake update
