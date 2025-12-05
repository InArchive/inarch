import generateScript from "../../api/generate-script.js";

export async function buildScript(job_id) {
  return generateScript({
    json: async () => ({ job_id })
  });
}
