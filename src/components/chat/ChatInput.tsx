import { ImagePlus, Loader2, Send, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ChatAttachment } from '@/types';
import { uid } from '@/services/utils/uid';

interface ChatInputProps {
  onSend: (text: string, attachments: ChatAttachment[]) => void;
  disabled?: boolean;
  busy?: boolean;
  pendingText?: string;
}

const suggestions = ['Start / Sit', 'Waiver Targets', 'Trade Advice', 'Weekly Matchup', 'Sleepers'];

export function ChatInput({ onSend, disabled, busy, pendingText }: ChatInputProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAttachments((prev) => [
        ...prev,
        { id: uid(), name: file.name, dataUrl: reader.result as string, kind: 'image' },
      ]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;
    onSend(trimmed, attachments);
    setText('');
    setAttachments([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-ink-700 bg-ink-900/80 px-3 py-3 backdrop-blur-md sm:px-4 sm:py-4">
      <div className="mx-auto max-w-3xl">
        {/* Suggestion shortcuts */}
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setText(s)}
              disabled={disabled}
              className="rounded-full border border-ink-600 bg-ink-850 px-2.5 py-1 text-xs font-medium text-gray-400 transition-colors hover:border-neon-500/40 hover:text-white disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Attachment previews */}
        {attachments.length > 0 && (
          <div className="mb-2.5 flex flex-wrap gap-2">
            {attachments.map((a) => (
              <div key={a.id} className="relative h-16 w-16 overflow-hidden rounded-lg border border-ink-600">
                <img src={a.dataUrl} alt={a.name} className="h-full w-full object-cover" />
                <button
                  onClick={() => removeAttachment(a.id)}
                  className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded bg-black/70 text-white hover:bg-black/90"
                  aria-label="Remove image"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pending indicator */}
        {busy && pendingText && (
          <div className="mb-2.5 flex items-center gap-2 text-xs text-gray-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-neon-500" />
            {pendingText}
          </div>
        )}

        {/* Input row */}
        <div className="flex items-end gap-2 rounded-xl border border-ink-600 bg-ink-850 p-2 transition-colors focus-within:border-neon-500/40">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={disabled}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-ink-750 hover:text-white disabled:opacity-40"
            aria-label="Attach image"
          >
            <ImagePlus className="h-5 w-5" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
            placeholder="Ask anything about your fantasy team..."
            className="max-h-32 flex-1 resize-none bg-transparent px-1 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none disabled:opacity-50"
          />

          <button
            onClick={submit}
            disabled={disabled || ((!text.trim() && attachments.length === 0) && !busy)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neon-500 text-white transition-all hover:bg-neon-400 disabled:bg-ink-700 disabled:text-gray-500"
            aria-label="Send message"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>

        <p className="mt-2 text-center text-[11px] text-gray-600">
          Fantasy Football AI can make mistakes. Mock data — verify critical picks.
        </p>
      </div>
    </div>
  );
}
