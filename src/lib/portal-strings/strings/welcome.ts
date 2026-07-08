/** First-visit welcome overlay (once-per-device, client-role only) */
export const welcome = {
  // Chrome
  "welcome.skip": { en: "Skip", es: "Saltar" },
  "welcome.close": { en: "Close", es: "Cerrar" },
  "welcome.back": { en: "Back", es: "Atrás" },
  "welcome.next": { en: "Next", es: "Siguiente" },
  "welcome.step": { en: "Step {n} of 3", es: "Paso {n} de 3" },

  // Slide 1 — the studio
  "welcome.s1.title": { en: "Welcome to your studio", es: "Bienvenidos a su estudio" },
  "welcome.s1.body": {
    en: "This is where {client} and the studio work together: requests, progress, and deliveries in one place, not scattered across chats.",
    es: "Aquí es donde {client} y el estudio trabajan juntos: solicitudes, avances y entregas en un solo lugar, no repartidos en mil chats.",
  },

  // Slide 2 — how it works
  "welcome.s2.title": { en: "How it works", es: "Así funciona" },
  "welcome.s2.body": {
    en: "You ask, we prioritize, and when something is “Ready for You” we need your eyes.",
    es: "Tú pides, nosotros priorizamos, y cuando algo está “Listo para ti” necesitamos tu visto bueno.",
  },
  "welcome.s2.bell": {
    en: "We’ll let you know here and by email.",
    es: "Te avisamos aquí y por correo.",
  },

  // Slide 3 — plan variant (client has milestones)
  "welcome.s3plan.title": { en: "Your plan is already moving", es: "Tu plan ya está en marcha" },
  "welcome.s3plan.body": {
    en: "Right below you’ll see your plan, week by week.",
    es: "Aquí abajo verás tu plan, semana por semana.",
  },
  "welcome.s3plan.checklist": {
    en: "And under “What we need from you”, check it off when it’s ready.",
    es: "Y en “Lo que necesitamos de ti”, márcalo cuando esté listo.",
  },
  "welcome.s3plan.cta": { en: "See my plan", es: "Ver mi plan" },

  // Slide 3 — new variant (no milestones)
  "welcome.s3new.title": { en: "What should we design first?", es: "¿Qué diseñamos primero?" },
  "welcome.s3new.body": {
    en: "Tell us what you need and we’ll get right to work.",
    es: "Cuéntanos qué necesitas y nos ponemos manos a la obra.",
  },
  "welcome.s3new.cta": { en: "New request", es: "Nueva solicitud" },
  "welcome.s3new.explore": { en: "Explore first", es: "Explorar primero" },
} as const;
