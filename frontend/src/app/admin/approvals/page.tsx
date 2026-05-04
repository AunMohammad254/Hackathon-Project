"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import { Loader2, ShieldAlert, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}

export default function ApprovalsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [pendingUsers, setPendingUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchPendingUsers = async () => {
        try {
            const res = await api.get("/admin/users/pending");
            setPendingUsers(res.data.users);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || "Failed to fetch pending users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== "Super Admin") {
                router.push("/dashboard");
                return;
            }
            fetchPendingUsers();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, authLoading, router]);

    const handleAction = async (userId: string, action: "Approved" | "Rejected") => {
        setActionLoading(userId);
        try {
            await api.put(`/admin/users/${userId}/status`, { status: action });
            setPendingUsers((prev) => prev.filter((u) => u._id !== userId));
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || `Failed to ${action.toLowerCase()} user`);
        } finally {
            setActionLoading(null);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        );
    }

    if (user?.role !== "Super Admin") {
        return null; // Let the useEffect redirect
    }

    return (
        <div className="p-8 max-w-6xl mx-auto mt-20">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    <ShieldAlert className="h-8 w-8 text-indigo-600" />
                    Pending Staff Approvals
                </h1>
                <p className="text-slate-500 mt-2">
                    Review and approve or reject staff registration requests.
                </p>
            </div>

            {error && (
                <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-lg flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                    {error}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Requested Role</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pendingUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                                    No pending registrations found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            pendingUsers.map((u) => (
                                <TableRow key={u._id}>
                                    <TableCell className="font-medium">{u.name}</TableCell>
                                    <TableCell>{u.email}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                            {u.role}
                                        </span>
                                    </TableCell>
                                    <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleAction(u._id, "Rejected")}
                                            disabled={actionLoading === u._id}
                                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                        >
                                            {actionLoading === u._id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <XCircle className="h-4 w-4 mr-1" />
                                            )}
                                            Reject
                                        </Button>
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => handleAction(u._id, "Approved")}
                                            disabled={actionLoading === u._id}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                        >
                                            {actionLoading === u._id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <CheckCircle className="h-4 w-4 mr-1" />
                                            )}
                                            Approve
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
