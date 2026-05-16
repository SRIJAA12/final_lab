// Test script: Simulates 15 student logins simultaneously
// Run from the server folder: node test-logins.js
// Requires Node.js v18+ (uses built-in fetch - no npm install needed)

const SERVER = 'http://localhost:7401';

async function simulateLogin(i) {
    try {
        const res = await fetch(`${SERVER}/api/student-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentName: `Test Student ${i}`,
                studentId: `TEST${String(i).padStart(3,'0')}`,
                computerName: `SDC-CC-${String(i).padStart(2,'0')}`,
                systemNumber: `CC1-${String(i).padStart(2,'0')}`,
                labId: 'CC1'
            })
        });
        const data = await res.json();
        if (data.sessionId) {
            console.log(`✅ Student ${i}: sessionId = ${data.sessionId}`);
        } else {
            console.log(`❌ Student ${i}: FAILED -`, data.error || 'unknown error');
        }
    } catch (err) {
        console.log(`❌ Student ${i}: ERROR -`, err.message);
    }
}

console.log('🚀 Firing 15 simultaneous student logins...');
const start = Date.now();

Promise.all(Array.from({length: 15}, (_, i) => simulateLogin(i + 1)))
    .then(() => {
        console.log(`✅ All 15 logins done in ${Date.now() - start}ms`);
        console.log('👉 Now check the admin dashboard - you should see 15 student tiles');
    });
