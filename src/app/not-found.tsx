import Link from 'next/link'
import { LINKS } from '@/app/constants'
import styles from './payment/success/page.module.css'

export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.eyebrow}>PROяв івент</p>
        <h1 className={styles.title}>Сторінку не знайдено</h1>
        <p className={styles.lead}>
          Такої сторінки на сайті немає. Якщо ви шукали підтвердження оплати — перевірте посилання
          з листа або зверніться до нас.
        </p>
        <div className={styles.actions}>
          <Link href="/payment/success" className={styles.primary}>
            Сторінка оплати
          </Link>
          <Link href="/" className={styles.secondary}>
            На головну
          </Link>
        </div>
        <p className={styles.note}>
          Питання? <a href={`mailto:${LINKS.email}`}>{LINKS.email}</a>
        </p>
      </div>
    </div>
  )
}
