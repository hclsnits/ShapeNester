import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fs from "fs";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // Serve Excel portfolio file
  app.get("/api/portfolio/excel", (req, res) => {
    try {
      const excelPath = path.resolve(import.meta.dirname, "..", "attached_assets", "wolviltportfolio.xls");
      
      if (!fs.existsSync(excelPath)) {
        return res.status(404).json({ error: "Portfolio file not found" });
      }
      
      const fileBuffer = fs.readFileSync(excelPath);
      
      res.set({
        'Content-Type': 'application/vnd.ms-excel',
        'Content-Length': fileBuffer.length.toString(),
        'Content-Disposition': 'attachment; filename="portfolio.xls"'
      });
      
      res.send(fileBuffer);
    } catch (error) {
      console.error('Error serving Excel file:', error);
      res.status(500).json({ error: "Failed to serve portfolio file" });
    }
  });

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  return httpServer;
}
