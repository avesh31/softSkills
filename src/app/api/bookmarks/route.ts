import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { doubtId } = await request.json();

    if (!doubtId) {
      return NextResponse.json({ error: 'doubtId is required' }, { status: 400 });
    }

    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_doubtId: {
          userId: user.userId,
          doubtId,
        }
      }
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, toggled: 'off' });
    } else {
      const bookmark = await prisma.bookmark.create({
        data: {
          userId: user.userId,
          doubtId,
        }
      });
      return NextResponse.json({ success: true, toggled: 'on', bookmark });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: user.userId },
      include: {
        doubt: {
          include: {
            hub: true,
            author: { select: { username: true } },
            _count: { select: { answers: true, reactions: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ bookmarks });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
