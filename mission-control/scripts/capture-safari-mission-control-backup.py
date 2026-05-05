#!/usr/bin/env python3
import json
import datetime
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]
BACKUPS = ROOT / "backups"
BACKUPS.mkdir(exist_ok=True)

def osa(script: str) -> str:
    return subprocess.check_output(["osascript", "-e", script], text=True).strip()

activate = '''
tell application "Safari"
  activate
  set found to false
  repeat with w in windows
    repeat with t in tabs of w
      if (URL of t contains "triumph-mission-control.vercel.app") then
        set current tab of w to t
        set index of w to 1
        set found to true
        exit repeat
      end if
    end repeat
    if found then exit repeat
  end repeat
  if not found then
    open location "https://triumph-mission-control.vercel.app"
    delay 2
  end if
end tell
'''
osa(activate)

payload = osa('''
tell application "Safari"
  tell front document
    return do JavaScript "JSON.stringify({href:location.href,at:new Date().toISOString(),data:Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]),)})"
  end tell
end tell
''')

obj = json.loads(payload)
ts = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
path = BACKUPS / f"mission-control-live-safari-{ts}.json"
latest = BACKUPS / "mission-control-live-safari-latest.json"

path.write_text(json.dumps(obj, indent=2))
latest.write_text(json.dumps(obj, indent=2))
print(str(path))
print(str(latest))
