"use client";

import React from "react";
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const PIE_COLORS = ["#f59e0b", "#3b82f6", "#10b981"];


interface AdminChartsProps {
    pieData: { name: string; value: number }[];
    barData: { month: string; appointments: number }[];
}

export function AdminCharts({ pieData, barData }: AdminChartsProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Pie Chart – Appointment Status */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all hover:shadow-md">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Appointment Status Breakdown</h2>
                {pieData.some(d => d.value > 0) ? (
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie 
                                data={pieData} 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={60} 
                                outerRadius={100} 
                                paddingAngle={4} 
                                dataKey="value" 
                                label={(props: { name?: string; percent?: number }) => `${props.name || ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`}
                            >
                                {pieData.map((_, i) => (
                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-[260px] text-slate-400">
                        <p>No appointment data yet</p>
                    </div>
                )}
            </div>

            {/* Bar Chart – Monthly Trends */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all hover:shadow-md">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Monthly Appointment Trends</h2>
                {barData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                cursor={{ fill: '#f8fafc' }}
                            />
                            <Bar dataKey="appointments" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-[260px] text-slate-400">
                        <p>No monthly data available</p>
                    </div>
                )}
            </div>
        </div>
    );
}
