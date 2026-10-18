"""Native evidence helper. Uses the existing tree-based Phase 6–8 actions helper."""
import pathlib
import subprocess
import sys
import xml.etree.ElementTree as ET
sys.stdout.reconfigure(encoding='utf-8')

ADB = 'C:/Users/SawJu/AppData/Local/Android/Sdk/platform-tools/adb.exe'
root = pathlib.Path(__file__).parent
name = sys.argv[1]
raw = subprocess.check_output([ADB, '-s', 'emulator-5554', 'exec-out', 'uiautomator', 'dump', '/dev/tty']).decode('utf-8', 'replace')
xml = raw[raw.index('<?xml'):raw.rindex('</hierarchy>') + 12]
(root / f'{name}.xml').write_text(xml, encoding='utf-8')
(root / f'{name}.png').write_bytes(subprocess.check_output([ADB, '-s', 'emulator-5554', 'exec-out', 'screencap', '-p']))
for node in ET.fromstring(xml).iter('node'):
    if node.get('text') or node.get('content-desc'):
        print(node.get('text'), node.get('content-desc'), node.get('bounds'), node.get('checked'))
