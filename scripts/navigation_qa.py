"""Capture emulator evidence or tap an exact UI label; never derives taps from screenshots."""
import argparse
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("name")
parser.add_argument("--tap")
parser.add_argument("--adb", default="C:/Users/SawJu/AppData/Local/Android/Sdk/platform-tools/adb.exe")
args = parser.parse_args()
adb = [args.adb, "-s", "emulator-5554"]
folder = Path("docs/navigation")
folder.mkdir(parents=True, exist_ok=True)
xml = subprocess.check_output(adb + ["exec-out", "uiautomator", "dump", "/dev/tty"]).decode("utf-8", errors="replace")
(folder / f"{args.name}.xml").write_text(xml, encoding="utf-8")
tree = ET.fromstring(xml[xml.index("<?xml"):xml.rindex("</hierarchy>") + len("</hierarchy>")])
for node in tree.iter("node"):
    label = node.get("text") or node.get("content-desc")
    if label:
        print(label, node.get("bounds"))
    if args.tap and args.tap in (node.get("text"), node.get("content-desc")):
        x1, y1, x2, y2 = map(int, re.findall(r"\d+", node.get("bounds", "")))
        subprocess.check_call(adb + ["shell", "input", "tap", str((x1 + x2) // 2), str((y1 + y2) // 2)])
        print("Tapped", args.tap)
        break
else:
    if args.tap:
        raise SystemExit("Requested UI label not found")
if not args.tap:
    (folder / f"{args.name}.png").write_bytes(subprocess.check_output(adb + ["exec-out", "screencap", "-p"]))
