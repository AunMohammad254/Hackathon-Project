"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import { User, Loader2, Save, Stethoscope, Mail, ShieldCheck } from "lucide-react";
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

export default function DoctorProfilePage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        name: user?.name || "",
        email: user?.email || "",
        specialization: "General Physician",
        experience: "8 Years",
        bio: "Dedicated medical professional with a focus on patient-centric care and AI-assisted diagnostics.",
        availability: "Mon - Fri, 9:00 AM - 5:00 PM",
    });

    const handleSave = async () => {
        setSaving(true);
        try {
            // Mocking API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success("Doctor profile updated!");
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
                    <User className="text-indigo-500" />
                    Medical Profile
                </h1>
                <p className="text-slate-500 mt-2 text-lg">Manage your professional identity and clinic availability.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Profile Card */}
                <Card className="lg:col-span-1 border-none shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
                    <div className="h-32 bg-gradient-to-br from-indigo-600 to-blue-700" />
                    <CardContent className="relative pt-0 flex flex-col items-center">
                        <div className="relative -mt-16 mb-4">
                            <div className="w-32 h-32 rounded-3xl bg-white p-2 shadow-xl">
                                <div className="w-full h-full rounded-2xl bg-slate-100 flex items-center justify-center text-indigo-600 text-4xl font-black border border-slate-200">
                                    {profile.name?.charAt(0)}
                                </div>
                            </div>
                            <div className="absolute bottom-1 right-1 h-8 w-8 bg-emerald-500 border-4 border-white rounded-full shadow-lg flex items-center justify-center">
                                <ShieldCheck size={16} className="text-white" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Dr. {profile.name}</h2>
                        <p className="text-indigo-600 font-semibold">{profile.specialization}</p>
                        
                        <div className="w-full mt-8 space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <Mail className="text-slate-400" size={18} />
                                <span className="text-sm text-slate-600 truncate">{profile.email}</span>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <Stethoscope className="text-slate-400" size={18} />
                                <span className="text-sm text-slate-600">{profile.experience} Experience</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Edit Form */}
                <Card className="lg:col-span-2 border-slate-200 bg-white">
                    <CardHeader>
                        <CardTitle className="text-xl">Professional Information</CardTitle>
                        <CardDescription>Update your public bio and specialization details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Display Name</label>
                                <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="h-12 bg-slate-50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Specialization</label>
                                <Input value={profile.specialization} onChange={(e) => setProfile({ ...profile, specialization: e.target.value })} className="h-12 bg-slate-50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Years of Experience</label>
                                <Input value={profile.experience} onChange={(e) => setProfile({ ...profile, experience: e.target.value })} className="h-12 bg-slate-50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Availability</label>
                                <Input value={profile.availability} onChange={(e) => setProfile({ ...profile, availability: e.target.value })} className="h-12 bg-slate-50" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Short Bio</label>
                            <textarea 
                                value={profile.bio} 
                                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex justify-end">
                            <Button 
                                onClick={handleSave} 
                                disabled={saving} 
                                className="bg-indigo-600 hover:bg-indigo-700 h-12 px-8 font-bold gap-2 shadow-lg shadow-indigo-200"
                            >
                                {saving ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={18} />}
                                Save Changes
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
