"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { User, Loader2, Save, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function ReceptionistProfilePage() {
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        name: user?.name || "",
        email: user?.email || "",
        role: "Front Desk Coordinator",
        department: "Patient Relations",
        contact: "+1 (555) 000-1234",
        location: "Main Wing, Floor 1",
    });

    const handleSave = async () => {
        setSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            toast.success("Receptionist profile updated!");
        } catch {
            toast.error("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <User className="text-blue-500" />
                    Staff Profile
                </h1>
                <p className="text-slate-500 mt-2 text-lg">Manage your personal information and desk location.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: ID Card */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
                        <div className="h-24 bg-blue-600" />
                        <CardContent className="relative pt-0 flex flex-col items-center">
                            <div className="relative -mt-12 mb-4">
                                <div className="w-24 h-24 rounded-2xl bg-white p-1.5 shadow-lg">
                                    <div className="w-full h-full rounded-xl bg-slate-50 flex items-center justify-center text-blue-600 text-3xl font-black border border-slate-100 uppercase">
                                        {profile.name?.charAt(0)}
                                    </div>
                                </div>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
                            <p className="text-blue-600 text-sm font-semibold uppercase tracking-wider">{profile.role}</p>
                            
                            <div className="w-full mt-8 space-y-3">
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Mail size={14} className="text-slate-400" />
                                    <span className="truncate">{profile.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <MapPin size={14} className="text-slate-400" />
                                    <span>{profile.location}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50 border-blue-100">
                        <CardContent className="p-4 flex gap-4 items-center">
                            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                <ShieldCheck size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-blue-900">Verified Staff</h4>
                                <p className="text-xs text-blue-700">Authorized Front Desk Access</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Edit Form */}
                <Card className="lg:col-span-2 border-slate-200 bg-white shadow-sm">
                    <CardHeader className="p-8 border-b border-slate-50">
                        <CardTitle className="text-xl">Account Settings</CardTitle>
                        <CardDescription>Update your contact details and office information.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                                <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="h-11 bg-slate-50/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                                <Input value={profile.email} disabled className="h-11 bg-slate-100 text-slate-400 cursor-not-allowed" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Number</label>
                                <Input value={profile.contact} onChange={(e) => setProfile({ ...profile, contact: e.target.value })} className="h-11 bg-slate-50/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Department</label>
                                <Input value={profile.department} onChange={(e) => setProfile({ ...profile, department: e.target.value })} className="h-11 bg-slate-50/50" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Office Location</label>
                                <Input value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} className="h-11 bg-slate-50/50" />
                            </div>
                        </div>

                        <div className="pt-8 flex justify-end">
                            <Button 
                                onClick={handleSave} 
                                disabled={saving} 
                                className="bg-slate-900 hover:bg-slate-800 h-11 px-8 font-bold gap-2 text-sm uppercase tracking-wider transition-all active:scale-95"
                            >
                                {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={18} />}
                                Update Profile
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
