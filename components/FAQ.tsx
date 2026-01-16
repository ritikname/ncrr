
import React, { useState } from 'react';

const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 flex items-center justify-between text-left focus:outline-none group"
      >
        <span className={`text-base font-bold transition-colors ${isOpen ? 'text-red-600' : 'text-gray-800 group-hover:text-red-600'}`}>
          {question}
        </span>
        <span className={`ml-4 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all ${isOpen ? 'bg-red-600 border-red-600 text-white rotate-180' : 'bg-white border-gray-200 text-gray-400'}`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-48 opacity-100 mb-5' : 'max-h-0 opacity-0'}`}>
        <p className="text-gray-500 leading-relaxed text-sm">
          {answer}
        </p>
      </div>
    </div>
  );
};

const FAQ: React.FC = () => {
  const faqs = [
    {
      q: "What is NCR DRIVE?",
      a: "NCR DRIVE is Delhi NCR’s leading car sharing platform that provides self-drive car rental services to consumers."
    },
    {
      q: "What is the minimum age required to rent a car from NCR DRIVE?",
      a: "Minimum age required to rent a car from us is 21 years. You must have a valid driving license in order to rent a car."
    },
    {
      q: "What are the documents required to rent a car from NCR DRIVE?",
      a: "You should have a valid Driving License and Aadhar Card or Passport."
    }
  ];

  return (
    <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 mb-12 animate-fade-in">
      <div className="text-center mb-10">
         <span className="text-red-600 font-bold uppercase tracking-widest text-xs mb-2 block">Support</span>
         <h2 className="text-3xl font-black text-gray-900 uppercase italic">Frequently Asked Questions</h2>
      </div>
      <div className="max-w-3xl mx-auto bg-gray-50 rounded-2xl p-6 md:p-8">
        {faqs.map((faq, idx) => (
          <FAQItem key={idx} question={faq.q} answer={faq.a} />
        ))}
      </div>
    </div>
  );
};

export default FAQ;
