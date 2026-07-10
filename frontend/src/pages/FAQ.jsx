import React, { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import "../styles/policy.css";

const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      q: "How long is shipping?",
      a: "Standard shipping takes 3–5 business days for major metro cities and 5–7 business days for the rest of India. All orders are processed and prepared for delivery within 1–2 days of order submission.",
    },
    {
      q: "How do refunds work?",
      a: "Approved refunds are processed back to your original payment gateway (e.g. Razorpay sandbox network) within 5–7 business days. For cash on delivery orders, you will be prompted to provide bank account details or a UPI ID.",
    },
    {
      q: "How do I return products?",
      a: "Returns are accepted within 48 hours of delivery ONLY for products received in damaged, defective, or incorrect condition. To initiate a return, navigate to your order history and click the 'Return' button or submit a support ticket.",
    },
    {
      q: "How can I contact support?",
      a: "You can submit an online request directly from the Contact Us page or access the support tickets tracker from your User Profile. Regular customer care availability is Monday to Saturday, 9:00 AM to 7:00 PM.",
    },
    {
      q: "What payment methods are supported?",
      a: "We support major Credit Cards, Debit Cards, Net Banking, and Wallet payments via Razorpay processing gateways. Cash on Delivery is also available for supported regional pin codes.",
    },
    {
      q: "How do I track my order?",
      a: "You will receive an automated shipping confirmation email with transit tracking links once your package is dispatched from our warehouse. You can also view live delivery status updates in your Profile orders list.",
    },
  ];

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="policy-container">
      <div className="policy-hero">
        <h1>Frequently Asked Questions</h1>
        <p>Find answers to common questions about shipping, returns, refunds, payments, and account services.</p>
      </div>

      <div className="policy-card">
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item">
              <button className="faq-question" onClick={() => toggleFAQ(index)}>
                <span>{faq.q}</span>
                {activeIndex === index ? <FaChevronUp style={{ color: "#C8A96B" }} /> : <FaChevronDown style={{ color: "#8B7355" }} />}
              </button>
              {activeIndex === index && (
                <div className="faq-answer">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
