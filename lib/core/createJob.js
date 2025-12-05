import { sql } from "../db";

export async function createJobCore(event_id: number, target_date: string) {
  const row = await sql`
    INSERT INTO jobs (event_id, target_date, status)
    VALUES (${event_id}, ${target_date}, 'pending')
    RETURNING id
  `;

  await sql`
    INSERT INTO assets (job_id)
    VALUES (${row[0].id})
  `;

  return { job_id: row[0].id };
}
