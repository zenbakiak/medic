#!/bin/sh
# Screenshot a built sheet so you can look at it: shot.sh page.html out.png [width] [height]
# Animated sheets: build with MEDIC_FREEZE=0.5 (any moment 0..1) to draw every loop frozen at that moment, then shoot.
# Uses headless Chrome. Set CHROME to its path if it is not found.
set -e
CHROME="${CHROME:-$(command -v google-chrome || command -v chromium || echo "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")}"
page=$(cd "$(dirname "$1")" && pwd)/$(basename "$1")
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=2 \
  --window-size="${3:-900},${4:-1400}" --screenshot="$2" "file://$page" 2>/dev/null
echo "saved $2"
