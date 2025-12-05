import { sql } from "../db.js";

export async function fetchMusicCore(job_id) {
  // TEMP free music placeholder (replace later with Pixabay API)
  const url = "https://filesamples.com/samples/audio/mp3/sample1.mp3";

  await sql`
    UPDATE assets
    SET music_url = ${url}
    WHERE job_id = ${job_id}
  `;

  return url;
}
