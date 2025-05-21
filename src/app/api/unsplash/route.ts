import { searchUnsplashPhotos, getRandomUnsplashPhoto, trackUnsplashDownload } from '@/lib/unsplash';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const count = searchParams.get('count');
  const random = searchParams.get('random');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    let data;
    if (random === 'true') {
      data = await getRandomUnsplashPhoto(query);
    } else {
      data = await searchUnsplashPhotos(query, count ? parseInt(count) : 1);
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { downloadLocation } = body;

  if (!downloadLocation) {
    return NextResponse.json({ error: 'Download location is required' }, { status: 400 });
  }

  try {
    await trackUnsplashDownload(downloadLocation);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking download:', error);
    return NextResponse.json(
      { error: 'Failed to track download' },
      { status: 500 }
    );
  }
} 