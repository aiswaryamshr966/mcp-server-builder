import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const generatedDir = path.join(root, 'generated-servers');

function run(cmd, args, opts = {}) {
  const cwd = opts.cwd || process.cwd();
  console.log(`\n> ${cmd} ${args.join(' ')} (cwd=${cwd})`);
  // Use shell:true to allow Windows to resolve npm/npx correctly
  const res = spawnSync(cmd, args, { stdio: 'inherit', cwd, shell: true, windowsHide: true });
  return res.status === 0;
}

async function main() {
  console.log('Regenerate & test starting from root:', root);
  if (!fs.existsSync(generatedDir)) {
    console.error('No generated-servers directory found at', generatedDir);
    process.exit(2);
  }
  const entries = fs.readdirSync(generatedDir, { withFileTypes: true }).filter(e => e.isDirectory()).map(d => d.name);
  if (entries.length === 0) {
    console.log('No generated servers found.');
    return;
  }

  const summary = [];
  for (const name of entries) {
    const dir = path.join(generatedDir, name);
    console.log('\n=== Testing generated server:', name, '===');

    const pkg = path.join(dir, 'package.json');
    const testClient = path.join(dir, 'test-client.mjs');
    if (!fs.existsSync(pkg)) {
      console.warn('  SKIP: no package.json found in', dir);
      summary.push({ name, status: 'skipped', reason: 'no package.json' });
      continue;
    }
    if (!fs.existsSync(testClient)) {
      console.warn('  SKIP: no test-client.mjs found in', dir);
      summary.push({ name, status: 'skipped', reason: 'no test-client.mjs' });
      continue;
    }

    // npm install
    const okInstall = run('npm', ['install', '--no-audit', '--no-fund'], { cwd: dir });
    if (!okInstall) { summary.push({ name, status: 'install_failed' }); continue; }

    // npm run build
    const okBuild = run('npm', ['run', 'build'], { cwd: dir });
    if (!okBuild) { summary.push({ name, status: 'build_failed' }); continue; }

    // run test client
    console.log('  Running smoke test...');
    const res = spawnSync(process.execPath, ['test-client.mjs'], { cwd: dir, encoding: 'utf8' , timeout: 15000, shell: false });
    const passed = res.status === 0;
    console.log('  test-client stdout:\n', res.stdout || '(none)');
    console.error('  test-client stderr:\n', res.stderr || '(none)');
    summary.push({ name, status: passed ? 'ok' : 'test_failed', exitCode: res.status });
  }

  console.log('\n=== Summary ===');
  for (const s of summary) console.log(s.name.padEnd(20), s.status, s.reason ? ('- ' + s.reason) : (s.exitCode !== undefined ? '(exit ' + s.exitCode + ')' : ''));

  const anyFail = summary.some(s => s.status !== 'ok' && s.status !== 'skipped');
  process.exit(anyFail ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(2); });
