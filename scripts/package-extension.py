"""Create a runtime-only Chrome Web Store ZIP using the standard library."""
import json
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / "manifest.json").read_text())
files = {"manifest.json", "shared.js", "content.js", "page-bridge.js", "background.js", "popup.html", "popup.css", "popup.js"}
files.update(manifest.get("icons", {}).values())
files.update(manifest.get("action", {}).get("default_icon", {}).values())
output = root / f"jupiter-kaks-v{manifest['version']}.zip"
for filename in files:
    if not (root / filename).is_file():
        raise SystemExit(f"Missing extension asset: {filename}")
with ZipFile(output, "w", ZIP_DEFLATED) as archive:
    for filename in sorted(files):
        archive.write(root / filename, filename)
with ZipFile(output) as archive:
    if archive.testzip() is not None:
        raise SystemExit("Package integrity check failed")
print(output)
print(f"{len(files)} files, {output.stat().st_size:,} bytes")
