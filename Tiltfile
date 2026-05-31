# BuilderHub build console - deploy to cluster via Helm
# Requires: default_registry (e.g. localhost:5000) set by root Tiltfile for Kind
# build-api runs locally on :8090; browser must call it directly (no Next.js proxy) so auth headers are sent
docker_build(
    'build-console',
    '.',
    dockerfile='Dockerfile',
    build_args={'NEXT_PUBLIC_API_URL': 'http://localhost:8090'},
)
k8s_yaml(helm(
    'helm/build-console',
    set=[
        'image.repository=build-console',
        'image.pullPolicy=Always',
        'replicaCount=1',
    ],
))

# Group all objects from this Helm chart under one labeled resource.
# Without the `objects` list, things like the ServiceAccount leak into "unlabeled"/"uncategorized".
k8s_resource(
    workload='chart-build-console',
    new_name='build-console',
    port_forwards=['3001:3001'],
    labels=['frontend'],
    objects=[
        # The ServiceAccount is not auto-attached when using `workload`, so we claim it explicitly.
        'chart-build-console:serviceaccount',
        # Note: Do not include 'chart-build-console:service' here.
        # It is normally automatically grouped with the Deployment workload.
        # Adding it causes "No object identified by the fragment" errors.
    ],
)
