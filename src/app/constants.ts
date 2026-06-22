export const EVENT = {
  name: 'PROяв івент',
  date: '26 вересня 2026 року',
  dateShort: '26 вересня 2026',
  time: '09:00 — 21:00',
  venueUa: 'Тернопіль, Подоляни Холл',
  venueEn: 'Podolyany Hall',
  venueFull: 'Подоляни Холл, Тернопіль',
} as const

export const LINKS = {
  instagram: 'https://www.instagram.com/proyavevent',
  threads: 'https://www.threads.com/@proyavevent',
  telegram: 'https://t.me/+qDUUN6cZosFmNDgy',
  maps: 'https://maps.app.goo.gl/SqnLvqf8ghRFTggq7',
  email: 'proYav.event@gmail.com',
  privacy: '/privacy',
  terms: '/terms',
  telebots: 'https://telebots.site/',
  becomeSpeaker:
    'https://docs.google.com/forms/d/e/1FAIpQLSdQnpsltXoUW723MwkQkJsFs1kNy8Tipqt717fvjPMmDecgJg/viewform?usp=header',
  becomePartner: 'mailto:proYav.event@gmail.com?subject=Стати партнером PROяв івент',
} as const

export const SELLER = {
  name: 'ФОП Тедеєва Ольга Олександрівна',
  taxId: '3214109082',
  legalAddress: '46000, Україна, Тернопільська область, м. Тернопіль',
  actualAddress: '46000, Україна, Тернопільська область, м. Тернопіль',
  email: LINKS.email,
  iban: 'UA063220010000026001340111147',
  bankName: 'Акціонерне товариство «УНІВЕРСАЛ БАНК»',
  bankMfo: '322001',
  bankEdrpou: '21133352',
} as const

export const ASSETS = {
  logo: '/images/logo/proyav-logo.png',
  heroDesktop: '/images/hero/hero-desktop.jpg',
  heroMobile: '/images/hero/hero-mobile.jpg',
  organizers: '/images/organizers/alisa-nevierova-olga-tedeieva.jpg',
  social: {
    threads: '/images/social/threads.png',
  },
} as const

export const GALLERY_IMAGES = [
  '/images/gallery/gallery-01.jpg',
  '/images/gallery/gallery-02.jpg',
  '/images/gallery/gallery-03.jpg',
  '/images/gallery/gallery-04.jpg',
  '/images/gallery/gallery-05.jpg',
  '/images/gallery/gallery-06.jpg',
  '/images/gallery/gallery-07.jpg',
  '/images/gallery/gallery-08.jpg',
  '/images/gallery/gallery-09.jpg',
] as const

export const SCHEDULE = [
  {
    time: '09:00–10:00',
    title: 'Реєстрація',
    details: 'Welcome drinks, жива музика, бейдж',
    note: 'Рекомендуємо прийти до 10:00',
  },
  {
    time: '10:00',
    title: 'Відкриття',
    details: 'Вітальне слово організаторок, розіграш для пунктуальних',
  },
  {
    time: '11:00',
    title: 'Блок 1 — Натхнення',
  },
  {
    time: '11:00',
    title: 'Спікер 1',
  },
  {
    time: '11:40',
    title: 'Спікер 2',
  },
  {
    time: '12:20',
    title: 'Спікер 3',
    details: 'Шоу-програма та розіграші',
  },
  {
    time: '13:00',
    title: 'Блок 2 — Дія',
    details: 'Їжа, ярмарок, локації прояву, фото та відео, вільний мікрофон, розваги',
  },
  {
    time: '17:00',
    title: 'Блок 3 — Енергія',
    details: 'Повернення до сцени',
  },
  {
    time: '17:10',
    title: 'Панельна дискусія',
    details: 'З експертами (ведуча — Ольга Тедеєва)',
  },
  {
    time: '18:00',
    title: 'Спікер 4',
  },
  {
    time: '18:40',
    title: 'Спікер 5',
  },
  {
    time: '19:20',
    title: 'Спікер 6',
    details: 'Шоу-програма та розіграші',
  },
  {
    time: '20:00',
    title: 'Офіційне завершення програми',
  },
  {
    time: '20:00–21:00',
    title: 'Afterparty',
    details: 'DJ сет, танці та фінальні фото',
    note: 'VIP — окремо з організаторками',
  },
  {
    time: '21:00',
    title: 'Завершення події',
  },
] as const

export const FAQ_ITEMS = [
  {
    question: 'Чи можна передати квиток іншій людині?',
    answer:
      'Так, квиток можна передати. Але майте на увазі — квиток сканується на вході один раз, тому пройти зможе лише одна людина. Якщо ви передали квиток, потрапити на подію за ним уже не вийде.',
  },
  {
    question: 'Що робити, якщо не зможу прийти? Чи повернуть гроші?',
    answer:
      'Гроші за квиток не повертаються, оскільки кількість місць обмежена і ваше місце вже заброньоване. Тому радимо заздалегідь запланувати цей день і просто прийти.',
  },
  {
    question: 'Чи будуть фото і відео з події і де їх знайти?',
    answer:
      'Так, фото і відео буде дуже багато. Всі посилання скинемо у телеграм-чат нашого ком\'юніті — до нього ви автоматично долучитесь після покупки квитка.',
  },
  {
    question: 'Чи можна самостійно записувати контент на локаціях прояву?',
    answer:
      'Так, на події будуть спеціальні локації прояву, де кожен зможе самостійно або разом з другом записати відео чи зробити фото для своїх соцмереж.',
  },
  {
    question: 'Скільки триває подія?',
    answer: 'Початок реєстрації о 9:00 і завершення програми близько 21:00.',
  },
  {
    question: 'Чи буде харчування?',
    answer: 'Так, на локації працюватиме зона харчування (оплачується самостійно), а на ярмарку можна буде придбати смаколики. Для власників квитків категорії VIP харчування вже включене у вартість.',
  },
  {
    question: 'Чи можна змінити формат участі після покупки квитка?',
    answer: 'Так, це можливо, за умовою вільного місця. Золотий та віп прояв мають обмежену кількість місць.',
  },
  {
    question: 'До кого звертатись з питаннями?',
    answer: `[Telegram-група події](${LINKS.telegram}) або email: [${LINKS.email}](mailto:${LINKS.email})`,
  },
] as const
