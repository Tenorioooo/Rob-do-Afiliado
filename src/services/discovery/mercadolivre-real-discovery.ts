import https from "https";
import { RawMarketplaceItem } from "@/domain/products/types";

export interface MLDiscoveryOptions {
  categories?: string[];
  query?: string;
  limit?: number;
}

export class MercadoLivreRealDiscovery {
  private static readonly CATEGORY_URLS: Record<string, string> = {
    eletronicos: "https://www.mercadolivre.com.br/ofertas?category=MLB1055",
    informatica: "https://www.mercadolivre.com.br/ofertas?category=MLB1648",
    celulares: "https://www.mercadolivre.com.br/ofertas?category=MLB1051",
    casa: "https://www.mercadolivre.com.br/ofertas?category=MLB1574",
    beleza: "https://www.mercadolivre.com.br/ofertas?category=MLB1246",
    ferramentas: "https://www.mercadolivre.com.br/ofertas?category=MLB1500",
    moda: "https://www.mercadolivre.com.br/ofertas?category=MLB1430",
    games: "https://www.mercadolivre.com.br/ofertas?category=MLB1144",
  };

  /**
   * Fetches real raw HTML from Mercado Livre Brasil.
   */
  static async fetchHtml(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const req = https.get(
        url,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            "Cache-Control": "no-cache",
          },
        },
        (res) => {
          let data = "";
          if (
            res.statusCode &&
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            let nextUrl = res.headers.location;
            if (nextUrl.startsWith("/")) nextUrl = "https://www.mercadolivre.com.br" + nextUrl;
            return this.fetchHtml(nextUrl).then(resolve).catch(reject);
          }
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => resolve(data));
        }
      );

      req.on("error", (err) => reject(err));
      req.setTimeout(12000, () => {
        req.destroy();
        reject(new Error("Timeout ao conectar com Mercado Livre"));
      });
    });
  }

  /**
   * Parses poly-card and promotion items from Mercado Livre HTML into RawMarketplaceItem.
   */
  static parseHtml(html: string, fallbackCategory: string = "Geral"): RawMarketplaceItem[] {
    const items: RawMarketplaceItem[] = [];
    const cardChunks = html.split(/<div class="poly-card/i);

    for (let i = 1; i < cardChunks.length; i++) {
      const card = cardChunks[i];

      // 1. Link e Título
      const titleMatch =
        card.match(/<a[^>]*class="poly-component__title"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i) ||
        card.match(/<a[^>]*href="([^"]+)"[^>]*class="poly-component__title"[^>]*>([\s\S]*?)<\/a>/i) ||
        card.match(/class="poly-component__title"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);

      if (!titleMatch) continue;

      let rawUrl = titleMatch[1];
      if (rawUrl.startsWith("//")) rawUrl = "https:" + rawUrl;
      const cleanUrl = rawUrl.split("#")[0].split("?")[0];
      const rawTitle = titleMatch[2]
        .replace(/<[^>]+>/g, "")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .trim();

      if (!rawTitle || rawTitle.length < 5) continue;

      // 2. Extrair ID (MLB...)
      const idMatch =
        cleanUrl.match(/(MLB-?\d+)/i) ||
        card.match(/wid=(MLB\d+)/i) ||
        cleanUrl.match(/p\/(MLB\d+)/i) ||
        rawUrl.match(/(MLB-?\d+)/i);
      const externalId = idMatch ? idMatch[1].replace("-", "") : `MLB_${Date.now()}_${i}`;

      // 3. Imagem Real
      const imgMatch =
        card.match(/(https:\/\/http2\.mlstatic\.com\/D_[^"\s\>]+)/i) ||
        card.match(/src="([^"]*(?:mlstatic\.com|http2\.mlstatic)[^"]*)"/i) ||
        card.match(/data-src="([^"]*(?:mlstatic\.com|http2\.mlstatic)[^"]*)"/i) ||
        card.match(/<img[^>]*src="([^"]+)"/i);

      const imageUrl = imgMatch
        ? imgMatch[1].replace("http://", "https://").replace(/&amp;/g, "&")
        : "https://http2.mlstatic.com/frontend-assets/ui-navigation/5.21.22/mercadolibre/logo__large_plus.png";

      // 4. Preço Atual
      const currentPriceMatch =
        card.match(/class="poly-price__current"[\s\S]*?class="andes-money-amount__fraction"[^>]*>([^<]+)<\/span>/i) ||
        card.match(/class="andes-money-amount__fraction"[^>]*>([^<]+)<\/span>/i);

      if (!currentPriceMatch) continue;

      const currentPrice = parseFloat(currentPriceMatch[1].replace(/\./g, "").replace(",", "."));
      if (isNaN(currentPrice) || currentPrice <= 0) continue;

      // 5. Desconto
      const discountMatch =
        card.match(/class="polylabel-pill"[^>]*>(\d+)%\s*OFF<\/span>/i) ||
        card.match(/(\d+)%\s*OFF/i);
      let discountPercent = discountMatch ? parseInt(discountMatch[1], 10) : 0;

      // 6. Preço Original (Antes)
      const prevPriceMatch = card.match(
        /class="andes-money-amount--previous[\s\S]*?class="andes-money-amount__fraction"[^>]*>([^<]+)<\/span>/i
      );
      let originalPrice = currentPrice;
      if (prevPriceMatch) {
        const parsedPrev = parseFloat(prevPriceMatch[1].replace(/\./g, "").replace(",", "."));
        if (!isNaN(parsedPrev) && parsedPrev > currentPrice) {
          originalPrice = parsedPrev;
        }
      }
      if (originalPrice === currentPrice && discountPercent > 0) {
        originalPrice = Number((currentPrice / (1 - discountPercent / 100)).toFixed(2));
      } else if (originalPrice > currentPrice && discountPercent === 0) {
        discountPercent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
      }

      // 7. Avaliação e Vendas
      const ratingMatch =
        card.match(/class="polylabel-label polylabel-fs-xs polylabel-fw-regular">([\d\.]+)<\/span>/i) ||
        card.match(/aria-label="Classificação ([\d\.]+) de 5 estrelas"/i);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 4.8;

      const salesMatch =
        card.match(/\|\s*\+?([\d\.]+)mil?\s*vendidos/i) ||
        card.match(/Mais de ([\d\.]+)mil produtos vendidos/i);
      let salesCount = 100;
      if (salesMatch) {
        const val = parseFloat(salesMatch[1].replace(",", "."));
        salesCount = Math.round(val * 1000);
      }

      // 8. Selos (FULL, Frete Grátis, Tag)
      const isFull = card.includes("poly_full") || card.includes("FULL");
      const freeShipping = card.includes("grátis") || card.includes("Gratis");

      const labelMatch = card.match(/class="polylabel-fs-xs polylabel-fw-semibold">([^<]+)<\/span>/i);
      const tag = labelMatch ? labelMatch[1].trim() : undefined;

      // Classificação de Categoria Inteligente
      let category = fallbackCategory;
      const lowerTitle = rawTitle.toLowerCase();
      if (
        lowerTitle.includes("notebook") ||
        lowerTitle.includes("computador") ||
        lowerTitle.includes("intel") ||
        lowerTitle.includes("ssd") ||
        lowerTitle.includes("teclado") ||
        lowerTitle.includes("mouse") ||
        lowerTitle.includes("monitor") ||
        lowerTitle.includes("ryzen")
      ) {
        category = "Informática";
      } else if (
        lowerTitle.includes("smartphone") ||
        lowerTitle.includes("celular") ||
        lowerTitle.includes("iphone") ||
        lowerTitle.includes("samsung") ||
        lowerTitle.includes("fone") ||
        lowerTitle.includes("power bank") ||
        lowerTitle.includes("smartwatch") ||
        lowerTitle.includes("bluetooth") ||
        lowerTitle.includes("caixa de som") ||
        lowerTitle.includes("alexa")
      ) {
        category = "Eletrônicos";
      } else if (
        lowerTitle.includes("air fryer") ||
        lowerTitle.includes("cafeteira") ||
        lowerTitle.includes("aspirador") ||
        lowerTitle.includes("cozinha") ||
        lowerTitle.includes("panela") ||
        lowerTitle.includes("geladeira") ||
        lowerTitle.includes("ventilador") ||
        lowerTitle.includes("fritadeira")
      ) {
        category = "Casa e Cozinha";
      } else if (
        lowerTitle.includes("solda") ||
        lowerTitle.includes("furadeira") ||
        lowerTitle.includes("ferramenta") ||
        lowerTitle.includes("manta") ||
        lowerTitle.includes("parafusadeira")
      ) {
        category = "Ferramentas";
      } else if (
        lowerTitle.includes("massageador") ||
        lowerTitle.includes("secador") ||
        lowerTitle.includes("perfume") ||
        lowerTitle.includes("creme") ||
        lowerTitle.includes("barbeador") ||
        lowerTitle.includes("escova secadora")
      ) {
        category = "Beleza e Saúde";
      } else if (
        lowerTitle.includes("tenis") ||
        lowerTitle.includes("camisa") ||
        lowerTitle.includes("mochila") ||
        lowerTitle.includes("relogio") ||
        lowerTitle.includes("jaqueta")
      ) {
        category = "Moda";
      }

      // Comissão padrão do Mercado Livre Brasil (~9%)
      const commissionRate = 0.09;
      const commissionAmount = Number((currentPrice * commissionRate).toFixed(2));

      items.push({
        externalId,
        platform: "MERCADO_LIVRE",
        title: rawTitle,
        description: rawTitle,
        category,
        imageUrl,
        price: currentPrice,
        originalPrice,
        discountPercentage: discountPercent,
        currency: "BRL",
        rating,
        salesCount,
        commissionRate,
        commissionAmount,
        trendIndicator: Math.min(95, 70 + Math.floor(discountPercent / 2)),
        productUrl: cleanUrl,
        inStock: true,
        rawMetadata: {
          isFull,
          freeShipping,
          tag,
          source: "mercadolivre_live_offers",
          capturedAt: new Date().toISOString(),
        },
      });
    }

    return items;
  }

  /**
   * Scans real products from Mercado Livre.
   */
  static async discoverProducts(options?: MLDiscoveryOptions): Promise<RawMarketplaceItem[]> {
    const urlsToFetch: { url: string; category: string }[] = [];

    if (options?.query && options.query.trim().length > 0) {
      urlsToFetch.push({
        url: `https://lista.mercadolivre.com.br/${encodeURIComponent(options.query.trim())}`,
        category: "Geral",
      });
    } else if (options?.categories && options.categories.length > 0) {
      for (const cat of options.categories) {
        const normalizedKey = cat
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        let matchedUrl = "https://www.mercadolivre.com.br/ofertas";
        for (const [key, u] of Object.entries(this.CATEGORY_URLS)) {
          if (normalizedKey.includes(key)) {
            matchedUrl = u;
            break;
          }
        }
        urlsToFetch.push({ url: matchedUrl, category: cat });
      }
    }

    // Default: Ofertas do dia gerais
    if (urlsToFetch.length === 0) {
      urlsToFetch.push(
        { url: "https://www.mercadolivre.com.br/ofertas", category: "Ofertas em Destaque" },
        { url: "https://www.mercadolivre.com.br/ofertas?category=MLB1055", category: "Eletrônicos" },
        { url: "https://www.mercadolivre.com.br/ofertas?category=MLB1574", category: "Casa e Cozinha" }
      );
    }

    const allItems: RawMarketplaceItem[] = [];
    const seenIds = new Set<string>();

    for (const target of urlsToFetch) {
      try {
        const html = await this.fetchHtml(target.url);
        const parsed = this.parseHtml(html, target.category);
        for (const item of parsed) {
          if (!seenIds.has(item.externalId)) {
            seenIds.add(item.externalId);
            allItems.push(item);
          }
        }
      } catch (err) {
        console.warn(`[MLDiscovery] Erro ao buscar ${target.url}:`, err);
      }
    }

    const limit = options?.limit || 50;
    return allItems.slice(0, limit);
  }
}
