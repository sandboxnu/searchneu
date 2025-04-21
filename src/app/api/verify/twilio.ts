import { Twilio } from "twilio";



const TWILIO_SID = process.env.TWILIO_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_VERIFY_SID = process.env.TWILIO_VERIFY_SID;

const twilioClient = new Twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);
export default twilioClient;
