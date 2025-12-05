export const config = {
  runtime: "nodejs"
};

import { generateScriptCore } from "../lib/core/generateScript.js";

export default async function handler(req) {
  try {
    const { job_id } = await req.json();

    if (!job_id) {
      return new Response(JSON.stringify({ error: "job_id required" }), {
        status: 400
      });
    }

    const result = await generateScriptCore(job_id);

    return new Response(JSON.stringify({ ok: true, script: result }), {
      status: 200
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
