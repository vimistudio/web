/** Client plan tracker (month-plan hand-holding surface) */
export const plan = {
  "plan.title": { en: "Your plan, month 01", es: "Tu plan del mes 01" },
  "plan.dealLine": { en: "USD ${amount}/mo", es: "USD ${amount}/mes" },
  "plan.delayed": { en: "Timing moved — {note}", es: "Se movió — {note}" },
  "plan.week": { en: "Week {n} of 4", es: "Semana {n} de 4" },
  "plan.weekLabel": { en: "WEEK {n}", es: "SEMANA {n}" },
  "plan.final": { en: "FINAL", es: "FINAL" },
  "plan.progress": { en: "{done} of {total} done", es: "{done} de {total} listos" },
  "plan.complete": { en: "Plan complete — beautiful work", es: "Plan completo, excelente trabajo" },

  "plan.needsTitle": { en: "What we need from you", es: "Lo que necesitamos de ti" },
  "plan.needsSub": {
    en: "Tick these off so we can keep moving",
    es: "Marca estos para que sigamos avanzando",
  },
  "plan.allCaughtUp": { en: "Nothing needed from you right now", es: "Nada pendiente de tu parte por ahora" },

  "plan.viewCard": { en: "View card", es: "Ver tarjeta" },
  "plan.checkedToast": { en: "Done — we've been notified", es: "¡Listo! Ya nos avisamos" },
  "plan.undo": { en: "Undo", es: "Deshacer" },
  "plan.uncheckedToast": { en: "Unchecked", es: "Desmarcado" },
  "plan.saveError": { en: "Couldn't save. Please try again.", es: "No se pudo guardar. Inténtalo de nuevo." },
  "plan.expand": { en: "Show plan", es: "Ver plan" },
  "plan.collapse": { en: "Hide plan", es: "Ocultar plan" },
} as const;
