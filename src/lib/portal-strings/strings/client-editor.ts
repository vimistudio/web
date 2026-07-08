/** Admin-only Edit Client editor (v2) chrome — rendered in the ADMIN's own
 *  locale, except the live portal preview card whose sample copy follows the
 *  CLIENT's locale (like plan-editor's `tc`). ES strings match the approved
 *  Claude Design prototype verbatim. */
export const clientEditor = {
  // Header
  "clientEditor.active": { en: "ACTIVE", es: "ACTIVO" },
  "clientEditor.paused": { en: "PAUSED", es: "PAUSADO" },
  "clientEditor.dirty": { en: "Unsaved changes", es: "Cambios sin guardar" },
  "clientEditor.saved": { en: "Saved", es: "Guardado" },
  "clientEditor.showPreview": { en: "Preview", es: "Vista previa" },
  "clientEditor.showForm": { en: "Edit", es: "Editar" },

  // Section headers
  "clientEditor.sectionIdentity": { en: "IDENTITY", es: "IDENTIDAD" },
  "clientEditor.sectionAgreement": { en: "AGREEMENT", es: "ACUERDO" },
  "clientEditor.sectionTeam": { en: "TEAM", es: "EQUIPO" },
  "clientEditor.teamSubtitle": {
    en: "the main contact signs the portal note",
    es: "el contacto principal firma la nota del portal",
  },
  "clientEditor.contact": { en: "CONTACT", es: "CONTACTO" },
  "clientEditor.addFromStudio": { en: "+ Add from studio", es: "+ Añadir del estudio" },
  "clientEditor.rosterEmpty": {
    en: "The whole studio is already on this project.",
    es: "Todo el estudio ya está en este proyecto.",
  },
  "clientEditor.rolePlaceholder": { en: "Role", es: "Rol" },
  "clientEditor.removeMember": { en: "Remove {name}", es: "Quitar a {name}" },
  "clientEditor.cantRemoveLast": {
    en: "Keep at least one person on the team.",
    es: "Debe quedar al menos una persona en el equipo.",
  },
  "clientEditor.cantRemoveLead": {
    en: "Pick a new contact before removing the current one.",
    es: "Elige un nuevo contacto antes de quitar al actual.",
  },

  // Identity
  "clientEditor.name": { en: "Name", es: "Nombre" },
  "clientEditor.slug": { en: "Portal slug", es: "Slug del portal" },
  "clientEditor.logo": { en: "Logo", es: "Logo" },
  "clientEditor.noLogo": { en: "no logo", es: "sin logo" },
  "clientEditor.logoPlaceholder": { en: "https://…/logo.svg", es: "https://…/logo.svg" },
  "clientEditor.accent": { en: "Accent color", es: "Color de acento" },

  // Agreement
  "clientEditor.retainer": { en: "Retainer", es: "Retainer" },
  "clientEditor.perMonth": { en: "/mo", es: "/mes" },
  "clientEditor.startDate": { en: "Start", es: "Inicio" },
  "clientEditor.startHint": { en: "day 1 of the retainer", es: "día 1 del retainer" },
  "clientEditor.terms": { en: "Terms", es: "Términos" },
  "clientEditor.termsHint": {
    en: "the client sees these in their portal",
    es: "el cliente los ve en su portal",
  },
  "clientEditor.termsPlaceholder": {
    en: "e.g. No lock-in · cancel with 30 days' notice",
    es: "e.g. Sin permanencia · cancelan con 30 días",
  },

  // Studio
  "clientEditor.designer": { en: "Designer", es: "Diseñador" },
  "clientEditor.designerDefault": { en: "Studio", es: "Estudio" },
  "clientEditor.language": { en: "Language", es: "Idioma" },
  "clientEditor.langEs": { en: "Spanish", es: "Español" },
  "clientEditor.langEn": { en: "English", es: "English" },
  "clientEditor.note": { en: "Studio note", es: "Nota del estudio" },
  "clientEditor.noteHint": {
    en: "appears signed in their sidebar",
    es: "aparece firmada en su sidebar",
  },
  "clientEditor.notePlaceholder": {
    en: "e.g. The audit is underway — sneak peek on Thursday",
    es: "e.g. La auditoría va en marcha — sneak peek el jueves",
  },

  // Footer
  "clientEditor.cancel": { en: "Cancel", es: "Cancelar" },
  "clientEditor.save": { en: "Save changes", es: "Guardar cambios" },
  "clientEditor.saving": { en: "Saving…", es: "Guardando…" },

  // Preview panel (admin-facing chrome, admin locale)
  "clientEditor.previewHeading": { en: "HOW {name} SEES IT", es: "ASÍ LO VE {name}" },
  "clientEditor.previewPortal": { en: "Portal", es: "Portal" },
  "clientEditor.previewAgreement": { en: "Agreement", es: "Acuerdo" },
  "clientEditor.previewCaption": {
    en: "Every change is reflected here instantly — what you approve is what the client sees.",
    es: "Cada cambio se refleja aquí al instante — lo que apruebas es lo que el cliente ve.",
  },

  // Mini portal card sample copy (CLIENT locale, via tc)
  "clientEditor.cardMonth": { en: "MONTH 01", es: "MES 01" },
  "clientEditor.cardPlanTitle": { en: "Your plan for month 01", es: "Tu plan del mes 01" },
  "clientEditor.cardNewRequest": { en: "+ New request", es: "+ Nueva solicitud" },
  "clientEditor.sampleMilestone1": { en: "Brand audit", es: "Auditoría de marca" },
  "clientEditor.sampleMilestone2": { en: "First concepts", es: "Primeras propuestas" },
} as const;
