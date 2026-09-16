import { getAIProvider } from "@/integrations/ai/ai-provider";
import {
  OfferStructuredInput,
  GeneratedOfferVariant,
  ChannelPreviewType,
  OfferStyle,
} from "./types";
import { OfferValidator } from "./offer-validator";

export class OfferGenerator {
  /**
   * Generates all 5 copy style variants for a structured product opportunity.
   */
  static async generateAllStyles(
    input: OfferStructuredInput
  ): Promise<GeneratedOfferVariant[]> {
    const aiProvider = getAIProvider();
    return aiProvider.generateVariants(input);
  }

  /**
   * Formats an offer's copy for a specific target distribution channel preview.
   */
  static formatForChannel(
    title: string,
    body: string,
    cta: string,
    channel: ChannelPreviewType
  ): string {
    switch (channel) {
      case "TELEGRAM":
        // Supports emojis, bold *text*, italics _text_, and code `text`
        return `*${title.replace(/\*/g, "")}*\n\n${body}\n\n*${cta}*`;

      case "WHATSAPP":
        // Natural conversational messaging formatting
        return `*${title.replace(/\*/g, "")}*\n\n${body}\n\n${cta}`;

      case "DISCORD":
        // Markdown formatting with codeblock-friendly or embedded styling
        return `**${title.replace(/\*/g, "")}**\n\n${body}\n\n> ${cta}`;

      case "GENERIC":
      default:
        return `${title}\n\n${body}\n\n${cta}`;
    }
  }

  /**
   * Validates and normalizes user-edited copy.
   */
  static validateUserEdit(
    title: string,
    body: string,
    cta: string,
    input: OfferStructuredInput
  ) {
    return OfferValidator.validate(title, body, cta, input);
  }
}
