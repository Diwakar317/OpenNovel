import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { scrapeNovel } from '@/lib/scraper';

// Vercel Cron Job endpoint
export async function GET(req: Request) {
  try {
    // Basic security for Vercel Cron
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    const currentHour = new Date().getHours();

    // Find novels that are expected to update in this hour
    const novelsToUpdate = await prisma.novel.findMany({
      where: {
        expectedUpdateHour: currentHour
      }
    });

    let updatedCount = 0;

    for (const novel of novelsToUpdate) {
      try {
        const scrapedData = await scrapeNovel(novel.sourceUrl);
        
        // Find new chapters
        const existingChapters = await prisma.chapter.findMany({
          where: { novelId: novel.id },
          select: { sourceUrl: true }
        });
        const existingUrls = new Set(existingChapters.map(c => c.sourceUrl));

        const newChapters = scrapedData.chapters.filter(c => !existingUrls.has(c.url));

        if (newChapters.length > 0) {
          await prisma.chapter.createMany({
            data: newChapters.map(c => ({
              novelId: novel.id,
              title: c.title,
              sourceUrl: c.url,
              chapterNumber: c.chapterNumber,
              content: ''
            }))
          });

          const maxChapter = Math.max(...scrapedData.chapters.map(c => c.chapterNumber));

          await prisma.novel.update({
            where: { id: novel.id },
            data: { 
              latestChapterNumber: maxChapter,
              lastChecked: new Date()
            }
          });
          
          updatedCount++;
        } else {
           await prisma.novel.update({
            where: { id: novel.id },
            data: { lastChecked: new Date() }
          });
        }
      } catch (err) {
        console.error(`Failed to update novel ${novel.title}:`, err);
      }
    }

    return NextResponse.json({ success: true, updatedCount, checkedCount: novelsToUpdate.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
