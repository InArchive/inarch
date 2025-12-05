import { sql } from "../db.js";

export async function fetchBgCore(job_id) {
  // TEMP video placeholder (replace later with Pexels logic)
  const url =
    "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4";

  await sql`
    UPDATE assets
    SET bg_video_url = ${url}
    WHERE job_id = ${job_id}
  `;

  return url;
}
