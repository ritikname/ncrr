
import React from 'react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      icon: "🚗",
      title: "Choose Your Ride",
      desc: "Browse our premium fleet and select the car that fits your journey."
    },
    {
      icon: "📅",
      title: "Book Instantly",
      desc: "Select your dates. No hidden charges. Transparent pricing."
    },
    {
      icon: "🔑",
      title: "Pick Up & Drive",
      desc: "Visit our Delhi NCR hub, grab the keys, and enjoy the drive."
    }
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in">
        <div className="bg-red-600 p-6 text-center">
          <h2 className="text-2xl font-black text-white uppercase italic">How It Works</h2>
          <p className="text-red-100 text-sm mt-1">Simple 3-step process</p>
        </div>

        <div className="p-8 space-y-8">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-2xl shadow-sm flex-shrink-0">
                {step.icon}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors uppercase tracking-wide"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksModal;
