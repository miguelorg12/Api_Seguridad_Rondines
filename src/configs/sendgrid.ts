import sgMail from "@sendgrid/mail";

// Configurar SendGrid con la API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

export { sgMail };
