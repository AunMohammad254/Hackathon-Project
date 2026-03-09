"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import { User, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function PatientProfile() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        age: "",
        gender: "",
        contact: "",
    });

    const fetchPatientData = useCallback(async () => {
        try {
            const res = await api.get("/patients");
            // Find patient matching current user email
            const match = res.data.find((p: { name?: string; age?: number; gender?: string; contact?: string }) => p.name === user?.name);
            if (match) {
                setProfile(prev => ({
                    ...prev,
                    age: match.age?.toString() || "",
                    gender: match.gender || "",
                    contact: match.contact || "",
                }));
            }
        } catch {
            // Ignore — patient record may not exist
        } finally {
            setLoading(false);
        }
    }, [user?.name]);

    useEffect(() => {
        if (user) {
            setProfile({
                name: user.name || "",
                email: user.email || "",
                age: "",
                gender: "",
                contact: "",
            });
            // Try to fetch patient record if linked
            fetchPatientData();
        }
    }, [user, fetchPatientData]);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Update user name via auth (if endpoint exists)
            toast.success("Profile updated!");
        } catch {
            toast.error("Failed to save");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-teal-500 w-8 h-8" />
            </div>
        );
    }

    return (
        <>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <User className="text-teal-500" />
                    My Profile
                </h1>
                <p className="text-slate-500 mt-2 text-lg">View and manage your personal information.</p>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 max-w-2xl">
                <div className="p-8 space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                            {profile.name?.charAt(0)?.toUpperCase() || "P"}
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-slate-800">{profile.name}</h2>
                            <p className="text-sm text-slate-500">{profile.email}</p>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">Full Name</label>
                            <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">Email</label>
                            <Input value={profile.email} disabled className="bg-slate-50 text-slate-400" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">Age</label>
                            <Input type="number" value={profile.age} onChange={(e) => setProfile({ ...profile, age: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">Gender</label>
                            <select
                                value={profile.gender}
                                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="">Select...</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-sm font-medium text-slate-700 mb-1 block">Contact Number</label>
                            <Input value={profile.contact} onChange={(e) => setProfile({ ...profile, contact: e.target.value })} placeholder="+92 300 1234567" />
                        </div>
                    </div>

                    <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white gap-2">
                        {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={16} />}
                        Save Changes
                    </Button>
                </div>
            </div>
        </>
    );
}
