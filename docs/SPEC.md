# Sudoku Studio Specification

## Scope

Sudoku Studio is a single-player browser game for solving generated 9x9 Sudoku
puzzles. The MVP is fully client-side and does not require a backend.

## Rules

- The board has 9 rows, 9 columns, and nine 3x3 boxes.
- Each row must contain digits 1 through 9 exactly once.
- Each column must contain digits 1 through 9 exactly once.
- Each 3x3 box must contain digits 1 through 9 exactly once.
- Given cells cannot be edited.
- A puzzle is complete when every editable cell matches the generated solution.

## Difficulty Levels

- Easy: more givens and fewer open cells.
- Medium: balanced default puzzle.
- Hard: fewer givens.
- Expert: sparse board intended for experienced players.

Every generated puzzle must have exactly one solution.

## Functional Requirements

- Generate a new puzzle for each difficulty.
- Let the player select cells by mouse/touch or keyboard.
- Let the player enter digits 1 through 9.
- Let the player clear editable cells.
- Provide a start screen for difficulty selection and continuing saved games.
- Highlight selected cell, peers, same digits, and conflicts.
- Provide notes mode for candidate values.
- Provide a hint action that reveals a correct value.
- Provide undo and redo for player moves.
- Provide pause mode that covers the game screen and freezes the timer.
- Provide a completion overlay with exit, new puzzle, and share actions.
- Highlight incorrectly entered values directly on the board.
- Provide a score and shareable completion summary.
- Follow the device light/dark theme automatically.
- Track elapsed time, mistakes, hints, and score internally.
- Persist unfinished progress in local storage.
- Work on desktop and mobile screen sizes.

## Acceptance Criteria

- `npm test` passes.
- Generated puzzles have unique solutions.
- The game is playable with mouse/touch and keyboard.
- The app can be served as static files.
- A public demo URL is documented in `README.md`.
- The Kubernetes deployment serves the app through a ClusterIP service.
- Required documentation exists: `README.md`, `docs/SPEC.md`,
  `docs/ARCHITECTURE.md`, and `docs/RETROSPECTIVE.md`.

## Non-Goals

- Multiplayer gameplay.
- User accounts.
- Server-side scoreboards.
- Daily puzzle service.
- Installable/offline PWA support.
- Real-time collaboration.
