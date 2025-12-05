import fs from "fs";
import path from "path";

const STORAGE_DIR = "/tmp/inarchive";

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

// Save a Buffer or base64 string to disk
export async function saveFile(filename, data) {
  const full = path.join(STORAGE_DIR, filename);

  const buffer =
    typeof data === "string" && data.startsWith("data:")
      ? Buffer.from(data.split(",")[1], "base64")
      : Buffer.isBuffer(data)
      ? data
      : Buffer.from(data);

  fs.writeFileSync(full, buffer);
  return full;
}

// Return absolute path
export function getPath(filename) {
  return path.join(STORAGE_DIR, filename);
}

// Delete file if exists
export function removeFile(filename) {
  const p = path.join(STORAGE_DIR, filename);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}
