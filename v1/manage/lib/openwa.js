// OpenWA Integration Engine for Aesthetic Ways
// Production-grade WhatsApp Multi-Session Gateway Client

const GATEWAY_BASE = process.env.WHATSAPP_GATEWAY_URL || 'http://187.127.188.196:2785';
const API_KEY = process.env.WHATSAPP_API_KEY || 'owa_k1_9f1e422cf9e9ff5956c4c31b1e6c35d9299bef35545a99fde64f67b7b1370046';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY,
});

/**
 * Cleans phone number to standard format with country code (91)
 */
export function cleanPhoneNumber(phone) {
  let cleaned = String(phone || '').replace(/\D/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
}

/**
 * Formats a phone number into WhatsApp chatId
 */
export function toChatId(phone) {
  const cleaned = cleanPhoneNumber(phone);
  if (cleaned.endsWith('@c.us') || cleaned.endsWith('@g.us')) {
    return cleaned;
  }
  return `${cleaned}@c.us`;
}

/**
 * List all sessions on OpenWA
 */
export async function listSessions() {
  try {
    const res = await fetch(`${GATEWAY_BASE}/api/sessions`, {
      headers: getHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) {
      console.warn(`[OpenWA] Failed to list sessions (${res.status}): ${await res.text()}`);
      return [];
    }
    return await res.json();
  } catch (err) {
    console.error('[OpenWA listSessions Error]:', err.message);
    return [];
  }
}

/**
 * Finds an existing session or provisions a new one on OpenWA
 */
export async function getOrCreateSession(clientId = 'aesthetx-main') {
  const cleanId = String(clientId || 'aesthetx-main').trim().replace(/[^a-zA-Z0-9-]/g, '') || 'aesthetx-main';
  const sessions = await listSessions();

  // Match by id, name, or phone
  let session = sessions.find(
    (s) => s.id === cleanId || s.name === cleanId || s.phone === cleanId || s.phone === cleanPhoneNumber(cleanId)
  );

  if (!session) {
    // If not found and a session already exists, default to the first active/ready or created one
    if (sessions.length > 0) {
      session = sessions.find(s => s.status === 'ready') || sessions.find(s => s.status === 'qr_ready') || sessions[0];
    }
  }

  // If still no session, create one
  if (!session) {
    try {
      const createRes = await fetch(`${GATEWAY_BASE}/api/sessions`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name: cleanId.length >= 3 ? cleanId : 'aesthetx-main',
        }),
      });
      if (createRes.ok) {
        session = await createRes.json();
      } else {
        const errText = await createRes.text();
        console.warn(`[OpenWA createSession Warning]: ${errText}`);
      }
    } catch (e) {
      console.error('[OpenWA createSession Error]:', e.message);
    }
  }

  // Start the session engine if it's currently created or stopped
  if (session && (session.status === 'created' || session.status === 'stopped')) {
    try {
      const startRes = await fetch(`${GATEWAY_BASE}/api/sessions/${session.id}/start`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (startRes.ok) {
        session = await startRes.json();
      }
    } catch (e) {
      console.warn(`[OpenWA startSession Warning]: ${e.message}`);
    }
  }

  return session;
}

/**
 * Returns unified connection status matching Aesthetic Ways UI
 */
export async function getOpenWAStatus(clientId) {
  try {
    const session = await getOrCreateSession(clientId);
    if (!session) {
      return {
        success: true,
        state: 'DISCONNECTED',
        authenticated: false,
        clientInfo: null,
        qrCodeAvailable: false,
        qrBase64: null,
        clientId,
      };
    }

    if (session.status === 'ready') {
      return {
        success: true,
        state: 'READY',
        authenticated: true,
        clientInfo: {
          number: session.phone || '',
          pushname: session.pushName || 'Aesthetx WhatsApp',
        },
        qrCodeAvailable: false,
        qrBase64: null,
        sessionId: session.id,
        clientId: session.name || clientId,
      };
    }

    if (session.status === 'qr_ready' || session.status === 'scanning' || session.status === 'starting' || session.status === 'initializing') {
      let qrBase64 = null;
      try {
        const qrRes = await fetch(`${GATEWAY_BASE}/api/sessions/${session.id}/qr`, {
          headers: getHeaders(),
          cache: 'no-store',
        });
        if (qrRes.ok) {
          const qrData = await qrRes.json();
          qrBase64 = qrData.qrCode || null;
        }
      } catch (err) {
        console.warn(`[OpenWA QR fetch Warning]: ${err.message}`);
      }

      return {
        success: true,
        state: qrBase64 ? 'QR_REQUIRED' : 'INITIALIZING',
        authenticated: false,
        clientInfo: null,
        qrCodeAvailable: Boolean(qrBase64),
        qrBase64,
        sessionId: session.id,
        clientId: session.name || clientId,
      };
    }

    return {
      success: true,
      state: session.status ? session.status.toUpperCase() : 'INITIALIZING',
      authenticated: false,
      clientInfo: null,
      qrCodeAvailable: false,
      qrBase64: null,
      sessionId: session.id,
      clientId: session.name || clientId,
    };
  } catch (error) {
    console.error('[OpenWA getOpenWAStatus Error]:', error);
    return {
      success: false,
      error: error.message,
      state: 'FAILED',
      authenticated: false,
      qrCodeAvailable: false,
      qrBase64: null,
      clientId,
    };
  }
}

/**
 * Requests an 8-digit WhatsApp pairing code for direct phone linking
 */
export async function getPairingCode(clientId, phone) {
  const session = await getOrCreateSession(clientId);
  if (!session) throw new Error('Could not initialize session on OpenWA');

  const cleanPhone = cleanPhoneNumber(phone);
  const res = await fetch(`${GATEWAY_BASE}/api/sessions/${session.id}/pairing-code`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ phoneNumber: cleanPhone }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pairing code request failed: ${err}`);
  }

  const data = await res.json();
  return {
    success: true,
    pairingCode: data.pairingCode,
    status: data.status,
    sessionId: session.id,
  };
}

/**
 * Disconnects, logs out, and purges a WhatsApp session from OpenWA
 */
export async function disconnectSession(clientId) {
  const sessions = await listSessions();
  const cleanId = String(clientId || '').trim().replace(/[^a-zA-Z0-9-]/g, '');

  let session = sessions.find(
    (s) => s.id === cleanId || s.name === cleanId || s.phone === cleanId || s.phone === cleanPhoneNumber(cleanId)
  );

  if (!session && sessions.length > 0) {
    session = sessions.find((s) => s.status === 'ready') || sessions[0];
  }

  if (session) {
    // 1. Send engine logout to unpair WhatsApp and clear auth tokens
    try {
      await fetch(`${GATEWAY_BASE}/api/sessions/${session.id}/logout`, {
        method: 'POST',
        headers: getHeaders(),
      });
    } catch (e) {
      console.warn(`[OpenWA logout warning]: ${e.message}`);
    }

    // 2. Delete the session completely so old credentials cannot linger on disk
    try {
      await fetch(`${GATEWAY_BASE}/api/sessions/${session.id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
    } catch (e) {
      console.warn(`[OpenWA delete session warning]: ${e.message}`);
    }
  }

  // 3. Immediately provision a fresh, clean session waiting for a new QR / phone pairing
  try {
    const newName = cleanId.length >= 3 ? cleanId : 'aesthetx-main';
    const createRes = await fetch(`${GATEWAY_BASE}/api/sessions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name: newName }),
    });
    if (createRes.ok) {
      const newSession = await createRes.json();
      // Start the new clean session
      await fetch(`${GATEWAY_BASE}/api/sessions/${newSession.id}/start`, {
        method: 'POST',
        headers: getHeaders(),
      });
    }
  } catch (e) {
    console.error(`[OpenWA re-provision clean session error]: ${e.message}`);
  }

  return { success: true };
}

/**
 * Dispatches WhatsApp message via OpenWA
 */
export async function sendWhatsAppMessage({ clientId, phone, message, mediaUrl }) {
  const session = await getOrCreateSession(clientId);
  if (!session) throw new Error('No active WhatsApp gateway session found');

  const chatId = toChatId(phone);

  if (mediaUrl) {
    const res = await fetch(`${GATEWAY_BASE}/api/sessions/${session.id}/messages/send-image`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        chatId,
        url: mediaUrl,
        caption: message || '',
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to send media via OpenWA: ${err}`);
    }
    const data = await res.json();
    return { success: true, messageId: data.id || data.messageId, status: 'SENT' };
  } else {
    const res = await fetch(`${GATEWAY_BASE}/api/sessions/${session.id}/messages/send-text`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        chatId,
        text: message,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to send text via OpenWA: ${err}`);
    }
    const data = await res.json();
    return { success: true, messageId: data.id || data.messageId, status: 'SENT' };
  }
}

/**
 * Fetches recent activity message logs from OpenWA
 */
export async function getMessageLogs(clientId, limit = 50) {
  try {
    const session = await getOrCreateSession(clientId);
    if (!session) return [];

    const res = await fetch(`${GATEWAY_BASE}/api/sessions/${session.id}/messages?limit=${limit}`, {
      headers: getHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.messages || data.items || []);
    return list.map((msg) => ({
      id: msg.id || msg.messageId,
      from: msg.from || (msg.fromMe ? 'Me' : 'Customer'),
      to: msg.to || '',
      body: msg.body || msg.text || (msg.hasMedia ? '[Media/Attachment]' : ''),
      type: msg.fromMe ? 'outgoing' : 'incoming',
      timestamp: msg.timestamp ? new Date(msg.timestamp * 1000).toLocaleTimeString() : new Date().toLocaleTimeString(),
      status: msg.status || 'SENT',
      clientId: session.name || clientId,
    }));
  } catch (err) {
    console.warn('[OpenWA getMessageLogs Warning]:', err.message);
    return [];
  }
}
