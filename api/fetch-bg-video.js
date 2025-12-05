export const config = {
  runtime: "nodejs"
};

import { fetchBgCore } from "../lib/core/fetchBgVideo.js";

export default async function handler(req) {
  try {
    const { job_id } = await req.json();

    if (!job_id) {
      return new Response(JSON.stringify({ error: "job_id required" }), {
        status: 400
      });
    }

    const bgUrl = await fetchBgCore(job_id);

    return new Response(JSON.stringify({ bg_video_url: bgUrl }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
