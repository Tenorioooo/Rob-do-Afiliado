import { ChannelType } from "../channels/types";

export interface FormatterInput {
  title: string;
  body: string;
  cta: string;
  affiliateUrl: string;
}

export class MessageFormatter {
  static format(input: FormatterInput, channelType: ChannelType | string): string {
    const norm = channelType.toUpperCase();
    const cleanTitle = input.title.replace(/\*/g, "").trim();
    const cleanBody = input.body.trim();
    const cleanCta = input.cta.replace(/\*/g, "").trim();
    const url = input.affiliateUrl.trim();

    switch (norm) {
      case "TELEGRAM":
        return `*${cleanTitle}*\n\n${cleanBody}\n\n*${cleanCta}*\n${url}`;

      case "WHATSAPP":
        return `*${cleanTitle}*\n\n${cleanBody}\n\n${cleanCta}\n${url}`;

      case "DISCORD":
        return `**${cleanTitle}**\n\n${cleanBody}\n\n> **${cleanCta}**\n${url}`;

      default:
        return `${cleanTitle}\n\n${cleanBody}\n\n${cleanCta}\n${url}`;
    }
  }
}
