interface AiResponse {
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: string;
}

function getFantasyAiUrl(): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  return `${supabaseUrl}/functions/v1/fantasy-ai`;
}

function getHeaders(): Record<string, string> {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  return {
    Authorization: `Bearer ${anonKey}`,
    apikey: anonKey,
    'Content-Type': 'application/json',
  };
}

export async function sendAiMessage(message: string): Promise<string> {
  const response = await fetch(getFantasyAiUrl(), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ message }),
  });

  const data: AiResponse = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? `AI request failed (${response.status})`);
  }

  const text = data.output
    ?.flatMap((item) => item.content ?? [])
    .find((content) => content.type === 'output_text')
    ?.text;

  if (!text) {
    throw new Error('AI returned no text response');
  }

  return text;
}