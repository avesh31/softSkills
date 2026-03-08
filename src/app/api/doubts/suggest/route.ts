import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const suggestions = await prisma.doubt.findMany({
      where: {
        title: {
          contains: query
        }
      },
      select: {
        id: true,
        title: true,
        status: true,
        views: true,
        _count: { select: { answers: true } }
      },
      take: 5,
      orderBy: { views: 'desc' }
    });

    return NextResponse.json({ suggestions });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
