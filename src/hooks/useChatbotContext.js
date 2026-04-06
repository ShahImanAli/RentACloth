import { useSelector } from "react-redux";
import { useAuth } from "../context/AuthContext";

// Hook to provide comprehensive user context to the clothing rental chatbot
export const useChatbotContext = () => {
  const { user } = useAuth();
  const cartItems = useSelector((state) => state.cart.items);
  const wishlistItems = useSelector((state) => state.wishlist.items);

  // Calculate total cart value
  const totalCartValue = cartItems.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  // Get user context for chatbot
  const getChatbotContext = () => {
    return {
      // User information
      userName: user?.displayName || user?.email?.split("@")[0] || "Guest",
      isLoggedIn: !!user,
      userEmail: user?.email || null,

      // Rental context (adapted from shopping cart)
      cartItems: cartItems.length,
      cartItemsDetails: cartItems.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size || "Not specified",
        category: item.category || "General",
      })),
      totalCartValue: totalCartValue.toFixed(2),
      wishlistItems: wishlistItems.length,
      activeRentals: 0, // This would come from rental system
      pastRentals: 0, // This would come from rental history

      // Available clothing categories
      availableCategories: [
        "formal dresses",
        "cocktail dresses",
        "wedding guest attire",
        "business professional",
        "party wear",
        "evening gowns",
        "suits & blazers",
        "accessories",
      ],

      // Rental policies for reference
      rentalPolicies: {
        delivery: "Free delivery & pickup on orders over $50",
        rentalPeriod: "Standard 4-day rental period",
        returns: "24-hour grace period for returns",
        cleaning: "Professional cleaning included",
        pricing: "10-15% of retail value",
        booking: "Book 1-2 weeks in advance for popular items",
      },

      // Style preferences (could be enhanced with user preferences)
      preferredStyle: "Not specified",

      // Current timestamp
      timestamp: new Date().toISOString(),
    };
  };

  return {
    getChatbotContext,
    user,
    cartItems,
    wishlistItems,
    totalCartValue,
  };
};
