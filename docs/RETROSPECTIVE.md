# Sudoku Studio Retrospective

## AI Tools Used

- Cursor agent for planning, implementation, tests, documentation, and deployment
  preparation.

## Development Workflow

1. Clarified the project scope, hosting target, and game idea.
2. Created a plan with scoped deliverables and homelab deployment.
3. Implemented the game as a static browser app with isolated game logic.
4. Added unit tests for generator and state behavior.
5. Added container packaging and GitOps deployment for homelab hosting.
6. Documented the specification, architecture, and deployment path.
7. Iterated on mobile UX after live testing: simplified controls, removed PWA
   behavior, and switched browser delivery to a single bundle.

## Validation

- Unit tests: `npm test`
- Image build: `docker build --file deploy/Dockerfile -t sudoku-app:local .`
- Manifest render: `helm template sudoku k3s.home.argocd/sudoku`
- Homelab smoke test: in-cluster health check returned `HTTP 200`.

## What Worked Well

- Starting with a small static architecture kept the project easy to reason
  about and deploy.
- Separating Sudoku logic from DOM rendering made tests straightforward.
- The homelab GitOps setup made deployment design concrete early in the project.

## What Did Not Work Well

- A ConfigMap-mounted static app was simple, but it was not ideal for larger
  asset bundles or cache busting. A real image build is a cleaner long-term fit.
- PWA/service-worker behavior was not worth it for this small demo. It made live
  iteration harder by keeping stale assets on mobile clients.
- ES modules are clean for source organization, but a single browser bundle was
  more reliable for the hosted demo.
- The project now has a dedicated application repository, while deployment state
  stays in the GitOps repository.

## Surprises and Discoveries

- A zero-build app is enough for a polished game when the scope is controlled.
- Sudoku uniqueness checks are a good compact example of testable algorithmic
  code in an otherwise UI-focused project.
- AI can move quickly through UI variants, but live mobile testing is still
  essential because caching and browser behavior are hard to infer from code.

## Estimated AI-Generated Code

Approximately 85-90% of the first implementation was AI-generated, with human
direction and review shaping the project scope and deployment choices.

## Time Spent

Initial implementation and documentation: about 1-2 focused hours.

## What I Would Do Differently Next Time

- Create the dedicated application repo at the start rather than migrating
  later.
- Capture screenshots as part of the initial UI pass instead of leaving them
  for a later cleanup.

## Key Lessons Learned

- AI is most useful when the project has a clear scope, explicit deliverables,
  and fast validation loops.
- Keeping implementation modules small makes AI-generated code easier to review.
- Deployment documentation should be written while deploying, not after the fact.
- Prefer boring browser delivery for small demos unless offline support is a
  real requirement.
