import { NextResponse } from 'next/server';
import { getRecommendedResources } from '@/lib/ai-service';

export async function GET(request: Request, context: any) {
  try {
    const { id } = await context.params;
    const resources = await getRecommendedResources(id);
    return NextResponse.json({ resources });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
