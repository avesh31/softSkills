import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromCookie } from '@/lib/auth';

export async function PATCH(request: Request, context: any) {
  try {
    const user = await getUserFromCookie();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify Admin
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser || (dbUser as any).role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await context.params;
    const { action } = await request.json(); // 'APPROVE' or 'REJECT'

    const hubRequest = await prisma.hubRequest.findUnique({ where: { id } });
    if (!hubRequest) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    if (hubRequest.status !== 'PENDING') return NextResponse.json({ error: 'Request already processed' }, { status: 400 });

    if (action === 'APPROVE') {
      // 1. Mark as Approved
      await prisma.hubRequest.update({
        where: { id },
        data: { status: 'APPROVED' }
      });

      // 2. Create the new Hub
      const newHub = await prisma.hub.create({
        data: {
          name: hubRequest.name,
          description: hubRequest.description,
          color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0') // Random color
        }
      });

      // 3. Notify the user
      await prisma.notification.create({
        data: {
          userId: hubRequest.userId,
          message: `Your request for the "${hubRequest.name}" hub was approved!`,
          type: 'system',
          link: `/hub/${newHub.id}`
        }
      });

      return NextResponse.json({ success: true, hub: newHub });
    } else if (action === 'REJECT') {
      await prisma.hubRequest.update({
        where: { id },
        data: { status: 'REJECTED' }
      });

      // Notify the user
      await prisma.notification.create({
        data: {
          userId: hubRequest.userId,
          message: `Your request for the "${hubRequest.name}" hub was declined.`,
          type: 'system'
        }
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
