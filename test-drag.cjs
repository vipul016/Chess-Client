const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const pageA = await browser.newPage();
    const pageB = await browser.newPage();

    pageA.on('console', msg => console.log('PAGE A:', msg.text()));
    pageA.on('pageerror', err => console.log('PAGE A ERROR:', err));
    pageA.on('dialog', async dialog => {
        console.log('PAGE A ALERT:', dialog.message());
        await dialog.dismiss();
    });

    const userA = 'userA' + Date.now();
    const userB = 'userB' + Date.now();

    await pageA.goto('http://localhost:5173/signup');
    await pageA.waitForSelector('input[type="text"]');
    await pageA.type('input[type="text"]', userA);
    await pageA.type('input[type="password"]', 'password123');
    await pageA.click('button[type="submit"]');
    await pageA.waitForSelector('button.btn-primary'); // Wait for lobby

    await pageB.goto('http://localhost:5173/signup');
    await pageB.waitForSelector('input[type="text"]');
    await pageB.type('input[type="text"]', userB);
    await pageB.type('input[type="password"]', 'password123');
    await pageB.click('button[type="submit"]');
    await pageB.waitForSelector('button.btn-primary'); // Wait for lobby

    // Find Match
    await pageA.click('button.btn-primary');
    await pageB.click('button.btn-primary');

    await pageA.waitForSelector('.react-chessboard-board', { timeout: 10000 });
    await pageB.waitForSelector('.react-chessboard-board', { timeout: 10000 });
    console.log("Both in game!");
    await new Promise(r => setTimeout(r, 2000));

    let aIsWhite = await pageA.evaluate(() => document.body.innerText.includes('White'));
    const whitePage = aIsWhite ? pageA : pageB;
    
    // Click TEST MOVE
    console.log("Clicking TEST MOVE on White Page...");
    await whitePage.click('#test-move-btn');
    
    await new Promise(r => setTimeout(r, 2000));
    const fen = await whitePage.evaluate(() => document.getElementById('fen-debugger').innerText);
    console.log("FEN AFTER TEST MOVE:", fen);

    await browser.close();
})();
