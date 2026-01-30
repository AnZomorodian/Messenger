import { users, messages, type User, type InsertUser, type Message, type InsertMessage, type Reaction, type InsertReaction, type UserStatus, type DMRequest, type InsertDMRequest, type DirectMessage, type InsertDirectMessage, type DMRequestStatus, type Poll, type InsertPoll, type FileRecord, type InsertFile } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getActiveUsers(): Promise<(User & { lastSeen?: Date })[]>;
  updateUserActivity(userId: number): Promise<void>;
  updateUserStatus(userId: number, status: UserStatus): Promise<User | undefined>;
  
  getMessage(id: number): Promise<Message | undefined>;
  getMessages(): Promise<(Message & { user?: User, replyTo?: Message & { user?: User }, reactions?: Reaction[], lockedByUser?: User })[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, content: string): Promise<Message | undefined>;
  deleteMessage(id: number): Promise<boolean>;
  lockMessage(messageId: number, lockedByUserId: number): Promise<Message | undefined>;
  unlockMessage(messageId: number): Promise<Message | undefined>;
  
  getReactions(messageId: number): Promise<Reaction[]>;
  addReaction(reaction: InsertReaction): Promise<Reaction>;
  removeReaction(messageId: number, userId: number, emoji: string): Promise<boolean>;
  
  createDMRequest(request: InsertDMRequest): Promise<DMRequest>;
  getDMRequests(userId: number): Promise<(DMRequest & { fromUser?: User, toUser?: User })[]>;
  updateDMRequestStatus(requestId: number, status: DMRequestStatus): Promise<DMRequest | undefined>;
  getAcceptedDMPartners(userId: number): Promise<User[]>;

  getDirectMessages(userId1: number, userId2: number): Promise<(DirectMessage & { fromUser?: User })[]>;
  createDirectMessage(message: InsertDirectMessage): Promise<DirectMessage>;
  updateDirectMessage(id: number, content: string): Promise<DirectMessage | undefined>;
  deleteDirectMessage(id: number): Promise<boolean>;
  lockDirectMessage(messageId: number, lockedByUserId: number): Promise<DirectMessage | undefined>;
  unlockDirectMessage(messageId: number): Promise<DirectMessage | undefined>;
  pinDirectMessage(messageId: number): Promise<DirectMessage | undefined>;
  unpinDirectMessage(messageId: number): Promise<DirectMessage | undefined>;
  getPinnedDirectMessages(userId1: number, userId2: number): Promise<(DirectMessage & { fromUser?: User })[]>;
  markDirectMessagesAsRead(fromUserId: number, toUserId: number): Promise<void>;
  getUnreadCount(userId: number, fromUserId: number): Promise<number>;

  createWitnessRequest(initiatorId: number, partnerId: number, witnessId: number): Promise<any>;
  getWitnessRequests(userId: number): Promise<any[]>;
  updateWitnessRequestStatus(requestId: number, status: string): Promise<any>;
  getWitnessedChats(userId: number): Promise<any[]>;
  
  createPoll(poll: InsertPoll): Promise<Poll>;
  getPoll(messageId: number): Promise<Poll | undefined>;
  votePoll(pollId: number, optionIndex: number, userId: number): Promise<Poll | undefined>;
  
  createFile(file: InsertFile): Promise<FileRecord>;
  getFile(filename: string): Promise<FileRecord | undefined>;
  deleteExpiredFiles(): Promise<string[]>;
  
  logoutUser(userId: number): Promise<void>;
  
  getAllUsers(): Promise<User[]>;
  getAllMessages(): Promise<(Message & { user?: User })[]>;
  deleteUser(userId: number): Promise<boolean>;
  clearAllMessages(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<number, Message>;
  private reactions: Map<number, Reaction>;
  private userActivity: Map<number, Date>;
  private dmRequests: Map<number, DMRequest>;
  private directMessages: Map<number, DirectMessage>;
  private polls: Map<number, Poll>;
  private files: Map<number, FileRecord>;
  private currentUserId: number;
  private currentMessageId: number;
  private currentReactionId: number;
  private currentDMRequestId: number;
  private currentDirectMessageId: number;
  private currentPollId: number;
  private currentFileId: number;
  private witnessRequests: Map<number, any>;
  private groupChats: Map<number, any>;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.reactions = new Map();
    this.userActivity = new Map();
    this.dmRequests = new Map();
    this.directMessages = new Map();
    this.polls = new Map();
    this.files = new Map();
    this.witnessRequests = new Map();
    this.groupChats = new Map();
    this.currentUserId = 1;
    this.currentMessageId = 1;
    this.currentReactionId = 1;
    this.currentDMRequestId = 1;
    this.currentDirectMessageId = 1;
    this.currentPollId = 1;
    this.currentFileId = 1;
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
    const user: User = { 
      id, 
      username: insertUser.username, 
      color: insertUser.color || "#7c3aed", 
      status: "online" 
    };
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

  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
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

  async createDMRequest(request: InsertDMRequest): Promise<DMRequest> {
    const existing = Array.from(this.dmRequests.values()).find(
      r => (r.fromUserId === request.fromUserId && r.toUserId === request.toUserId) ||
           (r.fromUserId === request.toUserId && r.toUserId === request.fromUserId)
    );
    if (existing) return existing;
    
    const id = this.currentDMRequestId++;
    const dmRequest: DMRequest = { ...request, id, status: "pending", timestamp: new Date() };
    this.dmRequests.set(id, dmRequest);
    return dmRequest;
  }

  async getDMRequests(userId: number): Promise<(DMRequest & { fromUser?: User, toUser?: User })[]> {
    const requests = Array.from(this.dmRequests.values()).filter(
      r => r.toUserId === userId || r.fromUserId === userId
    );
    return requests.map(r => ({
      ...r,
      fromUser: this.users.get(r.fromUserId),
      toUser: this.users.get(r.toUserId)
    }));
  }

  async updateDMRequestStatus(requestId: number, status: DMRequestStatus): Promise<DMRequest | undefined> {
    const request = this.dmRequests.get(requestId);
    if (!request) return undefined;
    const updated = { ...request, status };
    this.dmRequests.set(requestId, updated);
    return updated;
  }

  async getAcceptedDMPartners(userId: number): Promise<User[]> {
    const acceptedRequests = Array.from(this.dmRequests.values()).filter(
      r => r.status === "accepted" && (r.fromUserId === userId || r.toUserId === userId)
    );
    const partnerIds = acceptedRequests.map(r => 
      r.fromUserId === userId ? r.toUserId : r.fromUserId
    );
    return partnerIds.map(id => this.users.get(id)).filter((u): u is User => !!u);
  }

  async getDirectMessages(userId1: number, userId2: number): Promise<(DirectMessage & { fromUser?: User })[]> {
    const msgs = Array.from(this.directMessages.values()).filter(
      m => (m.fromUserId === userId1 && m.toUserId === userId2) ||
           (m.fromUserId === userId2 && m.toUserId === userId1)
    );
    return msgs
      .map(m => ({ ...m, fromUser: this.users.get(m.fromUserId) }))
      .sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0));
  }

  async createDirectMessage(message: InsertDirectMessage): Promise<DirectMessage> {
    const id = this.currentDirectMessageId++;
    const dm: DirectMessage = { 
      ...message, 
      id, 
      isEdited: false, 
      isPinned: false, 
      isRead: false, 
      isLocked: false,
      lockedByUserId: null,
      timestamp: new Date() 
    };
    this.directMessages.set(id, dm);
    return dm;
  }

  async updateDirectMessage(id: number, content: string): Promise<DirectMessage | undefined> {
    const dm = this.directMessages.get(id);
    if (!dm || dm.isLocked) return undefined;
    const updated = { ...dm, content, isEdited: true };
    this.directMessages.set(id, updated);
    return updated;
  }

  async deleteDirectMessage(id: number): Promise<boolean> {
    const dm = this.directMessages.get(id);
    if (!dm || dm.isLocked) return false;
    return this.directMessages.delete(id);
  }

  async lockDirectMessage(messageId: number, lockedByUserId: number): Promise<DirectMessage | undefined> {
    const dm = this.directMessages.get(messageId);
    if (!dm) return undefined;
    const updated = { ...dm, isLocked: true, lockedByUserId };
    this.directMessages.set(messageId, updated);
    return updated;
  }

  async unlockDirectMessage(messageId: number): Promise<DirectMessage | undefined> {
    const dm = this.directMessages.get(messageId);
    if (!dm) return undefined;
    const updated = { ...dm, isLocked: false, lockedByUserId: null };
    this.directMessages.set(messageId, updated);
    return updated;
  }

  async pinDirectMessage(messageId: number): Promise<DirectMessage | undefined> {
    const dm = this.directMessages.get(messageId);
    if (!dm) return undefined;
    const updated = { ...dm, isPinned: true };
    this.directMessages.set(messageId, updated);
    return updated;
  }

  async unpinDirectMessage(messageId: number): Promise<DirectMessage | undefined> {
    const dm = this.directMessages.get(messageId);
    if (!dm) return undefined;
    const updated = { ...dm, isPinned: false };
    this.directMessages.set(messageId, updated);
    return updated;
  }

  async getPinnedDirectMessages(userId1: number, userId2: number): Promise<(DirectMessage & { fromUser?: User })[]> {
    const msgs = Array.from(this.directMessages.values()).filter(
      m => m.isPinned && ((m.fromUserId === userId1 && m.toUserId === userId2) ||
           (m.fromUserId === userId2 && m.toUserId === userId1))
    );
    return msgs
      .map(m => ({ ...m, fromUser: this.users.get(m.fromUserId) }))
      .sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0));
  }

  async markDirectMessagesAsRead(fromUserId: number, toUserId: number): Promise<void> {
    this.directMessages.forEach((dm, id) => {
      if (dm.fromUserId === fromUserId && dm.toUserId === toUserId && !dm.isRead) {
        this.directMessages.set(id, { ...dm, isRead: true });
      }
    });
  }

  async getUnreadCount(userId: number, fromUserId: number): Promise<number> {
    return Array.from(this.directMessages.values()).filter(
      dm => dm.fromUserId === fromUserId && dm.toUserId === userId && !dm.isRead
    ).length;
  }

  async createPoll(poll: InsertPoll): Promise<Poll> {
    const id = this.currentPollId++;
    const newPoll: Poll = { 
      ...poll, 
      id, 
      votes: "{}",
      timestamp: new Date() 
    };
    this.polls.set(id, newPoll);
    return newPoll;
  }

  async getPoll(messageId: number): Promise<Poll | undefined> {
    return Array.from(this.polls.values()).find(p => p.messageId === messageId);
  }

  async votePoll(pollId: number, optionIndex: number, userId: number): Promise<Poll | undefined> {
    const poll = this.polls.get(pollId);
    if (!poll) return undefined;
    
    const votes = JSON.parse(poll.votes) as Record<string, number>;
    votes[userId.toString()] = optionIndex;
    const updated = { ...poll, votes: JSON.stringify(votes) };
    this.polls.set(pollId, updated);
    return updated;
  }

  async createFile(file: InsertFile): Promise<FileRecord> {
    const id = this.currentFileId++;
    const newFile: FileRecord = { 
      ...file, 
      id,
      messageId: file.messageId ?? null,
      uploadedAt: new Date(),
      expiresAt: file.expiresAt
    };
    this.files.set(id, newFile);
    return newFile;
  }

  async getFile(filename: string): Promise<FileRecord | undefined> {
    return Array.from(this.files.values()).find(f => f.filename === filename);
  }

  async deleteExpiredFiles(): Promise<string[]> {
    const now = new Date();
    const expired: string[] = [];
    this.files.forEach((file, id) => {
      if (file.expiresAt && file.expiresAt < now) {
        expired.push(file.filename);
        this.files.delete(id);
      }
    });
    return expired;
  }

  async logoutUser(userId: number): Promise<void> {
    this.userActivity.delete(userId);
    const user = this.users.get(userId);
    if (user) {
      this.users.set(userId, { ...user, status: "offline" });
    }
  }

  async createWitnessRequest(initiatorId: number, partnerId: number, witnessId: number): Promise<any> {
    const id = this.currentDMRequestId++;
    const request = { id, chatInitiatorId: initiatorId, chatPartnerId: partnerId, witnessId, status: "pending", timestamp: new Date() };
    this.witnessRequests.set(id, request);
    return request;
  }

  async getWitnessRequests(userId: number): Promise<any[]> {
    return Array.from(this.witnessRequests.values()).filter(r => r.witnessId === userId || r.chatPartnerId === userId);
  }

  async updateWitnessRequestStatus(requestId: number, status: string): Promise<any> {
    const request = this.witnessRequests.get(requestId);
    if (!request) return undefined;
    const updated = { ...request, status };
    this.witnessRequests.set(requestId, updated);
    if (status === 'accepted') {
      const id = this.currentPollId++; // Reusing counter for group chat id
      this.groupChats.set(id, { id, userIds: [request.chatInitiatorId, request.chatPartnerId], witnessId: request.witnessId, timestamp: new Date() });
    }
    return updated;
  }

  async getWitnessedChats(userId: number): Promise<any[]> {
    return Array.from(this.groupChats.values()).filter(c => c.userIds.includes(userId) || c.witnessId === userId);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getAllMessages(): Promise<(Message & { user?: User })[]> {
    const msgs = Array.from(this.messages.values());
    return msgs.map(msg => ({
      ...msg,
      user: this.users.get(msg.userId)
    })).sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
  }

  async deleteUser(userId: number): Promise<boolean> {
    this.userActivity.delete(userId);
    return this.users.delete(userId);
  }

  async clearAllMessages(): Promise<void> {
    this.messages.clear();
    this.reactions.clear();
    this.currentMessageId = 1;
    this.currentReactionId = 1;
  }
}

export const storage = new MemStorage();
