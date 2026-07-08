/** Chrome — header, search, notifications, profile, login */
export const chrome = {
  // Header
  "header.settings": { en: "Settings", es: "Configuración" },
  "header.signOut": { en: "Sign out", es: "Cerrar sesión" },
  "header.searchPlaceholder": { en: "Search your designs and files...", es: "Buscar tus diseños y archivos..." },

  // Search
  "search.placeholder": { en: "Search designs, comments, files...", es: "Buscar diseños, comentarios, archivos..." },
  "search.searching": { en: "Searching...", es: "Buscando..." },
  "search.noResults": { en: "Nothing found — try different words.", es: "No encontramos nada — prueba con otras palabras." },
  "search.minChars": { en: "Keep typing to search...", es: "Sigue escribiendo para buscar..." },
  "search.requests": { en: "Designs", es: "Diseños" },
  "search.comments": { en: "Comments", es: "Comentarios" },
  "search.files": { en: "Files", es: "Archivos" },
  "search.onRequest": { en: "on", es: "en" },
  "search.inRequest": { en: "in", es: "en" },

  // Notifications
  "notifications.title": { en: "Notifications", es: "Notificaciones" },
  "notifications.markAllRead": { en: "Mark all read", es: "Marcar todas como leídas" },
  "notifications.empty": { en: "All clear. We'll let you know when something needs your attention.", es: "Todo al día. Te avisaremos cuando haya algo nuevo." },
  "notifications.emptyTitle": { en: "All clear", es: "Todo al día" },
  "notifications.emptySubtitle": { en: "We'll let you know when something needs your attention.", es: "Te avisaremos cuando haya algo nuevo." },

  // Profile
  "profile.signOut": { en: "Sign out", es: "Cerrar sesión" },
  "profile.memberSince": { en: "Client since", es: "Cliente desde" },
  "profile.project": { en: "Project", es: "Proyecto" },
  "profile.role": { en: "Account type", es: "Tipo de cuenta" },
  "profile.signInMethod": { en: "You sign in with", es: "Inicias sesión con" },
  "profile.about": { en: "Questions? We're here for you — reach out at", es: "¿Preguntas? Estamos para ti — escríbenos a" },
  "profile.admin": { en: "Admin", es: "Administrador" },
  "profile.client": { en: "Client", es: "Cliente" },
  "profile.unknown": { en: "Unknown", es: "Desconocido" },
  "profile.localeError": { en: "Could not update language", es: "No pudimos actualizar el idioma" },

  // Access gate surfaces (shown outside the locale provider — see gate.* callers)
  "gate.noAccess.title": { en: "You don't have access yet", es: "Aún no tienes acceso" },
  "gate.noAccess.body": { en: "This portal is invite-only. If you're a Vimi Studio client, reach out to get set up:", es: "Este portal es solo por invitación. Si eres cliente de Vimi Studio, escríbenos para configurarte:" },
  "gate.linking.title": { en: "Welcome — getting your project ready…", es: "Bienvenido — preparando tu proyecto…" },
  "gate.linking.body": { en: "Linking your account to your design portal. This usually takes a second.", es: "Estamos conectando tu cuenta con tu portal de diseño. Esto suele tomar un segundo." },
  "gate.linking.stillHere": { en: "Still here after a few seconds? Refresh the page.", es: "¿Sigues aquí después de unos segundos? Actualiza la página." },
  "gate.almost.title": { en: "Almost there!", es: "¡Ya casi!" },
  "gate.almost.body": { en: "Your account hasn't been linked to a project yet. We're getting it set up for you — check back soon.", es: "Tu cuenta aún no está vinculada a un proyecto. Lo estamos configurando para ti — vuelve pronto." },
  "gate.almost.contact": { en: "Questions? Reach out at hello@vimistudio.com", es: "¿Preguntas? Escríbenos a hello@vimistudio.com" },

  // Login
  "login.welcome": { en: "Welcome to your studio", es: "Tu estudio te espera" },
  "login.subtitle": { en: "Sign in to see your designs and stay in touch with your team", es: "Inicia sesión para ver tus diseños y estar en contacto con tu equipo" },
  "login.google": { en: "Sign in with Google", es: "Iniciar sesión con Google" },
  "login.signingIn": { en: "Signing in...", es: "Iniciando sesión..." },
  "login.inviteOnly": { en: "Invite-only access", es: "Acceso solo con invitación" },
  "login.inviteDesc": { en: "Don't have access yet? Ask us and we'll get you set up.", es: "¿No tienes acceso? Escríbenos y te configuramos." },
  "login.error": { en: "Something went wrong signing in. Please try again.", es: "Algo salió mal al iniciar sesión. Inténtalo de nuevo." },
  "login.terms": { en: "Terms", es: "Términos" },
  "login.privacy": { en: "Privacy Policy", es: "Política de Privacidad" },
  "login.continueGoogle": { en: "Continue with Google", es: "Continuar con Google" },

  // Common
  "common.for": { en: "for", es: "para" },
  "common.on": { en: "on", es: "en" },
} as const;
