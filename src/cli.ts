#!/usr/bin/env node

/**
 * PWA Upgrader CLI
 * 도메인을 PWA로 전환하는 필수 파일과 가이드를 자동 생성
 */

import { Command } from 'commander';
import Handlebars from 'handlebars';
import { readFile, writeFile, mkdir, copyFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateIcons } from './icon/generate-icons.js';
import { runLighthouse, generateChecklist } from './lighthouse/run-lh.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CLI 버전
const VERSION = '1.0.0';

// 템플릿 디렉토리 경로
const TEMPLATES_DIR = join(__dirname, 'templates');

/**
 * URL 검증
 */
function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * 템플릿 렌더링
 */
async function renderTemplate(templatePath: string, data: any): Promise<string> {
  const templateContent = await readFile(templatePath, 'utf-8');
  const template = Handlebars.compile(templateContent);
  return template(data);
}

/**
 * PWA 파일 생성
 */
async function generatePWAFiles(options: {
  url: string;
  name: string;
  short?: string;
  theme: string;
  scope: string;
  start: string;
  workbox: boolean;
  report: boolean;
  icon?: string;
  outputDir: string;
}) {
  const {
    url,
    name,
    short = name.substring(0, 12),
    theme,
    scope,
    start,
    workbox,
    report,
    icon,
    outputDir
  } = options;
  
  console.log('\n🚀 PWA Upgrader 시작\n');
  console.log(`   대상 URL: ${url}`);
  console.log(`   앱 이름: ${name}`);
  console.log(`   출력 디렉토리: ${outputDir}\n`);
  
  // 템플릿 데이터
  const templateData = {
    url,
    appName: name,
    shortName: short,
    themeColor: theme,
    scope,
    startUrl: start,
    cacheName: `${name.toLowerCase().replace(/\s+/g, '-')}-v1`,
    generatedDate: new Date().toISOString(),
    publicDir: join(outputDir, 'public'),
    hasLighthouse: report
  };
  
  try {
    // 1. 디렉토리 구조 생성
    console.log('📁 디렉토리 생성 중...');
    const dirs = [
      join(outputDir, 'public'),
      join(outputDir, 'public', 'icons'),
      join(outputDir, 'docs')
    ];
    
    if (report) {
      dirs.push(join(outputDir, 'lighthouse'));
    }
    
    for (const dir of dirs) {
      await mkdir(dir, { recursive: true });
    }
    console.log('   ✓ 디렉토리 생성 완료\n');
    
    // 2. Manifest 생성
    console.log('📄 Manifest 생성 중...');
    const manifestContent = await renderTemplate(
      join(TEMPLATES_DIR, 'manifest.json.hbs'),
      templateData
    );
    await writeFile(
      join(outputDir, 'public', 'manifest.json'),
      manifestContent
    );
    console.log('   ✓ manifest.json 생성 완료\n');
    
    // 3. Service Worker 생성
    console.log('⚙️  Service Worker 생성 중...');
    if (workbox) {
      // Workbox 설정 파일 생성
      const workboxConfigContent = await renderTemplate(
        join(TEMPLATES_DIR, 'workbox-config.js.hbs'),
        templateData
      );
      await writeFile(
        join(outputDir, 'workbox-config.js'),
        workboxConfigContent
      );
      console.log('   ✓ workbox-config.js 생성 완료');
      console.log('   ℹ️  Workbox SW 생성: workbox generateSW workbox-config.js 실행 필요');
    } else {
      // 기본 Service Worker
      const swContent = await renderTemplate(
        join(TEMPLATES_DIR, 'sw-basic.js.hbs'),
        templateData
      );
      await writeFile(
        join(outputDir, 'public', 'sw.js'),
        swContent
      );
      console.log('   ✓ sw.js 생성 완료');
    }
    console.log('');
    
    // 4. 오프라인 페이지 생성
    console.log('📱 오프라인 페이지 생성 중...');
    const offlineContent = await renderTemplate(
      join(TEMPLATES_DIR, 'sw-offline.html'),
      templateData
    );
    await writeFile(
      join(outputDir, 'public', 'offline.html'),
      offlineContent
    );
    console.log('   ✓ offline.html 생성 완료\n');
    
    // 5. 아이콘 생성
    console.log('🎨 아이콘 생성 중...');
    await generateIcons({
      inputIcon: icon,
      outputDir: join(outputDir, 'public', 'icons'),
      appName: name,
      themeColor: theme
    });
    console.log('');
    
    // 6. HTML 스니펫 생성
    console.log('📝 HTML 스니펫 생성 중...');
    const headSnippetContent = await renderTemplate(
      join(TEMPLATES_DIR, 'head-snippet.html'),
      templateData
    );
    await writeFile(
      join(outputDir, 'docs', 'head-snippet.html'),
      headSnippetContent
    );
    
    const appleMetaContent = await renderTemplate(
      join(TEMPLATES_DIR, 'apple-meta.html'),
      templateData
    );
    await writeFile(
      join(outputDir, 'docs', 'apple-meta.html'),
      appleMetaContent
    );
    console.log('   ✓ head-snippet.html 생성 완료');
    console.log('   ✓ apple-meta.html 생성 완료\n');
    
    // 7. README 생성
    console.log('📚 README 생성 중...');
    const readmeContent = await renderTemplate(
      join(TEMPLATES_DIR, 'README.md.hbs'),
      templateData
    );
    await writeFile(
      join(outputDir, 'README.md'),
      readmeContent
    );
    console.log('   ✓ README.md 생성 완료\n');
    
    // 8. Lighthouse 리포트 (옵션)
    if (report) {
      console.log('🔍 Lighthouse 리포트 생성 중...');
      try {
        const result = await runLighthouse({
          url,
          outputDir: join(outputDir, 'lighthouse')
        });
        
        // 체크리스트 생성
        const checklist = generateChecklist(result.lhr);
        await writeFile(
          join(outputDir, 'lighthouse', 'checklist.md'),
          checklist
        );
        console.log('');
      } catch (error) {
        console.log('   ⚠️  Lighthouse 리포트 생성 실패 (선택적 기능)');
        console.log(`   오류: ${error}`);
        console.log('');
      }
    }
    
    // 9. 완료 메시지
    console.log('✅ PWA 파일 생성 완료!\n');
    console.log('📦 생성된 파일:');
    console.log(`   ${outputDir}/`);
    console.log(`   ├─ public/`);
    console.log(`   │  ├─ manifest.json`);
    console.log(`   │  ├─ ${workbox ? '(sw.js - workbox로 생성 필요)' : 'sw.js'}`);
    console.log(`   │  ├─ offline.html`);
    console.log(`   │  └─ icons/`);
    console.log(`   │     ├─ icon-192.png`);
    console.log(`   │     └─ icon-512.png`);
    console.log(`   ├─ docs/`);
    console.log(`   │  ├─ head-snippet.html`);
    console.log(`   │  └─ apple-meta.html`);
    if (report) {
      console.log(`   ├─ lighthouse/`);
      console.log(`   │  ├─ report.html`);
      console.log(`   │  ├─ report.json`);
      console.log(`   │  └─ checklist.md`);
    }
    console.log(`   └─ README.md`);
    console.log('');
    console.log('📖 다음 단계:');
    console.log(`   1. ${outputDir}/README.md 파일을 확인하세요`);
    console.log(`   2. public/ 디렉토리의 파일들을 웹사이트 루트에 업로드하세요`);
    console.log(`   3. docs/head-snippet.html의 내용을 <head>에 추가하세요`);
    console.log(`   4. 설치 및 오프라인 동작을 테스트하세요`);
    console.log('');
    
  } catch (error) {
    console.error('\n❌ 오류 발생:', error);
    throw error;
  }
}

/**
 * CLI 프로그램
 */
const program = new Command();

program
  .name('pwa-upgrader')
  .description('도메인을 PWA로 전환하는 필수 파일과 가이드를 자동 생성')
  .version(VERSION);

program
  .requiredOption('--url <url>', '대상 도메인 URL (필수)')
  .option('--name <name>', '앱 이름', 'My PWA')
  .option('--short <short>', '짧은 앱 이름 (홈 화면용)')
  .option('--theme <color>', '테마 컬러 (hex)', '#0ea5e9')
  .option('--scope <path>', 'PWA 범위', '/')
  .option('--start <path>', '시작 URL', '/')
  .option('--workbox', 'Workbox 사용 (고급 캐싱)', false)
  .option('--report', 'Lighthouse 리포트 생성', false)
  .option('--icon <path>', '사용자 아이콘 경로 (512x512 권장)')
  .option('--output <dir>', '출력 디렉토리', 'pwa-output')
  .action(async (opts) => {
    // URL 검증
    if (!validateUrl(opts.url)) {
      console.error('❌ 오류: 유효하지 않은 URL 형식입니다.');
      console.error('   예시: https://example.com');
      process.exit(1);
    }
    
    // 테마 컬러 검증
    if (!/^#[0-9A-Fa-f]{6}$/.test(opts.theme)) {
      console.error('❌ 오류: 유효하지 않은 테마 컬러 형식입니다.');
      console.error('   예시: #0ea5e9');
      process.exit(1);
    }
    
    try {
      await generatePWAFiles({
        url: opts.url,
        name: opts.name,
        short: opts.short,
        theme: opts.theme,
        scope: opts.scope,
        start: opts.start,
        workbox: opts.workbox,
        report: opts.report,
        icon: opts.icon,
        outputDir: opts.output
      });
    } catch (error) {
      process.exit(1);
    }
  });

program.parse();

