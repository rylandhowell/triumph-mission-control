#!/usr/bin/env python3
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
BACKUP = ROOT / "backups" / "mission-control-live-safari-latest.json"
if len(sys.argv) > 1:
    BACKUP = pathlib.Path(sys.argv[1]).expanduser().resolve()

if not BACKUP.exists():
    raise SystemExit(f"Backup not found: {BACKUP}")

obj = json.loads(BACKUP.read_text())
data = obj.get("data", {})

def osa(script: str):
    subprocess.run(["osascript", "-e", script], check=True)

osa('''
tell application "Safari"
  activate
  open location "https://triumph-mission-control.vercel.app"
  delay 2
end tell
''')

for k, v in data.items():
    js = f"localStorage.setItem({json.dumps(k)}, {json.dumps(v)});"
    osa(f'''tell application "Safari"\n  tell front document\n    do JavaScript {json.dumps(js)}\n  end tell\nend tell''')

osa('''
tell application "Safari"
  tell front document
    do JavaScript "location.reload()"
  end tell
end tell
''')

print(f"Restored {len(data)} keys from {BACKUP}")
