// src/components/MessageInput.tsx

import React from 'react';
import { Send, Loader } from 'lucide-react';

interface MessageInputProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  sendMessage: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}

const MessageInput: React.FC<MessageInputProps> = ({
  input,
  setInput,
  isLoading,
  sendMessage,
  inputRef
}) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && input.trim()) {
        sendMessage();
      }
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'inherit';
    textarea.style.height = `${textarea.scrollHeight}px`;
    setInput(e.target.value);
  };

  return (
    <footer className="bg-white p-4 border-t border-neutral-gray">
      <div className="max-w-4xl mx-auto flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInput}
          onKeyPress={handleKeyPress}
          className="flex-grow p-3 border border-neutral-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-gray resize-none min-h-[48px] max-h-[200px]"
          placeholder="Type your message..."
          disabled={isLoading}
          rows={1}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className="bg-black text-white p-3 rounded-lg hover:bg-dark-gray transition-colors duration-200 disabled:bg-neutral-gray disabled:cursor-not-allowed h-[48px] w-[48px] flex items-center justify-center"
        >
          {isLoading ? (
            <Loader className="animate-spin h-5 w-5" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </div>
    </footer>
  );
};

export default MessageInput;