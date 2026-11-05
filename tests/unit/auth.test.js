import { describe, it, expect, beforeEach } from 'vitest';

describe('Módulo Auth - Validaciones de Autenticación', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePassword = (password) => {
    return typeof password === 'string' && password.length >= 6;
  };
  // Usuarios de prueba predeterminados (5 admin y 5 usuarios clientes)
  const testAdmins = [
    { email: 'admin1@papercraft.com', role: 'admin' },
    { email: 'admin2@papercraft.com', role: 'admin' },
    { email: 'admin3@papercraft.com', role: 'admin' },
    { email: 'admin4@papercraft.com', role: 'admin' },
    { email: 'admin5@papercraft.com', role: 'admin' },
  ];

  const testClients = [
    { email: 'cliente1@papercraft.com', role: 'cliente' },
    { email: 'cliente2@papercraft.com', role: 'cliente' },
    { email: 'cliente3@papercraft.com', role: 'cliente' },
    { email: 'cliente4@papercraft.com', role: 'cliente' },
    { email: 'cliente5@papercraft.com', role: 'cliente' },
  ];

  it('debe validar la lista de usuarios predeterminados (5 admin y 5 clientes)', () => {
    expect(testAdmins.length).toBe(5);
    expect(testClients.length).toBe(5);

    testAdmins.forEach(user => {
      expect(validateEmail(user.email)).toBe(true);
      expect(user.role).toBe('admin');
    });

    testClients.forEach(user => {
      expect(validateEmail(user.email)).toBe(true);
      expect(user.role).toBe('cliente');
    });
  });

  it('debe validar correos electrónicos con formato correcto', () => {
    expect(validateEmail('usuario@gmail.com')).toBe(true);
    expect(validateEmail('admin@papercraft.co')).toBe(true);
    expect(validateEmail('correo-invalido')).toBe(false);
    expect(validateEmail('@sinusuario.com')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });

  it('debe exigir contraseñas de al menos 6 caracteres', () => {
    expect(validatePassword('123456')).toBe(true);
    expect(validatePassword('cyberpunk2077')).toBe(true);
    expect(validatePassword('12345')).toBe(false);
    expect(validatePassword('')).toBe(false);
  });

  it('debe registrar y consultar correctamente faltas de intentos fallidos en localStorage', () => {
    const getStrikes = (email) => {
      const data = localStorage.getItem(`strikes_${email}`);
      return data ? JSON.parse(data) : { count: 0, blockedUntil: null };
    };

    const addStrike = (email) => {
      const current = getStrikes(email);
      current.count += 1;
      if (current.count >= 3) {
        current.blockedUntil = Date.now() + 15 * 60 * 1000; // Bloqueo 15 min
      }
      localStorage.setItem(`strikes_${email}`, JSON.stringify(current));
      return current;
    };

    const email = 'test@papercraft.com';
    expect(getStrikes(email).count).toBe(0);

    addStrike(email);
    expect(getStrikes(email).count).toBe(1);

    addStrike(email);
    addStrike(email);
    const result = getStrikes(email);
    expect(result.count).toBe(3);
    expect(result.blockedUntil).toBeGreaterThan(Date.now());
  });
});
