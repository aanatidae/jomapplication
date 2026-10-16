import subprocess, sys, re, xml.etree.ElementTree as ET
from pathlib import Path
adb=r'C:/Users/SawJu/AppData/Local/Android/Sdk/platform-tools/adb.exe'
def run(*args): return subprocess.check_output([adb,'-s','emulator-5554',*args])
sys.stdout.reconfigure(encoding='utf-8')
name=sys.argv[1]
raw=run('exec-out','uiautomator','dump','/dev/tty').decode('utf-8','replace')
Path('docs/demo/phase678/'+name+'.xml').write_text(raw,encoding='utf-8')
Path('docs/demo/phase678/'+name+'.png').write_bytes(run('exec-out','screencap','-p'))
root=ET.fromstring(raw[raw.index('<?xml'):raw.rindex('</hierarchy>')+12])
for n in root.iter('node'):
 t=n.get('text') or n.get('content-desc')
 if t: print(t, n.get('bounds'))
if len(sys.argv)>2:
 target=sys.argv[2]
 nodes=[n for n in root.iter('node') if target in (n.get('text'),n.get('content-desc'))]
 if not nodes: raise ValueError('Missing '+target)
 b=list(map(int,re.findall(r'\d+',nodes[0].get('bounds'))))
 run('shell','input','tap',str((b[0]+b[2])//2),str((b[1]+b[3])//2))
