"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/services/api";
import { 
    ShoppingBag, Search, Filter, Calendar, 
    ArrowUpDown, Loader2, Download, Eye,
    TrendingUp, Clock, CheckCircle2, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface Order {
    _id: string;
    patientId: { _id: string; name: string; contact: string };
    doctorId: { _id: string; name: string };
    date: string;
    status: string;
    price: number;
    reason: string;
    createdAt: string;
    invoiceUrl?: string;
}

export default function AdminOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [timeframe, setTimeframe] = useState("all"); // all, today, month, year
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            let startDate, endDate;
            const now = new Date();

            if (timeframe === "today") {
                startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
                endDate = new Date(now.setHours(23, 59, 59, 999)).toISOString();
            } else if (timeframe === "month") {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
            } else if (timeframe === "year") {
                startDate = new Date(now.getFullYear(), 0, 1).toISOString();
                endDate = new Date(now.getFullYear(), 11, 31).toISOString();
            }

            const res = await api.get("/admin/orders", {
                params: {
                    status: statusFilter === "all" ? undefined : statusFilter,
                    startDate,
                    endDate,
                    page,
                    limit: 10
                }
            });

            if (res.data?.success) {
                setOrders(res.data.data.orders);
                setTotalPages(res.data.data.pages);
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    }, [statusFilter, timeframe, page]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const statusStyles: Record<string, string> = {
        completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
        confirmed: "bg-blue-100 text-blue-700 border-blue-200",
        pending: "bg-amber-100 text-amber-700 border-amber-200",
        cancelled: "bg-rose-100 text-rose-700 border-rose-200",
    };

    const filteredOrders = orders.filter(o => 
        o.patientId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.doctorId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o._id.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <ShoppingBag className="text-teal-600" />
                        Real-time Orders
                    </h1>
                    <p className="text-slate-500 mt-1">Monitor all appointments and financial transactions in real-time.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="flex items-center gap-2">
                        <Download size={16} /> Export CSV
                    </Button>
                </div>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-teal-50 rounded-lg text-teal-600">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+12%</span>
                    </div>
                    <p className="text-sm text-slate-500 font-medium">Total Volume</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">
                        ₹{orders.reduce((acc, o) => acc + (o.price || 0), 0).toLocaleString()}
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Clock size={20} />
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 font-medium">Pending Orders</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">
                        {orders.filter(o => o.status === "pending").length}
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <CheckCircle2 size={20} />
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 font-medium">Completed</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">
                        {orders.filter(o => o.status === "completed").length}
                    </h3>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                            <XCircle size={20} />
                        </div>
                    </div>
                    <p className="text-sm text-slate-500 font-medium">Cancelled</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">
                        {orders.filter(o => o.status === "cancelled").length}
                    </h3>
                </div>
            </div>

            {/* Advanced Filtering */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by ID, patient or doctor..." 
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-slate-400" />
                        <select 
                            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-slate-400" />
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            {(["all", "today", "month", "year"] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => { setTimeframe(t); setPage(1); }}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                                        timeframe === t 
                                        ? "bg-white text-teal-600 shadow-sm" 
                                        : "text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="animate-spin text-teal-500" size={32} />
                        <p className="text-slate-500 animate-pulse">Synchronizing transactions...</p>
                    </div>
                ) : (
                    <>
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="w-[100px]">Order ID</TableHead>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Doctor</TableHead>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.length > 0 ? (
                                    filteredOrders.map((order) => (
                                        <TableRow key={order._id} className="hover:bg-slate-50/50 transition-colors group">
                                            <TableCell className="font-mono text-xs text-slate-500 uppercase">
                                                #{order._id.slice(-6)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-900">{order.patientId?.name || "Unknown"}</span>
                                                    <span className="text-xs text-slate-500">{order.patientId?.contact || "N/A"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-700 font-medium">
                                                Dr. {order.doctorId?.name || "Deleted Doctor"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-sm">
                                                    <span>{new Date(order.date).toLocaleDateString()}</span>
                                                    <span className="text-xs text-slate-500">{new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-bold text-slate-900">
                                                ₹{order.price || 500}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusStyles[order.status] || "bg-slate-100 text-slate-600"}`}>
                                                    {order.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {order.invoiceUrl && (
                                                        <a href={order.invoiceUrl} target="_blank" rel="noopener noreferrer">
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50">
                                                                <Eye size={16} />
                                                            </Button>
                                                        </a>
                                                    )}
                                                    <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-500">
                                                        Details
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                                            No orders found for the selected filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        
                        {/* Pagination */}
                        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                            <p className="text-sm text-slate-500">
                                Showing <span className="font-medium text-slate-900">{filteredOrders.length}</span> of <span className="font-medium text-slate-900">N/A</span> orders
                            </p>
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    Previous
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
