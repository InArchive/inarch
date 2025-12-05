import { sql } from "../db.js";

export async function generateScriptCore(job_id) {
  // 1. Fetch job
  const jobRows = await sql`SELECT * FROM jobs WHERE id=${job_id}`;
  if (jobRows.length === 0) throw new Error("Job not found");

  // 2. Fetch event
  const eventRows = await sql`
    SELECT * FROM events WHERE id=${jobRows[0].event_id}
  `;
  if (eventRows.length === 0) throw new Error("Event not found");

  const evt = eventRows[0];

  // 3. GROQ Request
  const groq = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: `
Generate a 15–20 second script for a short history reel.

Event title: ${evt.title}
Event description: ${evt.summary}

Return JSON:
{
  "hook": "...",
  "script": "...",
  "srt": [
    {"text": "...", "start": 0, "end": 2},
    {"text": "...", "start": 2, "end": 4}
  ]
}
          `
        }
      ]
    })
  });

  const aiJson = await groq.json();

  if (!aiJson.choices || !aiJson.choices[0]?.message?.content) {
    throw new Error("Groq returned no choices: " + JSON.stringify(aiJson));
  }

  let data;
  try {
    data = JSON.parse(aiJson.choices[0].message.content);
  } catch (err) {
    throw new Error(
      "Groq JSON parse error: " + aiJson.choices[0].message.content
    );
  }

  // 4. Save script into DB
  await sql`
    INSERT INTO scripts (job_id, hook_text, vo_script, srt)
    VALUES (${job_id}, ${data.hook}, ${data.script}, ${JSON.stringify(data.srt)})
  `;

  return data;
}
