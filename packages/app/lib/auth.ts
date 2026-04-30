import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  if (!token) throw new Error("No token");

  const decoded = jwt.verify(token, JWT_SECRET) as {
    address: string;
  };

  return decoded;
}

export function getNodeFromRequest(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");

  if (!token) throw new Error("No token");

  const decoded = jwt.verify(token, JWT_SECRET) as {
    address: string;
  };

  return decoded;
}