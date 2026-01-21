
import React from 'react';

const WhyChooseUs: React.FC = () => {
  const reasons = [
    {
      icon: (
        <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      title: "24 x 7 Customer Support",
      desc: "We are always available to help you."
    },
    {
      icon: (
        <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Free Delivery > 72hrs",
      desc: "Free delivery on bookings over 72hrs."
    },
    {
      icon: (
        <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      title: "Clean and Sanitized Cars",
      desc: "Fresh and hygienic cars for every trip."
    },
    {
      icon: (
        <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1.0 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
        </svg>
      ),
      title: "Guaranteed Refund",
      desc: "Refund processed in 48 hours."
    }
  ];

  return (
    <>
      {/* MOBILE VIEW - Compact 2x2 Grid (Black & White Theme) */}
      <div className="md:hidden w-full px-4 mb-12 animate-fade-in">
        <div className="bg-black text-white rounded-3xl p-6 shadow-xl">
            <h2 className="text-xl font-black text-center uppercase italic mb-6 tracking-tighter">
              Reasons to Choose <span className="text-gray-500">Us</span>
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              {reasons.map((item, index) => (
                <div key={index} className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white mb-2 border border-white/5">
                    {item.icon}
                  </div>
                  <h3 className="text-xs font-bold uppercase mb-0.5">{item.title}</h3>
                  <p className="text-[10px] text-gray-400 font-medium leading-snug max-w-[120px]">{item.desc}</p>
                </div>
              ))}
            </div>
        </div>
      </div>

      {/* DESKTOP VIEW - Horizontal Layout (Black & White Theme) */}
      <div className="hidden md:block w-full bg-black text-white py-12 px-4 sm:px-6 lg:px-8 rounded-3xl mb-12 shadow-2xl animate-fade-in">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-black uppercase italic mb-10 text-center tracking-tighter">
            Reasons to Choose <span className="text-gray-400">Us</span>
          </h2>
          
          <div className="grid grid-cols-4 gap-8">
            {reasons.map((item, index) => (
              <div key={index} className="flex flex-col items-center text-center p-4 group">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4 text-white group-hover:bg-white group-hover:text-black transition-colors duration-300">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold uppercase mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default WhyChooseUs;
