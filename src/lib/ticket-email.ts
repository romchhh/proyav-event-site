import QRCode from 'qrcode'
import { getSiteContent } from '@/lib/site-content'
import { getTicketHeaderBase64 } from '@/lib/ticket-branding'
import { sendEmail } from './email'
import { getOrderTickets, type StoredOrder } from './store'
import {
  generateTicketInvitationPng,
  getTicketFilename,
  getTicketQrPayload,
} from './ticket-invitation'

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export async function sendTicketEmail(order: StoredOrder) {
  const content = await getSiteContent()
  const { event, links } = content
  const tickets = await getOrderTickets(order.orderReference)
  const ticketItems = tickets.length
    ? tickets
    : [{
        id: 0,
        orderReference: order.orderReference,
        ticketCode: order.ticketCode ?? order.orderReference,
        sequence: 1,
        checkInStatus: 'none' as const,
      }]

  const attachments = await Promise.all(
    ticketItems.map(async (ticket) => ({
      filename: getTicketFilename(order.orderReference, ticket.ticketCode),
      content: await generateTicketInvitationPng(order, ticket),
      contentType: 'image/png',
    })),
  )

  const headerBase64 = await getTicketHeaderBase64(560)
  const primaryTicket = ticketItems[0]
  const qrPayload = getTicketQrPayload(order.orderReference, primaryTicket.ticketCode)
  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    margin: 1,
    width: 280,
    color: { dark: '#1a1210', light: '#ffffff' },
  })

  const ticketCodesHtml = ticketItems
    .map(
      (ticket) =>
        `<li style="margin:0 0 8px;font-size:18px;font-weight:700;color:#9a7858;letter-spacing:0.08em;">${escapeHtml(ticket.ticketCode)}</li>`,
    )
    .join('')

  const subject =
    ticketItems.length > 1
      ? `Твої квитки на PROяв івент (${ticketItems.length}) — ${order.tierName}`
      : `Твій квиток на PROяв івент — ${order.tierName}`

  const html = `
<!DOCTYPE html>
<html lang="uk">
  <head>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700&display=swap" rel="stylesheet" />
  </head>
  <body style="margin:0;padding:0;background:#faf6f1;font-family:Montserrat,Arial,sans-serif;color:#1a1210;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf6f1;padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 12px 40px rgba(26,18,16,0.08);">
            <tr>
              <td style="padding:0;line-height:0;background:#f9f6f1;">
                <img
                  src="data:image/png;base64,${headerBase64}"
                  alt="PROяв івент"
                  width="560"
                  height="142"
                  style="display:block;width:100%;max-width:560px;height:auto;border-radius:24px 24px 0 0;"
                />
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 28px;background:#f9f6f1;text-align:center;">
                <h1 style="margin:0;font-size:26px;line-height:1.3;font-weight:700;color:#3d2e26;font-family:Montserrat,Arial,sans-serif;">
                  ${ticketItems.length > 1 ? 'Твої квитки на PROяв івент' : 'Твій квиток на PROяв івент'}
                </h1>
                <p style="margin:16px 0 0;font-size:16px;line-height:1.6;color:#5c4a40;font-family:Montserrat,Arial,sans-serif;">
                  ${escapeHtml(order.name)}, дякуємо за оплату! У вкладенні — ${ticketItems.length > 1 ? `${ticketItems.length} файли-запрошення` : 'файл-запрошення'} з QR-кодами.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 12px;">
                <p style="margin:0 0 6px;font-size:14px;color:#8a7d72;">Тариф</p>
                <p style="margin:0 0 18px;font-size:22px;font-weight:700;color:#1a1210;">${escapeHtml(order.tierName)}</p>
                <p style="margin:0 0 6px;font-size:14px;color:#8a7d72;">${ticketItems.length > 1 ? 'Коди квитків' : 'Код квитка'}</p>
                <ul style="margin:0 0 18px;padding-left:20px;">${ticketCodesHtml}</ul>
                <p style="margin:0 0 6px;font-size:14px;color:#8a7d72;">Подія</p>
                <p style="margin:0 0 6px;font-size:17px;font-weight:600;color:#1a1210;">${event.dateShort}</p>
                <p style="margin:0 0 18px;font-size:16px;color:#5c4a40;">${event.venueFull} · ${event.time}</p>
                <p style="margin:0 0 6px;font-size:14px;color:#8a7d72;">Номер замовлення</p>
                <p style="margin:0 0 24px;font-size:15px;font-weight:600;color:#9a7858;letter-spacing:0.04em;">${escapeHtml(order.orderReference)}</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:8px 32px 28px;">
                <div style="display:inline-block;padding:18px;border-radius:20px;background:#faf6f1;border:1px solid #e8ddd2;">
                  <img src="${qrDataUrl}" alt="QR-код квитка" width="220" height="220" style="display:block;border-radius:12px;" />
                </div>
                <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:#5c4a40;">
                  Збережи вкладення або цей лист. Кожен QR-код сканується окремо на вході.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;">
                <div style="padding:18px 20px;border-radius:16px;background:#faf6f1;border-left:4px solid #b8956f;">
                  <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#5c4a40;">
                    Долучайся до Telegram-чату <strong>PROяв: знайомства</strong> — там збираються учасниці події, оновлення та знайомства перед івентом.
                  </p>
                  <a href="${links.telegram}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#b8956f;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">
                    Перейти в чат
                  </a>
                </div>
                <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#8a7d72;text-align:center;">
                  Питання? <a href="mailto:${links.email}" style="color:#9a7858;">${links.email}</a>
                  · <a href="${links.telegram}" style="color:#9a7858;">Telegram</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  const text = [
    `Дякуємо за оплату, ${order.name}!`,
    '',
    `Тариф: ${order.tierName}`,
    `Кількість: ${ticketItems.length}`,
    ...ticketItems.map((ticket) => `Код квитка ${ticket.sequence}: ${ticket.ticketCode}`),
    `Подія: ${event.dateShort}, ${event.venueFull}`,
    `Номер замовлення: ${order.orderReference}`,
    '',
    `У вкладенні — ${ticketItems.length} файл(ів) з QR-кодами для входу.`,
    `Telegram-чат події: ${links.telegram}`,
    `Питання: ${links.email}`,
  ].join('\n')

  return sendEmail({
    to: order.email,
    subject,
    text,
    html,
    attachments,
  })
}
