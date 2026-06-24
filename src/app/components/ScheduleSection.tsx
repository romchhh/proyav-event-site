import type { SiteContent } from '@/lib/site-content/types'
import MarkdownContent from '@/components/MarkdownContent'
import styles from './ScheduleSection.module.css'

export default function ScheduleSection({ content }: { content: SiteContent }) {
  const { schedule, event } = content

  return (
    <section id="programa" className={styles.section}>
      <div className={`sectionInner ${styles.inner}`}>
        <div className={styles.header}>
          <h2 className="sectionHeading">{schedule.heading}</h2>
          <p className={styles.note}>
            {event.dateShort} · {event.venueFull}
          </p>
        </div>

        <div className={styles.timeline}>
          {schedule.items.map((item, i) => (
            <div key={`${item.time}-${item.title}-${i}`} className={styles.row}>
              <span className={styles.time}>{item.time}</span>
              <div className={styles.marker}>
                <span className={styles.dot} aria-hidden="true" />
                {i < schedule.items.length - 1 && <span className={styles.line} aria-hidden="true" />}
              </div>
              <div className={styles.activity}>
                <p className={styles.activityTitle}>{item.title}</p>
                {item.details && (
                  <div className={styles.activityDetails}>
                    <MarkdownContent inline>{item.details}</MarkdownContent>
                  </div>
                )}
                {item.note && (
                  <div className={styles.activityNote}>
                    <MarkdownContent inline>{item.note}</MarkdownContent>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
