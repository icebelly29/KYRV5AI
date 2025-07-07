export default function TypingIndicator() {
  return (
    <div className="message animate-fadeIn">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 bg-gradient-to-br from-[var(--legal-blue)] to-[var(--accent-blue)] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-white text-sm">⚖️</span>
        </div>
        <div className="bg-[var(--dark-gray)] border border-[var(--border-gray)] rounded-2xl rounded-tl-sm px-6 py-4">
          <div className="flex items-center space-x-2 text-gray-400">
            <span className="text-sm">Analyzing your legal question with GPT-4...</span>
            <div className="typing-dots flex space-x-1">
              <span className="w-2 h-2 bg-[var(--accent-blue)] rounded-full animate-typing"></span>
              <span className="w-2 h-2 bg-[var(--accent-blue)] rounded-full animate-typing"></span>
              <span className="w-2 h-2 bg-[var(--accent-blue)] rounded-full animate-typing"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
