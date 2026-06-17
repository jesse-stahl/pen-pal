export interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  sound: 'default';
}

export function isExpoToken(token: string): boolean {
  return /^ExponentPushToken\[.+\]$/.test(token);
}

export function buildExpoMessages(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, unknown>
): ExpoMessage[] {
  return tokens
    .filter(isExpoToken)
    .map((to) => ({ to, title, body, data, sound: 'default' }));
}

export async function sendExpoPush(messages: ExpoMessage[]): Promise<void> {
  if (messages.length === 0) return;
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });
}
