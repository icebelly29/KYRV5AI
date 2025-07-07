import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import CategoryButtons from "./CategoryButtons";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import TypingIndicator from "./TypingIndicator";
import ConversationContext from "./ConversationContext";
import { sendChatMessage } from "@/lib/chat-api";
import { useToast } from "@/hooks/use-toast";
import type { ChatMessage, ChatRequest, ChatResponse } from "@shared/schema";

interface ChatContainerProps {
  sessionId: string;
  apiStatus?: { status: string };
}

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: string;
  responseId?: string;
  timestamp: number;
}

export default function ChatContainer({ sessionId, apiStatus }: ChatContainerProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [conversationContext, setConversationContext] = useState<Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
  }>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: ConversationMessage = {
      id: 'welcome',
      role: 'assistant',
      content: "👋 Hello! I'm your enhanced UK Legal Rights AI assistant powered by GPT-4. I can help you understand your rights regarding employment, housing, consumer issues, police encounters, family law, debt, and more.\n\n🔹 **Click a topic button below** for category-specific guidance\n🔹 **Ask detailed questions** for comprehensive legal information\n🔹 **Continue our conversation** - I remember our discussion context\n🔹 Try asking: *\"What are my rights if I'm made redundant?\"* or *\"Can my landlord increase rent during a fixed-term lease?\"*",
      timestamp: Date.now()
    };
    setMessages([welcomeMessage]);
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Chat mutation for sending messages
  const chatMutation = useMutation({
    mutationFn: sendChatMessage,
    onMutate: () => {
      setIsTyping(true);
    },
    onSuccess: (data: ChatResponse, variables: ChatRequest) => {
      // Add user message
      const userMessage: ConversationMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: variables.message,
        timestamp: Date.now()
      };

      // Add AI response
      const aiMessage: ConversationMessage = {
        id: data.responseId,
        role: 'assistant',
        content: data.response,
        citations: data.citations,
        responseId: data.responseId,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, userMessage, aiMessage]);
      
      // Update conversation context
      setConversationContext(data.context || []);
      
      setIsTyping(false);
    },
    onError: (error) => {
      console.error('Chat error:', error);
      setIsTyping(false);
      
      toast({
        title: "Message Failed",
        description: "Unable to send message. Please check your connection and try again.",
        variant: "destructive",
      });

      // Add error message to chat
      const errorMessage: ConversationMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment or contact support if the issue persists.",
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleSendMessage = (message: string, category?: string) => {
    if (!message.trim() || chatMutation.isPending) return;

    const chatRequest: ChatRequest = {
      message: message.trim(),
      sessionId,
      category,
      context: conversationContext
    };

    chatMutation.mutate(chatRequest);
  };

  const handleCategorySelect = (category: string) => {
    const categoryPrompts: Record<string, string> = {
      employment: "I have questions about UK employment law. Can you provide comprehensive information about employment rights, including dismissal procedures, wage entitlements, and workplace protections?",
      housing: "I need information about UK housing and tenancy rights. Please explain tenant protections, landlord obligations, and rental law basics.",
      consumer: "Can you explain UK consumer rights, including returns, refunds, warranties, and protection against unfair trading practices?",
      police: "What are my rights during police encounters in the UK? Please cover stop and search, arrest procedures, and legal protections.",
      family: "I need information about UK family law, including divorce, child custody, domestic violence protections, and family court procedures.",
      benefits: "Can you explain UK benefits and Universal Credit, including eligibility, application processes, and appeal rights?",
      health: "What are my healthcare rights under the NHS? Please explain patient rights, treatment access, and medical decision-making.",
      immigration: "I need information about UK immigration law, including visa rights, asylum procedures, and deportation protections.",
      criminal: "Can you explain UK criminal law basics, including police powers, court procedures, and defendant rights?",
      discrimination: "What are my rights regarding discrimination in the UK? Please cover protected characteristics and legal remedies.",
      data: "Can you explain UK data protection rights under GDPR and the Data Protection Act 2018?",
      debt: "I need information about UK debt law, including creditor rights, bankruptcy procedures, and debt relief options."
    };

    const prompt = categoryPrompts[category] || `Tell me about ${category} rights in the UK.`;
    handleSendMessage(prompt, category);
  };

  const handleClearContext = () => {
    setConversationContext([]);
    queryClient.invalidateQueries({ queryKey: [`/api/conversation/${sessionId}`] });
    
    toast({
      title: "Context Cleared",
      description: "Conversation context has been cleared. Starting fresh conversation.",
    });
  };

  return (
    <div className="flex-1 flex min-h-0">
      
      {/* Conversation Context Panel */}
      <ConversationContext 
        context={conversationContext}
        onClear={handleClearContext}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        
        {/* Category Buttons */}
        <CategoryButtons 
          onCategorySelect={handleCategorySelect} 
          onClearContext={handleClearContext}
        />

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide bg-[var(--deep-black)] p-6 space-y-6">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              role={message.role}
              content={message.content}
              citations={message.citations}
              responseId={message.responseId}
              timestamp={message.timestamp}
            />
          ))}
          
          {isTyping && <TypingIndicator />}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={chatMutation.isPending}
          isConnected={apiStatus?.status === 'connected'}
        />
      </div>
    </div>
  );
}
