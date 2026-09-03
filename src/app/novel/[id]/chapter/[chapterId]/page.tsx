import ChapterReader from '@/components/ChapterReader';

export default async function ChapterPage({ params }: { params: Promise<{ id: string, chapterId: string }> }) {
  const { id, chapterId } = await params;
  return <ChapterReader novelId={id} chapterId={chapterId} />;
}
