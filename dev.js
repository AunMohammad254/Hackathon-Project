const { spawn } = require('child_process');
const path = require('path');

// shell: true removed — fixes Node.js DEP0190 deprecation warning.
// On Windows, we spawn via 'cmd' explicitly to keep cross-platform compatibility.
const isWindows = process.platform === 'win32';
const shell = isWindows ? 'cmd' : '/bin/sh';
const shellFlag = isWindows ? '/c' : '-c';

const frontend = spawn(shell, [shellFlag, 'bun run dev'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit',
});

const backend = spawn(shell, [shellFlag, 'bun run dev'], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit',
});

process.on('SIGINT', () => {
    frontend.kill();
    backend.kill();
    process.exit();
});

frontend.on('exit', (code) => {
    console.log(`[frontend] exited with code ${code}`);
    backend.kill();
    process.exit(code);
});

backend.on('exit', (code) => {
    console.log(`[backend] exited with code ${code}`);
    frontend.kill();
    process.exit(code);
});
