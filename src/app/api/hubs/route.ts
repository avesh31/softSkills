import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getUserFromCookie();

    const hubs = await prisma.hub.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { followers: true, doubts: true } } as any,
      }
    });

    let userFollows: string[] = [];
    if (user) {
      const dbFollows = await (prisma as any).hubFollow.findMany({
        where: { userId: user.userId },
        select: { hubId: true }
      });
      userFollows = dbFollows.map((f: any) => f.hubId);
    }

    const hubsWithFollowStatus = hubs.map(hub => ({
      ...hub,
      isFollowing: userFollows.includes(hub.id)
    }));

    return NextResponse.json({ hubs: hubsWithFollowStatus });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, description, icon, color } = await request.json();

    if (!name || !description) {
      return NextResponse.json({ error: 'Name and description are required' }, { status: 400 });
    }

    // Check if hub already exists
    const existingHub = await prisma.hub.findUnique({ where: { name } });
    if (existingHub) {
      return NextResponse.json({ error: 'A hub with this name already exists' }, { status: 400 });
    }

    const hub = await prisma.hub.create({
      data: {
        name,
        description,
        icon: icon || '🌐',
        color: color || '#6366f1',
      }
    });

    return NextResponse.json({ success: true, hub });
  } catch (error) {
    console.error("Create Hub Error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
