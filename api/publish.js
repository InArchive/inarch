export const config = {
  runtime: "nodejs"
};

import { sql } from "../lib/db";

export default async function handler(req) {
  try {
    const { job_id } = await req.json();

    if (!job_id) {
      return new Response(
        JSON.stringify({ error: "job_id is required" }),
        { status: 400 }
      );
    }

    const rows = await sql`
      SELECT final_video_url 
      FROM assets
      WHERE job_id = ${job_id}
    `;

    if (!rows.length || !rows[0].final_video_url) {
      return new Response(
        JSON.stringify({ error: "final video not found" }),
        { status: 400 }
      );
    }

    await sql`
      UPDATE jobs
      SET status='posted'
      WHERE id=${job_id}
    `;

    return new Response(
      JSON.stringify({
        ok: true,
        job_id,
        message: "Video marked as posted"
      }),
      { status: 200 }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
