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

export type Favorite = {
  id: string;
  label: string;
  amount: number;
  description: string;
  createdAt: string;
};

const favoritesByUser = new Map<string, Favorite[]>();

export function listFavorites(userId: string): Favorite[] {
  return favoritesByUser.get(userId) ?? [];
}

export function addFavorite(userId: string, fav: Favorite): void {
  const arr = favoritesByUser.get(userId) ?? [];
  arr.unshift(fav);
  favoritesByUser.set(userId, arr);
}

export function removeFavorite(userId: string, id: string): void {
  const arr = favoritesByUser.get(userId);
  if (!arr) return;
  favoritesByUser.set(
    userId,
    arr.filter((f) => f.id !== id),
  );
}
