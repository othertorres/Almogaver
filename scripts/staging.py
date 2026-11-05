#!/usr/bin/env python3
"""Run an isolated, local-only snapshot. Never publishes or reads credentials."""
import json
import base64
import runpy
import shutil
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / '.local' / 'staging'
ORIGIN = 'http://127.0.0.1:4173'
FILES = (
    'index.html', 'recovery.html', 'sw.js', 'manifest.webmanifest', 'visual-v6.css',
    'visual-v6.js', 'importer.css', 'importer-core.js', 'importer-docx.js',
    'importer-io.js', 'importer-layout.js', 'importer-ui.js',
    'wod-week-core.js', 'wod-week-ui.js',
)


def prepare():
    # Delete only our generated snapshot; do not copy Git, docs or environment files.
    if TARGET.is_symlink():
        raise RuntimeError('The staging target must not be a symlink')
    if TARGET.exists():
        shutil.rmtree(TARGET)
    TARGET.mkdir(parents=True)
    for name in FILES:
        shutil.copy2(ROOT / name, TARGET / name)
    for name in ('icons', 'vendor', 'ejemplos'):
        shutil.copytree(ROOT / name, TARGET / name)
    index = TARGET / 'index.html'
    html = index.read_text()
    banner = ('<aside role="status" style="background:#ffcc00;color:#111;'
              'text-align:center;padding:8px;font:700 14px sans-serif">'
              'PRUEBAS LOCALES · Usa datos ficticios · Pagos desactivados</aside>')
    start = html.lower().index('<body')
    end = html.index('>', start) + 1
    html = html[:end] + banner + html[end:]
    html = html.replace('<title>', '<title>[PRUEBAS] ', 1)
    index.write_text(html)
    manifest_path = TARGET / 'manifest.webmanifest'
    manifest = json.loads(manifest_path.read_text())
    manifest.update(name='ALMOGÀVER · PRUEBAS LOCALES', short_name='PRUEBAS')
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
    # The banner changes document bytes: transports must represent this snapshot.
    for document, transport in [('index.html', 'pwa-index.json'),
                                ('recovery.html', 'pwa-recovery.json')]:
        payload = dict(version=1, document=document,
                       base64=base64.b64encode((TARGET / document).read_bytes()).decode('ascii'))
        (TARGET / transport).write_text(json.dumps(payload, separators=(',', ':')) + '\n')
    # Rebuild the public hashes after adding the development banner/manifest labels.
    shutil.copytree(ROOT/'src', TARGET/'src')
    runpy.run_path(str(ROOT/'scripts/package-development.py'))['package_worker'](TARGET)
    shutil.rmtree(TARGET/'src')
    status = TARGET / '__staging' / 'status.json'
    status.parent.mkdir()
    status.write_text(json.dumps({
        'environment': 'staging-local', 'origin': ORIGIN,
        'payments_enabled': False, 'backend': None,
        'storage': 'IndexedDB v2, isolated by origin; legacy localStorage preserved',
        'production_version_verified': False,
    }, indent=2))


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.headers.get('Host') != '127.0.0.1:4173':
            self.send_error(403, 'Use the staging origin: ' + ORIGIN)
            return
        super().do_GET()

    def do_HEAD(self):
        if self.headers.get('Host') != '127.0.0.1:4173':
            self.send_error(403, 'Use the staging origin: ' + ORIGIN)
            return
        super().do_HEAD()

    def list_directory(self, path):
        self.send_error(403, 'Directory listing disabled')
        return None

    def end_headers(self):
        self.send_header('Cache-Control', 'public, max-age=0, must-revalidate' if urlsplit(self.path).path.startswith(('/vendor/','/icons/')) or urlsplit(self.path).path.endswith(('.css','.webmanifest')) else 'no-store')
        self.send_header('X-Robots-Tag', 'noindex, nofollow, noarchive')
        self.send_header('X-Almogaver-Environment', 'staging-local')
        # All bundled engines run locally; external APIs, forms and frames are blocked.
        self.send_header('Content-Security-Policy',
                         "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                         "style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; "
                         "connect-src 'self' blob:; worker-src 'self' blob:; "
                         "object-src 'none'; frame-src 'none'; frame-ancestors 'none'; "
                         "form-action 'none'; base-uri 'self'")
        super().end_headers()

    def translate_path(self, path):
        decoded = unquote(urlsplit(path).path)
        parts = Path(decoded).parts
        if '..' in parts or any(p.startswith('.') for p in parts if p != '/'):
            return str(TARGET / '__forbidden__')
        candidate = Path(super().translate_path(path)).resolve()
        if not candidate.is_relative_to(TARGET.resolve()):
            return str(TARGET / '__forbidden__')
        return str(candidate)


if __name__ == '__main__':
    # Bind first so a second invocation cannot replace a running snapshot.
    with ThreadingHTTPServer(('127.0.0.1', 4173), partial(Handler, directory=str(TARGET))) as server:
        prepare()
        print('Almogaver PRUEBAS: ' + ORIGIN + ' (Ctrl+C para detener)', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
