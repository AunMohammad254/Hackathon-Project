"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import { toast } from "sonner";
import {
    Users, Loader2, Trash2, ShieldCheck, Search,
    UserCog
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface UserData {
    _id: string;
    name: string;
    email: string;
    role: string;
    subscriptionPlan: string;
    createdAt: string;
}

const ROLES = ["Admin", "Doctor", "Receptionist", "Patient"];

const roleBadgeColor: Record<string, string> = {
    Admin: "bg-rose-100 text-rose-700",
    Doctor: "bg-blue-100 text-blue-700",
    Receptionist: "bg-violet-100 text-violet-700",
    Patient: "bg-slate-100 text-slate-600",
};

export default function StaffManagement() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("All");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            const res = await api.get("/admin/users");
            if (res.data?.success) {
                setUsers(res.data.users);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchUsers();
    }, []);

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await api.put(`/admin/users/${userId}/role`, { role: newRole });
            toast.success(`Role updated to ${newRole}`);
            setUsers((prev) =>
                prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
            );
            setEditingId(null);
        } catch (error) {
            console.error("Failed to update role:", error);
        }
    };

    const handleDelete = async (userId: string) => {
        try {
            await api.delete(`/admin/users/${userId}`);
            toast.success("User deleted successfully");
            setUsers((prev) => prev.filter((u) => u._id !== userId));
            setDeletingId(null);
        } catch (error) {
            console.error("Failed to delete user:", error);
        }
    };

    const filteredUsers = users.filter((u) => {
        const matchesSearch =
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === "All" || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const roleCounts = ROLES.reduce((acc, role) => {
        acc[role] = users.filter((u) => u.role === role).length;
        return acc;
    }, {} as Record<string, number>);

    return (
        <>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <UserCog className="text-teal-500" />
                    Staff Management
                </h1>
                <p className="text-slate-500 mt-2 text-lg">Manage all registered users, assign roles, and control access.</p>
            </header>

            {/* Role Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {ROLES.map((role) => (
                    <button
                        key={role}
                        onClick={() => setRoleFilter(roleFilter === role ? "All" : role)}
                        className={`bg-white rounded-xl border p-4 text-left transition-all hover:shadow-md ${roleFilter === role
                                ? "border-teal-500 shadow-md ring-1 ring-teal-500/30"
                                : "border-slate-200"
                            }`}
                    >
                        <p className="text-sm text-slate-500 font-medium">{role}s</p>
                        <p className="text-3xl font-bold text-slate-800 mt-1">{roleCounts[role] || 0}</p>
                    </button>
                ))}
            </div>

            {/* Search + Filter Bar */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
                <div className="p-4 flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setRoleFilter("All")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${roleFilter === "All"
                                    ? "bg-teal-500 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                        >
                            All ({users.length})
                        </button>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin text-teal-500 w-8 h-8" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs">User</TableHead>
                                <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs">Email</TableHead>
                                <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs">Role</TableHead>
                                <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs">Plan</TableHead>
                                <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs">Joined</TableHead>
                                <TableHead className="font-semibold text-slate-500 uppercase tracking-wider text-xs text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((u) => (
                                    <TableRow key={u._id} className="hover:bg-slate-50/80 transition-colors group">
                                        <TableCell className="font-medium text-slate-900">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                    {u.name.charAt(0).toUpperCase()}
                                                </div>
                                                {u.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-500">{u.email}</TableCell>
                                        <TableCell>
                                            {editingId === u._id ? (
                                                <div className="flex gap-1.5 flex-wrap">
                                                    {ROLES.map((r) => (
                                                        <button
                                                            key={r}
                                                            onClick={() => handleRoleChange(u._id, r)}
                                                            className={`px-2 py-1 text-xs rounded-md font-medium border transition-all ${u.role === r
                                                                    ? "bg-teal-500 text-white border-teal-500"
                                                                    : "bg-white text-slate-600 border-slate-200 hover:border-teal-400 hover:text-teal-600"
                                                                }`}
                                                        >
                                                            {r}
                                                        </button>
                                                    ))}
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="px-2 py-1 text-xs rounded-md text-slate-400 hover:text-slate-600"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${roleBadgeColor[u.role] || "bg-slate-100 text-slate-600"}`}>
                                                    {u.role}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-0.5 text-xs rounded font-medium ${u.subscriptionPlan === "Pro"
                                                    ? "bg-amber-100 text-amber-700"
                                                    : "bg-slate-100 text-slate-500"
                                                }`}>
                                                {u.subscriptionPlan || "Free"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-sm">
                                            {new Date(u.createdAt).toLocaleDateString([], {
                                                month: "short", day: "numeric", year: "numeric"
                                            })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-slate-500 hover:text-teal-600 hover:bg-teal-50"
                                                    onClick={() => setEditingId(editingId === u._id ? null : u._id)}
                                                >
                                                    <ShieldCheck size={16} className="mr-1" /> Role
                                                </Button>

                                                {deletingId === u._id ? (
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-rose-600 hover:bg-rose-50"
                                                            onClick={() => handleDelete(u._id)}
                                                        >
                                                            Confirm
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-slate-400"
                                                            onClick={() => setDeletingId(null)}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                        onClick={() => setDeletingId(u._id)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Users className="text-slate-300" size={32} />
                                            {searchTerm || roleFilter !== "All"
                                                ? "No users match your filters."
                                                : "No users registered yet."}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>
        </>
    );
}
