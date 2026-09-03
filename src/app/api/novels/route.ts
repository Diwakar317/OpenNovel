import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scrapeNovel } from '@/lib/scraper';
import { addSyncJob } from '@/lib/syncQueue';

async function fetchImageAsBase64(url: string | null) {
  if (!url) return null;
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    return `data:${mimeType};base64,${base64}`;
  } catch (e) {
    console.error("Failed to fetch image", e);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const domain = new URL(url).hostname;
    
    // Fast initial scrape: Only fetch the first page (25 chapters)
    const scrapedData = await scrapeNovel(url, 1);
    
    // Fetch Cover as Base64 to save dependencies
    const base64Cover = await fetchImageAsBase64(scrapedData.coverImageUrl);

    const expectedUpdateHour = new Date().getHours();

    const novel = await prisma.novel.create({
      data: {
        title: scrapedData.title || 'Unknown Title',
        sourceUrl: url,
        sourceDomain: domain,
        coverImageUrl: scrapedData.coverImageUrl,
        coverImageBase64: base64Cover,
        expectedUpdateHour,
        isSyncing: true, // Mark as syncing
        latestChapterNumber: scrapedData.chapters.length > 0 
          ? Math.max(...scrapedData.chapters.map(c => c.chapterNumber))
          : 0,
        chapters: {
          create: scrapedData.chapters.map(c => ({
            title: c.title,
            sourceUrl: c.url,
            chapterNumber: c.chapterNumber,
            content: '',
          }))
        }
      }
    });

    // Push novel to the background Sync Queue
    await addSyncJob(novel.id);

    return NextResponse.json({ success: true, novel });
  } catch (error: any) {
    console.error("Error adding novel:", error);
    return NextResponse.json({ error: error.message || 'Failed to add novel' }, { status: 500 });
  }
}

export async function GET() {
  const novels = await prisma.novel.findMany({
    orderBy: { updatedAt: 'desc' }
  });
  return NextResponse.json(novels);
}
