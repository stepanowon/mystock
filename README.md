# MyStock

한국/미국 주식 포트폴리오 관리 대시보드. React + Firebase 기반 웹앱으로, Electron을 통해 데스크톱 앱으로도 실행할 수 있습니다.

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| **대시보드** | 포트폴리오 요약, 관심 종목 위젯, 시장 지수(KOSPI·KOSDAQ·S&P500·NASDAQ) |
| **포트폴리오** | 보유 종목 관리, 주식/ETF 분류, 매수금액·평가금액·이익손실 자동 계산, CSV 가져오기/내보내기 |
| **종목 상세** | 실시간 시세, 캔들차트(일/주/월/연봉), 이동평균선(MA5·20·60·120), 거래량 차트 |
| **종목 검색** | 한글/영문/종목코드 검색, 네이버 금융·Yahoo Finance 통합 |
| **관심 종목** | 종목 등록/삭제, 실시간 시세 자동 갱신(5초) |
| **인증** | Firebase 이메일·비밀번호 및 Google OAuth 로그인 |

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| UI Framework | React 19 |
| Routing | React Router v7 |
| 서버 상태 | TanStack Query v5 |
| 클라이언트 상태 | Zustand v5 |
| 스타일링 | Tailwind CSS v4 |
| 차트 | Recharts v2 |
| 스키마 검증 | Zod v3 |
| 인증/DB | Firebase v11 (Auth + Firestore) |
| 빌드 | Vite v6 |
| 타입 | TypeScript 5.7 |
| 데스크톱 | Electron 40 |

---

## 시작하기

### 요구 사항

- Node.js 20+
- Firebase 프로젝트 (Auth + Firestore 활성화)

### 설치

```bash
# 의존성 설치
npm install

# 한국 주식/ETF 로컬 DB 다운로드 (최초 1회)
npm run stocks:download
npm run etfs:download
```

### 환경 변수 설정

`.env` 파일을 프로젝트 루트에 생성합니다.

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# KIS API (한국투자증권, 선택 사항)
VITE_KIS_APP_KEY=
VITE_KIS_APP_SECRET=
```

### 실행

```bash
# 웹 개발 서버
npm run dev

# Electron 데스크톱 앱 (개발)
npm run dev:electron

# 웹 빌드
npm run build

# Electron 앱 빌드 (배포)
npm run build:electron
```

---

## 프로젝트 구조

```
src/
├── components/
│   ├── ui/              # 공통 UI (Button, Card, Spinner, Badge …)
│   ├── layout/          # AppLayout, Sidebar, Header, MobileNav
│   └── auth/            # AuthGuard, LoginForm, GoogleLoginButton
│
├── features/
│   ├── auth/            # 로그인·회원가입 페이지
│   ├── dashboard/       # 대시보드, 시장 개요, 관심 종목 위젯
│   ├── portfolio/       # 포트폴리오 페이지, 보유 종목 테이블, CSV
│   ├── stock/           # 종목 상세, 캔들차트
│   ├── search/          # 종목 검색 페이지
│   └── settings/        # 설정 페이지
│
├── hooks/               # 커스텀 훅
├── services/
│   ├── stock-api/       # Yahoo Finance, Naver Finance, KIS API, 환율
│   └── firebase/        # Auth, Firestore repo 패턴
│
├── stores/              # Zustand 스토어 (auth-store)
├── types/               # TypeScript 타입 정의
├── lib/                 # 유틸리티 (format, market-hours, portfolio-csv)
├── data/                # 로컬 DB (kr-stocks.json, kr-etfs.json)
└── config/              # Firebase 초기화, 상수

electron/
└── main.cjs             # Electron 메인 프로세스
```

---

## 외부 API 연동

Vite 프록시를 통해 CORS를 우회합니다.

| 프록시 경로 | 대상 | 용도 |
|------------|------|------|
| `/api/yahoo` | `query1.finance.yahoo.com` | 미국/한국 주식 시세·차트·검색 |
| `/api/naver-stock` | `ac.stock.naver.com` | 한국 종목 자동완성 검색 |
| `/api/naver-mobile` | `m.stock.naver.com` | 한국 주식 실시간 시세 |
| `/api/exchange-rate` | `open.er-api.com` | USD/KRW 환율 (30분 캐시) |

### 종목 시세 조회 우선순위

**한국(KRX)**
1. KIS API *(API Key 설정 시)*
2. 네이버 금융
3. Yahoo Finance (`.KS` / `.KQ` 접미사) fallback

**미국(NYSE / NASDAQ)**
- Yahoo Finance

### 종목 검색 우선순위

| 입력 유형 | 검색 경로 |
|----------|----------|
| 한글 | 네이버 금융 → 로컬 DB (kr-stocks + kr-etfs) fallback |
| 숫자(종목코드) | 로컬 DB 우선 → 없으면 Yahoo Finance |
| 영문 | Yahoo Finance(미국) + 네이버 ETF 병렬 검색 |

---

## 데이터 모델

### Firestore 구조

```
users/{uid}/
├── portfolio/{docId}    # PortfolioItem
└── watchlist/{docId}    # WatchlistItem
```

### 주요 타입

```typescript
// 종목 시세
interface StockQuote {
  symbol: string
  name: string
  market: 'KRX' | 'NYSE' | 'NASDAQ'
  currency: 'KRW' | 'USD'
  currentPrice: number
  change: number
  changePercent: number
  marketStatus: 'PRE_MARKET' | 'OPEN' | 'CLOSED' | 'AFTER_HOURS'
  // …
}

// 보유 종목 (수익률 포함)
interface HoldingReturn {
  symbol: string
  avgPrice: number
  quantity: number
  currentPrice: number
  costBasis: number       // 매수금액
  marketValue: number     // 평가금액
  returnAmount: number    // 이익/손실액
  returnPercent: number   // 수익률 (%)
  weight: number          // 포트폴리오 비중 (%)
}
```

---

## 차트 상세

### 캔들차트 탭

| 탭 | Fetch 범위 | Interval | 표시 범위 |
|----|-----------|----------|---------|
| 일봉 | 1년 | 1d | 최근 8개월 |
| 주봉 | 5년 | 1wk | 최근 4년 |
| 월봉 | 10년 | 1mo | 전체 |
| 연봉 | 최대 | 3mo → 연간 집계 | 전체 |

- 한국 색 관례 적용: 상승 **빨강**, 하락 **파랑**
- 이동평균선 4종 (MA5·20·60·120) 개별 토글
- 거래량 패널(하단) + 거래량 MA20 표시

---

## CSV 내보내기/가져오기

**포트폴리오 → CSV 내보내기** 버튼: 현재 보유 종목을 `portfolio_YYYYMMDD.csv`로 다운로드합니다.

**CSV 가져오기** 버튼: CSV 파일을 업로드하면 유효성 검사 후 미리보기를 표시하고, 확인 시 포트폴리오에 일괄 추가합니다.

CSV 형식:

```csv
symbol,name,market,currency,avgPrice,quantity
005930,삼성전자,KRX,KRW,195120,500
000660,SK하이닉스,KRX,KRW,967818,110
AAPL,Apple Inc.,NASDAQ,USD,150.00,10
```

> Excel 호환을 위해 BOM(UTF-8)이 자동으로 삽입됩니다.

---

## 로컬 DB 갱신

한국 주식·ETF 데이터는 `src/data/` 에 JSON으로 번들링됩니다. 최신 목록으로 갱신하려면 아래 스크립트를 실행합니다.

```bash
npm run stocks:download   # 한국 상장 주식 목록 (KRX)
npm run etfs:download     # 한국 ETF 목록 (Naver Finance)
```

---

## 라이선스

Private — 개인 프로젝트
