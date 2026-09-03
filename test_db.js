const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const novels = await prisma.novel.findMany({ include: { chapters: true } });
  console.log(novels.map(n => ({
    id: n.id,
    title: n.title,
    domain: n.sourceDomain,
    url: n.sourceUrl,
    chapterCount: n.chapters.length
  })));
  
  // also let's manually invoke the sync logic to see if it throws any errors
  if (novels.length > 0) {
    const novel = novels[0];
    console.log("Found novel:", novel.id);
  }
}
main();
