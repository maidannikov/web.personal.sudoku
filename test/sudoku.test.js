import test from "node:test";
import assert from "node:assert/strict";

import {
  CELL_COUNT,
  countSolutions,
  generatePuzzle,
  getConflicts,
  isComplete,
  isValidPlacement
} from "../src/sudoku.js";
import {
  applyHint,
  createGame,
  elapsedSeconds,
  filledCount,
  placeValue,
  redo,
  resetGame,
  score,
  setSelectedCell,
  toggleNotesMode,
  togglePause,
  undo
} from "../src/game-state.js";

test("generatePuzzle creates a uniquely solvable puzzle", () => {
  const puzzle = generatePuzzle("easy", seededRandom(42));

  assert.equal(puzzle.puzzle.length, CELL_COUNT);
  assert.equal(puzzle.solution.length, CELL_COUNT);
  assert.equal(countSolutions(puzzle.puzzle, 2), 1);
  assert.ok(puzzle.puzzle.some((value) => value === 0));
  assert.ok(puzzle.solution.every((value) => value >= 1 && value <= 9));
});

test("isValidPlacement and getConflicts detect row conflicts", () => {
  const grid = Array(CELL_COUNT).fill(0);
  grid[0] = 5;
  grid[1] = 5;

  assert.equal(isValidPlacement(grid, 2, 5), false);
  assert.deepEqual(getConflicts(grid, 0), [1]);
});

test("placeValue records correct values and completion", () => {
  let state = createGame("easy", seededRandom(7));
  const index = state.puzzle.findIndex((value) => value === 0);
  state = setSelectedCell(state, index);
  state = placeValue(state, state.solution[index]);

  assert.equal(state.grid[index], state.solution[index]);
  assert.equal(state.mistakes, 0);
  assert.equal(filledCount(state), state.puzzle.filter(Boolean).length + 1);
});

test("notes mode toggles candidates without changing the cell value", () => {
  let state = createGame("medium", seededRandom(9));
  const index = state.puzzle.findIndex((value) => value === 0);
  state = setSelectedCell(state, index);
  state = toggleNotesMode(state);
  state = placeValue(state, 3);

  assert.equal(state.grid[index], 0);
  assert.equal(state.notes[index].has(3), true);
});

test("hints place the solution value and reset restores givens", () => {
  let state = createGame("hard", seededRandom(11));
  const startFilled = filledCount(state);

  state = applyHint(state);
  assert.equal(state.hints, 1);
  assert.equal(filledCount(state), startFilled + 1);

  state = resetGame(state);
  assert.equal(state.hints, 0);
  assert.equal(filledCount(state), startFilled);
  assert.equal(isComplete(state.grid, state.solution), false);
});

test("undo and redo restore move history", () => {
  let state = createGame("easy", seededRandom(13));
  const index = state.puzzle.findIndex((value) => value === 0);
  state = setSelectedCell(state, index);
  state = placeValue(state, state.solution[index]);

  assert.equal(state.undoStack.length, 1);
  state = undo(state);
  assert.equal(state.grid[index], 0);
  assert.equal(state.redoStack.length, 1);

  state = redo(state);
  assert.equal(state.grid[index], state.solution[index]);
});

test("pause freezes elapsed time until resumed", () => {
  let state = createGame("medium", seededRandom(15));
  state = { ...state, startedAt: 1000 };
  state = togglePause(state, 6000);

  assert.equal(elapsedSeconds(state, 12000), 5);
  state = togglePause(state, 16000);
  assert.equal(elapsedSeconds(state, 17000), 6);
});

test("score decreases with mistakes, hints, and time", () => {
  const state = createGame("expert", seededRandom(17));
  const worse = {
    ...state,
    mistakes: 2,
    hints: 1,
    startedAt: Date.now() - 120000
  };

  assert.ok(score(worse) < score(state));
});

function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}
