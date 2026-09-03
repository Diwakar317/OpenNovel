const { scrapeRanobesNovel } = require('./src/lib/scraper.ts');
// since scraper is TS, we need to compile it or use ts-node properly.
// let's use the compiled version if available, or just use ts-node via command.
