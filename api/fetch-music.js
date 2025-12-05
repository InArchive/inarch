export const config = {
  runtime: "nodejs"
};

import { fetchMusicCore } from "../lib/core/fetchMusic.js";

export default async function handler(req) {
  try {
    const { job_id } = await req.json();

    if (!job_id) {
      return new Response(
        JSON.stringify({ error: "job_id required" }),
        { status: 400 }
      );
    }

    const musicUrl = await fetchMusicCore(job_id);

    return new Response(
      JSON.stringify({ music_url: musicUrl }),
      { status: 200 }
    );

  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500 }
    );
  }
}
