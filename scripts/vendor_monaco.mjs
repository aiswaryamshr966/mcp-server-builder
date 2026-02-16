import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const target = path.join(root, 'src', 'main', 'resources', 'static', 'vendor', 'monaco');

console.log('This script will vendor Monaco Editor into:', target);

// Make sure target directory exists
fs.mkdirSync(target, { recursive: true });

// Create a temporary working directory
const tmp = path.join(root, '.tmp_monaco_install');
if (fs.existsSync(tmp)) {
  fs.rmSync(tmp, { recursive: true, force: true });
}
fs.mkdirSync(tmp, { recursive: true });

console.log('Installing monaco-editor into temporary folder (this will use npm)...');
const install = spawnSync('npm', ['install', 'monaco-editor@0.33.0', '--no-audit', '--no-fund'], { cwd: tmp, stdio: 'inherit', shell: true });
if (install.status !== 0) {
  console.error('npm install failed. Ensure npm is available and you have network access.');
  process.exit(1);
}

const src = path.join(tmp, 'node_modules', 'monaco-editor', 'min');
if (!fs.existsSync(src)) {
  console.error('Installed monaco-editor not found at', src);
  process.exit(1);
}

// Copy 'min' to target/min
const dest = path.join(target, 'min');
console.log('Copying', src, '->', dest);
// Node 16+ supports fs.cp
try {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
  console.log('Monaco vendored successfully. You can now load Monaco from /vendor/monaco/min/vs');
} catch (e) {
  console.error('Failed to copy files:', e);
  process.exit(1);
} finally {
  // cleanup
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {}
}

console.log('Done.');
