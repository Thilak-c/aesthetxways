'use client';

const CART_STORAGE_KEY = 'aw_cart';
const SONU_CART_KEY = 'sonu_cart';

export function normalizeItem(item) {
  const id = item.productId || item.id || item._id;
  const price = Number(item.priceNumber ?? item.price ?? 0);
  const image = item.image || item.mainImage || '';
  const size = item.size || 'OS';
  const name = item.name || '';
  const quantity = Number(item.quantity || 1);
  return {
    ...item,
    id,
    productId: id,
    priceNumber: price,
    price,
    image,
    mainImage: image,
    size,
    name,
    quantity,
    sizeDisplayType: item.sizeDisplayType || 'alpha',
  };
}

export function getCartItems() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY) || localStorage.getItem(SONU_CART_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeItem) : [];
  } catch (e) {
    console.error('Failed to parse cart', e);
    return [];
  }
}

export function saveCartItems(items) {
  if (typeof window === 'undefined') return;
  try {
    const normalized = items.map(normalizeItem);
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalized));
    localStorage.setItem(SONU_CART_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new Event('cart-updated'));
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Failed to save cart', e);
  }
}

export function addToCart(productItem) {
  const current = getCartItems();
  const norm = normalizeItem(productItem);
  const existingIdx = current.findIndex(
    (item) => item.id === norm.id && item.size === norm.size
  );

  let updated;
  if (existingIdx > -1) {
    updated = [...current];
    updated[existingIdx].quantity = (updated[existingIdx].quantity || 1) + norm.quantity;
  } else {
    updated = [
      ...current,
      {
        ...norm,
        addedAt: Date.now(),
      },
    ];
  }

  saveCartItems(updated);
  return updated;
}

export function removeFromCart(itemId, size, color) {
  const current = getCartItems();
  const updated = current.filter(
    (item) => !(item.id === itemId && item.size === size && (color === undefined || item.color === color))
  );
  saveCartItems(updated);
  return updated;
}

export function updateCartQuantity(itemId, size, color, delta) {
  // Support both (itemId, size, delta) and (itemId, size, color, delta)
  const actualDelta = typeof color === 'number' ? color : delta;
  const current = getCartItems();
  const updated = current
    .map((item) => {
      if (item.id === itemId && item.size === size) {
        const newQty = (item.quantity || 1) + actualDelta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    })
    .filter(Boolean);

  saveCartItems(updated);
  return updated;
}

export function updateItemSize(itemId, oldSize, newSize) {
  if (typeof window === 'undefined') return [];
  const current = getCartItems();
  if (!oldSize || !newSize || oldSize === newSize) return current;

  const targetIdx = current.findIndex(
    (item) => (item.id === itemId || item.productId === itemId) && item.size === oldSize
  );
  if (targetIdx === -1) return current;

  // Check if an item with newSize already exists for this product
  const existingIdx = current.findIndex(
    (item) => (item.id === itemId || item.productId === itemId) && item.size === newSize
  );

  let updated;
  if (existingIdx > -1 && existingIdx !== targetIdx) {
    // Merge quantity into existingIdx and remove targetIdx
    updated = current
      .map((item, idx) => {
        if (idx === existingIdx) {
          return {
            ...item,
            quantity: (item.quantity || 1) + (current[targetIdx].quantity || 1),
          };
        }
        return item;
      })
      .filter((_, idx) => idx !== targetIdx);
  } else {
    // Simply change size of targetIdx
    updated = current.map((item, idx) => {
      if (idx === targetIdx) {
        return {
          ...item,
          size: newSize,
        };
      }
      return item;
    });
  }

  saveCartItems(updated);
  return updated;
}

export function clearCart() {
  saveCartItems([]);
}

