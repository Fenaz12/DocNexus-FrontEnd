import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip } from 'lucide-react';

export default function ChatInput({ onSend, loading, onFileUpload }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSend(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t p-4 bg-white">
      <div className="flex gap-2 items-end">
        {onFileUpload && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onFileUpload}
            disabled={loading}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        )}
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question... (Shift+Enter for new line)"
          disabled={loading}
          className="min-h-[60px] max-h-[200px] resize-none"
          rows={1}
        />
        <Button 
          type="submit" 
          size="icon"
          disabled={loading || !input.trim()}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
