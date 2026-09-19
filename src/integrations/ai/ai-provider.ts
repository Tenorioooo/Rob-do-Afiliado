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
    const platformName = input.platform.replace(/_/g, " ");
    const tone = input.tone || "ENTHUSIASTIC";
    const customNote = input.customInstructions ? `\n💡 Observação: ${input.customInstructions.trim()}` : "";

    let title = "";
    let body = "";
    let cta = "👉 Ver oferta no link";

    // Tone prefixes/hooks
    const toneIntro =
      tone === "ENTHUSIASTIC"
        ? "🚨 ACHADINHO IMPERDÍVEL NO AR! "
        : tone === "CASUAL"
        ? "Fala galera! Olha o que garimpamos hoje: "
        : tone === "BENEFIT"
        ? "🎯 Excelente relação custo-benefício: "
        : "Oportunidade identificada: ";

    switch (style) {
      case "DIRETO":
        title = tone === "PROFESSIONAL" ? `📦 ${input.title}` : `📦 ${toneIntro}${input.title}`;
        body = `Preço atual: ${formattedPrice}${input.originalPrice > input.currentPrice ? ` (era ${formattedOrig})` : ""}.\n${input.description ? `${input.description.slice(0, 140)}...\n` : ""}${ratingStr ? `Avaliação dos compradores: ${ratingStr}.\n` : ""}Categoria: ${input.category}.${customNote}`;
        cta = tone === "CASUAL" ? `👉 Clica aqui pra conferir: ${input.affiliateUrl}` : `🔗 Acessar produto: ${input.affiliateUrl}`;
        break;

      case "DESCONTO":
        title = tone === "CASUAL"
          ? `🔥 Galera, olha esse desconto (${discountStr}): ${input.title}`
          : tone === "BENEFIT"
          ? `💰 Economia garantida (${discountStr}): ${input.title}`
          : `🔥 ${discountStr ? `OFERTA COM ${discountStr}: ` : "PROMOÇÃO: "}${input.title}`;
        body = `De ~${formattedOrig}~ por apenas *${formattedPrice}*!\nEconomia real identificada pelo nosso radar de afiliados.\n${ratingStr ? `Média de avaliações: ${ratingStr}.\n` : ""}Disponível na ${platformName}.${customNote}`;
        cta = tone === "ENTHUSIASTIC" ? `🛒 Corra para garantir com desconto: ${input.affiliateUrl}` : `🛒 Garantir com desconto: ${input.affiliateUrl}`;
        break;

      case "URGENCIA":
        // Urgent style without fabricating fake scarcity - uses real promotional pricing facts
        title = tone === "CASUAL"
          ? `⚡ Corre antes que mude o preço: ${input.title}`
          : `⚡ PREÇO PROMOCIONAL: ${input.title}`;
        body = `Aproveite o valor reduzido de *${formattedPrice}* (${discountStr}).\nValor promocional detectado na varredura recente.\n${input.category} com excelente pontuação de oportunidade (${input.opportunityScore}/100).${customNote}`;
        cta = `⚡ Conferir valor promocional agora: ${input.affiliateUrl}`;
        break;

      case "PREMIUM":
        title = tone === "PROFESSIONAL"
          ? `✨ Seleção Oficial: ${input.title}`
          : `✨ Destaque Selecionado: ${input.title}`;
        body = `Item de alta relevância na categoria ${input.category}.\nValor de oportunidade: *${formattedPrice}*.\n${input.brand ? `Marca: ${input.brand}.\n` : ""}${ratingStr ? `Índice de satisfação: ${ratingStr}.\n` : ""}Comissão e qualidade analisadas pelo robô.${customNote}`;
        cta = `💎 Acessar produto selecionado: ${input.affiliateUrl}`;
        break;

      case "CURTO":
        title = `🔥 ${input.title.slice(0, 45)}...`;
        body = `💥 Por apenas *${formattedPrice}* (${discountStr}) na ${platformName}!${customNote ? ` (${input.customInstructions?.slice(0, 40)})` : ""}`;
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
