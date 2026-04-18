import styles from "./WorkbookHeader.module.css";

type Props = {
  mode?: string;
  saved?: boolean;
};

export function WorkbookHeader({ mode = "기본 입력", saved = true }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <img src="/logo.svg" alt="" className={styles.logo} width={28} height={28} />
        <div className={styles.leftText}>
          <h1 className={styles.title}>Work Toolkit</h1>
          <span className={styles.subtitle}>업무 입력 훈련 워크북</span>
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.mode}>
          <span className={styles.modeLabel}>모드</span>
          <span className={styles.modeValue}>{mode}</span>
        </div>
        <span className={`${styles.save} ${saved ? styles.saveActive : ""}`}>
          {saved ? "로컬 저장됨" : "저장 대기"}
        </span>
      </div>
    </header>
  );
}
