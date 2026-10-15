
const sendEmailViaResend = async (mailOptions) => {
  try {
    console.log("Sending email via Resend to:", mailOptions.to);

    const apiUrl = import.meta.env.DEV
      ? "/api/send-email"
      : import.meta.env.VITE_EMAIL_API_URL || "/api/send-email";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: mailOptions.to,
        subject: mailOptions.subject,
        html: mailOptions.html || undefined,
        text: mailOptions.text || undefined,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();

    console.log("Email sent successfully via Resend:", result.id);

    await saveEmailLog({
      to: mailOptions.to || "",
      subject: mailOptions.subject || "",
      html: mailOptions.html || "",
      text: mailOptions.text || mailOptions.html || "No text content",
      status: "sent_via_resend",
      timestamp: new Date().toISOString(),
      messageId: result.id || "resend-" + Date.now(),
      service: "Resend",
    });

    return { success: true, messageId: result.id };
  } catch (error) {
    console.error("Resend error:", error);

    await saveEmailLog({
      to: mailOptions.to || "",
      subject: mailOptions.subject || "",
      html: mailOptions.html || "",
      text: mailOptions.text || mailOptions.html || "No text content",
      status: "resend_failed",
      timestamp: new Date().toISOString(),
      error: error.message || "Unknown error",
      service: "Resend_Failed",
    });

    return { success: false, error: error.message };
  }
};

/**
 * Save email log to Firebase
 */
const saveEmailLog = async (emailData) => {
  try {
    const { addDoc, collection } = await import("firebase/firestore");
    const { db } = await import("../firebase/config");

    await addDoc(collection(db, "email_logs"), emailData);
    console.log("Email log saved to Firebase");
  } catch (error) {
    console.error(" Failed to save email log:", error);
  }
};

/**
 * Initialize email service
 */
const initializeEmailService = () => {
  const isSimulationMode =
    import.meta.env.VITE_EMAIL_SIMULATION_MODE === "true";

  if (isSimulationMode) {
    console.log("Email service in SIMULATION mode");
    return {
      sendMail: async (mailOptions) => {
        console.log("SIMULATED EMAIL:", mailOptions);
        return Promise.resolve({ messageId: "simulated-" + Date.now() });
      },
    };
  } else {
    console.log("Email service in PRODUCTION mode - using Resend");
    return {
      sendMail: sendEmailViaResend,
    };
  }
};

const transporter = initializeEmailService();

/**
 * Generate booking confirmation email HTML
 */
const generateBookingConfirmationHTML = (bookingData) => {
  const { bookingId, userName, itemName, startDate, endDate, totalAmount } =
    bookingData;

  const rentalDuration = Math.ceil(
    (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
  );

  return `
    <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
      <div style="text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px; color: white;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 700;">&#127881; Booking Confirmed!</h1>
        <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Your rental is ready to go!</p>
      </div>

      <p style="font-size: 18px; margin-bottom: 10px; color: #333;">Dear <strong style="color: #667eea;">${userName}</strong>,</p>

      <p style="font-size: 16px; margin-bottom: 25px; color: #666; line-height: 1.6;">
        Congratulations! Your rental booking for <strong>${itemName}</strong> has been successfully confirmed.
        We're excited to serve you and ensure you have a great rental experience!
      </p>

      <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 20px; border-radius: 15px; margin: 30px 0; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.1);">
        <h3 style="color: #667eea; margin-top: 0; font-size: 20px; text-align: center; margin-bottom: 25px;">&#128203; Your Booking Details</h3>

        <div style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
          <table style="width: 100%; min-width: 280px; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin: 0 auto;">
            <tr style="background: #667eea; color: white;">
              <td style="padding: 12px 10px; font-weight: bold; font-size: 14px; border: none;">Booking Reference</td>
              <td style="padding: 12px 10px; font-weight: bold; font-size: 14px; word-break: break-all; border: none;">#${bookingId}</td>
            </tr>
            <tr style="background: #f8f9fa;">
              <td style="padding: 12px 10px; font-weight: 600; color: #555; font-size: 14px; border: none;">&#128230; Item Name</td>
              <td style="padding: 12px 10px; color: #333; font-weight: 500; font-size: 14px; word-break: break-word; border: none;">${itemName}</td>
            </tr>
            <tr style="background: white;">
              <td style="padding: 12px 10px; font-weight: 600; color: #555; font-size: 14px; border: none;">&#128197; Rental Start</td>
              <td style="padding: 12px 10px; color: #333; font-size: 14px; border: none;">${new Date(
                startDate
              ).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}</td>
            </tr>
            <tr style="background: #f8f9fa;">
              <td style="padding: 12px 10px; font-weight: 600; color: #555; font-size: 14px; border: none;">&#128197; Return Due</td>
              <td style="padding: 12px 10px; color: #e74c3c; font-weight: 600; font-size: 14px; border: none;">${new Date(
                endDate
              ).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}</td>
            </tr>
            <tr style="background: white;">
              <td style="padding: 12px 10px; font-weight: 600; color: #555; font-size: 14px; border: none;">&#9200; Duration</td>
              <td style="padding: 12px 10px; color: #333; font-size: 14px; border: none;">${rentalDuration} ${
    rentalDuration === 1 ? "day" : "days"
  }</td>
            </tr>
            <tr style="background: #e8f5e8;">
              <td style="padding: 12px 10px; font-weight: 600; color: #27ae60; font-size: 14px; border: none;">&#128176; Total Amount</td>
              <td style="padding: 12px 10px; color: #27ae60; font-weight: bold; font-size: 18px; border: none;">$${totalAmount}</td>
            </tr>
          </table>
        </div>
      </div>

      <div style="text-align: center; margin-top: 40px; padding: 20px;">
        <p style="margin: 0; color: #667eea; font-size: 18px; font-weight: 600;">
          Thank you for choosing RentACloth!
        </p>
      </div>
    </div>`;
};

/**
 * Generate return confirmation email HTML
 */
const generateReturnConfirmationHTML = (returnData) => {
  const { bookingId, userName, itemName, returnDate } = returnData;

  return `
    <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333;">
      <div style="text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); padding: 30px; border-radius: 15px; color: white;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 700;">&#9989; Return Confirmed!</h1>
        <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Thank you for returning your rental!</p>
      </div>

      <p style="font-size: 18px; margin-bottom: 10px; color: #333;">Dear <strong style="color: #27ae60;">${userName}</strong>,</p>

      <p style="font-size: 16px; margin-bottom: 25px; color: #666; line-height: 1.6;">
        Excellent! We've successfully received and processed the return of your <strong>${itemName}</strong>.
        Thank you for being a responsible customer and returning the item on time!
      </p>

      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 20px; border-radius: 15px; margin: 30px 0; box-shadow: 0 4px 15px rgba(39, 174, 96, 0.1);">
        <h3 style="color: #27ae60; margin-top: 0; font-size: 20px; text-align: center; margin-bottom: 25px;">&#128230; Return Summary</h3>

        <div style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
          <table style="width: 100%; min-width: 280px; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin: 0 auto;">
            <tr style="background: #27ae60; color: white;">
              <td style="padding: 12px 10px; font-weight: bold; font-size: 14px; border: none;">Booking Reference</td>
              <td style="padding: 12px 10px; font-weight: bold; font-size: 14px; word-break: break-all; border: none;">#${bookingId}</td>
            </tr>
            <tr style="background: #f8f9fa;">
              <td style="padding: 12px 10px; font-weight: 600; color: #555; font-size: 14px; border: none;">&#128230; Returned Item</td>
              <td style="padding: 12px 10px; color: #333; font-weight: 500; font-size: 14px; word-break: break-word; border: none;">${itemName}</td>
            </tr>
            <tr style="background: white;">
              <td style="padding: 12px 10px; font-weight: 600; color: #555; font-size: 14px; border: none;">&#128197; Return Date</td>
              <td style="padding: 12px 10px; color: #333; font-size: 14px; border: none;">${new Date(
                returnDate || new Date()
              ).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}</td>
            </tr>
            <tr style="background: #f8f9fa;">
              <td style="padding: 12px 10px; font-weight: 600; color: #555; font-size: 14px; border: none;">&#9200; Processing Time</td>
              <td style="padding: 12px 10px; color: #333; font-size: 14px; border: none;">${new Date().toLocaleTimeString(
                "en-US",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}</td>
            </tr>
            <tr style="background: #e8f5e8;">
              <td style="padding: 12px 10px; font-weight: 600; color: #27ae60; font-size: 14px; border: none;">&#9989; Status</td>
              <td style="padding: 12px 10px; color: #27ae60; font-weight: bold; font-size: 16px; border: none;">Successfully Returned</td>
            </tr>
          </table>
        </div>
      </div>

      <div style="text-align: center; margin-top: 40px; padding: 20px;">
        <p style="margin: 0; color: #27ae60; font-size: 18px; font-weight: 600;">
          Thank you for choosing RentACloth!
        </p>
      </div>
    </div>`;
};

/**
 * Send booking confirmation email
 */
export const sendBookingConfirmationEmail = async (bookingData) => {
  try {
    const emailOptions = {
      to: bookingData.userEmail,
      subject: `Booking Confirmation - ${bookingData.itemName}`,
      html: generateBookingConfirmationHTML(bookingData),
      actionUrl: `${window.location.origin}/my-rentals`,
      actionText: "View My Rentals",
    };

    const result = await transporter.sendMail(emailOptions);

    if (result.success) {
      console.log("Booking confirmation email sent successfully");
      return { success: true, messageId: result.messageId };
    } else {
      console.error(" Failed to send booking confirmation:", result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error(" Error sending booking confirmation email:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send return confirmation email
 */
export const sendReturnConfirmationEmail = async (returnData) => {
  try {
    const emailOptions = {
      to: returnData.userEmail,
      subject: `Return Confirmed - ${returnData.itemName}`,
      html: generateReturnConfirmationHTML(returnData),
      actionUrl: `${window.location.origin}/my-rentals`,
      actionText: "View Rental History",
    };

    const result = await transporter.sendMail(emailOptions);

    if (result.success) {
      console.log("Return confirmation email sent successfully");
      return { success: true, messageId: result.messageId };
    } else {
      console.error(" Failed to send return confirmation:", result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error(" Error sending return confirmation email:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Test email configuration
 */
export const testEmailConfiguration = async () => {
  try {
    const testEmailOptions = {
      to: "shahimanali1211@gmail.com",
      subject: "Test Email - RentACloth System",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center;">
          <div style="margin-bottom: 25px;">
            <h2 style="color: #667eea; margin: 0; font-size: 24px;">&#129504; Email Test Successful!</h2>
          </div>
          <p style="font-size: 16px; margin-bottom: 20px;">
            Great news! Your Resend email configuration is working correctly.
          </p>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
            <p style="margin: 0; color: #15803d;">
              <strong>&#9989; Your rental system is ready to send email notifications!</strong>
            </p>
          </div>
          <p style="margin-top: 20px; color: #666;">
            RentACloth Email Service &#128231;
          </p>
        </div>
      `,
      actionUrl: `${window.location.origin}/admin`,
      actionText: "Go to Admin Panel",
    };

    const result = await transporter.sendMail(testEmailOptions);

    if (result.success) {
      console.log("Test email sent successfully");
      return { success: true, message: "Test email sent! Check your inbox." };
    } else {
      console.error(" Test email failed:", result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error(" Error sending test email:", error);
    return { success: false, error: error.message };
  }
};

// Export the email service
export const  emailService = {
  sendBookingConfirmationEmail,
  sendReturnConfirmationEmail,
  testEmailConfiguration,
};

export default emailService;
