#!/usr/bin/env python3
"""Dependency-free reproducible HTML packaging for the installed 7.1.1 SW.
Runtime source is bundled as inert script elements, executed only after IDB opens.
No fetch/eval of the cached, external legacy app scripts.
"""
from pathlib import Path
import base64
import hashlib
import json
import re
ROOT=Path(__file__).resolve().parents[1]
FILES=['src/app-main.js','src/app-features.js','visual-v6.js','importer-core.js','importer-layout.js','importer-docx.js','importer-io.js','src/training-progress.js','src/training-series.js','importer-ui.js','wod-week-core.js','wod-week-ui.js','src/home.js','src/access.js','src/pwa.js']
def script(file,kind=''):
    content=(ROOT/file).read_text()
    if '</script' in content.lower():raise ValueError('Unsafe script terminator in '+file)
    return '<script'+(' type="'+kind+'"' if kind else '')+' data-source="'+file+'">\n'+content+'\n</script>'
def package_html():
    runtime=script('src/persistence.js')+'\n'+'\n'.join(script(f,'text/almogaver') for f in FILES)+'\n'+script('src/bootstrap.js')
    template=(ROOT/'src/index.template.html').read_text()
    assert template.count('<!-- ALMOGAVER_RUNTIME -->')==1
    (ROOT/'index.html').write_text(template.replace('<!-- ALMOGAVER_RUNTIME -->',runtime))
    recovery=(ROOT/'src/recovery.template.html').read_text().replace('<!-- STORAGE -->',script('src/persistence.js')).replace('<!-- PWA -->',script('src/pwa.js'))
    (ROOT/'recovery.html').write_text(recovery)
    # Public transport is JSON, not an HTML route subject to canonical redirects/transforms.
    # Decode must recover the exact original document bytes; no normalization is permitted.
    for document, transport in [('index.html','pwa-index.json'),('recovery.html','pwa-recovery.json')]:
        payload=dict(version=1,document=document,base64=base64.b64encode((ROOT/document).read_bytes()).decode('ascii'))
        (ROOT/transport).write_text(json.dumps(payload,separators=(',',':'))+'\n')
def package_worker(root):
    # Exact aliases used by existing installed routes/manifest. Do not change the PWA identity.
    urls={'index.html','recovery.html','manifest.webmanifest','manifest.webmanifest?v=60',
          'visual-v6.css?v=60','importer.css?v=711','vendor/docx/fflate.min.js'}
    urls.update(re.findall(r'(?:src|href)="([^"#:]+)"', (root/'src/index.template.html').read_text()))
    urls.update('icons/'+p.name for p in (root/'icons').iterdir() if p.is_file())
    urls.update(i['src'] for i in json.loads((root/'manifest.webmanifest').read_text())['icons'])
    core=[]
    for url in sorted(urls):
        path=root/url.split('?')[0]
        if not path.is_file():raise ValueError('Missing public core '+url)
        entry=dict(url=url,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),bucket='recovery' if url=='recovery.html' else 'core',kind='document' if url in ('index.html','recovery.html') else 'static')
        if entry['kind']=='document':
            transport='pwa-index.json' if url=='index.html' else 'pwa-recovery.json'
            entry['source']=dict(url=transport,sha256=hashlib.sha256((root/transport).read_bytes()).hexdigest())
        core.append(entry)
    optional=[dict(url=str(p.relative_to(root)),sha256=hashlib.sha256(p.read_bytes()).hexdigest(),bucket='optional',kind='static') for directory in ('vendor/ocr','vendor/pdf','ejemplos') for p in sorted((root/directory).rglob('*')) if p.is_file()]
    template=(root/'src/sw.template.js').read_text()
    build=hashlib.sha256((template+json.dumps([core,optional],sort_keys=True)).encode()).hexdigest()[:24]
    sw=template.replace('__BUILD__',json.dumps(build)).replace('__CORE__',json.dumps(core,separators=(',',':'))).replace('__OPTIONAL__',json.dumps(optional,separators=(',',':')))
    (root/'sw.js').write_text(sw)
    return build

if __name__ == '__main__':
    package_html()
    print('Packaged public PWA build',package_worker(ROOT))
