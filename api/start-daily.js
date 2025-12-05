export const config = {
  runtime: "nodejs"
};

import { sql } from "../lib/db";
import { startReelCore } from "../lib/core/startReel";

export default async function handler() {
  try {
    const today = new Date();
    const month = today.getUTCMonth() + 1;
    const day = today.getUTCDate();

    const rows = await sql`
      SELECT *
      FROM events
      WHERE EXTRACT(MONTH FROM event_date) = ${month}
      AND EXTRACT(DAY FROM event_date) = ${day}
      ORDER BY RANDOM()
      LIMIT 1
    `;

    if (rows.length === 0) {
      return new Response(
        JSON.stringify({ error: "no events found for today" }),
        { status: 404 }
      );
    }

    const event = rows[0];

    // Run the FULL pipeline (script → VO → bg → music → ready)
    const job_id = await startReelCore(
      event.id,
      event.event_date.toISOString().split("T")[0]
    );

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
