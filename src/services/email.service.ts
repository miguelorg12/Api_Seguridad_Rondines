import sgMail from "@sendgrid/mail";
import { EmailDto } from "@interfaces/dto/emaiil.dto";
import path from "path";
import fs from "fs";

export class EmailService {
  constructor() {
    // Configurar SendGrid con la API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");
  }

  async sendEmail(emailDto: EmailDto): Promise<void> {
    const { to, subject, text, html } = emailDto;

    // Leer el archivo de imagen para el attachment
    const logoPath = path.join(__dirname, "../../public/img/logo3.png");
    const logoBuffer = fs.readFileSync(logoPath);

    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@tudominio.com",
      subject,
      text,
      html,
      attachments: [
        {
          filename: "logo3.png",
          content: logoBuffer.toString("base64"),
          type: "image/png",
          disposition: "inline",
          content_id: "logoimg",
        },
      ],
    };

    try {
      await sgMail.send(msg);
      console.log(`Email sent to ${to}`);
    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error);
      throw new Error("Email sending failed");
    }
  }
}
