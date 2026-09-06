import { NextResponse } from 'next/server'
import { readUploadedFile } from '@/lib/uploads'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type RouteContext = {
  params: { filename: string }
}

export async function GET(_request: Request, context: RouteContext) {
  const filename = context.params.filename?.trim() ?? ''
  const file = await readUploadedFile(filename)

  if (!file) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return new NextResponse(new Uint8Array(file.buffer), {
    headers: {
      'Content-Type': file.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
