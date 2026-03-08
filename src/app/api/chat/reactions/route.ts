import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { messageId, emoji } = await request.json();
    if (!messageId || !emoji) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const existing = await (prisma as any).chatReaction.findUnique({
      where: {
        userId_messageId_emoji: {
          userId: user.userId,
          messageId,
          emoji
        }
      }
    });

    if (existing) {
      await (prisma as any).chatReaction.delete({ where: { id: existing.id } });
      return NextResponse.json({ success: true, toggled: 'off' });
    } else {
      await (prisma as any).chatReaction.create({
        data: {
          userId: user.userId,
          messageId,
          emoji
        }
      });
      return NextResponse.json({ success: true, toggled: 'on' });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
