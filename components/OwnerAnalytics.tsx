
import React, { useMemo } from 'react';
import { Booking } from '../types';

interface OwnerAnalyticsProps {
  bookings: Booking[];
}

const OwnerAnalytics: React.FC<OwnerAnalyticsProps> = ({ bookings }) => {
  // --- ANALYTICS LOGIC ---
  const stats = useMemo(() => {
    const validBookings = bookings.filter(b => b.status !== 'cancelled');
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // 1. General Totals
    const totalRevenue = validBookings.reduce((sum, b) => sum + b.totalCost, 0);
    const totalTrips = validBookings.length;
    
    // 2. Time-based Stats
    let revenueMonth = 0;
    let revenueWeek = 0;
    let revenueToday = 0;
    
    // Helper for "This Week" (Sunday to Saturday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0,0,0,0);

    const startOfDay = new Date(now);
    startOfDay.setHours(0,0,0,0);

    validBookings.forEach(b => {
        const bDate = new Date(b.createdAt);
        
        // Month
        if (bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear) {
            revenueMonth += b.totalCost;
        }
        
        // Week
        if (bDate >= startOfWeek) {
            revenueWeek += b.totalCost;
        }

        // Today
        if (bDate >= startOfDay) {
            revenueToday += b.totalCost;
        }
    });

    // 3. Monthly Trend (Last 6 Months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const m = d.getMonth();
        const y = d.getFullYear();
        
        const monthRevenue = validBookings
            .filter(b => {
                const bd = new Date(b.createdAt);
                return bd.getMonth() === m && bd.getFullYear() === y;
            })
            .reduce((sum, b) => sum + b.totalCost, 0);
            
        monthlyTrend.push({
            label: d.toLocaleString('default', { month: 'short' }),
            value: monthRevenue,
            fullDate: d
        });
    }

    // 4. Top Cars Performance
    const carStats: Record<string, { revenue: number, count: number, name: string }> = {};
    validBookings.forEach(b => {
        if (!carStats[b.carId]) {
            carStats[b.carId] = { revenue: 0, count: 0, name: b.carName };
        }
        carStats[b.carId].revenue += b.totalCost;
        carStats[b.carId].count += 1;
    });
    
    const topCars = Object.values(carStats)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    return {
        totalRevenue,
        totalTrips,
        revenueMonth,
        revenueWeek,
        revenueToday,
        monthlyTrend,
        topCars,
        avgTicket: totalTrips > 0 ? Math.round(totalRevenue / totalTrips) : 0
    };
  }, [bookings]);

  // Max value for chart scaling
  const maxChartValue = Math.max(...stats.monthlyTrend.map(d => d.value), 100);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-black text-gray-900 uppercase italic">Sales Intelligence</h2>
                <p className="text-gray-500 text-sm">Financial performance and fleet metrics.</p>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 text-xs font-bold text-gray-500 shadow-sm">
                Data Updated: Just Now
            </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="bg-black text-white p-6 rounded-3xl shadow-xl relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
                <div className="relative z-10">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Revenue</p>
                    <h3 className="text-3xl font-black">₹{stats.totalRevenue.toLocaleString()}</h3>
                    <div className="mt-4 flex items-center gap-2 text-xs font-medium text-gray-400">
                        <span className="bg-white/20 px-2 py-1 rounded text-white">Lifetime</span>
                        <span>{stats.totalTrips} Total Bookings</span>
                    </div>
                </div>
            </div>

            {/* Monthly */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-red-100 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">This Month</p>
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                </div>
                <h3 className="text-2xl font-black text-gray-900">₹{stats.revenueMonth.toLocaleString()}</h3>
                <p className="text-xs text-gray-400 mt-1">Current calendar month</p>
            </div>

            {/* Weekly */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-emerald-100 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">This Week</p>
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </div>
                </div>
                <h3 className="text-2xl font-black text-gray-900">₹{stats.revenueWeek.toLocaleString()}</h3>
                <p className="text-xs text-gray-400 mt-1">Since Sunday</p>
            </div>

            {/* Average Ticket */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Avg. Trip Value</p>
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    </div>
                </div>
                <h3 className="text-2xl font-black text-gray-900">₹{stats.avgTicket.toLocaleString()}</h3>
                <p className="text-xs text-gray-400 mt-1">Per confirmed booking</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Revenue Trend Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue Trend (6 Months)</h3>
                
                <div className="h-64 flex items-end justify-between gap-4">
                    {stats.monthlyTrend.map((data, idx) => {
                        const heightPercent = (data.value / maxChartValue) * 100;
                        return (
                            <div key={idx} className="flex-1 flex flex-col items-center group">
                                <div className="relative w-full bg-gray-50 rounded-t-xl flex items-end justify-center overflow-hidden hover:bg-gray-100 transition-colors h-full">
                                    {/* Tooltip */}
                                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs font-bold px-2 py-1 rounded mb-2 whitespace-nowrap z-10 pointer-events-none">
                                        ₹{data.value.toLocaleString()}
                                    </div>
                                    
                                    {/* Bar */}
                                    <div 
                                        className="w-full sm:w-12 bg-red-600 rounded-t-lg transition-all duration-1000 ease-out relative"
                                        style={{ height: `${Math.max(heightPercent, 2)}%` }} // Min height 2% for visibility
                                    >
                                        <div className="absolute top-0 left-0 w-full h-1 bg-white/20"></div>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-gray-400 mt-3 uppercase">{data.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Top Cars List */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Top Performers</h3>
                <div className="space-y-4">
                    {stats.topCars.map((car, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-gray-900 border border-gray-200 text-xs">
                                    #{idx + 1}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 line-clamp-1">{car.name}</p>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase">{car.count} Trips</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-gray-900">₹{car.revenue.toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                    {stats.topCars.length === 0 && (
                        <div className="text-center text-gray-400 text-sm py-10">No sales data yet.</div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default OwnerAnalytics;
