import twilio from "twilio";

// SMS_MODE=twilio ho tabhi asli SMS jaata hai, warna demo mode
const isReal = process.env.SMS_MODE === "twilio";

const client = isReal
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// phone 10 digit ka aata hai (9876543210), Twilio ko +91 ke saath chahiye
export const sendSms = async (phone, message) => {
  if (!isReal) {
    console.log(`[DEMO SMS] to ${phone}: ${message}`);
    return { demo: true };
  }
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: `+91${phone}`,
  });
  return { demo: false };
};