import { useState } from "react";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "How does the rental process work?",
      answer:
        "Browse our collection, select your desired outfit, choose your rental duration (hourly or daily), and complete the booking. We'll deliver it to your doorstep on the selected date. After your event, simply return it using our easy return process.",
    },
    {
      question: "What is the minimum and maximum rental period?",
      answer:
        "You can rent items for as little as a few hours or up to several days. Our flexible pricing includes both hourly and daily rates to suit your needs, whether it's a quick photoshoot or a weekend wedding.",
    },
    {
      question: "What if the outfit doesn't fit?",
      answer:
        "We provide detailed size charts for each item. If you're unsure about sizing, contact our support team before booking. In case of fit issues, you can request a size exchange subject to availability and our exchange policy.",
    },
    {
      question: "Do I need to clean the clothes before returning?",
      answer:
        "No! We handle all cleaning and maintenance. Just return the items in the same condition you received them. Normal wear and tear is acceptable, but please avoid stains or damage.",
    },
    {
      question: "What happens if I return the item late?",
      answer:
        "Late returns incur a penalty fee of 5% of the rental price per day. We send reminders before your due date to help you avoid late fees. You can also extend your rental period if needed by contacting us before the return date.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit and debit cards through our secure Stripe payment gateway. All transactions are encrypted and protected, ensuring your payment information is completely safe.",
    },
    {
      question: "What types of occasions can I rent clothes for?",
      answer:
        "Our collection covers all occasions! Whether it's weddings, parties, corporate events, photoshoots, festivals, proms, or casual outings, we have the perfect outfit for every moment. Browse by category or search for specific styles.",
    },
    {
      question: "How do I track my order and rental status?",
      answer:
        "Once you book, you can track everything in real-time from the 'My Rentals' section. You'll see your booking status (Pending, Confirmed, Active, Overdue, or Completed) and receive notifications for important updates like admin approvals and due date reminders.",
    },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full py-16 md:py-20 bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about renting designer fashion
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors duration-200"
              >
                <span className="text-lg font-semibold text-gray-900 pr-8">
                  {faq.question}
                </span>
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                >
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              <div
                className={`transition-all duration-300 ease-in-out ${
                  openIndex === index
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-6 pb-6 text-gray-700 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Still have questions?</p>
          <a
            href="/about"
            className="inline-block px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-black transition-colors duration-300 hover:scale-105 transform"
          >
            Contact Support
          </a>
        </div>
      </div>
    </section>
  );
}
