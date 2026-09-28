import { CELL_COUNT, DIFFICULTIES, generatePuzzle, isComplete } from "./sudoku.js";

const STORAGE_KEY = "sudoku-studio-state-v2";
const HISTORY_LIMIT = 80;
const DIFFICULTY_SCORING = {
  easy: { cell: 10, speed: 250, targetSeconds: 360 },
  medium: { cell: 20, speed: 600, targetSeconds: 600 },
  hard: { cell: 35, speed: 1100, targetSeconds: 900 },
  expert: { cell: 55, speed: 1800, targetSeconds: 1200 }
};

export function createGame(difficulty = "medium", random = Math.random, mode = "random") {
  const puzzle = generatePuzzle(difficulty, random);
  return {
    mode,
    difficulty: puzzle.difficulty,
    puzzle: puzzle.puzzle,
    solution: puzzle.solution,
    grid: puzzle.puzzle.slice(),
    notes: createEmptyNotes(),
    hintedIndexes: [],
    undoStack: [],
    redoStack: [],
    selectedIndex: findFirstOpenCell(puzzle.puzzle),
    notesMode: false,
    mistakes: 0,
    hints: 0,
    startedAt: Date.now(),
    elapsedBeforePause: 0,
    pausedAt: null,
    completedAt: null,
    message: "Pick a cell to begin."
  };
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!isValidSavedGame(parsed)) {
      return null;
    }

    return {
      ...parsed,
      notes: parsed.notes.map((values) => new Set(values)),
      hintedIndexes: Array.isArray(parsed.hintedIndexes) ? parsed.hintedIndexes : [],
      undoStack: (parsed.undoStack ?? []).map(deserializeSnapshot),
      redoStack: (parsed.redoStack ?? []).map(deserializeSnapshot),
      startedAt: parsed.completedAt || parsed.pausedAt ? parsed.startedAt : Date.now() - parsed.elapsedBeforePause,
      pausedAt: parsed.pausedAt ?? null
    };
  } catch {
    return null;
  }
}

export function saveGame(state) {
  if (state.completedAt) {
    clearSavedGame();
    return;
  }

  const serializable = {
    ...state,
    notes: state.notes.map((values) => [...values]),
    undoStack: state.undoStack.map(serializeSnapshot),
    redoStack: state.redoStack.map(serializeSnapshot),
    elapsedBeforePause: elapsedSeconds(state) * 1000
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
}

export function clearSavedGame() {
  localStorage.removeItem(STORAGE_KEY);
}

export function setSelectedCell(state, index) {
  if (index < 0 || index >= CELL_COUNT) {
    return state;
  }
  return { ...state, selectedIndex: index, message: "" };
}

export function toggleNotesMode(state) {
  if (state.pausedAt) {
    return state;
  }
  return {
    ...state,
    notesMode: !state.notesMode,
    message: `Notes mode ${state.notesMode ? "off" : "on"}.`
  };
}

export function placeValue(state, value) {
  const index = state.selectedIndex;
  if (index == null || state.puzzle[index] !== 0 || state.completedAt || state.pausedAt) {
    return state;
  }

  if (value === 0) {
    return clearCell(state, index);
  }

  if (completedNumbers(state).includes(value)) {
    return { ...state, message: `All ${value}s are already placed.` };
  }

  if (state.notesMode) {
    const notes = cloneNotes(state.notes);
    if (notes[index].has(value)) {
      notes[index].delete(value);
    } else {
      notes[index].add(value);
    }
    return withHistory(state, { notes, message: `Toggled note ${value}.` });
  }

  const grid = state.grid.slice();
  grid[index] = value;
  const notes = cloneNotes(state.notes);
  notes[index].clear();
  removePeerNotes(notes, index, value);

  const correct = state.solution[index] === value;
  const next = withHistory(state, {
    grid,
    notes,
    mistakes: correct ? state.mistakes : state.mistakes + 1,
    message: correct ? "Nice placement." : "That number conflicts with the solution."
  });

  if (isComplete(grid, state.solution)) {
    next.completedAt = Date.now();
    next.message = "Solved. Beautiful work.";
    clearSavedGame();
  }

  return next;
}

export function applyHint(state) {
  if (state.completedAt || state.pausedAt) {
    return state;
  }

  const openIndexes = state.grid
    .map((value, index) => (value === 0 ? index : -1))
    .filter((index) => index >= 0);

  if (openIndexes.length === 0) {
    return state;
  }

  const index = state.selectedIndex != null && state.grid[state.selectedIndex] === 0
    ? state.selectedIndex
    : openIndexes[0];
  const grid = state.grid.slice();
  const notes = cloneNotes(state.notes);
  const value = state.solution[index];
  grid[index] = value;
  notes[index].clear();
  removePeerNotes(notes, index, value);

  const next = withHistory(state, {
    selectedIndex: index,
    grid,
    notes,
    hintedIndexes: addUniqueIndex(state.hintedIndexes, index),
    hints: state.hints + 1,
    message: `Hint placed ${value}.`
  });

  if (isComplete(grid, state.solution)) {
    next.completedAt = Date.now();
    next.message = "Solved with a little help.";
    clearSavedGame();
  }

  return next;
}

export function resetGame(state) {
  return {
    ...state,
    grid: state.puzzle.slice(),
    notes: createEmptyNotes(),
    hintedIndexes: [],
    undoStack: [],
    redoStack: [],
    selectedIndex: findFirstOpenCell(state.puzzle),
    notesMode: false,
    mistakes: 0,
    hints: 0,
    startedAt: Date.now(),
    elapsedBeforePause: 0,
    pausedAt: null,
    completedAt: null,
    message: "Puzzle reset."
  };
}

export function undo(state) {
  if (state.undoStack.length === 0 || state.pausedAt) {
    return state;
  }

  const previous = state.undoStack[state.undoStack.length - 1];
  return {
    ...state,
    ...restoreSnapshot(previous),
    undoStack: state.undoStack.slice(0, -1),
    redoStack: [...state.redoStack, createSnapshot(state)].slice(-HISTORY_LIMIT),
    message: "Undid last move."
  };
}

export function redo(state) {
  if (state.redoStack.length === 0 || state.pausedAt) {
    return state;
  }

  const next = state.redoStack[state.redoStack.length - 1];
  return {
    ...state,
    ...restoreSnapshot(next),
    undoStack: [...state.undoStack, createSnapshot(state)].slice(-HISTORY_LIMIT),
    redoStack: state.redoStack.slice(0, -1),
    message: "Redid move."
  };
}

export function togglePause(state, now = Date.now()) {
  if (state.completedAt) {
    return state;
  }

  if (state.pausedAt) {
    return {
      ...state,
      startedAt: state.startedAt + (now - state.pausedAt),
      pausedAt: null,
      message: "Game resumed."
    };
  }

  return {
    ...state,
    pausedAt: now,
    message: "Game paused."
  };
}

export function elapsedSeconds(state, now = Date.now()) {
  if (state.completedAt) {
    return Math.floor((state.completedAt - state.startedAt) / 1000);
  }
  if (state.pausedAt) {
    return Math.floor((state.pausedAt - state.startedAt) / 1000);
  }
  return Math.max(0, Math.floor((now - state.startedAt) / 1000));
}

export function filledCount(state) {
  return state.grid.filter(Boolean).length;
}

export function difficultyLabel(difficulty) {
  return DIFFICULTIES[difficulty]?.label ?? DIFFICULTIES.medium.label;
}

export function completedNumbers(state) {
  const numbers = [];
  for (let number = 1; number <= 9; number += 1) {
    const correctCount = state.grid.filter((value, index) => (
      value === number && state.solution[index] === number
    )).length;
    if (correctCount >= 9) {
      numbers.push(number);
    }
  }
  return numbers;
}

export function score(state) {
  const scoring = DIFFICULTY_SCORING[state.difficulty] ?? DIFFICULTY_SCORING.medium;
  const hintedIndexes = new Set(state.hintedIndexes ?? []);
  const correctManualCells = state.grid.reduce((count, value, index) => {
    if (
      state.puzzle[index] === 0 &&
      value === state.solution[index] &&
      !hintedIndexes.has(index)
    ) {
      return count + 1;
    }
    return count;
  }, 0);

  return correctManualCells * scoring.cell + speedBonus(state, scoring);
}

export function shareText(state) {
  return `Sudoku Studio: solved ${difficultyLabel(state.difficulty)} in ${formatTime(elapsedSeconds(state))}, score ${score(state)}, ${state.hints} hints, ${state.mistakes} mistakes.`;
}

function clearCell(state, index) {
  if (state.grid[index] === 0 && state.notes[index].size === 0) {
    return state;
  }
  const grid = state.grid.slice();
  const notes = cloneNotes(state.notes);
  grid[index] = 0;
  notes[index].clear();
  return withHistory(state, { grid, notes, message: "Cell cleared." });
}

function createEmptyNotes() {
  return Array.from({ length: CELL_COUNT }, () => new Set());
}

function cloneNotes(notes) {
  return notes.map((values) => new Set(values));
}

function removePeerNotes(notes, index, value) {
  const row = Math.floor(index / 9);
  const col = index % 9;
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;

  for (let c = 0; c < 9; c += 1) {
    notes[row * 9 + c].delete(value);
  }

  for (let r = 0; r < 9; r += 1) {
    notes[r * 9 + col].delete(value);
  }

  for (let r = boxRow; r < boxRow + 3; r += 1) {
    for (let c = boxCol; c < boxCol + 3; c += 1) {
      notes[r * 9 + c].delete(value);
    }
  }
}

function addUniqueIndex(indexes = [], index) {
  return indexes.includes(index) ? indexes.slice() : [...indexes, index];
}

function speedBonus(state, scoring) {
  if (!state.completedAt) {
    return 0;
  }

  const seconds = elapsedSeconds(state);
  const remainingRatio = Math.max(0, (scoring.targetSeconds - seconds) / scoring.targetSeconds);
  return Math.round(scoring.speed * remainingRatio);
}

function findFirstOpenCell(puzzle) {
  const index = puzzle.findIndex((value) => value === 0);
  return index === -1 ? 0 : index;
}

function withHistory(state, changes) {
  return {
    ...state,
    ...changes,
    undoStack: [...state.undoStack, createSnapshot(state)].slice(-HISTORY_LIMIT),
    redoStack: []
  };
}

function createSnapshot(state) {
  return {
    grid: state.grid.slice(),
    notes: cloneNotes(state.notes),
    hintedIndexes: (state.hintedIndexes ?? []).slice(),
    selectedIndex: state.selectedIndex,
    mistakes: state.mistakes,
    hints: state.hints,
    completedAt: state.completedAt
  };
}

function restoreSnapshot(snapshot) {
  return {
    grid: snapshot.grid.slice(),
    notes: cloneNotes(snapshot.notes),
    hintedIndexes: (snapshot.hintedIndexes ?? []).slice(),
    selectedIndex: snapshot.selectedIndex,
    mistakes: snapshot.mistakes,
    hints: snapshot.hints,
    completedAt: snapshot.completedAt
  };
}

function serializeSnapshot(snapshot) {
  return {
    ...snapshot,
    notes: snapshot.notes.map((values) => [...values])
  };
}

function deserializeSnapshot(snapshot) {
  return {
    ...snapshot,
    notes: snapshot.notes.map((values) => new Set(values))
  };
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function isValidSavedGame(value) {
  return Boolean(
    value &&
      Array.isArray(value.puzzle) &&
      Array.isArray(value.solution) &&
      Array.isArray(value.grid) &&
      Array.isArray(value.notes) &&
      value.puzzle.length === CELL_COUNT &&
      value.solution.length === CELL_COUNT &&
      value.grid.length === CELL_COUNT &&
      value.notes.length === CELL_COUNT
  );
}
