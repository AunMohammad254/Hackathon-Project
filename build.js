const { spawn } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const shell = isWindows ? 'cmd' : '/bin/sh';
const shellFlag = isWindows ? '/c' : '-c';

function runScript(script, cwd) {
    return new Promise((resolve, reject) => {
        console.log(`\n▶ Running "${script}" in ./${path.relative(process.cwd(), cwd)}`);
        const proc = spawn(shell, [shellFlag, `bun run ${script}`], {
            cwd,
            stdio: 'inherit',
        });
        proc.on('exit', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`"${script}" failed with exit code ${code}`));
        });
    });
}

(async () => {
    try {
        await runScript('build', path.join(__dirname, 'backend'));
        await runScript('build', path.join(__dirname, 'frontend'));
        console.log('\n✅ Build complete.');
    } catch (err) {
        console.error(`\n❌ ${err.message}`);
        process.exit(1);
    }
})();
