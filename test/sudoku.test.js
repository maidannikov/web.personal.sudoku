import test from "node:test";
import assert from "node:assert/strict";

import {
  CELL_COUNT,
  countSolutions,
  generatePuzzle,
  getConflicts,
  isComplete,
  isValidPlacement
} from "../web/src/sudoku.js";
import {
  applyHint,
  completedNumbers,
  createGame,
  elapsedSeconds,
  filledCount,
  loadGame,
  placeValue,
  redo,
  resetGame,
  saveGame,
  score,
  setSelectedCell,
  toggleNotesMode,
  togglePause,
  undo
} from "../web/src/game-state.js";

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

test("score starts at zero and scales by difficulty", () => {
  let easy = createGame("easy", seededRandom(17));
  const easyIndex = easy.puzzle.findIndex((value) => value === 0);
  easy = setSelectedCell(easy, easyIndex);
  easy = placeValue(easy, easy.solution[easyIndex]);

  let expert = createGame("expert", seededRandom(17));
  const expertIndex = expert.puzzle.findIndex((value) => value === 0);
  expert = setSelectedCell(expert, expertIndex);
  expert = placeValue(expert, expert.solution[expertIndex]);

  assert.equal(score(createGame("medium", seededRandom(21))), 0);
  assert.equal(score(easy), 10);
  assert.equal(score(expert), 55);
});

test("hints do not award manual placement points", () => {
  const state = applyHint(createGame("medium", seededRandom(23)));

  assert.equal(state.hints, 1);
  assert.equal(score(state), 0);
});

test("completedNumbers only closes correctly placed digits", () => {
  const base = createGame("medium", seededRandom(24));
  const puzzle = Array(CELL_COUNT).fill(0);
  const completeGrid = Array(CELL_COUNT).fill(0);
  const eightIndexes = base.solution
    .map((value, index) => (value === 8 ? index : -1))
    .filter((index) => index >= 0);
  const nonEightIndex = base.solution.findIndex((value) => value !== 8);

  eightIndexes.forEach((index) => {
    completeGrid[index] = 8;
  });

  const completed = {
    ...base,
    puzzle,
    grid: completeGrid,
    selectedIndex: nonEightIndex
  };

  assert.deepEqual(completedNumbers(completed), [8]);

  const wrongGrid = Array(CELL_COUNT).fill(0);
  eightIndexes.slice(1).forEach((index) => {
    wrongGrid[index] = 8;
  });
  wrongGrid[nonEightIndex] = 8;

  assert.equal(wrongGrid.filter((value) => value === 8).length, 9);
  assert.equal(completedNumbers({ ...base, puzzle, grid: wrongGrid }).includes(8), false);
});

test("placeValue blocks numbers that are already complete", () => {
  const base = createGame("medium", seededRandom(26));
  const puzzle = Array(CELL_COUNT).fill(0);
  const grid = Array(CELL_COUNT).fill(0);
  const eightIndexes = base.solution
    .map((value, index) => (value === 8 ? index : -1))
    .filter((index) => index >= 0);
  const selectedIndex = base.solution.findIndex((value) => value !== 8);

  eightIndexes.forEach((index) => {
    grid[index] = 8;
  });

  const state = {
    ...base,
    puzzle,
    grid,
    selectedIndex
  };
  const next = placeValue(state, 8);

  assert.equal(next.grid[selectedIndex], 0);
  assert.equal(next.message, "All 8s are already placed.");
});

test("score adds speed bonus only after completion", () => {
  const state = createGame("medium", seededRandom(25));
  const openCount = state.puzzle.filter((value) => value === 0).length;
  const solvedFast = {
    ...state,
    grid: state.solution.slice(),
    completedAt: state.startedAt + 120000
  };
  const solvedSlow = {
    ...state,
    grid: state.solution.slice(),
    completedAt: state.startedAt + 900000
  };

  assert.equal(score({ ...state, grid: state.solution.slice() }), openCount * 20);
  assert.equal(score(solvedFast), openCount * 20 + 480);
  assert.equal(score(solvedSlow), openCount * 20);
});

test("saveGame clears completed games instead of persisting them", () => {
  const originalLocalStorage = globalThis.localStorage;
  const store = new Map();
  globalThis.localStorage = {
    getItem(key) {
      return store.get(key) ?? null;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, value);
    }
  };

  try {
    const state = createGame("easy", seededRandom(19));
    saveGame(state);
    assert.ok(loadGame());

    saveGame({ ...state, completedAt: Date.now() });
    assert.equal(loadGame(), null);
  } finally {
    if (originalLocalStorage === undefined) {
      delete globalThis.localStorage;
    } else {
      globalThis.localStorage = originalLocalStorage;
    }
  }
});

function seededRandom(seed) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}
