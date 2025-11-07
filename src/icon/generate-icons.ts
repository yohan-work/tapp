#!/usr/bin/env node

/**
 * 아이콘 생성 유틸리티
 * base.png를 다양한 크기로 리사이징하여 PWA 아이콘 생성
 */

import sharp from 'sharp';
import { mkdir, access, constants } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 아이콘 크기 정의
const ICON_SIZES = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' }
];

/**
 * 기본 아이콘 생성 (사용자 제공 아이콘이 없을 경우)
 * 512x512 단색 배경 + 앱 이니셜
 */
async function createBaseIcon(outputPath: string, appInitial: string = 'P', themeColor: string = '#0ea5e9') {
  const size = 512;
  const fontSize = 280;
  
  // SVG로 텍스트 아이콘 생성
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${themeColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#667eea;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#grad)" rx="100"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${fontSize}" 
            font-weight="bold" fill="white" text-anchor="middle" dy=".35em">
        ${appInitial.toUpperCase()}
      </text>
    </svg>
  `;
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);
  
  console.log(`✓ 기본 아이콘 생성: ${outputPath}`);
}

/**
 * 아이콘 리사이징
 */
async function resizeIcon(
  inputPath: string,
  outputPath: string,
  size: number
) {
  await sharp(inputPath)
    .resize(size, size, {
      fit: 'cover',
      position: 'center'
    })
    .png()
    .toFile(outputPath);
  
  console.log(`✓ 아이콘 생성: ${outputPath} (${size}x${size})`);
}

/**
 * 메인 실행 함수
 */
export async function generateIcons(options: {
  inputIcon?: string;
  outputDir: string;
  appName?: string;
  themeColor?: string;
}) {
  const {
    inputIcon,
    outputDir,
    appName = 'PWA',
    themeColor = '#0ea5e9'
  } = options;
  
  try {
    // 출력 디렉토리 생성
    await mkdir(outputDir, { recursive: true });
    
    // 입력 아이콘 경로 결정
    let sourceIcon = inputIcon;
    
    // 사용자 제공 아이콘이 없으면 기본 아이콘 생성
    if (!sourceIcon) {
      const appInitial = appName.charAt(0);
      sourceIcon = join(outputDir, 'base-temp.png');
      await createBaseIcon(sourceIcon, appInitial, themeColor);
    } else {
      // 사용자 제공 아이콘 존재 확인
      try {
        await access(sourceIcon, constants.R_OK);
      } catch {
        throw new Error(`아이콘 파일을 찾을 수 없습니다: ${sourceIcon}`);
      }
    }
    
    // 다양한 크기로 리사이징
    for (const { size, name } of ICON_SIZES) {
      const outputPath = join(outputDir, name);
      await resizeIcon(sourceIcon, outputPath, size);
    }
    
    // 임시 파일 정리 (기본 아이콘을 생성한 경우)
    if (!inputIcon && sourceIcon) {
      const { unlink } = await import('fs/promises');
      try {
        await unlink(sourceIcon);
      } catch {
        // 무시
      }
    }
    
    console.log('\n✅ 아이콘 생성 완료!');
    console.log(`   출력 디렉토리: ${outputDir}`);
    
  } catch (error) {
    console.error('❌ 아이콘 생성 실패:', error);
    throw error;
  }
}

// CLI로 직접 실행되는 경우
if (import.meta.url === `file://${process.argv[1]}`) {
  const outputDir = process.argv[2] || join(process.cwd(), 'pwa-output/public/icons');
  const appName = process.argv[3] || 'PWA';
  const themeColor = process.argv[4] || '#0ea5e9';
  
  generateIcons({ outputDir, appName, themeColor })
    .catch(() => process.exit(1));
}

