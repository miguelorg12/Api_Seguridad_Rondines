import { sgMail } from "@configs/sendgrid";
import { EmailDto } from "@interfaces/dto/emaiil.dto";
import path from "path";
import fs from "fs";

export class EmailService {
  async sendEmail(emailDto: EmailDto): Promise<void> {
    const { to, subject, text, html } = emailDto;

    // Leer el archivo de imagen para adjuntarlo
    const logoPath = path.join(__dirname, "../../public/img/logo3.png");
    let attachment = null;

    try {
      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        attachment = {
          filename: "logo3.png",
          content: logoBuffer.toString("base64"),
          type: "image/png",
          disposition: "inline",
          content_id: "logoimg",
        };
      }
    } catch (error) {
      console.warn("Could not attach logo:", error);
    }

    const msg = {
      to,
      from:
        process.env.SENDGRID_FROM_EMAIL ||
        process.env.SMTP_USER ||
        "noreply@tudominio.com",
      subject,
      text,
      html,
      attachments: attachment ? [attachment] : [],
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
