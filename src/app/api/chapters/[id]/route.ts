import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scrapeChapterContent } from '@/lib/scraper';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const chapterId = params.id;
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { novel: true }
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // If we haven't scraped the content yet, scrape and save it
    if (!chapter.content || chapter.content.trim() === '') {
      const content = await scrapeChapterContent(chapter.sourceUrl);
      
      const updated = await prisma.chapter.update({
        where: { id: chapterId },
        data: { content }
      });
      
      return NextResponse.json(updated);
    }

    return NextResponse.json(chapter);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
