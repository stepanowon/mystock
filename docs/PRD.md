# MyStock - PRD (Product Requirements Document)

## 1. Overview

**제품명**: MyStock
**목적**: 한국/미국 주식 종목을 실시간으로 조회하고, 포트폴리오를 관리하는 개인용 투자 대시보드
**플랫폼**: 반응형 웹 + 데스크탑 앱 (Electron)
**작성일**: 2026-02-25

---

## 2. Problem Statement

- 여러 증권사 앱을 번갈아 사용해야 하는 불편함
- 한국/미국 주식을 통합 관리할 수 있는 개인 대시보드 부재
- 수익률, 포트폴리오 비중을 한눈에 파악하기 어려움

---

## 3. Target User

- 한국 + 미국 주식을 동시에 보유한 개인 투자자
- 실시간 시세와 포트폴리오 현황을 빠르게 확인하고 싶은 사용자
- 데스크탑에서 상시 모니터링하고 싶은 사용자

---

## 4. Core Features

### 4.1 실시간 시세 조회
| 항목 | 설명 |
|------|------|
| 현재가 | 실시간 (또는 15분 지연) 현재가 표시 |
| 등락률 | 전일 대비 변동률 (%, 금액) |
| 거래량 | 당일 거래량/거래대금 |
| 52주 고저 | 52주 최고가/최저가 |
| 시장 상태 | 장 전/장 중/장 후 표시 |
| 종목 검색 | 종목명 또는 티커 심볼로 검색 |
| 관심 종목 | 워치리스트 등록/관리 |

### 4.2 포트폴리오 관리
| 항목 | 설명 |
|------|------|
| 종목 등록 | 보유 종목, 매수가, 수량 입력 |
| 수익률 | 종목별/전체 수익률 실시간 계산 |
| 비중 분석 | 종목별, 시장별(한국/미국) 비중 파이차트 |
| 매매 기록 | 매수/매도 이력 관리 |
| 환율 반영 | USD/KRW 환율 적용한 원화 환산 |
| 배당 추적 | 배당금 내역 및 배당수익률 |

### 4.3 차트/그래프
| 항목 | 설명 |
|------|------|
| 주가 차트 | 일/주/월/년 캔들 차트 |
| 이동평균선 | 5일, 20일, 60일, 120일 MA |
| 거래량 차트 | 하단 거래량 바 차트 |
| 포트폴리오 추이 | 전체 자산 가치 변화 라인 차트 |
| 수익률 차트 | 종목별 수익률 비교 바 차트 |

### 4.4 알림/알람
| 항목 | 설명 |
|------|------|
| 목표가 알림 | 상한/하한 목표가 도달 시 알림 |
| 등락률 알림 | 설정 등락률 초과 시 알림 |
| 장 시작/종료 | 한국/미국 시장 개장/폐장 알림 |
| 알림 채널 | 데스크탑 알림 (Electron Notification) |

### 4.5 사용자 인증
| 항목 | 설명 |
|------|------|
| 이메일/비밀번호 | 기본 이메일 회원가입/로그인 |
| Google 로그인 | Google OAuth 소셜 로그인 |
| 세션 관리 | 자동 로그인 유지, 토큰 갱신 |
| 프로필 | 사용자 이름, 프로필 이미지 |
| 보호 라우트 | 비로그인 사용자 접근 차단 |
| 데이터 격리 | 사용자별 포트폴리오/관심종목/알림 분리 |

---

## 5. Tech Stack

### Frontend
| 기술 | 선택 근거 |
|------|-----------|
| **React 18+** | 컴포넌트 기반 UI, 생태계 |
| **TypeScript** | 타입 안정성 |
| **Vite** | 빠른 빌드, HMR |
| **TailwindCSS** | 유틸리티 기반 스타일링, 반응형 |
| **Zustand** | 경량 상태 관리 |
| **TanStack Query** | 서버 상태 관리, 캐싱, 자동 refetch |
| **Recharts** | React 기반 차트 라이브러리 |
| **Electron** | 데스크탑 앱 패키징 |

### Firebase (BaaS - 별도 백엔드 불필요)
| 기술 | 선택 근거 |
|------|-----------|
| **Firebase Auth** | 무료 무제한 인증, Google/이메일 로그인, 검증된 보안 |
| **Cloud Firestore** | NoSQL DB, 실시간 동기화, 오프라인 캐시 지원 |
| **Cloud Functions** | API 키가 필요한 주식 API 프록시 (필요 시), 알림 트리거 |

### Data Sources (무료 API)
| 시장 | API | 특징 |
|------|-----|------|
| **미국 주식** | Yahoo Finance API (unofficial) | 실시간 시세, 히스토리컬 데이터 |
| **한국 주식** | KIS Developers Open API | 한국투자증권 무료 API (모의투자) |
| **환율** | Exchange Rate API | USD/KRW 실시간 환율 |
| **보조** | Alpha Vantage (Free tier) | 기술적 지표, 보조 데이터 |

---

## 6. Architecture

```
┌────────────────────────────────────────────────────┐
│                   Electron Shell                    │
│  ┌──────────────────────────────────────────────┐  │
│  │              React Frontend                   │  │
│  │                                               │  │
│  │  ┌────────┐ ┌─────────┐ ┌───────┐ ┌───────┐  │  │
│  │  │  Auth  │ │Dashboard│ │Portfo.│ │Charts │  │  │
│  │  │ Guard  │ │         │ │       │ │       │  │  │
│  │  └───┬────┘ └────┬────┘ └───┬───┘ └───┬───┘  │  │
│  │      │      ┌────┴──────────┴─────────┘       │  │
│  │      │      │  Zustand + TanStack Query        │  │
│  │      │      └────┬──────────────┐              │  │
│  │  ┌───┴───┐       │              │              │  │
│  │  │Firebase│  ┌────┴────┐  ┌─────┴─────┐       │  │
│  │  │Auth SDK│  │Stock API│  │ Firestore │       │  │
│  │  │       │  │ Client  │  │    SDK    │       │  │
│  │  └───┬───┘  └────┬────┘  └─────┬─────┘       │  │
│  └──────┼───────────┼─────────────┼──────────────┘  │
└─────────┼───────────┼─────────────┼──────────────────┘
          │           │             │
          ▼           ▼             ▼
  ┌───────────┐ ┌───────────┐ ┌─────────────────┐
  │ Firebase  │ │ Stock API │ │    Firebase      │
  │ Auth      │ │           │ │                  │
  │ (Google)  │ │Yahoo Fin  │ │ Cloud Firestore  │
  │           │ │KIS API    │ │ (portfolio,      │
  │           │ │Alpha Vant │ │  watchlist,      │
  │           │ │ExRate API │ │  alerts, tx)     │
  └───────────┘ └─────┬─────┘ └─────────────────┘
                      │
               ┌──────┴──────┐
               │ Cloud Funcs │ (선택적)
               │ API 키 보호  │
               │ 알림 트리거   │
               └─────────────┘
```

### 아키텍처 설명
- **별도 백엔드 서버 없음** — Firebase BaaS로 대체
- **Firebase Auth**: 프론트엔드에서 직접 인증 처리 (SDK)
- **Cloud Firestore**: 포트폴리오/관심종목/알림 데이터 저장, 실시간 동기화, 오프라인 캐시
- **주식 API**: 클라이언트에서 직접 호출 (CORS 허용 API), 또는 Cloud Functions 프록시
- **Cloud Functions (선택적)**: API 키 보호가 필요한 경우, 서버리스 함수로 프록시
- **Firestore Security Rules**: 사용자별 데이터 격리 (uid 기반 접근 제어)

---

## 7. Data Model (Firestore Collections)

### users/{uid}
```typescript
interface UserProfile {
  uid: string             // Firebase Auth UID
  email: string
  displayName: string
  photoURL?: string
  settings: {
    theme: 'light' | 'dark'
    language: 'ko' | 'en'
    defaultMarket: 'KRX' | 'US'
  }
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### users/{uid}/portfolio/{itemId}
```typescript
interface PortfolioItem {
  id: string
  symbol: string          // 티커 (AAPL, 005930)
  name: string            // 종목명
  market: 'KRX' | 'NYSE' | 'NASDAQ'
  currency: 'KRW' | 'USD'
  avgPrice: number        // 평균 매수가
  quantity: number         // 보유 수량
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### users/{uid}/transactions/{txId}
```typescript
interface Transaction {
  id: string
  symbol: string
  type: 'BUY' | 'SELL'
  price: number
  quantity: number
  fee: number             // 수수료
  currency: 'KRW' | 'USD'
  executedAt: Timestamp
}
```

### users/{uid}/watchlist/{itemId}
```typescript
interface WatchlistItem {
  id: string
  symbol: string
  name: string
  market: 'KRX' | 'NYSE' | 'NASDAQ'
  sortOrder: number
  addedAt: Timestamp
}
```

### users/{uid}/alerts/{alertId}
```typescript
interface Alert {
  id: string
  symbol: string
  name: string
  condition: 'ABOVE' | 'BELOW' | 'CHANGE_PCT'
  targetValue: number
  isActive: boolean
  triggeredAt?: Timestamp
  createdAt: Timestamp
}
```

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 본인 데이터만 읽기/쓰기 가능
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == uid;
    }
  }
}
```

---

## 8. Pages & UI Structure

### 8.1 대시보드 (메인)
- 포트폴리오 요약 카드 (총 자산, 총 수익률, 일간 변동)
- 관심 종목 실시간 시세 테이블
- 시장 현황 (코스피, 코스닥, S&P 500, 나스닥 지수)
- 최근 알림 목록

### 8.2 포트폴리오
- 보유 종목 리스트 (현재가, 수익률, 비중)
- 자산 배분 파이차트 (종목별, 시장별)
- 수익률 추이 라인 차트
- 매매 기록 등록/조회

### 8.3 종목 상세
- 실시간 시세 정보
- 캔들 차트 (기간 선택)
- 이동평균선, 거래량
- 매수/매도 기록 표시
- 알림 설정

### 8.4 검색
- 종목 검색 (자동완성)
- 최근 검색 기록
- 인기 종목

### 8.5 로그인/회원가입
- 이메일/비밀번호 회원가입
- Google 소셜 로그인 버튼
- 비밀번호 재설정
- 자동 로그인 유지

### 8.6 설정
- API 키 관리 (KIS API 등)
- 알림 설정
- 테마 (라이트/다크)
- 프로필 수정 (이름, 사진)
- 계정 관리 (비밀번호 변경, 로그아웃)
- 데이터 백업/복원

---

## 9. Non-Functional Requirements

| 항목 | 요구사항 |
|------|----------|
| **성능** | 시세 데이터 1초 이내 갱신, 앱 초기 로드 2초 이내 |
| **반응형** | 모바일 (360px) ~ 데스크탑 (1920px) 대응 |
| **오프라인** | Firestore 오프라인 캐시 활성화, 네트워크 복구 시 자동 동기화 |
| **보안** | Firebase Auth 토큰 관리, Firestore Security Rules, 민감 API 키는 Cloud Functions 보관 |
| **인증** | 이메일/Google 로그인, 세션 자동 갱신, 비로그인 접근 차단 |
| **접근성** | 키보드 네비게이션, 스크린리더 지원 |
| **국제화** | 한국어 기본, 영어 지원 준비 |

---

## 10. Implementation Phases

### Phase 1 - MVP (2주)
- [ ] 프로젝트 셋업 (React + Vite + TypeScript + Electron)
- [ ] Firebase 프로젝트 생성 및 SDK 연동
- [ ] Firebase Auth 구현 (이메일/Google 로그인)
- [ ] 보호 라우트 (AuthGuard) 구현
- [ ] Firestore 데이터 모델 및 Security Rules 설정
- [ ] 미국 주식 실시간 시세 조회 (Yahoo Finance)
- [ ] 한국 주식 시세 조회 (KIS API)
- [ ] 종목 검색 + 관심 종목 (Firestore 저장)
- [ ] 기본 포트폴리오 등록/조회 (Firestore 저장)
- [ ] 수익률 계산

### Phase 2 - 차트 & 분석 (1주)
- [ ] 캔들 차트 구현
- [ ] 이동평균선 오버레이
- [ ] 포트폴리오 비중 파이차트
- [ ] 수익률 추이 차트

### Phase 3 - 알림 & 고도화 (1주)
- [ ] 목표가/등락률 알림
- [ ] 데스크탑 Notification
- [ ] 환율 연동 원화 환산
- [ ] 매매 기록 관리
- [ ] 다크 모드

### Phase 4 - 안정화 (1주)
- [ ] 데이터 백업/복원
- [ ] 성능 최적화
- [ ] E2E 테스트
- [ ] Electron 빌드 및 배포

---

## 11. Risks & Mitigations

| 리스크 | 영향 | 완화 방안 |
|--------|------|-----------|
| Yahoo Finance API 비공식 → 차단 가능 | 미국 주식 데이터 중단 | Alpha Vantage 등 대체 API 준비 |
| KIS API 일일 호출 제한 | 실시간성 저하 | 캐싱 + 폴링 간격 조절 (5초) |
| 무료 API 지연 데이터 (15분) | 실시간성 부족 | 사용자에게 지연 표시, WebSocket 지원 API 탐색 |
| Electron 앱 용량 | 배포 파일 크기 | 불필요한 의존성 제거, 빌드 최적화 |
| Firebase 무료 티어 제한 | Firestore 읽기/쓰기 제한 초과 | 클라이언트 캐싱, 배치 쿼리, 오프라인 모드 활용 |
| Firebase vendor lock-in | 마이그레이션 어려움 | 서비스 레이어 추상화로 DB 교체 가능하게 설계 |

---

## 12. Success Metrics

| 지표 | 목표 |
|------|------|
| 앱 초기 로드 시간 | < 2초 |
| 시세 데이터 갱신 주기 | ≤ 5초 (무료 API 제약) |
| 포트폴리오 수익률 정확도 | 오차 0.1% 이내 |
| 데스크탑 앱 메모리 사용 | < 300MB |
| 테스트 커버리지 | ≥ 80% |
