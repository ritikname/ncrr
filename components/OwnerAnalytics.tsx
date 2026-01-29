
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

// Props are ignored now as we fetch data internally for accuracy
interface OwnerAnalyticsProps {
  bookings?: any[]; 
}

interface AnalyticsData {
  stats: {
    totalRevenue: number;
    totalBookings: number;
    avgBookingValue: number;
  };
  chart: {
    labels: string[];
    values: number[];
  };
  insights: {
    weeklySales: { labels: string[], revenue: number[], quantity: number[] };
    topCars: { car_name: string, quantity: number, revenue: number }[];
    typePerformance: { category: string, quantity: number, revenue: number }[];
  };
}

const OwnerAnalytics: React.FC<OwnerAnalyticsProps> = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter States
  const [range, setRange] = useState<'7d' | '8w' | 'monthly' | 'yearly' | 'custom'>('monthly');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    // Only auto-fetch if NOT custom. Custom is handled manually via "Go"
    if (range !== 'custom') {
        fetchData();
    }
  }, [range]);

  const fetchData = async (overrides?: { range?: string; startDate?: string; endDate?: string }) => {
    setLoading(true);
    try {
      // Use overrides if provided, otherwise fall back to state
      const activeRange = overrides?.range || range;
      const params: any = { range: activeRange };

      if (activeRange === 'custom') {
          const start = overrides?.startDate || customStart;
          const end = overrides?.endDate || customEnd;

          if (!start || !end) {
              setLoading(false);
              return; // Don't fetch invalid custom range
          }
          params.startDate = start;
          params.endDate = end;
      }
      
      const res = await api.analytics.getSalesReport(params);
      setData(res);
    } catch (e: any) {
      console.error(e);
      setError('Failed to load sales report');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomApply = () => {
      if (customStart && customEnd) {
          if (customStart > customEnd) {
              alert("Start date cannot be after end date.");
              return;
          }
          setRange('custom');
          // Force fetch with new values immediately to avoid state race conditions
          fetchData({ range: 'custom', startDate: customStart, endDate: customEnd }); 
      } else {
          alert("Please select both start and end dates.");
      }
  };

  if (loading && !data) {
      return (
          <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
      );
  }

  if (error || !data) {
      return (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <p className="text-gray-400 font-bold">{error || 'No data available'}</p>
              <button onClick={() => fetchData()} className="mt-4 text-red-600 font-bold hover:underline">Retry</button>
          </div>
      );
  }

  const { stats, chart, insights } = data;
  const maxChartValue = Math.max(...chart.values, 100);

  // Safe defaults for insights if API returns partial data
  const topCars = insights?.topCars || [];
  const typePerf = insights?.typePerformance || [];
  const weeklySales = insights?.weeklySales || { labels: [], revenue: [], quantity: [] };

  const maxWeeklyRevenue = Math.max(...weeklySales.revenue, 10);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-black text-gray-900 uppercase italic">Sales Intelligence</h2>
                <p className="text-gray-500 text-sm">Real-time financial performance and fleet metrics.</p>
            </div>
            <div className="flex items-center gap-2">
                 <button onClick={() => fetchData()} className="bg-white p-2 rounded-xl border border-gray-100 hover:bg-gray-50 text-gray-500 shadow-sm transition-colors" title="Refresh Data">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                 </button>
                 <div className="bg-green-50 px-3 py-1.5 rounded-xl border border-green-100 text-[10px] font-bold text-green-700 shadow-sm flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Live Data
                </div>
            </div>
        </div>

        {/* Global KPI Cards (Lifetime) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-black text-white p-6 rounded-3xl shadow-xl relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
                <div className="relative z-10">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Revenue</p>
                    <h3 className="text-3xl font-black">₹{stats.totalRevenue.toLocaleString()}</h3>
                    <div className="mt-4 flex items-center gap-2 text-xs font-medium text-gray-400">
                        <span className="bg-white/20 px-2 py-1 rounded text-white">Lifetime</span>
                        <span>All bookings</span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-red-100 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total Bookings</p>
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    </div>
                </div>
                <h3 className="text-2xl font-black text-gray-900">{stats.totalBookings}</h3>
                <p className="text-xs text-gray-400 mt-1">Confirmed trips</p>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Avg. Trip Value</p>
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                </div>
                <h3 className="text-2xl font-black text-gray-900">₹{stats.avgBookingValue.toLocaleString()}</h3>
                <p className="text-xs text-gray-400 mt-1">Per booking</p>
            </div>
        </div>

        {/* ANALYSIS CHART SECTION */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Revenue Trends</h3>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                        Visualizing sales over time.
                    </p>
                </div>
                {/* Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Presets */}
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
                        {(['7d', '8w', 'monthly', 'yearly'] as const).map((r) => (
                            <button
                                key={r}
                                onClick={() => { setRange(r); setCustomStart(''); setCustomEnd(''); }}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize whitespace-nowrap ${
                                    range === r 
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {r === '7d' ? '7 Days' : r === '8w' ? '8 Weeks' : r === 'monthly' ? 'Monthly' : 'Yearly'}
                            </button>
                        ))}
                    </div>
                    {/* Custom Range */}
                    <div className={`flex items-center gap-2 p-1 rounded-xl border transition-all ${range === 'custom' ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-gray-50 border-gray-200'}`}>
                        <input 
                            type="date" 
                            value={customStart} 
                            onChange={(e) => setCustomStart(e.target.value)} 
                            className="bg-transparent text-xs font-bold text-gray-700 w-24 outline-none px-1"
                        />
                        <span className="text-gray-400 text-xs">-</span>
                        <input 
                            type="date" 
                            value={customEnd} 
                            min={customStart}
                            onChange={(e) => setCustomEnd(e.target.value)} 
                            className="bg-transparent text-xs font-bold text-gray-700 w-24 outline-none px-1"
                        />
                        <button 
                            onClick={handleCustomApply}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                                customStart && customEnd ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400'
                            }`}
                        >
                            Go
                        </button>
                    </div>
                </div>
            </div>

            {/* Visual Chart */}
            <div className={`h-64 flex items-end justify-between gap-2 sm:gap-4 pb-2 relative border-b border-gray-100 ${loading ? 'opacity-50' : ''}`}>
                {chart.values.length > 0 && chart.values.some(v => v > 0) ? (
                    chart.values.map((val, idx) => {
                        const heightPercent = maxChartValue > 0 ? (val / maxChartValue) * 100 : 0;
                        const label = chart.labels[idx];
                        
                        return (
                            <div key={idx} className="flex-1 flex flex-col items-center group min-w-[30px] h-full justify-end relative">
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none transform translate-y-2 group-hover:translate-y-0 duration-200">
                                    ₹{val.toLocaleString()}
                                </div>
                                
                                {/* Bar */}
                                <div 
                                    className={`w-full mx-1 rounded-t-sm transition-all duration-700 ease-out relative hover:opacity-80 ${val > 0 ? 'bg-red-600' : 'bg-gray-100'}`}
                                    style={{ height: val > 0 ? `${Math.max(heightPercent, 2)}%` : '4px' }}
                                ></div>
                                
                                {/* Label */}
                                <span className="absolute -bottom-8 text-[10px] font-bold text-gray-400 w-full text-center truncate px-0.5">
                                    {label}
                                </span>
                            </div>
                        );
                    })
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs font-bold bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                        {loading ? 'Loading...' : 'No sales data found for this period.'}
                    </div>
                )}
            </div>
            {/* Spacer for labels */}
            <div className="h-6"></div>
        </div>

        {/* PERFORMANCE INSIGHTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left: Performance Mix (Top Cars & Types) */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                    <div>
                       <h3 className="text-lg font-bold text-gray-900">Performance Leaders</h3>
                       <p className="text-xs text-gray-500 font-medium mt-1">Top performing cars & categories (Selected Period)</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Top Cars List */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Top 5 Cars</h4>
                        {topCars.length > 0 ? (
                            <div className="space-y-4">
                                {topCars.map((car, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                                                #{idx + 1}
                                            </span>
                                            <span className="font-bold text-gray-900">{car.car_name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-bold text-gray-900">₹{car.revenue.toLocaleString()}</span>
                                            <span className="text-[10px] text-gray-400">{car.quantity} Trips</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-400 text-xs italic">No car data available</div>
                        )}
                    </div>

                    {/* Fleet Mix (Bars) */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Revenue by Category</h4>
                        {typePerf.length > 0 ? (
                            <div className="space-y-3">
                                {typePerf.map((type, idx) => {
                                    const totalRevenue = typePerf.reduce((sum, t) => sum + t.revenue, 0);
                                    const percent = totalRevenue > 0 ? Math.round((type.revenue / totalRevenue) * 100) : 0;
                                    return (
                                        <div key={idx} className="group">
                                            <div className="flex justify-between text-xs font-bold mb-1">
                                                <span>{type.category}</span>
                                                <span className="text-gray-500">{percent}% (₹{type.revenue.toLocaleString()})</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                <div 
                                                    className="bg-black h-full rounded-full transition-all duration-1000 ease-out group-hover:bg-red-600" 
                                                    style={{ width: `${percent}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-400 text-xs italic">No category data available</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Weekly Breakdown Chart/List */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Breakdown Activity</h3>
                    <p className="text-xs text-gray-500 font-medium mt-1">Car-wise revenue for the selected period</p>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide max-h-[400px]">
                    {weeklySales.labels.length > 0 ? (
                        <div className="space-y-4">
                            {weeklySales.labels.map((label, idx) => {
                                const rev = weeklySales.revenue[idx];
                                const qty = weeklySales.quantity[idx];
                                const widthPercent = maxWeeklyRevenue > 0 ? (rev / maxWeeklyRevenue) * 100 : 0;

                                return (
                                    <div key={idx} className="flex items-center gap-4">
                                        <div className="w-24 flex-shrink-0 text-right">
                                            <div className="text-xs font-bold text-gray-900 truncate" title={label}>{label}</div>
                                            <div className="text-[10px] text-gray-400">{qty} Booking{qty !== 1 ? 's' : ''}</div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="h-8 bg-gray-50 rounded-r-xl flex items-center relative group overflow-hidden">
                                                <div 
                                                    className="absolute top-0 left-0 h-full bg-red-100 rounded-r-xl transition-all duration-700 ease-out"
                                                    style={{ width: `${Math.max(widthPercent, 2)}%` }}
                                                ></div>
                                                <span className="relative z-10 pl-3 text-xs font-bold text-red-700">₹{rev.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                                <span className="text-2xl">💤</span>
                            </div>
                            <p className="text-sm font-bold">No sales for this period.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default OwnerAnalytics;
