// ============================================================================
// Member 4 - Master Test Suite Runner
// Executes Phase 1 to Phase 5 End-to-End Test Suites
// ============================================================================

import { spawn } from 'child_process';
import path from 'path';

const testFiles = [
  'tests/phase1.test.ts',
  'tests/phase2.test.ts',
  'tests/phase3.test.ts',
  'tests/phase4.test.ts',
  'tests/phase5.test.ts',
];

async function runCommand(file: string): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`\n======================================================`);
    console.log(`EXECUTING: ${file}`);
    console.log(`======================================================`);

    const child = spawn('npx', ['-y', 'tsx', file], {
      stdio: 'inherit',
      shell: true,
      cwd: path.resolve(__dirname, '..'),
    });

    child.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

async function runAll() {
  console.log('🚀 STARTING REVIVEX MEMBER 4 FULL SUITE VALIDATION...\n');
  const results: { file: string; success: boolean }[] = [];

  for (const file of testFiles) {
    const success = await runCommand(file);
    results.push({ file, success });
  }

  console.log('\n======================================================');
  console.log('🏁 FINAL TEST SUMMARY');
  console.log('======================================================');
  let allPassed = true;
  for (const res of results) {
    const statusText = res.success ? 'PASSED ✅' : 'FAILED ❌';
    console.log(`  - ${res.file}: ${statusText}`);
    if (!res.success) allPassed = false;
  }

  if (allPassed) {
    console.log('\n🎉 ALL 5 PHASES PASSED VALIDATION WITH ZERO ERRORS!\n');
    process.exit(0);
  } else {
    console.error('\n❌ SOME PHASES FAILED VALIDATION.\n');
    process.exit(1);
  }
}

runAll();
