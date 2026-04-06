import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db, functions } from "../firebase/config";
import { httpsCallable } from "firebase/functions";

const RENTAL_BOOKINGS_COLLECTION = "rental_bookings";
const PENALTY_RATE = 0.05; // 5% of base rent per overdue day

/**
 * Calculate penalty for overdue rental
 * @param {number} baseRent - The base rental amount
 * @param {number} overdueDays - Number of days overdue
 * @returns {number} - Calculated penalty amount
 */
export const calculatePenalty = (baseRent, overdueDays) => {
  return baseRent * PENALTY_RATE * overdueDays;
};

/**
 * Check and update overdue status for a rental
 * @param {string} rentalId - The rental booking ID
 * @returns {Object} - Result object with rental data
 */
export const checkAndUpdateOverdueStatus = async (rentalId) => {
  try {
    const rentalRef = doc(db, RENTAL_BOOKINGS_COLLECTION, rentalId);
    const rentalDoc = await getDoc(rentalRef);

    if (!rentalDoc.exists()) {
      return {
        success: false,
        error: "Rental not found",
      };
    }

    const rentalData = rentalDoc.data();
    const now = new Date();
    const endDate = new Date(rentalData.endDateTime);

    // Check if rental is overdue
    if (
      now > endDate &&
      (rentalData.status === "ongoing" ||
        rentalData.status === "active" ||
        rentalData.status === "due_soon" ||
        rentalData.status === "dueToday")
    ) {
      const overdueDays = Math.ceil((now - endDate) / (1000 * 60 * 60 * 24));
      const baseRent = rentalData.totalAmount || rentalData.amountPaid || 0;
      const penaltyAmount = calculatePenalty(baseRent, overdueDays);

      // Update rental to overdue status
      await updateDoc(rentalRef, {
        status: "overdue",
        overdueDays: overdueDays,
        penaltyAmount: Number(penaltyAmount.toFixed(2)),
        penaltyPaid: false,
        lastUpdated: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        rental: {
          id: rentalId,
          ...rentalData,
          status: "overdue",
          overdueDays,
          penaltyAmount: Number(penaltyAmount.toFixed(2)),
          penaltyPaid: false,
        },
      };
    }

    return {
      success: true,
      rental: {
        id: rentalId,
        ...rentalData,
      },
    };
  } catch (error) {
    console.error("Error checking overdue status:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get rental with updated overdue status
 * @param {string} rentalId - The rental booking ID
 * @returns {Object} - Rental data with overdue info
 */
export const getRentalWithPenalty = async (rentalId) => {
  try {
    const rentalRef = doc(db, RENTAL_BOOKINGS_COLLECTION, rentalId);
    const rentalDoc = await getDoc(rentalRef);

    if (!rentalDoc.exists()) {
      return {
        success: false,
        error: "Rental not found",
      };
    }

    const rentalData = rentalDoc.data();
    const now = new Date();
    const endDate = new Date(rentalData.endDateTime);

    let rental = {
      id: rentalId,
      ...rentalData,
    };

    // Calculate current penalty if overdue
    if (rentalData.status === "overdue" && now > endDate) {
      const overdueDays = Math.ceil((now - endDate) / (1000 * 60 * 60 * 24));
      const baseRent = rentalData.totalAmount || rentalData.amountPaid || 0;
      const penaltyAmount = calculatePenalty(baseRent, overdueDays);

      rental = {
        ...rental,
        overdueDays,
        penaltyAmount: Number(penaltyAmount.toFixed(2)),
      };

      // Update in database if changed
      if (
        overdueDays !== rentalData.overdueDays ||
        Number(penaltyAmount.toFixed(2)) !== rentalData.penaltyAmount
      ) {
        await updateDoc(rentalRef, {
          overdueDays,
          penaltyAmount: Number(penaltyAmount.toFixed(2)),
          lastUpdated: serverTimestamp(),
        });
      }
    }

    return {
      success: true,
      rental,
    };
  } catch (error) {
    console.error("Error getting rental with penalty:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Process penalty payment using Stripe
 * @param {string} rentalId - The rental booking ID
 * @param {Object} stripe - Stripe instance
 * @param {Object} elements - Stripe elements
 * @param {Object} cardNumberElement - Card number element
 * @returns {Object} - Payment result
 */
export const processPenaltyPayment = async (
  rentalId,
  stripe,
  elements,
  cardNumberElement
) => {
  try {
    console.log("Processing penalty payment for rental:", rentalId);

    // Get rental with current penalty
    const rentalResult = await getRentalWithPenalty(rentalId);
    if (!rentalResult.success) {
      return rentalResult;
    }

    const rental = rentalResult.rental;

    if (!rental.penaltyAmount || rental.penaltyAmount <= 0) {
      return {
        success: false,
        error: "No penalty amount to pay",
      };
    }

    if (rental.penaltyPaid) {
      return {
        success: false,
        error: "Penalty already paid",
      };
    }

    // Create payment intent
    const createPaymentIntent = httpsCallable(functions, "createPaymentIntent");
    const amount = Math.round(rental.penaltyAmount * 100); // Convert to cents

    console.log("Creating payment intent for amount:", amount / 100);

    const result = await createPaymentIntent({ amount });
    const clientSecret = result.data.clientSecret;

    // Create payment method using the card number element passed as parameter
    const { error: paymentMethodError, paymentMethod } =
      await stripe.createPaymentMethod({
        type: "card",
        card: cardNumberElement,
      });

    if (paymentMethodError) {
      return {
        success: false,
        error: paymentMethodError.message,
      };
    }

    // Confirm payment
    const { error: confirmError } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: paymentMethod.id,
      }
    );

    if (confirmError) {
      return {
        success: false,
        error: confirmError.message,
      };
    }

    // Update rental after successful payment
    const rentalRef = doc(db, RENTAL_BOOKINGS_COLLECTION, rentalId);
    await updateDoc(rentalRef, {
      penaltyPaid: true,
      penaltyPaidAt: serverTimestamp(),
      status: "return_requested",
      returnRequestedAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log("Penalty payment successful, return request created");

    return {
      success: true,
      message: "Penalty paid successfully! Return request has been submitted.",
      rental: {
        ...rental,
        penaltyPaid: true,
        status: "return_requested",
      },
    };
  } catch (error) {
    console.error("Error processing penalty payment:", error);
    return {
      success: false,
      error: error.message || "Failed to process penalty payment",
    };
  }
};

/**
 * Check all ongoing rentals for overdue status (for admin/scheduler)
 * @returns {Object} - Results of overdue check
 */
export const checkAllOverdueRentals = async () => {
  try {
    console.log("Checking all rentals for overdue status...");

    const q = query(
      collection(db, RENTAL_BOOKINGS_COLLECTION),
      where("status", "in", ["ongoing", "active", "due_soon", "dueToday"])
    );

    const querySnapshot = await getDocs(q);
    const now = new Date();
    const overdueRentals = [];

    for (const docSnapshot of querySnapshot.docs) {
      const rentalData = docSnapshot.data();
      const endDate = new Date(rentalData.endDateTime);

      if (now > endDate) {
        const overdueDays = Math.ceil((now - endDate) / (1000 * 60 * 60 * 24));
        const baseRent = rentalData.totalAmount || rentalData.amountPaid || 0;
        const penaltyAmount = calculatePenalty(baseRent, overdueDays);

        // Update to overdue
        await updateDoc(doc(db, RENTAL_BOOKINGS_COLLECTION, docSnapshot.id), {
          status: "overdue",
          overdueDays: overdueDays,
          penaltyAmount: Number(penaltyAmount.toFixed(2)),
          penaltyPaid: false,
          lastUpdated: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        overdueRentals.push({
          id: docSnapshot.id,
          itemName: rentalData.itemName,
          overdueDays,
          penaltyAmount: Number(penaltyAmount.toFixed(2)),
        });
      }
    }

    console.log(`Found ${overdueRentals.length} overdue rentals`);

    return {
      success: true,
      overdueRentals,
      count: overdueRentals.length,
    };
  } catch (error) {
    console.error("Error checking overdue rentals:", error);
    return {
      success: false,
      error: error.message,
      overdueRentals: [],
      count: 0,
    };
  }
};
