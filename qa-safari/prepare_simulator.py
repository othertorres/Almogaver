"""Select and boot an existing iPhone Simulator on an ephemeral macOS runner."""
import json
import os
from pathlib import Path
import subprocess

out = Path('.local/safari-native/ios-simulator')
out.mkdir(parents=True, exist_ok=True)
inventory = json.loads(subprocess.check_output(['xcrun', 'simctl', 'list', 'devices', 'available', '--json'], text=True))
(out / 'simulators.json').write_text(json.dumps(inventory, indent=2))
candidates = [(runtime, device) for runtime, devices in inventory['devices'].items()
              for device in devices if device.get('isAvailable') and device['name'].startswith('iPhone')]
if not candidates:
    raise SystemExit('BLOCKED: no installed iPhone Simulator runtime; no tests executed')
runtime, device = sorted(candidates, key=lambda x: (x[0], x[1]['name']), reverse=True)[0]
selected = {'runtime': runtime, **device, 'physical_device': False}
(out / 'selected-simulator.json').write_text(json.dumps(selected, indent=2))
print(json.dumps(selected))
if device['state'] != 'Booted':
    subprocess.run(['xcrun', 'simctl', 'boot', device['udid']], check=True, timeout=60)
subprocess.run(['xcrun', 'simctl', 'bootstatus', device['udid'], '-b'], check=True, timeout=240)
subprocess.run(['open', '-a', 'Simulator'], check=True, timeout=30)
with open(os.environ['GITHUB_ENV'], 'a') as env:
    env.write('QA_SIMULATOR_UDID=' + device['udid'] + '\n')

