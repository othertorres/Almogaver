"""Check snapshot bytes without modifying application sources or launching browsers."""
import base64
import hashlib
import json
import runpy
import shutil
from pathlib import Path

root = Path(__file__).resolve().parents[2]
public = ['index.html', 'recovery.html', 'sw.js', 'pwa-index.json', 'pwa-recovery.json', 'manifest.webmanifest', '_headers']
before = {p: hashlib.sha256((root / p).read_bytes()).hexdigest() for p in public}
staging = runpy.run_path(str(root / 'scripts/staging.py'))
staging['prepare']()
target = staging['TARGET']
for document, transport in [('index.html', 'pwa-index.json'), ('recovery.html', 'pwa-recovery.json')]:
    payload = json.loads((target / transport).read_text())
    assert base64.b64decode(payload['base64']) == (target / document).read_bytes()
assert 'PRUEBAS LOCALES' in (target / 'index.html').read_text()
worker_before = (target / 'sw.js').read_bytes()
pack = runpy.run_path(str(root / 'scripts/package-development.py'))
shutil.copytree(root / 'src', target / 'src')
try:
    pack['package_worker'](target)
    assert (target / 'sw.js').read_bytes() == worker_before
finally:
    shutil.rmtree(target / 'src')
assert before == {p: hashlib.sha256((root / p).read_bytes()).hexdigest() for p in public}
assert not any((target / p).exists() for p in ['.git', 'tests', 'src'])
result = {'status': 'PASSED', 'checks': ['exact transports', 'deterministic worker', 'local banner', 'public originals unchanged', 'no source or Git served'], 'kind': 'STATIC_SNAPSHOT_NOT_BROWSER'}
out = root / '.local/qa/staging.json'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(result, indent=2))
print(json.dumps(result, indent=2))
