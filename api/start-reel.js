export const config = {
  runtime: "nodejs"
};

import { startReelCore } from "../lib/core/startReel";

export default async function handler(req) {
  try {
    const { event_id, target_date } = await req.json();

    if (!event_id || !target_date) {
      return new Response(
        JSON.stringify({ error: "event_id and target_date required" }),
        { status: 400 }
      );
    }

    const job_id = await startReelCore(event_id, target_date);

    return new Response(JSON.stringify({ job_id }), { status: 200 });

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
