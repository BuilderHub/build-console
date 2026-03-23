{
  description = "BuilderHub Console - Builder & Organization Management";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    let
      supportedSystems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      
      forAllSystems = nixpkgs.lib.genAttrs supportedSystems;
      
      mkApp = system:
        let
          pkgs = import nixpkgs { inherit system; };
          
          pnpmDeps = pkgs.fetchPnpmDeps {
            pname = "builderhub-console";
            src = ./.;
            hash = "sha256-F94jlwqXkB8tDcd23ZOemg8kbOJG6g+IBrpvWU/waho=";
            fetcherVersion = 3;
          };
        in
        pkgs.stdenv.mkDerivation {
          pname = "builderhub-console";
          version = "0.1.0";
          
          src = ./.;
          
          nativeBuildInputs = [ 
            pkgs.nodejs_22 
            pkgs.nodePackages.pnpm
            pkgs.pnpmConfigHook
          ];
          
          pnpmDeps = pnpmDeps;
          
          buildPhase = ''
            pnpm run build
          '';
          
          installPhase = ''
            mkdir -p $out
            
            # Copy the complete build
            cp -r .next $out/
            cp -r node_modules $out/
            cp package.json $out/
            
            # Copy public files if they exist
            if [ -d public ]; then
              cp -r public $out/
            fi
            
            # Copy src if needed for server-side code
            if [ -d src ]; then
              cp -r src $out/
            fi
          '';
        };
      
    in
    {
      packages = forAllSystems (system: {
        default = mkApp system;
        app = mkApp system;
      });
      
      devShells = forAllSystems (system:
        let
          pkgs = import nixpkgs { inherit system; };
        in
        {
          default = pkgs.mkShell {
            buildInputs = with pkgs; [
              nodejs_22
              nodePackages.pnpm
              nodePackages.typescript
              nodePackages.typescript-language-server
              docker
              skopeo
              gnumake
              tilt
            ];

            shellHook = ''
              echo "🎛️  BuilderHub Console Dev Environment"
              echo "Node.js version: $(node --version)"
              echo "pnpm version: $(pnpm --version)"
              echo "Tilt version: $(tilt version)"
              echo ""
              echo "Run 'pnpm install' to install dependencies"
              echo "Run 'pnpm dev' to start the development server"
              echo "Run 'tilt up' from the repo root when using Tilt"
              echo "Run 'make help' for available targets"
            '';
          };
        }
      );
    };
}
