import { neon } from "@neondatabase/serverless";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { renderReel } from "../lib/ffmpeg-template.js";
import { writeSRT } from "../lib/srt-writer.js";
import { saveFile } from "../lib/storage.js";

const sql = neon(process.env.NEON_DB_URL);
const TMP = "/tmp/inarchive";

// Scheduler config
const SCHEDULE = {
  intervalHours: 6,   // one reel every 6 hours → 4 per day
  maxPerDay: 4
};

async function scheduler() {
  try {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    // 1. Count how many jobs generated today
    const countRows = await sql`
      SELECT COUNT(*) FROM jobs
      WHERE target_date = ${today}
    `;
    const countToday = Number(countRows[0].count);

    if (countToday >= SCHEDULE.maxPerDay) {
      return; // Already hit today's limit
    }

    // 2. Check the last job timestamp
    const lastRows = await sql`
      SELECT created_at FROM jobs
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (lastRows.length) {
      const last = new Date(lastRows[0].created_at);
      const hoursSince = (now - last) / 1000 / 3600;
      if (hoursSince < SCHEDULE.intervalHours) {
        return; // Too soon to create next job
      }
    }

    // 3. Select a historical event for today
    const month = now.getUTCMonth() + 1;
    const day = now.getUTCDate();

    const events = await sql`
      SELECT id, event_date
      FROM events
      WHERE EXTRACT(MONTH FROM event_date) = ${month}
      AND EXTRACT(DAY FROM event_date) = ${day}
      ORDER BY RANDOM()
      LIMIT 1
    `;

    if (!events.length) {
      console.log("📭 Scheduler: no events found for today");
      return;
    }

    const evt = events[0];

    // 4. Trigger Vercel's /api/start-reel to create a full pipeline job
    // This MUST be set in Railway → START_REEL_WEBHOOK_URL
    await fetch(process.env.START_REEL_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: evt.id,
        target_date: evt.event_date.toISOString().split("T")[0]
      })
    });

    console.log("🕒 Scheduler: created new job automatically");

  } catch (err) {
    console.error("❌ Scheduler error:", err);
  }
}

async function main() {
  if (!fs.existsSync(TMP)) {
    fs.mkdirSync(TMP, { recursive: true });
  }

  while (true) {
    // Run internal scheduler first
    await scheduler();

    // Look for jobs ready to render
    const jobs = await sql`
      SELECT * FROM jobs
      WHERE status = 'ready_to_render'
      LIMIT 1
    `;

    const job = jobs[0];
    if (!job) {
      await sleep(3000);
      continue;
    }

    console.log(`🎬 Rendering job ${job.id}`);

    try {
      await sql`
        UPDATE jobs SET status='rendering'
        WHERE id=${job.id}
      `;

      const [script] = await sql`
        SELECT * FROM scripts WHERE job_id=${job.id}
      `;
      const [assets] = await sql`
        SELECT * FROM assets WHERE job_id=${job.id}
      `;

      if (!script || !assets) {
        throw new Error("Missing script or assets row");
      }

      const bgPath = path.join(TMP, `bg_${job.id}.mp4`);
      const voPath = path.join(TMP, `vo_${job.id}.mp3`);
      const musicPath = path.join(TMP, `music_${job.id}.mp3`);
      const srtPath = path.join(TMP, `sub_${job.id}.srt`);
      const outPath = path.join(TMP, `final_${job.id}.mp4`);

      // 1 — Background video
      await downloadToFile(assets.bg_video_url, bgPath);

      // 2 — Voiceover audio (base64)
      decodeDataUrlToFile(assets.voiceover_url, voPath);

      // 3 — Background music
      await downloadToFile(assets.music_url, musicPath);

      // 4 — Captions (.srt)
      writeSRT(script.srt, srtPath);

      // 5 — Render final reel via ffmpeg
      await renderReel({
        bg: bgPath,
        vo: voPath,
        music: musicPath,
        srt: srtPath,
        out: outPath,
      });

      // 6 — Save final file to storage
      const buffer = fs.readFileSync(outPath);
      const storedPath = await saveFile(`final_${job.id}.mp4`, buffer);

      await sql`
        UPDATE assets
        SET final_video_url=${storedPath}
        WHERE job_id = ${job.id}
      `;

      await sql`
        UPDATE jobs
        SET status='rendered'
        WHERE id=${job.id}
      `;

      console.log(`✅ Job ${job.id} rendered successfully`);

      // Cleanup temp files
      cleanupFiles([bgPath, voPath, musicPath, srtPath, outPath]);

    } catch (err) {
      console.error(`❌ Worker failed job ${job.id}:`, err);
      await sql`
        UPDATE jobs
        SET status='failed', error_message=${String(err.stack || err)}
        WHERE id=${job.id}
      `;
    }
  }
}

async function downloadToFile(url, dest) {
  if (!url) throw new Error("Missing URL for download: " + dest);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${url} — ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buffer);
}

function decodeDataUrlToFile(dataUrl, dest) {
  if (!dataUrl?.startsWith("data:")) {
    throw new Error("Invalid voiceover data URL");
  }
  const base64 = dataUrl.split(",")[1];
  fs.writeFileSync(dest, Buffer.from(base64, "base64"));
}

function cleanupFiles(paths) {
  for (const p of paths) {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

main().catch((err) => {
  console.error("❌ Fatal worker error:", err);
  process.exit(1);
});
