// Generates UUIDs compatible with Supabase uuid columns.
export function uid(): string {
  return crypto.randomUUID();
}