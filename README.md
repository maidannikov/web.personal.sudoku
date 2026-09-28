# Sudoku Studio

Sudoku Studio is a polished browser Sudoku game, built end-to-end as a personal
project: requirements, planning, architecture, implementation, tests,
documentation, iteration, and homelab deployment. See [docs/](./docs) for the
full spec, architecture, and retrospective.

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

## Homelab Deployment

The game is packaged as an nginx container image and deployed via GitOps/ArgoCD
to a home k3s cluster, exposed publicly through a Cloudflare Tunnel.

Build and run the image locally:

```sh
docker build --file deploy/Dockerfile -t sudoku-app:local .
docker run --rm -p 8080:80 sudoku-app:local
```

Then open:

```text
http://localhost:8080
```

On every push to `main`, a GitHub Actions workflow builds and pushes a
versioned image, then updates the image tag in the
[k3s.home.argocd](https://github.com/maidannikov/k3s.home.argocd) GitOps
repository, which ArgoCD picks up and syncs to the cluster.

## Project Docs

- [docs/SPEC.md](./docs/SPEC.md)
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [docs/RETROSPECTIVE.md](./docs/RETROSPECTIVE.md)
