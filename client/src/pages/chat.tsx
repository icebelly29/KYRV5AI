import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import ChatContainer from "@/components/chat/ChatContainer";
import { useToast } from "@/hooks/use-toast";

interface ApiStatus {
  status: 'connected' | 'disconnected' | 'error';
  timestamp: number;
  service: string;
}

export default function ChatPage() {
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const { toast } = useToast();

  // Check API health status
  const { data: apiStatus, error: apiError } = useQuery<ApiStatus>({
    queryKey: ['/api/health'],
    refetchInterval: 30000, // Check every 30 seconds
    retry: 3,
  });

  // Show connection status updates
  useEffect(() => {
    if (apiError) {
      toast({
        title: "Connection Issue",
        description: "Unable to connect to the legal AI service. Please check your internet connection.",
        variant: "destructive",
      });
    }
  }, [apiError, toast]);

  useEffect(() => {
    // Set up session storage for chat persistence
    const existingSessionId = localStorage.getItem('chatSessionId');
    if (!existingSessionId) {
      localStorage.setItem('chatSessionId', sessionId);
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--gradient-bg-start)] to-[var(--gradient-bg-end)] flex justify-center items-center p-2">
      <div className="w-full max-w-6xl h-screen max-h-[95vh] bg-[var(--dark-gray)] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="gradient-header px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">⚖️ Know Your Rights</h1>
              <p className="text-gray-300 text-sm">UK Legal Information AI Chatbot</p>
            </div>
            <div className="flex items-center space-x-2">
              {/* API Status Indicator */}
              <div className="flex items-center space-x-2 bg-black bg-opacity-30 px-3 py-1 rounded-full">
                <div 
                  className={`w-2 h-2 rounded-full ${
                    apiStatus?.status === 'connected' 
                      ? 'bg-green-400 animate-pulse-slow' 
                      : 'bg-red-400'
                  }`}
                />
                <span className="text-xs text-gray-300">
                  {apiStatus?.status === 'connected' ? 'GPT Connected' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Container */}
        <ChatContainer sessionId={sessionId} apiStatus={apiStatus} />

        {/* Footer Disclaimer */}
        <div className="bg-[var(--deep-black)] border-t border-[var(--border-gray)] px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>⚠️ This provides general legal information only. For specific legal advice, consult a qualified UK solicitor.</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Powered by GPT-4 | UK Legal Database 2024</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
