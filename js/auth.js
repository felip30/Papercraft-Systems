/**
 * auth.js - login, registro y sesión con Supabase Auth + tabla "usuarios"
 * Requiere que window.supabaseClient ya exista (js/supabase-config.js debe cargar antes).
 */

// hash SHA-256 para la respuesta de seguridad (nunca se guarda en texto plano)
async function hashTexto(texto) {
  const datos = new TextEncoder().encode(texto.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', datos);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

class AuthManager {
  constructor() {
    this.currentUser = null;   // username (string)
    this.currentRole = null;   // 'cliente' | 'admin'
    this.isAuthenticated = false;
    this.profile = null;       // fila completa de la tabla "usuarios"

    // hay que esperar ready() antes de leer el estado de sesión (es async)
    this._readyPromise = this._initSession();

    // si se cierra sesión en otra pestaña, sincronizar acá también
    window.supabaseClient.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.currentRole = null;
        this.isAuthenticated = false;
        this.profile = null;
      }
    });
  }

  async ready() {
    return this._readyPromise;
  }

  async _initSession() {
    const { data } = await window.supabaseClient.auth.getSession();
    if (data.session) {
      const cargado = await this._loadProfile(data.session.user.id);
      if (cargado) this.startSessionWatcher(); // no reclama sesión nueva, solo vigila
    }
  }

  async _loadProfile(userId) {
    const { data, error } = await window.supabaseClient
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('Error al cargar el perfil de la sesión:', error?.message || 'sin datos');
      this.isAuthenticated = false;
      return false;
    }

    this.profile = data;
    this.currentUser = data.username;
    this.currentRole = data.role;
    this.isAuthenticated = true;

    // si tenía un veto y ya pasaron las 24 horas, limpia las faltas solo
    if (data.banned_until) {
      await this._limpiarFaltasSiCorresponde();
    }

    return true;
  }

  // la fecha se valida en el servidor (RPC), no confía en el reloj del navegador
  async _limpiarFaltasSiCorresponde() {
    const { data, error } = await window.supabaseClient.rpc('limpiar_faltas_vencidas');
    if (error) {
      console.error('No se pudo revisar el veto vencido:', error.message);
      return;
    }
    const resultado = data && data[0];
    if (resultado && this.profile) {
      this.profile.strikes = resultado.strikes;
      this.profile.banned_until = resultado.banned_until;
    }
  }

  // el trigger on_auth_user_created (sql/01) copia esto a "usuarios" solo
  async register(username, email, password, passwordConfirm, securityQuestion, securityAnswer) {
    const faltantes = [];
    if (!username) faltantes.push('Nombre de usuario');
    if (!email) faltantes.push('Correo electrónico');
    if (!password) faltantes.push('Contraseña');
    if (!passwordConfirm) faltantes.push('Confirmar contraseña');
    if (!securityQuestion) faltantes.push('Pregunta de seguridad');
    if (!securityAnswer) faltantes.push('Respuesta de seguridad');

    if (faltantes.length > 0) {
      return { success: false, message: `Falta completar: ${faltantes.join(', ')}` };
    }

    if (password.length < 6) {
      return { success: false, message: 'La contraseña debe tener mínimo 6 caracteres' };
    }

    if (password !== passwordConfirm) {
      return { success: false, message: 'Las contraseñas no coinciden' };
    }

    // username restringido: evita inyectar código donde se muestra (navbar, admin)
    if (!/^[\p{L}0-9 _-]{3,30}$/u.test(username)) {
      return {
        success: false,
        message: 'El usuario debe tener entre 3 y 30 caracteres (solo letras, números, espacios, "-" o "_")'
      };
    }

    const respuestaCifrada = await hashTexto(securityAnswer);

    const { data, error } = await window.supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          security_question: securityQuestion,
          security_answer: respuestaCifrada
        }
      }
    });

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        return { success: false, message: 'El usuario o email ya existe' };
      }
      return { success: false, message: error.message };
    }

    if (data.session) { // sin confirmación de email activada, auto-login
      await this._loadProfile(data.user.id);
      await this.claimSession();
      this.startSessionWatcher();
      window.dispatchEvent(new Event('userLoggedIn'));
      return { success: true, message: 'Cuenta creada exitosamente', needsEmailConfirmation: false };
    }

    return {
      success: true,
      message: 'Cuenta creada. Revisa tu correo para confirmarla antes de iniciar sesión.',
      needsEmailConfirmation: true
    };
  }

  // acepta username o email (Auth solo funciona con email, se resuelve abajo)
  async login(identifier, password) {
    if (!identifier || !password) {
      return { success: false, message: 'Ingresa tu usuario/email y contraseña' };
    }

    // límite de intentos controlado server-side
    const { data: gateData, error: gateError } = await window.supabaseClient
      .rpc('check_login_allowed', { p_identifier: identifier });

    if (!gateError && gateData && gateData[0] && !gateData[0].allowed) {
      const segundos = gateData[0].seconds_remaining;
      return {
        success: false,
        message: `Demasiados intentos fallidos. Espera ${segundos} segundos antes de volver a intentar.`
      };
    }

    let email = identifier;

    if (!identifier.includes('@')) {
      const { data, error } = await window.supabaseClient
        .rpc('get_email_by_username', { lookup_username: identifier });

      if (error || !data) {
        await window.supabaseClient.rpc('record_login_attempt', { p_identifier: identifier, p_success: false });
        return { success: false, message: 'Usuario no encontrado' };
      }
      email = data;
    }

    const { data: authData, error: authError } = await window.supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      await window.supabaseClient.rpc('record_login_attempt', { p_identifier: identifier, p_success: false });

      if (authError.message.toLowerCase().includes('email not confirmed')) {
        return {
          success: false,
          message: 'Tu correo todavía no está confirmado. Revisa tu bandeja de entrada (o spam) y confirma la cuenta antes de iniciar sesión.'
        };
      }
      if (authError.message.toLowerCase().includes('invalid login credentials')) {
        return { success: false, message: 'Usuario o contraseña incorrectos' };
      }
      return { success: false, message: authError.message };
    }

    await window.supabaseClient.rpc('record_login_attempt', { p_identifier: identifier, p_success: true });

    const loaded = await this._loadProfile(authData.user.id);
    if (!loaded) {
      return { success: false, message: 'No se pudo cargar el perfil de la cuenta' };
    }

    // esta sesión pasa a ser la válida, la otra se cierra
    // sola la próxima vez que ese dispositivo revise (cada 30 segundos).
    await this.claimSession();
    this.startSessionWatcher();

    window.dispatchEvent(new Event('userLoggedIn'));
    return { success: true, message: 'Bienvenido' };
  }

  // LOGOUT
  async logout() {
    this.stopSessionWatcher();
    localStorage.removeItem('papercraft_session_id');
    await window.supabaseClient.auth.signOut();
    this.currentUser = null;
    this.currentRole = null;
    this.isAuthenticated = false;
    this.profile = null;
    window.dispatchEvent(new Event('userLoggedOut'));
  }

  // ======================================
  // UNA SOLA SESIÓN ACTIVA POR CUENTA
  // ======================================

  // Genera un identificador nuevo para ESTE navegador y lo guarda como
  // "el vigente" en la base de datos — cualquier otro dispositivo con la
  // misma cuenta abierta va a notar, en su próxima revisión, que su
  // identificador ya no coincide con el de la base de datos.
  async claimSession() {
    if (!this.profile) return;
    const sessionId = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
    localStorage.setItem('papercraft_session_id', sessionId);

    const { error } = await window.supabaseClient
      .from('usuarios')
      .update({ current_session_id: sessionId })
      .eq('id', this.profile.id);

    if (!error) {
      this.profile.current_session_id = sessionId;
    } else {
      console.error('No se pudo registrar la sesión activa:', error.message);
    }
  }

  // ¿El identificador guardado en este navegador sigue siendo el mismo
  // que la base de datos considera "el vigente" para esta cuenta?
  async isSessionStillValid() {
    if (!this.profile) return true;
    const localId = localStorage.getItem('papercraft_session_id');
    if (!localId) return true; // todavía no se reclamó ninguna sesión (cuenta antigua, sin re-loguear)

    const { data, error } = await window.supabaseClient
      .from('usuarios')
      .select('current_session_id')
      .eq('id', this.profile.id)
      .single();

    if (error || !data) return true; // ante un problema de red, no se cierra sesión por las dudas
    return data.current_session_id === localId;
  }

  // Revisa cada 30 segundos si esta sigue siendo la sesión vigente de la
  // cuenta. Si otro dispositivo inició sesión más tarde, esta se cierra
  // sola y avisa por qué.
  startSessionWatcher() {
    this.stopSessionWatcher();
    this._sessionWatcherInterval = setInterval(async () => {
      if (!this.isAuthenticated) return;
      const valido = await this.isSessionStillValid();
      if (!valido) {
        this.stopSessionWatcher();
        await this.logout();
        window.dispatchEvent(new Event('sessionKicked'));
        return;
      }

      // si el veto se cumplió mientras seguía navegando, se limpia solo
      if (this.profile && this.profile.banned_until) {
        await this._limpiarFaltasSiCorresponde();
      }
    }, 30000);
  }

  stopSessionWatcher() {
    if (this._sessionWatcherInterval) {
      clearInterval(this._sessionWatcherInterval);
      this._sessionWatcherInterval = null;
    }
  }

  // Resuelve el email a partir de un identificador que puede ser username
  // o email — se usa tanto en login como en recuperación de contraseña.
  async resolveEmail(identifier) {
    if (identifier.includes('@')) return identifier;

    const { data, error } = await window.supabaseClient
      .rpc('get_email_by_username', { lookup_username: identifier });

    if (error || !data) return null;
    return data;
  }

  // RECUPERACIÓN DE CONTRASEÑA
  // Supabase no permite cambiar la contraseña de otra persona solo con una
  // respuesta correcta — eso siempre requiere el enlace que llega por
  // correo. Por eso la pregunta de seguridad funciona como un paso extra
  // de verificación ANTES de enviar ese correo, no como un atajo para
  // saltárselo.

  // Trae la pregunta de seguridad de una cuenta (por username o email), sin
  // exponer la respuesta — se resuelve con una función de la base de datos
  // (SECURITY DEFINER) que solo devuelve el texto de la pregunta.
  async getSecurityQuestion(identifier) {
    const { data, error } = await window.supabaseClient
      .rpc('get_security_question', { lookup: identifier });

    if (error || !data) {
      return { success: false, message: 'No encontramos una cuenta con ese usuario o correo' };
    }
    return { success: true, question: data };
  }

  // Verifica la respuesta (cifrándola en el navegador antes de mandarla)
  // contra el hash guardado, sin que el cliente vea nunca el hash real.
  async verifySecurityAnswer(identifier, answer) {
    const respuestaCifrada = await hashTexto(answer);
    const { data, error } = await window.supabaseClient
      .rpc('verify_security_answer', { lookup: identifier, answer_hash: respuestaCifrada });

    if (error) {
      return { success: false, message: error.message };
    }
    if (!data) {
      return { success: false, message: 'La respuesta no es correcta' };
    }
    return { success: true };
  }

  async initiatePasswordRecovery(email) {
    if (!email || !email.includes('@')) {
      return { success: false, message: 'Ingresa el correo con el que te registraste' };
    }

    const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/pages/reset-password.html`
    });
    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: 'Te enviamos un correo con el enlace para restablecer tu contraseña'
    };
  }

  // Cambiar contraseña propia (desde el modal "Mi Perfil"). Para confirmar
  // que quien lo pide realmente conoce la contraseña actual, se
  // reautentica antes de aplicar el cambio.
  async changeOwnPassword(currentPassword, newPassword, confirmPassword) {
    if (!this.profile) {
      return { success: false, message: 'Debes iniciar sesión' };
    }

    if (!newPassword || !confirmPassword) {
      return { success: false, message: 'Completa los campos de nueva contraseña' };
    }
    if (newPassword !== confirmPassword) {
      return { success: false, message: 'Las contraseñas nuevas no coinciden' };
    }
    if (newPassword.length < 6) {
      return { success: false, message: 'La contraseña debe tener mínimo 6 caracteres' };
    }

    const { error: reauthError } = await window.supabaseClient.auth.signInWithPassword({
      email: this.profile.email,
      password: currentPassword
    });
    if (reauthError) {
      return { success: false, message: 'La contraseña actual es incorrecta' };
    }

    const { error } = await window.supabaseClient.auth.updateUser({ password: newPassword });
    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Contraseña actualizada exitosamente' };
  }

  // Verificar si tiene permiso (lectura del estado ya cargado en memoria)
  hasPermission(requiredRole) {
    if (!this.isAuthenticated) return false;
    if (requiredRole === 'all') return true;
    return this.currentRole === requiredRole;
  }

  // Info del usuario actual (síncrono, lee el perfil ya cargado)
  getCurrentUser() {
    return {
      username: this.currentUser,
      email: this.profile?.email || '',
      userId: this.profile?.id || null,
      role: this.currentRole,
      isAuthenticated: this.isAuthenticated,
      isAdmin: this.currentRole === 'admin',
      isClient: this.currentRole === 'cliente',
      avatarUrl: this.profile?.avatar_url || '',
      notificarPedidos: this.profile?.notificar_pedidos !== false
    };
  }

  // Solo devuelve datos si el id coincide con el usuario ya logueado (no
  // hay forma de traer el perfil de OTRO usuario con la clave anon, por
  // las políticas RLS de la tabla "usuarios").
  getUserById(userId) {
    if (this.profile && this.profile.id === userId) {
      return { ...this.profile };
    }
    return undefined;
  }

  // ======================================
  // GESTIÓN DE USUARIOS (Panel Admin → pestaña "Usuarios")
  // Sigue funcionando sobre la tabla "usuarios" de Supabase para lectura;
  // las acciones de escritura requieren que quien esté logueado tenga
  // role = 'admin' (política RLS ya lo exige del lado del servidor).
  // ======================================

  async getAllUsers() {
    const { data, error } = await window.supabaseClient
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al listar usuarios:', error.message);
      return [];
    }
    return data;
  }

  // Edita el propio perfil (disponible para cliente y admin). El email no
  // se puede cambiar desde aquí: vive en Supabase Auth, no en esta tabla.
  async updateOwnProfile(updates) {
    if (!this.profile) {
      return { success: false, message: 'Debes iniciar sesión' };
    }

    const payload = {};
    if (updates.username !== undefined) payload.username = updates.username;
    if (updates.full_name !== undefined) payload.full_name = updates.full_name;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.address !== undefined) payload.address = updates.address;
    if (updates.notificar_pedidos !== undefined) payload.notificar_pedidos = updates.notificar_pedidos;
    payload.updated_at = new Date().toISOString();

    if (payload.username && !/^[\p{L}0-9 _-]{3,30}$/u.test(payload.username)) {
      return {
        success: false,
        message: 'El usuario debe tener entre 3 y 30 caracteres (solo letras, números, espacios, "-" o "_")'
      };
    }

    const { data, error } = await window.supabaseClient
      .from('usuarios')
      .update(payload)
      .eq('id', this.profile.id)
      .select()
      .single();

    if (error) {
      return { success: false, message: error.message };
    }

    this.profile = data;
    this.currentUser = data.username;
    return { success: true, message: 'Perfil actualizado' };
  }

  // Sube una foto de perfil al bucket "avatars" de Supabase Storage y
  // actualiza el perfil con su URL pública.
  async uploadAvatar(file) {
    if (!this.profile) {
      return { success: false, message: 'Debes iniciar sesión' };
    }
    if (!file.type.startsWith('image/')) {
      return { success: false, message: 'El archivo debe ser una imagen' };
    }
    if (file.size > 2 * 1024 * 1024) {
      return { success: false, message: 'La imagen no puede pesar más de 2 MB' };
    }

    const extension = file.name.split('.').pop();
    const path = `${this.profile.id}/avatar.${extension}`;

    const { error: uploadError } = await window.supabaseClient.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      return { success: false, message: uploadError.message };
    }

    const { data: urlData } = window.supabaseClient.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { data, error } = await window.supabaseClient
      .from('usuarios')
      .update({ avatar_url: avatarUrl })
      .eq('id', this.profile.id)
      .select()
      .single();

    if (error) {
      return { success: false, message: error.message };
    }

    this.profile = data;
    return { success: true, avatarUrl };
  }

  async updateUser(userId, updates) {
    const payload = {};
    if (updates.username !== undefined) payload.username = updates.username;
    if (updates.role !== undefined) payload.role = updates.role;
    if (updates.credits !== undefined) payload.credits = updates.credits;
    if (updates.full_name !== undefined) payload.full_name = updates.full_name;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.address !== undefined) payload.address = updates.address;
    // email real vive en Auth, no acá — no se puede cambiar desde este form
    payload.updated_at = new Date().toISOString();

    const { data, error } = await window.supabaseClient
      .from('usuarios')
      .update(payload)
      .eq('id', userId)
      .select()
      .single();

    if (error) return null;
    return data;
  }

  async toggleUserStatus() {
    // no hay columna de estado activo/inactivo todavía, queda pendiente
    return { success: false, message: 'Gestión de estado no disponible todavía en Supabase' };
  }

  async deleteUser(userId) {
    // .select() para confirmar qué borró de verdad (RLS a veces no tira error aunque bloquee)
    const { data, error } = await window.supabaseClient
      .from('usuarios')
      .delete()
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Error al eliminar usuario:', error.message);
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      throw new Error('No se eliminó ningún registro en la base de datos (posible bloqueo de seguridad). Verifica que tu cuenta siga teniendo rol de administrador.');
    }

    return true;
  }

  async changeUserRole(userId, newRole) {
    const { data, error } = await window.supabaseClient
      .from('usuarios')
      .update({ role: newRole })
      .eq('id', userId)
      .select()
      .single();

    if (error) return null;
    return data;
  }

  async updateUserCredits(userId, amount) {
    const { data: current, error: readError } = await window.supabaseClient
      .from('usuarios')
      .select('credits')
      .eq('id', userId)
      .single();

    if (readError) {
      console.error('Error al leer créditos actuales:', readError.message);
      throw new Error(readError.message);
    }
    if (!current) {
      throw new Error('No se encontró el usuario para actualizar créditos');
    }

    const nuevoTotal = Math.max(0, current.credits + amount);
    const { data, error } = await window.supabaseClient
      .from('usuarios')
      .update({ credits: nuevoTotal })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar créditos:', error.message);
      throw new Error(error.message);
    }
    return data;
  }

  // bono a los 3000 créditos; el cupón lo crea quien llama esto (vive en DataManager)
  async checkAndClaimCreditsBonus(userId) {
    const { data: current, error } = await window.supabaseClient
      .from('usuarios')
      .select('credits')
      .eq('id', userId)
      .single();

    if (error || !current || current.credits < 3000) {
      return { claimed: false };
    }

    const nuevoSaldo = current.credits - 3000; // resta exacta, no resetea todo = current.credits - 3000;

    const { error: resetError } = await window.supabaseClient
      .from('usuarios')
      .update({ credits: nuevoSaldo })
      .eq('id', userId);

    if (resetError) {
      console.error('Error al descontar los créditos del bono:', resetError.message);
      return { claimed: false };
    }

    if (this.profile && this.profile.id === userId) {
      this.profile.credits = nuevoSaldo;
    }

    return { claimed: true };
  }

  // ======================================
  // SISTEMA DE FALTAS (cancelaciones tardías)
  // ======================================

  // 3 faltas = 24h de veto
  isBanned() {
    if (!this.profile || !this.profile.banned_until) return false;
    return new Date(this.profile.banned_until) > new Date();
  }

  getBanMessage() {
    if (!this.isBanned()) return null;
    const restante = new Date(this.profile.banned_until) - new Date();
    const horas = Math.floor(restante / (1000 * 60 * 60));
    const minutos = Math.floor((restante % (1000 * 60 * 60)) / (1000 * 60));
    return `Tu cuenta está vetada por cancelaciones tardías. Podrás volver a jugar en ${horas}h ${minutos}min.`;
  }

  // suma una falta; la función en Supabase valida que el pedido sea de esta cuenta
  async registrarStrikeCancelacion(orderId) {
    const { data, error } = await window.supabaseClient
      .rpc('registrar_strike_cancelacion', { p_order_id: orderId });

    if (error) {
      console.error('Error al registrar la falta:', error.message);
      throw new Error(error.message);
    }

    const resultado = data && data[0];
    if (resultado && this.profile) {
      this.profile.strikes = resultado.nuevos_strikes;
      this.profile.banned_until = resultado.nuevo_veto;
    }

    return resultado;
  }
}

// Instancia global
window.AuthManager = new AuthManager();

// bfcache fix: si el navegador restaura la página del historial sin recargar,
// forzar reload para que la sesión mostrada sea la real
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    location.reload();
  }
});
