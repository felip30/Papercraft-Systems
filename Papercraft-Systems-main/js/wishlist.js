/**
 * WISHLIST MANAGER
 * Gestión de lista de productos favoritos
 */

const WishlistManager = {
  storageKey: 'papercraft_wishlist',

  // ════════════════════════════════════════════════════════════════
  // OBTENER WISHLIST
  // ════════════════════════════════════════════════════════════════

  getWishlist() {
    try {
      const wishlist = localStorage.getItem(this.storageKey);
      return wishlist ? JSON.parse(wishlist) : [];
    } catch (error) {
      console.error('Error al obtener wishlist:', error);
      return [];
    }
  },

  // ════════════════════════════════════════════════════════════════
  // AGREGAR A WISHLIST
  // ════════════════════════════════════════════════════════════════

  addToWishlist(product) {
    try {
      const wishlist = this.getWishlist();
      
      // Verificar si ya existe
      if (wishlist.some(item => item.id === product.id)) {
        console.log(' Producto ya en wishlist');
        return false;
      }

      // Agregar producto
      wishlist.push({
        ...product,
        addedAt: new Date().toISOString()
      });

      localStorage.setItem(this.storageKey, JSON.stringify(wishlist));
      console.log(' Producto agregado a wishlist');
      return true;
    } catch (error) {
      console.error('Error al agregar a wishlist:', error);
      return false;
    }
  },

  // ════════════════════════════════════════════════════════════════
  // ELIMINAR DE WISHLIST
  // ════════════════════════════════════════════════════════════════

  removeFromWishlist(productId) {
    try {
      let wishlist = this.getWishlist();
      wishlist = wishlist.filter(item => item.id !== productId);
      localStorage.setItem(this.storageKey, JSON.stringify(wishlist));
      console.log(' Producto eliminado de wishlist');
      return true;
    } catch (error) {
      console.error('Error al eliminar de wishlist:', error);
      return false;
    }
  },

  // ════════════════════════════════════════════════════════════════
  // VERIFICAR SI ESTÁ EN WISHLIST
  // ════════════════════════════════════════════════════════════════

  isInWishlist(productId) {
    const wishlist = this.getWishlist();
    return wishlist.some(item => item.id === productId);
  },

  // ════════════════════════════════════════════════════════════════
  // LIMPIAR WISHLIST
  // ════════════════════════════════════════════════════════════════

  clearWishlist() {
    try {
      localStorage.removeItem(this.storageKey);
      console.log(' Wishlist limpiada');
      return true;
    } catch (error) {
      console.error('Error al limpiar wishlist:', error);
      return false;
    }
  },

  // ════════════════════════════════════════════════════════════════
  // CONTAR ITEMS
  // ════════════════════════════════════════════════════════════════

  getWishlistCount() {
    return this.getWishlist().length;
  },

  // ════════════════════════════════════════════════════════════════
  // CALCULAR VALOR TOTAL
  // ════════════════════════════════════════════════════════════════

  getWishlistValue() {
    const wishlist = this.getWishlist();
    return wishlist.reduce((total, item) => total + (item.precio || 0), 0);
  },

  // ════════════════════════════════════════════════════════════════
  // CALCULAR AHORROS CON DESCUENTOS
  // ════════════════════════════════════════════════════════════════

  getWishlistSavings() {
    const wishlist = this.getWishlist();
    return wishlist.reduce((total, item) => {
      const originalPrice = item.precioOriginal || item.precio;
      const discount = originalPrice - item.precio;
      return total + (discount > 0 ? discount : 0);
    }, 0);
  },

  // ════════════════════════════════════════════════════════════════
  // EXPORTAR WISHLIST
  // ════════════════════════════════════════════════════════════════

  exportWishlist() {
    const wishlist = this.getWishlist();
    const csv = [
      ['ID', 'Producto', 'Precio', 'Categoría', 'Agregado'],
      ...wishlist.map(item => [
        item.id,
        item.nombre,
        item.precio,
        item.categoria,
        item.addedAt
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wishlist.csv';
    link.click();
  },

  // ════════════════════════════════════════════════════════════════
  // COMPARTIR WISHLIST
  // ════════════════════════════════════════════════════════════════

  shareWishlist() {
    const wishlist = this.getWishlist();
    const items = wishlist.map(item => `${item.nombre} (${item.precio})`).join(', ');
    const text = `Mi lista de favoritos en PaperCraft: ${items}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Mi Wishlist',
        text: text
      });
    } else {
      // Fallback
      const url = `mailto:?subject=Mi Wishlist&body=${encodeURIComponent(text)}`;
      window.location.href = url;
    }
  },

  // ════════════════════════════════════════════════════════════════
  // AGREGAR TODOS A CARRITO
  // ════════════════════════════════════════════════════════════════

  addAllToCart() {
    const wishlist = this.getWishlist();
    wishlist.forEach(item => {
      if (window.CartManager) {
        window.CartManager.addToCart(item);
      }
    });
    console.log(' Todos los productos agregados al carrito');
  },

  // ════════════════════════════════════════════════════════════════
  // BUSCAR EN WISHLIST
  // ════════════════════════════════════════════════════════════════

  searchWishlist(query) {
    const wishlist = this.getWishlist();
    return wishlist.filter(item => 
      item.nombre.toLowerCase().includes(query.toLowerCase()) ||
      item.categoria.toLowerCase().includes(query.toLowerCase())
    );
  },

  // ════════════════════════════════════════════════════════════════
  // SINCRONIZAR CON SUPABASE
  // ════════════════════════════════════════════════════════════════

  async syncWithSupabase() {
    try {
      if (!supabase) {
        console.log('Supabase no disponible');
        return;
      }

      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;

      const wishlist = this.getWishlist();

      // Guardar en base de datos
      const { error } = await supabase
        .from('wishlist')
        .upsert({
          usuario_id: userId,
          productos: wishlist,
          updated_at: new Date()
        }, {
          onConflict: 'usuario_id'
        });

      if (error) throw error;
      console.log(' Wishlist sincronizada');
    } catch (error) {
      console.error('Error al sincronizar wishlist:', error);
    }
  }
};

// Exportar
window.WishlistManager = WishlistManager;
