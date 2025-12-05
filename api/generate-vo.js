export const config = {
  runtime: "nodejs"
};

import { generateVoiceCore } from "../lib/core/generateVoice.js";

export default async function handler(req) {
  try {
    const { job_id } = await req.json();

    if (!job_id) {
      return new Response(
        JSON.stringify({ error: "job_id required" }),
        { status: 400 }
      );
    }

    const voiceUrl = await generateVoiceCore(job_id);

    return new Response(
      JSON.stringify({
        ok: true,
        job_id,
        voiceover_url: voiceUrl
      }),
      { status: 200 }
    );

  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500 }
    );
  }
}
