export const SIZE = 9;
export const CELL_COUNT = SIZE * SIZE;

export const DIFFICULTIES = {
  easy: { label: "Easy", givens: 42 },
  medium: { label: "Medium", givens: 34 },
  hard: { label: "Hard", givens: 28 },
  expert: { label: "Expert", givens: 24 }
};

export function createSolvedGrid(random = Math.random) {
  const grid = Array(CELL_COUNT).fill(0);
  fillGrid(grid, random);
  return grid;
}

export function generatePuzzle(difficulty = "medium", random = Math.random) {
  const config = DIFFICULTIES[difficulty] ?? DIFFICULTIES.medium;
  const solution = createSolvedGrid(random);
  const puzzle = solution.slice();
  const positions = shuffle([...Array(CELL_COUNT).keys()], random);
  let givens = CELL_COUNT;

  for (const position of positions) {
    if (givens <= config.givens) {
      break;
    }

    const value = puzzle[position];
    puzzle[position] = 0;

    if (countSolutions(puzzle, 2) !== 1) {
      puzzle[position] = value;
    } else {
      givens -= 1;
    }
  }

  return {
    difficulty,
    puzzle,
    solution,
    givens
  };
}

export function isValidPlacement(grid, index, value) {
  if (!Number.isInteger(value) || value < 1 || value > 9) {
    return false;
  }

  const row = Math.floor(index / SIZE);
  const col = index % SIZE;
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;

  for (let c = 0; c < SIZE; c += 1) {
    const peer = row * SIZE + c;
    if (peer !== index && grid[peer] === value) {
      return false;
    }
  }

  for (let r = 0; r < SIZE; r += 1) {
    const peer = r * SIZE + col;
    if (peer !== index && grid[peer] === value) {
      return false;
    }
  }

  for (let r = boxRow; r < boxRow + 3; r += 1) {
    for (let c = boxCol; c < boxCol + 3; c += 1) {
      const peer = r * SIZE + c;
      if (peer !== index && grid[peer] === value) {
        return false;
      }
    }
  }

  return true;
}

export function getConflicts(grid, index) {
  const value = grid[index];
  if (!value) {
    return [];
  }

  const conflicts = new Set();
  const row = Math.floor(index / SIZE);
  const col = index % SIZE;
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;

  for (let c = 0; c < SIZE; c += 1) {
    const peer = row * SIZE + c;
    if (peer !== index && grid[peer] === value) {
      conflicts.add(peer);
    }
  }

  for (let r = 0; r < SIZE; r += 1) {
    const peer = r * SIZE + col;
    if (peer !== index && grid[peer] === value) {
      conflicts.add(peer);
    }
  }

  for (let r = boxRow; r < boxRow + 3; r += 1) {
    for (let c = boxCol; c < boxCol + 3; c += 1) {
      const peer = r * SIZE + c;
      if (peer !== index && grid[peer] === value) {
        conflicts.add(peer);
      }
    }
  }

  return [...conflicts];
}

export function isComplete(grid, solution) {
  return grid.length === CELL_COUNT && grid.every((value, index) => value === solution[index]);
}

export function peersOf(index) {
  const peers = new Set();
  const row = Math.floor(index / SIZE);
  const col = index % SIZE;
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;

  for (let c = 0; c < SIZE; c += 1) {
    peers.add(row * SIZE + c);
  }

  for (let r = 0; r < SIZE; r += 1) {
    peers.add(r * SIZE + col);
  }

  for (let r = boxRow; r < boxRow + 3; r += 1) {
    for (let c = boxCol; c < boxCol + 3; c += 1) {
      peers.add(r * SIZE + c);
    }
  }

  peers.delete(index);
  return peers;
}

export function countSolutions(grid, limit = 2) {
  const working = grid.slice();
  let count = 0;

  function search() {
    if (count >= limit) {
      return;
    }

    const index = findBestEmptyCell(working);
    if (index === -1) {
      count += 1;
      return;
    }

    for (const value of candidatesFor(working, index)) {
      working[index] = value;
      search();
      working[index] = 0;
    }
  }

  search();
  return count;
}

function fillGrid(grid, random) {
  const index = findBestEmptyCell(grid);
  if (index === -1) {
    return true;
  }

  for (const value of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], random)) {
    if (isValidPlacement(grid, index, value)) {
      grid[index] = value;
      if (fillGrid(grid, random)) {
        return true;
      }
      grid[index] = 0;
    }
  }

  return false;
}

function findBestEmptyCell(grid) {
  let bestIndex = -1;
  let bestCandidateCount = Infinity;

  for (let index = 0; index < CELL_COUNT; index += 1) {
    if (grid[index] !== 0) {
      continue;
    }

    const candidateCount = candidatesFor(grid, index).length;
    if (candidateCount < bestCandidateCount) {
      bestIndex = index;
      bestCandidateCount = candidateCount;
    }

    if (candidateCount === 1) {
      break;
    }
  }

  return bestIndex;
}

function candidatesFor(grid, index) {
  const candidates = [];
  for (let value = 1; value <= 9; value += 1) {
    if (isValidPlacement(grid, index, value)) {
      candidates.push(value);
    }
  }
  return candidates;
}

function shuffle(values, random) {
  const copy = values.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}
