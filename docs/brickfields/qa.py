"""Bounded ADB QA helper; every input target derives from the current UI tree."""

import pathlib
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

sys.stdout.reconfigure(encoding="utf-8")
ADB = "C:/Users/SawJu/AppData/Local/Android/Sdk/platform-tools/adb.exe"
ROOT = pathlib.Path(__file__).parent


def run(*args):
    return subprocess.check_output([ADB, "-s", "emulator-5554", *args], timeout=20)


def tree():
    raw = run("exec-out", "uiautomator", "dump", "/dev/tty").decode("utf-8", "replace")
    return raw[raw.index("<?xml"):raw.rindex("</hierarchy>") + 12]


def box(node):
    return list(map(int, re.findall(r"\d+", node.get("bounds", ""))))


def describe(raw):
    root = ET.fromstring(raw)
    for node in root.iter("node"):
        label = node.get("text") or node.get("content-desc")
        if label:
            print(label, node.get("class"), node.get("bounds"))


mode = sys.argv[1]
if mode == "capture":
    name = sys.argv[2]
    raw = tree()
    (ROOT / f"{name}.xml").write_text(raw, encoding="utf-8")
    (ROOT / f"{name}.png").write_bytes(run("exec-out", "screencap", "-p"))
    describe(raw)
elif mode == "tap":
    root = ET.fromstring(tree())
    label = sys.argv[2]
    for node in root.iter("node"):
        if label in (node.get("text"), node.get("content-desc")):
            x1, y1, x2, y2 = box(node)
            if x2 > x1 and y2 > y1:
                run("shell", "input", "tap", str((x1+x2)//2), str((y1+y2)//2))
                break
    else:
        raise ValueError("Target not in current UI tree: " + label)
elif mode == "scroll":
    root = ET.fromstring(tree())
    scroll = next(n for n in root.iter("node") if n.get("scrollable") == "true"
                  and n.get("class") != "android.webkit.WebView")
    x1, y1, x2, y2 = box(scroll)
    native = []
    def visit(node):
        if node.get("class") == "android.webkit.WebView" or node.get("content-desc", "").startswith(
            "Interactive geographic map."
        ):
            return
        if node.get("class") == "android.widget.TextView" and node.get("text"):
            left, top, right, bottom = box(node)
            if bottom > top and top > y1 + 40 and bottom < y2 - 40:
                native.append((left, top, right, bottom))
        for child in node:
            visit(child)
    visit(scroll)
    left, top, right, bottom = max(native, key=lambda rect: rect[1] + rect[3])
    x, y = (left+right)//2, (top+bottom)//2
    end = max(y1+40, y-500) if len(sys.argv) < 3 or sys.argv[2] != "up" else min(y2-40, y+500)
    run("shell", "input", "swipe", str(x), str(y), str(x), str(end), "650")
elif mode == "pick":
    root = ET.fromstring(tree())
    web = next(n for n in root.iter("node") if n.get("content-desc", "").startswith(
        "Interactive geographic map."
    ))
    x1, y1, x2, y2 = box(web)
    # A bounded central viewport tap, not an inferred geographic position.
    run("shell", "input", "tap", str((x1+x2)//2), str((y1+y2)//2))
elif mode == "pan":
    root = ET.fromstring(tree())
    web = next(n for n in root.iter("node") if n.get("content-desc", "").startswith(
        "Interactive geographic map."
    ))
    x1, y1, x2, y2 = box(web)
    y = (y1+y2)//2
    run("shell", "input", "swipe", str(x1+(x2-x1)//3), str(y),
        str(x1+2*(x2-x1)//3), str(y), "650")
else:
    raise ValueError("Unsupported QA action")
