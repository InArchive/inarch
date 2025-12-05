import fetchMusic from "../../api/fetch-music.js";

export async function buildMusic(job_id) {
  return fetchMusic({
    json: async () => ({ job_id })
  });
}
