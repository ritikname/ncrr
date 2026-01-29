
import React, { useMemo, useState, useEffect } from 'react';
import { Booking } from '../types';

interface OwnerAnalyticsProps {
  bookings: Booking[];
}

const OwnerAnalytics: React.FC<OwnerAnalyticsProps> = ({ bookings }) => {
  // View State for Chart & Analysis
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('monthly');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // --- AUTO-INITIALIZE CUSTOM DATES ---
  useEffect(() => {
    if (viewMode === 'custom' && (!customStart || !customEnd)) {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1); 
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); 
        
        const formatDate = (d: Date) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        if (!customStart) setCustomStart(formatDate(start));
        if (!customEnd) setCustomEnd(formatDate(end));
    }
  }, [viewMode]);

  // --- HELPER: SMART TIMESTAMP PARSER ---
  // Detects if timestamp is in seconds (SQLite default) or milliseconds (JS default)
  const parseTimestamp = (ts: number | string | undefined) => {
      if (!ts) return new Date(); // Fallback to now if missing
      const num = Number(ts);
      if (isNaN(num)) return new Date(); // Fallback if NaN
      
      // If timestamp is less than 10 billion, it's likely seconds (valid until year 2286)
      // JS Date requires milliseconds.
      if (num < 10000000000) return new Date(num * 1000);
      return new Date(num);
  };
  
  // Helper to safely get the createdAt timestamp, checking both camelCase and snake_case
  const getCreatedDate = (booking: Booking | any) => {
      return parseTimestamp(booking.createdAt || booking.created_at);
  };

  // --- HELPER: Consistent Key Generation (Local Time) ---
  const getKeyAndLabel = (date: Date, type: 'day' | 'week' | 'month') => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      
      if (type === 'day') {
          return {
              key: `${y}-${m}-${d}`,
              label: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
          };
      } else if (type === 'week') {
          // Snap to Monday
          const dayOfWeek = date.getDay();
          const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
          const weekStart = new Date(date);
          weekStart.setDate(diff);
          const wy = weekStart.getFullYear();
          const wm = String(weekStart.getMonth() + 1).padStart(2, '0');
          const wd = String(weekStart.getDate()).padStart(2, '0');
          return {
              key: `${wy}-${wm}-${wd}`,
              label: weekStart.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
          };
      } else {
          return {
              key: `${y}-${m}`,
              label: date.toLocaleDateString('default', { month: 'short', year: '2-digit' })
          };
      }
  };

  // --- 1. GLOBAL DASHBOARD KPI CARDS ---
  const globalStats = useMemo(() => {
    const validBookings = bookings.filter(b => b.status !== 'cancelled');
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Helper for "This Week"
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0,0,0,0);

    let revenueMonth = 0;
    let revenueWeek = 0;
    const totalRevenue = validBookings.reduce((sum, b) => sum + b.totalCost, 0);

    validBookings.forEach(b => {
        const bDate = getCreatedDate(b);
        
        if (bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear) {
            revenueMonth += b.totalCost;
        }
        // Simple comparison for week
        if (bDate.getTime() >= startOfWeek.getTime()) {
            revenueWeek += b.totalCost;
        }
    });

    return {
        totalRevenue,
        totalTrips: validBookings.length,
        revenueMonth,
        revenueWeek,
        avgTicket: validBookings.length > 0 ? Math.round(totalRevenue / validBookings.length) : 0
    };
  }, [bookings]);

  // --- 2. DYNAMIC ANALYSIS DATA ---
  const analysisData = useMemo(() => {
    const validBookings = bookings.filter(b => b.status !== 'cancelled');
    const now = new Date();
    
    let startDate = new Date();
    let endDate = new Date();
    
    // End of today
    endDate.setHours(23,59,59,999);
    
    let groupBy: 'day' | 'week' | 'month' = 'month';

    if (viewMode === 'daily') {
        startDate.setDate(now.getDate() - 30);
        startDate.setHours(0,0,0,0);
        groupBy = 'day';
    } else if (viewMode === 'weekly') {
        startDate.setDate(now.getDate() - 84); // 12 weeks
        startDate.setHours(0,0,0,0);
        groupBy = 'week';
    } else if (viewMode === 'monthly') {
        startDate.setMonth(now.getMonth() - 11);
        startDate.setDate(1);
        startDate.setHours(0,0,0,0);
        groupBy = 'month';
    } else if (viewMode === 'custom') {
        if (customStart && customEnd) {
            startDate = new Date(customStart);
            startDate.setHours(0,0,0,0);
            
            endDate = new Date(customEnd);
            endDate.setHours(23,59,59,999);
            
            const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
            if (diffDays <= 45) groupBy = 'day';
            else if (diffDays <= 180) groupBy = 'week';
            else groupBy = 'month';
        } else {
            startDate.setDate(now.getDate() - 7);
            groupBy = 'day';
        }
    }

    // Filter Bookings within Range
    const filtered = validBookings.filter(b => {
        const d = getCreatedDate(b);
        return d.getTime() >= startDate.getTime() && d.getTime() <= endDate.getTime();
    });

    // --- Generate Chart Buckets ---
    const chartMap = new Map<string, number>();
    const chartLabels: { label: string }[] = [];

    let iter = new Date(startDate);
    let safetyCounter = 0;
    
    // Initialize Buckets
    while (iter <= endDate && safetyCounter < 366) {
        const { key, label } = getKeyAndLabel(iter, groupBy);
        
        if (!chartMap.has(key)) {
             chartMap.set(key, 0);
             chartLabels.push({ label });
        }
        
        if (groupBy === 'day') iter.setDate(iter.getDate() + 1);
        else if (groupBy === 'week') iter.setDate(iter.getDate() + 7);
        else {
            iter.setDate(1);
            iter.setMonth(iter.getMonth() + 1);
        }
        safetyCounter++;
    }

    // Fill Buckets
    filtered.forEach(b => {
        const d = getCreatedDate(b);
        const { key } = getKeyAndLabel(d, groupBy);
        
        if (chartMap.has(key)) {
            chartMap.set(key, (chartMap.get(key) || 0) + b.totalCost);
        }
    });

    const chartData = Array.from(chartMap).map(([_, value], idx) => ({
        label: chartLabels[idx]?.label || '',
        value
    }));

    // Top Performers
    const carStats: Record<string, { revenue: number, count: number, name: string }> = {};
    filtered.forEach(b => {
        if (!carStats[b.carId]) {
            carStats[b.carId] = { revenue: 0, count: 0, name: b.carName };
        }
        carStats[b.carId].revenue += b.totalCost;
        carStats[b.carId].count += 1;
    });
    
    const topCars = Object.values(carStats)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    const periodRevenue = filtered.reduce((s, b) => s + b.totalCost, 0);

    return { chartData, topCars, periodRevenue };
  }, [bookings, viewMode, customStart, customEnd]);

  const maxChartValue = Math.max(...analysisData.chartData.map(d => d.value), 100);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-black text-gray-900 uppercase italic">Sales Intelligence</h2>
                <p className="text-gray-500 text-sm">Financial performance and fleet metrics.</p>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 text-xs font-bold text-gray-500 shadow-sm">
                Live Data
            </div>
        </div>

        {/* Global KPI Cards (Fixed) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-black text-white p-6 rounded-3xl shadow-xl relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
                <div className="relative z-10">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Revenue</p>
                    <h3 className="text-3xl font-black">₹{globalStats.totalRevenue.toLocaleString()}</h3>
                    <div className="mt-4 flex items-center gap-2 text-xs font-medium text-gray-400">
                        <span className="bg-white/20 px-2 py-1 rounded text-white">Lifetime</span>
                        <span>{globalStats.totalTrips} Bookings</span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-red-100 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">This Month</p>
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                </div>
                <h3 className="text-2xl font-black text-gray-900">₹{globalStats.revenueMonth.toLocaleString()}</h3>
                <p className="text-xs text-gray-400 mt-1">Current calendar month</p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-emerald-100 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">This Week</p>
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </div>
                </div>
                <h3 className="text-2xl font-black text-gray-900">₹{globalStats.revenueWeek.toLocaleString()}</h3>
                <p className="text-xs text-gray-400 mt-1">Since Sunday</p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Avg. Trip Value</p>
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    </div>
                </div>
                <h3 className="text-2xl font-black text-gray-900">₹{globalStats.avgTicket.toLocaleString()}</h3>
                <p className="text-xs text-gray-400 mt-1">Per confirmed booking</p>
            </div>
        </div>

        {/* ANALYSIS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Chart Card */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Revenue Analysis</h3>
                        <p className="text-xs text-gray-500 font-bold mt-1">
                            Period Total: <span className="text-black text-sm">₹{analysisData.periodRevenue.toLocaleString()}</span>
                        </p>
                    </div>
                    {/* View Switcher */}
                    <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl">
                        {(['daily', 'weekly', 'monthly', 'custom'] as const).map((view) => (
                            <button
                                key={view}
                                onClick={() => setViewMode(view)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
                                    viewMode === view 
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {view === 'daily' ? 'Last 30D' : view === 'weekly' ? 'Last 3M' : view === 'monthly' ? 'Last 1Y' : 'Custom'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Date Inputs */}
                {viewMode === 'custom' && (
                    <div className="flex items-end gap-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200 animate-fade-in relative z-10">
                        <div className="flex-1 group relative">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">From Date</label>
                            <div className="relative w-full bg-white border border-gray-200 rounded-lg h-10 flex items-center px-3 hover:border-red-400 transition-colors">
                                <span className="text-xs font-bold text-gray-700 flex-1">{customStart || 'Select Date'}</span>
                                <input 
                                    type="date" 
                                    value={customStart} 
                                    onChange={(e) => {
                                        setCustomStart(e.target.value);
                                        if (customEnd && e.target.value > customEnd) setCustomEnd('');
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                                />
                            </div>
                        </div>

                        <div className="flex-1 group relative">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">To Date</label>
                            <div className="relative w-full bg-white border border-gray-200 rounded-lg h-10 flex items-center px-3 hover:border-red-400 transition-colors">
                                <span className={`text-xs font-bold flex-1 ${customEnd ? 'text-gray-700' : 'text-gray-400'}`}>{customEnd || 'Select Date'}</span>
                                <input 
                                    type="date" 
                                    min={customStart}
                                    value={customEnd} 
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                                />
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Visual Chart */}
                <div className="h-64 flex items-end justify-between gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {analysisData.chartData.length > 0 ? (
                        analysisData.chartData.map((data, idx) => {
                            const heightPercent = maxChartValue > 0 ? (data.value / maxChartValue) * 100 : 0;
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center group min-w-[30px]">
                                    <div className="relative w-full bg-gray-50 rounded-t-sm flex items-end justify-center overflow-hidden hover:bg-gray-100 transition-colors h-full">
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none">
                                            ₹{data.value.toLocaleString()}
                                        </div>
                                        <div 
                                            className={`w-full mx-0.5 rounded-t transition-all duration-700 ease-out relative ${data.value > 0 ? 'bg-red-600' : 'bg-transparent'}`}
                                            style={{ height: `${data.value > 0 ? Math.max(heightPercent, 2) : 0}%` }}
                                        >
                                            <div className="absolute top-0 left-0 w-full h-1 bg-white/20"></div>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-bold text-gray-400 mt-2 truncate w-full text-center">{data.label}</span>
                                </div>
                            );
                        })
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            No data found for this period.
                        </div>
                    )}
                </div>
            </div>

            {/* Top Performers (Dynamic) */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Top Performers</h3>
                    <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-wider">In Selected Period</p>
                </div>
                
                <div className="space-y-4 overflow-y-auto flex-1 max-h-[300px] pr-2">
                    {analysisData.topCars.length > 0 ? (
                        analysisData.topCars.map((car, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border text-xs ${idx === 0 ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-white text-gray-900 border-gray-200'}`}>
                                        #{idx + 1}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate max-w-[120px]" title={car.name}>{car.name}</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase">{car.count} Trips</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-gray-900">₹{car.revenue.toLocaleString()}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-gray-400 text-xs font-bold">
                            No bookings in this period.
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default OwnerAnalytics;
