export const config = {
  runtime: "nodejs"
};

import { sql } from "../lib/db.js";

export default async function handler(req) {
  try {
    const { job_id, bg_video_url, music_url, voiceover_url } = await req.json();

    if (!job_id) {
      return new Response(
        JSON.stringify({ error: "job_id is required" }),
        { status: 400 }
      );
    }

    await sql`
      UPDATE assets SET
        bg_video_url = COALESCE(${bg_video_url}, bg_video_url),
        music_url = COALESCE(${music_url}, music_url),
        voiceover_url = COALESCE(${voiceover_url}, voiceover_url)
      WHERE job_id = ${job_id}
    `;

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200 }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
