"""Read only the Web template from the official, version-pinned remote ZIP.

HTTPS verifies the source; zipfile verifies entry CRC. This partial download does
not claim to verify the whole 1.35 GB archive's SHA-256. Local hashes are recorded.
"""
import hashlib
import io
import json
from pathlib import Path
import urllib.request
import zipfile

URL = "https://godot-releases.nbg1.your-objectstorage.com/4.5.2-stable/Godot_v4.5.2-stable_export_templates.tpz"
SIZE = 1353063159
DEST = Path(__file__).resolve().parent.parent / ".tools" / "godot"


class RemoteZip(io.RawIOBase):
    def __init__(self):
        self.pos = 0

    def seekable(self):
        return True

    def seek(self, offset, whence=0):
        self.pos = offset if whence == 0 else self.pos + offset if whence == 1 else SIZE + offset
        return self.pos

    def tell(self):
        return self.pos

    def read(self, size=-1):
        end = SIZE - 1 if size < 0 else min(SIZE - 1, self.pos + size - 1)
        if end < self.pos:
            return b""
        start = self.pos
        req = urllib.request.Request(URL + f"?range={start}-{end}", headers={"Range": f"bytes={start}-{end}"})
        with urllib.request.urlopen(req, timeout=180) as response:
            if response.status != 206 or not response.headers.get("Content-Range", "").startswith(f"bytes {start}-{end}/"):
                raise RuntimeError("Server did not honor byte range")
            data = response.read()
        if len(data) != end - start + 1:
            raise RuntimeError("Truncated template range")
        self.pos += len(data)
        return data


DEST.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(RemoteZip()) as archive:
    name = "templates/web_nothreads_release.zip"
    info = archive.getinfo(name)
    print(f"Downloading {name}: {info.compress_size} compressed bytes", flush=True)
    data = archive.read(name)
    target = DEST / "web_nothreads_release.zip"
    target.write_bytes(data)
    record = {"source": URL, "entry": name, "bytes": len(data), "crc32": info.CRC, "sha256": hashlib.sha256(data).hexdigest(), "verification": "HTTPS origin and ZIP entry CRC; not whole-archive SHA"}
    (DEST / "web-template-source.json").write_text(json.dumps(record, indent=2) + "\n")
    print(json.dumps(record), flush=True)
