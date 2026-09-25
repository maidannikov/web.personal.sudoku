# Sudoku Studio

Sudoku Studio is a polished browser Sudoku game built for the AI-Native
Development Challenge. It demonstrates a complete AI-assisted workflow:
requirements, planning, architecture, implementation, tests, documentation,
iteration, and homelab deployment.

## Play Online

The current homelab demo is available here:

```text
https://sudoku.maidannikov.site
```

The game is a static browser app, so there is no account, backend, or install
step required.

## Game

Fill a 9x9 Sudoku board so every row, column, and 3x3 box contains the digits
1 through 9 exactly once.

Features:

- generated puzzles with unique solutions
- Easy, Medium, Hard, and Expert difficulty levels
- mobile-friendly two-screen flow: difficulty selection first, board second
- desktop layout with the same flow and compact side controls
- notes mode for candidate numbers
- hints, undo, redo, pause, reset, and share actions
- fullscreen pause and completion overlays
- red cell feedback for incorrect values
- automatic light/dark theme based on device preference
- keyboard and touch-friendly controls
- local progress persistence

## Run Locally

```sh
npm run build
npm test
npm start
```

Then open:

```text
http://localhost:4173
```

## Screenshots

Screenshots should be captured after the final UI pass and committed under
`docs/screenshots/`.

Suggested set:

- `docs/screenshots/mobile-start.png`: mobile difficulty selection screen.
- `docs/screenshots/mobile-game.png`: mobile game board screen.
- `docs/screenshots/desktop-game.png`: desktop game layout.

Once the files are captured, add them here as regular Markdown images.

## Homelab Deployment

The game is packaged as an nginx container image and deployed from the
`personal-argocd` GitOps repository.

Build and run the image locally:

```sh
docker build -t sudoku-app:local .
docker run --rm -p 8080:80 sudoku-app:local
```

Then open:

```text
http://localhost:8080
```

The GitHub Actions workflow builds and pushes versioned images, then updates the
image tag in the GitOps repository. Set these repository variables and secrets
before enabling the workflow:

- `IMAGE_REPOSITORY`: full image repository, for example
  `docker.io/emaydannikov/sudoku`
- `REGISTRY_HOST`: registry hostname, for example `registry.example.com`
- `REGISTRY_USERNAME`: registry username secret
- `REGISTRY_PASSWORD`: registry password or token secret
- `GITOPS_SSH_KEY`: private part of a write-enabled Deploy Key scoped to
  `maidannikov/k3s.home.argocd`

The Kubernetes deployment is managed through ArgoCD:

```sh
kubectl apply -f argocd-apps/sudoku.yaml
```

Cloudflare Tunnel points the public hostname to:

```text
http://sudoku.sudoku.svc.cluster.local:80
```

Public URL:

```text
https://sudoku.maidannikov.site
```

Current in-cluster service health check:

```text
http://sudoku.sudoku.svc.cluster.local:80 -> HTTP 200
```

## Challenge Docs

- [SPEC.md](./SPEC.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [RETROSPECTIVE.md](./RETROSPECTIVE.md)
