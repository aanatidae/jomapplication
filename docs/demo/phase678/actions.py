import subprocess,sys,re,time,xml.etree.ElementTree as ET
adb=r'C:/Users/SawJu/AppData/Local/Android/Sdk/platform-tools/adb.exe'
def run(*args): return subprocess.check_output([adb,'-s','emulator-5554',*args])
def tree():
 for attempt in range(3):
  raw=run('exec-out','uiautomator','dump','/dev/tty').decode('utf-8','replace')
  if '<?xml' in raw: return ET.fromstring(raw[raw.index('<?xml'):raw.rindex('</hierarchy>')+12])
  time.sleep(1)
 raise ValueError('Android UI tree unavailable')

def tap(label):
 for attempt in range(12):
  root=tree()
  for n in sorted(root.iter('node'), key=lambda n: (n.get('class') != 'android.widget.EditText', n.get('clickable') != 'true')):
   if label not in (n.get('text'),n.get('content-desc')): continue
   b=list(map(int,re.findall(r'\d+',n.get('bounds'))))
   if b[3] <= b[1] or b[1]<0 or b[3]>2337: continue
   run('shell','input','tap',str((b[0]+b[2])//2),str((b[1]+b[3])//2));return
  if attempt == 11: raise ValueError('Missing '+label)
  scroll = next((n for n in root.iter('node') if n.get('scrollable') == 'true'), None)
  if scroll is None: raise ValueError('No scroll container for '+label)
  sb=list(map(int,re.findall(r'\d+',scroll.get('bounds'))))
  x=(sb[0]+sb[2])//2; height=sb[3]-sb[1]
  run('shell','input','swipe',str(x),str(sb[1]+int(height*.8)),str(x),str(sb[1]+int(height*.2)),'300')
mode=sys.argv[1]
if mode=='tap': tap(sys.argv[2])
if mode=='type':
 tap(sys.argv[2]);run('shell','input','text',sys.argv[3].replace(' ','%s'))
if mode=='back':run('shell','input','keyevent','4')
