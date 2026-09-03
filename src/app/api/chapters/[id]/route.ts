import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scrapeChapterContent } from '@/lib/scraper';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const chapterId = (await params).id;
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { novel: true }
    });

    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    const prevChapter = await prisma.chapter.findFirst({
      where: { novelId: chapter.novelId, chapterNumber: { lt: chapter.chapterNumber } },
      orderBy: { chapterNumber: 'desc' },
      select: { id: true }
    });

    const nextChapter = await prisma.chapter.findFirst({
      where: { novelId: chapter.novelId, chapterNumber: { gt: chapter.chapterNumber } },
      orderBy: { chapterNumber: 'asc' },
      select: { id: true }
    });

    // If we haven't scraped the content yet, scrape and save it
    if (!chapter.content || chapter.content.trim() === '') {
      const content = await scrapeChapterContent(chapter.sourceUrl);
      
      const updated = await prisma.chapter.update({
        where: { id: chapterId },
        data: { content }
      });
      
      return NextResponse.json({
        ...updated,
        prevChapterId: prevChapter?.id || null,
        nextChapterId: nextChapter?.id || null
      });
    }

    return NextResponse.json({
      ...chapter,
      prevChapterId: prevChapter?.id || null,
      nextChapterId: nextChapter?.id || null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
