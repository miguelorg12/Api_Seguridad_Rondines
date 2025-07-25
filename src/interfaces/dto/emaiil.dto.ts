export interface EmailDto {
  to: string; // Email address of the recipient
  subject: string; // Subject of the email
  text: string; // Plain text content of the email
  html?: string; // Optional HTML content of the email
}
