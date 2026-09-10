import { useEffect, useRef } from 'react';
import type { ChatAttachment, ChatMessage } from '@/types';
import { useChat } from '@/services/chat/useChatStore';
import {
  generateFantasyResponse,
  generatePostConnectionResponse,
} from '@/services/ai/fantasyAiService';
import { uid } from '@/services/utils/uid';
import { useApp } from '@/state/AppContext';
import { ChatInput } from '@/components/chat/ChatInput';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { Welcome } from '@/components/chat/Welcome';
import { YahooConnectCard } from '@/components/fantasy/YahooConnectCard';
import { validateImageFile, readAsDataUrl, ACCEPT_STRING } from '@/services/upload/uploadService';
import { sendAiMessage } from '@/services/ai/openAiService';

export function ChatPage() {
  const { yahoo, user } = useApp();
  const { activeSession, addMessage, removeMessage } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const prevYahooConnected = useRef(yahoo.connected);

  const messages = activeSession?.messages ?? [];

  // Auto-scroll to bottom on new messages.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // When Yahoo transitions from disconnected -> connected, inject the
  // "I found a few things worth looking at this week." message + cards.
  useEffect(() => {
    if (yahoo.connected && !prevYahooConnected.current) {
      void injectPostConnection();
    }
    prevYahooConnected.current = yahoo.connected;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yahoo.connected]);

  const injectPostConnection = async () => {
    const responses = await generatePostConnectionResponse();
    for (const r of responses) addMessage(r);
  };

  const send = async (text: string, attachments: ChatAttachment[]) => {
    const userMsg: ChatMessage = {
      id: uid(),
      kind: 'user',
      text: text || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      createdAt: Date.now(),
    };
    addMessage(userMsg);

    // Pending assistant placeholder.
    const pendingId = uid();
    addMessage({
      id: pendingId,
      kind: 'assistant',
      pending: true,
      text: attachments.length > 0 ? 'Analyzing roster...' : undefined,
      createdAt: Date.now(),
    });

    try {
      const responses = await generateFantasyResponse(text, attachments);
      // Remove pending, add real responses.
      removeMessage(pendingId);
      for (const r of responses) addMessage(r);
    } catch {
      removeMessage(pendingId);
      addMessage({
        id: uid(),
        kind: 'assistant',
        text: 'Sorry, I ran into an error analyzing that. Please try again.',
        createdAt: Date.now(),
      });
    }
  };

  const handleRosterAction = async (action: 'optimize' | 'upgrades' | 'sleepers' | 'trade') => {
    const text =
      action === 'optimize' ? 'Optimize my lineup' :
      action === 'upgrades' ? 'Find upgrades' :
      action === 'sleepers' ? 'Find sleepers' :
      'Trade ideas';
    await send(text, []);
  };

  const handleBuildBetterTrade = async () => {
    await send('Build better trade', []);
  };

  const handleSuggestion = (text: string) => {
    void send(text, []);
  };

  const handleUpload = () => {
    fileRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const validation = validateImageFile(file);
    if (!validation.valid) {
      addMessage({
        id: uid(),
        kind: 'assistant',
        text: validation.error ?? 'Invalid file. Please upload a PNG, JPG, or WEBP image under 10 MB.',
        createdAt: Date.now(),
      });
      return;
    }

    try {
      const dataUrl = await readAsDataUrl(file);
      const attachment: ChatAttachment = {
        id: uid(),
        name: file.name,
        dataUrl,
        kind: 'image',
      };
      // TODO-INTEGRATION: ROSTER_SCREENSHOT_ANALYSIS
      // TODO-INTEGRATION: WEEKLY_MATCHUP_ANALYSIS
      void send('Analyze this roster screenshot', [attachment]);
    } catch {
      addMessage({
        id: uid(),
        kind: 'assistant',
        text: 'Failed to read the image file. Please try again.',
        createdAt: Date.now(),
      });
    }
  };

  return (
    <div className="flex h-full w-full flex-1 flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="bg-grid min-h-full">
            <Welcome onUploadClick={handleUpload} onSuggestion={handleSuggestion} />
            {user && (
              <div className="mx-auto max-w-3xl px-4 pb-6">
                <YahooConnectCard />
              </div>
            )}
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4 px-3 py-4 sm:px-4 sm:py-6">
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                onRosterAction={handleRosterAction}
                onBuildBetterTrade={handleBuildBetterTrade}
              />
            ))}
          </div>
        )}
      </div>

      <ChatInput onSend={send} busy={messages.some((m) => m.pending)} pendingText="Analyzing roster..." />

      <input ref={fileRef} type="file" accept={ACCEPT_STRING} className="hidden" onChange={handleFileChange} />
    </div>
  );
}
