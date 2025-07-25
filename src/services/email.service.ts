import { transporter } from "@configs/nodemailer";
import { EmailDto } from "@interfaces/dto/emaiil.dto";
import path from "path";

export class EmailService {
  async sendEmail(emailDto: EmailDto): Promise<void> {
    const { to, subject, text, html } = emailDto;

    const mailOptions = {
      from: process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
      attachments: [
        {
          filename: "logo3.png",
          path: path.join(__dirname, "../../public/img/logo3.png"), // Ruta corregida
          cid: "logoimg",
        },
      ],
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${to}`);
    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error);
      throw new Error("Email sending failed");
    }
  }
}
