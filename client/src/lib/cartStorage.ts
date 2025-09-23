import { CartItem } from '@/types';

const CART_KEY = 'snijtool_cart';

export function loadCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load cart from localStorage:', error);
    return [];
  }
}

export function saveCart(cart: CartItem[]): void {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error);
  }
}

export function addToCart(item: CartItem): void {
  const cart = loadCart();
  cart.push(item);
  saveCart(cart);
}

export function removeFromCart(itemId: string): void {
  const cart = loadCart();
  const filtered = cart.filter(item => item.id !== itemId);
  saveCart(filtered);
}

export function clearCart(): void {
  try {
    localStorage.removeItem(CART_KEY);
  } catch (error) {
    console.error('Failed to clear cart:', error);
  }
}
