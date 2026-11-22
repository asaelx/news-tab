#!/bin/bash
set -euo pipefail

extension_id=${1:-}
shared_flag=${2:-}
if [[ ! "$extension_id" =~ ^[a-p]{32}$ ]] || [[ -n "$shared_flag" && "$shared_flag" != "--shared-chromium" ]]; then
  echo "Usage: bash native/install.sh <Briefly extension ID from brave://extensions> [--shared-chromium]" >&2
  exit 1
fi

source_dir="$(cd "$(dirname "$0")" && pwd)"
host_dir="$HOME/Library/Application Support/BraveSoftware/Brave-Browser/NativeMessagingHosts"
build_dir="$(mktemp -d)"
trap 'rm -rf "$build_dir"' EXIT
mkdir -p "$host_dir"
xcrun swiftc -target arm64-apple-macosx26.0 "$source_dir/BrieflyWriter.swift" -o "$build_dir/briefly-writer"
install -m 755 "$build_dir/briefly-writer" "$host_dir/briefly-writer"
python3 - "$host_dir" "$extension_id" <<'PY'
import json, sys
from pathlib import Path
directory = Path(sys.argv[1])
name = 'com.briefly.writer'
(directory / f'{name}.json').write_text(json.dumps({
    'name': name,
    'description': 'Briefly on-device editorial writer',
    'path': str(directory / 'briefly-writer'),
    'type': 'stdio',
    'allowed_origins': [f'chrome-extension://{sys.argv[2]}/'],
}, indent=2) + '\n')
PY
if [[ "$shared_flag" == "--shared-chromium" ]]; then
  shared_dir="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
  mkdir -p "$shared_dir"
  install -m 644 "$host_dir/com.briefly.writer.json" "$shared_dir/com.briefly.writer.json"
fi
echo "Briefly's on-device writer is installed."
