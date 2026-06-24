import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { isAdminApiAuthorized } from '@/lib/admin-auth'
import { getSiteContent, saveSiteContent } from '@/lib/site-content'
import type { SiteContent } from '@/lib/site-content/types'

export async function GET(request: Request) {
  if (!isAdminApiAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const content = await getSiteContent()
  return NextResponse.json(content)
}

export async function PUT(request: Request) {
  if (!isAdminApiAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const patch = (await request.json()) as Partial<SiteContent>
    const content = await saveSiteContent(patch)
    revalidatePath('/')
    revalidatePath('/privacy')
    revalidatePath('/terms')
    return NextResponse.json({ ok: true, content })
  } catch {
    return NextResponse.json({ error: 'Не вдалося зберегти' }, { status: 400 })
  }
}
