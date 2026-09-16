import { ProviderCapabilityAuditRegistry, ProviderHomologationStatus } from "@/domain/integrations/provider-capability-audit";
import { ExternalRequestPolicy } from "./ssrf-policy";
import { TelegramChannelAdapter } from "@/integrations/channels/telegram.adapter";
import { DiscordChannelAdapter } from "@/integrations/channels/discord.adapter";
import { WhatsAppCloudAdapter } from "@/integrations/channels/whatsapp.adapter";
import { CredentialService } from "./credential-service";

export type PreflightCheckStatus = "PASS" | "FAIL" | "WARNING" | "SKIPPED" | "REQUIRES_CREDENTIALS" | "REQUIRES_APPROVAL" | "NOT_SUPPORTED";

export interface PreflightCheckItem {
  id: string;
  name: string;
  description: string;
  status: PreflightCheckStatus;
  message: string;
  details?: Record<string, any>;
}

export interface PreflightResult {
  provider: string;
  overallStatus: PreflightCheckStatus;
  homologationStatus: ProviderHomologationStatus;
  readyForRealExecution: boolean;
  checks: PreflightCheckItem[];
  evidenceSummary: string;
  officialDocsUrl: string;
  timestamp: string;
}

export class IntegrationPreflightService {
  /**
   * Executes safe, non-destructive preflight diagnostics on a provider and credentials.
   */
  static async runPreflight(params: {
    provider: string;
    credentials?: Record<string, any>;
    connectionId?: string;
  }): Promise<PreflightResult> {
    const providerKey = params.provider.toUpperCase();
    const auditRecord = ProviderCapabilityAuditRegistry.getByProviderId(providerKey);
    const checks: PreflightCheckItem[] = [];

    // 1. Provider Registration & Audit Check
    if (!auditRecord) {
      checks.push({
        id: "PROVIDER_REGISTRY",
        name: "Registro Oficial de Provedor",
        description: "Verifica se o provedor está catalogado no sistema",
        status: "NOT_SUPPORTED",
        message: `O provedor "${params.provider}" não possui homologação oficial registrada.`,
      });

      return {
        provider: params.provider,
        overallStatus: "NOT_SUPPORTED",
        homologationStatus: "UNHOMOLOGATED",
        readyForRealExecution: false,
        checks,
        evidenceSummary: "Provedor desconhecido ou não documentado.",
        officialDocsUrl: "",
        timestamp: new Date().toISOString(),
      };
    }

    checks.push({
      id: "PROVIDER_REGISTRY",
      name: "Registro Oficial de Provedor",
      description: "Verifica se o provedor está catalogado no sistema",
      status: "PASS",
      message: `${auditRecord.providerName} está oficialmente catalogado (${auditRecord.type}).`,
    });

    // 2. Homologation Status Check
    if (auditRecord.overallStatus === "REQUIRES_APPROVAL") {
      checks.push({
        id: "HOMOLOGATION_POLICY",
        name: "Políticas de Acesso & Aprovação do Provedor",
        description: "Verifica requisitos de aprovação de parceiro ou cadastro WABA/Associados",
        status: "REQUIRES_APPROVAL",
        message: `Este provedor exige aprovação prévia de conta de desenvolvedor/parceiro (${auditRecord.summary.slice(0, 90)}...).`,
      });
    } else {
      checks.push({
        id: "HOMOLOGATION_POLICY",
        name: "Políticas de Acesso & Aprovação do Provedor",
        description: "Verifica requisitos de aprovação de parceiro",
        status: "PASS",
        message: `API aberta e pronta para uso imediato com credenciais de desenvolvedor.`,
      });
    }

    const creds = params.credentials || {};
    const hasAnyCredential = Object.keys(creds).length > 0 && Object.values(creds).some((v) => Boolean(v));

    // 3. Credentials Presence Check
    if (!hasAnyCredential) {
      checks.push({
        id: "CREDENTIALS_PRESENCE",
        name: "Credenciais de Acesso",
        description: "Verifica se as chaves ou tokens necessários foram fornecidos",
        status: "REQUIRES_CREDENTIALS",
        message: "Nenhuma credencial foi configurada ainda para esta conexão.",
      });

      return {
        provider: auditRecord.providerId,
        overallStatus: "REQUIRES_CREDENTIALS",
        homologationStatus: auditRecord.overallStatus,
        readyForRealExecution: false,
        checks,
        evidenceSummary: auditRecord.summary,
        officialDocsUrl: auditRecord.officialDocsUrl,
        timestamp: new Date().toISOString(),
      };
    }

    checks.push({
      id: "CREDENTIALS_PRESENCE",
      name: "Credenciais de Acesso",
      description: "Verifica se as chaves ou tokens necessários foram fornecidos",
      status: "PASS",
      message: "Credenciais fornecidas pelo usuário.",
    });

    // 4. Format & Structure Validation
    let formatValid = true;
    let formatMsg = "Formato das credenciais compatível.";

    if (providerKey === "TELEGRAM") {
      const token = creds.botToken || creds.bot_token;
      if (!token || typeof token !== "string" || !/^[0-9]{8,12}:[a-zA-Z0-9_-]{30,50}$/.test(token.trim())) {
        if (!String(token).startsWith("••••")) {
          formatValid = false;
          formatMsg = "Bot Token do Telegram deve seguir o padrão '123456789:ABCdefGhIjkLmNoPqRsTuVwXyZ'.";
        }
      }
    } else if (providerKey === "DISCORD") {
      const url = creds.webhookUrl || creds.webhook_url;
      if (url && typeof url === "string" && !url.startsWith("••••")) {
        if (!url.startsWith("https://discord.com/api/webhooks/") && !url.startsWith("https://discordapp.com/api/webhooks/")) {
          formatValid = false;
          formatMsg = "A URL de Webhook do Discord deve iniciar com 'https://discord.com/api/webhooks/'.";
        }
      }
    } else if (providerKey === "WHATSAPP") {
      const phoneId = creds.phoneNumberId || creds.phone_number_id;
      if (phoneId && !String(phoneId).startsWith("••••") && !/^\d{10,25}$/.test(String(phoneId).trim())) {
        formatValid = false;
        formatMsg = "O Phone Number ID do WhatsApp deve ser numérico.";
      }
    }

    checks.push({
      id: "CREDENTIAL_FORMAT",
      name: "Validação Estrutural e Sintática",
      description: "Verifica se os tokens atendem à especificação do provedor",
      status: formatValid ? "PASS" : "FAIL",
      message: formatMsg,
    });

    // 5. SSRF Security Allowlist Check
    let ssrfPass = true;
    let ssrfMsg = "Todos os endpoints de destino estão estritamente contidos na allowlist de segurança.";

    if (providerKey === "DISCORD" && creds.webhookUrl && !String(creds.webhookUrl).startsWith("••••")) {
      if (!ExternalRequestPolicy.isAllowedUrl(creds.webhookUrl)) {
        ssrfPass = false;
        ssrfMsg = "URL de webhook rejeitada pela política de proteção SSRF (apenas domínios oficiais permitidos).";
      }
    }

    checks.push({
      id: "SSRF_SECURITY",
      name: "Proteção SSRF & Allowlist de Hostnames",
      description: "Garante que requisições externas só se comuniquem com infraestrutura oficial",
      status: ssrfPass ? "PASS" : "FAIL",
      message: ssrfMsg,
    });

    // 6. Safe Preflight Ping (only if credentials are plain, not masked dummy values)
    let pingStatus: PreflightCheckStatus = "SKIPPED";
    let pingMessage = "Preflight executado sem disparar chamadas de rede externas.";

    const isMaskedOnly = Object.values(creds).every((v) => typeof v === "string" && v.startsWith("••••"));

    if (formatValid && ssrfPass && !isMaskedOnly) {
      try {
        if (providerKey === "TELEGRAM" && (creds.botToken || creds.bot_token)) {
          const res = await TelegramChannelAdapter.validateConnection(creds.botToken || creds.bot_token);
          if (res.valid) {
            pingStatus = "PASS";
            pingMessage = `Preflight ao vivo validado com sucesso com o bot @${res.username || res.firstName}.`;
          } else {
            pingStatus = "FAIL";
            pingMessage = `Falha de autenticação no Telegram: ${res.errorMessage}`;
          }
        } else if (providerKey === "DISCORD" && (creds.webhookUrl || creds.webhook_url)) {
          const res = await DiscordChannelAdapter.validateConnection(creds.webhookUrl || creds.webhook_url);
          if (res.valid) {
            pingStatus = "PASS";
            pingMessage = `Webhook do Discord operacional no canal ID ${res.channelId || "verificado"}.`;
          } else {
            pingStatus = "FAIL";
            pingMessage = `Falha de validação no Discord: ${res.errorMessage}`;
          }
        } else if (providerKey === "WHATSAPP" && (creds.accessToken || creds.access_token) && (creds.phoneNumberId || creds.phone_number_id)) {
          const res = await WhatsAppCloudAdapter.validateConnection({
            accessToken: creds.accessToken || creds.access_token,
            phoneNumberId: creds.phoneNumberId || creds.phone_number_id,
          });
          if (res.valid) {
            pingStatus = "PASS";
            pingMessage = `WhatsApp Cloud API validado para ${res.verifiedName || res.displayPhoneNumber}.`;
          } else {
            pingStatus = "FAIL";
            pingMessage = `Falha na Meta Graph API: ${res.errorMessage}`;
          }
        }
      } catch (err: unknown) {
        pingStatus = "FAIL";
        pingMessage = `Erro de rede no preflight: ${err instanceof Error ? err.message : "Desconhecido"}`;
      }
    }

    checks.push({
      id: "HEALTH_CHECK_PING",
      name: "Preflight de Conectividade Segura",
      description: "Executa chamada não-destrutiva de validação de token",
      status: pingStatus,
      message: pingMessage,
    });

    const hasFails = checks.some((c) => c.status === "FAIL");
    const readyForRealExecution = !hasFails && (pingStatus === "PASS" || auditRecord.overallStatus === "HOMOLOGATED");

    return {
      provider: auditRecord.providerId,
      overallStatus: hasFails ? "FAIL" : auditRecord.overallStatus === "REQUIRES_APPROVAL" ? "REQUIRES_APPROVAL" : "PASS",
      homologationStatus: auditRecord.overallStatus,
      readyForRealExecution,
      checks,
      evidenceSummary: auditRecord.summary,
      officialDocsUrl: auditRecord.officialDocsUrl,
      timestamp: new Date().toISOString(),
    };
  }
}
