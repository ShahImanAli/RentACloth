import { useState, useEffect, useRef } from "react";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickResponses, setShowQuickResponses] = useState(true);
  const messagesEndRef = useRef(null);

  // FAQ Database
  const faqDatabase = [
    {
      keywords: ["rental", "process", "work", "how", "rent", "booking", "book"],
      question: "How does the rental process work?",
      answer:
        "Browse our collection, select your desired outfit, choose your rental duration (hourly or daily), and complete the booking. We'll deliver it to your doorstep on the selected date. After your event, simply return it using our easy return process.",
    },
    {
      keywords: [
        "duration",
        "period",
        "minimum",
        "maximum",
        "long",
        "time",
        "days",
        "hours",
      ],
      question: "What is the minimum and maximum rental period?",
      answer:
        "You can rent items for as little as a few hours or up to several days. Our flexible pricing includes both hourly and daily rates to suit your needs, whether it's a quick photoshoot or a weekend wedding.",
    },
    {
      keywords: [
        "fit",
        "size",
        "sizing",
        "doesn't fit",
        "wrong size",
        "exchange",
        "small",
        "large",
      ],
      question: "What if the outfit doesn't fit?",
      answer:
        "We provide detailed size charts for each item. If you're unsure about sizing, contact our support team before booking. In case of fit issues, you can request a size exchange subject to availability and our exchange policy.",
    },
    {
      keywords: ["clean", "cleaning", "wash", "laundry", "returning", "dirty"],
      question: "Do I need to clean the clothes before returning?",
      answer:
        "No! We handle all cleaning and maintenance. Just return the items in the same condition you received them. Normal wear and tear is acceptable, but please avoid stains or damage.",
    },
    {
      keywords: [
        "late",
        "penalty",
        "overdue",
        "fee",
        "extend",
        "return date",
        "missed",
      ],
      question: "What happens if I return the item late?",
      answer:
        "Late returns incur a penalty fee of 5% of the rental price per day. We send reminders before your due date to help you avoid late fees. You can also extend your rental period if needed by contacting us before the return date.",
    },
    {
      keywords: [
        "payment",
        "pay",
        "card",
        "credit",
        "debit",
        "stripe",
        "checkout",
        "money",
        "cash",
      ],
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit and debit cards through our secure Stripe payment gateway. All transactions are encrypted and protected, ensuring your payment information is completely safe.",
    },
    {
      keywords: [
        "occasion",
        "event",
        "wedding",
        "party",
        "corporate",
        "festival",
        "types",
        "function",
      ],
      question: "What types of occasions can I rent clothes for?",
      answer:
        "Our collection covers all occasions! Whether it's weddings, parties, corporate events, photoshoots, festivals, proms, or casual outings, we have the perfect outfit for every moment. Browse by category or search for specific styles.",
    },
    {
      keywords: [
        "track",
        "order",
        "status",
        "rental",
        "booking",
        "my rentals",
        "check",
      ],
      question: "How do I track my order and rental status?",
      answer:
        "Once you book, you can track everything in real-time from the 'My Rentals' section. You'll see your booking status (Pending, Confirmed, Active, Overdue, or Completed) and receive notifications for important updates like admin approvals and due date reminders.",
    },
    {
      keywords: [
        "price",
        "pricing",
        "cost",
        "expensive",
        "cheap",
        "rate",
        "hourly",
        "daily",
        "charge",
      ],
      question: "How is the pricing calculated?",
      answer:
        "We offer flexible pricing with both hourly and daily rates. Each product page shows the rental price clearly. You can choose the duration that suits your needs, and the total cost will be calculated automatically at checkout.",
    },
    {
      keywords: ["delivery", "shipping", "deliver", "pickup", "receive", "get"],
      question: "How do you deliver the items?",
      answer:
        "We deliver items to your doorstep on the selected date. After your rental period ends, you can return items using our easy return process. Delivery and return details are provided in your booking confirmation.",
    },
    {
      keywords: [
        "damage",
        "stain",
        "broken",
        "torn",
        "lost",
        "ripped",
        "ruined",
      ],
      question: "What if I damage or lose an item?",
      answer:
        "Normal wear and tear is acceptable, but any significant damage, stains, or loss will incur additional charges. We recommend treating rental items with care. Contact our support team immediately if any issues occur during your rental period.",
    },
    {
      keywords: [
        "cancel",
        "cancellation",
        "refund",
        "change",
        "modify",
        "update",
      ],
      question: "Can I cancel or modify my booking?",
      answer:
        "You can cancel or modify your booking before it's confirmed by the admin. Once confirmed, cancellation policies may apply. Please contact our support team for assistance with changes to your booking.",
    },
    {
      keywords: [
        "wear",
        "suggest",
        "recommend",
        "outfit",
        "dress",
        "suit",
        "what should",
        "best clothes",
        "choose",
      ],
      question: "What should I wear? Can you suggest outfits?",
      answer:
        "I'd love to help! We have collections for:\n• **Weddings**: Elegant suits, sherwanis, lehengas, sarees\n• **Parties**: Cocktail dresses, blazers, Indo-western outfits\n• **Corporate**: Business suits, formal shirts, professional dresses\n• **Festivals**: Traditional wear, ethnic outfits, designer collections\n• **Casual**: Trendy streetwear, casual blazers, smart casuals\n\nBrowse our 'Collections' page or search by occasion to find your perfect look!",
    },
    {
      keywords: ["men", "male", "groom", "boys", "gentlemen", "mens"],
      question: "What do you have for men?",
      answer:
        "Our men's collection includes:\n• Suits & Blazers (3-piece, 2-piece, tuxedos)\n• Sherwanis & Traditional wear\n• Kurta sets & Indo-western outfits\n• Formal shirts & trousers\n• Designer jackets\n• Ethnic wear for festivals\n\nCheck out the 'Men' category to see our full collection!",
    },
    {
      keywords: ["women", "female", "bride", "ladies", "girls", "womens"],
      question: "What do you have for women?",
      answer:
        "Our women's collection features:\n• Lehengas & Sarees (designer & traditional)\n• Evening gowns & Cocktail dresses\n• Anarkali & Palazzo suits\n• Western formal wear\n• Indo-western fusion outfits\n• Party wear & Festival collections\n\nExplore the 'Women' category for stunning options!",
    },
    {
      keywords: ["kids", "children", "child", "baby", "toddler", "boy", "girl"],
      question: "Do you have clothes for kids?",
      answer:
        "Yes! Our kids' collection includes:\n• Boys: Kurta sets, suits, ethnic wear\n• Girls: Lehengas, frocks, traditional dresses\n• Age groups: Toddlers to teenagers\n• Comfortable, stylish, and safe fabrics\n\nVisit the 'Kids' section to find adorable outfits for your little ones!",
    },
    {
      keywords: [
        "traditional",
        "ethnic",
        "indian",
        "kurta",
        "saree",
        "lehenga",
        "sherwani",
      ],
      question: "Do you have traditional/ethnic wear?",
      answer:
        "Absolutely! We specialize in traditional Indian wear:\n• Sherwanis & Kurta-Pajama sets\n• Lehengas & Designer Sarees\n• Anarkali suits & Palazzo sets\n• Indo-western fusion wear\n• Festival & Wedding collections\n\nPerfect for weddings, festivals, and cultural celebrations!",
    },
    {
      keywords: ["western", "gown", "suit", "dress", "blazer", "formal"],
      question: "Do you have western formal wear?",
      answer:
        "Yes! Our western collection includes:\n• Men: Business suits, tuxedos, blazers, formal shirts\n• Women: Evening gowns, cocktail dresses, formal pantsuits\n• Perfect for corporate events, galas, and formal parties\n• Designer labels and premium fabrics\n\nBrowse our formal wear section for elegant options!",
    },
    {
      keywords: [
        "wedding",
        "marriage",
        "bride",
        "groom",
        "sangeet",
        "reception",
      ],
      question: "What should I wear for a wedding?",
      answer:
        "For weddings, we recommend:\n• **Grooms**: Sherwanis, designer suits, Indo-western outfits\n• **Brides**: Lehengas, designer sarees, bridal gowns\n• **Guests**: Anarkali suits, blazers, elegant dresses, kurta sets\n• **Sangeet/Mehendi**: Colorful traditional and fusion wear\n\nOur wedding collection has everything you need to look stunning!",
    },
    {
      keywords: ["party", "cocktail", "night", "clubbing", "celebration"],
      question: "What should I wear to a party?",
      answer:
        "For parties, try:\n• **Women**: Cocktail dresses, sequin outfits, stylish jumpsuits, fusion wear\n• **Men**: Blazers with jeans, designer kurtas, slim-fit suits\n• Perfect for birthdays, cocktail parties, and celebrations\n\nCheck our 'Party Wear' collection for trendy options!",
    },
    {
      keywords: [
        "office",
        "work",
        "business",
        "professional",
        "meeting",
        "corporate",
      ],
      question: "What should I wear for office/corporate events?",
      answer:
        "For professional settings:\n• **Men**: Business suits, formal shirts, blazers, dress pants\n• **Women**: Formal pantsuits, shift dresses, blazers, professional sarees\n• Available in classic colors (black, navy, grey, white)\n• Perfect for interviews, meetings, and corporate functions\n\nBrowse our 'Corporate' collection!",
    },
    {
      keywords: ["photoshoot", "shoot", "photography", "camera", "pictures"],
      question: "Can I rent for a photoshoot?",
      answer:
        "Absolutely! We're perfect for photoshoots:\n• Hourly rental rates available (minimum 4 hours)\n• Wide variety of styles and colors\n• Pre-wedding, maternity, fashion shoots\n• Designer outfits at affordable rates\n\nMany photographers and studios rent from us regularly!",
    },
    {
      keywords: [
        "festival",
        "diwali",
        "holi",
        "eid",
        "christmas",
        "celebration",
      ],
      question: "What should I wear for festivals?",
      answer:
        "For festivals, we have:\n• **Diwali**: Traditional silk sarees, kurtas, ethnic wear\n• **Eid**: Sherwanis, anarkalis, designer suits\n• **Christmas**: Party dresses, blazers, formal wear\n• **Holi**: Comfortable white kurtas, casual ethnic wear\n\nCelebrate in style with our festival collection!",
    },
    {
      keywords: [
        "color",
        "colours",
        "red",
        "blue",
        "black",
        "white",
        "gold",
        "silver",
      ],
      question: "What colors are available?",
      answer:
        "We have a rainbow of colors! Each product page shows available colors:\n• Classic: Black, white, navy, grey\n• Festive: Red, gold, maroon, royal blue\n• Pastels: Pink, mint, lavender, peach\n• Bold: Emerald, burgundy, teal, purple\n\nUse our color filter on the shop page to find your favorite shades!",
    },
    {
      keywords: ["brand", "designer", "label", "luxury", "premium"],
      question: "Do you have designer/branded clothes?",
      answer:
        "Yes! We carry premium designer collections:\n• Indian designers and international brands\n• Authentic luxury pieces\n• Designer lehengas, sherwanis, gowns\n• High-quality fabrics and craftsmanship\n\nEnjoy designer fashion at a fraction of the retail price!",
    },
    {
      keywords: ["fabric", "material", "silk", "cotton", "velvet", "quality"],
      question: "What materials/fabrics do you use?",
      answer:
        "We use premium quality fabrics:\n• Silk, cotton, velvet, georgette\n• Brocade, satin, chiffon, organza\n• All garments are carefully maintained\n• Comfortable and breathable materials\n\nFabric details are mentioned on each product page!",
    },
    {
      keywords: ["available", "stock", "inventory", "out of stock", "quantity"],
      question: "How do I know if an item is available?",
      answer:
        "Check availability in real-time:\n• Product pages show current availability\n• Green badge = Available\n• Each item shows available quantity\n• Book quickly as popular items go fast!\n• You can also contact us to check specific dates",
    },
    {
      keywords: ["account", "register", "signup", "login", "profile"],
      question: "Do I need to create an account?",
      answer:
        "Yes, you need an account to:\n• Book and rent items\n• Track your orders\n• View rental history\n• Manage your bookings\n• Save favorite items\n\nSignup is quick and free! Just click the 'Sign Up' button in the top right corner.",
    },
    {
      keywords: ["contact", "support", "help", "phone", "email", "reach"],
      question: "How can I contact customer support?",
      answer:
        "We're here to help!\n• Visit the 'About' page for contact details\n• Email us for detailed inquiries\n• Call during business hours for urgent matters\n• Chat with me here for quick questions\n\nOur team typically responds within 24 hours!",
    },
    {
      keywords: ["new", "latest", "trending", "popular", "collection"],
      question: "Do you add new items regularly?",
      answer:
        "Yes! We constantly update our collection:\n• New arrivals added weekly\n• Seasonal collections launched regularly\n• Trending styles based on fashion weeks\n• Follow us or check 'Trending Now' section\n\nStay tuned for the latest fashion!",
    },
    {
      keywords: ["cart", "wishlist", "save", "favorite", "like"],
      question: "Can I save items for later?",
      answer:
        "Yes! Use our wishlist feature:\n• Click the heart icon on any product\n• Access saved items from the wishlist page\n• Share your wishlist with friends\n• Items stay saved even if you logout\n\nPerfect for planning your wardrobe!",
    },
  ];

  // Quick response suggestions
  const quickResponses = [
    "What should I wear for a wedding?",
    "Suggest me best clothes for party",
    "Do you have designer wear?",
    "What's available for men?",
    "How does rental work?",
    "Show me traditional wear",
  ];

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chatbot
  useEffect(() => {
    const initializeChatbot = async () => {
      // Welcome message for clothing rental
      if (messages.length === 0) {
        setMessages([
          {
            role: "assistant",
            message:
              "Hello! Welcome to Rent A Cloth! 👋 I'm here to help you with frequently asked questions about our clothing rental service. Ask me anything about our rental process, pricing, sizing, returns, or booking. How can I help you today?",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    };

    if (isOpen) {
      initializeChatbot();
    }
  }, [isOpen]);

  // Find best matching FAQ
  const findBestMatch = (userInput) => {
    const input = userInput.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;

    faqDatabase.forEach((faq) => {
      let score = 0;
      faq.keywords.forEach((keyword) => {
        if (input.includes(keyword.toLowerCase())) {
          score++;
        }
      });

      if (score > highestScore) {
        highestScore = score;
        bestMatch = faq;
      }
    });

    // Return match if score is high enough
    if (highestScore > 0) {
      return bestMatch;
    }

    return null;
  };

  // Send message function
  const sendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim()) return;

    const userMessage = {
      role: "user",
      message: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setShowQuickResponses(false);

    // Simulate slight delay for more natural feel
    setTimeout(() => {
      const matchedFAQ = findBestMatch(messageText);

      let responseText;
      if (matchedFAQ) {
        responseText = `**${matchedFAQ.question}**\n\n${matchedFAQ.answer}`;
      } else {
        responseText =
          "I'm here to help with questions about our rental service! I can answer questions about:\n\n• Rental process and booking\n• Pricing and payment methods\n• Sizing and fit issues\n• Return policies and late fees\n• Delivery and tracking\n• Occasions and outfit types\n\nPlease ask me a question related to these topics, or try one of the quick responses below!";
      }

      const assistantMessage = {
        role: "assistant",
        message: responseText,
        timestamp: new Date().toISOString(),
        success: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 800);
  };

  // Handle quick response click
  const handleQuickResponse = (response) => {
    sendMessage(response);
  };

  // Clear chat
  const handleClearChat = () => {
    setMessages([
      {
        role: "assistant",
        message:
          "Hello! Welcome to Rent A Cloth! 👋 I'm here to help you with frequently asked questions about our clothing rental service. Ask me anything about our rental process, pricing, sizing, returns, or booking. How can I help you today?",
        timestamp: new Date().toISOString(),
      },
    ]);
    setShowQuickResponses(true);
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 w-14 h-14 md:w-16 md:h-16 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center transform hover:scale-105 ${
          isOpen
            ? "bg-gray-600 hover:bg-gray-700"
            : "bg-black hover:bg-gray-900"
        } text-white border-2 border-white`}
        style={{
          boxShadow: isOpen
            ? "0 8px 20px rgba(75, 85, 99, 0.3)"
            : "0 8px 20px rgba(0, 0, 0, 0.3)",
        }}
      >
        {isOpen ? (
          <svg
            className="w-6 h-6 md:w-7 md:h-7 transition-transform duration-200"
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
        ) : (
          <div className="relative">
            <svg
              className="w-6 h-6 md:w-7 md:h-7 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {/* Notification dot */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-black animate-pulse"></div>
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 left-4 right-4 top-56 md:bottom-24 md:right-6 md:top-auto md:left-auto z-40 md:w-96 md:h-[600px] bg-white rounded-xl md:rounded-2xl shadow-2xl flex flex-col border-0 md:border border-gray-200 animate-in slide-in-from-bottom-4 md:slide-in-from-right-4 duration-300">
          {/* Header */}
          <div className="bg-black text-white p-4 md:p-5 rounded-t-xl md:rounded-t-2xl flex justify-between items-center relative border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg">Customer Support</h3>
                <p className="text-sm text-gray-300 flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
                  Online • Ready to help
                </p>
              </div>
            </div>
            {/* Desktop clear button */}
            <div className="hidden md:flex items-center space-x-2">
              <button
                onClick={handleClearChat}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
                title="Clear chat"
              >
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
            {/* Mobile buttons - positioned absolutely */}
            <div className="md:hidden absolute top-3 right-3">
              <button
                onClick={handleClearChat}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
                title="Clear chat"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 chat-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                } animate-in fade-in slide-in-from-bottom-1 duration-300`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`flex items-end space-x-2 max-w-[85%] md:max-w-[80%]`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                  )}
                  <div
                    className={`p-3 md:p-4 rounded-2xl shadow-sm chat-message ${
                      message.role === "user"
                        ? "bg-black text-white rounded-br-md"
                        : "bg-white text-gray-800 rounded-bl-md border border-gray-200"
                    }`}
                  >
                    <p className="text-sm md:text-base whitespace-pre-wrap leading-relaxed">
                      {message.message}
                    </p>
                    <p
                      className={`text-xs mt-2 flex items-center ${
                        message.role === "user"
                          ? "text-white/70"
                          : "text-gray-400"
                      }`}
                    >
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                      </svg>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-end space-x-2">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <div className="bg-white p-4 rounded-2xl rounded-bl-md shadow-sm border border-gray-200">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-black rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Responses */}
            {showQuickResponses && messages.length <= 1 && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-500">
                <p className="text-sm text-gray-600 text-center font-medium">
                  💬 How can we help you today?
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {quickResponses.slice(0, 6).map((response, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickResponse(response)}
                      className="text-sm bg-white text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:shadow-sm transform hover:scale-[1.02] text-left"
                    >
                      {response}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl md:rounded-b-2xl">
            <div className="flex space-x-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 p-3 md:p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black focus:bg-white transition-all duration-200 text-sm md:text-base"
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-black hover:bg-gray-800 text-white p-3 md:p-4 rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-sm"
              >
                <svg
                  className="w-5 h-5 md:w-6 md:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
