import { sql } from "../db";
import { generateScriptCore } from "./generateScript";
import { generateVoiceCore } from "./generateVoice";
import { fetchBgCore } from "./fetchBgVideo";
import { fetchMusicCore } from "./fetchMusic";

export async function startReelCore(event_id: number, target_date: string) {
  // 1. Create job
  const jobRow = await sql`
    INSERT INTO jobs (event_id, target_date, status)
    VALUES (${event_id}, ${target_date}, 'pending')
    RETURNING id
  `;
  const job_id = jobRow[0].id;

  // 2. Create initial assets record
  await sql`INSERT INTO assets (job_id) VALUES (${job_id})`;

  // 3. Generate script
  await generateScriptCore(job_id);

  // 4. Generate voiceover
  await generateVoiceCore(job_id);

  // 5. Fetch background video
  await fetchBgCore(job_id);

  // 6. Fetch background music
  await fetchMusicCore(job_id);

  // 7. Worker can now render
  await sql`
    UPDATE jobs
    SET status = 'ready_to_render'
    WHERE id = ${job_id}
  `;

  return job_id;
}
