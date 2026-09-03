import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scrapeRanobesNovel, scrapeNovel } from '@/lib/scraper';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { chapters } = body;
    
    if (!chapters || typeof chapters !== 'number' || chapters <= 0) {
      return NextResponse.json({ error: 'Invalid chapter count' }, { status: 400 });
    }

    const novel = await prisma.novel.findUnique({
      where: { id }
    });

    if (!novel) {
      return NextResponse.json({ error: 'Novel not found' }, { status: 404 });
    }

    // Calculate max pages to fetch (25 chapters per page for Ranobes)
    const maxPages = Math.ceil(chapters / 25);
    
    let scrapedData;
    if (novel.sourceDomain === 'ranobes.net') {
      scrapedData = await scrapeRanobesNovel(novel.sourceUrl, maxPages);
    } else {
      scrapedData = await scrapeNovel(novel.sourceUrl); // Default scraper
    }

    // Upsert chapters
    let addedCount = 0;
    console.log("Scraped", scrapedData.chapters.length, "chapters from source.");
    
    for (const c of scrapedData.chapters) {
      const existing = await prisma.chapter.findFirst({
        where: {
          novelId: id,
          sourceUrl: c.url,
        }
      });
      
      if (!existing) {
        await prisma.chapter.create({
          data: {
            title: c.title,
            sourceUrl: c.url,
            chapterNumber: c.chapterNumber,
            content: '',
            novelId: id,
          }
        });
        addedCount++;
      }
    }
    
    // Update latest chapter number on Novel
    if (scrapedData.chapters.length > 0) {
      const maxChapNum = Math.max(...scrapedData.chapters.map((c: any) => c.chapterNumber));
      if (maxChapNum > novel.latestChapterNumber) {
        await prisma.novel.update({
          where: { id },
          data: { latestChapterNumber: maxChapNum }
        });
      }
    }

    return NextResponse.json({ success: true, added: addedCount });
  } catch (error: any) {
    console.error("Error syncing chapters:", error);
    return NextResponse.json({ error: error.message || 'Failed to sync' }, { status: 500 });
  }
}
