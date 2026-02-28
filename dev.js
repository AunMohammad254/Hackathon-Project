const { spawn } = require('child_process');
const path = require('path');

const frontend = spawn('bun', ['run', 'dev'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit',
    shell: true
});

const backend = spawn('bun', ['run', 'dev'], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit',
    shell: true
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
