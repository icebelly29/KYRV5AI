import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateLegalResponse, healthCheck } from "./services/openai";
import { chatRequestSchema, chatResponseSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Health check for OpenAI API
  app.get("/api/health", async (req, res) => {
    try {
      const isHealthy = await healthCheck();
      res.json({ 
        status: isHealthy ? 'connected' : 'disconnected',
        timestamp: Date.now(),
        service: 'OpenAI GPT-4'
      });
    } catch (error) {
      res.status(503).json({ 
        status: 'error', 
        message: 'Health check failed',
        timestamp: Date.now()
      });
    }
  });

  // Main chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      // Validate request body
      const validatedRequest = chatRequestSchema.parse(req.body);
      
      // Get or create conversation
      let conversation = await storage.getConversation(validatedRequest.sessionId);
      
      if (!conversation) {
        conversation = await storage.createConversation({
          sessionId: validatedRequest.sessionId,
          messages: [],
          context: [],
          category: validatedRequest.category
        });
      }

      // Add user message to storage
      await storage.addMessage({
        conversationId: conversation.id,
        role: 'user',
        content: validatedRequest.message,
        citations: null,
        responseId: null
      });

      // Generate AI response
      const aiResponse = await generateLegalResponse({
        message: validatedRequest.message,
        context: validatedRequest.context,
        category: validatedRequest.category,
        sessionId: validatedRequest.sessionId
      });

      // Add AI response to storage
      await storage.addMessage({
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse.response,
        citations: aiResponse.citations,
        responseId: aiResponse.responseId
      });

      // Update conversation context
      const updatedContext = [
        ...validatedRequest.context,
        { 
          role: 'user' as const, 
          content: validatedRequest.message, 
          timestamp: Date.now() 
        },
        { 
          role: 'assistant' as const, 
          content: aiResponse.response, 
          timestamp: Date.now() 
        }
      ];

      await storage.updateConversation(
        validatedRequest.sessionId,
        [], // We store individual messages separately
        updatedContext
      );

      // Validate and return response
      const validatedResponse = chatResponseSchema.parse({
        ...aiResponse,
        context: updatedContext
      });

      res.json(validatedResponse);

    } catch (error) {
      console.error('Chat API Error:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Invalid request format',
          details: error.errors
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          message: 'Failed to process chat request'
        });
      }
    }
  });

  // Get conversation history
  app.get("/api/conversation/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const conversation = await storage.getConversation(sessionId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      const messages = await storage.getMessages(conversation.id);
      
      res.json({
        conversation,
        messages
      });
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({ error: 'Failed to retrieve conversation' });
    }
  });

  // Clear conversation context
  app.delete("/api/conversation/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const conversation = await storage.getConversation(sessionId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      await storage.updateConversation(sessionId, [], []);
      
      res.json({ message: 'Conversation context cleared' });
    } catch (error) {
      console.error('Clear conversation error:', error);
      res.status(500).json({ error: 'Failed to clear conversation' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
