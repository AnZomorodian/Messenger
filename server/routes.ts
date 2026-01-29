import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertUserSchema, insertMessageSchema } from "@shared/schema";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  
  app.post(api.users.login.path, async (req, res) => {
    try {
      const input = insertUserSchema.parse(req.body);
      let user = await storage.getUserByUsername(input.username);
      if (!user) {
        user = await storage.createUser(input);
      }
      res.json(user);
    } catch (e) {
      res.status(400).json({ message: "Invalid input" });
    }
  });

  app.get(api.users.list.path, async (req, res) => {
    res.json([]); 
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

  return httpServer;
}
