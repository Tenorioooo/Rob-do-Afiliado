import { IChannelAdapter, ChannelType, ChannelProviderSource } from "../types";
import { MockTelegramAdapter } from "./telegram.adapter";
import { MockWhatsAppAdapter } from "./whatsapp.adapter";
import { MockDiscordAdapter } from "./discord.adapter";
import { RealTelegramAdapter, RealDiscordAdapter, RealWhatsAppAdapter } from "./real-adapters";

export class ChannelFactory {
  static getAdapter(type: string | ChannelType, provider: string | ChannelProviderSource = "real"): IChannelAdapter {
    const normType = type.toUpperCase() as ChannelType;
    const isMock = provider === "mock";

    if (isMock) {
      switch (normType) {
        case "TELEGRAM":
          return new MockTelegramAdapter();
        case "WHATSAPP":
          return new MockWhatsAppAdapter();
        case "DISCORD":
        case "WEBHOOK":
          return new MockDiscordAdapter();
        default:
          return new MockTelegramAdapter();
      }
    }

    switch (normType) {
      case "TELEGRAM":
        return new RealTelegramAdapter();
      case "WHATSAPP":
        return new RealWhatsAppAdapter();
      case "DISCORD":
      case "WEBHOOK":
        return new RealDiscordAdapter();
      default:
        return new RealTelegramAdapter();
    }
  }
}
