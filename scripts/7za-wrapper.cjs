#!/usr/bin/env node
// 7za 래퍼: exit code 2 (경고/비치명적 오류)를 0으로 변환
// Windows에서 macOS 심볼릭 링크 생성 불가 오류를 무시하기 위함
const { spawnSync } = require('child_process')
const path = require('path')

const SEVEN_ZIP = path.join(__dirname, '..', 'node_modules', '7zip-bin', 'win', 'x64', '7za.exe')
const args = process.argv.slice(2)

const result = spawnSync(SEVEN_ZIP, args, { stdio: 'inherit', shell: false })

// 7zip exit codes: 0=성공, 1=경고, 2=치명적 오류
// 심볼릭 링크 생성 실패는 exit 2이지만, 나머지 파일은 정상 추출됨
// rcedit.exe 등 실제 필요한 파일은 정상이므로 exit 0으로 변환
const exitCode = result.status != null ? result.status : 1
process.exit(exitCode === 2 ? 0 : exitCode)
