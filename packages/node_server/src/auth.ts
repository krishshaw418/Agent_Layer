import type { Request, Response, NextFunction } from "express";
import { config } from "./config";

export const authenticateReq = (req: Request, res: Response, next: NextFunction) => {
    const secret = req.headers['authorization'];

    if (!secret) {
        return res.status(400).json({ success: false, message: "Missing auth secret!" });
    }

    if (secret != config.auth_secret) {
        return res.status(400).json({ success: false, message: "Invalid auth secret!" });
    }

    return next();
}