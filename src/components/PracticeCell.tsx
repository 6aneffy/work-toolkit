import { forwardRef } from "react";
import type { CellState } from "../types";
import styles from "./PracticeGrid.module.css";

type Props = {
  state: CellState;
  expected: string;
  isActive: boolean;
  onFocus: () => void;
  onChange: (value: string) => void;
  onCommit: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

/**
 * 개별 입력 셀.
 *
 * 활성 상태에서 "입력한 글자 + 남은 정답" 을 한 셀 안에 오버레이 렌더링한다.
 * - 입력창은 위(z-index: 1), 실제 입력값을 기본 텍스트 색으로 표시.
 * - 하단 레이어(ghostLayer) 는 글자폭을 유지하기 위해 "입력한 글자" 를 투명하게 렌더하고,
 *   그 뒤에 이어질 정답을 ghost 색상으로 표시한다.
 * - ghost 는 입력값이 정답의 prefix 일 때만 보여 잘못된 입력을 따라가지 않는다.
 */
export const PracticeCell = forwardRef<HTMLInputElement, Props>(function PracticeCell(
  { state, expected, isActive, onFocus, onChange, onCommit, onKeyDown },
  ref
) {
  const cellClass = [
    styles.cell,
    state.status === "wrong" ? styles.cellWrong : "",
    state.status === "correct" ? styles.cellCorrect : "",
    isActive ? styles.cellActive : "",
  ]
    .filter(Boolean)
    .join(" ");

  const isPrefix = expected.startsWith(state.value);
  const showGhost = isActive && isPrefix && state.value.length < expected.length;
  const remaining = showGhost ? expected.slice(state.value.length) : "";

  return (
    <td className={cellClass}>
      {showGhost && (
        <span className={styles.ghostLayer} aria-hidden="true">
          <span className={styles.ghostTyped}>{state.value}</span>
          <span className={styles.ghostRemain}>{remaining}</span>
        </span>
      )}
      <input
        ref={ref}
        type="text"
        className={styles.input}
        value={state.value}
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onCommit}
        onKeyDown={onKeyDown}
        spellCheck={false}
        autoComplete="off"
        aria-label={expected}
      />
    </td>
  );
});
