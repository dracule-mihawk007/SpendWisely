/**
 * Normalizes raw category icon keys to standard semantic keys.
 * Pure semantic identifier mapping - zero emoji icons.
 */
export function formatCategoryIcon(icon: string | null | undefined): string {
  if (!icon) return 'category';

  const trimmed = icon.trim().toLowerCase();
  const iconMap: Record<string, string> = {
    'restaurant': 'restaurant',
    'dining': 'restaurant',
    'food': 'restaurant',
    'shopping_cart': 'shopping_cart',
    'groceries': 'shopping_cart',
    'shopping': 'shopping_cart',
    'flight': 'flight',
    'travel': 'flight',
    'airplane': 'flight',
    'bolt': 'bolt',
    'utilities': 'bolt',
    'energy': 'bolt',
    'devices': 'devices',
    'electronics': 'devices',
    'tech': 'devices',
    'home': 'home',
    'car': 'car',
    'health': 'health',
    'movie': 'movie',
    'coffee': 'coffee'
  };

  return iconMap[trimmed] || 'category';
}
