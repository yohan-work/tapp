# Android TWA (Trusted Web Activity) 가이드

PWA를 Google Play 스토어에 배포하려면 **TWA (Trusted Web Activity)**로 패키징할 수 있습니다.

TWA는 Chrome 브라우저 탭을 전체 화면으로 표시하는 방식으로, 별도의 네이티브 코드 없이 PWA를 앱처럼 실행할 수 있습니다.

---

## TWA

**Trusted Web Activity**

- PWA를 Android 앱으로 패키징하는 기술
- Chrome Custom Tabs 기반으로 동작
- 주소창 없는 전체 화면 브라우저 경험
- Google Play 스토어 배포 가능
- 도메인 소유권 검증 필요

---

## Bubblewrap으로 TWA 생성

### 1. Bubblewrap 설치

```bash
npm install -g @bubblewrap/cli
```

### 2. TWA 프로젝트 초기화

```bash
bubblewrap init --manifest https://YOUR_DOMAIN/manifest.json
```

대화형 프롬프트에서 다음 정보를 입력하세요:

- **Application Name**: 앱 이름
- **Package ID**: 고유한 패키지 ID (예: com.example.myapp)
- **Host**: 도메인 (예: example.com)
- **Start URL**: 시작 경로 (예: /)
- **Theme Color**: 테마 컬러
- **Background Color**: 배경 컬러
- **Icon URL**: 512x512 아이콘 URL
- **Maskable Icon URL**: Maskable 아이콘 URL (선택)
- **Splash Screen**: 스플래시 스크린 사용 여부

### 3. Android 개발 환경 설정 (필수)

TWA 빌드를 위해서는 Android SDK가 필요합니다:

```bash
# Android Studio 설치
# https://developer.android.com/studio

# 또는 command-line tools만 설치
# https://developer.android.com/studio#command-tools
```

**환경 변수 설정:**

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
export ANDROID_HOME=$HOME/Android/Sdk          # Linux
export ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk # Windows

export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### 4. 서명 키 생성

APK 서명을 위한 키스토어 파일 생성:

```bash
keytool -genkey -v -keystore my-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias my-key-alias
```

입력 정보:

- Keystore password (키스토어 비밀번호)
- Name (이름)
- Organization (조직)
- City/Location (도시)
- State (주/도)
- Country Code (국가 코드)

**중요: 키스토어 파일과 비밀번호를 안전하게 보관하세요!**

### 5. 빌드

```bash
bubblewrap build
```

빌드가 완료되면 `app-release-signed.apk` 또는 `app-release-bundle.aab` 파일이 생성됩니다.

---

## Digital Asset Links 설정

TWA가 도메인과 앱을 연결하려면 **Digital Asset Links**를 설정해야 합니다.

### 1. SHA-256 지문 확인

키스토어의 SHA-256 지문을 확인:

```bash
keytool -list -v -keystore my-release-key.jks -alias my-key-alias
```

출력에서 `SHA256` 값을 복사하세요 (콜론 제거):

```
SHA256: 14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5
→ 14:6D:E9:... (콜론 포함) 또는
→ 146DE983C5730650... (콜론 제거)
```

### 2. assetlinks.json 파일 생성

웹사이트 루트의 `.well-known` 디렉토리에 파일 생성:

```
https://YOUR_DOMAIN/.well-known/assetlinks.json
```

**파일 내용:**

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.example.myapp",
      "sha256_cert_fingerprints": [
        "14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5"
      ]
    }
  }
]
```

**주의사항:**

- `package_name`: 앱의 패키지 ID
- `sha256_cert_fingerprints`: 위에서 확인한 SHA-256 지문 (콜론 포함)
- HTTPS로 접근 가능해야 함
- `Content-Type: application/json` 헤더 필요

### 3. 검증

```bash
# Android Debug Bridge로 확인
adb shell pm get-app-links com.example.myapp

# 또는 온라인 검증 도구 사용
# https://developers.google.com/digital-asset-links/tools/generator
```

---

## Google Play 스토어 배포

### 1. Google Play Console 계정 생성

[Google Play Console](https://play.google.com/console)에서 개발자 계정 등록 (25달러 일회성 수수료)

### 2. 앱 생성

1. "Create app" 클릭
2. 앱 정보 입력 (이름, 언어, 카테고리 등)
3. 스토어 등록 정보 작성:
   - 앱 설명 (짧은/긴 설명)
   - 스크린샷 (최소 2개)
   - 아이콘 (512x512)
   - 기능 그래픽 (1024x500)

### 3. 앱 업로드

**APK 방식:**

```bash
# APK 파일 업로드
# app-release-signed.apk
```

**AAB 방식 (권장):**

```bash
# AAB (Android App Bundle) 파일 업로드
# app-release-bundle.aab
```

AAB는 Google이 각 기기에 최적화된 APK를 생성하므로 더 효율적입니다.

### 4. 콘텐츠 등급

"Content rating" 섹션에서 설문 작성

### 5. 검토 제출

모든 정보를 입력한 후 "Submit for review" 클릭

검토 기간: 보통 1-3일

---

## 업데이트

PWA를 업데이트하면:

1. **웹 콘텐츠**: 자동 업데이트 (Service Worker 캐시)
2. **Manifest 변경**: TWA 재빌드 및 재배포 필요

새 버전 배포:

```bash
# 1. version code/name 증가 (twa-manifest.json)
# 2. 재빌드
bubblewrap build

# 3. Google Play Console에 업로드
```

---

## 고급 설정

### Custom Splash Screen

`twa-manifest.json` 수정:

```json
{
  "splashScreenFadeOutDuration": 300,
  "enableNotifications": true,
  "isChromeOSOnly": false
}
```

### 알림 권한

TWA는 자동으로 웹 푸시 알림을 지원합니다. 추가 설정 불필요.

### 위치 권한

AndroidManifest.xml에 권한 추가 (bubblewrap이 자동 처리)

---

## 최소 요구사항

- **Android 버전**: Android 5.0 (API 21) 이상
- **Chrome 버전**: Chrome 72 이상 설치 필요
- **도메인**: HTTPS 필수
- **PWA**: Installability 기준 통과

---

## 문제 해결

### TWA가 브라우저 탭으로 열림

- `assetlinks.json` 파일 확인
- SHA-256 지문이 정확한지 확인
- HTTPS로 접근 가능한지 확인
- 패키지 이름이 일치하는지 확인

### 빌드 실패

```bash
# Android SDK 경로 확인
echo $ANDROID_HOME

# SDK 도구 업데이트
sdkmanager --update
```

### 서명 오류

- 키스토어 파일 경로 확인
- 비밀번호 확인
- 키스토어 유효성 확인

---

## 참고 자료

- [Bubblewrap 공식 문서](https://github.com/GoogleChromeLabs/bubblewrap)
- [TWA 개발 가이드](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [Digital Asset Links](https://developers.google.com/digital-asset-links)
- [Google Play Console](https://play.google.com/console)

---

## 팁

1. **테스트**: Google Play의 "Internal testing" 트랙을 사용하여 소수의 테스터에게 먼저 배포
2. **분석**: Google Play Console의 분석 도구로 설치/사용 통계 확인
3. **업데이트**: PWA는 자동 업데이트되지만, manifest 변경 시 앱 재배포 필요
4. **최적화**: Lighthouse PWA 점수 100점을 목표로 최적화

---
