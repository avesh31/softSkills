import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { hubId } = await request.json();
    if (!hubId) return NextResponse.json({ error: 'Hub ID is required' }, { status: 400 });

    // Check if following
    const existingFollow = await prisma.hubFollow.findUnique({
      where: {
        userId_hubId: { userId: user.userId, hubId }
      }
    });

    if (existingFollow) {
      // Unfollow
      await prisma.hubFollow.delete({
        where: { userId_hubId: { userId: user.userId, hubId } }
      });
      return NextResponse.json({ success: true, isFollowing: false });
    } else {
      // Follow
      await prisma.hubFollow.create({
        data: { userId: user.userId, hubId }
      });
      return NextResponse.json({ success: true, isFollowing: true });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
