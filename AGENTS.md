# Working on Briefly

Briefly is a Manifest V3 new tab extension for Brave. The browser extension uses plain JavaScript and CSS and loads directly from this checkout. There is no package install, build step, or backend. The optional Apple Intelligence helper is built separately.

## Project map

- `index.html` loads the new tab page, stylesheet, and favicon.
- `app.js` handles RSS, featured stories, archives, preferences, weather, and editorial text.
- `styles.css` controls layout, themes, and responsive and accessibility styles.
- `manifest.json` declares the new tab override, version, permissions, and extension icons.
- `native/BrieflyWriter.swift` and `native/install.sh` implement and register the macOS native messaging helper.

## Behavior to preserve

- Keep the first view focused on featured stories. Load more stories as the user scrolls. Keep controls usable with a keyboard and in both themes.
- Subject switches update Latest immediately. Opening a story replaces the current tab and marks it read. The × moves it to Not interested without opening it. Both archives support restoring stories, subject to the active feed filters.
- Use the normalized story URL for identity and the RSS publication timestamp for age. Apply the seven-day limit to the feed, archives, restored stories, and local cache. Preserve existing preferences and history when changing storage formats.
- Treat RSS content and model replies as untrusted input. Escape content in HTML and render generated lines as text. Keep feed and weather host permissions limited to the services in use.
- Keep Apple Intelligence optional and on device. Send only the featured headline and summary. Use a playful tone for light stories and a factual tone for serious or ambiguous stories. Leave the editorial line blank when generation is unavailable.

## Verification

Run the checks relevant to the change:

```sh
node --check app.js
python3 -m json.tool manifest.json >/dev/null
bash -n native/install.sh
git diff --check
```

For browser behavior, reload the unpacked extension in `brave://extensions` and open a fresh tab. Check the feature through its normal UI. A standalone preview uses sample stories and cannot verify extension permissions, live RSS, or native messaging. If Brave shows a crashed new tab after reloading, try fully quitting and reopening Brave before reinstalling Briefly.

For native changes, follow the setup in [README.md](README.md) and verify the generated line in Brave. The installer restricts the helper to the supplied extension ID. Use the shared Chromium registration only when required by the Brave build.
