import type { Express } from "express";
import { storage } from "../storage";

export function registerPublicRoutes(app: Express) {
  // Get feature packages for pricing page
  app.get("/api/public/plans", async (req, res) => {
    try {
      const packages = await storage.getFeaturePackages();
      res.json(packages);
    } catch (error) {
      console.error("Error fetching feature packages:", error);
      res.status(500).json({ message: "Failed to fetch plans" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });
}