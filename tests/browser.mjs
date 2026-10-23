import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--autoplay-policy=no-user-gesture-required']});
await mkdir('test-results',{recursive:true});
const failures=[],errors=[],checks=[];
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const state=()=>page.evaluate(()=>window.__findGuys.getState());
const ready=()=>page.waitForFunction(()=>window.__findGuys&&!window.__findGuys.getState().loading);
async function drag(x,y,dx,dy){await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y+dy,{steps:16});await page.mouse.up();}
async function locate(get){for(let attempt=0;attempt<5;attempt++){const r=await page.locator('#world').boundingBox(),p=get(await state());if(p.x>25&&p.x<r.width-25&&p.y>65&&p.y<r.height-45)return{x:r.x+p.x,y:r.y+p.y};const dx=Math.max(-150,Math.min(150,r.width/2-p.x)),dy=Math.max(-210,Math.min(210,r.height/2-p.y));await drag(r.x+r.width/2,r.y+r.height/2,dx,dy);}throw new Error('Target could not be moved into view');}
async function target(index){const p=await locate(s=>s.targets[index]);await page.touchscreen.tap(p.x,p.y);}
async function mechanism(id){const p=await locate(s=>s.mechanisms.find(m=>m.id===id).screen);await page.touchscreen.tap(p.x,p.y);await page.waitForTimeout(650);}
async function select(index){if((await state()).modalOpen)await page.locator('[data-action="resume"]').first().click().catch(()=>{});await page.locator('[data-action="scenes"]').first().click();await page.locator(`[data-level="${index}"]`).click();await ready();}
try{
 await page.goto(process.env.TEST_ORIGIN||'http://localhost:5173');await ready();await page.waitForTimeout(600);
 assert.equal((await state()).level,'courtyard');assert.equal((await state()).timed,false);assert.equal((await state()).found.length,0);checks.push('Starts directly in relaxed gameplay');
 await page.screenshot({path:'test-results/01-courtyard.png'});
 // Zoom via actual Chrome mobile touch events.
 const cdp=await page.context().newCDPSession(page),r=await page.locator('#world').boundingBox();
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:145,y:r.y+180},{x:245,y:r.y+180}]});
 for(let i=0;i<8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:145-i*7,y:r.y+180},{x:245+i*7,y:r.y+180}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert.ok((await state()).zoom>1.5);assert.equal((await state()).found.length,0);await page.locator('[data-action="overview"]').click();assert.equal((await state()).zoom,1);checks.push('Pinch zoom, drag protection and overview reset');
 await page.locator('[data-action="hint"]').click();assert.equal((await state()).hints,1);await page.locator('[data-action="overview"]').click();
 await page.locator('[data-action="pause"]').click();const t=(await state()).elapsed;await page.waitForTimeout(400);assert.equal((await state()).elapsed,t);await page.locator('[data-action="resume"]').first().click();checks.push('Hint budget and paused timer');
 for(let i=0;i<4;i++){
  if(i>0)await select(i);
  const s=await state();assert.equal(s.found.length,0);assert.equal(s.gates.length,0);
  await page.screenshot({path:`test-results/0${i+1}-${s.level}.png`});
  // A hidden target cannot be collected through its cover.
  const gated=s.targets.findIndex(t=>t.requires&&!t.requires.includes(':'));
  if(i===0&&gated>=0){const p=await locate(s=>s.targets[gated]);await page.touchscreen.tap(p.x,p.y);assert.ok(!(await state()).found.includes(gated));}
  for(const m of (await state()).mechanisms){
   if((await state()).gates.includes(m.id))continue;
   if(m.kind==='fog'){
    const p=await locate(s=>s.mechanisms.find(m=>m.id===m.id&&m.kind==='fog').screen);
    await page.mouse.move(p.x-18,p.y);await page.mouse.down();for(let k=0;k<6;k++)await page.mouse.move(p.x+(k%2?28:-28),p.y+(k%2?14:-14),{steps:8});await page.mouse.up();
   }else if(m.kind==='stars'){
    for(let k=0;k<3;k++){const p=await locate(s=>s.mechanisms.find(m=>m.kind==='stars').stars[k]);await page.touchscreen.tap(p.x,p.y);}
   }else if(m.kind==='crate'||m.kind==='telescope'){const p=await locate(s=>s.mechanisms.find(item=>item.id===m.id).screen);await drag(p.x,p.y,48,-10);await page.waitForTimeout(650);}
   else await mechanism(m.id);
   assert.ok((await state()).gates.includes(m.id),`${s.level}: ${m.id} did not activate`);
  }
  await page.locator('[data-action="phase"]').click();await page.locator('[data-action="weather"]').click();assert.equal((await state()).phase,1);assert.equal((await state()).weather,1);
  for(let n=0;n<6;n++){if((await state()).found.includes(n))continue;assert.ok((await state()).targets[n].visible,`${s.level} target ${n} hidden`);await target(n);assert.ok((await state()).found.includes(n),`${s.level} target ${n} failed`);}
  await page.waitForFunction(()=>window.__findGuys.getState().finished);assert.equal((await state()).found.length,6);assert.ok((await state()).score>=600);assert.equal(await page.locator('.collection-slot.found').count(),6);await page.screenshot({path:`test-results/win-${s.level}.png`});checks.push(`${s.level}: every mechanism activated and all six collected through pointer input`);
  if(i<3){await page.locator('.result [data-level]').click();await ready();}
 }
 assert.equal(errors.length,0,errors.join('\n'));
 // Returning to a scene resets all gates and targets; records survive reload.
 await page.locator('.result [data-level]').click();await ready();assert.equal((await state()).found.length,0);await page.reload();await ready();assert.equal((await state()).level,'courtyard');const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('find-guys-storybook-v1')));assert.ok(stored.stars.every(s=>s>0));checks.push('Round reset and persistent records across reload');
 // Narrow device and desktop portrait containment.
 await page.setViewportSize({width:320,height:568});await page.waitForTimeout(300);const narrow=await page.locator('#game').boundingBox();assert.ok(narrow.width<=320&&narrow.width>300);assert.ok(await page.locator('[data-action="hint"]').isVisible());await page.screenshot({path:'test-results/mobile-320.png'});
 await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(300);const desktop=await page.locator('#game').boundingBox();assert.equal(desktop.width,506.25);assert.equal(desktop.height,900);await page.screenshot({path:'test-results/desktop-portrait.png'});checks.push('320px phone and desktop preserve portrait layout');
}catch(e){failures.push(e.stack);await page.screenshot({path:'test-results/failure.png'}).catch(()=>{});console.error(e);}
await writeFile('test-results/verification.json',JSON.stringify({checks,errors,failures},null,2));console.log(JSON.stringify({checks,errors,failures},null,2));await browser.close();if(failures.length||errors.length)process.exit(1);
