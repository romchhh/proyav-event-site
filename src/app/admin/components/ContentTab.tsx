'use client'

import type { SiteContent } from '@/lib/site-content/types'
import type { TicketTierId, TicketWave } from '@/lib/tickets'
import type { ContentBlockId } from './content-blocks'
import { ContentEditorProps, Field, ImageField, GalleryImagesField, createId } from './admin-ui'

const WAVES: TicketWave[] = ['early', 'main', 'last']

type ContentTabProps = ContentEditorProps & {
  activeBlock: ContentBlockId
}

export default function ContentTab({ content, onChange, activeBlock }: ContentTabProps) {
  const patch = (partial: Partial<SiteContent>) => onChange({ ...content, ...partial })

  return (
    <div className="adminContent">
      {activeBlock === 'hero' && (
        <div className="adminBlockPanel">
          <h2 className="adminBlockTitle">Hero та подія</h2>
          <Field label="Заголовок — рядок 1" value={content.hero.headlineLine1} onChange={(v) => patch({ hero: { ...content.hero, headlineLine1: v } })} />
          <Field label="Заголовок — рядок 2" value={content.hero.headlineLine2} onChange={(v) => patch({ hero: { ...content.hero, headlineLine2: v } })} />
          <Field label="Акцент у заголовку" value={content.hero.headlineAccent} onChange={(v) => patch({ hero: { ...content.hero, headlineAccent: v } })} />
          <Field label="Опис — бренд" value={content.hero.descriptionBrand} onChange={(v) => patch({ hero: { ...content.hero, descriptionBrand: v } })} />
          <Field label="Опис — до акценту" value={content.hero.descriptionBefore} onChange={(v) => patch({ hero: { ...content.hero, descriptionBefore: v } })} markdown multiline />
          <Field label="Опис — акцент" value={content.hero.descriptionHighlight} onChange={(v) => patch({ hero: { ...content.hero, descriptionHighlight: v } })} />
          <Field label="Опис — після акценту" value={content.hero.descriptionAfter} onChange={(v) => patch({ hero: { ...content.hero, descriptionAfter: v } })} markdown multiline />
          <Field label="CTA кнопка" value={content.hero.cta} onChange={(v) => patch({ hero: { ...content.hero, cta: v } })} />
          <Field label="Бейдж — локація" value={content.hero.badgeVenue} onChange={(v) => patch({ hero: { ...content.hero, badgeVenue: v } })} />
          <Field label="Бейдж — час" value={content.hero.badgeTime} onChange={(v) => patch({ hero: { ...content.hero, badgeTime: v } })} />
          <Field label="Назва події" value={content.event.name} onChange={(v) => patch({ event: { ...content.event, name: v } })} />
          <Field label="Дата (коротко)" value={content.event.dateShort} onChange={(v) => patch({ event: { ...content.event, dateShort: v } })} />
          <Field label="Час" value={content.event.time} onChange={(v) => patch({ event: { ...content.event, time: v } })} />
          <Field label="Локація" value={content.event.venueFull} onChange={(v) => patch({ event: { ...content.event, venueFull: v } })} />
          <ImageField label="Hero desktop" value={content.assets.heroDesktop} onChange={(v) => patch({ assets: { ...content.assets, heroDesktop: v } })} />
          <ImageField label="Hero mobile" value={content.assets.heroMobile} onChange={(v) => patch({ assets: { ...content.assets, heroMobile: v } })} />
          <ImageField label="Логотип" value={content.assets.logo} onChange={(v) => patch({ assets: { ...content.assets, logo: v } })} />
        </div>
      )}

      {activeBlock === 'about' && (
        <div className="adminBlockPanel">
          <h2 className="adminBlockTitle">Про подію</h2>
          <Field label="Заголовок" value={content.about.heading} onChange={(v) => patch({ about: { ...content.about, heading: v } })} />
          <Field label="Опис" value={content.about.lead} onChange={(v) => patch({ about: { ...content.about, lead: v } })} multiline markdown />
          <Field label="Локації — заголовок" value={content.about.locationsTitle} onChange={(v) => patch({ about: { ...content.about, locationsTitle: v } })} />
          <Field label="Локації — вступ" value={content.about.locationsLead} onChange={(v) => patch({ about: { ...content.about, locationsLead: v } })} multiline markdown />
          {content.about.locationsList.map((item, index) => (
            <Field key={index} label={`Локації — пункт ${index + 1}`} value={item} onChange={(v) => {
              const locationsList = [...content.about.locationsList]
              locationsList[index] = v
              patch({ about: { ...content.about, locationsList } })
            }} multiline markdown />
          ))}
          <button type="button" className="adminGhostBtn" onClick={() => patch({ about: { ...content.about, locationsList: [...content.about.locationsList, 'Новий пункт'] } })}>+ Додати пункт локацій</button>
          <Field label="Локації — завершення" value={content.about.locationsClosing} onChange={(v) => patch({ about: { ...content.about, locationsClosing: v } })} multiline markdown />
          {content.about.features.map((feature, index) => (
            <div key={index} className="adminRowCard">
              <Field label={`Перевага ${index + 1} — назва`} value={feature.title} onChange={(v) => {
                const features = [...content.about.features]
                features[index] = { ...feature, title: v }
                patch({ about: { ...content.about, features } })
              }} />
              <Field label="Опис" value={feature.desc} onChange={(v) => {
                const features = [...content.about.features]
                features[index] = { ...feature, desc: v }
                patch({ about: { ...content.about, features } })
              }} multiline markdown />
            </div>
          ))}
        </div>
      )}

      {activeBlock === 'organizers' && (
        <div className="adminBlockPanel">
          <h2 className="adminBlockTitle">Організаторки</h2>
          <Field label="Заголовок" value={content.organizers.heading} onChange={(v) => patch({ organizers: { ...content.organizers, heading: v } })} />
          {content.organizers.intro.map((paragraph, index) => (
            <Field key={index} label={`Вступ ${index + 1}`} value={paragraph} onChange={(v) => {
              const intro = [...content.organizers.intro]
              intro[index] = v
              patch({ organizers: { ...content.organizers, intro } })
            }} multiline markdown />
          ))}
          <button type="button" className="adminGhostBtn" onClick={() => patch({ organizers: { ...content.organizers, intro: [...content.organizers.intro, ''] } })}>+ Додати абзац вступу</button>
          <Field label="Заголовок імен" value={content.organizers.namesHeading} onChange={(v) => patch({ organizers: { ...content.organizers, namesHeading: v } })} />
          <Field label="Alt фото" value={content.organizers.photoAlt} onChange={(v) => patch({ organizers: { ...content.organizers, photoAlt: v } })} />
          <ImageField label="Фото" value={content.assets.organizers} onChange={(v) => patch({ assets: { ...content.assets, organizers: v } })} />
          {content.organizers.profiles.map((profile, index) => (
            <div key={index} className="adminRowCard">
              <Field label="Імʼя" value={profile.name} onChange={(v) => {
                const profiles = [...content.organizers.profiles]
                profiles[index] = { ...profile, name: v }
                patch({ organizers: { ...content.organizers, profiles } })
              }} />
              <Field label="Роль" value={profile.role} onChange={(v) => {
                const profiles = [...content.organizers.profiles]
                profiles[index] = { ...profile, role: v }
                patch({ organizers: { ...content.organizers, profiles } })
              }} multiline markdown />
              <Field label="Біо" value={profile.bio} onChange={(v) => {
                const profiles = [...content.organizers.profiles]
                profiles[index] = { ...profile, bio: v }
                patch({ organizers: { ...content.organizers, profiles } })
              }} multiline markdown />
            </div>
          ))}
          {content.organizers.quote.map((line, index) => (
            <Field key={index} label={`Цитата ${index + 1}`} value={line} onChange={(v) => {
              const quote = [...content.organizers.quote]
              quote[index] = v
              patch({ organizers: { ...content.organizers, quote } })
            }} multiline markdown />
          ))}
          <button type="button" className="adminGhostBtn" onClick={() => patch({ organizers: { ...content.organizers, quote: [...content.organizers.quote, ''] } })}>+ Додати рядок цитати</button>
        </div>
      )}

      {activeBlock === 'speakers' && (
        <div className="adminBlockPanel">
          <h2 className="adminBlockTitle">Спікери</h2>
          <Field label="Заголовок" value={content.speakers.heading} onChange={(v) => patch({ speakers: { ...content.speakers, heading: v } })} />
          <Field label="Підзаголовок" value={content.speakers.subheading} onChange={(v) => patch({ speakers: { ...content.speakers, subheading: v } })} multiline markdown />
          {content.speakers.items.map((speaker, index) => (
            <div key={speaker.id} className="adminRowCard">
              <Field label="Імʼя" value={speaker.name} onChange={(v) => {
                const items = [...content.speakers.items]
                items[index] = { ...speaker, name: v }
                patch({ speakers: { ...content.speakers, items } })
              }} />
              <Field label="Роль" value={speaker.role} onChange={(v) => {
                const items = [...content.speakers.items]
                items[index] = { ...speaker, role: v }
                patch({ speakers: { ...content.speakers, items } })
              }} />
              <Field label="Біо" value={speaker.bio} onChange={(v) => {
                const items = [...content.speakers.items]
                items[index] = { ...speaker, bio: v }
                patch({ speakers: { ...content.speakers, items } })
              }} multiline markdown />
              <ImageField label="Фото (опційно)" value={speaker.photo ?? ''} onChange={(v) => {
                const items = [...content.speakers.items]
                items[index] = { ...speaker, photo: v || undefined }
                patch({ speakers: { ...content.speakers, items } })
              }} />
              <button type="button" className="adminDangerBtn" onClick={() => {
                patch({ speakers: { ...content.speakers, items: content.speakers.items.filter((_, i) => i !== index) } })
              }}>Видалити спікера</button>
            </div>
          ))}
          <button type="button" className="adminGhostBtn" onClick={() => {
            patch({
              speakers: {
                ...content.speakers,
                items: [...content.speakers.items, { id: createId('speaker'), name: 'Новий спікер', role: '', bio: '' }],
              },
            })
          }}>+ Додати спікера</button>
        </div>
      )}

      {activeBlock === 'schedule' && (
        <div className="adminBlockPanel">
          <h2 className="adminBlockTitle">Програма</h2>
          <Field label="Заголовок секції" value={content.schedule.heading} onChange={(v) => patch({ schedule: { ...content.schedule, heading: v } })} />
          {content.schedule.items.map((item, index) => (
            <div key={index} className="adminRowCard">
              <Field label="Час" value={item.time} onChange={(v) => {
                const items = [...content.schedule.items]
                items[index] = { ...item, time: v }
                patch({ schedule: { ...content.schedule, items } })
              }} />
              <Field label="Назва" value={item.title} onChange={(v) => {
                const items = [...content.schedule.items]
                items[index] = { ...item, title: v }
                patch({ schedule: { ...content.schedule, items } })
              }} />
              <Field label="Деталі" value={item.details ?? ''} onChange={(v) => {
                const items = [...content.schedule.items]
                items[index] = { ...item, details: v || undefined }
                patch({ schedule: { ...content.schedule, items } })
              }} multiline markdown />
              <button type="button" className="adminDangerBtn" onClick={() => patch({ schedule: { ...content.schedule, items: content.schedule.items.filter((_, i) => i !== index) } })}>Видалити</button>
            </div>
          ))}
          <button type="button" className="adminGhostBtn" onClick={() => patch({ schedule: { ...content.schedule, items: [...content.schedule.items, { time: '00:00', title: 'Новий пункт' }] } })}>+ Додати пункт</button>
        </div>
      )}

      {activeBlock === 'gallery' && (
        <div className="adminBlockPanel">
          <h2 className="adminBlockTitle">Галерея</h2>
          <Field label="Заголовок" value={content.gallery.heading} onChange={(v) => patch({ gallery: { ...content.gallery, heading: v } })} />
          <Field label="Підзаголовок" value={content.gallery.subheading} onChange={(v) => patch({ gallery: { ...content.gallery, subheading: v } })} multiline markdown />
          <GalleryImagesField
            images={content.gallery.images}
            onChange={(images) => patch({ gallery: { ...content.gallery, images } })}
          />
        </div>
      )}

      {activeBlock === 'faq' && (
        <div className="adminBlockPanel">
          <h2 className="adminBlockTitle">FAQ</h2>
          <Field label="Заголовок секції" value={content.faq.heading} onChange={(v) => patch({ faq: { ...content.faq, heading: v } })} />
          {content.faq.items.map((item, index) => (
            <div key={index} className="adminRowCard">
              <Field label="Питання" value={item.question} onChange={(v) => {
                const items = [...content.faq.items]
                items[index] = { ...item, question: v }
                patch({ faq: { ...content.faq, items } })
              }} />
              <Field label="Відповідь" value={item.answer} onChange={(v) => {
                const items = [...content.faq.items]
                items[index] = { ...item, answer: v }
                patch({ faq: { ...content.faq, items } })
              }} multiline markdown />
              <button type="button" className="adminDangerBtn" onClick={() => patch({ faq: { ...content.faq, items: content.faq.items.filter((_, i) => i !== index) } })}>Видалити</button>
            </div>
          ))}
          <button type="button" className="adminGhostBtn" onClick={() => patch({ faq: { ...content.faq, items: [...content.faq.items, { question: 'Нове питання', answer: 'Відповідь' }] } })}>+ Додати FAQ</button>
        </div>
      )}

      {activeBlock === 'partners' && (
        <div className="adminBlockPanel">
          <h2 className="adminBlockTitle">Партнери</h2>
          <Field label="Заголовок" value={content.partners.heading} onChange={(v) => patch({ partners: { ...content.partners, heading: v } })} />
          <Field label="Текст" value={content.partners.subheading} onChange={(v) => patch({ partners: { ...content.partners, subheading: v } })} multiline markdown />
          <Field label="Кнопка" value={content.partners.cta} onChange={(v) => patch({ partners: { ...content.partners, cta: v } })} />
          {(content.partners.items ?? []).map((partner, index) => (
            <div key={partner.id} className="adminRowCard">
              <Field
                label="Назва"
                value={partner.name}
                onChange={(v) => {
                  const items = [...(content.partners.items ?? [])]
                  items[index] = { ...partner, name: v }
                  patch({ partners: { ...content.partners, items } })
                }}
              />
              <Field
                label="Посилання (опційно)"
                value={partner.href ?? ''}
                onChange={(v) => {
                  const items = [...(content.partners.items ?? [])]
                  items[index] = { ...partner, href: v || undefined }
                  patch({ partners: { ...content.partners, items } })
                }}
              />
              <ImageField
                label="Логотип"
                value={partner.logo}
                onChange={(v) => {
                  const items = [...(content.partners.items ?? [])]
                  items[index] = { ...partner, logo: v }
                  patch({ partners: { ...content.partners, items } })
                }}
              />
              <button
                type="button"
                className="adminDangerBtn"
                onClick={() =>
                  patch({
                    partners: {
                      ...content.partners,
                      items: (content.partners.items ?? []).filter((_, i) => i !== index),
                    },
                  })
                }
              >
                Видалити партнера
              </button>
            </div>
          ))}
          <button
            type="button"
            className="adminGhostBtn"
            onClick={() =>
              patch({
                partners: {
                  ...content.partners,
                  items: [
                    ...(content.partners.items ?? []),
                    { id: createId('partner'), name: 'Новий партнер', logo: '' },
                  ],
                },
              })
            }
          >
            + Додати партнера
          </button>
        </div>
      )}

      {activeBlock === 'tickets' && (
        <div className="adminBlockPanel">
          <h2 className="adminBlockTitle">Квитки та ціни</h2>
          <Field label="Заголовок секції" value={content.tickets.heading} onChange={(v) => patch({ tickets: { ...content.tickets, heading: v } })} />
          {content.tickets.tiers.map((tier, tierIndex) => (
            <div key={tier.id} className="adminRowCard">
              <Field label="Назва тарифу" value={tier.name} onChange={(v) => {
                const tiers = [...content.tickets.tiers]
                tiers[tierIndex] = { ...tier, name: v }
                patch({ tickets: { ...content.tickets, tiers } })
              }} />
              <Field label="Emoji" value={tier.emoji} onChange={(v) => {
                const tiers = [...content.tickets.tiers]
                tiers[tierIndex] = { ...tier, emoji: v }
                patch({ tickets: { ...content.tickets, tiers } })
              }} />
              <Field label="Примітка про ліміт" value={tier.limitNote} onChange={(v) => {
                const tiers = [...content.tickets.tiers]
                tiers[tierIndex] = { ...tier, limitNote: v }
                patch({ tickets: { ...content.tickets, tiers } })
              }} multiline markdown />
              <Field label="Підпис під списком (tagline)" value={tier.tagline ?? ''} onChange={(v) => {
                const tiers = [...content.tickets.tiers]
                tiers[tierIndex] = { ...tier, tagline: v || undefined }
                patch({ tickets: { ...content.tickets, tiers } })
              }} multiline markdown />
              <p className="adminHint">Переваги та опис тарифу</p>
              {tier.features.map((feature, featureIndex) => (
                <div key={`${tier.id}-feature-${featureIndex}`} className="adminRowCard">
                  <Field label={`Пункт ${featureIndex + 1}`} value={feature.text} onChange={(v) => {
                    const tiers = [...content.tickets.tiers]
                    const features = [...tier.features]
                    features[featureIndex] = { ...feature, text: v }
                    tiers[tierIndex] = { ...tier, features }
                    patch({ tickets: { ...content.tickets, tiers } })
                  }} multiline markdown />
                  <label className="adminCheckLabel">
                    <input
                      type="checkbox"
                      checked={feature.included}
                      onChange={(event) => {
                        const tiers = [...content.tickets.tiers]
                        const features = [...tier.features]
                        features[featureIndex] = { ...feature, included: event.target.checked }
                        tiers[tierIndex] = { ...tier, features }
                        patch({ tickets: { ...content.tickets, tiers } })
                      }}
                    />
                    Включено в тариф (якщо зняти — показується як опція)
                  </label>
                  <button
                    type="button"
                    className="adminDangerBtn"
                    onClick={() => {
                      const tiers = [...content.tickets.tiers]
                      tiers[tierIndex] = {
                        ...tier,
                        features: tier.features.filter((_, index) => index !== featureIndex),
                      }
                      patch({ tickets: { ...content.tickets, tiers } })
                    }}
                  >
                    Видалити пункт
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="adminGhostBtn"
                onClick={() => {
                  const tiers = [...content.tickets.tiers]
                  tiers[tierIndex] = {
                    ...tier,
                    features: [...tier.features, { text: 'Новий пункт', included: true }],
                  }
                  patch({ tickets: { ...content.tickets, tiers } })
                }}
              >
                + Додати пункт
              </button>
              {WAVES.map((wave) => (
                <div key={wave} className="adminPriceRow">
                  <span>{content.tickets.waveLabels[wave]}</span>
                  <input
                    type="number"
                    value={content.tickets.priceMatrix[tier.id][wave]}
                    onChange={(event) => {
                      const tiers = [...content.tickets.tiers]
                      const priceMatrix = { ...content.tickets.priceMatrix, [tier.id]: { ...content.tickets.priceMatrix[tier.id], [wave]: Number(event.target.value) } }
                      patch({ tickets: { ...content.tickets, tiers, priceMatrix } })
                    }}
                  />
                  <input
                    type="number"
                    title="Кількість місць"
                    value={content.tickets.capacityMatrix[tier.id][wave]}
                    onChange={(event) => {
                      const capacityMatrix = { ...content.tickets.capacityMatrix, [tier.id]: { ...content.tickets.capacityMatrix[tier.id], [wave]: Number(event.target.value) } }
                      patch({ tickets: { ...content.tickets, capacityMatrix } })
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
          <p className="adminHint">Промокоди керуються в окремій вкладці «Промокоди» в адмін-панелі.</p>
        </div>
      )}

      {activeBlock === 'venue' && (
        <div className="adminBlockPanel">
          <h2 className="adminBlockTitle">Локація</h2>
          <Field label="Заголовок" value={content.venue.heading} onChange={(v) => patch({ venue: { ...content.venue, heading: v } })} />
          <Field label="Підзаголовок" value={content.venue.subheading} onChange={(v) => patch({ venue: { ...content.venue, subheading: v } })} />
          <Field label="Опис" value={content.venue.description} onChange={(v) => patch({ venue: { ...content.venue, description: v } })} multiline markdown />
          <Field label="Google Maps embed URL" value={content.venue.mapsEmbedUrl} onChange={(v) => patch({ venue: { ...content.venue, mapsEmbedUrl: v } })} />
        </div>
      )}

      {activeBlock === 'social' && (
        <div className="adminBlockPanel">
          <h2 className="adminBlockTitle">Соцмережі</h2>
          <Field label="Заголовок" value={content.social.heading} onChange={(v) => patch({ social: { ...content.social, heading: v } })} />
          <Field label="Підзаголовок" value={content.social.subheading} onChange={(v) => patch({ social: { ...content.social, subheading: v } })} multiline markdown />
          {content.social.items.map((item, index) => (
            <div key={index} className="adminRowCard">
              <Field label="Назва" value={item.label} onChange={(v) => {
                const items = [...content.social.items]
                items[index] = { ...item, label: v }
                patch({ social: { ...content.social, items } })
              }} />
              <Field label="Підпис" value={item.handle} onChange={(v) => {
                const items = [...content.social.items]
                items[index] = { ...item, handle: v }
                patch({ social: { ...content.social, items } })
              }} />
              <Field label="Посилання" value={item.href} onChange={(v) => {
                const items = [...content.social.items]
                items[index] = { ...item, href: v }
                patch({ social: { ...content.social, items } })
              }} />
            </div>
          ))}
        </div>
      )}

      {activeBlock === 'footer' && (
        <div className="adminBlockPanel">
          <h2 className="adminBlockTitle">Футер та меню</h2>
          <Field label="Текст у футері" value={content.footer.tagline} onChange={(v) => patch({ footer: { ...content.footer, tagline: v } })} multiline markdown />
          <Field label="Бренд / копірайт" value={content.footer.brand} onChange={(v) => patch({ footer: { ...content.footer, brand: v } })} />
          <Field label="Підпис розробника" value={content.footer.credit} onChange={(v) => patch({ footer: { ...content.footer, credit: v } })} />
          {content.navbar.links.map((link, index) => (
            <div key={index} className="adminRowCard">
              <Field label={`Меню ${index + 1} — текст`} value={link.label} onChange={(v) => {
                const links = [...content.navbar.links]
                links[index] = { ...link, label: v }
                patch({ navbar: { ...content.navbar, links } })
              }} />
              <Field label="Якір / URL" value={link.href} onChange={(v) => {
                const links = [...content.navbar.links]
                links[index] = { ...link, href: v }
                patch({ navbar: { ...content.navbar, links } })
              }} />
            </div>
          ))}
        </div>
      )}

      {activeBlock === 'links' && (
        <div className="adminBlockPanel">
          <h2 className="adminBlockTitle">Посилання та SEO</h2>
          <Field label="Email" value={content.links.email} onChange={(v) => patch({ links: { ...content.links, email: v } })} />
          <Field label="Instagram" value={content.links.instagram} onChange={(v) => patch({ links: { ...content.links, instagram: v } })} />
          <Field label="Telegram" value={content.links.telegram} onChange={(v) => patch({ links: { ...content.links, telegram: v } })} />
          <Field label="Meta title" value={content.metadata.title} onChange={(v) => patch({ metadata: { ...content.metadata, title: v } })} />
          <Field label="Meta description" value={content.metadata.description} onChange={(v) => patch({ metadata: { ...content.metadata, description: v } })} multiline />
        </div>
      )}
    </div>
  )
}
