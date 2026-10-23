from pathlib import Path
import zipfile,json
root=Path(__file__).resolve().parents[1]
release=root/'release';release.mkdir(exist_ok=True)
exclude={'node_modules','dist','test-results','release','.git'}
files=[p for p in root.rglob('*') if p.is_file() and not any(part in exclude for part in p.relative_to(root).parts)]
with zipfile.ZipFile(release/'FindGuys-HTML-Source.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in files:z.write(p,Path('FindGuys')/p.relative_to(root))
source_bytes=sum(p.stat().st_size for p in files)
playable_bytes=(root/'dist'/'FindGuys.html').stat().st_size
report={'sourceWithArtBytes':source_bytes,'standaloneHtmlBytes':playable_bytes,'sourcePlusStandaloneBytes':source_bytes+playable_bytes,'sourceZipBytes':(release/'FindGuys-HTML-Source.zip').stat().st_size,'under50MB':source_bytes+playable_bytes<50*1024*1024}
(release/'package-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
assert report['under50MB'],report
print(json.dumps(report,indent=2))
