import { NextResponse } from 'next/server';
import { getSimilarDoubts } from '@/lib/ai-service';

export async function GET(request: Request, context: any) {
  try {
    const { id } = await context.params;
    const similar = await getSimilarDoubts(id);
    return NextResponse.json({ similar });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
