import fetchBg from "../../api/fetch-bg-video";

export async function buildBg(job_id) {
  return fetchBg({
    json: async () => ({ job_id })
  });
}
