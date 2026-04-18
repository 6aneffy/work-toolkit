# Work Toolkit

엑셀 형태 UI 기반의 **업무 입력 정확도 훈련 웹 애플리케이션**.

![screenshot placeholder](./public/logo.svg)

> 단순 타자 연습이 아니라, 실제 업무에서 반복되는 "이름 · 소속 · 업무 내용" 같은 데이터를 그리드에 입력하며 **정확도 · 오류 · 속도** 를 측정하고, 틀린 셀만 골라 빠르게 수정하는 워크북 도구입니다.

- 🌐 배포 주소: _(Vercel 배포 예정)_ — `https://work-toolkit.vercel.app`
- 🎯 목표: 업무툴의 감각을 유지하면서도, 프론트엔드에서의 **키보드 인터랙션 설계 · 상태 설계 · UX 흐름 설계** 를 실전 수준으로 다룬 개인 포트폴리오 프로젝트

---

## 1. 프로젝트 배경

인턴 환경에서 반복적으로 마주치는 문제가 있었습니다.

- 단순 값을 엑셀에 옮겨 적는 작업이 의외로 많고,
- 거기서 발생하는 오타 한 글자가 **검수 · 재작업 · 커뮤니케이션 비용** 으로 눈덩이처럼 불어난다는 점.
- 기존 타자 연습 사이트들은 **"영타 / 한글 장문"** 에 초점이 맞춰져 있고, "업무 데이터 입력" 과 맞지 않음.

> 그래서 "업무 입력에 특화된 훈련 도구" 를 직접 만들어 보자는 것이 출발점이었습니다.

요구사항은 단순했습니다.

1. 엑셀과 똑같이 보이고, 엑셀처럼 키보드만으로 돌아갈 것.
2. 게임 같은 과한 이펙트 대신, **업무툴 감성의 정적인 UI** 일 것.
3. 틀린 곳이 어디인지 바로 보이고, **수정까지의 동선이 짧을 것**.
4. 입력 흐름을 방해하지 않는 선에서, 보조적으로 **자주 쓰는 보고 문장 변환** 까지 붙일 것.

---

## 2. 핵심 기능

| 영역 | 기능 |
| --- | --- |
| 입력 그리드 | 엑셀 스타일 헤더 · 행 번호 · 3 × 12 셀 · 활성 셀 하이라이트 |
| 키보드 | `Tab` 오른쪽 · `Enter` 세로 + 열 래핑 (C12 → A1) · `↑/↓` 수직 이동 |
| 고스트 텍스트 | 입력 중에도 "남은 정답" 이 연한 회색으로 한 셀 안에 같이 보임 |
| 정확도 | "입력을 시도한 셀" 기준 (분모에서 미입력 셀은 제외) |
| 오류 관리 | 현재 남아있는 오류만 카운트 · 수정 시 즉시 감소 · 오류만 순환 탐색 |
| 수정 모드 | "오류 수정하기" → 첫 오류로 이동, Enter 마다 다음 오류로 순차 이동 |
| 완료 카드 | 완료 ↔ "오류 수정 중" 상태 자동 전환 · 총 시간 / 정확도 / 오류 수 표시 |
| 상태 바 | 현재 셀 주소 / 경과시간 / 직전 행 완료 시간 / 정확도 / 초기화 |
| 문장 변환 모달 | `Ctrl + /` 로 여는 독립 패널 · 키워드 부분 매칭 · 복사 · 다른 결과 |
| 저장 | `localStorage` 로 최고 정확도 · 최근 기록 보존 |
| 반응형 | 좁은 화면에서는 그리드 가로 스크롤, 헤더 / 바들은 자연스럽게 줄바꿈 |

---

## 3. 핵심 구현 포인트 (프론트엔드 관점)

README 에서 가장 강조하고 싶은 부분입니다.
"어떤 문제를 발견했고, 어떤 설계로 풀었는가" 중심으로 정리했습니다.

### 3-1. 키보드 인터랙션 — "엑셀처럼 느껴지는" 이동 설계

처음엔 단순히 `Tab = 오른쪽`, `Enter = 다음 행 첫 칸` 으로 만들었더니,
실사용 시 **B열에 값을 계속 내려 쓰고 싶은데 Enter가 자꾸 A열로 돌려보내는** 이슈가 있었습니다.

엑셀의 실제 동작을 재설계 기준으로 삼아 다음과 같이 정리했습니다.

- `Tab`: 오른쪽 이동 (끝이면 다음 행 첫 칸)
- `Enter`: **같은 열의 아래 셀** 로 이동
  - 12행을 넘으면 다음 열의 1행으로 래핑 (`A12 → B1`)
  - 마지막 셀 `C12` 에서 `Enter` 를 눌러 `A1` 으로 돌아올 때, **36셀이 모두 채워진 경우** 완료 전이를 **단 한 번** 트리거
- `Shift + Tab`: 의도적으로 MVP에서 비활성. 코드와 주석으로 확장 포인트만 남겨둠

```ts
// src/App.tsx — move() 중 Enter 분기
if (active.row < ROWS - 1) {
  next = { row: active.row + 1, col: active.col };
} else if (active.col < COLS - 1) {
  next = { row: 0, col: active.col + 1 };      // A12 → B1, B12 → C1
} else {
  next = { row: 0, col: 0 };                   // C12 → A1 (완료는 useEffect에서 1회만)
}
```

### 3-2. "완료" 는 한 번만 — 상태 머신으로 다루기

완료를 "특정 키를 눌렀을 때" 가 아니라 **"모든 셀이 최소 1회 평가된 시점"** 으로 정의했습니다. 이 덕분에:

- Tab으로 끝내든, Enter로 끝내든, 오류 수정 중이든 **동일한 완료 기준** 을 공유합니다.
- 완료 후 사용자가 다시 값을 고쳐도 **중복 저장이 일어나지 않습니다** (`completionSavedRef`).

```ts
// 완료 전이 — 파생된 "모든 셀 평가됨" 상태를 감지해 1회만 트리거
useEffect(() => {
  if (finishedAt !== null || completionSavedRef.current) return;
  if (!isAllAttempted(grid)) return;
  ...
}, [grid, ...]);
```

또한 **완료 이후에 오류가 새로 생기면** 완료 카드가 자동으로 `"오류 수정 중"` 상태로 바뀌고, 모두 고치면 다시 `"완료"` 로 돌아옵니다. UI 플래그가 아니라 **"현재 errors 개수"** 라는 파생값으로 상태를 계산하기 때문에, 별도 분기나 동기화 코드 없이 자연스럽게 동작합니다.

```ts
const isFixingAfterComplete = finishedAt !== null && errors > 0;
```

### 3-3. 오류를 "집합" 이 아니라 "현재 grid 의 파생" 으로

초기 설계에선 "한 번 틀린 셀" 을 `Set` 으로 누적했는데, 고쳐도 개수가 줄지 않는 문제가 있었습니다.
오류 정보를 별도 상태로 두지 않고 **매 렌더 시 `grid` 에서 파생** 하도록 바꿔, 이 문제를 구조적으로 없앴습니다.

```ts
const errorPositions = useMemo(() => getErrorPositions(grid), [grid]);
const errors = errorPositions.length;      // 현재 남은 오류 개수 = 진실의 한 소스
```

덕분에:

- 같은 셀이 여러 번 오답이어도 **항상 1로만 카운트** (`status === "wrong"` 인 셀 수)
- 고치면 곧바로 감소
- "오류 N건" 클릭 시 오류 셀들 사이만 순환 이동 (`findNextError`)
- "오류 수정하기" → 첫 오류로 점프 + `Enter` 로 다음 오류 연쇄 이동

### 3-4. 고스트 텍스트 — 입력하면서 정답이 이어 보이게

타자 연습형 UX 를 한 단계 더 업무툴답게 만들기 위해, **사용자가 친 글자 + 남은 정답 글자** 가 한 셀 안에 겹쳐 보이도록 했습니다.

- input 은 `z-index:1`, 배경은 투명 → 실제 타이핑은 input 이 책임
- input 바로 아래 같은 폰트 / 패딩의 레이어(`ghostLayer`)를 겹쳐 놓고,
  "친 글자 폭" 만큼 **투명 스페이서** + 그 뒤에 **남은 정답 글자(연한 회색)** 를 렌더
- 단, 사용자가 친 글자가 **정답의 prefix 가 아닐 땐** ghost 를 숨겨 오답을 따라 쓰지 않게 함

```tsx
const isPrefix = expected.startsWith(state.value);
const showGhost = isActive && isPrefix && state.value.length < expected.length;
```

### 3-5. 상태 분리 — 비즈니스 로직을 UI 밖으로

화면에서 보는 모든 "숫자" 는 `utils/grid.ts` 의 순수 함수로부터 파생됩니다.

- `commitCell(grid, pos, expected)`: 셀 평가 후 새 grid 반환 (pure)
- `countCorrect`, `countAttempted`, `getErrorPositions`, `findNextError`, `isAllAttempted`, `calcAccuracy`
- React 컴포넌트는 렌더와 이벤트 바인딩만 책임, 로직은 순수 함수에 위치

이 구조 덕분에 `App.tsx` 의 `move()` 안에서 **"커밋 이후의 grid"** 를 즉시 계산해 완료 판정 / 다음 오류 탐색에 재사용할 수 있고, React `setState` 의 비동기성에 엉키지 않습니다.

### 3-6. 접근성 / 반응형

- 모든 키 인터랙션은 `preventDefault` 후 커스텀 핸들러로 처리 (브라우저 기본 `Tab` 의 이탈 방지)
- `role="grid"`, `role="status"`, `aria-live="polite"` 로 스크린리더 보조 지원
- 그리드는 좁은 화면에서 가로 스크롤, 헤더 / 상태 바 / 하단 영역은 `flex-wrap` + media query 로 줄바꿈
- 완료 카드의 액션 영역은 좁은 화면에서 전체 폭으로 내려붙음

---

## 4. 기술 스택

- **React 18** + **TypeScript** — 명시적 타입으로 상태 전이를 검증
- **Vite 5** — 개발 서버 / HMR / 빌드
- **CSS Modules** — 컴포넌트 단위 스타일 격리 (전역 스타일은 CSS 변수와 공용 버튼만)
- **localStorage** — 최고 정확도 / 최근 세션 기록
- 외부 UI 라이브러리 없음. 색상 / 간격 체계는 `src/styles/index.css` 의 CSS 변수로 통일

---

## 5. 실행 방법

```bash
npm install
npm run dev
```

개발 서버가 `http://localhost:5173` 에서 실행됩니다.

### 빌드 / 로컬 프리뷰

```bash
npm run build
npm run preview
```

---

## 6. 폴더 구조

```text
work_toolkit/
├── index.html
├── vercel.json                    # SPA 라우팅 + 캐시 헤더
├── public/
│   ├── favicon.png                # 생성 파비콘
│   └── logo.svg                   # 헤더 로고 & SVG 파비콘
├── src/
│   ├── main.tsx
│   ├── App.tsx                    # 상태 / 이동 / 완료 / 오류 흐름의 허브
│   ├── App.module.css
│   ├── styles/index.css           # CSS 변수 · 리셋 · 공용 버튼
│   ├── components/                # 모두 *.module.css 와 1:1 매칭
│   │   ├── WorkbookHeader.tsx
│   │   ├── StatusBar.tsx
│   │   ├── PracticeGrid.tsx
│   │   ├── PracticeCell.tsx       # 입력 + ghost text 레이어
│   │   ├── SummaryBar.tsx
│   │   ├── SheetTabs.tsx
│   │   └── ConverterModal.tsx
│   ├── data/
│   │   ├── sampleData.ts          # 훈련 데이터 (이름/소속/업무 내용)
│   │   └── templates.ts           # 문장 변환 키워드 그룹
│   ├── types/index.ts             # CellState, GridState, PracticeRecord, ...
│   └── utils/
│       ├── grid.ts                # 순수 함수: 평가 · 파생 · 탐색
│       ├── converter.ts           # 키워드 부분 매칭
│       ├── storage.ts             # localStorage 래퍼
│       └── time.ts                # 시간 포맷
```

---

## 7. 배포

[Vercel](https://vercel.com) 에 SPA 로 배포할 수 있도록 `vercel.json` 을 포함합니다.
Vite 의 기본 빌드 출력(`dist/`) 과 SPA 라우팅 규칙이 자동으로 연결됩니다.

```bash
# Vercel CLI
npm i -g vercel
vercel              # 프로젝트 연결
vercel --prod       # 배포
```

또는 Vercel 웹 대시보드에서 이 리포지토리를 Import 하면 프레임워크는 `Vite` 로 자동 감지됩니다.

---

## 8. 앞으로 개선 예정

- [ ] Supabase 기반 로그인
- [ ] 사용자별 기록 저장 (세션 히스토리 · 개인 최고 기록)
- [ ] 랭킹 시스템 (정확도 · 속도 리더보드)
- [ ] 다중 사용자 / 팀 모드
- [ ] 훈련 세트 선택 (부서별 · 난이도별)
- [ ] `Shift + Tab` / 방향키 기반 역방향 이동 정식 도입

---

## 9. 라이선스

개인 포트폴리오용 프로젝트입니다. 요청 시 별도로 공유 가능합니다.
