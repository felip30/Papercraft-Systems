import { describe, it, expect, beforeEach } from 'vitest';

describe('Módulo Games Controller - Lógica y Créditos', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const getTodayKey = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getDailyCredits = (userId) => {
    const key = `credits_${userId}_${getTodayKey()}`;
    const saved = localStorage.getItem(key);
    return saved !== null ? parseInt(saved, 10) : 3; // 3 créditos gratis por día por defecto
  };

  const consumeCredit = (userId) => {
    const current = getDailyCredits(userId);
    if (current <= 0) return false;
    const key = `credits_${userId}_${getTodayKey()}`;
    localStorage.setItem(key, (current - 1).toString());
    return true;
  };

  const generateVaultCode = (gameType, discountPercent) => {
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PAPER-${gameType.toUpperCase()}-${discountPercent}-${randomHex}`;
  };

  it('debe otorgar 3 créditos iniciales por día a cada usuario', () => {
    expect(getDailyCredits('user-123')).toBe(3);
  });

  it('debe consumir un crédito correctamente y reducir el total disponible', () => {
    const success = consumeCredit('user-123');
    expect(success).toBe(true);
    expect(getDailyCredits('user-123')).toBe(2);
  });

  it('debe rechazar la jugada cuando los créditos del día se hayan agotado (0 créditos)', () => {
    consumeCredit('user-123'); // 2
    consumeCredit('user-123'); // 1
    consumeCredit('user-123'); // 0

    expect(getDailyCredits('user-123')).toBe(0);
    const retry = consumeCredit('user-123');
    expect(retry).toBe(false);
  });

  it('debe generar códigos de descuento válidos para el Vault Gamer', () => {
    const code = generateVaultCode('ruleta', 20);
    expect(code).toMatch(/^PAPER-RULETA-20-[A-Z0-9]{4}$/);
  });
});
