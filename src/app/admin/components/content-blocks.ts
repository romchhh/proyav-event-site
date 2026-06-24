export const CONTENT_BLOCKS = [
  { id: 'hero', label: 'Hero та подія' },
  { id: 'about', label: 'Про подію' },
  { id: 'organizers', label: 'Організаторки' },
  { id: 'speakers', label: 'Спікери' },
  { id: 'schedule', label: 'Програма' },
  { id: 'gallery', label: 'Галерея' },
  { id: 'partners', label: 'Партнери' },
  { id: 'tickets', label: 'Квитки та ціни' },
  { id: 'venue', label: 'Локація' },
  { id: 'faq', label: 'FAQ' },
  { id: 'social', label: 'Соцмережі' },
  { id: 'footer', label: 'Футер та меню' },
  { id: 'links', label: 'Посилання та SEO' },
] as const

export type ContentBlockId = (typeof CONTENT_BLOCKS)[number]['id']
