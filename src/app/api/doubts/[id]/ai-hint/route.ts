import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request, context: any) {
  try {
    const { id } = await context.params;

    const doubt = await prisma.doubt.findUnique({
      where: { id },
      include: { hub: true }
    });

    if (!doubt) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Simulated AI logic
    let hint = "I'm your AI Assistant! I recommend breaking down the problem into smaller steps. Have you tried checking the official documentation or verifying your syntax?";
    
    if (doubt.hub.name === 'Programming' || doubt.hub.name === 'Web Development') {
      hint = "AI Hint: Check for any console errors in your browser developer tools or terminal. Make sure all asynchronous operations (like fetch or database calls) are properly awaited.";
    } else if (doubt.hub.name === 'Mathematics') {
      hint = "AI Hint: Try working backwards from the solution, or see if substituting simple numbers helps reveal the underlying formula pattern.";
    }

    // Add a small delay to simulate generation
    await new Promise(resolve => setTimeout(resolve, 800));

    return NextResponse.json({ hint });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
