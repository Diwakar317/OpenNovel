import { prisma } from './prisma';
import { scrapeNovel } from './scraper';

// Use a global variable to prevent duplicate workers during Next.js fast-refresh
const globalAny = global as any;
if (typeof globalAny.isQueueWorkerRunning === 'undefined') {
  globalAny.isQueueWorkerRunning = false;
}

export async function addSyncJob(novelId: string) {
  await prisma.syncJob.create({
    data: {
      novelId,
      status: 'PENDING'
    }
  });
  
  // Fire and forget worker
  processQueue().catch(console.error);
}

export async function processQueue() {
  if (globalAny.isQueueWorkerRunning) return;
  globalAny.isQueueWorkerRunning = true;
  
  try {
    while (true) {
      // Find the oldest pending or valid failed job
      const job = await prisma.syncJob.findFirst({
        where: {
          OR: [
            { status: 'PENDING' },
            { status: 'FAILED', nextRetry: { lte: new Date() }, retryCount: { lt: 5 } }
          ]
        },
        orderBy: { createdAt: 'asc' },
        include: { novel: true }
      });

      if (!job) break; // Queue empty

      // Mark job as processing
      await prisma.syncJob.update({
        where: { id: job.id },
        data: { status: 'PROCESSING' }
      });

      await prisma.novel.update({
        where: { id: job.novelId },
        data: { isSyncing: true }
      });

      try {
        console.log(`[Queue] Processing novel ${job.novel.title}...`);
        
        // Fetch up to 200 pages (5000 chapters) sequentially
        const fullData = await scrapeNovel(job.novel.sourceUrl, 200); 
        
        // Upsert all missing chapters
        let addedCount = 0;
        for (const c of fullData.chapters) {
          const existing = await prisma.chapter.findFirst({
            where: { novelId: job.novelId, sourceUrl: c.url }
          });
          if (!existing) {
            await prisma.chapter.create({
              data: {
                title: c.title,
                sourceUrl: c.url,
                chapterNumber: c.chapterNumber,
                content: '',
                novelId: job.novelId,
              }
            });
            addedCount++;
          }
        }

        console.log(`[Queue] Completed ${job.novel.title}. Added ${addedCount} chapters.`);
        
        // Mark complete
        await prisma.syncJob.update({
          where: { id: job.id },
          data: { status: 'COMPLETED' }
        });

      } catch (err: any) {
        console.error(`[Queue] Failed syncing ${job.novel.title}:`, err.message);
        
        // If Cloudflare blocks us, wait 5 minutes before retrying
        const nextRetry = new Date();
        nextRetry.setMinutes(nextRetry.getMinutes() + 5);

        await prisma.syncJob.update({
          where: { id: job.id },
          data: { 
            status: 'FAILED',
            retryCount: job.retryCount + 1,
            nextRetry,
            errorMsg: err.message
          }
        });
        
        console.log(`[Queue] Job paused. Will retry in 5 minutes (Retry ${job.retryCount + 1}/5).`);
      } finally {
        await prisma.novel.update({
          where: { id: job.novelId },
          data: { isSyncing: false }
        });
      }
      
      // Small pause between jobs just to be nice to the server
      await new Promise(r => setTimeout(r, 2000));
    }
  } finally {
    globalAny.isQueueWorkerRunning = false;
  }
}
