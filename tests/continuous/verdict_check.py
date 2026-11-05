"""Ensure CI never accepts omitted, unstable, failed or empty suites."""
from pathlib import Path
import json
import subprocess

out = Path('.local/qa/gate-check')
out.mkdir(parents=True, exist_ok=True)
rows = []
for status in ['expected', 'skipped', 'unexpected', 'flaky', 'empty']:
    stats = {name: int(status == name) for name in ['expected', 'skipped', 'unexpected', 'flaky']}
    suites = [] if status == 'empty' else [{'specs': [{'title': 'synthetic verdict self-check', 'tests': [{'projectName': 'synthetic', 'status': status, 'results': [{'errors': []}]}]}]}]
    path = out / (status + '.json')
    path.write_text(json.dumps({'stats': stats, 'errors': [], 'suites': suites}))
    result = subprocess.run(['node', 'scripts/qa-verdict.js', str(path)], capture_output=True, text=True)
    assert result.returncode == (0 if status == 'expected' else 1), (status, result.stdout, result.stderr)
    rows.append({'case': status, 'exit': result.returncode, 'status': 'PASS'})
Path('.local/qa/gate-check.json').write_text(json.dumps(rows, indent=2))
print(json.dumps(rows, indent=2))
