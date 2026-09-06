import { NextResponse } from 'next/server'
import { isAdminApiAuthorized } from '@/lib/admin-auth'
import { saveUploadedFile } from '@/lib/uploads'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!isAdminApiAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Файл не знайдено' }, { status: 400 })
    }

    const saved = await saveUploadedFile(file)
    return NextResponse.json({ url: saved.url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не вдалося завантажити файл'
    const status = message.includes('Дозволені') || message.includes('Максимальний') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
