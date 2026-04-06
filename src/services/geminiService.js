
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI;
let model;
let isModelInitialized = false;

try {
  if (API_KEY && API_KEY !== "your_gemini_api_key_here") {
    genAI = new GoogleGenerativeAI(API_KEY);
    model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });
    isModelInitialized = true;
    console.log("Gemini AI initialized successfully");
  } else {
    console.warn(
      "Gemini API key not found or not configured. Chatbot will use fallback responses."
    );
  }
} catch (error) {
  console.error("Failed to initialize Gemini AI:", error);
  isModelInitialized = false;
}

// E-commerce context for the AI
const SYSTEM_CONTEXT = `
You are a professional customer service AI assistant for "Rent A Cloth" - a premium clothing rental platform. You should provide helpful, accurate, and friendly assistance to customers browsing our rental collection.

COMPANY OVERVIEW:
Rent A Cloth is a professional clothing rental service offering high-quality garments for special occasions, business events, and everyday elegance. We focus on making premium fashion accessible while promoting sustainable shopping practices.

KEY SERVICES:
- Premium Clothing Rental: Designer dresses, suits, formal wear, and accessories
- Flexible Rental Periods: Standard 3-7 day rentals with extension options
- Professional Cleaning: All items professionally cleaned and sanitized between rentals
- Size Consultation: Expert fitting guidance and size recommendations
- Delivery & Returns: Convenient pickup and delivery service
- Quality Assurance: Every item inspected for quality and condition

RENTAL CATEGORIES:
- Formal Dresses & Evening Wear
- Business Professional Attire
- Wedding & Special Event Clothing
- Cocktail & Party Dresses
- Seasonal Collections
- Designer Accessories

CUSTOMER SERVICE FOCUS:
Your primary role is to:
1. Help customers find suitable rental items for their needs
2. Explain the rental process clearly and completely
3. Provide accurate information about pricing, policies, and procedures
4. Offer sizing and styling guidance
5. Address concerns about hygiene, quality, and garment condition
6. Guide customers through booking and return processes
7. Provide general e-commerce support (account help, order tracking, etc.)

COMMUNICATION STYLE:
- Professional yet friendly and approachable
- Clear and informative explanations
- Patient and helpful with customer questions
- Knowledgeable about fashion and styling
- Supportive of sustainable fashion choices
- Quick to acknowledge when you need to connect customers with human support

IMPORTANT GUIDELINES:
- Always prioritize customer satisfaction and clear communication
- Provide accurate information about rental terms and policies
- Be honest about limitations and direct customers to appropriate resources
- Maintain professional boundaries while being helpful
- Support the company's commitment to quality and sustainability
`;

// Chat history storage (in-memory for this demo)
let chatHistory = [];

export const sendMessageToGemini = async (message, userContext = {}) => {
  try {
    // If model is not initialized, use fallback responses
    if (!isModelInitialized || !model) {
      console.log("Using fallback response - Gemini API not available");
      const fallbackResponse = getFallbackResponse(message);

      // Add to chat history
      chatHistory.push({
        role: "user",
        message: message,
        timestamp: new Date().toISOString(),
      });

      chatHistory.push({
        role: "assistant",
        message: fallbackResponse,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        response: fallbackResponse,
        timestamp: new Date().toISOString(),
        fallback: true,
      };
    }

    // Create comprehensive context-aware prompt for clothing rental
    const contextualPrompt = `${SYSTEM_CONTEXT}

CURRENT CUSTOMER PROFILE:
- Customer Name: ${userContext.userName || "Valued Customer"}
- Account Status: ${
      userContext.isLoggedIn ? "Registered Member" : "Guest Browser"
    }
- Items in Cart: ${userContext.cartItems || 0} items
- Cart Items Details: ${
      userContext.cartItemsDetails
        ? userContext.cartItemsDetails
            .map(
              (item) =>
                `${item.name} (${item.size}, $${item.price}, qty: ${item.quantity})`
            )
            .join(", ")
        : "None"
    }
- Wishlist Items: ${userContext.wishlistItems || 0} saved items
- Total Cart Value: $${userContext.totalCartValue || 0}

CUSTOMER INQUIRY: "${message}"

Please provide a helpful, professional response that addresses the customer's question thoroughly. Be informative about our rental process, policies, and services while maintaining a friendly and supportive tone. If the question requires specific account information or complex technical support, guide them to appropriate human assistance.`;

    // Add user message to history
    chatHistory.push({
      role: "user",
      message: message,
      timestamp: new Date().toISOString(),
    });

    // Generate response
    const result = await model.generateContent(contextualPrompt);
    const response = await result.response;
    const text = response.text();

    // Add AI response to history
    chatHistory.push({
      role: "assistant",
      message: text,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      response: text,
      timestamp: new Date().toISOString(),
      fallback: false,
    };
  } catch (error) {
    console.error("Gemini API error:", error);

    // Use fallback response for errors
    const fallbackResponse = getFallbackResponse(message);

    // Add to chat history
    chatHistory.push({
      role: "user",
      message: message,
      timestamp: new Date().toISOString(),
    });

    chatHistory.push({
      role: "assistant",
      message: fallbackResponse,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true, // Changed to true so user doesn't see error message
      response: fallbackResponse,
      error: error.message,
      timestamp: new Date().toISOString(),
      fallback: true,
    };
  }
};

// Professional fallback responses for clothing rental service
const getFallbackResponse = (message) => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    return "Welcome to Rent A Cloth! 👗 I'm your personal styling assistant, here to help you find the perfect outfit for any occasion. Whether you need formal wear, party attire, or professional clothing, I'll guide you through our premium rental collection. What kind of event are you dressing for?";
  }

  if (lowerMessage.includes("rent") || lowerMessage.includes("rental")) {
    return "Our rental process is simple and convenient! Browse our curated collection, select your desired rental dates (typically 3-7 days), and we'll handle the rest. Each garment is professionally cleaned and inspected. Rental prices are typically 10-15% of retail value, making luxury fashion accessible for everyone. What type of clothing are you looking to rent?";
  }

  if (lowerMessage.includes("dress") || lowerMessage.includes("formal")) {
    return "We have an exquisite collection of formal dresses and elegant attire! From cocktail dresses to evening gowns, wedding guest outfits to business formal wear. Our collection includes designer pieces and contemporary styles in various sizes. Tell me about your upcoming event, and I'll help you find the perfect outfit!";
  }

  if (lowerMessage.includes("size") || lowerMessage.includes("fit")) {
    return "Perfect fit is our priority! We provide detailed size charts and measurements for every garment. Many items include multiple size options, and we offer styling consultations to ensure the best fit. If you're between sizes or need guidance, our expert stylists can provide personalized fitting advice. What's your size range, and what type of garment are you interested in?";
  }

  if (lowerMessage.includes("clean") || lowerMessage.includes("hygien")) {
    return "We maintain the highest hygiene standards! Every rental item undergoes professional cleaning and sanitization between uses. Our industrial-grade cleaning process ensures garments are fresh, clean, and ready to wear. We also inspect each piece for quality and condition before shipping to you.";
  }

  if (lowerMessage.includes("price") || lowerMessage.includes("cost")) {
    return "Our rental pricing is designed to make luxury fashion affordable! Most items rent for 10-15% of their retail value for a 4-day period. We require a refundable security deposit (typically 50% of retail value) and offer free delivery on orders over $50. Extended rental periods and rush services are available for additional fees.";
  }

  if (lowerMessage.includes("delivery") || lowerMessage.includes("ship")) {
    return "We offer convenient delivery and pickup services! Free delivery and return is included for orders over $50. Express same-day delivery is available in select areas. Each rental comes with prepaid return packaging, and we offer a 24-hour grace period for returns. Professional delivery ensures your garments arrive in perfect condition.";
  }

  if (lowerMessage.includes("return") || lowerMessage.includes("damage")) {
    return "Returns are easy and stress-free! Simply pack items in the provided return packaging by your return date. Normal wear is expected and covered. We offer optional damage protection for peace of mind. Late returns incur a $10/day fee, but we provide a 24-hour grace period for unexpected delays.";
  }

  if (lowerMessage.includes("occasion") || lowerMessage.includes("event")) {
    return "I'd love to help you find the perfect outfit for your special occasion! We have collections for weddings, cocktail parties, business events, galas, graduations, date nights, and more. Tell me about your event - the dress code, venue, time of day, and season - and I'll recommend the ideal pieces from our collection.";
  }

  if (lowerMessage.includes("wedding") || lowerMessage.includes("guest")) {
    return "Wedding guest attire is one of our specialties! We have elegant dresses perfect for ceremony and reception, in various styles suitable for different wedding themes and seasons. Our collection includes modest options, cocktail dresses, and sophisticated separates. What style of wedding are you attending, and what's the season?";
  }

  if (
    lowerMessage.includes("work") ||
    lowerMessage.includes("business") ||
    lowerMessage.includes("professional")
  ) {
    return "Our professional wear collection features sophisticated suits, executive dresses, and business-appropriate attire perfect for conferences, meetings, presentations, and networking events. We offer classic and contemporary styles in various colors and sizes. What type of professional event are you dressing for?";
  }

  if (lowerMessage.includes("party") || lowerMessage.includes("cocktail")) {
    return "Perfect for party season! Our cocktail and party dress collection includes trendy midi dresses, elegant cocktail attire, and statement pieces for celebrations. We have options for intimate dinners, birthday parties, anniversary celebrations, and festive gatherings. What kind of party atmosphere are you dressing for?";
  }

  if (
    lowerMessage.includes("accessori") ||
    lowerMessage.includes("bag") ||
    lowerMessage.includes("jewelry")
  ) {
    return "Complete your look with our designer accessories! We rent luxury handbags, statement jewelry, scarves, and shoes to complement your outfit rental. Accessories can often be added to your clothing rental for a special package price. What accessories would enhance your chosen look?";
  }

  if (lowerMessage.includes("book") || lowerMessage.includes("reserve")) {
    return "Booking is simple through our platform! Select your desired items, choose your rental dates, and confirm your order. For popular pieces or peak seasons (holidays, wedding season), I recommend booking 1-2 weeks in advance. Rush bookings are available for last-minute needs with express processing.";
  }

  return "Thank you for choosing Rent A Cloth! I'm here to help you discover the perfect rental outfit for any occasion. Whether you need styling advice, have questions about our rental process, sizing, or pricing, I'm here to ensure you look and feel amazing. How can I assist you with your fashion rental needs today?";
};

// Get chat history
export const getChatHistory = () => {
  return chatHistory;
};

// Clear chat history
export const clearChatHistory = () => {
  chatHistory = [];
};

// Professional quick response suggestions for e-commerce
export const getQuickResponses = () => {
  return [
    "How does the rental process work?",
    "What are your rental prices and fees?",
    "How do I choose the right size?",
    "What's your return and exchange policy?",
    "Do you offer delivery and pickup?",
    "How long can I keep rental items?",
    "What types of clothing do you rent?",
    "How do I track my order?",
    "What if an item doesn't fit?",
    "Do you have formal dresses available?",
    "Can I extend my rental period?",
    "How do I create an account?",
  ];
};

// Test connection
export const testGeminiConnection = async () => {
  try {
    if (!isModelInitialized) {
      console.log("Gemini API not configured - using fallback mode");
      return {
        success: true,
        fallback: true,
        message: "Chatbot running in fallback mode",
      };
    }

    const testResult = await sendMessageToGemini(
      "Hello, this is a test message",
      {}
    );
    return testResult;
  } catch (error) {
    console.error("Gemini connection test failed:", error);
    return {
      success: true,
      fallback: true,
      error: error.message,
    };
  }
};
