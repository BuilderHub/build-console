# BuilderHub build console - deploy to cluster via Helm
# Requires: default_registry (e.g. localhost:5000) set by root Tiltfile for Kind
docker_build('build-console', '.', dockerfile='Dockerfile')
k8s_yaml(helm(
    'helm/build-console',
    set=[
        'image.repository=build-console',
        'image.pullPolicy=Always',
        'replicaCount=1',
    ],
))
k8s_resource(workload='chart-build-console', new_name='build-console', port_forwards=['3001:3001'])
