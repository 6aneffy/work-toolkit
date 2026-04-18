import { useEffect, useRef } from "react";
import { PracticeCell } from "./PracticeCell";
import type { CellPosition, GridState, ColumnDef } from "../types";
import { toColumnLabel } from "../utils/grid";
import styles from "./PracticeGrid.module.css";

export type MoveDirection = "next" | "down" | "up" | "enter";

type Props = {
  columns: ColumnDef[];
  expected: string[][];
  grid: GridState;
  active: CellPosition;
  onActivate: (pos: CellPosition) => void;
  onChange: (pos: CellPosition, value: string) => void;
  onCommit: (pos: CellPosition) => void;
  onMove: (direction: MoveDirection) => void;
};

export function PracticeGrid({
  columns,
  expected,
  grid,
  active,
  onActivate,
  onChange,
  onCommit,
  onMove,
}: Props) {
  const rows = grid.length;
  const cols = columns.length;

  const inputRefs = useRef<Array<Array<HTMLInputElement | null>>>([]);

  if (inputRefs.current.length !== rows) {
    inputRefs.current = Array.from({ length: rows }, () => Array(cols).fill(null));
  }

  useEffect(() => {
    const el = inputRefs.current[active.row]?.[active.col];
    if (el && document.activeElement !== el) {
      el.focus();
      el.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [active]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      // NOTE: Shift+Tab (역방향 이동)은 MVP에서 비활성화 상태이다.
      // 추후 확장 시 아래 주석을 해제하고 App의 move 핸들러에 "prev" 케이스를 추가한다.
      // if (e.shiftKey) { onMove("prev"); return; }
      if (e.shiftKey) return;
      onMove("next");
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      onMove("enter");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      onMove("down");
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      onMove("up");
      return;
    }
    // ArrowLeft / ArrowRight는 셀 내부 커서 이동이 기본 동작이므로 별도 처리하지 않는다.
  };

  return (
    <div className={styles.wrap}>
      <table className={styles.grid} role="grid">
        <colgroup>
          <col className={styles.rownumCol} />
          {columns.map((c) => (
            <col key={c.key} style={{ width: c.width }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th className={styles.corner} aria-hidden="true" />
            {columns.map((c, idx) => (
              <th key={c.key} className={styles.colhead}>
                <span className={styles.collabel}>{toColumnLabel(idx)}</span>
                <span className={styles.colname}>{c.label}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((row, rIdx) => {
            const isRowActive = rIdx === active.row;
            return (
              <tr key={rIdx}>
                <th
                  className={`${styles.rowhead} ${isRowActive ? styles.rowheadActive : ""}`}
                  scope="row"
                >
                  {rIdx + 1}
                </th>
                {row.map((cell, cIdx) => {
                  const isActive = rIdx === active.row && cIdx === active.col;
                  return (
                    <PracticeCell
                      key={cIdx}
                      ref={(el) => {
                        if (!inputRefs.current[rIdx]) {
                          inputRefs.current[rIdx] = Array(cols).fill(null);
                        }
                        inputRefs.current[rIdx][cIdx] = el;
                      }}
                      state={cell}
                      expected={expected[rIdx]?.[cIdx] ?? ""}
                      isActive={isActive}
                      onFocus={() => onActivate({ row: rIdx, col: cIdx })}
                      onChange={(v) => onChange({ row: rIdx, col: cIdx }, v)}
                      onCommit={() => onCommit({ row: rIdx, col: cIdx })}
                      onKeyDown={handleKeyDown}
                    />
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
