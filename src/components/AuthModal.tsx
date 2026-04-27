import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import styles from "./AuthModal.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  configured: boolean;
  user: User | null;
  onSignInWithEmail: (email: string) => Promise<void>;
  onSignOut: () => Promise<void>;
};

type SendStatus = "idle" | "sending" | "sent" | "error";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthModal({
  open,
  onClose,
  configured,
  user,
  onSignInWithEmail,
  onSignOut,
}: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SendStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      setEmail("");
      setStatus("idle");
      setErrorMessage(null);
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 10);
    return () => window.clearTimeout(t);
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

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const isEmailValid = EMAIL_PATTERN.test(email.trim());
  const canSubmit = configured && isEmailValid && status !== "sending";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("sending");
    setErrorMessage(null);
    try {
      await onSignInWithEmail(email.trim());
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    }
  };

  const handleSignOut = async () => {
    try {
      await onSignOut();
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "로그아웃 중 오류가 발생했습니다.");
    }
  };

  const displayName =
    (user?.user_metadata?.display_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "";

  return (
    <div className={styles.modal} role="dialog" aria-modal="true" onClick={handleBackdropClick}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h2 className={styles.title}>{user ? "내 계정" : "로그인 · 회원가입"}</h2>
            {!user && (
              <p className={styles.subtitle}>
                이메일 한 번이면 로그인과 회원가입이 함께 처리됩니다.
              </p>
            )}
          </div>
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
          {!configured && (
            <div className={`${styles.callout} ${styles.calloutWarn}`} role="status">
              <strong className={styles.calloutTitle}>Supabase 미설정</strong>
              <p className={styles.calloutText}>
                <code>.env.local</code> 에 <code>VITE_SUPABASE_URL</code> 과{" "}
                <code>VITE_SUPABASE_ANON_KEY</code> 를 채운 뒤 페이지를 새로고침하면 로그인을 사용할 수 있습니다.
              </p>
            </div>
          )}

          {configured && user && (
            <>
              <div className={styles.profile}>
                <div className={styles.profileRow}>
                  <span className={styles.profileLabel}>이름</span>
                  <span className={styles.profileValue}>{displayName}</span>
                </div>
                <div className={styles.profileRow}>
                  <span className={styles.profileLabel}>이메일</span>
                  <span className={styles.profileValue}>{user.email ?? "-"}</span>
                </div>
              </div>
              {errorMessage && (
                <p className={`${styles.notice} ${styles.noticeWarn}`}>{errorMessage}</p>
              )}
            </>
          )}

          {configured && !user && (
            <form onSubmit={handleSubmit} className={styles.form}>
              {status === "idle" && (
                <div className={styles.callout} role="status">
                  <strong className={styles.calloutTitle}>처음 오셨나요?</strong>
                  <p className={styles.calloutText}>
                    별도의 회원가입 절차가 없습니다. 이메일을 입력하고 발송된 링크를 누르면
                    <strong> 처음이면 가입, 기존 계정이면 로그인</strong>이 자동으로 진행됩니다.
                    비밀번호는 사용하지 않습니다.
                  </p>
                </div>
              )}

              <label className={styles.label} htmlFor="auth-email">
                이메일
              </label>
              <input
                id="auth-email"
                ref={inputRef}
                type="email"
                inputMode="email"
                autoComplete="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                disabled={status === "sending" || status === "sent"}
              />

              {status === "sending" && <p className={styles.notice}>메일을 발송하는 중…</p>}
              {status === "sent" && (
                <div className={`${styles.callout} ${styles.calloutOk}`} role="status">
                  <strong className={styles.calloutTitle}>메일을 보냈어요</strong>
                  <p className={styles.calloutText}>
                    <code>{email}</code> 로 발송된 링크를 클릭하면 자동으로 로그인됩니다.
                    이 이메일로 처음 오셨다면 가입도 함께 완료됩니다. 메일이 보이지 않으면
                    스팸함도 확인해 주세요.
                  </p>
                </div>
              )}
              {status === "error" && (
                <p className={`${styles.notice} ${styles.noticeWarn}`}>
                  {errorMessage ?? "메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요."}
                </p>
              )}
            </form>
          )}
        </div>

        <div className={styles.footer}>
          {configured && user ? (
            <>
              <button type="button" className="wb-btn" onClick={onClose}>
                닫기
              </button>
              <button
                type="button"
                className="wb-btn wb-btn--primary"
                onClick={handleSignOut}
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button type="button" className="wb-btn" onClick={onClose}>
                닫기
              </button>
              {status === "sent" ? (
                <button
                  type="button"
                  className="wb-btn"
                  onClick={() => {
                    setStatus("idle");
                    setEmail("");
                  }}
                >
                  다른 이메일로 다시
                </button>
              ) : (
                <button
                  type="button"
                  className="wb-btn wb-btn--primary"
                  onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
                  disabled={!canSubmit}
                >
                  {status === "sending" ? "전송 중…" : "로그인 링크 받기"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
