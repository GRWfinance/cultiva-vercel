import React from 'react';

const base = (path, props = {}) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {path}
  </svg>
);

export const IconHome = (p) => base(<path d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9" />, p);
export const IconUsers = (p) => base(<><circle cx="9" cy="8" r="3" /><path d="M2.5 19c0-3 2.9-5 6.5-5s6.5 2 6.5 5" /><circle cx="17" cy="7" r="2.5" /><path d="M16 13.5c2.7.4 4.5 2 4.5 4.5" /></>, p);
export const IconTarget = (p) => base(<><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="0.5" /></>, p);
export const IconCompass = (p) => base(<><circle cx="12" cy="12" r="9" /><path d="m15 9-2 5-5 2 2-5z" /></>, p);
export const IconCalendar = (p) => base(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>, p);
export const IconClipboard = (p) => base(<><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 3h6v3H9zM8 11h8M8 15h6" /></>, p);
export const IconMessage = (p) => base(<path d="M21 12a8.5 8.5 0 1 1-3.2-6.6L21 4l-1 3.3A8.4 8.4 0 0 1 21 12Z" />, p);
export const IconAward = (p) => base(<><circle cx="12" cy="8" r="5" /><path d="m8.5 12.5-1.5 6 5-2 5 2-1.5-6" /></>, p);
export const IconTrendingUp = (p) => base(<><path d="M3 17 9 11l4 4 8-8" /><path d="M17 6h4v4" /></>, p);
export const IconWallet = (p) => base(<><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M16 14h2" /></>, p);
export const IconBookOpen = (p) => base(<path d="M3 5c2-1 5-1 9 0v14c-4-1-7-1-9 0Zm18 0c-2-1-5-1-9 0v14c4-1 7-1 9 0Z" />, p);
export const IconPlus = (p) => base(<path d="M12 5v14M5 12h14" />, p);
export const IconChevronRight = (p) => base(<path d="m9 6 6 6-6 6" />, p);
export const IconClock = (p) => base(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>, p);
export const IconCheck = (p) => base(<path d="M5 12l5 5 9-9" />, p);
export const IconX = (p) => base(<path d="M6 6l12 12M18 6 6 18" />, p);
export const IconCoffee = (p) => base(<><path d="M4 9h13a3 3 0 0 1 0 6h-1" /><path d="M4 9v6a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9" /><path d="M8 2v2M11 2v2M14 2v2" /></>, p);
export const IconHeart = (p) => base(<path d="M12 21s-7-4.5-9.3-9A5 5 0 0 1 12 6a5 5 0 0 1 9.3 6c-2.3 4.5-9.3 9-9.3 9Z" />, p);
export const IconDollar = (p) => base(<><circle cx="12" cy="12" r="9" /><path d="M12 6v12M15 9a3 3 0 0 0-3-1c-1.5 0-3 .8-3 2.2 0 1.4 1.3 1.9 3 2.3 1.7.4 3 1 3 2.5 0 1.4-1.5 2-3 2a3.6 3.6 0 0 1-3-1.5" /></>, p);
export const IconFilter = (p) => base(<path d="M4 5h16l-6 7v6l-4 2v-8z" />, p);
export const IconArrowUpRight = (p) => base(<path d="M7 17 17 7M9 7h8v8" />, p);
export const IconLock = (p) => base(<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>, p);
export const IconAlertCircle = (p) => base(<><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>, p);
