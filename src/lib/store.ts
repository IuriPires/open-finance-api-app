const itemsByUser = new Map<string, Set<string>>();

export function addItem(userId: string, itemId: string): void {
  const set = itemsByUser.get(userId) ?? new Set<string>();
  set.add(itemId);
  itemsByUser.set(userId, set);
}

export function listItems(userId: string): string[] {
  const set = itemsByUser.get(userId);
  return set ? [...set] : [];
}

export function removeItem(userId: string, itemId: string): void {
  itemsByUser.get(userId)?.delete(itemId);
}
