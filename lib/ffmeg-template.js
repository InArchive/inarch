import { execSync } from "child_process";

// Render final reel (1080x1920 vertical)
export async function renderReel({ bg, vo, music, srt, out }) {
  // ffmpeg command
  const cmd = `
    ffmpeg -y \
    -i "${bg}" \
    -i "${vo}" \
    -i "${music}" \
    -vf "scale=1080:1920:force_original_aspect_ratio=cover,subtitles='${srt}':force_style='Fontsize=38,PrimaryColour=&HFFFFFF&,BorderStyle=1,Outline=3'" \
    -map 0:v -map 1:a \
    -shortest \
    -c:v libx264 -preset veryfast \
    -c:a aac \
    "${out}"
  `;

  execSync(cmd, { stdio: "inherit" });
  return out;
}
