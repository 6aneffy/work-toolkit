export type CellPosition = {
  row: number;
  col: number;
};

export type CellStatus = "empty" | "correct" | "wrong";

export type CellState = {
  value: string;
  status: CellStatus;
};

export type GridState = CellState[][];

export type PracticeRecord = {
  date: string;
  accuracy: number;
  totalTimeSec: number;
  errors: number;
  completedRows: number;
  totalRows: number;
};

export type StoredStats = {
  bestAccuracy: number;
  recentRecords: PracticeRecord[];
};

export type ColumnDef = {
  key: string;
  label: string;
  width: number;
};
