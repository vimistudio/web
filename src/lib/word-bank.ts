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
      "dreamers",
      "creators",
      "thinkers",
      "builders",
      "leaders",
      "makers",
      "doers",
      "shapers",
      "visionaries",
    ],
    large: [
      "innovators",
      "entrepreneurs",
      "visionaries",
      "pioneers",
      "dreamers",
      "creators",
      "thinkers",
      "builders",
      "leaders",
      "makers",
      "doers",
      "shapers",
    ],
  },
  es: {
    small: [
      "el futuro",
      "líderes",
      "artistas",
      "genios",
      "mentores",
      "pioneros",
    ],
    large: [
      "innovadores",
      "emprendedores",
      "visionarios",
      "pioneros",
      "soñadores",
      "creadores",
      "pensadores",
      "constructores",
      "líderes",
      "fabricantes",
      "hacedores",
      "formadores",
    ],
  },
};
