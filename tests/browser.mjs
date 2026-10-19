import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1366,height:1024},hasTouch:true,deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:3000');
await page.screenshot({path:'/tmp/velvet-desktop.png',fullPage:true});
await page.locator('.game-card[data-page="slots"]').click();
await page.locator('[data-action="spin"]').click();
await page.waitForFunction(()=>document.querySelector('#result')?.classList.contains('win')||document.querySelector('#result')?.classList.contains('loss')||document.querySelector('#result')?.classList.contains('push'));
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('velvet-arcade-v1')).rounds),1);
await page.locator('[data-hold="0"]').click();await page.locator('[data-hold="1"]').click();await page.locator('[data-hold="2"]').click();assert.equal(await page.locator('.held').count(),2);
await page.locator('.back-link').click();await page.locator('.game-card[data-page="horses"]').click();
await page.locator('[data-horse="4"]').click();await page.locator('[data-action="weather"]').click();await page.locator('[data-race-type="place"]').click();
await page.locator('[data-action="race"]').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('velvet-arcade-v1')).rounds===2,{},{timeout:15000});
assert.equal(await page.locator('#race-standings span').count(),3);
await page.screenshot({path:'/tmp/velvet-horses.png',fullPage:true});
await page.locator('.back-link').click();await page.locator('.game-card[data-page="roulette"]').click();await page.locator('[data-roulette="straight"]').click();await page.locator('#roulette-number').selectOption('0');
await page.locator('[data-action="roulette"]').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('velvet-arcade-v1')).rounds===3,{},{timeout:12000});
await page.locator('.back-link').click();await page.locator('.game-card[data-page="blackjack"]').click();await page.locator('[data-action="deal"]').click();
if(await page.locator('[data-action="stand"]').count()){
 await page.reload();assert.equal(await page.locator('[data-action="stand"]').count(),1);
 await page.locator('[data-action="stand"]').click();
}
await page.waitForFunction(()=>JSON.parse(localStorage.getItem('velvet-arcade-v1')).rounds===4);
const s=await page.evaluate(()=>JSON.parse(localStorage.getItem('velvet-arcade-v1')));assert.equal(s.balance,5000-s.totalBet+s.totalPaid);assert.equal(s.history.length,4);assert.ok(s.achievements.includes('explorer'));
await page.locator('[data-action="daily"]').click();await page.locator('[data-action="claim"]').click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('velvet-arcade-v1')).balance),s.balance+1000);
for(const viewport of [{width:1024,height:768},{width:768,height:1024},{width:390,height:844},{width:320,height:740}]){
 await page.setViewportSize(viewport);await page.goto('http://127.0.0.1:3000');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow lobby ${viewport.width}`);
 for(const id of ['slots','horses','roulette','blackjack']){
 await page.locator(`.game-card[data-page="${id}"]`).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${id} ${viewport.width}`);
 await page.locator('.back-link').click();
 }
 if(viewport.width===768)await page.screenshot({path:'/tmp/velvet-ipad.png',fullPage:true});
 if(viewport.width===390)await page.screenshot({path:'/tmp/velvet-mobile.png',fullPage:true});
}
// Exercise interrupted settlement and blackjack decisions with known saved hands.
async function seed(extra={}) {
 await page.evaluate(extra=>localStorage.setItem('velvet-arcade-v1',JSON.stringify({balance:5000,rounds:0,wins:0,totalBet:0,totalPaid:0,best:0,spins:0,history:[],achievements:[],daily:'',bj:null,pending:null,...extra})),extra);
 await page.reload();
}
const card=rank=>({rank,suit:'♠'});
await seed({balance:4900,pending:{game:'slots',stake:100,payout:250,label:'RECOVERED',detail:'recovery'}});
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('velvet-arcade-v1')).balance),5150);
await page.reload();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('velvet-arcade-v1')).balance),5150);
await seed({balance:4900,bj:{player:[card('5'),card('6')],dealer:[card('10'),card('8')],deck:[card('K')],stake:100}});
await page.locator('[data-action="double"]').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('velvet-arcade-v1')).rounds===1);
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('velvet-arcade-v1')).balance),5200);
await seed({balance:4900,bj:{player:[card('K'),card('9')],dealer:[card('10'),card('7')],deck:[card('5')],stake:100}});
await page.locator('[data-action="hit"]').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('velvet-arcade-v1')).rounds===1);
assert.match(await page.locator('#result').innerText(),/BUST/);
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('velvet-arcade-v1')).balance),4900);
await seed({spins:7});await page.locator('.game-card[data-page="slots"]').click();
await page.evaluate(()=>{crypto.getRandomValues=a=>{a[0]=0;return a;};});
await page.locator('[data-action="spin"]').click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('velvet-arcade-v1')).rounds===1);
assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('velvet-arcade-v1')).balance),5700);
assert.match(await page.locator('#result').innerText(),/FEVER WIN/);
await page.locator('.footer-records [data-page="history"]').click();assert.equal(await page.locator('.history-row:not(.history-head)').count(),1);
await page.locator('.footer-records [data-page="achievements"]').click();assert.equal(await page.locator('.achievement.unlocked').count(),1);
assert.deepEqual(errors,[]);console.log('PASS: all four game flows, accounting, active hand reload, daily reward, achievements, responsive layouts; no browser errors.');
await browser.close();
