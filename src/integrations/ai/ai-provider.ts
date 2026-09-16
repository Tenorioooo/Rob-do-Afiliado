import { OfferStructuredInput, OfferStyle, GeneratedOfferVariant } from "@/domain/offers/types";
import { OfferValidator } from "@/domain/offers/offer-validator";

export interface IAIProvider {
  readonly providerName: string;
  generateVariants(input: OfferStructuredInput): Promise<GeneratedOfferVariant[]>;
}

export class MockAIProvider implements IAIProvider {
  readonly providerName = "mock";

  async generateVariants(input: OfferStructuredInput): Promise<GeneratedOfferVariant[]> {
    const styles: OfferStyle[] = ["DIRETO", "DESCONTO", "URGENCIA", "PREMIUM", "CURTO"];

    return styles.map((style) => this.generateForStyle(style, input));
  }

  private generateForStyle(style: OfferStyle, input: OfferStructuredInput): GeneratedOfferVariant {
    const formattedPrice = `R$ ${input.currentPrice.toFixed(2).replace(".", ",")}`;
    const formattedOrig = `R$ ${input.originalPrice.toFixed(2).replace(".", ",")}`;
    const ratingStr = input.rating ? `⭐ ${input.rating}/5` : "";
    const discountStr = input.discountPercent > 0 ? `${input.discountPercent}% OFF` : "";

    let title = "";
    let body = "";
    let cta = "👉 Ver oferta no link";

    switch (style) {
      case "DIRETO":
        title = `📦 ${input.title}`;
        body = `Preço atual: ${formattedPrice}${input.originalPrice > input.currentPrice ? ` (era ${formattedOrig})` : ""}.\n${input.description ? `${input.description.slice(0, 140)}...\n` : ""}${ratingStr ? `Avaliação dos compradores: ${ratingStr}.\n` : ""}Categoria: ${input.category}.`;
        cta = `🔗 Acessar produto: ${input.affiliateUrl}`;
        break;

      case "DESCONTO":
        title = `🔥 ${discountStr ? `OFERTA COM ${discountStr}: ` : "PROMOÇÃO: "}${input.title}`;
        body = `De ~${formattedOrig}~ por apenas *${formattedPrice}*!\nEconomia real identificada pelo nosso radar de afiliados.\n${ratingStr ? `Média de avaliações: ${ratingStr}.\n` : ""}Disponível na ${input.platform.replace("_", " ")}.`;
        cta = `🛒 Garantir com desconto: ${input.affiliateUrl}`;
        break;

      case "URGENCIA":
        // Urgent style without fabricating fake scarcity - uses real promotional pricing facts
        title = `⚡ PREÇO PROMOCIONAL: ${input.title}`;
        body = `Aproveite o valor reduzido de *${formattedPrice}* (${discountStr}).\nValor promocional detectado na varredura recente.\n${input.category} com excelente pontuação de oportunidade (${input.opportunityScore}/100).`;
        cta = `⚡ Conferir valor promocional agora: ${input.affiliateUrl}`;
        break;

      case "PREMIUM":
        title = `✨ Destaque Selecionado: ${input.title}`;
        body = `Item de alta relevância na categoria ${input.category}.\nValor de oportunidade: *${formattedPrice}*.\n${input.brand ? `Marca: ${input.brand}.\n` : ""}${ratingStr ? `Índice de satisfação: ${ratingStr}.\n` : ""}Comissão e qualidade analisadas pelo robô.`;
        cta = `💎 Acessar produto selecionado: ${input.affiliateUrl}`;
        break;

      case "CURTO":
        title = `🔥 ${input.title.slice(0, 45)}...`;
        body = `💥 Por apenas *${formattedPrice}* (${discountStr}) na ${input.platform.replace("_", " ")}!`;
        cta = `👉 Link: ${input.affiliateUrl}`;
        break;
    }

    // Run strict anti-fabrication validator
    const validation = OfferValidator.validate(title, body, cta, input);

    const formattedText = `${title}\n\n${body}\n\n${cta}`;

    return {
      style,
      title,
      body,
      cta,
      formattedText,
      validationStatus: validation.status,
      validationMessage: validation.summaryMessage,
      claimsVerified: validation.verifiedClaims,
      claimsRejected: validation.violations.map((v) => v.claim),
      aiSource: "mock",
    };
  }
}

export function getAIProvider(): IAIProvider {
  // In the future, this factory can instantiate OpenAIProvider, GeminiProvider, etc. based on env vars
  return new MockAIProvider();
}
