import { useEffect, useRef, useState } from "react";
import { convertToReport } from "../utils/converter";
import styles from "./ConverterModal.module.css";

const MIN_INPUT_LENGTH = 2;

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ConverterModal({ open, onClose }: Props) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [lastIndex, setLastIndex] = useState(-1);
  const [total, setTotal] = useState(0);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setInput("");
      setResult("");
      setLastIndex(-1);
      setTotal(0);
      setCopied(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const trimmed = input.trim();
  const canConvert = trimmed.length >= MIN_INPUT_LENGTH;

  const runConvert = (prevIdx: number) => {
    if (!canConvert) return;
    const r = convertToReport(input, prevIdx);
    setResult(r.text);
    setLastIndex(r.index);
    setTotal(r.total);
    setCopied(false);
  };

  const handleConvert = () => runConvert(-1);
  const handleAnother = () => runConvert(lastIndex);

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const showLengthNotice = input.length > 0 && trimmed.length < MIN_INPUT_LENGTH;

  return (
    <div className={styles.modal} role="dialog" aria-modal="true" onClick={handleBackdropClick}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>업무 문장 변환</h2>
          <button
            className={styles.close}
            type="button"
            onClick={onClose}
            aria-label="닫기 (ESC)"
            title="닫기 (ESC)"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className={styles.body}>
          <label className={styles.label} htmlFor="converter-input">
            입력 문장
          </label>
          <textarea
            id="converter-input"
            ref={inputRef}
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                handleConvert();
              }
            }}
            placeholder="예: 서류, 회의, 영상 제작"
            rows={3}
          />
          <p className={`${styles.notice} ${showLengthNotice ? styles.noticeWarn : ""}`}>
            {showLengthNotice
              ? `${MIN_INPUT_LENGTH}글자 이상 입력해야 변환할 수 있습니다.`
              : `${MIN_INPUT_LENGTH}글자 이상 입력하면 키워드가 포함된 템플릿을 찾아 변환합니다.`}
          </p>

          <label className={styles.label}>변환 결과</label>
          <div className={styles.result} aria-live="polite">
            {result ? (
              <p>{result}</p>
            ) : (
              <p className={styles.placeholder}>
                문장을 입력하고 변환 버튼을 누르면 보고용 문장이 출력됩니다.
              </p>
            )}
            {total > 1 && result && (
              <span className={styles.meta}>
                후보 {total}개 중 {lastIndex + 1}번
              </span>
            )}
          </div>
        </div>
        <div className={styles.footer}>
          <button
            type="button"
            className="wb-btn wb-btn--primary"
            onClick={handleConvert}
            disabled={!canConvert}
          >
            변환
          </button>
          <button
            type="button"
            className="wb-btn"
            onClick={handleAnother}
            disabled={!result || total <= 1}
          >
            다른 결과 보기
          </button>
          <button type="button" className="wb-btn" onClick={handleCopy} disabled={!result}>
            {copied ? "복사됨" : "복사"}
          </button>
        </div>
        <div className={styles.shortcutHint}>
          <span className={styles.shortcutLabel}>단축키</span>
          <span className={styles.shortcutItem}>
            <kbd>Ctrl</kbd> + <kbd>/</kbd> 열기·닫기
          </span>
          <span className={styles.shortcutDivider} aria-hidden="true" />
          <span className={styles.shortcutItem}>
            <kbd>Ctrl</kbd> + <kbd>Enter</kbd> 변환
          </span>
          <span className={styles.shortcutDivider} aria-hidden="true" />
          <span className={styles.shortcutItem}>
            <kbd>ESC</kbd> 닫기
          </span>
        </div>
      </div>
    </div>
  );
}
