import * as cheerio from 'cheerio';

export interface ScrapedChapter {
  title: string;
  url: string;
  chapterNumber: number;
}

export interface ScrapedNovel {
  title: string;
  coverImageUrl: string | null;
  chapters: ScrapedChapter[];
}

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

/**
 * Fetches HTML and loads it into cheerio
 */
async function fetchHTML(url: string) {
  const response = await fetch(url, { headers: DEFAULT_HEADERS });
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  const html = await response.text();
  return cheerio.load(html);
}

/**
 * Scrapes NovelArrow for novel data and chapters
 */
export async function scrapeNovelArrowNovel(url: string): Promise<ScrapedNovel> {
  const $ = await fetchHTML(url);
  
  // Try to extract Next.js data
  const nextDataScript = $('#__NEXT_DATA__').html();
  if (nextDataScript) {
    try {
      const data = JSON.parse(nextDataScript);
      // Depending on structure, extract here. As a fallback, we parse DOM.
    } catch (e) {
      console.warn("Failed to parse NEXT_DATA", e);
    }
  }

  // Fallback DOM parsing
  const title = $('h1').first().text().trim();
  const coverImageUrl = $('img').first().attr('src') || null; // Usually the first big image is the cover
  
  const chapters: ScrapedChapter[] = [];
  // Find links that look like chapters
  $('a[href*="/chapter/"]').each((i, el) => {
    const chapUrl = $(el).attr('href');
    const chapTitle = $(el).text().trim();
    if (chapUrl) {
      // Very basic chapter number extraction from title or URL
      const numMatch = chapTitle.match(/\d+/) || chapUrl.match(/\d+/);
      const chapterNumber = numMatch ? parseFloat(numMatch[0]) : i + 1;
      
      // Ensure absolute URL
      const absoluteUrl = chapUrl.startsWith('http') ? chapUrl : `https://novelarrow.com${chapUrl.startsWith('/') ? '' : '/'}${chapUrl}`;
      
      chapters.push({
        title: chapTitle || `Chapter ${chapterNumber}`,
        url: absoluteUrl,
        chapterNumber,
      });
    }
  });

  return { title, coverImageUrl, chapters: chapters.reverse() }; // Usually listed newest first, we want oldest first
}

/**
 * Scrapes Ranobes for novel data and chapters
 */
export async function scrapeRanobesNovel(url: string): Promise<ScrapedNovel> {
  const $ = await fetchHTML(url);
  
  let title = $('meta[property="og:title"]').attr('content') || $('h1').first().text().trim();
  title = title.split('•')[0].trim();

  let coverImageUrl = $('meta[property="og:image"]').attr('content') || $('.poster img').attr('src') || null;
  if (coverImageUrl && coverImageUrl.startsWith('/')) {
    coverImageUrl = `https://ranobes.net${coverImageUrl}`;
  }
  
  const chapters: ScrapedChapter[] = [];
  
  // Extract ID to fetch from the dedicated chapters endpoint
  const idMatch = url.match(/ranobes\.net\/(?:novels\/)?(\d+)/);
  if (idMatch) {
    const novelId = idMatch[1];
    
    // Helper function to fetch and parse a specific chapter page
    const fetchChapterPage = async (pageUrl: string) => {
      try {
        const res = await fetch(pageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
          }
        });
        const html = await res.text();
        const match = html.match(/<script[^>]*>\s*window\.__DATA__\s*=\s*([\s\S]+?)<\/script>/i);
        if (match) {
          let jsonStr = match[1].trim();
          if (jsonStr.endsWith(';')) jsonStr = jsonStr.slice(0, -1);
          return JSON.parse(jsonStr);
        }
      } catch (e) {
        console.warn(`Failed to fetch chapter page ${pageUrl}:`, e);
      }
      return null;
    };

    const firstPageData = await fetchChapterPage(`https://ranobes.net/chapters/${novelId}/`);
    
    if (firstPageData && firstPageData.chapters && Array.isArray(firstPageData.chapters)) {
      let allChaptersData = [...firstPageData.chapters];
      const totalPages = firstPageData.pages_count || 1;
      
      if (totalPages > 1) {
        // Fetch remaining pages in batches of 5 to speed up without hitting strict rate limits
        for (let i = 2; i <= totalPages; i += 5) {
          const batchPromises = [];
          for (let j = 0; j < 5 && (i + j) <= totalPages; j++) {
            batchPromises.push(fetchChapterPage(`https://ranobes.net/chapters/${novelId}/page/${i + j}/`));
          }
          const batchResults = await Promise.all(batchPromises);
          for (const data of batchResults) {
            if (data && data.chapters && Array.isArray(data.chapters)) {
              allChaptersData = allChaptersData.concat(data.chapters);
            }
          }
        }
      }

      // Process all collected chapter JSON objects
      allChaptersData.forEach((c: any) => {
        const cleanTitle = c.title.trim();
        if (/^chapter\s*\d+/i.test(cleanTitle)) {
          const numMatch = cleanTitle.match(/\d+/);
          const chapterNumber = numMatch ? parseFloat(numMatch[0]) : chapters.length + 1;
          
          if (!chapters.find(existing => existing.url === c.link)) {
            chapters.push({
              title: cleanTitle,
              url: c.link,
              chapterNumber
            });
          }
        }
      });
    }
  }

  // Fallback to static HTML scraping if the chapters API failed or returned nothing
  if (chapters.length === 0) {
    $('a[href*=".html"]').each((i, el) => {
      const chapUrl = $(el).attr('href');
      const chapTitle = $(el).text().trim();
      
      if (chapUrl && !chapUrl.includes('/search.html') && !chapUrl.includes('/rules.html') && !chapUrl.includes('#comment')) {
         // Strictly match 'Chapter [number]' to avoid junk
         if (/^chapter\s*\d+/i.test(chapTitle)) {
           const numMatch = chapTitle.match(/\d+/);
           const chapterNumber = numMatch ? parseFloat(numMatch[0]) : chapters.length + 1;
           
           const absoluteUrl = chapUrl.startsWith('http') ? chapUrl : `https://ranobes.net${chapUrl.startsWith('/') ? '' : '/'}${chapUrl}`;
           
           if (!chapters.find(c => c.url === absoluteUrl)) {
             chapters.push({
               title: chapTitle,
               url: absoluteUrl,
               chapterNumber
             });
           }
         }
      }
    });
  }

  // Sort chapters by number ascending (oldest first)
  chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);

  return { title, coverImageUrl, chapters };
}

/**
 * Universal dispatcher
 */
export async function scrapeNovel(url: string): Promise<ScrapedNovel> {
  if (url.includes('novelarrow.com')) return scrapeNovelArrowNovel(url);
  if (url.includes('ranobes.net')) return scrapeRanobesNovel(url);
  throw new Error("Unsupported domain");
}

/**
 * Universal chapter content scraper
 */
export async function scrapeChapterContent(url: string): Promise<string> {
  const $ = await fetchHTML(url);
  
  let contentHtml = '';
  if (url.includes('novelarrow.com')) {
    // Usually the main text is in paragraphs in a container
    // We try to find the biggest text container
    contentHtml = $('article').html() || $('.prose').html() || '';
  } else if (url.includes('ranobes.net')) {
    contentHtml = $('#arrticle, .text').html() || '';
  }

  if (!contentHtml) {
    // Generic fallback: just grab all paragraphs in the main tag
    contentHtml = $('main p').map((i, el) => $.html(el)).get().join('\n');
  }

  // Basic cleanup: remove scripts and ads
  const clean$ = cheerio.load(contentHtml);
  clean$('script, iframe, .ads, .advertisement').remove();
  
  return clean$.html();
}
