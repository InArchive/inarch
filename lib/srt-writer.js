import fs from "fs";

export function writeSRT(segments, outPath) {
  let out = "";

  segments.forEach((seg, i) => {
    out += `${i + 1}\n`;
    out += `${format(seg.start)} --> ${format(seg.end)}\n`;
    out += `${seg.text}\n\n`;
  });

  fs.writeFileSync(outPath, out);
  return outPath;
}

function format(sec) {
  const ms = Math.floor(sec * 1000);
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  const msStr = String(ms % 1000).padStart(3, "0");
  return `${h}:${m}:${s},${msStr}`;
}
