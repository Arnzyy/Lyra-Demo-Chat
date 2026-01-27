'use client';

import { useState, useRef, useEffect } from 'react';
import type { AIPersonalityFull } from '@/lib/ai/personality/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Step8TestChatProps {
  personality: AIPersonalityFull;
}

export function Step8TestChat({ personality }: Step8TestChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    // Blur input on mobile to hide keyboard
    if (window.innerWidth < 768) {
      inputRef.current?.blur();
    }

    try {
      const response = await fetch('/api/chat/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          personality,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) throw new Error('Chat failed');

      const { response: aiResponse } = await response.json();

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: aiResponse },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      alert('Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-420px)] sm:h-[500px] max-h-[600px]">
      {/* Chat Header */}
      <div className="bg-zinc-800 border border-white/10 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 flex-shrink-0">
        <h3 className="text-sm sm:text-base font-semibold mb-1 truncate">
          {personality.persona_name || 'AI Replica'}
        </h3>
        <p className="text-xs sm:text-sm text-gray-400 truncate">
          Energy: {personality.energy_level}/10 • Style: {personality.humor_style}
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-zinc-900/50 border border-white/10 rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4 mb-3 sm:mb-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm sm:text-base text-center">
              Start chatting with your AI replica...
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-xs rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 rounded-br-md'
                      : 'bg-zinc-800 border border-white/10 rounded-bl-md'
                  }`}
                >
                  <p className="text-white text-sm sm:text-base leading-relaxed break-words">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 border border-white/10 rounded-2xl rounded-bl-md px-3 sm:px-4 py-2 sm:py-2.5">
                  <p className="text-gray-400 text-sm sm:text-base">
                    <span className="inline-flex gap-1">
                      <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                      <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                    </span>
                  </p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="flex gap-2 flex-shrink-0">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 bg-zinc-800 border border-white/10 rounded-lg px-3 sm:px-4 py-3 sm:py-3.5 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors min-h-[48px]"
          style={{ fontSize: '16px' }} // Prevents zoom on iOS
          disabled={isLoading}
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !input.trim()}
          className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 sm:px-6 py-3 sm:py-3.5 rounded-lg font-medium disabled:opacity-50 transition-opacity touch-manipulation min-h-[48px] min-w-[64px] sm:min-w-[80px] flex items-center justify-center text-sm sm:text-base"
        >
          <span className="hidden sm:inline">Send</span>
          <span className="sm:hidden">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}
