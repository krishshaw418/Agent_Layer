import type { Request, Response } from "express";
import Router from "express";
import { jobIdSchema } from "./schema";
import jobQueue from "./queue";

const router = Router();

router.post("/new-job", async (req: Request, res: Response) => {
  const parsed = jobIdSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: parsed.success,
      message: JSON.parse(parsed.error.message),
    });
  }

  try {

    // Prevent duplicate job enqueue
    const existing = await jobQueue.getJob(parsed.data.job_id);

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Job already queued",
      });
    }

    // Push to job queue
    await jobQueue.add(`new_job`, parsed.data , {
      jobId: parsed.data.job_id,
      removeOnComplete: true,
      removeOnFail: true,
    });
    
    // Return acknowledgement to the indexer
    return res.status(200).json({ success: true, message: "Job published!" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Something went wrong!" });
  }
});

export default router;
