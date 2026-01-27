
import React from 'react';
import { UserProfile } from '../types';

interface OwnerUsersListProps {
  users: (UserProfile & { joinedAt: number })[];
}

const OwnerUsersList: React.FC<OwnerUsersListProps> = ({ users }) => {
  const handleWhatsAppClick = (phone: string, name: string) => {
    // Sanitize phone number
    let p = phone.replace(/\D/g, '');
    if (p.length === 10) p = '91' + p;
    
    // Updated Sales Copy
    const text = `Hello ! ${name}

Thanks for stopping by NCR DRIVE

We saw you were checking out self drive rental car in Delhi

I'm here to ensure you get the VIP treatment.

How can I assist?`;
    
    const url = `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-24 bg-white rounded-3xl shadow-sm border border-gray-100 animate-fade-in">
        <div className="mx-auto w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
           <svg className="w-10 h-10 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
           </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Users Yet</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Users who sign up on the platform will be listed here.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-red-50 to-transparent rounded-bl-full -z-0"></div>
            
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold text-gray-600">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                Joined: {new Date(user.joinedAt).toLocaleDateString()}
              </span>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-1">{user.name}</h3>
            <p className="text-sm text-gray-500 mb-6 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              {user.phone}
            </p>

            <div className="mt-auto grid grid-cols-2 gap-3">
                <a 
                  href={`tel:${user.phone}`}
                  className="py-2.5 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border border-gray-200"
                >
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                   Call
                </a>
                <button 
                  onClick={() => handleWhatsAppClick(user.phone, user.name)}
                  className="py-2.5 bg-[#25D366] text-white hover:bg-[#20bd5a] rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                   WhatsApp
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OwnerUsersList;
