import { supabase } from '@/lib/supabase';
import type { ChatMessage, ChatSession } from '@/types';

export async function getChatUserId(): Promise<string | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user.id;
}

export async function loadSupabaseChats(
  userId: string,
): Promise<ChatSession[]> {
  const { data: sessionRows, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (sessionError) throw sessionError;
  if (!sessionRows || sessionRows.length === 0) return [];

  const sessionIds = sessionRows.map((row) => row.id);

  const { data: messageRows, error: messageError } = await supabase
    .from('chat_messages')
    .select('*')
    .in('session_id', sessionIds)
    .order('created_at', { ascending: true });

  if (messageError) throw messageError;

  return sessionRows.map((sessionRow) => {
    const messages: ChatMessage[] = (messageRows ?? [])
      .filter((messageRow) => messageRow.session_id === sessionRow.id)
      .map((messageRow) => ({
        id: messageRow.id,
        kind: messageRow.role as ChatMessage['kind'],
        text: messageRow.content || undefined,
        attachments:
          Array.isArray(messageRow.attachments) &&
          messageRow.attachments.length > 0
            ? messageRow.attachments
            : undefined,
        createdAt: new Date(messageRow.created_at).getTime(),
      }));

    return {
      id: sessionRow.id,
      title: sessionRow.title,
      messages,
      createdAt: new Date(sessionRow.created_at).getTime(),
      updatedAt: new Date(sessionRow.updated_at).getTime(),
    };
  });
}

export async function saveSupabaseSession(
  session: ChatSession,
  userId: string,
): Promise<void> {
  const { error } = await supabase.from('chat_sessions').upsert({
    id: session.id,
    user_id: userId,
    title: session.title,
    created_at: new Date(session.createdAt).toISOString(),
    updated_at: new Date(session.updatedAt).toISOString(),
  });

  if (error) throw error;
}

export async function saveSupabaseMessage(
  sessionId: string,
  message: ChatMessage,
): Promise<void> {
  if (message.pending) return;

  const { error } = await supabase.from('chat_messages').upsert({
    id: message.id,
    session_id: sessionId,
    role: message.kind,
    content: message.text ?? '',
    attachments: message.attachments ?? [],
    created_at: new Date(message.createdAt).toISOString(),
  });

  if (error) throw error;
}

export async function updateSupabaseSessionTitle(
  sessionId: string,
  title: string,
): Promise<void> {
  const { error } = await supabase
    .from('chat_sessions')
    .update({
      title,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) throw error;
}

export async function deleteSupabaseSession(
  sessionId: string,
): Promise<void> {
  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) throw error;
}

export async function deleteSupabaseMessage(
  messageId: string,
): Promise<void> {
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('id', messageId);

  if (error) throw error;
}

export async function clearSupabaseMessages(
  sessionId: string,
): Promise<void> {
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('session_id', sessionId);

  if (error) throw error;
}