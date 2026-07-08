/**
 * Studio contact constants — single source of truth.
 *
 * STUDIO_WHATSAPP is the El Salvador number the client sidebar's "WhatsApp
 * directo" pill links to. Bare international digits only (no +, spaces, or
 * dashes) because wa.me requires that format. Change it here and every deep
 * link updates.
 */
export const STUDIO_WHATSAPP = "50378851556";
export const STUDIO_WHATSAPP_URL = `https://wa.me/${STUDIO_WHATSAPP}`;
