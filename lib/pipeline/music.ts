import fetchMusic from "../../api/fetch-music";

export async function buildMusic(job_id) {
  return fetchMusic({
    json: async () => ({ job_id })
  });
}
