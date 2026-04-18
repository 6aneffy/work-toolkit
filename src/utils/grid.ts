import type { CellPosition, CellState, GridState } from "../types";

export function createEmptyGrid(rows: number, cols: number): GridState {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, (): CellState => ({ value: "", status: "empty" }))
  );
}

export function toColumnLabel(colIndex: number): string {
  let n = colIndex;
  let label = "";
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

export function toCellAddress(row: number, col: number): string {
  return `${toColumnLabel(col)}${row + 1}`;
}

export function countCorrect(grid: GridState): number {
  let c = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell.status === "correct") c += 1;
    }
  }
  return c;
}

export function countFilled(grid: GridState): number {
  let c = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell.status !== "empty") c += 1;
    }
  }
  return c;
}

/**
 * 사용자가 실제로 입력을 시도하여 평가된 셀 수.
 * (correct 또는 wrong 상태인 셀)
 */
export function countAttempted(grid: GridState): number {
  let c = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell.status === "correct" || cell.status === "wrong") c += 1;
    }
  }
  return c;
}

export function isRowComplete(grid: GridState, rowIndex: number): boolean {
  const row = grid[rowIndex];
  if (!row) return false;
  return row.every((c) => c.status === "correct");
}

export function countCompletedRows(grid: GridState): number {
  let n = 0;
  for (let r = 0; r < grid.length; r += 1) {
    if (isRowComplete(grid, r)) n += 1;
  }
  return n;
}

/**
 * 정확도 = 정답 셀 수 / 입력 시도한 셀 수 (×100)
 * 아직 입력 시도가 없으면 100%를 반환한다 (깨끗한 초기 상태).
 */
export function calcAccuracy(correct: number, attempted: number): number {
  if (attempted <= 0) return 100;
  return Math.round((correct / attempted) * 100);
}

/**
 * 현재 grid 에서 오답 상태인 모든 셀 좌표를 읽기 순서(row-major)로 반환한다.
 * 오류 카운트와 오류 탐색 UX(순환 이동, 수정 모드) 에 사용된다.
 */
export function getErrorPositions(grid: GridState): CellPosition[] {
  const list: CellPosition[] = [];
  for (let r = 0; r < grid.length; r += 1) {
    const row = grid[r];
    for (let c = 0; c < row.length; c += 1) {
      if (row[c].status === "wrong") list.push({ row: r, col: c });
    }
  }
  return list;
}

/**
 * from 위치 다음에 오는 오류 셀을 찾는다. (row-major 순서)
 * 현재 위치가 마지막 오류거나 오류가 없으면 첫 오류로 순환한다.
 */
export function findNextError(
  errors: CellPosition[],
  from: CellPosition
): CellPosition | null {
  if (errors.length === 0) return null;
  const fromIdx = from.row * 1000 + from.col;
  for (const e of errors) {
    if (e.row * 1000 + e.col > fromIdx) return e;
  }
  return errors[0];
}

/**
 * 입력이 완료된 것으로 간주할지 판단.
 * 모든 셀이 최소 1회 이상 평가된 상태(correct 또는 wrong)면 true.
 */
export function isAllAttempted(grid: GridState): boolean {
  for (const row of grid) {
    for (const cell of row) {
      if (cell.status === "empty") return false;
    }
  }
  return true;
}

/**
 * 셀 1개를 커밋(평가)한 결과의 새 grid 를 반환한다. (순수 함수)
 * App.move() 가 커밋 직후의 grid 로 완료/오류 탐색 판단을 하기 위해 분리되어 있다.
 */
export function commitCell(
  grid: GridState,
  pos: CellPosition,
  expectedValue: string
): GridState {
  const cell = grid[pos.row]?.[pos.col];
  if (!cell) return grid;

  const value = cell.value;
  let nextStatus: CellState["status"];
  if (value === "") nextStatus = "empty";
  else if (value === expectedValue) nextStatus = "correct";
  else nextStatus = "wrong";

  if (cell.status === nextStatus) return grid;

  const nextRow = grid[pos.row].slice();
  nextRow[pos.col] = { ...cell, status: nextStatus };
  const nextGrid = grid.slice();
  nextGrid[pos.row] = nextRow;
  return nextGrid;
}
