export type Locale = "en" | "es";

const portal = {
  // --- Status labels ---
  "status.queued": { en: "Up Next", es: "Siguiente" },
  "status.in_progress": { en: "In Progress", es: "En Progreso" },
  "status.review": { en: "Ready for You", es: "Listo para Ti" },
  "status.done": { en: "Delivered", es: "Entregado" },

  // --- Bottom tabs ---
  "tab.board": { en: "Board", es: "Tablero" },
  "tab.gallery": { en: "Gallery", es: "Galería" },
  "tab.profile": { en: "Profile", es: "Perfil" },

  // --- Board ---
  "board.active": { en: "Active", es: "Activo" },
  "board.workingOn": { en: "We're working on {count} design{s} for you", es: "Estamos trabajando en {count} diseño{s} para ti" },
  "board.newRequest": { en: "New Request", es: "Nueva Solicitud" },
  "board.emptyTitle": { en: "Your studio is ready", es: "Tu estudio está listo" },
  "board.emptyBody": { en: "What would you like us to design first?", es: "¿Qué te gustaría que diseñemos primero?" },
  "board.emptyCta": { en: "Submit a request and your designer will get started.", es: "Envía una solicitud y tu diseñador comenzará." },
  "board.welcomeBack": { en: "Welcome back!", es: "¡Hola de nuevo!" },
  "board.sinceLastVisit": { en: "Since your last visit:", es: "Desde tu última visita:" },
  "board.designsReady": { en: "{count} design{s} ready for you", es: "{count} diseño{s} listo{s} para ti" },
  "board.delivered": { en: "{count} delivered", es: "{count} entregado{s}" },
  "board.updates": { en: "{count} update{s} on your designs", es: "{count} actualización{es} en tus diseños" },
  "board.nothingHere": { en: "Nothing here yet", es: "Nada por aquí aún" },
  "board.empty.queued": { en: "All caught up!", es: "¡Todo al día!" },
  "board.empty.in_progress": { en: "Your designer is between projects", es: "Tu diseñador está entre proyectos" },
  "board.empty.review": { en: "Nothing to review right now", es: "Nada que revisar por ahora" },
  "board.empty.done": { en: "Your first delivery is on the way", es: "Tu primera entrega está en camino" },

  // --- Request form ---
  "form.step.name": { en: "Name", es: "Nombre" },
  "form.step.type": { en: "Type", es: "Tipo" },
  "form.step.details": { en: "Details", es: "Detalles" },
  "form.step.timeline": { en: "Timeline", es: "Plazo" },
  "form.step.inspiration": { en: "Inspiration", es: "Inspiración" },

  "form.name.title": { en: "What do you need designed?", es: "¿Qué necesitas que diseñemos?" },
  "form.name.subtitle": { en: "A short name so your designer knows what to expect.", es: "Un nombre corto para que tu diseñador sepa qué esperar." },
  "form.name.placeholder": { en: "e.g. Instagram story templates, Logo refresh...", es: "ej. Plantillas para Instagram, Rediseño de logo..." },

  "form.type.title": { en: "What kind of project is this?", es: "¿Qué tipo de proyecto es?" },
  "form.type.subtitle": { en: "Pick the closest match. You can always add details later.", es: "Elige la opción más cercana. Siempre puedes agregar detalles después." },

  "form.type.logo": { en: "Logo Design", es: "Diseño de Logo" },
  "form.type.logo.desc": { en: "A logo or icon for your brand", es: "Un logo o ícono para tu marca" },
  "form.type.social": { en: "Social Media", es: "Redes Sociales" },
  "form.type.social.desc": { en: "Posts for Instagram, Facebook, TikTok...", es: "Publicaciones para Instagram, Facebook, TikTok..." },
  "form.type.web": { en: "Website", es: "Sitio Web" },
  "form.type.web.desc": { en: "Web pages, banners, landing pages", es: "Páginas web, banners, landing pages" },
  "form.type.brand": { en: "Branding", es: "Identidad de Marca" },
  "form.type.brand.desc": { en: "Colors, fonts, brand guidelines", es: "Colores, tipografías, guías de marca" },
  "form.type.presentation": { en: "Presentation", es: "Presentación" },
  "form.type.presentation.desc": { en: "Pitch decks, slides, one-pagers", es: "Presentaciones, slides, one-pagers" },
  "form.type.other": { en: "Something Else", es: "Otra Cosa" },
  "form.type.other.desc": { en: "Anything else you need designed", es: "Cualquier otra cosa que necesites diseñar" },

  "form.details.title": { en: "Tell us a bit more", es: "Cuéntanos un poco más" },
  "form.details.subtitle": { en: "Don't worry about design terms — just describe what you're picturing.", es: "No te preocupes por términos de diseño — solo describe lo que imaginas." },
  "form.details.placeholder": { en: "What's it for? (e.g. weekly specials on Instagram)\n\nAny colors or style you like? (e.g. warm, appetizing, our brand colors)\n\nAnything to avoid? (e.g. no blue, keep it simple)", es: "¿Para qué es? (ej. especiales semanales en Instagram)\n\n¿Algún color o estilo que te guste? (ej. cálido, apetitoso, colores de nuestra marca)\n\n¿Algo que evitar? (ej. sin azul, mantenerlo simple)" },

  "form.timeline.title": { en: "When do you need it?", es: "¿Cuándo lo necesitas?" },
  "form.timeline.subtitle": { en: "Set the pace for your designer.", es: "Marca el ritmo para tu diseñador." },
  "form.timeline.dueDate": { en: "Due date", es: "Fecha límite" },
  "form.timeline.optional": { en: "optional", es: "opcional" },

  "form.priority.whenever": { en: "Whenever", es: "Cuando Sea" },
  "form.priority.whenever.desc": { en: "No rush, take your time", es: "Sin prisa, tómate tu tiempo" },
  "form.priority.thisWeek": { en: "This Week", es: "Esta Semana" },
  "form.priority.thisWeek.desc": { en: "Normal turnaround", es: "Tiempo normal de entrega" },
  "form.priority.urgent": { en: "Urgent", es: "Urgente" },
  "form.priority.urgent.desc": { en: "Need it ASAP", es: "Lo necesito ya" },

  "form.inspiration.title": { en: "Any inspiration?", es: "¿Alguna inspiración?" },
  "form.inspiration.subtitle": { en: "Screenshots from Pinterest, Instagram, or anywhere work great. Or skip this step.", es: "Capturas de Pinterest, Instagram, o donde sea funcionan perfecto. O salta este paso." },
  "form.inspiration.addFile": { en: "Add file", es: "Agregar" },

  "form.continue": { en: "Continue", es: "Continuar" },
  "form.back": { en: "Back", es: "Atrás" },
  "form.submit": { en: "Send to Designer", es: "Enviar al Diseñador" },
  "form.submitting": { en: "Sending...", es: "Enviando..." },
  "form.success.title": { en: "Got it!", es: "¡Listo!" },
  "form.success.body": { en: "Your designer will take it from here. We'll let you know when there's something to see.", es: "Tu diseñador se encarga desde aquí. Te avisaremos cuando haya algo que ver." },

  // --- Request detail ---
  "detail.yourDesigns": { en: "Your Designs", es: "Tus Diseños" },
  "detail.references": { en: "References", es: "Referencias" },
  "detail.comments": { en: "Comments", es: "Comentarios" },
  "detail.activity": { en: "Activity", es: "Actividad" },
  "detail.approve": { en: "Approve", es: "Aprobar" },
  "detail.approving": { en: "Approving...", es: "Aprobando..." },
  "detail.askForChanges": { en: "Ask for Changes", es: "Pedir Cambios" },
  "detail.addComment": { en: "Add a comment...", es: "Añade un comentario..." },
  "detail.noComments": { en: "No messages yet. Say hi, or we'll reach out when we have updates.", es: "Sin mensajes aún. Saluda, o te escribiremos cuando tengamos novedades." },
  "detail.upNext": { en: "You're up next! Your designer will start working on this soon.", es: "¡Estás siguiente! Tu diseñador empezará a trabajar en esto pronto." },
  "detail.downloadAll": { en: "Download All", es: "Descargar Todo" },
  "detail.requested": { en: "Requested", es: "Solicitado" },
  "detail.updated": { en: "Updated", es: "Actualizado" },
  "detail.due": { en: "Due", es: "Fecha límite" },
  "detail.noDescription": { en: "No description provided", es: "Sin descripción" },
  "detail.sendHint": { en: "Enter to send, Shift+Enter for new line", es: "Enter para enviar, Shift+Enter para nueva línea" },
  "detail.complete": { en: "Request Complete", es: "Solicitud Completada" },
  "detail.deliveredOn": { en: "Delivered on", es: "Entregado el" },

  // --- Quick feedback chips ---
  "chip.loveIt": { en: "Love it!", es: "¡Me encanta!" },
  "chip.changeColors": { en: "Can we change the colors?", es: "¿Podemos cambiar los colores?" },
  "chip.changeText": { en: "Can we change the text?", es: "¿Podemos cambiar el texto?" },
  "chip.differentLayout": { en: "Can we try a different layout?", es: "¿Podemos probar otro diseño?" },
  "chip.almostThere": { en: "Almost there, small tweaks needed", es: "Casi listo, pequeños ajustes" },

  // --- Edit request (P4) ---
  "edit.title": { en: "Edit Request", es: "Editar Solicitud" },
  "edit.save": { en: "Save Changes", es: "Guardar Cambios" },
  "edit.saving": { en: "Saving...", es: "Guardando..." },
  "edit.cancel": { en: "Cancel", es: "Cancelar" },
  "edit.saved": { en: "Changes saved", es: "Cambios guardados" },

  // --- Gallery ---
  "gallery.all": { en: "All", es: "Todo" },
  "gallery.newest": { en: "Newest", es: "Recientes" },
  "gallery.oldest": { en: "Oldest", es: "Antiguos" },
  "gallery.empty": { en: "No deliverables yet. They'll appear here as designs are completed.", es: "Aún no hay diseños. Aparecerán aquí conforme se completen." },
  "gallery.emptyFiltered": { en: "No {type} deliverables yet.", es: "Aún no hay diseños de {type}." },

  // --- Notifications ---
  "notifications.title": { en: "Notifications", es: "Notificaciones" },
  "notifications.markAllRead": { en: "Mark all read", es: "Marcar todo leído" },
  "notifications.empty": { en: "All clear. We'll let you know when something needs your eye.", es: "Todo al día. Te avisaremos cuando haya algo nuevo." },

  // --- Search ---
  "search.placeholder": { en: "Search requests...", es: "Buscar solicitudes..." },
  "search.noResults": { en: "No results found.", es: "Sin resultados." },

  // --- Profile ---
  "profile.signOut": { en: "Sign Out", es: "Cerrar Sesión" },
  "profile.memberSince": { en: "Member since", es: "Miembro desde" },
  "profile.project": { en: "Project", es: "Proyecto" },
  "profile.role": { en: "Role", es: "Rol" },
  "profile.signInMethod": { en: "Sign-in method", es: "Método de acceso" },
  "profile.about": { en: "Your design partner. Need help? Reach out at", es: "Tu socio de diseño. ¿Necesitas ayuda? Escríbenos a" },

  // --- Login ---
  "login.welcome": { en: "Welcome to your studio", es: "Bienvenido a tu estudio" },
  "login.subtitle": { en: "Sign in to see your designs and collaborate with your studio", es: "Inicia sesión para ver tus diseños y colaborar con tu estudio" },
  "login.google": { en: "Sign in with Google", es: "Iniciar sesión con Google" },
  "login.signingIn": { en: "Signing in...", es: "Iniciando sesión..." },
  "login.inviteOnly": { en: "Invite-only access", es: "Acceso solo con invitación" },
  "login.error": { en: "Something went wrong signing in. Please try again.", es: "Algo salió mal al iniciar sesión. Inténtalo de nuevo." },

  // --- Common ---
  "common.for": { en: "for", es: "para" },
  "common.on": { en: "on", es: "en" },
} as const;

export type PortalKey = keyof typeof portal;

/**
 * Get a translated string for the portal.
 * Supports simple interpolation: t("board.workingOn", { count: 3, s: "s" })
 */
export function t(key: PortalKey, locale: Locale = "en", vars?: Record<string, string | number>): string {
  const entry = portal[key];
  let str = entry?.[locale] ?? entry?.en ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return str;
}

/** All portal string keys — useful for exhaustive checks */
export const portalKeys = Object.keys(portal) as PortalKey[];
