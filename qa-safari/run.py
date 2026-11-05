"""Native Safari W3C WebDriver experiments. Stdlib only; local synthetic app."""
import argparse
import base64
import http.client
import json
import os
from pathlib import Path
import subprocess
import time
import traceback

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'http://127.0.0.1:4173'
ELEMENT = 'element-6066-11e4-a52e-4f735466cecf'
OLD, EDITED = 'QA rutina original', 'QA rutina editada'

class DriverError(RuntimeError):
    pass

class Driver:
    def __init__(self, output, platform):
        self.output, self.platform, self.sid = output, platform, None
        self.commands = (output / 'webdriver.jsonl').open('a')

    def request(self, method, path, data=None, session=True):
        if session:
            path = '/session/' + self.sid + path
        connection = http.client.HTTPConnection('127.0.0.1', 4444, timeout=60)
        try:
            body = None if data is None else json.dumps(data).encode()
            connection.request(method, path, body, {'Content-Type': 'application/json'})
            response = connection.getresponse()
            result = json.loads(response.read())
        finally:
            connection.close()
        value = result.get('value')
        recorded = '<binary or page source saved separately>' if path.endswith(('/screenshot', '/source')) else value
        self.commands.write(json.dumps({'at': time.time(), 'method': method, 'path': path, 'request': data, 'response': recorded}) + '\n')
        self.commands.flush()
        if response.status >= 400 or isinstance(value, dict) and value.get('error'):
            raise DriverError(str(value))
        return value

    def start(self):
        # Native desktop Safari is the driver's default; iOS is explicit below.
        caps = {'browserName': 'Safari'}
        if self.platform == 'ios-simulator':
            caps.update({'platformName': 'iOS', 'safari:useSimulator': True,
                         'safari:deviceUDID': os.environ['QA_SIMULATOR_UDID']})
        value = self.request('POST', '/session', {'capabilities': {'alwaysMatch': caps}}, session=False)
        self.sid = value['sessionId']
        actual = value['capabilities']
        assert actual['browserName'].lower() == 'safari', actual
        expected = 'ios' if self.platform == 'ios-simulator' else 'mac'
        assert expected in actual['platformName'].lower(), actual
        return actual

    def stop(self):
        if self.sid:
            self.request('DELETE', '', session=True)
            self.sid = None

    def script(self, script, *args):
        return self.request('POST', '/execute/sync', {'script': script, 'args': list(args)})

    def async_script(self, expression):
        value = self.request('POST', '/execute/async', {
            'script': 'const done=arguments[arguments.length-1]; Promise.resolve(' + expression + ').then(done,e=>done({qaError:String(e)}));', 'args': []})
        if isinstance(value, dict) and 'qaError' in value:
            raise DriverError(value['qaError'])
        return value

    def wait(self, predicate, label, timeout=20):
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            if predicate():
                return
            time.sleep(.15)
        raise AssertionError('Timed out waiting for ' + label)

    def find(self, selector):
        # Unlike Playwright, a raw WebDriver find does not auto-wait for an
        # asynchronous application transition to render its next form.
        self.wait(lambda: self.script('return document.querySelector(arguments[0])!==null', selector), selector)
        return self.request('POST', '/element', {'using': 'css selector', 'value': selector})[ELEMENT]

    def click(self, selector):
        self.request('POST', '/element/' + self.find(selector) + '/click', {})

    def fill(self, selector, value):
        element = self.find(selector)
        self.request('POST', '/element/' + element + '/clear', {})
        self.request('POST', '/element/' + element + '/value', {'text': value})
        self.async_script('AlmogaverStorage.idle()')

    def ready(self):
        self.request('POST', '/url', {'url': ORIGIN + '/'})
        self.wait(lambda: self.script('return document.documentElement.dataset.persistence') == 'ready', 'native IndexedDB ready')
        if self.script('return !!document.querySelector("#access-screen:not([hidden])")'):
            self.click('#access-screen .access-actions button:last-child')
            self.wait(lambda: self.script('return document.querySelector("#access-screen").hidden'), 'local welcome confirmation')
        self.async_script('AlmogaverStorage.idle()')

    def plans(self):
        return self.async_script('AlmogaverStorage.export()').get('plansV7', {}).get('plans', [])

    def confirmed(self):
        self.wait(lambda: self.script('return !document.querySelector("#save-plan")'), 'visible save completion')
        return self.plans()

    def screenshot(self, path):
        path.write_bytes(base64.b64decode(self.request('GET', '/screenshot')))


def prepare(driver):
    driver.ready()
    assert driver.plans() == [], 'BLOCKED_ISOLATION: automation session did not start empty'
    driver.click('#personal-home [data-home-action="import"]')
    driver.fill('#routine-text', 'Día 1\nSentadilla 3 x 5\nDescanso: 90 s')
    driver.click('[data-action="parse"]')
    driver.fill('[data-plan-name]', OLD)
    driver.click('#review-confirm')
    driver.click('#save-plan')
    initial = driver.confirmed()
    assert len(initial) == 1 and initial[0]['name'] == OLD, initial
    driver.click('.nav[data-screen="training-screen"]')
    driver.click('[data-action="edit"]')
    driver.fill('[data-plan-name]', EDITED)
    driver.click('#review-confirm')
    return initial[0]['id']


def observe(driver, pause):
    driver.script('''
      sessionStorage.removeItem('qa-save-events');
      const repo=AlmogaverStorage, original=repo.commit.bind(repo), events=[];
      repo.commit=function(patch,reason,options){
        if(reason!=='save-plan')return original(patch,reason,options);
        const emit=stage=>{events.push({stage,at:performance.now(),token:repo.token()});sessionStorage.setItem('qa-save-events',JSON.stringify(events))};
        emit('handler-entered');
        const perform=()=>original(patch,reason,options).then(result=>{emit('transaction-complete');return result});
        if(window.__qaPauseSave)return new Promise((resolve,reject)=>{window.__qaReleaseSave=()=>perform().then(resolve,reject);emit('paused-before-write')});
        return perform();
      };
      window.__qaPauseSave=arguments[0];
    ''', pause)


def case(driver, kind, output):
    identity = prepare(driver)
    driver.screenshot(output / 'before-save.png')
    observe(driver, kind.startswith('control'))
    driver.click('#save-plan')
    confirmed = None
    if kind == 'confirmed':
        confirmed = driver.confirmed()
        assert confirmed[0]['name'] == EDITED, confirmed
    elif kind == 'control-released':
        driver.script('window.__qaReleaseSave(); return true')
        confirmed = driver.confirmed()
    driver.ready()
    restored = driver.plans()
    events = driver.script('return JSON.parse(sessionStorage.getItem("qa-save-events")||"[]")')
    observation = {'kind': kind, 'confirmed': confirmed, 'restored': restored, 'events': events,
                   'userAgent': driver.script('return navigator.userAgent')}
    (output / 'observation.json').write_text(json.dumps(observation, indent=2))
    print('SAFARI_EXPERIMENT ' + json.dumps(observation), flush=True)
    driver.screenshot(output / 'after-reload.png')
    assert len(restored) == 1 and restored[0]['id'] == identity, restored
    expected = OLD if kind == 'control-pending' else EDITED
    assert restored[0]['name'] == expected, (expected, restored[0]['name'])
    if confirmed is not None:
        assert restored == confirmed, 'Confirmed plan differs after reload'
    if kind.startswith('control'):
        assert any(e['stage'] == 'paused-before-write' for e in events), events
    if kind in ['confirmed', 'control-released']:
        assert any(e['stage'] == 'transaction-complete' for e in events), events
    return observation


def wait_endpoint(port, path):
    for _ in range(100):
        try:
            c = http.client.HTTPConnection('127.0.0.1', port, timeout=2)
            c.request('GET', path)
            r = c.getresponse()
            r.read(); c.close()
            if r.status == 200:
                return
        except OSError:
            pass
        time.sleep(.2)
    raise DriverError('Local endpoint did not start: ' + str(port))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--platform', choices=['macos', 'ios-simulator'], required=True)
    ap.add_argument('--samples', type=int, default=5)
    args = ap.parse_args()
    out = ROOT / '.local/safari-native' / args.platform
    out.mkdir(parents=True, exist_ok=True)
    rows, fatal, caps = [], None, []
    with (out / 'server.log').open('w') as server_log, (out / 'safaridriver.log').open('w') as driver_log:
        server = subprocess.Popen(['python3', 'scripts/staging.py'], cwd=ROOT, stdout=server_log, stderr=subprocess.STDOUT)
        service = subprocess.Popen(['/usr/bin/safaridriver', '--port', '4444'], stdout=driver_log, stderr=subprocess.STDOUT)
        driver = Driver(out, args.platform)
        try:
            wait_endpoint(4173, '/__staging/status.json'); wait_endpoint(4444, '/status')
            scenarios = [(kind, n) for n in range(1, args.samples + 1) for kind in ['immediate', 'confirmed']]
            scenarios += [('control-pending', 1), ('control-released', 1)]
            for index, (kind, sample) in enumerate(scenarios):
                directory = out / (str(index + 1).zfill(2) + '-' + kind)
                directory.mkdir()
                row = {'kind': kind, 'sample': sample, 'status': 'NOT_EXECUTED'}
                rows.append(row)
                try:
                    actual = driver.start(); caps.append(actual)
                    (directory / 'capabilities.json').write_text(json.dumps(actual, indent=2))
                    case(driver, kind, directory)
                    row['status'] = 'CONTROL_PASSED' if kind.startswith('control') else 'PASSED'
                except Exception as error:
                    row.update(status='FAILED' if driver.sid else 'BLOCKED_INFRASTRUCTURE', error=str(error))
                    (directory / 'error.txt').write_text(traceback.format_exc())
                    if driver.sid:
                        try:
                            driver.screenshot(directory / 'failure.png')
                            (directory / 'page.html').write_text(driver.request('GET', '/source'))
                        except Exception as evidence_error:
                            row['evidence_error'] = str(evidence_error)
                    else:
                        raise
                finally:
                    driver.stop()
                print('SAFARI_CASE ' + json.dumps(row), flush=True)
        except Exception:
            fatal = traceback.format_exc()
            print(fatal, flush=True)
        finally:
            try:
                driver.stop()
            except Exception:
                fatal = (fatal or '') + '\nCleanup: ' + traceback.format_exc()
            finally:
                driver.commands.close(); service.terminate(); server.terminate()
    for kind, sample in scenarios[len(rows):] if 'scenarios' in locals() else []:
        rows.append({'kind': kind, 'sample': sample, 'status': 'NOT_EXECUTED', 'reason': 'Earlier infrastructure failure'})
    result = {'platform': args.platform, 'physical_iphone': False, 'caps': caps, 'cases': rows,
              'planned': args.samples * 2 + 2, 'fatal': fatal,
              'scope': 'native Safari save/reload ordering, not full PWA or physical-device certification',
              'functional_approved': False}
    (out / 'results.json').write_text(json.dumps(result, indent=2))
    print('SAFARI_SUMMARY ' + json.dumps(result), flush=True)
    return int(bool(fatal) or any(r['status'] in ['FAILED', 'BLOCKED_INFRASTRUCTURE'] for r in rows))

if __name__ == '__main__':
    raise SystemExit(main())

