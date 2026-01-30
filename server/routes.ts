import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertUserSchema, insertMessageSchema, insertReactionSchema, insertDMRequestSchema, insertDirectMessageSchema, insertPollSchema } from "@shared/schema";
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
        const activeUsers = await storage.getActiveUsers();
        const isActive = activeUsers.some(u => u.id === user!.id);
        if (isActive) {
          return res.status(409).json({ message: "Username is already in use by an active user" });
        }
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
    const message = await storage.getMessage(id);
    if (!message) return res.status(404).json({ message: "Not found" });
    if (message.isLocked) {
      return res.status(403).json({ message: "Cannot delete a locked message" });
    }
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

  // Auto-cleanup files older than 3 hours
  const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
  
  const cleanupOldFiles = async () => {
    try {
      // Cleanup from storage
      const expiredFilenames = await storage.deleteExpiredFiles();
      
      // Cleanup from disk
      const files = fs.readdirSync(uploadsDir);
      const now = Date.now();
      
      files.forEach(file => {
        const filepath = path.join(uploadsDir, file);
        const stats = fs.statSync(filepath);
        const age = now - stats.mtimeMs;
        
        if (age > THREE_HOURS_MS) {
          fs.unlinkSync(filepath);
          console.log(`Cleaned up old file: ${file}`);
        }
      });
    } catch (e) {
      console.error("File cleanup error:", e);
    }
  };
  
  // Run cleanup every 30 minutes
  setInterval(cleanupOldFiles, 30 * 60 * 1000);
  // Also run immediately on startup
  cleanupOldFiles();

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

  // File upload endpoint (5MB limit, 3-hour auto-delete)
  app.post("/api/upload/file", async (req, res) => {
    try {
      const chunks: Buffer[] = [];
      let size = 0;
      const maxSize = 5 * 1024 * 1024;

      req.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > maxSize) {
          res.status(413).json({ message: "File too large. Max 5MB allowed." });
          req.destroy();
          return;
        }
        chunks.push(chunk);
      });

      req.on("end", async () => {
        if (res.headersSent) return;
        
        const buffer = Buffer.concat(chunks);
        const base64Data = buffer.toString();
        const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
        
        if (!matches) {
          return res.status(400).json({ message: "Invalid file format" });
        }
        
        const mimeType = matches[1];
        const data = matches[2];
        const ext = mimeType.split('/')[1] || 'bin';
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const filepath = path.join(uploadsDir, filename);
        
        fs.writeFileSync(filepath, Buffer.from(data, "base64"));
        
        const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
        await storage.createFile({
          filename,
          originalName: req.headers['x-original-name'] as string || filename,
          size: Buffer.from(data, "base64").length,
          mimeType,
          expiresAt
        });
        
        res.json({ url: `/uploads/${filename}`, expiresAt });
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

  app.patch("/api/users/:id/status", async (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!["online", "away", "busy", "offline"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const user = await storage.updateUserStatus(id, status);
    if (!user) return res.status(404).json({ message: "Not found" });
    res.json(user);
  });

  app.post("/api/messages/:id/lock", async (req, res) => {
    const id = parseInt(req.params.id);
    const { userId } = req.body;
    const message = await storage.lockMessage(id, userId);
    if (!message) return res.status(404).json({ message: "Not found" });
    res.json(message);
  });

  app.post("/api/messages/:id/unlock", async (req, res) => {
    const id = parseInt(req.params.id);
    const message = await storage.unlockMessage(id);
    if (!message) return res.status(404).json({ message: "Not found" });
    res.json(message);
  });

  app.post("/api/dm/request", async (req, res) => {
    try {
      const input = insertDMRequestSchema.parse(req.body);
      const request = await storage.createDMRequest(input);
      res.status(201).json(request);
    } catch (e) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.get("/api/dm/requests/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const requests = await storage.getDMRequests(userId);
    res.json(requests);
  });

  app.patch("/api/dm/request/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const request = await storage.updateDMRequestStatus(id, status);
    if (!request) return res.status(404).json({ message: "Not found" });
    res.json(request);
  });

  app.get("/api/dm/partners/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const partners = await storage.getAcceptedDMPartners(userId);
    res.json(partners);
  });

  app.get("/api/dm/messages/:userId1/:userId2", async (req, res) => {
    const userId1 = parseInt(req.params.userId1);
    const userId2 = parseInt(req.params.userId2);
    const messages = await storage.getDirectMessages(userId1, userId2);
    res.json(messages);
  });

  app.patch("/api/dm/messages/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { content } = z.object({ content: z.string() }).parse(req.body);
      const message = await storage.updateDirectMessage(id, content);
      if (!message) return res.status(404).json({ message: "Not found or locked" });
      res.json(message);
    } catch (e) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.delete("/api/dm/messages/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteDirectMessage(id);
    if (!success) return res.status(404).json({ message: "Not found or locked" });
    res.status(204).end();
  });

  app.post("/api/dm/messages/:id/lock", async (req, res) => {
    const id = parseInt(req.params.id);
    const { userId } = req.body;
    const message = await storage.lockDirectMessage(id, userId);
    if (!message) return res.status(404).json({ message: "Not found" });
    res.json(message);
  });

  app.post("/api/dm/messages/:id/unlock", async (req, res) => {
    const id = parseInt(req.params.id);
    const message = await storage.unlockDirectMessage(id);
    if (!message) return res.status(404).json({ message: "Not found" });
    res.json(message);
  });

  app.post("/api/dm/messages", async (req, res) => {
    try {
      const input = insertDirectMessageSchema.parse(req.body);
      const message = await storage.createDirectMessage(input);
      res.status(201).json(message);
    } catch (e) {
      res.status(400).json({ message: "Invalid message" });
    }
  });

  app.post("/api/dm/messages/:id/pin", async (req, res) => {
    const id = parseInt(req.params.id);
    const message = await storage.pinDirectMessage(id);
    if (!message) return res.status(404).json({ message: "Not found" });
    res.json(message);
  });

  app.post("/api/dm/messages/:id/unpin", async (req, res) => {
    const id = parseInt(req.params.id);
    const message = await storage.unpinDirectMessage(id);
    if (!message) return res.status(404).json({ message: "Not found" });
    res.json(message);
  });

  app.get("/api/dm/pinned/:userId1/:userId2", async (req, res) => {
    const userId1 = parseInt(req.params.userId1);
    const userId2 = parseInt(req.params.userId2);
    const messages = await storage.getPinnedDirectMessages(userId1, userId2);
    res.json(messages);
  });

  app.post("/api/dm/read", async (req, res) => {
    const { fromUserId, toUserId } = req.body;
    await storage.markDirectMessagesAsRead(fromUserId, toUserId);
    res.json({ success: true });
  });

  app.get("/api/dm/unread/:userId/:fromUserId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const fromUserId = parseInt(req.params.fromUserId);
    const count = await storage.getUnreadCount(userId, fromUserId);
    res.json({ count });
  });

  // Poll endpoints
  app.post("/api/polls", async (req, res) => {
    try {
      const input = insertPollSchema.parse(req.body);
      const poll = await storage.createPoll(input);
      res.status(201).json(poll);
    } catch (e) {
      res.status(400).json({ message: "Invalid poll" });
    }
  });

  app.get("/api/polls/:messageId", async (req, res) => {
    const messageId = parseInt(req.params.messageId);
    const poll = await storage.getPoll(messageId);
    if (!poll) return res.status(404).json({ message: "Not found" });
    res.json(poll);
  });

  app.post("/api/polls/:id/vote", async (req, res) => {
    const id = parseInt(req.params.id);
    const { optionIndex, userId } = req.body;
    const poll = await storage.votePoll(id, optionIndex, userId);
    if (!poll) return res.status(404).json({ message: "Not found" });
    res.json(poll);
  });

  // Logout endpoint
  app.post("/api/logout", async (req, res) => {
    const { userId } = req.body;
    if (userId) {
      await storage.logoutUser(userId);
    }
    res.json({ success: true });
  });

  app.get("/api/admin/users", async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.get("/api/admin/messages", async (req, res) => {
    const messages = await storage.getAllMessages();
    res.json(messages);
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteUser(id);
    if (!success) return res.status(404).json({ message: "Not found" });
    res.status(204).end();
  });

  app.delete("/api/admin/messages/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteMessage(id);
    if (!success) return res.status(404).json({ message: "Not found" });
    res.status(204).end();
  });

  app.post("/api/admin/messages/clear", async (req, res) => {
    await storage.clearAllMessages();
    res.json({ success: true });
  });

  return httpServer;
}
