/**
 * PROFILE MANAGER
 * Gestión de perfil de usuario
 */

const ProfileManager = {
  currentUser: null,

  // ════════════════════════════════════════════════════════════════
  // CARGAR PERFIL
  // ════════════════════════════════════════════════════════════════

  async loadProfile() {
    try {
      if (!supabase) {
        console.log('Cargando perfil demo');
        return this.getDemoProfile();
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      this.currentUser = { ...user, ...data };
      return this.currentUser;
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      return null;
    }
  },

  // ════════════════════════════════════════════════════════════════
  // ACTUALIZAR INFORMACIÓN PERSONAL
  // ════════════════════════════════════════════════════════════════

  async updateProfile(updates) {
    try {
      if (!supabase) {
        console.log('Actualizando perfil (demo)');
        this.currentUser = { ...this.currentUser, ...updates };
        return this.currentUser;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('usuarios')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      this.currentUser = { ...this.currentUser, ...data };
      console.log(' Perfil actualizado');
      return data;
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      throw error;
    }
  },

  // ════════════════════════════════════════════════════════════════
  // CAMBIAR CONTRASEÑA
  // ════════════════════════════════════════════════════════════════

  async changePassword(newPassword) {
    try {
      if (!supabase) {
        console.log('Contraseña cambiada (demo)');
        return true;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      console.log(' Contraseña actualizada');
      return true;
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      throw error;
    }
  },

  // ════════════════════════════════════════════════════════════════
  // AGREGAR DIRECCIÓN
  // ════════════════════════════════════════════════════════════════

  async addAddress(address) {
    try {
      if (!supabase) {
        console.log('Dirección agregada (demo)');
        return { id: Date.now(), ...address };
      }

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('direcciones')
        .insert([{
          usuario_id: user.id,
          ...address,
          es_default: false
        }])
        .select()
        .single();

      if (error) throw error;
      console.log(' Dirección agregada');
      return data;
    } catch (error) {
      console.error('Error al agregar dirección:', error);
      throw error;
    }
  },

  // ════════════════════════════════════════════════════════════════
  // OBTENER ESTADÍSTICAS DEL USUARIO
  // ════════════════════════════════════════════════════════════════

  async getUserStats() {
    try {
      if (!supabase) {
        return this.getDemoStats();
      }

      const { data: { user } } = await supabase.auth.getUser();

      // Obtener número de pedidos
      const { data: orders } = await supabase
        .from('pedidos')
        .select('total')
        .eq('usuario_id', user.id);

      // Obtener número de reseñas
      const { data: reviews } = await supabase
        .from('resenas')
        .select('id')
        .eq('usuario_id', user.id);

      // Obtener wishlist
      const wishlistCount = (await supabase
        .from('wishlist')
        .select('*')
        .eq('usuario_id', user.id)).data?.[0]?.productos?.length || 0;

      const totalSpent = orders?.reduce((sum, order) => sum + order.total, 0) || 0;

      return {
        ordersCount: orders?.length || 0,
        totalSpent,
        reviewsCount: reviews?.length || 0,
        wishlistCount,
        memberSince: this.currentUser?.created_at,
        loyaltyPoints: Math.floor(totalSpent / 1000) // 1 punto por cada $1.000 COP gastado
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return this.getDemoStats();
    }
  },

  // ════════════════════════════════════════════════════════════════
  // DATOS DE DEMOSTRACIÓN
  // ════════════════════════════════════════════════════════════════

  getDemoProfile() {
    return {
      id: 'demo-user',
      nombre: 'Juan Pérez García',
      email: 'juan@example.com',
      telefono: '+34 612 345 678',
      pais: 'España',
      fechaNacimiento: '1990-05-15',
      created_at: '2024-01-15'
    };
  },

  getDemoStats() {
    return {
      ordersCount: 12,
      totalSpent: 4982000,
      reviewsCount: 8,
      wishlistCount: 5,
      loyaltyPoints: 4982,
      memberSince: '2024-01-15'
    };
  }
};

// ════════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ════════════════════════════════════════════════════════════════

function switchTab(tabName) {
  // Ocultar todos los tabs
  document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.classList.remove('active');
  });

  // Desactivar botones
  document.querySelectorAll('.profile-menu-item').forEach(btn => {
    btn.classList.remove('active');
  });

  // Mostrar tab seleccionado
  const selectedTab = document.getElementById(tabName);
  if (selectedTab) {
    selectedTab.classList.add('active');
  }

  // Activar botón
  event.target.classList.add('active');
}

async function saveProfile() {
  try {
    const fullName = document.getElementById('fullName')?.value;
    const phone = document.getElementById('phone')?.value;
    const country = document.getElementById('country')?.value;
    const birthDate = document.getElementById('birthDate')?.value;

    await ProfileManager.updateProfile({
      nombre: fullName,
      telefono: phone,
      pais: country,
      fecha_nacimiento: birthDate
    });

    alert(' Cambios guardados');
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function changePassword() {
  try {
    const currentPassword = document.getElementById('currentPassword')?.value;
    const newPassword = document.getElementById('newPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;

    if (newPassword !== confirmPassword) {
      throw new Error('Las contraseñas no coinciden');
    }

    if (newPassword.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }

    await ProfileManager.changePassword(newPassword);
    alert(' Contraseña actualizada');

    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function addAddress() {
  const address = prompt('Ingresa tu dirección:');
  if (address) {
    try {
      await ProfileManager.addAddress({
        calle: address,
        ciudad: prompt('Ciudad:'),
        codigo_postal: prompt('Código Postal:')
      });
      alert(' Dirección agregada');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  }
}

async function savePreferences() {
  alert(' Preferencias guardadas');
}

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
}

function logout() {
  if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
    window.location.href = '../index.html';
  }
}

// Cargar perfil al iniciar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    const profile = await ProfileManager.loadProfile();
    if (profile) {
      document.getElementById('user-name').textContent = profile.nombre || 'Usuario';
      document.getElementById('user-email').textContent = profile.email;
    }
  });
} else {
  ProfileManager.loadProfile();
}

window.ProfileManager = ProfileManager;
