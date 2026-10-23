import {readFile,writeFile,readdir,stat} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=new URL('../dist/',import.meta.url);
let html=await readFile(new URL('index.html',root),'utf8');
const images={};
for(const f of await readdir(new URL('art/',root)))images[f.replace('.webp','')]=`data:image/webp;base64,${(await readFile(new URL('art/'+f,root))).toString('base64')}`;
const script=html.match(/<script[^>]*src="([^"]+)"[^>]*><\/script>/);
if(script){const js=await readFile(new URL(script[1],root),'utf8');html=html.replace(script[0],`<script type="module">${js.replaceAll('</script','<\\/script')}</script>`);}
for(const match of [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)]){
 let css=await readFile(new URL(match[1],root),'utf8');
 for(const f of await readdir(new URL('fonts/',root))){const encoded=`data:font/ttf;base64,${(await readFile(new URL('fonts/'+f,root))).toString('base64')}`;css=css.replaceAll(`../fonts/${f}`,encoded).replaceAll(`/fonts/${f}`,encoded);}
 html=html.replace(match[0],`<style>${css}</style>`);
}
const licenses=[];for(const f of ['DM-Sans-OFL.txt','Fraunces-OFL.txt'])licenses.push(await readFile(new URL('fonts/'+f,root),'utf8'));
html=html.replace('</head>',`<!-- Font licenses: ${licenses.join('\n').replaceAll('--','?')} -->`+'</head>');
html=html.replace('</head>',`<script>window.__INLINE_ART__=${JSON.stringify(images)};</script></head>`);
await writeFile(new URL('FindGuys.html',root),html);
const walk=async dir=>{let bytes=0;for(const f of await readdir(dir,{withFileTypes:true})){const p=join(dir,f.name);bytes+=f.isDirectory()?await walk(p):(await stat(p)).size;}return bytes};
console.log(`Distribution including standalone HTML: ${((await walk(fileURLToPath(root)))/1048576).toFixed(2)} MB`);
