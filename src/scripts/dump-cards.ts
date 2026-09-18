import https from 'https';
import fs from 'fs';

async function fetchHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      }
    }, (res) => {
      let data = '';
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let loc = res.headers.location;
        if (loc.startsWith('/')) loc = 'https://www.mercadolivre.com.br' + loc;
        return fetchHtml(loc).then(resolve).catch(reject);
      }
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(12000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function main() {
  const html = await fetchHtml('https://www.mercadolivre.com.br/ofertas?category=MLB1648');
  const chunks = html.split(/<div class="poly-card/i);
  console.log(`Chunks: ${chunks.length}`);
  if (chunks.length > 2) {
    fs.writeFileSync('card_chunk.html', chunks[1] + '\n\n--- CHUNK 2 ---\n\n' + chunks[2]);
    console.log('Salvo card_chunk.html');
  }
}

main().catch(console.error);
