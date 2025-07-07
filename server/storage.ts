import { users, conversations, chatMessages, type User, type InsertUser, type Conversation, type ChatMessage, type InsertConversation, type InsertChatMessage } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Conversation management
  getConversation(sessionId: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(sessionId: string, messages: any[], context: any[]): Promise<Conversation>;
  
  // Message management
  addMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getMessages(conversationId: number): Promise<ChatMessage[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private conversations: Map<string, Conversation>;
  private messages: Map<number, ChatMessage[]>;
  private currentUserId: number;
  private currentConversationId: number;
  private currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.currentUserId = 1;
    this.currentConversationId = 1;
    this.currentMessageId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getConversation(sessionId: string): Promise<Conversation | undefined> {
    return this.conversations.get(sessionId);
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.currentConversationId++;
    const now = new Date();
    const conversation: Conversation = {
      ...insertConversation,
      id,
      messages: insertConversation.messages || [],
      context: insertConversation.context || [],
      category: insertConversation.category || null,
      createdAt: now,
      updatedAt: now,
    };
    this.conversations.set(insertConversation.sessionId, conversation);
    this.messages.set(id, []);
    return conversation;
  }

  async updateConversation(sessionId: string, messages: any[], context: any[]): Promise<Conversation> {
    const conversation = this.conversations.get(sessionId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    const updated: Conversation = {
      ...conversation,
      messages,
      context,
      updatedAt: new Date(),
    };
    
    this.conversations.set(sessionId, updated);
    return updated;
  }

  async addMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentMessageId++;
    const message: ChatMessage = {
      ...insertMessage,
      id,
      conversationId: insertMessage.conversationId || null,
      citations: insertMessage.citations || null,
      responseId: insertMessage.responseId || null,
      timestamp: new Date(),
    };
    
    if (insertMessage.conversationId) {
      const messages = this.messages.get(insertMessage.conversationId) || [];
      messages.push(message);
      this.messages.set(insertMessage.conversationId, messages);
    }
    
    return message;
  }

  async getMessages(conversationId: number): Promise<ChatMessage[]> {
    return this.messages.get(conversationId) || [];
  }
}

export const storage = new MemStorage();
