export const STORAGE_KEYS = {
  VIDEO_INTRO: 'hasSeenVideoIntro'
} as const;

export const storage = {
  hasSeenVideo: () => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEYS.VIDEO_INTRO) === 'true';
  },
  markVideoAsSeen: () => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.VIDEO_INTRO, 'true');
  }
};
