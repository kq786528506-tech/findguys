"""Publish this source project and its reviewed static build using GitHub CLI auth."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import base64, json, os, shutil, subprocess, time
ROOT=Path(__file__).resolve().parents[1]
GH=shutil.which('gh') or r'H:\tools\github-cli\bin\gh.exe'
REPO='kq786528506-tech/findguys'
STATE=ROOT/'.deployment';STATE.mkdir(exist_ok=True)

def api(endpoint,method='GET',data=None):
    args=[GH,'api',endpoint,'--method',method]
    if data is not None:args+=['--input','-']
    payload=json.dumps(data) if data is not None else None
    for attempt in range(4):
        proc=subprocess.run(args,input=payload,capture_output=True,text=True,encoding='utf-8')
        if proc.returncode==0:return json.loads(proc.stdout) if proc.stdout.strip() else {}
        if attempt==3:raise RuntimeError(f'{method} {endpoint}: {proc.stderr}')
        time.sleep(1+attempt)

if api('user')['login'].lower()!=REPO.split('/')[0].lower():raise SystemExit('Authenticate the repository owner first.')
reference=api(f'repos/{REPO}/git/ref/heads/main')
parent=reference['object']['sha']
previous=api(f'repos/{REPO}/git/commits/{parent}')
remote=api(f'repos/{REPO}/git/trees/{previous["tree"]["sha"]}?recursive=1')
old_files={item['path'] for item in remote['tree'] if item['type']=='blob'}
expected_old={'.nojekyll','NotoSansSC-LICENSE.txt','index.html','Build/WebGL.data.unityweb','Build/WebGL.framework.js.unityweb','Build/WebGL.loader.js','Build/WebGL.wasm.unityweb'}
# Subsequent uploads can update an existing HTML source tree; unknown initial trees need review.
if old_files!=expected_old and 'src/main.ts' not in old_files:
    raise SystemExit('Unexpected remote repository content; review before updating: '+str(sorted(old_files)))
files=[]
for name in ('.gitignore','index.html','package.json','package-lock.json','tsconfig.json','vite.config.ts','README.md','Play-FindGuys.cmd'):
    files.append(ROOT/name)
for folder in ('src','public','scripts','tests','docs'):
    files.extend(p for p in (ROOT/folder).rglob('*') if p.is_file())
for name in ('cozy-courtyard-portrait-concept-v2-polished.jpg','playable-four-worlds.jpg'):
    files.append(ROOT/'Design'/name)
files=sorted(set(files))
assert (ROOT/'docs/index.html').exists() and (ROOT/'docs/.nojekyll').exists()
assert sum(f.stat().st_size for f in files)<50_000_000
for f in files:
    assert f.resolve().is_relative_to(ROOT.resolve()) and f.stat().st_size<20_000_000
plan={'repository':REPO,'parent':parent,'files':[{'path':f.relative_to(ROOT).as_posix(),'bytes':f.stat().st_size} for f in files]}
(STATE/'upload-plan.json').write_text(json.dumps(plan,indent=2),encoding='utf-8')
known=STATE/'uploaded-blobs.json'
cache=json.loads(known.read_text()) if known.exists() else {}
import hashlib

def upload(file):
    data=file.read_bytes();key=hashlib.sha256(data).hexdigest()
    if key in cache:sha=cache[key]
    else:sha=api(f'repos/{REPO}/git/blobs','POST',{'content':base64.b64encode(data).decode('ascii'),'encoding':'base64'})['sha']
    return file.relative_to(ROOT).as_posix(),sha,key
entries=[]
with ThreadPoolExecutor(max_workers=3) as pool:
    futures=[pool.submit(upload,file) for file in files]
    for future in as_completed(futures):
        path,sha,key=future.result();entries.append({'path':path,'mode':'100644','type':'blob','sha':sha});cache[key]=sha
        known.write_text(json.dumps(cache),encoding='utf-8')
        print(f'Uploaded {len(entries)}/{len(files)} {path}',flush=True)
tree=api(f'repos/{REPO}/git/trees','POST',{'tree':sorted(entries,key=lambda e:e['path'])})
commit=api(f'repos/{REPO}/git/commits','POST',{'message':'Rebuild Find Guys as a portrait HTML game with four interactive storybook worlds','tree':tree['sha'],'parents':[parent]})
(STATE/'pending-commit.json').write_text(json.dumps({'parent':parent,'commit':commit['sha'],'tree':tree['sha']},indent=2),encoding='utf-8')
# Non-forced update keeps all existing history and refuses concurrent branch changes.
api(f'repos/{REPO}/git/refs/heads/main','PATCH',{'sha':commit['sha'],'force':False})
api(f'repos/{REPO}/pages','PUT',{'build_type':'legacy','source':{'branch':'main','path':'/docs'}})
api(f'repos/{REPO}','PATCH',{'description':'Find Guys — four cozy storybook worlds. A portrait HTML hidden-character game.','homepage':'https://kq786528506-tech.github.io/findguys/'})
result={'repository':REPO,'commit':commit['sha'],'parent':parent,'pages':'https://kq786528506-tech.github.io/findguys/','source':{'branch':'main','path':'/docs'},'files':len(entries),'bytes':sum(f.stat().st_size for f in files)}
(STATE/'published.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result,indent=2),flush=True)
