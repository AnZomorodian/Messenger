import { users, messages, type User, type InsertUser, type Message, type InsertMessage, type Reaction, type InsertReaction, type UserStatus } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getActiveUsers(): Promise<(User & { lastSeen?: Date })[]>;
  updateUserActivity(userId: number): Promise<void>;
  updateUserStatus(userId: number, status: UserStatus): Promise<User | undefined>;
  
  getMessages(): Promise<(Message & { user?: User, replyTo?: Message & { user?: User }, reactions?: Reaction[], lockedByUser?: User })[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, content: string): Promise<Message | undefined>;
  deleteMessage(id: number): Promise<boolean>;
  lockMessage(messageId: number, lockedByUserId: number): Promise<Message | undefined>;
  unlockMessage(messageId: number): Promise<Message | undefined>;
  
  getReactions(messageId: number): Promise<Reaction[]>;
  addReaction(reaction: InsertReaction): Promise<Reaction>;
  removeReaction(messageId: number, userId: number, emoji: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<number, Message>;
  private reactions: Map<number, Reaction>;
  private userActivity: Map<number, Date>;
  private currentUserId: number;
  private currentMessageId: number;
  private currentReactionId: number;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.reactions = new Map();
    this.userActivity = new Map();
    this.currentUserId = 1;
    this.currentMessageId = 1;
    this.currentReactionId = 1;
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
    const user: User = { ...insertUser, id, status: "online" };
    this.users.set(id, user);
    this.userActivity.set(id, new Date());
    return user;
  }

  async getActiveUsers(): Promise<(User & { lastSeen?: Date })[]> {
    const now = new Date();
    const activeThreshold = 60000; // 60 seconds
    const activeUsers: (User & { lastSeen?: Date })[] = [];
    
    this.userActivity.forEach((lastSeen, userId) => {
      if (now.getTime() - lastSeen.getTime() < activeThreshold) {
        const user = this.users.get(userId);
        if (user) {
          activeUsers.push({ ...user, lastSeen });
        }
      }
    });
    
    return activeUsers;
  }

  async updateUserActivity(userId: number): Promise<void> {
    this.userActivity.set(userId, new Date());
  }

  async updateUserStatus(userId: number, status: UserStatus): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    const updated = { ...user, status };
    this.users.set(userId, updated);
    return updated;
  }

  async getMessages(): Promise<(Message & { user?: User, replyTo?: Message & { user?: User }, reactions?: Reaction[], lockedByUser?: User })[]> {
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
      const msgReactions = Array.from(this.reactions.values()).filter(r => r.messageId === msg.id);
      const lockedByUser = msg.lockedByUserId ? this.users.get(msg.lockedByUserId) : undefined;
      return {
        ...msg,
        user,
        replyTo: replyToData,
        reactions: msgReactions,
        lockedByUser
      };
    }).sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = { 
      ...insertMessage, 
      id, 
      imageUrl: insertMessage.imageUrl ?? null,
      replyToId: insertMessage.replyToId ?? null,
      isEdited: false,
      isLocked: false,
      lockedByUserId: null,
      timestamp: new Date() 
    };
    this.messages.set(id, message);
    return message;
  }

  async updateMessage(id: number, content: string): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    if (message.isLocked) return undefined;
    const updated = { ...message, content, isEdited: true };
    this.messages.set(id, updated);
    return updated;
  }

  async deleteMessage(id: number): Promise<boolean> {
    return this.messages.delete(id);
  }

  async lockMessage(messageId: number, lockedByUserId: number): Promise<Message | undefined> {
    const message = this.messages.get(messageId);
    if (!message) return undefined;
    const updated = { ...message, isLocked: true, lockedByUserId };
    this.messages.set(messageId, updated);
    return updated;
  }

  async unlockMessage(messageId: number): Promise<Message | undefined> {
    const message = this.messages.get(messageId);
    if (!message) return undefined;
    const updated = { ...message, isLocked: false, lockedByUserId: null };
    this.messages.set(messageId, updated);
    return updated;
  }

  async getReactions(messageId: number): Promise<Reaction[]> {
    return Array.from(this.reactions.values()).filter(r => r.messageId === messageId);
  }

  async addReaction(insertReaction: InsertReaction): Promise<Reaction> {
    const existing = Array.from(this.reactions.values()).find(
      r => r.messageId === insertReaction.messageId && 
           r.userId === insertReaction.userId && 
           r.emoji === insertReaction.emoji
    );
    if (existing) return existing;
    
    const id = this.currentReactionId++;
    const reaction: Reaction = { ...insertReaction, id };
    this.reactions.set(id, reaction);
    return reaction;
  }

  async removeReaction(messageId: number, userId: number, emoji: string): Promise<boolean> {
    const reaction = Array.from(this.reactions.values()).find(
      r => r.messageId === messageId && r.userId === userId && r.emoji === emoji
    );
    if (reaction) {
      return this.reactions.delete(reaction.id);
    }
    return false;
  }
}

export const storage = new MemStorage();
