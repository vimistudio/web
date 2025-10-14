import { Language } from "./i18n";

type WordBank = {
  [key in Language]: {
    small: string[];
    large: string[];
  };
};

export const statements: WordBank = {
  en: {
    small: [
      "pre-seed founders",
      "seed-stage startups",
      "MVP builders",
      "product launchers",
      "early adopters",
      "beta testers",
    ],
    large: [
      "founders raising capital",
      "startups launching products",
      "teams building MVPs",
      "companies scaling fast",
      "founders going to market",
      "startups finding PMF",
      "teams preparing to launch",
      "founders building in public",
    ],
  },
  es: {
    small: [
      "fundadores pre-seed",
      "startups en etapa seed",
      "constructores de MVP",
      "lanzadores de productos",
      "primeros adoptantes",
      "probadores beta",
    ],
    large: [
      "fundadores levantando capital",
      "startups lanzando productos",
      "equipos construyendo MVPs",
      "empresas escalando rápido",
      "fundadores yendo al mercado",
      "startups encontrando PMF",
      "equipos preparándose para lanzar",
      "fundadores construyendo en público",
    ],
  },
};
