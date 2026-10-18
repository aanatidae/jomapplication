"""Bounded native stress helper. Targets come from current UI-tree bounds."""
import pathlib
import re
import shlex
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

sys.stdout.reconfigure(encoding="utf-8")
ADB = "C:/Users/SawJu/AppData/Local/Android/Sdk/platform-tools/adb.exe"
ROOT = pathlib.Path(__file__).parent


def run(*args):
    return subprocess.check_output([ADB, "-s", "emulator-5554", *args], timeout=10)


def tree():
    for _ in range(3):
        raw = run("exec-out", "uiautomator", "dump", "/dev/tty").decode("utf-8", "replace")
        if "<?xml" in raw:
            return raw[raw.index("<?xml"):raw.rindex("</hierarchy>") + 12]
        time.sleep(.5)
    raise ValueError("UI tree unavailable")


def bounds(node):
    return list(map(int, re.findall(r"\d+", node.get("bounds"))))


def scroll(up=False, count=1):
    root = ET.fromstring(tree())
    node = next(n for n in root.iter("node") if n.get("scrollable") == "true")
    x1, y1, x2, y2 = bounds(node)
    x = (x1+x2)//2
    # A multiline EditText owns internal scrolling. Target the outer form's
    # visible gutter instead, deriving it from the current input/scroll bounds.
    for child in node.iter('node'):
        if child.get('class') == 'android.widget.EditText':
            left, top, right, bottom = bounds(child)
            if bottom > top and left > x1:
                x = (x1+left)//2
                break
    start, end = y1 + int((y2-y1)*.8), y1 + int((y2-y1)*.2)
    if up:
        start, end = end, start
    for _ in range(count):
        # Slow drag avoids flinging past a short field/action between tall cards.
        run("shell", "input", "swipe", str(x), str(start), str(x), str(end), "650")


def tap(label):
    for _ in range(6):
        root = ET.fromstring(tree())
        for node in sorted(root.iter("node"), key=lambda n: n.get("class") != "android.widget.EditText"):
            if label not in (node.get("text"), node.get("content-desc")):
                continue
            x1, y1, x2, y2 = bounds(node)
            if x2 > x1 and y2 > y1:
                run("shell", "input", "tap", str((x1+x2)//2), str((y1+y2)//2))
                return
        scroll()
    raise ValueError("Target not found: " + label)


mode = sys.argv[1]
if mode == "open":
    run("shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", shlex.quote("exp://127.0.0.1:8082/--/" + sys.argv[2]))
    time.sleep(1)
elif mode == "tap":
    tap(sys.argv[2])
elif mode == "scroll":
    scroll(len(sys.argv) > 3 and sys.argv[3] == "up", int(sys.argv[2]))
elif mode == "capture":
    xml = tree()
    (ROOT / (sys.argv[2] + ".xml")).write_text(xml, encoding="utf-8")
    (ROOT / (sys.argv[2] + ".png")).write_bytes(run("exec-out", "screencap", "-p"))
    for node in ET.fromstring(xml).iter("node"):
        label = node.get("content-desc") or node.get("text")
        if label:
            print(label[:160], node.get("bounds"))
