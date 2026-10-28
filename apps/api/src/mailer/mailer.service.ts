import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { APP_NAME } from "@app/shared";

interface SendMailInput {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(private readonly config: ConfigService) {}

  // Falha de envio nunca derruba o fluxo que a chamou (registro,
  // esqueci-senha) - o usuário só não recebe o e-mail dessa vez; o erro
  // vai pro log estruturado (pino) com o id da request.
  async send(input: SendMailInput): Promise<void> {
    const apiKey = this.config.get<string>("RESEND_API_KEY");
    const from = this.config.get<string>("MAIL_FROM");
    if (!apiKey || !from) {
      this.logger.warn(`RESEND_API_KEY/MAIL_FROM não configurados - e-mail para ${input.to} não foi enviado`);
      return;
    }

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to: input.to, subject: input.subject, html: input.html }),
      });
      if (!res.ok) {
        const body = await res.text();
        this.logger.error(`Falha ao enviar e-mail para ${input.to}: ${res.status} ${body}`);
      }
    } catch (err) {
      this.logger.error(`Erro ao chamar a API do Resend: ${(err as Error).message}`);
    }
  }

  async sendVerificationEmail(to: string, name: string, verifyUrl: string) {
    await this.send({
      to,
      subject: "Confirme seu e-mail",
      html: `
        <p>Olá, ${escapeHtml(name)}.</p>
        <p>Confirme seu e-mail pra ativar sua conta no ${APP_NAME}:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>Se você não criou uma conta, pode ignorar este e-mail.</p>
      `,
    });
  }

  async sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
    await this.send({
      to,
      subject: "Redefinir sua senha",
      html: `
        <p>Olá, ${escapeHtml(name)}.</p>
        <p>Recebemos um pedido pra redefinir sua senha. O link abaixo vale por 30 minutos:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Se você não pediu isso, pode ignorar este e-mail - sua senha continua a mesma.</p>
      `,
    });
  }
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
