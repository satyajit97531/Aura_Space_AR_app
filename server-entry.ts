import type { Request, Response } from "express";
import app from "./server.ts";

export default function handler(req: Request, res: Response) {
  // If the request was rewritten by Vercel and the path stripped, ensure /api prefix is present
  if (req.url && !req.url.startsWith("/api")) {
    const [pathname, search] = req.url.split("?");
    const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
    req.url = `/api${cleanPath}${search ? `?${search}` : ""}`;
  }
  return app(req, res);
}
