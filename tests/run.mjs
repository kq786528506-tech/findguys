import {spawn} from 'node:child_process';
const port=5187,origin=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:['ignore','pipe','pipe'],windowsHide:true});
let serverOutput='';server.stdout.on('data',d=>serverOutput+=d);server.stderr.on('data',d=>serverOutput+=d);
try{
 let ready=false;
 for(let i=0;i<60;i++){try{const r=await fetch(origin);if(r.ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,150));}
 if(!ready)throw new Error(`Test server failed to start: ${serverOutput}`);
 for(const script of ['tests/browser.mjs','tests/extended.mjs']){
  const code=await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[script],{stdio:'inherit',windowsHide:true,env:{...process.env,TEST_ORIGIN:origin}});child.on('error',reject);child.on('exit',resolve)});
  if(code!==0){process.exitCode=1;break;}
 }
}finally{server.kill();}
