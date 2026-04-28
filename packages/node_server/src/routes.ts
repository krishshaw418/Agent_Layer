import type { Request, Response } from "express";
import Router from "express";
import { jobSchema } from "./schema";
import redisClient from "./redis";
import { config } from "./config";

const router = Router();

router.post('/new-job', async (req: Request, res: Response) => {
    const parsed = jobSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({ success: parsed.success, message: JSON.parse(parsed.error.message) });
    };

    try {
        await redisClient.publish(config.channel_name, JSON.stringify(parsed.data));
        return res.status(200).json({ success: true, message: "Job published!" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Something went wrong!" });
    }
});

export default router;