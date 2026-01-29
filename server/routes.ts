import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertUserSchema, insertMessageSchema, insertReactionSchema } from "@shared/schema";
import path from "path";
import fs from "fs";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  
  app.post(api.users.login.path, async (req, res) => {
    try {
      const input = insertUserSchema.parse(req.body);
      let user = await storage.getUserByUsername(input.username);
      if (!user) {
        user = await storage.createUser(input);
      } else {
        await storage.updateUserActivity(user.id);
      }
      res.json(user);
    } catch (e) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.get(api.users.list.path, async (req, res) => {
    const activeUsers = await storage.getActiveUsers();
    res.json(activeUsers); 
  });

  app.post("/api/heartbeat", async (req, res) => {
    try {
      const { userId } = req.body;
      if (userId) {
        await storage.updateUserActivity(userId);
      }
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.get(api.messages.list.path, async (req, res) => {
    const messages = await storage.getMessages();
    res.json(messages);
  });

  app.post(api.messages.create.path, async (req, res) => {
    try {
      const input = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(input);
      res.status(201).json(message);
    } catch (e) {
      res.status(400).json({ message: "Invalid message" });
    }
  });

  app.patch(api.messages.update.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { content } = z.object({ content: z.string() }).parse(req.body);
      const message = await storage.updateMessage(id, content);
      if (!message) return res.status(404).json({ message: "Not found" });
      res.json(message);
    } catch (e) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.delete(api.messages.delete.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteMessage(id);
    if (!success) return res.status(404).json({ message: "Not found" });
    res.status(204).end();
  });

  app.post("/api/reactions", async (req, res) => {
    try {
      const input = insertReactionSchema.parse(req.body);
      const reaction = await storage.addReaction(input);
      res.status(201).json(reaction);
    } catch (e) {
      res.status(400).json({ message: "Invalid reaction" });
    }
  });

  app.delete("/api/reactions", async (req, res) => {
    try {
      const { messageId, userId, emoji } = req.body;
      const success = await storage.removeReaction(messageId, userId, emoji);
      if (!success) return res.status(404).json({ message: "Not found" });
      res.status(204).end();
    } catch (e) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  app.post("/api/upload", async (req, res) => {
    try {
      const chunks: Buffer[] = [];
      let size = 0;
      const maxSize = 2 * 1024 * 1024;

      req.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > maxSize) {
          res.status(413).json({ message: "File too large. Max 2MB allowed." });
          req.destroy();
          return;
        }
        chunks.push(chunk);
      });

      req.on("end", () => {
        if (res.headersSent) return;
        
        const buffer = Buffer.concat(chunks);
        const base64Data = buffer.toString();
        const matches = base64Data.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.+)$/);
        
        if (!matches) {
          return res.status(400).json({ message: "Invalid image format" });
        }
        
        const ext = matches[1];
        const data = matches[2];
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const filepath = path.join(uploadsDir, filename);
        
        fs.writeFileSync(filepath, Buffer.from(data, "base64"));
        res.json({ url: `/uploads/${filename}` });
      });

      req.on("error", () => {
        res.status(500).json({ message: "Upload failed" });
      });
    } catch (e) {
      res.status(500).json({ message: "Upload failed" });
    }
  });

  app.use("/uploads", (req, res, next) => {
    const filePath = path.join(uploadsDir, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "Not found" });
    }
  });

  return httpServer;
}
