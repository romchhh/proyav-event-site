import {
  ASSETS,
  EVENT,
  FAQ_ITEMS,
  GALLERY_IMAGES,
  LINKS,
  SCHEDULE,
} from '@/app/constants'
import type { SiteContent } from './types'

export const DEFAULT_SITE_CONTENT: SiteContent = {
  event: { ...EVENT },
  links: { ...LINKS },
  assets: {
    logo: ASSETS.logo,
    heroDesktop: ASSETS.heroDesktop,
    heroMobile: ASSETS.heroMobile,
    organizers: ASSETS.organizers,
    social: { ...ASSETS.social },
  },
  metadata: {
    title: 'PROяв івент — Масштабна подія у Тернополі',
    description:
      'Масштабна подія нового формату у Тернополі на тему проявленості. 26 вересня 2026, Podolyany Hall.',
  },
  hero: {
    headlineLine1: 'Подія у Тернополі',
    headlineLine2: 'нового формату про',
    headlineAccent: 'проявлення',
    descriptionBrand: 'PROяв івент',
    descriptionBefore: ' — для тих, хто готовий зростати, надихатись і діяти. ',
    descriptionHighlight: '200+ учасників',
    descriptionAfter: ', один насичений день для твого появу.',
    badgeVenue: 'Подоляни Холл',
    badgeTime: '9–21',
    cta: 'Купити квиток',
  },
  about: {
    heading: 'Про подію',
    lead:
      'PROяв — нестандартна подія нового формату: не лише слухати спікерів, а й діяти. Велика сцена для тих, хто хоче вийти на новий рівень, ярмарок, організований нетворкінг і простори, де можна заявити про себе.',
    locationsTitle: 'Локації прояву',
    locationsLead:
      'Окремі простори на події, де кожен охочий може записати інтервʼю, розповісти про проєкт, бізнес, творчість або власну історію.',
    locationsList: [
      'Експерти — показати себе новій аудиторії',
      'Підприємці — розповісти про свою справу',
      'Гості — спробувати себе в новому форматі',
      'Ведучі та оператори допоможуть почуватись комфортно навіть перед камерою вперше',
    ],
    locationsClosing:
      'Прояв на події доступний кожному, хто готовий бути учасником — не лише глядачем.',
    features: [
      { title: 'Локації прояву', desc: 'Інтервʼю, відео та історії про себе — з підтримкою команди' },
      { title: 'Велика сцена', desc: 'Можливість побувати на великій сцені' },
      { title: 'Цільовий нетворкінг', desc: 'Організований нами цільовий нетворкінг' },
      { title: 'Спікери та дискусія', desc: 'Сцена зі спікерами + панельна дискусія' },
      { title: 'Ярмарок', desc: 'Ярмарок крафтових виробників' },
      { title: 'Їжа та шоу', desc: 'Смачна їжа, кава, шоу-програма та інше' },
    ],
  },
  organizers: {
    heading: 'Про ідейниць та організаторок',
    intro: [
      'Привіт! Ми так раді, що ти тут 🤍',
      'Ми — Аліса та Ольга, і ми створили PROяв івент з любовʼю та від душі. І ми дуже хочемо, щоб саме ти став(-ла) частиною цього.',
    ],
    namesHeading: 'Аліса і Ольга',
    photoAlt: 'Аліса і Ольга',
    profiles: [
      {
        name: 'Аліса',
        role: 'Експертка зі створення відео, ідейниця та співзасновниця PROяв івенту',
        bio: 'Допомагаю експертам проявлятись через відео і сама активно йду цим шляхом. Чесно і по-справжньому. 4 гранти на розвиток бізнесу. Міс Галицька Краса 2025. А також — мама чемпіона України, яка показала своїм прикладом: проявлятись — це нормально і це дає результати.',
      },
      {
        name: 'Ольга',
        role: 'Підприємиця, авторка освітніх та розважальних проєктів, співзасновниця та ідейниця PROяв івенту',
        bio: 'Починала у 2016 в Енергодарі — потім перевезла всі свої ідеї до Тернополя і почала знову. Гордість Тернопілля 2025 у номінації підприємець року.',
      },
    ],
    quote: [
      'Для нас PROяв — це не просто подія.',
      'Це про той момент, коли перестаєш чекати дозволу і починаєш жити так, як хочеш ти.',
    ],
  },
  gallery: {
    heading: 'Галерея',
    subheading: 'Атмосфера PROяв івент, яку ми візуалізували за допомогою ШІ.',
    images: [...GALLERY_IMAGES],
  },
  schedule: {
    heading: 'Програма події',
    items: SCHEDULE.map((item) => ({ ...item })),
  },
  speakers: {
    heading: 'Спікери',
    subheading: 'Хто виступатиме на PROяв івент',
    items: [
      {
        id: 'speaker-1',
        name: 'Спікер скоро оголосимо',
        role: 'Експерт / підприємець',
        bio: 'Перший спікер PROяв івенту буде представлений незабаром. Слідкуй за оновленнями в Instagram.',
      },
    ],
    emptySlotTitle: 'Місце вільне',
    emptySlotBio:
      'Хочеш виступити на PROяв івент? Ми відкриті до цікавих історій та експертизи.',
    emptySlotCta: 'Стати спікером',
  },
  partners: {
    heading: 'Партнери',
    subheading:
      'PROяв івент — простір для брендів і проєктів, які розділяють наші цінності. Хочеш долучитись як партнер події?',
    cta: 'Стати партнером події',
  },
  tickets: {
    heading: 'Квитки на PROяв івент',
    tiers: [
      {
        id: 'standard',
        emoji: '🌿',
        name: 'СТАНДАРТ PROяв',
        featured: true,
        limitNote: 'Кількість обмежена — 220 квитків',
        features: [
          { text: 'Вхід на подію — цілий день PROяв 9:00–21:00', included: true },
          { text: 'Виступи всіх спікерів', included: true },
          { text: 'Доступ до нетворкінгу та ярмарку', included: true },
          { text: 'Self-зони для самостійного контенту (фото / відео)', included: true },
          { text: 'Участь у відкритих інтерактивах та розіграшах події', included: true },
          { text: 'Локації та можливості прояву зі сцени — залучення з залу під час виступів', included: true },
          { text: 'Професійні фото з події', included: false },
          { text: 'After party 🎉', included: false },
        ],
      },
      {
        id: 'golden',
        emoji: '🟡',
        name: 'ЗОЛОТИЙ PROяв',
        featured: false,
        limitNote: 'Кількість обмежена — 60 квитків',
        features: [
          { text: 'Все з пакету «Стандарт PROяв»', included: true },
          { text: 'Доступ до локацій прояву з командою PROяв івент:', included: true },
          { text: '🎥 Зйомка з оператором (контент під твій запит)', included: true },
          { text: '📱 Робота з SMM / контент-спеціалістом', included: true },
          { text: '🎙 Запис міні-інтервʼю з модератором або міні подкаст про тебе', included: true },
          { text: 'Супровід і підказки: що знімати і як проявитись', included: true },
        ],
        tagline: 'Твій прояв знімають профі — ти отримуєш контент, не турбуючись про камеру',
      },
      {
        id: 'vip',
        emoji: '👑',
        name: 'ВІП PROяв',
        featured: false,
        limitNote: 'Кількість обмежена — 20 квитків',
        features: [
          { text: 'Все з пакету «Золотий PROяв»', included: true },
          { text: 'Найкращі місця в залі — 1–2 ряди', included: true },
          { text: 'Welcome pack та подарунки від партнерів', included: true },
          { text: 'Окрема стійка реєстрації — без черг', included: true },
          { text: 'Фуршет протягом усього дня — окрема VIP-зона', included: true },
          { text: 'VIP-вечір після події з організаторками та спікерами', included: true },
        ],
        tagline: 'Максимальне занурення, комфорт і увага — для тих, хто хоче отримати від події все',
      },
    ],
    waveLabels: {
      early: '🐦 Рання хвиля',
      main: '🌿 Основна хвиля',
      last: '🔥 Остання хвиля',
    },
    priceMatrix: {
      standard: { early: 1690, main: 1990, last: 2290 },
      golden: { early: 3490, main: 3990, last: 4490 },
      vip: { early: 4990, main: 5990, last: 6990 },
    },
    capacityMatrix: {
      standard: { early: 50, main: 140, last: 30 },
      golden: { early: 10, main: 40, last: 10 },
      vip: { early: 3, main: 15, last: 2 },
    },
    waveWindows: {
      early: { start: '2026-06-01', end: '2026-07-14' },
      main: { start: '2026-07-15', end: '2026-09-11' },
      last: { start: '2026-09-12', end: '2026-09-26' },
    },
    promoCodes: { SPEAKER10: 10, BLOGER15: 15 },
  },
  venue: {
    heading: 'Місце проведення',
    subheading: 'Подоляни Холл, Тернопіль',
    description: 'Зручний підʼїзд, паркінг, все для комфортного дня.',
    mapsEmbedUrl: 'https://maps.google.com/maps?q=Podolyany+Hall,+Ternopil,+Ukraine&output=embed',
  },
  faq: {
    heading: 'Питання та відповіді',
    items: FAQ_ITEMS.map((item) => ({ ...item })),
  },
  social: {
    heading: 'Слідкуй за оновленнями',
    subheading: 'Анонси спікерів, спецпропозиції та все найважливіше про PROяв івент — у наших соцмережах.',
    items: [
      { label: 'Instagram', handle: '@proyavevent', href: LINKS.instagram },
      { label: 'Telegram', handle: 'Чат події', href: LINKS.telegram },
      { label: 'Threads', handle: '@proyavevent', href: LINKS.threads },
    ],
  },
  footer: {
    tagline:
      'PRO — це подія нестандартного формату. Тут люди не тільки слухають, а наважуються, пробують і роблять. Саме тому ця зустріч може стати стартом для нового голосу, нового досвіду і нової версії себе.',
    brand: 'PROяв © 2026',
    credit: 'Розроблено з Telebots',
  },
  navbar: {
    links: [
      { href: '#pro-podiyu', label: 'Про подію' },
      { href: '#programa', label: 'Програма' },
      { href: '#spikery', label: 'Спікери' },
      { href: '#kvitky', label: 'Квитки' },
      { href: '#faq', label: 'FAQ' },
    ],
  },
}
