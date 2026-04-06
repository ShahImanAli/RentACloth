import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { processPenaltyPayment } from "../services/penaltyService";

const stripePromise = loadStripe(
  "pk_test_51SKNbsDXvAcUGHzk9VTzZfpJAwB4WuMb2X93RbehYTLr84CJBaMxE5PPRT33zUQ85bKFXpjWv3ioE92ZcR7l19Wl000SIFnQI1"
);

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: "16px",
      color: "#1f2937",
      "::placeholder": {
        color: "#9ca3af",
      },
      fontFamily: "system-ui, -apple-system, sans-serif",
    },
    invalid: {
      color: "#ef4444",
      iconColor: "#ef4444",
    },
  },
};

const PenaltyPaymentForm = ({ rental, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError("Stripe not loaded. Please refresh the page.");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      // Get the CardNumberElement
      const cardNumberElement = elements.getElement(CardNumberElement);

      if (!cardNumberElement) {
        setError("Card element not found. Please refresh the page.");
        setProcessing(false);
        return;
      }

      const result = await processPenaltyPayment(
        rental.id,
        stripe,
        elements,
        cardNumberElement
      );

      if (result.success) {
        onSuccess(result);
      } else {
        setError(result.error || "Payment failed. Please try again.");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Penalty Information */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <div>
          <h3 className="text-lg font-bold text-black mb-2">Overdue Penalty</h3>
          <p className="text-sm text-gray-700 mb-3">
            Your rental for "{rental.itemName}" is{" "}
            <strong>{rental.overdueDays} day(s)</strong> overdue.
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Base Rent:</span>
              <span className="font-semibold text-black">
                ${(rental.totalAmount || rental.amountPaid || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Overdue Days ({rental.overdueDays}):
              </span>
              <span className="font-semibold text-black">5% per day</span>
            </div>
            <div className="border-t border-gray-300 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-bold text-black">Total Penalty:</span>
                <span className="text-2xl font-bold text-black">
                  ${rental.penaltyAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Number */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Card Number
        </label>
        <div className="border border-gray-300 rounded-lg px-4 py-3 hover:border-gray-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
          <CardNumberElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      {/* Expiry and CVC */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Expiry Date
          </label>
          <div className="border border-gray-300 rounded-lg px-4 py-3 hover:border-gray-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
            <CardExpiryElement options={CARD_ELEMENT_OPTIONS} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            CVC
          </label>
          <div className="border border-gray-300 rounded-lg px-4 py-3 hover:border-gray-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
            <CardCvcElement options={CARD_ELEMENT_OPTIONS} />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-800">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={processing || !stripe}
          className="flex-1 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Processing...
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              Pay ${rental.penaltyAmount.toFixed(2)} & Return
            </>
          )}
        </button>
      </div>

      {/* Info Text */}
      <p className="text-xs text-gray-600 text-center">
        After successful payment, a return request will be automatically
        submitted to the admin.
      </p>
    </form>
  );
};

const PenaltyPaymentModal = ({ rental, isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  const handleSuccess = (result) => {
    onSuccess(result);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-black">Pay Penalty</h2>
            <p className="text-sm text-gray-600 mt-1">
              Complete payment to process return
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-600 hover:text-black"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-8 bg-white">
          <Elements stripe={stripePromise}>
            <PenaltyPaymentForm
              rental={rental}
              onSuccess={handleSuccess}
              onCancel={onClose}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
};

export default PenaltyPaymentModal;
