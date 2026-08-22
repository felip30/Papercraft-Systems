// supabase/functions/notificar-pedido/index.ts
//
// Edge Function que envía un correo al cliente cuando el estado de su
// pedido cambia (ej. de "pendiente" a "enviado"). Se llama desde
// admin.html justo después de que el admin actualiza el estado de un
// pedido.
//
// Variables de entorno requeridas (se configuran como "secrets" en
// Supabase, NUNCA en el código del frontend):
//   - RESEND_API_KEY      → tu API key de https://resend.com
//   - RESEND_FROM_EMAIL   → remitente verificado en Resend (ej. "PaperCraft <pedidos@tudominio.com>")
// Estas dos ya vienen incluidas automáticamente en toda Edge Function:
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS: sin esto, el navegador bloquea la petición porque tu sitio
// (vercel.app) y esta función (supabase.co) son dominios distintos.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const MENSAJES_POR_ESTADO: Record<string, { asunto: string; titulo: string; texto: string }> = {
  enviado: {
    asunto: '📦 Tu pedido fue enviado',
    titulo: '¡Tu pedido va en camino!',
    texto: 'Tu pedido ya fue despachado y está en camino. Pronto lo tendrás en tus manos.'
  },
  completado: {
    asunto: '✅ Tu pedido fue entregado',
    titulo: '¡Pedido completado!',
    texto: 'Tu pedido fue marcado como entregado. Gracias por comprar en PaperCraft Systems.'
  },
  cancelado: {
    asunto: '❌ Tu pedido fue cancelado',
    titulo: 'Pedido cancelado',
    texto: 'Tu pedido fue cancelado. Si crees que esto es un error, contáctanos.'
  }
};

Deno.serve(async (req) => {
  // El navegador manda esta petición "de prueba" antes de la real, para
  // preguntar si tiene permiso. Hay que responderla explícitamente.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { orderId, newStatus } = await req.json();

    const mensaje = MENSAJES_POR_ESTADO[newStatus];
    // Solo se notifica para estados relevantes para el cliente; cualquier
    // otro cambio (ej. volver a "pendiente") no dispara correo.
    if (!mensaje) {
      return new Response(JSON.stringify({ skipped: true, reason: 'Estado sin plantilla de correo' }), { status: 200, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Trae el pedido y, con su usuario_id, el correo + preferencia de
    // notificación desde la tabla usuarios.
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('id, usuario_id, total')
      .eq('id', orderId)
      .single();

    if (pedidoError || !pedido) {
      return new Response(JSON.stringify({ error: 'Pedido no encontrado' }), { status: 404, headers: corsHeaders });
    }

    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('email, username, notificar_pedidos')
      .eq('id', pedido.usuario_id)
      .single();

    if (usuarioError || !usuario) {
      return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), { status: 404, headers: corsHeaders });
    }

    if (usuario.notificar_pedidos === false) {
      return new Response(JSON.stringify({ skipped: true, reason: 'Usuario desactivó las notificaciones' }), { status: 200, headers: corsHeaders });
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: Deno.env.get('RESEND_FROM_EMAIL'),
        to: usuario.email,
        subject: mensaje.asunto,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color:#0a0e27;">${mensaje.titulo}</h2>
            <p style="color:#333; font-size:15px;">Hola ${usuario.username},</p>
            <p style="color:#333; font-size:15px;">${mensaje.texto}</p>
            <p style="color:#666; font-size:13px; margin-top:20px;">Pedido #${pedido.id} · Total: $${pedido.total}</p>
            <hr style="border:none; border-top:1px solid #eee; margin:20px 0;">
            <p style="color:#999; font-size:12px;">PaperCraft Systems</p>
          </div>
        `
      })
    });

    if (!resendResponse.ok) {
      const errorBody = await resendResponse.text();
      return new Response(JSON.stringify({ error: 'Error al enviar el correo con Resend', detail: errorBody }), { status: 502, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
