'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function markChaptersRead(novelId: string, chapterIds: string[], isRead: boolean) {
  try {
    await prisma.chapter.updateMany({
      where: { id: { in: chapterIds } },
      data: { isRead }
    });
    revalidatePath(`/novel/${novelId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error marking chapters read:", error);
    return { error: error.message };
  }
}

export async function clearChaptersContent(novelId: string, chapterIds: string[]) {
  try {
    await prisma.chapter.updateMany({
      where: { id: { in: chapterIds } },
      data: { content: '' }
    });
    revalidatePath(`/novel/${novelId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error clearing chapters:", error);
    return { error: error.message };
  }
}
