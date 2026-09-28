export function formatCategoryIcon(icon: string | null | undefined): string {
  if (!icon) return '📁';

  // If already an emoji (length <= 2 and non-ascii)
  const trimmed = icon.trim();
  const iconMap: Record<string, string> = {
    'restaurant': '🍽️',
    'dining': '🍽️',
    'food': '🍔',
    'shopping_cart': '🛒',
    'groceries': '🛒',
    'shopping': '🛍️',
    'flight': '✈️',
    'travel': '✈️',
    'airplane': '✈️',
    'bolt': '⚡',
    'utilities': '⚡',
    'energy': '💡',
    'devices': '💻',
    'electronics': '💻',
    'tech': '📱',
    'home': '🏠',
    'car': '🚗',
    'health': '🏥',
    'movie': '🎬',
    'coffee': '☕'
  };

  const key = trimmed.toLowerCase();
  if (iconMap[key]) {
    return iconMap[key];
  }

  // If it's a short emoji already
  if (trimmed.length <= 4) {
    return trimmed;
  }

  // Fallback: take the first uppercase letter or folder emoji
  return '📁';
}
