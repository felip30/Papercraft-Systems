import { describe, it, expect } from 'vitest';
import '../../js/utils/currency.js';

describe('Utilidad currency.js - formatCOP', () => {
  it('debe formatear números enteros positivos en pesos colombianos con punto de miles y símbolo $', () => {
    expect(window.formatCOP(52000)).toBe('$52.000');
    expect(window.formatCOP(1500000)).toBe('$1.500.000');
  });

  it('debe redondear valores decimales al entero más cercano', () => {
    expect(window.formatCOP(52000.75)).toBe('$52.001');
    expect(window.formatCOP(52000.20)).toBe('$52.000');
  });

  it('debe manejar 0 correctamente', () => {
    expect(window.formatCOP(0)).toBe('$0');
  });

  it('debe convertir strings numéricos a COP correctamente', () => {
    expect(window.formatCOP('25000')).toBe('$25.000');
  });

  it('debe retornar $0 ante entradas nulas, indefinidas o NaN', () => {
    expect(window.formatCOP(null)).toBe('$0');
    expect(window.formatCOP(undefined)).toBe('$0');
    expect(window.formatCOP('invalid')).toBe('$0');
  });
});
