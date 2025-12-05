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

    await sql`
      UPDATE jobs
      SET status='ready_to_render'
      WHERE id=${job_id}
    `;

    return new Response(
      JSON.stringify({ ok: true, job_id }),
      { status: 200 }
    );
    
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
