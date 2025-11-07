#!/bin/bash

# iOS PWA 테스트를 위한 간단한 스크립트

echo "iOS PWA 테스트 준비 중..."
echo ""

# 1. 로컬 IP 주소 확인
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

if [ -z "$LOCAL_IP" ]; then
  echo "로컬 IP를 찾을 수 없습니다."
  exit 1
fi

echo "📍 Mac 로컬 IP: $LOCAL_IP"
echo ""

# 2. pwa-output 디렉토리 확인
if [ ! -d "pwa-output/public" ]; then
  echo "pwa-output/public 디렉토리가 없습니다."
  echo "   먼저 PWA 파일을 생성하세요:"
  echo "   node dist/cli.js --url https://example.com --name 'Test App'"
  exit 1
fi

echo "PWA 파일 확인됨"
echo ""

# 3. 방법 선택
echo "iOS 테스트 방법을 선택하세요:"
echo ""
echo "1) ngrok 사용 (권장 - HTTPS 자동 제공)"
echo "2) 로컬 IP 직접 접근 (HTTP - PWA 기능 제한적)"
echo "3) localtunnel 사용 (무료 대안)"
echo ""
read -p "선택 (1-3): " choice

case $choice in
  1)
    echo ""
    echo "ngrok으로 터널링 시작..."
    echo ""
    echo "다른 터미널에서 다음 명령을 실행하세요:"
    echo "  cd $(pwd)"
    echo "  npx serve pwa-output/public -p 3000"
    echo ""
    read -p "서버 준비 완료 후 Enter를 누르세요..."
    
    if ! command -v ngrok &> /dev/null; then
      echo ""
      echo "ngrok이 설치되지 않았습니다."
      echo "   설치: brew install ngrok"
      echo "   또는: https://ngrok.com/download"
      exit 1
    fi
    
    echo ""
    echo "🔗 ngrok 터널 생성 중..."
    echo "   Ctrl+C로 종료하세요"
    echo ""
    ngrok http 3000
    ;;
    
  2)
    echo ""
    echo "📡 로컬 서버 시작..."
    echo ""
    echo "iPhone에서 다음 URL로 접속하세요:"
    echo ""
    echo "  http://$LOCAL_IP:3000"
    echo ""
    echo "주의: HTTP이므로 일부 PWA 기능이 제한될 수 있습니다."
    echo "   (Service Worker는 HTTPS 필수)"
    echo ""
    npx serve pwa-output/public -p 3000
    ;;
    
  3)
    echo ""
    echo "localtunnel로 터널링 시작..."
    echo ""
    echo "다른 터미널에서 다음 명령을 실행하세요:"
    echo "  cd $(pwd)"
    echo "  npx serve pwa-output/public -p 3000"
    echo ""
    read -p "서버 준비 완료 후 Enter를 누르세요..."
    
    echo ""
    echo "localtunnel 생성 중..."
    echo ""
    npx localtunnel --port 3000
    ;;
    
  *)
    echo "잘못된 선택입니다."
    exit 1
    ;;
esac

