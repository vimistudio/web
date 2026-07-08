/** Admin-only plan editor (v2) chrome — rendered in the ADMIN's own locale.
 *  ES strings match the approved Claude Design prototype verbatim. */
export const planEditor = {
  // Header
  "planEditor.title": { en: "Plan — {name}", es: "Plan — {name}" },
  "planEditor.month": { en: "MONTH 01", es: "MES 01" },
  "planEditor.saving": { en: "Saving…", es: "Guardando…" },
  "planEditor.saved": { en: "Saved", es: "Guardado" },

  // Tabs + counts
  "planEditor.tabPlan": { en: "Plan", es: "Plan" },
  "planEditor.tabTemplates": { en: "Templates", es: "Plantillas" },
  "planEditor.tabPreview": { en: "What the client sees", es: "Lo que ve el cliente" },
  "planEditor.counts": {
    en: "{done} of {total} milestones · {owed} client",
    es: "{done} de {total} hitos · {owed} del cliente",
  },

  // Week headers
  "planEditor.weekLabel": { en: "WEEK {n}", es: "SEMANA {n}" },
  "planEditor.weekFinal": { en: "DAY 30 · FINAL", es: "DÍA 30 · FINAL" },
  "planEditor.now": { en: "NOW", es: "AHORA" },
  "planEditor.duplicate": { en: "duplicate", es: "duplicar" },

  // Row controls
  "planEditor.dragTip": { en: "Drag to reorder", es: "Arrastra para reordenar" },
  "planEditor.trackTip": { en: "Change track", es: "Cambiar de track" },
  "planEditor.clientPill": { en: "CLIENT", es: "CLIENTE" },
  "planEditor.clientPillTip": {
    en: "The client completes this",
    es: "El cliente debe completarlo",
  },
  "planEditor.expand": { en: "Expand", es: "Expandir" },
  "planEditor.collapse": { en: "Collapse", es: "Contraer" },
  "planEditor.statusUpcoming": {
    en: "Upcoming · click to set in progress",
    es: "Próximo · clic para marcar en curso",
  },
  "planEditor.statusCurrent": {
    en: "In progress · click to mark done",
    es: "En curso · clic para marcar hecho",
  },
  "planEditor.statusDone": {
    en: "Done · click to reset to upcoming",
    es: "Hecho · clic para volver a próximo",
  },
  "planEditor.statusDelayed": {
    en: "Moved · click to return to in progress",
    es: "Se movió · clic para volver a en curso",
  },

  // Row detail panel
  "planEditor.descPlaceholder": {
    en: "Description — visible to the client",
    es: "Descripción — visible para el cliente",
  },
  "planEditor.moveTo": { en: "Move to", es: "Mover a" },
  "planEditor.delete": { en: "Delete", es: "Eliminar" },
  "planEditor.card": { en: "Card", es: "Tarjeta" },
  "planEditor.linkNone": { en: "No linked card", es: "Sin tarjeta vinculada" },
  "planEditor.moved": { en: "Moved", es: "Se movió" },
  "planEditor.noteRequired": { en: "Note required", es: "Nota requerida" },
  "planEditor.delayPlaceholder": {
    en: "Why it moved — visible to the client",
    es: "Por qué se movió — visible para el cliente",
  },

  // Quick add
  "planEditor.quickAdd": { en: "Add milestone to {week}", es: "Agregar hito a {week}" },
  "planEditor.enter": { en: "↵ Enter", es: "↵ Enter" },

  // Toasts
  "planEditor.addError": { en: "Couldn't add the milestone", es: "No se pudo agregar el hito" },
  "planEditor.deleteError": { en: "Couldn't delete the milestone", es: "No se pudo eliminar el hito" },
  "planEditor.saveError": { en: "Couldn't save the change", es: "No se pudo guardar el cambio" },
  "planEditor.reorderError": { en: "Couldn't reorder", es: "No se pudo reordenar" },
  "planEditor.duplicateError": { en: "Couldn't duplicate the week", es: "No se pudo duplicar la semana" },
  "planEditor.duplicated": {
    en: "Copied {n} milestone{s} to {week}",
    es: "Se copiaron {n} hito{s} a {week}",
  },
  "planEditor.readError": { en: "Couldn't read that plan", es: "No se pudo leer ese plan" },
  "planEditor.clearError": { en: "Couldn't clear the current plan", es: "No se pudo limpiar el plan actual" },
  "planEditor.applyError": { en: "Couldn't apply the plan", es: "No se pudo aplicar el plan" },
  "planEditor.applied": { en: "Applied {n} milestone{s}", es: "Se aplicaron {n} hito{s}" },

  // Templates tab
  "planEditor.tplIntro": {
    en: "Never build a plan from scratch. Apply a studio template or copy another client's plan — then tweak the details in the editor.",
    es: "Nunca armes un plan desde cero. Aplica una plantilla del estudio o copia el plan de otro cliente — después ajustas los detalles en el editor.",
  },
  "planEditor.loading": { en: "Loading…", es: "Cargando…" },
  "planEditor.studioTemplates": { en: "STUDIO TEMPLATES", es: "PLANTILLAS DEL ESTUDIO" },
  "planEditor.noTemplates": { en: "No studio templates yet.", es: "Aún no hay plantillas del estudio." },
  "planEditor.cardMilestones": { en: "milestones", es: "hitos" },
  "planEditor.cardWeeks": { en: "{n} weeks", es: "{n} semanas" },
  "planEditor.cardOwed": { en: "{n} client", es: "{n} del cliente" },
  "planEditor.applyTemplate": { en: "Apply template", es: "Aplicar plantilla" },
  "planEditor.copyOther": { en: "OR COPY FROM ANOTHER CLIENT", es: "O COPIAR DE OTRO CLIENTE" },
  "planEditor.noOthers": { en: "No other plans to copy.", es: "No hay otros planes para copiar." },
  "planEditor.rollover": { en: "(last month)", es: "(mes anterior)" },
  "planEditor.pillMilestones": { en: "{n} milestone{s}", es: "{n} hito{s}" },

  // Replace / add dialog
  "planEditor.alertTitle": { en: "{name} already has a plan", es: "{name} ya tiene un plan" },
  "planEditor.alertBody": {
    en: "This client already has {total} milestone{s}. Replace it with {count} from {source}, or add them to the current plan? Replacing deletes the current milestones and can't be undone.",
    es: "Este cliente ya tiene {total} hito{s}. ¿Reemplazarlo con {count} de {source}, o agregarlos al plan actual? Reemplazar borra los hitos actuales y no se puede deshacer.",
  },
  "planEditor.alertCancel": { en: "Cancel", es: "Cancelar" },
  "planEditor.alertAdd": { en: "Add to plan", es: "Agregar al plan" },
  "planEditor.alertReplace": { en: "Replace ({total})", es: "Reemplazar ({total})" },

  // Preview caption (admin-facing note, admin locale)
  "planEditor.previewCaption": {
    en: "Exactly what {name} sees on their board — it updates live with every plan change.",
    es: "Exactamente lo que {name} ve en su tablero — se actualiza en vivo con cada cambio del plan.",
  },
} as const;
