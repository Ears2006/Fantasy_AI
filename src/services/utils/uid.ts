// Small unique-id helper used across the mock services + chat state.
export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
