/**
 * GESTOR DE DATOS AVANZADO - PaperCraft Systems v3.1
 * Maneja productos, usuarios, juegos, carrito, pedidos y estadísticas
 */

class DataManager {
  constructor() {
    this.products = [];
    this.gameScores = [];
    this.gameCredits = this.initGameCredits();
    this.cart = JSON.parse(localStorage.getItem('papercraft_cart') || '[]');
    this.orders = [];
    this.discounts = [];
    this.vaultGames = [];

    // Las páginas deben esperar este promise (await window.DataManager.ready())
    // antes de usar cualquier getter por primera vez.
    this._readyPromise = this._initAll();

    // Si el usuario inicia o cierra sesión mientras la página ya está
    // cargada (por ejemplo, tras loguearse desde un modal), se refrescan
    // los datos que dependen de quién está logueado.
    window.addEventListener('userLoggedIn', () => {
      this.loadOrdersFromSupabase();
      this.loadGameScoresFromSupabase();
      this.loadDiscountsFromSupabase();
    });
    window.addEventListener('userLoggedOut', () => {
      this.orders = [];
      this.gameScores = [];
      this.discounts = [];
    });
  }

  async ready() {
    return this._readyPromise;
  }

  async _initAll() {
    // El catálogo y Vault Gamer son públicos: se cargan siempre, con o
    // sin sesión.
    await Promise.all([
      this.loadProductsFromSupabase(),
      this.loadVaultGamesFromSupabase()
    ]);

    // Pedidos, puntajes y descuentos son personales — solo tiene sentido
    // traerlos si hay sesión iniciada, y hay que esperar a que
    // AuthManager termine de resolverla primero (si no, Supabase los
    // trataría como si nadie hubiera iniciado sesión todavía).
    if (window.AuthManager && window.AuthManager.ready) {
      await window.AuthManager.ready();
    }

    if (window.AuthManager && window.AuthManager.isAuthenticated) {
      await Promise.all([
        this.loadOrdersFromSupabase(),
        this.loadGameScoresFromSupabase(),
        this.loadDiscountsFromSupabase()
      ]);
    }
  }

  // ======================================
  // GESTIÓN DE PRODUCTOS (Supabase, tabla "productos")
  // ======================================

  // respaldo si falla la carga desde Supabase, para no dejar la tienda vacía
  _getFallbackProducts() {
    return [
      // PAPELERÍA
      {
        id: 1,
        nombre: 'Cuaderno Premium A4',
        categoria: 'papelería',
        precio: 52000,
        stock: 45,
        originalStock: 45,
        icon: 'notebook',
        description: 'Cuaderno premium con 200 hojas rayadas',
        status: 'activo'
      },
      {
        id: 2,
        nombre: 'Agenda 2024',
        categoria: 'papelería',
        precio: 76000,
        stock: 20,
        originalStock: 20,
        icon: 'book',
        description: 'Agenda ejecutiva con diseño moderno',
        status: 'activo'
      },
      {
        id: 3,
        nombre: 'Set de Colores 48pc',
        categoria: 'papelería',
        precio: 104000,
        stock: 30,
        originalStock: 30,
        icon: 'palette',
        description: 'Set profesional de 48 colores',
        status: 'activo'
      },
      {
        id: 4,
        nombre: 'Resma Papel Blanco',
        categoria: 'papelería',
        precio: 36000,
        stock: 100,
        originalStock: 100,
        icon: 'document',
        description: 'Resma de 500 hojas A4 80gsm',
        status: 'activo'
      },

      // TECNOLOGÍA
      {
        id: 5,
        nombre: 'Teclado Mecánico RGB',
        categoria: 'tecnología',
        precio: 360000,
        stock: 3, // Bajo stock
        originalStock: 15,
        icon: 'gamepad',
        description: 'Teclado mecánico RGB con switches Outemu',
        status: 'activo'
      },
      {
        id: 6,
        nombre: 'Mouse Inalámbrico Pro',
        categoria: 'tecnología',
        precio: 144000,
        stock: 25,
        originalStock: 25,
        icon: 'target',
        description: 'Mouse ergonómico inalámbrico 2.4GHz',
        status: 'activo'
      },
      {
        id: 7,
        nombre: 'Headphones Bluetooth',
        categoria: 'tecnología',
        precio: 240000,
        stock: 18,
        originalStock: 18,
        icon: 'bell',
        description: 'Headphones con cancelación de ruido',
        status: 'activo'
      },
      {
        id: 8,
        nombre: 'Soporte Teléfono Ajustable',
        categoria: 'tecnología',
        precio: 64000,
        stock: 50,
        originalStock: 50,
        icon: 'package',
        description: 'Soporte aluminio ajustable para celular/tablet',
        status: 'activo'
      }
    ];
  }

  saveProducts() {
    // Ya no se usa (los productos viven en Supabase). Se deja como no-op
    // por si algún código viejo todavía la llama.
    window.dispatchEvent(new Event('productsUpdated'));
  }

  async loadProductsFromSupabase() {
    const { data, error } = await window.supabaseClient
      .from('productos')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error al cargar productos desde Supabase, usando datos de respaldo:', error.message);
      this.products = this._getFallbackProducts();
      return;
    }

    // Traduce snake_case (Supabase) a los mismos nombres que ya usa toda
    // la interfaz (camelCase), para no tener que tocar el resto del sitio.
    this.products = data.map(p => ({
      id: p.id,
      nombre: p.nombre,
      categoria: p.categoria,
      precio: p.precio,
      stock: p.stock,
      originalStock: p.original_stock,
      icon: p.icon,
      imagen: p.imagen || '',
      description: p.description,
      status: p.status
    }));

    window.dispatchEvent(new Event('productsUpdated'));
  }

  getProducts() {
    return this.products;
  }

  getProductById(id) {
    return this.products.find(p => p.id === id);
  }

  getProductsByCategory(category) {
    return this.products.filter(p => p.categoria === category && p.status === 'activo');
  }

  // Productos con bajo stock (≤ 5)
  getLowStockProducts() {
    return this.products.filter(p => p.stock <= 5 && p.status === 'activo');
  }

  async addProduct(product) {
    if (!product.nombre || !product.precio || !product.categoria) {
      throw new Error('Faltan datos requeridos del producto');
    }

    const stock = parseInt(product.stock) || 0;
    const { data, error } = await window.supabaseClient
      .from('productos')
      .insert({
        nombre: product.nombre,
        categoria: product.categoria,
        precio: parseFloat(product.precio),
        stock,
        original_stock: stock,
        icon: product.icon || 'package',
        imagen: product.imagen || '',
        description: product.description || '',
        status: 'activo'
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    const newProduct = {
      id: data.id,
      nombre: data.nombre,
      categoria: data.categoria,
      precio: data.precio,
      stock: data.stock,
      originalStock: data.original_stock,
      icon: data.icon,
      imagen: data.imagen || '',
      description: data.description,
      status: data.status
    };

    this.products.push(newProduct);
    window.dispatchEvent(new Event('productsUpdated'));
    return newProduct;
  }

  async updateProduct(id, updates) {
    const product = this.getProductById(id);
    if (!product) return null;

    const supabaseUpdates = {};
    if (updates.nombre !== undefined) supabaseUpdates.nombre = updates.nombre;
    if (updates.categoria !== undefined) supabaseUpdates.categoria = updates.categoria;
    if (updates.precio !== undefined) supabaseUpdates.precio = parseFloat(updates.precio);
    if (updates.stock !== undefined) supabaseUpdates.stock = parseInt(updates.stock);
    if (updates.icon !== undefined) supabaseUpdates.icon = updates.icon;
    if (updates.imagen !== undefined) supabaseUpdates.imagen = updates.imagen;
    if (updates.description !== undefined) supabaseUpdates.description = updates.description;
    if (updates.status !== undefined) supabaseUpdates.status = updates.status;
    supabaseUpdates.updated_at = new Date().toISOString();

    const { data, error } = await window.supabaseClient
      .from('productos')
      .update(supabaseUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar producto:', error.message);
      return null;
    }

    Object.assign(product, {
      nombre: data.nombre,
      categoria: data.categoria,
      precio: data.precio,
      stock: data.stock,
      originalStock: data.original_stock,
      icon: data.icon,
      imagen: data.imagen || '',
      description: data.description,
      status: data.status
    });

    window.dispatchEvent(new Event('productsUpdated'));
    return product;
  }

  async deleteProduct(id) {
    const { error } = await window.supabaseClient.from('productos').delete().eq('id', id);
    if (error) {
      console.error('Error al eliminar producto:', error.message);
      return false;
    }

    const index = this.products.findIndex(p => p.id === id);
    if (index > -1) this.products.splice(index, 1);
    window.dispatchEvent(new Event('productsUpdated'));
    return true;
  }

  async toggleProductStatus(id) {
    const product = this.getProductById(id);
    if (!product) return null;
    const nuevoStatus = product.status === 'activo' ? 'inactivo' : 'activo';
    return this.updateProduct(id, { status: nuevoStatus });
  }

  // ======================================
  // GESTIÓN DE PEDIDOS/ÓRDENES
  // ======================================

  async loadOrdersFromSupabase() {
    const auth = window.AuthManager;
    if (!auth || !auth.isAuthenticated) {
      this.orders = [];
      return;
    }

    // Un cliente solo puede ver los suyos (RLS); un admin ve todos los
    // pedidos automáticamente, sin tener que pedirlo distinto.
    const { data, error } = await window.supabaseClient
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar pedidos desde Supabase:', error.message);
      this.orders = [];
      return;
    }

    this.orders = data.map(o => ({
      id: o.id,
      userId: o.usuario_id,
      userName: o.usuario_nombre,
      items: o.items,
      subtotal: o.subtotal,
      tax: o.iva,
      shipping: o.envio,
      discount: o.descuento,
      total: o.total,
      status: o.status,
      paymentMethod: o.metodo_pago || 'tarjeta',
      date: o.created_at,
      updatedAt: o.updated_at,
      timestamp: new Date(o.created_at).getTime()
    }));

    window.dispatchEvent(new Event('ordersUpdated'));
  }

  async createOrder(userId, userName, items, total, discountApplied = 0, metodoPago = 'tarjeta') {
    const itemsFormateados = items.map(i => ({
      productId: i.id,
      name: i.nombre,
      price: i.precio,
      quantity: i.quantity
    }));

    const totals = this.getCartTotal();

    const { data, error } = await window.supabaseClient
      .from('pedidos')
      .insert({
        usuario_id: userId,
        usuario_nombre: userName,
        items: itemsFormateados,
        subtotal: totals.subtotal,
        iva: totals.iva,
        envio: totals.envio,
        descuento: discountApplied,
        total: total,
        status: 'pendiente',
        metodo_pago: metodoPago
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear pedido:', error.message);
      throw new Error(error.message);
    }

    const order = {
      id: data.id,
      userId: data.usuario_id,
      userName: data.usuario_nombre,
      items: data.items,
      subtotal: data.subtotal,
      tax: data.iva,
      shipping: data.envio,
      discount: data.descuento,
      total: data.total,
      status: data.status,
      paymentMethod: data.metodo_pago || 'tarjeta',
      date: data.created_at,
      updatedAt: data.updated_at,
      timestamp: new Date(data.created_at).getTime()
    };

    // Descuenta el stock de cada producto apenas se registra el pedido
    // (sin importar el método de pago), para que el inventario refleje de
    // inmediato lo que ya está comprometido.
    try {
      await this.adjustStockForItems(itemsFormateados, -1);
    } catch (stockError) {
      console.error('El pedido se creó, pero hubo un problema al descontar el stock:', stockError.message);
    }

    this.orders.unshift(order);
    window.dispatchEvent(new Event('ordersUpdated'));
    return order;
  }

  // direction: -1 al crear pedido, +1 al cancelar
  async adjustStockForItems(items, direction) {
    for (const item of items) {
      const product = this.getProductById(item.productId);
      if (!product) continue;

      const nuevoStock = Math.max(0, product.stock + (direction * item.quantity));

      const { data, error } = await window.supabaseClient
        .from('productos')
        .update({ stock: nuevoStock, updated_at: new Date().toISOString() })
        .eq('id', item.productId)
        .select()
        .single();

      if (error) {
        console.error(`Error al ajustar stock del producto ${item.productId}:`, error.message);
        continue;
      }

      product.stock = data.stock;
    }
    window.dispatchEvent(new Event('productsUpdated'));
  }

  getOrders() {
    return this.orders;
  }

  getOrdersByUser(userId) {
    return this.orders.filter(o => o.userId === userId);
  }

  getOrderById(orderId) {
    return this.orders.find(o => o.id === orderId);
  }

  async updateOrderStatus(orderId, newStatus) {
    const order = this.getOrderById(orderId);
    const oldStatus = order ? order.status : null;

    const { data, error } = await window.supabaseClient
      .from('pedidos')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar estado del pedido:', error.message);
      throw new Error(error.message);
    }

    if (order) {
      order.status = data.status;
      order.updatedAt = data.updated_at;
    }

    // Si se cancela un pedido que no estaba cancelado, se devuelve al
    // inventario el stock que tenía reservado. Si se revierte una
    // cancelación (se cambia de "cancelado" a otro estado), se vuelve a
    // descontar, para que el stock quede siempre correcto.
    try {
      if (newStatus === 'cancelado' && oldStatus !== 'cancelado') {
        await this.adjustStockForItems(data.items, 1);
      } else if (oldStatus === 'cancelado' && newStatus !== 'cancelado') {
        await this.adjustStockForItems(data.items, -1);
      }
    } catch (stockError) {
      console.error('El estado del pedido se actualizó, pero hubo un problema al ajustar el stock:', stockError.message);
    }

    window.dispatchEvent(new Event('ordersUpdated'));
    return order;
  }

  // borra el pedido de verdad (no solo cambia estado) - usado en admin para limpiar cancelaciones
  async deleteOrder(orderId) {
    const { error } = await window.supabaseClient
      .from('pedidos')
      .delete()
      .eq('id', orderId);

    if (error) {
      console.error('Error al eliminar el pedido:', error.message);
      throw new Error(error.message);
    }

    this.orders = this.orders.filter(o => o.id !== orderId);
    window.dispatchEvent(new Event('ordersUpdated'));
    return true;
  }

  getOrderStats() {
    const stats = {
      totalOrders: this.orders.length,
      completedOrders: this.orders.filter(o => o.status === 'completado').length,
      totalRevenue: 0,
      avgOrderValue: 0,
      statusBreakdown: {
        pendiente: 0,
        enviado: 0,
        completado: 0,
        cancelado: 0
      }
    };

    this.orders.forEach(order => {
      stats.statusBreakdown[order.status]++;
      if (order.status === 'completado') {
        stats.totalRevenue += order.total;
      }
    });

    stats.avgOrderValue = stats.completedOrders > 0 
      ? Math.round(stats.totalRevenue / stats.completedOrders)
      : 0;

    stats.totalRevenue = Math.round(stats.totalRevenue);

    return stats;
  }

  // ======================================
  // GESTIÓN DE PUNTAJES DE JUEGOS
  // ======================================

  async loadGameScoresFromSupabase() {
    const auth = window.AuthManager;
    if (!auth || !auth.isAuthenticated) {
      this.gameScores = [];
      return;
    }

    const { data, error } = await window.supabaseClient
      .from('game_scores')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar puntajes desde Supabase:', error.message);
      this.gameScores = [];
      return;
    }

    this.gameScores = data.map(s => ({
      id: s.id,
      userId: s.usuario_id,
      userName: s.usuario_nombre,
      game: s.game,
      score: s.score,
      prize: s.prize,
      date: s.created_at,
      timestamp: new Date(s.created_at).getTime()
    }));

    window.dispatchEvent(new Event('gameScoresUpdated'));
  }

  async recordGameScore(userId, userName, gameName, score, prize) {
    const { data, error } = await window.supabaseClient
      .from('game_scores')
      .insert({
        usuario_id: userId,
        usuario_nombre: userName,
        game: gameName,
        score: String(score),
        prize: String(prize)
      })
      .select()
      .single();

    if (error) {
      console.error('Error al registrar puntaje:', error.message);
      throw new Error(error.message);
    }

    const gameScore = {
      id: data.id,
      userId: data.usuario_id,
      userName: data.usuario_nombre,
      game: data.game,
      score: data.score,
      prize: data.prize,
      date: data.created_at,
      timestamp: new Date(data.created_at).getTime()
    };

    this.gameScores.unshift(gameScore);
    window.dispatchEvent(new Event('gameScoresUpdated'));
    return gameScore;
  }

  getGameScores() {
    return this.gameScores;
  }

  getGameScoresByUser(userId) {
    return this.gameScores.filter(s => s.userId === userId);
  }

  getGameScoresByGame(gameName) {
    return this.gameScores.filter(s => s.game === gameName);
  }

  getGameStatistics() {
    const stats = {
      totalGames: this.gameScores.length,
      gameBreakdown: {},
      averageScore: 0,
      totalPrizeValue: 0,
      topPlayers: []
    };

    if (this.gameScores.length === 0) {
      return stats;
    }

    // Desglose por juego
    this.gameScores.forEach(score => {
      if (!stats.gameBreakdown[score.game]) {
        stats.gameBreakdown[score.game] = 0;
      }
      stats.gameBreakdown[score.game]++;
    });

    // Promedio de puntos
    stats.averageScore = (this.gameScores.reduce((sum, s) => sum + (parseFloat(s.score) || 0), 0) / this.gameScores.length).toFixed(2);

    // Total de premios
    stats.totalPrizeValue = this.gameScores.reduce((sum, s) => sum + (parseFloat(s.prize) || 0), 0).toFixed(2);

    // Top jugadores
    const playerScores = {};
    this.gameScores.forEach(score => {
      if (!playerScores[score.userName]) {
        playerScores[score.userName] = { count: 0, totalScore: 0, totalPrize: 0 };
      }
      playerScores[score.userName].count++;
      playerScores[score.userName].totalScore += parseFloat(score.score) || 0;
      playerScores[score.userName].totalPrize += parseFloat(score.prize) || 0;
    });

    stats.topPlayers = Object.entries(playerScores)
      .map(([name, data]) => ({
        name,
        games: data.count,
        avgScore: (data.totalScore / data.count).toFixed(2),
        totalPrize: data.totalPrize.toFixed(2)
      }))
      .sort((a, b) => b.games - a.games)
      .slice(0, 5);

    return stats;
  }

  // ======================================
  // GESTIÓN DE CRÉDITOS DE JUEGOS
  // ======================================

  initGameCredits() {
    const saved = localStorage.getItem('papercraft_game_credits');
    if (saved) return JSON.parse(saved);

    return {
      ruleta: { name: 'Ruleta de Descuentos', minPrize: 5, maxPrize: 50, prizeUnit: '%' },
      memoria: { name: 'Juego de Memoria', minPrize: 50, maxPrize: 300, prizeUnit: 'créditos' }
    };
  }

  saveGameCredits() {
    localStorage.setItem('papercraft_game_credits', JSON.stringify(this.gameCredits));
  }

  updateGameCredit(game, updates) {
    if (this.gameCredits[game]) {
      Object.assign(this.gameCredits[game], updates);
      this.saveGameCredits();
      return this.gameCredits[game];
    }
    return null;
  }

  // ======================================
  // DESCUENTOS GANADOS EN JUEGOS
  // premios de la Ruleta, usados en carrito/checkout/perfil
  // ======================================

  async loadDiscountsFromSupabase() {
    const auth = window.AuthManager;
    if (!auth || !auth.isAuthenticated) {
      this.discounts = [];
      return;
    }

    const { data, error } = await window.supabaseClient
      .from('descuentos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar descuentos desde Supabase:', error.message);
      this.discounts = [];
      return;
    }

    this.discounts = data.map(d => ({
      id: d.id,
      userId: d.usuario_id,
      code: d.code,
      percentage: d.percentage,
      source: d.source,
      used: d.used,
      date: d.created_at,
      expiresAt: d.expires_at
    }));

    window.dispatchEvent(new Event('discountsUpdated'));
  }

  /**
   * Registra un descuento ganado por el usuario (ej. premio de la Ruleta)
   * y genera un código canjeable en el carrito.
   */
  async addUserDiscount(userId, percentage, source = 'ruleta') {
    const code = `${source.toUpperCase()}-${Date.now().toString(36).toUpperCase().slice(-5)}`;

    const { data, error } = await window.supabaseClient
      .from('descuentos')
      .insert({
        usuario_id: userId,
        code,
        percentage,
        source,
        used: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error al crear descuento:', error.message);
      throw new Error(error.message);
    }

    const discount = {
      id: data.id,
      userId: data.usuario_id,
      code: data.code,
      percentage: data.percentage,
      source: data.source,
      used: data.used,
      date: data.created_at,
      expiresAt: data.expires_at
    };

    this.discounts.unshift(discount);
    window.dispatchEvent(new Event('discountsUpdated'));
    return discount;
  }

  getUserDiscounts(userId) {
    return this.discounts.filter(d => d.userId === userId);
  }

  // para admin: RLS ya le deja ver los de todos, no solo los propios
  getAllDiscounts() {
    return this.discounts;
  }

  isDiscountExpired(discount) {
    return !!discount.expiresAt && new Date(discount.expiresAt) < new Date();
  }

  // sin usar y sin vencer (los vencidos quedan en el historial nomás)
  getActiveUserDiscounts(userId) {
    return this.getUserDiscounts(userId).filter(d => !d.used && !this.isDiscountExpired(d));
  }

  findDiscountByCode(userId, code) {
    return this.getUserDiscounts(userId).find(d => d.code === code.toUpperCase() && !d.used && !this.isDiscountExpired(d));
  }

  // busca sin filtrar por vencido/usado, para poder distinguir el mensaje de error
  findAnyDiscountByCode(userId, code) {
    return this.getUserDiscounts(userId).find(d => d.code === code.toUpperCase());
  }

  async markDiscountUsed(discountId) {
    const { data, error } = await window.supabaseClient
      .from('descuentos')
      .update({ used: true })
      .eq('id', discountId)
      .select()
      .single();

    if (error) {
      console.error('Error al marcar descuento como usado:', error.message);
      return null;
    }

    const discount = this.discounts.find(d => d.id === discountId);
    if (discount) discount.used = true;
    window.dispatchEvent(new Event('discountsUpdated'));
    return discount || data;
  }

  // ======================================
  // VAULT GAMER
  // Vault Gamer: blog de guías, público con o sin sesión
  // Solo se puede agregar/editar/eliminar desde el Panel Admin.
  // ======================================

  async loadVaultGamesFromSupabase() {
    const { data, error } = await window.supabaseClient
      .from('vault_games')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error al cargar Vault Gamer desde Supabase:', error.message);
      this.vaultGames = [];
      return;
    }

    this.vaultGames = data.map(g => ({
      id: g.id,
      titulo: g.titulo,
      estudio: g.estudio || '',
      categoria: g.categoria || '',
      icon: g.icon || 'gamepad',
      color: g.color || '#00D9FF',
      imagen: g.imagen || '',
      resumen: g.resumen || '',
      descripcionDetallada: g.descripcion_detallada || '',
      tutorial: g.tutorial || []
    }));

    window.dispatchEvent(new Event('vaultGamesUpdated'));
  }

  getVaultGames() {
    return this.vaultGames;
  }

  getVaultGameById(id) {
    return this.vaultGames.find(g => g.id === parseInt(id));
  }

  async addVaultGame(game) {
    const { data, error } = await window.supabaseClient
      .from('vault_games')
      .insert({
        titulo: game.titulo,
        estudio: game.estudio || '',
        categoria: game.categoria || '',
        icon: game.icon || 'gamepad',
        color: game.color || '#00D9FF',
        imagen: game.imagen || '',
        resumen: game.resumen || '',
        descripcion_detallada: game.descripcionDetallada || '',
        tutorial: game.tutorial || []
      })
      .select()
      .single();

    if (error) {
      console.error('Error al agregar juego a Vault Gamer:', error.message);
      throw new Error(error.message);
    }

    const newGame = {
      id: data.id,
      titulo: data.titulo,
      estudio: data.estudio || '',
      categoria: data.categoria || '',
      icon: data.icon || 'gamepad',
      color: data.color || '#00D9FF',
      imagen: data.imagen || '',
      resumen: data.resumen || '',
      descripcionDetallada: data.descripcion_detallada || '',
      tutorial: data.tutorial || []
    };

    this.vaultGames.push(newGame);
    window.dispatchEvent(new Event('vaultGamesUpdated'));
    return newGame;
  }

  async updateVaultGame(id, updates) {
    const payload = {};
    if (updates.titulo !== undefined) payload.titulo = updates.titulo;
    if (updates.estudio !== undefined) payload.estudio = updates.estudio;
    if (updates.categoria !== undefined) payload.categoria = updates.categoria;
    if (updates.icon !== undefined) payload.icon = updates.icon;
    if (updates.color !== undefined) payload.color = updates.color;
    if (updates.imagen !== undefined) payload.imagen = updates.imagen;
    if (updates.resumen !== undefined) payload.resumen = updates.resumen;
    if (updates.descripcionDetallada !== undefined) payload.descripcion_detallada = updates.descripcionDetallada;
    if (updates.tutorial !== undefined) payload.tutorial = updates.tutorial;
    payload.updated_at = new Date().toISOString();

    const { data, error } = await window.supabaseClient
      .from('vault_games')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar juego de Vault Gamer:', error.message);
      throw new Error(error.message);
    }

    const game = this.getVaultGameById(id);
    if (game) {
      Object.assign(game, {
        titulo: data.titulo,
        estudio: data.estudio || '',
        categoria: data.categoria || '',
        icon: data.icon || 'gamepad',
        color: data.color || '#00D9FF',
        imagen: data.imagen || '',
        resumen: data.resumen || '',
        descripcionDetallada: data.descripcion_detallada || '',
        tutorial: data.tutorial || []
      });
    }
    window.dispatchEvent(new Event('vaultGamesUpdated'));
    return game;
  }

  async deleteVaultGame(id) {
    const { error } = await window.supabaseClient
      .from('vault_games')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar juego de Vault Gamer:', error.message);
      throw new Error(error.message);
    }

    this.vaultGames = this.vaultGames.filter(g => g.id !== parseInt(id));
    window.dispatchEvent(new Event('vaultGamesUpdated'));
  }

  // ======================================
  // GESTIÓN DE CARRITO
  // ======================================

  addToCart(product) {
    const existingItem = this.cart.find(item => item.id === product.id);
    const currentQty = existingItem ? existingItem.quantity : 0;

    if (currentQty + 1 > product.stock) {
      return { success: false, message: `Solo hay ${product.stock} unidades disponibles de "${product.nombre}"` };
    }

    if (existingItem) {
      existingItem.quantity++;
    } else {
      this.cart.push({ ...product, quantity: 1 });
    }
    this.saveCart();
    return { success: true };
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(item => item.id !== productId);
    this.saveCart();
    return true;
  }

  updateCartQuantity(productId, quantity) {
    const item = this.cart.find(item => item.id === productId);
    if (!item) return { success: false, message: 'Producto no encontrado en el carrito' };

    const product = this.getProductById(productId);
    const maxStock = product ? product.stock : item.quantity;
    const solicitada = Math.max(1, parseInt(quantity) || 1);

    if (solicitada > maxStock) {
      item.quantity = maxStock;
      this.saveCart();
      return { success: false, message: `Solo hay ${maxStock} unidades disponibles`, quantity: maxStock };
    }

    item.quantity = solicitada;
    this.saveCart();
    return { success: true, quantity: solicitada };
  }

  clearCart() {
    this.cart = [];
    this.saveCart();
    return true;
  }

  saveCart() {
    localStorage.setItem('papercraft_cart', JSON.stringify(this.cart));
    window.dispatchEvent(new Event('cartUpdated'));
  }

  getCart() {
    return this.cart;
  }

  getCartTotal() {
    const subtotal = this.cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
    const iva = subtotal * 0.19; // IVA vigente en Colombia (19% general, sin cambios en 2025-2026)
    // "Recoger en tienda" (elegido en el carrito) exime el costo de envío
    const recogeEnTienda = localStorage.getItem('papercraft_recoger_tienda') === 'true';
    const envio = (!recogeEnTienda && this.cart.length > 0) ? 15000 : 0; // envío nacional plano en COP
    return {
      subtotal: Math.round(subtotal),
      iva: Math.round(iva),
      envio,
      total: Math.round(subtotal + iva + envio)
    };
  }

  // ======================================
  // ESTADÍSTICAS GLOBALES
  // ======================================

  async getGlobalStats() {
    const allUsers = await window.AuthManager.getAllUsers();
    const stats = {
      totalUsers: allUsers.length,
      totalProducts: this.products.filter(p => p.status === 'activo').length,
      lowStockProducts: this.getLowStockProducts().length,
      totalOrders: this.orders.length,
      totalRevenue: 0,
      totalGamesPlayed: this.gameScores.length
    };

    const completedOrders = this.orders.filter(o => o.status === 'completado');
    stats.totalRevenue = Math.round(completedOrders.reduce((sum, o) => sum + o.total, 0));

    return stats;
  }

  // ======================================
  // REDES SOCIALES (Instagram, WhatsApp, correo, teléfono, etc.)
  // Lista flexible de contactos, visible en el footer del sitio y
  // editable desde el Panel Admin → pestaña "Redes".
  // ======================================

  async getRedesSociales() {
    const { data, error } = await window.supabaseClient
      .from('redes_sociales')
      .select('*')
      .order('orden', { ascending: true });

    if (error) {
      console.error('Error al cargar redes sociales:', error.message);
      return [];
    }

    return data;
  }

  async addRedSocial(tipo, valor, etiqueta = '') {
    const { data, error } = await window.supabaseClient
      .from('redes_sociales')
      .insert({ tipo, valor, etiqueta: etiqueta || null, orden: Date.now() })
      .select()
      .single();

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, data };
  }

  async deleteRedSocial(id) {
    const { error } = await window.supabaseClient
      .from('redes_sociales')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true };
  }
}

// Global instance
window.DataManager = new DataManager();

