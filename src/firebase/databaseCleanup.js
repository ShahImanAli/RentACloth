import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./config";

/**
 * Database cleanup utilities for fixing invalid booking data
 */

/**
 * Find all bookings with invalid date data
 */
export const findInvalidBookings = async () => {
  try {
    console.log("Scanning for invalid bookings...");

    const bookingsRef = collection(db, "rental_bookings");
    const snapshot = await getDocs(bookingsRef);

    const invalidBookings = [];
    const validBookings = [];

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const booking = { id: doc.id, ...data };

      // Check for missing or invalid date fields
      const hasValidStartDateTime =
        data.startDateTime && !isNaN(new Date(data.startDateTime).getTime());
      const hasValidEndDateTime =
        data.endDateTime && !isNaN(new Date(data.endDateTime).getTime());

      if (!hasValidStartDateTime || !hasValidEndDateTime) {
        invalidBookings.push({
          id: doc.id,
          issues: {
            invalidStartDateTime: !hasValidStartDateTime,
            invalidEndDateTime: !hasValidEndDateTime,
            startDateTime: data.startDateTime,
            endDateTime: data.endDateTime,
            startTime: data.startTime,
            endTime: data.endTime,
            productId: data.productId,
            userId: data.userId,
            status: data.status,
            createdAt: data.createdAt,
          },
        });
      } else {
        validBookings.push(booking);
      }
    });

    console.log(
      ` Scan complete: ${validBookings.length} valid, ${invalidBookings.length} invalid bookings`
    );

    return {
      success: true,
      validBookings,
      invalidBookings,
      summary: {
        total: snapshot.docs.length,
        valid: validBookings.length,
        invalid: invalidBookings.length,
      },
    };
  } catch (error) {
    console.error("Error scanning bookings:", error);
    return {
      success: false,
      error: error.message,
      validBookings: [],
      invalidBookings: [],
    };
  }
};

/**
 * Attempt to fix invalid bookings by reconstructing dates from available data
 */
export const fixInvalidBookings = async (dryRun = true) => {
  try {
    console.log(`${dryRun ? "Simulating" : "Executing"} booking fixes...`);

    const scanResult = await findInvalidBookings();
    if (!scanResult.success) {
      throw new Error(scanResult.error);
    }

    const { invalidBookings } = scanResult;
    const fixedBookings = [];
    const unfixableBookings = [];

    for (const booking of invalidBookings) {
      const { id, issues } = booking;

      // Try to reconstruct dates from available information
      let canFix = false;
      let fixedData = {};

      // If we have createdAt, startTime, and endTime, we can try to reconstruct
      if (issues.createdAt && issues.startTime && issues.endTime) {
        try {
          const createdDate = new Date(issues.createdAt);
          if (!isNaN(createdDate.getTime())) {
            // Use creation date as base date
            const baseDate = createdDate.toISOString().split("T")[0]; // YYYY-MM-DD

            fixedData.startDateTime = `${baseDate}T${issues.startTime}:00.000Z`;
            fixedData.endDateTime = `${baseDate}T${issues.endTime}:00.000Z`;

            // Validate the reconstructed dates
            const startDate = new Date(fixedData.startDateTime);
            const endDate = new Date(fixedData.endDateTime);

            if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
              canFix = true;
            }
          }
        } catch (error) {
          console.warn(`Cannot fix booking ${id}:`, error.message);
        }
      }

      if (canFix) {
        fixedBookings.push({
          id,
          originalData: issues,
          fixedData,
        });

        if (!dryRun) {
          // Actually update the document
          const docRef = doc(db, "rental_bookings", id);
          await updateDoc(docRef, fixedData);
          console.log(`Fixed booking ${id}`);
        }
      } else {
        unfixableBookings.push({
          id,
          issues,
          reason: "Insufficient data to reconstruct dates",
        });
      }
    }

    const result = {
      success: true,
      processed: invalidBookings.length,
      fixed: fixedBookings.length,
      unfixable: unfixableBookings.length,
      fixedBookings,
      unfixableBookings,
      dryRun,
    };

    console.log(
      `${dryRun ? " Dry run complete" : " Fix complete"}:`,
      result
    );
    return result;
  } catch (error) {
    console.error("Error fixing bookings:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Delete unfixable bookings (use with caution!)
 */
export const deleteInvalidBookings = async (bookingIds, confirm = false) => {
  if (!confirm) {
    throw new Error("This operation requires explicit confirmation");
  }

  try {
    console.log("Deleting invalid bookings...");

    const deleted = [];
    const errors = [];

    for (const bookingId of bookingIds) {
      try {
        const docRef = doc(db, "rental_bookings", bookingId);
        await deleteDoc(docRef);
        deleted.push(bookingId);
        console.log(`Deleted booking ${bookingId}`);
      } catch (error) {
        errors.push({ bookingId, error: error.message });
        console.error(`Failed to delete booking ${bookingId}:`, error);
      }
    }

    return {
      success: true,
      deleted: deleted.length,
      errors: errors.length,
      deletedIds: deleted,
      errorDetails: errors,
    };
  } catch (error) {
    console.error("Error deleting bookings:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Standardize rentalType and rating fields for all products
 */
export const standardizeProductFields = async (dryRun = true) => {
  try {
    console.log(
      ` ${
        dryRun ? "Simulating" : "Executing"
      } product field standardization...`
    );

    const productsRef = collection(db, "products");
    const snapshot = await getDocs(productsRef);

    const productsToUpdate = [];
    const alreadyStandardized = [];

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const product = { id: doc.id, ...data };

      let needsUpdate = false;
      const updates = {};

      // Check rentalType field
      if (!data.rentalType || data.rentalType !== "both") {
        updates.rentalType = "both";
        needsUpdate = true;
      }

      // Check rating field
      const currentRating = data.rating;
      const standardRating = { rate: 4.0, count: 0 };

      if (
        !currentRating ||
        typeof currentRating !== "object" ||
        currentRating.rate !== 4.0 ||
        currentRating.count !== 0
      ) {
        updates.rating = standardRating;
        needsUpdate = true;
      }

      if (needsUpdate) {
        productsToUpdate.push({
          id: doc.id,
          currentData: {
            title: data.title,
            rentalType: data.rentalType,
            rating: data.rating,
          },
          updates,
        });
      } else {
        alreadyStandardized.push({
          id: doc.id,
          title: data.title,
        });
      }
    });

    if (!dryRun) {
      // Actually update the documents
      for (const product of productsToUpdate) {
        const docRef = doc(db, "products", product.id);
        await updateDoc(docRef, product.updates);
        console.log(`Updated product: ${product.currentData.title}`);
      }
    }

    const result = {
      success: true,
      totalProducts: snapshot.docs.length,
      needsUpdate: productsToUpdate.length,
      alreadyStandardized: alreadyStandardized.length,
      productsToUpdate,
      alreadyStandardized,
      dryRun,
      standardValues: {
        rentalType: "both",
        rating: { rate: 4.0, count: 0 },
      },
    };

    console.log(
      `${dryRun ? " Dry run complete" : " Standardization complete"}:`,
      `${result.needsUpdate} products need updates, ${result.alreadyStandardized} already standardized`
    );

    return result;
  } catch (error) {
    console.error("Error standardizing product fields:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Generate a comprehensive database health report
 */
export const generateDatabaseReport = async () => {
  try {
    console.log("Generating database health report...");

    const scanResult = await findInvalidBookings();
    if (!scanResult.success) {
      throw new Error(scanResult.error);
    }

    const { validBookings, invalidBookings, summary } = scanResult;

    // Analyze booking patterns
    const statusCounts = {};
    const productCounts = {};
    const userCounts = {};

    [...validBookings, ...invalidBookings.map((b) => b.issues)].forEach(
      (booking) => {
        // Count by status
        const status = booking.status || "unknown";
        statusCounts[status] = (statusCounts[status] || 0) + 1;

        // Count by product
        const productId = booking.productId || "unknown";
        productCounts[productId] = (productCounts[productId] || 0) + 1;

        // Count by user
        const userId = booking.userId || "unknown";
        userCounts[userId] = (userCounts[userId] || 0) + 1;
      }
    );

    const report = {
      timestamp: new Date().toISOString(),
      summary,
      healthScore: Math.round((summary.valid / summary.total) * 100),
      breakdown: {
        byStatus: statusCounts,
        byProduct: productCounts,
        byUser: userCounts,
      },
      invalidBookings: invalidBookings.map((b) => ({
        id: b.id,
        productId: b.issues.productId,
        userId: b.issues.userId,
        status: b.issues.status,
        missingFields: {
          startDateTime: !b.issues.startDateTime,
          endDateTime: !b.issues.endDateTime,
        },
      })),
      recommendations: [],
    };

    // Generate recommendations
    if (invalidBookings.length > 0) {
      report.recommendations.push(
        `Fix ${invalidBookings.length} invalid bookings using the fixInvalidBookings function`
      );
    }

    if (report.healthScore < 90) {
      report.recommendations.push(
        "Database health is below 90%. Consider running a cleanup operation."
      );
    }

    if (Object.keys(statusCounts).includes("unknown")) {
      report.recommendations.push(
        "Some bookings have unknown status. Review status field consistency."
      );
    }

    console.log("Database health report generated:", report);
    return {
      success: true,
      report,
    };
  } catch (error) {
    console.error("Error generating report:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
