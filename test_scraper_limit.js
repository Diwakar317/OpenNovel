const { scrapeRanobesNovel } = require('./src/lib/scraper.ts');
// Actually ts-node is broken. Let's just write the scraper logic here.
async function test() {
  const url = "https://ranobes.net/novels/1205557-constellation-door-v741610.html";
  const idMatch = url.match(/ranobes\.net\/(?:novels\/)?(\d+)/);
  const novelId = idMatch[1];
  
  const fetchChapterPage = async (pageUrl) => {
    const res = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const match = html.match(/<script[^>]*>\s*window\.__DATA__\s*=\s*([\s\S]+?)<\/script>/i);
    if (match) {
      let jsonStr = match[1].trim();
      if (jsonStr.endsWith(';')) jsonStr = jsonStr.slice(0, -1);
      return JSON.parse(jsonStr);
    }
    return null;
  };
  
  const firstPageData = await fetchChapterPage(`https://ranobes.net/chapters/${novelId}/`);
  if (!firstPageData) { console.log("Failed to fetch first page data!"); return; }
  let allChaptersData = [...firstPageData.chapters];
  const maxPages = 40; // 1000 chapters
  const totalPages = firstPageData.pages_count || 1;
  const targetPages = maxPages ? Math.min(totalPages, maxPages) : totalPages;
  console.log("Total Pages in source:", totalPages, "Target:", targetPages);
  
  if (targetPages > 1) {
    for (let i = 2; i <= targetPages; i++) {
      const data = await fetchChapterPage(`https://ranobes.net/chapters/${novelId}/page/${i}/`);
      if (data && data.chapters && Array.isArray(data.chapters)) {
        allChaptersData = allChaptersData.concat(data.chapters);
        console.log(`Fetched page ${i} - ${data.chapters.length} chapters.`);
      } else {
        console.log(`Failed to fetch page ${i}. Stopping pagination to avoid IP ban.`);
        break; // Stop fetching if we hit a rate limit
      }
      // Delay 300ms to avoid rate limits
      await new Promise(r => setTimeout(r, 300));
    }
  }
  
  const chapters = [];
  allChaptersData.forEach((c) => {
    const cleanTitle = c.title.trim();
    if (/^chapter\s*\d+/i.test(cleanTitle)) {
      if (!chapters.find(existing => existing.url === c.link)) {
        chapters.push({ title: cleanTitle });
      }
    }
  });
  console.log("Total scraped and filtered chapters:", chapters.length);
}
test();
