const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const cors = require("cors")({ origin: true });

setGlobalOptions({ maxInstances: 10 });

const functions = require("firebase-functions");
const Stripe = require("stripe");

const stripe = new Stripe(functions.config().stripe.secret_key);

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
