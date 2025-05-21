import { NextRequest, NextResponse } from 'next/server';
import { searchPhotos, getRandomPhoto, trackPhotoDownload } from '@/lib/unsplash';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  const query = searchParams.get('query') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const perPage = parseInt(searchParams.get('perPage') || '20', 10);

  try {
    if (action === 'search' && query) {
      const result = await searchPhotos(query, page, perPage);
      
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      
      return NextResponse.json(result);
    }
    
    if (action === 'random') {
      const result = await getRandomPhoto(query || undefined);
      
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      
      return NextResponse.json(result);
    }
    
    if (action === 'trackDownload') {
      const downloadLocation = searchParams.get('downloadLocation');
      
      if (!downloadLocation) {
        return NextResponse.json(
          { error: 'Download location is required' }, 
          { status: 400 }
        );
      }
      
      const result = await trackPhotoDownload(downloadLocation);
      
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      
      return NextResponse.json(result);
    }
    
    return NextResponse.json(
      { error: 'Invalid action. Use "search", "random", or "trackDownload"' }, 
      { status: 400 }
    );
  } catch (error) {
    console.error('Unsplash API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' }, 
      { status: 500 }
    );
  }
} 