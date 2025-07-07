import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ConversationContextProps {
  context: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
  }>;
  onClear: () => void;
}

export default function ConversationContext({ context, onClear }: ConversationContextProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-gray-800 hover:bg-gray-700"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    );
  }

  const contextSummary = context.length > 0 
    ? `Active discussion with ${context.length} exchanges`
    : "No active conversation context";

  return (
    <div className="w-80 bg-gray-900 border-r border-[var(--border-gray)] hidden lg:flex flex-col">
      <div className="px-4 py-3 border-b border-[var(--border-gray)]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-300">Conversation Context</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="p-1 h-auto"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-xs text-gray-500">{contextSummary}</div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {context.length === 0 ? (
            <div className="text-xs text-gray-500 text-center py-8">
              Start a conversation to see context here
            </div>
          ) : (
            context.slice(-10).map((msg, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-3 text-xs">
                <div className="text-gray-400 mb-1 flex items-center justify-between">
                  <span>{msg.role === 'user' ? 'You' : 'Assistant'}</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="text-gray-300 line-clamp-3">
                  {msg.content.substring(0, 100)}{msg.content.length > 100 ? '...' : ''}
                </div>
              </div>
            ))
          )}
          
          {context.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
              className="w-full text-xs bg-gray-800 hover:bg-gray-700 border-gray-600"
            >
              Clear Context
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
