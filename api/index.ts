import type { Request, Response } from "express";
import app from "../server.ts";

export default function handler(req: Request, res: Response) {
  // If the request was rewritten by Vercel and the path stripped, ensure /api prefix is present
  if (req.url && !req.url.startsWith("/api") && !req.url.startsWith("/api/")) {
    req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
  }
  return app(req, res);
}
