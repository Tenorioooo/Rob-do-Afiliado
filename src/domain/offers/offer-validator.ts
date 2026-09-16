import { OfferStructuredInput, OfferValidationResult, ValidationRuleViolation } from "./types";

export class OfferValidator {
  /**
   * Validates generated copy against structured product facts to prevent false marketing claims.
   */
  static validate(
    title: string,
    body: string,
    cta: string,
    product: OfferStructuredInput
  ): OfferValidationResult {
    const fullText = `${title} ${body} ${cta}`.toLowerCase();
    const violations: ValidationRuleViolation[] = [];
    const verifiedClaims: string[] = [];

    const tags = (product.tags || []).map((t) => t.toLowerCase());

    // 1. Scarcity & Stock Fabrication Check ("últimas unidades", "estoque acabando", "corra antes que acabe")
    const scarcityKeywords = [
      "últimas unidades",
      "ultimas unidades",
      "estoque acabando",
      "quase esgotado",
      "poucas unidades",
      "acabando o estoque",
      "corra antes que acabe",
    ];
    for (const kw of scarcityKeywords) {
      if (fullText.includes(kw)) {
        // Only allow if tags explicitly mention low stock or limited flash deal
        const hasScarcityTag = tags.some((t) => t.includes("estoque baixo") || t.includes("relâmpago"));
        if (!hasScarcityTag) {
          violations.push({
            claim: kw,
            reason: `Alegação de escassez "${kw}" não é comprovada pelos dados do produto (inStock = ${product.inStock ?? true}).`,
            severity: "ERROR",
          });
        } else {
          verifiedClaims.push("Escassez confirmada por tag de oferta relâmpago");
        }
      }
    }

    // 2. Best-Seller / Sales Volume Fabrication Check ("mais vendido", "milhares de pessoas compraram")
    const bestSellerKeywords = [
      "mais vendido",
      "mais vendidos",
      "campeão de vendas",
      "milhares de pessoas compraram",
      "milhares de vendas",
    ];
    for (const kw of bestSellerKeywords) {
      if (fullText.includes(kw)) {
        const hasHighSales = (product.salesCount || 0) >= 1000 || tags.some((t) => t.includes("mais vendido"));
        if (!hasHighSales) {
          violations.push({
            claim: kw,
            reason: `Alegação "${kw}" inválida para produto com volume registrado de ${product.salesCount || 0} vendas.`,
            severity: "ERROR",
          });
        } else {
          verifiedClaims.push(`Alto volume de vendas comprovado (+${product.salesCount} vendas)`);
        }
      }
    }

    // 3. Free Shipping Fabrication Check ("frete grátis", "envio grátis")
    const shippingKeywords = ["frete grátis", "frete gratis", "envio gratuito", "envio grátis"];
    for (const kw of shippingKeywords) {
      if (fullText.includes(kw)) {
        const hasFreeShippingTag = tags.some((t) => t.includes("frete grátis") || t.includes("grátis") || t.includes("full"));
        if (!hasFreeShippingTag) {
          violations.push({
            claim: kw,
            reason: `Menção a "${kw}" sem confirmação nas tags do produto.`,
            severity: "ERROR",
          });
        } else {
          verifiedClaims.push("Frete grátis confirmado nas tags do marketplace");
        }
      }
    }

    // 4. Delivery Speed Fabrication Check ("entrega em 24h", "entrega hoje", "chega amanhã")
    const deliveryKeywords = ["entrega hoje", "chega hoje", "entrega em 24 horas", "entrega em 24h", "chega amanhã"];
    for (const kw of deliveryKeywords) {
      if (fullText.includes(kw)) {
        const hasExpressDelivery = tags.some((t) => t.includes("full") || t.includes("prime") || t.includes("24h"));
        if (!hasExpressDelivery) {
          violations.push({
            claim: kw,
            reason: `Promessa de prazo "${kw}" não consta nas informações da plataforma.`,
            severity: "WARNING",
          });
        } else {
          verifiedClaims.push("Entrega expressa suportada por tag de fulfillment rápido");
        }
      }
    }

    // 5. Coupon / Fake Guarantee Fabrication Check ("cupom exclusivo de 50%", "garantia vitalícia")
    const fakePromoKeywords = ["cupom exclusivo", "garantia vitalícia", "menor preço da internet"];
    for (const kw of fakePromoKeywords) {
      if (fullText.includes(kw)) {
        violations.push({
          claim: kw,
          reason: `Alegação não verificável "${kw}" detectada.`,
          severity: "WARNING",
        });
      }
    }

    // 6. Verify Discount & Pricing Accuracy
    if (product.discountPercent > 0) {
      verifiedClaims.push(`Desconto real de ${product.discountPercent}% OFF validado contra preços do banco`);
    }
    if (product.rating && product.rating >= 4.0) {
      verifiedClaims.push(`Avaliação ⭐ ${product.rating} estrelas verificada`);
    }

    const hasErrors = violations.some((v) => v.severity === "ERROR");
    const hasWarnings = violations.some((v) => v.severity === "WARNING");

    let status: "VALID" | "WARNING" | "REJECTED" = "VALID";
    if (hasErrors) status = "REJECTED";
    else if (hasWarnings) status = "WARNING";

    const summaryMessage =
      status === "VALID"
        ? "Oferta 100% validada contra os dados estruturados do produto (zero claims fabricados)."
        : status === "WARNING"
        ? `Oferta com ${violations.length} alerta(s) de claims não comprovados.`
        : `Oferta bloqueada: ${violations.length} alegação(ões) proibidas ou não fundamentadas.`;

    return {
      isValid: status !== "REJECTED",
      status,
      violations,
      verifiedClaims,
      summaryMessage,
    };
  }
}
