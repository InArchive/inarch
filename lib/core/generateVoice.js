import { sql } from "../db";

export async function generateVoiceCore(job_id: number) {
  // 1. Get script text
  const rows = await sql`
    SELECT vo_script 
    FROM scripts 
    WHERE job_id = ${job_id}
  `;

  if (!rows.length) {
    throw new Error("No script found for this job");
  }

  const text = rows[0].vo_script;

  // 2. ElevenLabs TTS
  const voiceId = "21m00Tcm4TlvDq8ikWAM"; // default free voice

  const ttsResponse = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2",
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.8
        }
      })
    }
  );

  if (!ttsResponse.ok) {
    let details = {};
    try {
      details = await ttsResponse.json();
    } catch {}
    throw new Error("ElevenLabs TTS failed: " + JSON.stringify(details));
  }

  // 3. Convert audio to base64
  const arrayBuffer = await ttsResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");
  const dataUrl = `data:audio/mpeg;base64,${base64}`;

  // 4. Update DB
  await sql`
    UPDATE assets
    SET voiceover_url = ${dataUrl}
    WHERE job_id = ${job_id}
  `;

  return dataUrl;
}
