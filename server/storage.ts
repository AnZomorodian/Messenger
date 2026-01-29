import { users, messages, type User, type InsertUser, type Message, type InsertMessage } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getMessages(): Promise<(Message & { user?: User, replyTo?: Message & { user?: User } })[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, content: string): Promise<Message | undefined>;
  deleteMessage(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<number, Message>;
  private currentUserId: number;
  private currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.currentUserId = 1;
    this.currentMessageId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getMessages(): Promise<(Message & { user?: User, replyTo?: Message & { user?: User } })[]> {
    const msgs = Array.from(this.messages.values());
    return msgs.map(msg => {
      const user = this.users.get(msg.userId);
      let replyToData;
      if (msg.replyToId) {
        const replyMsg = this.messages.get(msg.replyToId);
        if (replyMsg) {
          replyToData = {
            ...replyMsg,
            user: this.users.get(replyMsg.userId)
          };
        }
      }
      return {
        ...msg,
        user,
        replyTo: replyToData
      };
    }).sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = { 
      ...insertMessage, 
      id, 
      replyToId: insertMessage.replyToId ?? null,
      isEdited: false,
      timestamp: new Date() 
    };
    this.messages.set(id, message);
    return message;
  }

  async updateMessage(id: number, content: string): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    const updated = { ...message, content, isEdited: true };
    this.messages.set(id, updated);
    return updated;
  }

  async deleteMessage(id: number): Promise<boolean> {
    return this.messages.delete(id);
  }
}

export const storage = new MemStorage();
