import ChapterReader from '@/components/ChapterReader';

export default function ChapterPage({ params }: { params: { id: string, chapterId: string } }) {
  return <ChapterReader novelId={params.id} chapterId={params.chapterId} />;
}
