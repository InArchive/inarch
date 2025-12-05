import generateVo from "../../api/generate-vo";

export async function buildVoice(job_id) {
  return generateVo({
    json: async () => ({ job_id })
  });
}
