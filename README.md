# Web Cookie Exporter (Local Only)

This extension exports cookies for:

- the current tab domain, or
- a domain you enter manually.

Output format is Netscape `cookies.txt` (compatible with tools such as `yt-dlp --cookies`).

The extension does not send network requests.

## Folders

- `chromium/` for Chromium-based browsers
- `firefox/` for Firefox

## Manual Install (Chromium)

1. Open extensions management page.
2. Enable developer mode.
3. Click **Load unpacked**.
4. Select the `chromium` folder.

## Manual Install (Firefox)

1. Open the temporary add-on debug page.
2. Click **Load Temporary Add-on...**.
3. Select `firefox/manifest.json`.

Note: temporary add-ons are removed after Firefox restart.

## Usage

1. Open the extension popup.
2. Click **Export Current Tab** or enter a domain and click **Export Domain**.
3. Save the exported `.txt` file.

## Example (with yt-dlp)

```bash
yt-dlp --cookies "./cookies/exported-cookies.txt" --list-subs "<video-url>"
```

## Security Notes

- Exported cookie files are sensitive.
- Do not share or upload them.
- Delete them after use.
