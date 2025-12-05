import fetchBg from "../../api/fetch-bg-video.js";

export async function buildBg(job_id) {
  return fetchBg({
    json: async () => ({ job_id })
  });
}
