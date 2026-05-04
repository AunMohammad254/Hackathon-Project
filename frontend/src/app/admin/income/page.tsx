"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import { 
    DollarSign, TrendingUp, 
    PieChart, Activity, Download,
    Percent, Calculator, Loader2, ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
    XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";

interface FinancialData {
    totalRevenue: number;
    breakdown: { _id: string; revenue: number; orders: number }[];
    timeframe: string;
}

export default function AdminIncome() {
    const [data, setData] = useState<FinancialData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState("monthly"); // daily, monthly, hourly
    const [taxRate, setTaxRate] = useState(18); // Default 18% tax

    const fetchFinancials = async () => {
        setLoading(true);
        try {
            const res = await api.get("/admin/financials", {
                params: { timeframe }
            });
            if (res.data?.success) {
                setData(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch financials:", error);
            toast.error("Failed to load financial data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchFinancials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeframe]);

    const totalRevenue = data?.totalRevenue || 0;
    const taxAmount = (totalRevenue * taxRate) / 100;
    const netProfit = totalRevenue - taxAmount;

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <DollarSign className="text-emerald-600" />
                        Financial Analytics
                    </h1>
                    <p className="text-slate-500 mt-1">Track revenue, calculate profits, and monitor financial growth.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex items-center gap-2">
                        <Download size={16} /> Export Report
                    </Button>
                </div>
            </header>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 text-emerald-50 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingUp size={120} />
                    </div>
                    <p className="text-sm text-slate-500 font-medium">Gross Revenue</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-2">₹{totalRevenue.toLocaleString()}</h3>
                    <div className="flex items-center gap-1 mt-4 text-emerald-600 text-sm font-medium">
                        <ArrowUpRight size={16} />
                        <span>+14.5% vs last month</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 text-amber-50 opacity-10 group-hover:scale-110 transition-transform">
                        <Percent size={120} />
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-500 font-medium">Estimated Tax</p>
                        <div className="flex items-center gap-2 bg-slate-100 px-2 py-1 rounded-lg">
                            <span className="text-xs font-bold text-slate-600">{taxRate}%</span>
                        </div>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-800 mt-2">₹{taxAmount.toLocaleString()}</h3>
                    <div className="mt-4 flex items-center gap-2">
                        <input 
                            type="range" 
                            min="0" 
                            max="50" 
                            value={taxRate} 
                            onChange={(e) => setTaxRate(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 text-blue-50 opacity-10 group-hover:scale-110 transition-transform">
                        <Calculator size={120} />
                    </div>
                    <p className="text-sm text-slate-500 font-medium">Net Profit</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-2">₹{netProfit.toLocaleString()}</h3>
                    <div className="flex items-center gap-1 mt-4 text-blue-600 text-sm font-medium">
                        <Activity size={16} />
                        <span>Calculated after {taxRate}% tax</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Revenue Trend</h3>
                            <p className="text-sm text-slate-500">Visualizing income over selected timeframe</p>
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            {(["hourly", "daily", "monthly"] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTimeframe(t)}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                        timeframe === t 
                                        ? "bg-white text-emerald-600 shadow-sm" 
                                        : "text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-[350px] w-full">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 className="animate-spin text-emerald-500" size={32} />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data?.breakdown || []}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="_id" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                        tickFormatter={(value) => `₹${value}`}
                                    />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, "Revenue"]}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="revenue" 
                                        stroke="#10b981" 
                                        strokeWidth={3}
                                        fillOpacity={1} 
                                        fill="url(#colorRev)" 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Activity className="text-blue-500" size={20} />
                        Efficiency Metrics
                    </h3>
                    
                    <div className="space-y-6">
                        <div className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-500">Avg. Revenue Per Order</span>
                                <span className="text-sm font-bold text-slate-800">
                                    ₹{data?.breakdown.length ? (totalRevenue / data.breakdown.reduce((a, b) => a + b.orders, 0)).toFixed(2) : "0"}
                                </span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full w-[70%]" />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-500">Tax Compliance</span>
                                <span className="text-sm font-bold text-slate-800">98.2%</span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full w-[98%]" />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-slate-500">Profit Margin</span>
                                <span className="text-sm font-bold text-slate-800">{((netProfit / totalRevenue) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-amber-500 h-full w-[82%]" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <div className="flex gap-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm h-fit">
                                <PieChart className="text-emerald-600" size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-emerald-900">Optimization Tip</h4>
                                <p className="text-sm text-emerald-700 mt-1 leading-relaxed">
                                    Your hourly revenue peaks at 11:00 AM. Consider adding more staff during this window to maximize throughput.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
