import { describe, it, expect, beforeEach } from 'vitest';

describe('Módulo DataManager - Carrito y Cálculos', () => {
  let cart = [];

  beforeEach(() => {
    cart = [];
    localStorage.clear();
  });

  const addToCart = (product, quantity = 1) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ ...product, quantity });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + (item.precio * item.quantity), 0);
  };

  const applyDiscount = (subtotal, discountPercent) => {
    const discount = Math.round(subtotal * (discountPercent / 100));
    return {
      subtotal,
      discount,
      total: subtotal - discount
    };
  };

  it('debe agregar productos al carrito y actualizar cantidades', () => {
    const prod1 = { id: 'p1', nombre: 'Modelo Cyber-Dragon', precio: 45000, stock: 10 };
    addToCart(prod1, 1);
    expect(cart.length).toBe(1);
    expect(cart[0].quantity).toBe(1);

    addToCart(prod1, 2);
    expect(cart.length).toBe(1);
    expect(cart[0].quantity).toBe(3);
  });

  it('debe calcular el subtotal correctamente acumulando múltiples productos', () => {
    const prod1 = { id: 'p1', nombre: 'Modelo Cyber-Dragon', precio: 45000 };
    const prod2 = { id: 'p2', nombre: 'Mano Robótica 3D', precio: 30000 };

    addToCart(prod1, 2); // 90.000
    addToCart(prod2, 1); // 30.000

    expect(calculateSubtotal()).toBe(120000);
  });

  it('debe calcular el total con descuento correctamente', () => {
    const subtotal = 100000;
    const result = applyDiscount(subtotal, 15); // 15% de descuento

    expect(result.subtotal).toBe(100000);
    expect(result.discount).toBe(15000);
    expect(result.total).toBe(85000);
  });

  it('debe formatear el valor del total usando formatCOP', () => {
    const subtotal = 80000;
    const result = applyDiscount(subtotal, 10);
    expect(window.formatCOP(result.total)).toBe('$72.000');
  });
});
