import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  isConnected?: boolean;
}

export default function ChatInput({ onSendMessage, disabled, isConnected }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [message]);

  const handleSubmit = () => {
    if (!message.trim() || disabled) return;
    
    onSendMessage(message);
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const characterCount = message.length;
  const maxLength = 1000;

  return (
    <div className="bg-[var(--deep-black)] border-t border-[var(--border-gray)] px-6 py-4 flex-shrink-0">
      <div className="flex items-end space-x-4">
        <div className="flex-1 relative">
          <div className="relative bg-[var(--dark-gray)] border border-[var(--border-gray)] rounded-2xl focus-within:border-[var(--accent-blue)] transition-colors duration-200">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask detailed legal questions... (e.g., 'My employer is changing my contract terms without consent')"
              maxLength={maxLength}
              className="w-full bg-transparent text-gray-200 px-6 py-4 resize-none border-none focus:ring-0 focus:outline-none placeholder-gray-500 min-h-[60px] max-h-[120px] overflow-y-auto scrollbar-hide"
              rows={1}
              style={{ fieldSizing: 'content' }}
            />
            
            <div className="px-6 pb-3 flex items-center justify-between text-xs text-gray-500 border-t-0">
              <div className="flex items-center space-x-4">
                <span>{characterCount}/{maxLength} characters</span>
                <div className="flex items-center space-x-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span>{isConnected ? 'Groq Ready' : 'Offline'}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Shift+Enter for new line</span>
              </div>
            </div>
          </div>
        </div>
        
        <Button
          onClick={handleSubmit}
          disabled={disabled || !message.trim() || !isConnected}
          className="bg-[var(--legal-blue)] hover:bg-[var(--accent-blue)] text-white px-8 py-4 h-auto rounded-2xl transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 flex-shrink-0"
        >
          {disabled && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{disabled ? 'Processing...' : 'Send'}</span>
        </Button>
      </div>
    </div>
  );
}
