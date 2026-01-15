import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn("RESEND_API_KEY is not set. Email functionality will be disabled.");
}

// Create Resend client only if API key is available, otherwise create a mock
export const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : {
      emails: {
        send: async () => {
          console.warn("Email not sent: RESEND_API_KEY is not configured");
          return { data: null, error: { message: "Resend not configured" } };
        },
      },
    } as unknown as Resend;

export const FROM_EMAIL = "Willson <willson@willpowered.com>";
export const REPLY_TO = "colin@willpowered.com";


