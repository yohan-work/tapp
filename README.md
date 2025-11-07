# PWA Upgrader

도메인을 PWA(Progressive Web App)로 전환하는 필수 파일과 가이드를 자동 생성

```bash
npx pwa-upgrader --url https://example.com --name "My App"
```

```bash
npm install -g pwa-upgrader

pwa-upgrader --url https://example.com --name "My App"
```

### 기본 사용

```bash
npx pwa-upgrader \
  --url https://example.com \
  --name "Example App" \
  --theme "#0ea5e9"
```

### 모든 옵션

```bash
npx pwa-upgrader \
  --url https://example.com \      # 대상 URL (필수)
  --name "My PWA" \                # 앱 이름
  --short "PWA" \                  # 짧은 이름 (홈 화면용)
  --theme "#0ea5e9" \              # 테마 컬러 (hex)
  --scope "/" \                    # PWA 범위
  --start "/" \                    # 시작 URL
  --icon ./my-icon.png \           # 사용자 아이콘 경로 (512x512 권장)
  --output ./my-pwa \              # 출력 디렉토리
  --workbox \                      # Workbox 사용 (고급 캐싱)
  --report                         # Lighthouse 리포트 생성
```

## 생성 파일

```
pwa-output/
├─ public/
│  ├─ manifest.json        # PWA 매니페스트
│  ├─ sw.js                # Service Worker
│  ├─ offline.html         # 오프라인 페이지
│  └─ icons/
│     ├─ icon-192.png      # 192x192 아이콘
│     └─ icon-512.png      # 512x512 아이콘
├─ docs/
│  ├─ head-snippet.html    # <head>에 추가할 코드
│  ├─ apple-meta.html      # iOS 메타 태그 가이드
│  └─ twa.md               # Android TWA 가이드
├─ lighthouse/             # --report 옵션 사용 시
│  ├─ report.html
│  ├─ report.json
│  └─ checklist.md
└─ README.md               # 적용 가이드
```

### 1. 파일 업로드

생성된 `public/` 디렉토리의 파일들을 웹사이트 루트에 업로드:

```
public/manifest.json  → https://your-domain.com/manifest.json
public/sw.js          → https://your-domain.com/sw.js
public/offline.html   → https://your-domain.com/offline.html
public/icons/*        → https://your-domain.com/icons/*
```

### 2. HTML 수정

`docs/head-snippet.html`의 내용을 웹사이트 `<head>` 섹션에 추가:

```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#0ea5e9" />
<!-- ... 나머지 코드 ... -->
```

### 3. HTTPS 설정

PWA는 HTTPS 환경에서만 동작합니다 (localhost 제외).

### 4. 테스트

- **설치 테스트**: Chrome 주소창의 설치 아이콘(⊕) 클릭
- **오프라인 테스트**: DevTools에서 네트워크 오프라인 설정 후 새로고침
- **Lighthouse**: DevTools → Lighthouse → PWA 카테고리 실행

### 예시 1: 기본 PWA 생성

```bash
npx pwa-upgrader \
  --url https://mysite.com \
  --name "MySite App"
```

### 예시 2: 커스텀 아이콘 사용

```bash
npx pwa-upgrader \
  --url https://mysite.com \
  --name "MySite App" \
  --icon ./logo.png \
  --theme "#ff6b6b"
```

### 예시 3: Workbox + Lighthouse 리포트

```bash
npx pwa-upgrader \
  --url https://mysite.com \
  --name "MySite App" \
  --workbox \
  --report
```

## Platform Guide

### iOS (Safari)

1. Safari에서 사이트 열기
2. 공유 버튼(↑) 탭
3. "홈 화면에 추가" 선택

**제한사항:**

- Safari에서만 설치 가능
- Push Notification 제한적
- 저장 공간 제한 (50MB 권장)

### Android (Chrome)

1. Chrome에서 사이트 열기
2. 메뉴(⋮) → "홈 화면에 추가"

**TWA로 Google Play 배포:**
`docs/twa.md` 참고

## 요구사항

- **Node.js**: 18.0.0 이상
- **HTTPS**: 프로덕션 환경에서 필수
- **브라우저**: Chrome 72+, Safari 16.4+

## 추가 리소스

- [PWA 공식 가이드](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Workbox](https://developers.google.com/web/tools/workbox)
