const fs = require('fs');
const path = require('path');

const dir = 'd:/Projects/Hackathon Project/backend/src/controllers';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

for (const file of files) {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');

    // 1. replace catch (error) { with catch (error: unknown) {
    content = content.replace(/catch\s*\(\s*error\s*\)\s*\{/g, 'catch (error: unknown) {');
    
    // 2. replace catch (error: any) { with catch (error: unknown) {
    content = content.replace(/catch\s*\(\s*error:\s*any\s*\)\s*\{/g, 'catch (error: unknown) {');

    // 3. standardize res.status(...).json({ message: ... }) to include success: false
    // Regex explanation:
    // look for res.status(xxx).json({ ... })
    // and make sure 'success' is not inside the '{...}'
    // and then insert 'success: false, '
    content = content.replace(/res\.status\(\s*(500|400|401|403|404|409)\s*\)\.json\(\s*\{((?:[^{}]*\{[^{}]*\}[^{}]*)*[^{}]*)\}\s*\)/g, (match, status, inner) => {
        if (!inner.includes('success:')) {
            return `res.status(${status}).json({ success: false, ${inner.trim()} })`;
        }
        return match;
    });

    // 4. Update (error as Error).message
    // Since we are changing error to unknown, we need to make sure we access error.message via (error as Error).message or similar.
    // In many files it's `console.error('[...]', (error as Error).message)` which is already correct.
    
    fs.writeFileSync(fullPath, content);
    console.log('Fixed:', file);
}
