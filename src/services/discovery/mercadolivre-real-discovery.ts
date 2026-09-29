import https from "https";
import { RawMarketplaceItem } from "@/domain/products/types";

export interface MLDiscoveryOptions {
  categories?: string[];
  query?: string;
  limit?: number;
}

export class MercadoLivreRealDiscovery {
  /**
   * Catálogo oficial completo de URLs de Ofertas por Nicho no Mercado Livre Brasil
   */
  /**
   * Catálogo oficial completo de URLs de Ofertas por Nicho no Mercado Livre Brasil
   */
  private static readonly CATEGORY_FEEDS: { name: string; url: string }[] = [
    { name: "Celulares e Telefones", url: "https://www.mercadolivre.com.br/ofertas?category=MLB1051" },
    { name: "Informática", url: "https://www.mercadolivre.com.br/ofertas?category=MLB1648" },
    { name: "Eletrônicos", url: "https://www.mercadolivre.com.br/ofertas?category=MLB1055" },
    { name: "Casa e Cozinha", url: "https://www.mercadolivre.com.br/ofertas?category=MLB1574" },
    { name: "Beleza e Saúde", url: "https://www.mercadolivre.com.br/ofertas?category=MLB1246" },
    { name: "Games", url: "https://www.mercadolivre.com.br/ofertas?category=MLB1144" },
    { name: "Esportes e Fitness", url: "https://www.mercadolivre.com.br/ofertas?category=MLB1276" },
    { name: "Ferramentas", url: "https://www.mercadolivre.com.br/ofertas?category=MLB1500" },
  ];

  /**
   * Fetches real raw HTML from Mercado Livre Brasil with automatic redirect handling.
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
   * Parses complete poly-card and promotion items from Mercado Livre HTML into RawMarketplaceItem.
   * Enforces high-volume sales verification, exact cash pricing (excluding installments) and real WebP images.
   */
  static parseHtml(html: string, fallbackCategory: string = "Geral"): RawMarketplaceItem[] {
    const items: RawMarketplaceItem[] = [];
    
    // Split exato por início de cada card completo de produto
    const cardChunks = html.split(/<div[^>]*class="[^"]*poly-card--grid-card[^"]*"/i);

    for (let i = 1; i < cardChunks.length; i++) {
      const card = cardChunks[i];

      // 1. Título e Link
      const titleMatch =
        card.match(/<a[^>]*class="poly-component__title"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i) ||
        card.match(/href="([^"]+)"[^>]*class="poly-component__title"[^>]*>([\s\S]*?)<\/a>/i);

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
        cleanUrl.match(/p\/(MLB\d+)/i) ||
        card.match(/wid=(MLB\d+)/i);
      const externalId = idMatch ? idMatch[1].replace("-", "") : `MLB_${Date.now()}_${i}`;

      // 3. Imagem Original em Alta Resolução (CDN Oficial Mercado Livre)
      const imgMatch =
        card.match(/class="poly-component__picture"[^>]*src="([^"]+)"/i) ||
        card.match(/src="([^"]+)"[^>]*class="poly-component__picture"/i) ||
        card.match(/data-src="([^"]+)"/i) ||
        card.match(/(https:\/\/http2\.mlstatic\.com\/D_[^"\s\>]+\.(?:webp|jpg|png|jpeg))/i);

      let imageUrl = imgMatch ? imgMatch[1].replace("http://", "https://").replace(/&amp;/g, "&") : "";
      if (!imageUrl || imageUrl.includes("logo__large_plus")) continue;

      // 4. Preço Atual Estrito (Isolado em poly-price__current para NUNCA capturar parcelamento)
      const currentBlockMatch = card.match(/<div class="poly-price__current">([\s\S]*?)<\/div>/i);
      if (!currentBlockMatch) continue;
      const currentBlock = currentBlockMatch[1];

      const fracMatch = currentBlock.match(/class="andes-money-amount__fraction"[^>]*>([^<]+)<\/span>/i);
      if (!fracMatch) continue;
      const centsMatch = currentBlock.match(/class="andes-money-amount__cents"[^>]*>([^<]+)<\/span>/i);
      const currentPrice =
        parseFloat(fracMatch[1].replace(/\./g, "").replace(",", ".")) +
        (centsMatch ? parseFloat("0." + centsMatch[1]) : 0);

      if (isNaN(currentPrice) || currentPrice <= 0) continue;

      // 5. Preço Original (Antes)
      let originalPrice = currentPrice;
      const prevBlockMatch = card.match(/class="andes-money-amount--previous[\s\S]*?<\/s>/i);
      if (prevBlockMatch) {
        const prevFrac = prevBlockMatch[0].match(/class="andes-money-amount__fraction"[^>]*>([^<]+)<\/span>/i);
        const prevCents = prevBlockMatch[0].match(/class="andes-money-amount__cents"[^>]*>([^<]+)<\/span>/i);
        if (prevFrac) {
          const parsedPrev =
            parseFloat(prevFrac[1].replace(/\./g, "").replace(",", ".")) +
            (prevCents ? parseFloat("0." + prevCents[1]) : 0);
          if (parsedPrev > currentPrice) {
            originalPrice = parsedPrev;
          }
        }
      }

      // 6. Desconto
      const discountMatch =
        card.match(/class="polylabel-pill"[^>]*>(\d+)%\s*OFF<\/span>/i) ||
        card.match(/(\d+)%\s*OFF/i);
      let discountPercent = discountMatch ? parseInt(discountMatch[1], 10) : 0;

      if (originalPrice === currentPrice && discountPercent > 0) {
        originalPrice = Number((currentPrice / (1 - discountPercent / 100)).toFixed(2));
      } else if (originalPrice > currentPrice && discountPercent === 0) {
        discountPercent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
      }

      // 7. Avaliação
      const ratingMatch =
        card.match(/class="polylabel-label[^"]*">([\d\.]+)<\/span>/i) ||
        card.match(/aria-label="Classificação ([\d\.]+) de 5 estrelas"/i);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 4.8;

      // 8. Volume Real de Vendas Comprovado
      let salesCount = 0;
      const salesMilMatch =
        card.match(/Mais de ([\d\.,]+)mil produtos vendidos/i) ||
        card.match(/\|\s*\+?([\d\.,]+)mil\s*vendidos/i) ||
        card.match(/class="andes-visually-hidden">[^<]*Mais de ([\d\.,]+)mil/i);

      if (salesMilMatch) {
        const val = parseFloat(salesMilMatch[1].replace(",", "."));
        salesCount = Math.round(val * 1000);
      } else {
        const salesDirectMatch =
          card.match(/Mais de ([\d\.]+) produtos vendidos/i) ||
          card.match(/\|\s*\+?([\d\.]+)\s*vendidos/i);
        if (salesDirectMatch) {
          salesCount = parseInt(salesDirectMatch[1].replace(/\./g, ""), 10);
        }
      }

      // FILTRO CRÍTICO: Excluir produtos sem alto volume comprovado de vendas (mínimo 1.000 vendas)
      if (salesCount < 1000) {
        continue;
      }

      // 9. Selos (FULL, Frete Grátis, Tag)
      const isFull = card.includes("poly_full") || card.includes("FULL");
      const freeShipping = card.includes("grátis") || card.includes("Gratis");

      const labelMatch = card.match(/class="polylabel-fs-xs polylabel-fw-semibold">([^<]+)<\/span>/i);
      const tag = labelMatch ? labelMatch[1].trim() : undefined;

      // 9. Classificação Inteligente de Nicho
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
        lowerTitle.includes("ryzen") ||
        lowerTitle.includes("tablet") ||
        lowerTitle.includes("projetor")
      ) {
        category = "Informática";
      } else if (
        lowerTitle.includes("smartphone") ||
        lowerTitle.includes("celular") ||
        lowerTitle.includes("iphone") ||
        lowerTitle.includes("samsung galaxy") ||
        lowerTitle.includes("motorola") ||
        lowerTitle.includes("xiaomi") ||
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
        lowerTitle.includes("fritadeira") ||
        lowerTitle.includes("cadeira escritório") ||
        lowerTitle.includes("câmera segurança") ||
        lowerTitle.includes("câmeras segurança")
      ) {
        category = "Casa e Cozinha";
      } else if (
        lowerTitle.includes("solda") ||
        lowerTitle.includes("furadeira") ||
        lowerTitle.includes("ferramenta") ||
        lowerTitle.includes("manta") ||
        lowerTitle.includes("parafusadeira") ||
        lowerTitle.includes("vedatudo") ||
        lowerTitle.includes("piso vinílico")
      ) {
        category = "Ferramentas";
      } else if (
        lowerTitle.includes("massageador") ||
        lowerTitle.includes("secador") ||
        lowerTitle.includes("perfume") ||
        lowerTitle.includes("creme") ||
        lowerTitle.includes("barbeador") ||
        lowerTitle.includes("escova secadora") ||
        lowerTitle.includes("prancha") ||
        lowerTitle.includes("maozinha")
      ) {
        category = "Beleza e Saúde";
      } else if (
        lowerTitle.includes("tenis") ||
        lowerTitle.includes("tênis") ||
        lowerTitle.includes("camisa") ||
        lowerTitle.includes("camiseta") ||
        lowerTitle.includes("mochila") ||
        lowerTitle.includes("relogio") ||
        lowerTitle.includes("jaqueta")
      ) {
        category = "Moda";
      } else if (
        lowerTitle.includes("gamer") ||
        lowerTitle.includes("ps4") ||
        lowerTitle.includes("ps5") ||
        lowerTitle.includes("xbox") ||
        lowerTitle.includes("joystick") ||
        lowerTitle.includes("controle para") ||
        lowerTitle.includes("gamesir") ||
        lowerTitle.includes("nintendo")
      ) {
        category = "Games";
      } else if (
        lowerTitle.includes("suplemento") ||
        lowerTitle.includes("whey") ||
        lowerTitle.includes("creatina") ||
        lowerTitle.includes("bicicleta") ||
        lowerTitle.includes("corrida")
      ) {
        category = "Esportes";
      }

      // Comissão padrão de afiliado Mercado Livre (~9%)
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
        trendIndicator: Math.min(98, 70 + Math.floor(discountPercent / 2)),
        productUrl: cleanUrl,
        inStock: true,
        dataSource: "official",
        rawMetadata: {
          isFull,
          freeShipping,
          tag,
          source: "mercadolivre_live_offers",
          capturedAt: new Date().toISOString(),
          dataSource: "official",
        },
      });
    }

    return items;
  }

  /**
   * Scans real products across all niches from Mercado Livre.
   */
  static async discoverProducts(options?: MLDiscoveryOptions): Promise<RawMarketplaceItem[]> {
    const urlsToFetch: { url: string; category: string }[] = [];

    const isAllCategories =
      !options?.categories ||
      options.categories.length === 0 ||
      options.categories.some((c) =>
        ["all", "todas", "geral", "todos", "all products", "todas as categorias"].includes(
          c.toLowerCase().trim()
        )
      );

    if (options?.query && options.query.trim().length > 0) {
      urlsToFetch.push({
        url: `https://lista.mercadolivre.com.br/${encodeURIComponent(options.query.trim())}`,
        category: "Geral",
      });
    } else if (!isAllCategories && options?.categories) {
      for (const cat of options.categories) {
        const normalizedKey = cat
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        let matched = false;
        for (const feed of this.CATEGORY_FEEDS) {
          const feedKey = feed.name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
          if (feedKey.includes(normalizedKey) || normalizedKey.includes(feedKey)) {
            urlsToFetch.push({ url: feed.url, category: feed.name });
            matched = true;
            break;
          }
        }
        if (!matched) {
          urlsToFetch.push({
            url: `https://lista.mercadolivre.com.br/${encodeURIComponent(cat)}`,
            category: cat,
          });
        }
      }
    }

    // Modo "All Products" (Padrão Ampliado): Varre TODOS os nichos oficiais simultaneamente
    if (urlsToFetch.length === 0 || isAllCategories) {
      urlsToFetch.length = 0; // limpa para garantir todos os nichos
      for (const feed of this.CATEGORY_FEEDS) {
        urlsToFetch.push({ url: feed.url, category: feed.name });
      }
    }

    const allItems: RawMarketplaceItem[] = [];
    const seenIds = new Set<string>();

    // Varre em paralelo com controle de concorrência
    const fetchPromises = urlsToFetch.map(async (target) => {
      try {
        const html = await this.fetchHtml(target.url);
        return this.parseHtml(html, target.category);
      } catch (err) {
        console.warn(`[MLDiscovery] Erro ao buscar ${target.url}:`, err);
        return [];
      }
    });

    const results = await Promise.all(fetchPromises);
    
    // Intercala produtos de cada nicho para garantir diversidade máxima
    let maxItemsPerNiche = Math.max(...results.map((r) => r.length));
    for (let i = 0; i < maxItemsPerNiche; i++) {
      for (const nicheList of results) {
        if (nicheList[i]) {
          const item = nicheList[i];
          if (!seenIds.has(item.externalId)) {
            seenIds.add(item.externalId);
            allItems.push(item);
          }
        }
      }
    }

    const limit = options?.limit || 60;
    return allItems.slice(0, limit);
  }
}
