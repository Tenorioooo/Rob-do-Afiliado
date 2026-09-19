import { z } from "zod";

export const robotScanConfigSchema = z.object({
  platforms: z
    .array(z.enum(["SHOPEE", "MERCADO_LIVRE", "AMAZON", "MAGALU", "ALIEXPRESS"]))
    .default(["SHOPEE", "MERCADO_LIVRE", "AMAZON"]),
  categories: z
    .array(z.string())
    .default(["Eletrônicos", "Casa e Cozinha", "Moda", "Beleza", "Gamer", "Informática"]),
  minOpportunityScore: z.number().min(0).max(100).default(75),
  minDiscount: z.number().min(0).max(100).default(15.0),
  minCommission: z.number().min(0).default(3.0),
  maxPrice: z.number().positive().optional(),
  maxResults: z.number().int().min(1).max(100).default(50),
});

export type RobotScanConfig = z.infer<typeof robotScanConfigSchema>;

export const DEFAULT_SCAN_CONFIG: RobotScanConfig = {
  platforms: ["MERCADO_LIVRE", "SHOPEE", "AMAZON"],
  categories: ["ALL"],
  minOpportunityScore: 70,
  minDiscount: 10.0,
  minCommission: 3.0,
  maxResults: 60,
};
