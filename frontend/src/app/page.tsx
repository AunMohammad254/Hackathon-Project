"use client";

import Link from "next/link";
import { Activity, Stethoscope, ShieldCheck, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-2xl font-bold">
          <Activity className="text-teal-400" />
          <span>AI Clinic</span>
          <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded ml-1">SaaS</span>
        </div>
        <Link href="/login">
          <Button className="bg-teal-500 hover:bg-teal-600 text-white px-6">
            Sign In <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex flex-col items-center text-center px-6 pt-24 pb-32 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-4 py-1.5 text-sm text-teal-400 mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
          </span>
          Powered by Google Gemini AI
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6">
          Smart Clinic<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
            Management
          </span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
          Digitize your clinic. AI-powered symptom analysis, automated PDF prescriptions,
          and a unified dashboard for Doctors, Receptionists, and Admins.
        </p>
        <div className="flex gap-4">
          <Link href="/login">
            <Button size="lg" className="bg-teal-500 hover:bg-teal-600 h-14 px-8 text-lg shadow-lg shadow-teal-500/25">
              Get Started Free
            </Button>
          </Link>
        </div>
      </main>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-32">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-teal-500/30 transition-colors duration-300">
            <div className="bg-teal-500/10 text-teal-400 rounded-xl w-12 h-12 flex items-center justify-center mb-5">
              <Stethoscope size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">AI Diagnosis</h3>
            <p className="text-slate-400 leading-relaxed">
              Doctors input symptoms and receive Gemini-powered diagnostic suggestions with risk-level assessment in real-time.
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-teal-500/30 transition-colors duration-300">
            <div className="bg-indigo-500/10 text-indigo-400 rounded-xl w-12 h-12 flex items-center justify-center mb-5">
              <FileText size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Auto Prescriptions</h3>
            <p className="text-slate-400 leading-relaxed">
              Generate professional PDF prescriptions instantly, stored securely on Supabase Cloud for anytime access.
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-teal-500/30 transition-colors duration-300">
            <div className="bg-rose-500/10 text-rose-400 rounded-xl w-12 h-12 flex items-center justify-center mb-5">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Role-Based Access</h3>
            <p className="text-slate-400 leading-relaxed">
              Secure JWT authentication with Admin, Doctor, Receptionist, and Patient roles. Every route is protected.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500">
        <p>Built with Next.js, Express, MongoDB, Gemini AI & Supabase — Hackathon 2026</p>
      </footer>
    </div>
  );
}
