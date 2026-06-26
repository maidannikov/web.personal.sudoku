import {
  CELL_COUNT,
  getConflicts,
  isComplete,
  peersOf
} from "./sudoku.js";
import {
  applyHint,
  createGame,
  difficultyLabel,
  elapsedSeconds,
  loadGame,
  placeValue,
  redo,
  resetGame,
  saveGame,
  setSelectedCell,
  score,
  shareText,
  toggleNotesMode,
  togglePause,
  undo
} from "./game-state.js";

const startScreen = document.querySelector("#start-screen");
const gameScreen = document.querySelector("#game-screen");
const continueGame = document.querySelector("#continue-game");
const board = document.querySelector("#board");
const difficultyText = document.querySelector("#difficulty-label");
const timer = document.querySelector("#timer");
const message = document.querySelector("#message");
const notesToggle = document.querySelector("#notes-toggle");
const pauseOverlay = document.querySelector("#pause-overlay");
const resultPanel = document.querySelector("#result-panel");
const resultSummary = document.querySelector("#result-summary");
const scoreLabel = document.querySelector("#score");

let state = loadGame();
let screen = window.__sudokuStartDifficulty ? "game" : "start";
let loadingDifficulty = window.__sudokuStartDifficulty;
const cells = [];

initBoard();
bindControls();
render();
if (loadingDifficulty && !state) {
  finishStartingGame(loadingDifficulty);
}
setInterval(() => {
  if (state) {
    timer.textContent = formatTime(elapsedSeconds(state));
  }
}, 1000);

function initBoard() {
  board.textContent = "";
  for (let index = 0; index < CELL_COUNT; index += 1) {
    const cell = document.createElement("button");
    cell.className = "cell";
    cell.type = "button";
    cell.role = "gridcell";
    cell.dataset.index = String(index);
    cell.addEventListener("click", () => {
      state = setSelectedCell(state, index);
      render();
    });
    cells.push(cell);
    board.append(cell);
  }
}

function bindControls() {
  document.querySelectorAll("[data-start-difficulty]").forEach((button) => {
    button.addEventListener("click", () => {
      startNewGame(button.dataset.startDifficulty);
    });
  });

  continueGame.addEventListener("click", () => {
    screen = "game";
    render();
  });

  document.querySelector("#back-to-menu").addEventListener("click", () => {
    goToMenu();
  });

  document.querySelector("#new-game").addEventListener("click", () => {
    startNewGame(state?.difficulty ?? "medium");
  });

  document.querySelector("#check-game").addEventListener("click", () => {
    if (!state) {
      return;
    }

    if (isComplete(state.grid, state.solution)) {
      state = { ...state, completedAt: state.completedAt ?? Date.now(), message: "Solved. Beautiful work." };
    } else {
      state = { ...state, message: "Not solved yet. Keep going." };
    }
    render();
  });

  document.querySelector("#hint").addEventListener("click", () => {
    if (!state) {
      return;
    }

    state = applyHint(state);
    safeSaveGame();
    render();
  });

  document.querySelector("#undo").addEventListener("click", () => {
    if (!state) {
      return;
    }

    state = undo(state);
    safeSaveGame();
    render();
  });

  document.querySelector("#redo").addEventListener("click", () => {
    if (!state) {
      return;
    }

    state = redo(state);
    safeSaveGame();
    render();
  });

  document.querySelector("#pause").addEventListener("click", () => {
    if (!state) {
      return;
    }

    state = togglePause(state);
    safeSaveGame();
    render();
  });

  document.querySelector("#reset").addEventListener("click", () => {
    if (!state) {
      return;
    }

    state = resetGame(state);
    safeSaveGame();
    render();
  });

  notesToggle.addEventListener("click", () => {
    if (!state) {
      return;
    }

    state = toggleNotesMode(state);
    safeSaveGame();
    render();
  });

  document.querySelector("#share").addEventListener("click", async () => {
    shareResult();
  });

  document.querySelector("#pause-resume").addEventListener("click", () => {
    if (!state?.pausedAt) {
      return;
    }

    state = togglePause(state);
    safeSaveGame();
    render();
  });

  document.querySelector("#pause-menu").addEventListener("click", () => {
    goToMenu();
  });

  document.querySelector("#result-menu").addEventListener("click", () => {
    goToMenu();
  });

  document.querySelector("#result-share").addEventListener("click", () => {
    shareResult();
  });

  document.querySelector("#result-new-game").addEventListener("click", () => {
    startNewGame(state?.difficulty ?? "medium");
  });

  document.querySelectorAll("[data-number]").forEach((button) => {
    button.addEventListener("click", () => {
      applyNumber(Number(button.dataset.number));
    });
  });

  window.addEventListener("keydown", (event) => {
    if (screen !== "game" || !state) {
      return;
    }

    if (event.key >= "1" && event.key <= "9") {
      applyNumber(Number(event.key));
    } else if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
      applyNumber(0);
    } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
      state = event.shiftKey ? redo(state) : undo(state);
      safeSaveGame();
      render();
    } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
      state = redo(state);
      safeSaveGame();
      render();
    } else if (event.key.toLowerCase() === "p") {
      state = togglePause(state);
      safeSaveGame();
      render();
    } else if (event.key.toLowerCase() === "n") {
      state = toggleNotesMode(state);
      safeSaveGame();
      render();
    } else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      moveSelection(event.key);
    }
  });
}

function goToMenu() {
  screen = "start";
  if (state?.pausedAt) {
    state = togglePause(state);
  }
  safeSaveGame();
  render();
}

function startNewGame(difficulty) {
  if (screen === "game" && loadingDifficulty === difficulty) {
    return;
  }

  screen = "game";
  state = null;
  loadingDifficulty = difficulty;
  render();
  finishStartingGame(difficulty);
}

function finishStartingGame(difficulty) {
  window.setTimeout(() => {
    state = createGame(difficulty);
    loadingDifficulty = null;
    window.__sudokuStartDifficulty = null;
    render();
    safeSaveGame();
  }, 0);
}

function applyNumber(value) {
  if (!state) {
    return;
  }

  const previousMistakes = state.mistakes;
  state = placeValue(state, value);
  if (state.mistakes > previousMistakes && navigator.vibrate) {
    navigator.vibrate(40);
  }
  safeSaveGame();
  render();
}

function moveSelection(key) {
  if (!state) {
    return;
  }

  const row = Math.floor(state.selectedIndex / 9);
  const col = state.selectedIndex % 9;
  const next = {
    ArrowUp: Math.max(0, row - 1) * 9 + col,
    ArrowDown: Math.min(8, row + 1) * 9 + col,
    ArrowLeft: row * 9 + Math.max(0, col - 1),
    ArrowRight: row * 9 + Math.min(8, col + 1)
  }[key];

  state = setSelectedCell(state, next);
  render();
  cells[next].focus();
}

async function shareResult() {
  if (!state) {
    return;
  }

  const text = shareText(state);
  if (navigator.share) {
    await navigator.share({ title: "Sudoku Studio", text }).catch(() => {});
  } else if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    state = { ...state, message: "Result copied to clipboard." };
    render();
  }
}

function render() {
  document.body.classList.toggle("is-start", screen === "start");
  document.body.classList.toggle("is-game", screen === "game");
  startScreen.hidden = screen !== "start";
  gameScreen.hidden = screen !== "game";
  continueGame.hidden = !state;

  if (!state) {
    renderLoadingState();
    return;
  }

  const selectedValue = state.grid[state.selectedIndex];
  const peers = peersOf(state.selectedIndex);
  const conflicts = new Set();
  const paused = Boolean(state.pausedAt);

  for (let index = 0; index < CELL_COUNT; index += 1) {
    getConflicts(state.grid, index).forEach((conflict) => {
      conflicts.add(index);
      conflicts.add(conflict);
    });
  }

  cells.forEach((cell, index) => {
    const value = state.grid[index];
    const notes = [...state.notes[index]].sort();
    cell.className = "cell";
    cell.textContent = "";
    cell.ariaLabel = `Row ${Math.floor(index / 9) + 1}, column ${(index % 9) + 1}`;

    if (state.puzzle[index] !== 0) {
      cell.classList.add("given");
    }

    if (index === state.selectedIndex) {
      cell.classList.add("selected");
    } else if (peers.has(index)) {
      cell.classList.add("peer");
    }

    if (selectedValue && value === selectedValue) {
      cell.classList.add("same");
    }

    if (conflicts.has(index)) {
      cell.classList.add("conflict");
    }

    if (value && state.puzzle[index] === 0 && value !== state.solution[index]) {
      cell.classList.add("mistake");
    }

    if (paused) {
      cell.classList.add("paused");
      cell.textContent = "";
      return;
    }

    if (value) {
      cell.textContent = String(value);
    } else if (notes.length > 0) {
      const noteGrid = document.createElement("span");
      noteGrid.className = "notes-grid";
      for (let number = 1; number <= 9; number += 1) {
        const note = document.createElement("span");
        note.textContent = notes.includes(number) ? String(number) : "";
        noteGrid.append(note);
      }
      cell.append(noteGrid);
    }
  });

  difficultyText.textContent = difficultyLabel(state.difficulty);
  timer.textContent = formatTime(elapsedSeconds(state));
  scoreLabel.textContent = `${score(state)} pts`;
  notesToggle.ariaPressed = String(state.notesMode);
  notesToggle.textContent = `Notes ${state.notesMode ? "on" : "off"}`;
  document.querySelector("#pause").ariaLabel = state.pausedAt ? "Resume" : "Pause";
  document.querySelector("#pause").classList.toggle("is-paused", Boolean(state.pausedAt));
  document.querySelector("#undo").disabled = state.undoStack.length === 0;
  document.querySelector("#redo").disabled = state.redoStack.length === 0;
  document.querySelector("#share").disabled = !state.completedAt;
  document.querySelector("#result-share").disabled = !state.completedAt;
  pauseOverlay.hidden = !paused;
  resultPanel.hidden = !state.completedAt;
  resultSummary.textContent = `Finished ${difficultyLabel(state.difficulty)} in ${formatTime(elapsedSeconds(state))} with ${score(state)} points.`;

  message.textContent = state.message;
  message.className = "message";
  if (state.completedAt) {
    message.classList.add("good");
  } else if (state.message.toLowerCase().includes("conflict")) {
    message.classList.add("bad");
  }
}

function renderLoadingState() {
  const label = loadingDifficulty ? difficultyLabel(loadingDifficulty) : "Sudoku";
  difficultyText.textContent = label;
  timer.textContent = "00:00";
  scoreLabel.textContent = "0 pts";
  notesToggle.ariaPressed = "false";
  notesToggle.textContent = "Notes off";
  message.textContent = loadingDifficulty ? `Preparing ${label} puzzle...` : "Choose a difficulty to start.";
  message.className = "message";
  pauseOverlay.hidden = true;
  resultPanel.hidden = true;
  document.querySelector("#undo").disabled = true;
  document.querySelector("#redo").disabled = true;
  document.querySelector("#share").disabled = true;
  document.querySelector("#result-share").disabled = true;
  document.querySelector("#pause").classList.remove("is-paused");
  cells.forEach((cell) => {
    cell.className = "cell paused";
    cell.textContent = "";
  });
}

function safeSaveGame() {
  if (!state) {
    return;
  }

  try {
    saveGame(state);
  } catch {
    // Storage can fail in private modes; gameplay should still continue.
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}
