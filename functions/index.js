const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const cors = require("cors")({ origin: true });

setGlobalOptions({ maxInstances: 10 });

const functions = require("firebase-functions");
const Stripe = require("stripe");
const Resend = require("resend");

const stripe = new Stripe(functions.config().stripe.secret_key);
const resend = new Resend(functions.config().resend.api_key);

exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
  try {
    const { amount } = data.data || data;
    console.log("Received data:", data);
    console.log("Amount type:", typeof amount);
    console.log("Amount value:", amount);

    if (amount === undefined || amount === null) {
      throw new Error("Amount is missing from request data.");
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount)) {
      throw new Error("Amount must be a valid number.");
    }

    if (numericAmount <= 0) {
      throw new Error("Amount must be greater than 0.");
    }

    console.log("Validated amount:", numericAmount);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: numericAmount,
      currency: "usd",
      payment_method_types: ["card"],
    });

    console.log("Payment intent created successfully:", paymentIntent.id);
    return { clientSecret: paymentIntent.client_secret };
  } catch (error) {
    console.error("Error creating payment intent:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

exports.sendEmail = onRequest({ cors: true }, async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    try {
      const { to, subject, html, text } = req.body;

      if (!to || !subject || (!html && !text)) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const { data, error } = await resend.emails.send({
        from: functions.config().resend.from_email || "RentACloth <noreply@rentacloth.com>",
        to,
        subject,
        html: html || undefined,
        text: text || undefined,
      });

      if (error) {
        console.error("Resend error:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true, id: data.id });
    } catch (error) {
      console.error("Email send error:", error);
      return res.status(500).json({ error: error.message });
    }
  });
});
