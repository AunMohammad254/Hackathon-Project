"use client";

import Link from "next/link";
import { MoveLeft, Home, HelpCircle, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-teal-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
        <div className="relative bg-white p-8 rounded-full shadow-2xl border border-slate-100">
          <Activity size={80} className="text-teal-500 animate-bounce" />
        </div>
      </div>

      <h1 className="text-9xl font-black text-slate-200 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 select-none">
        404
      </h1>

      <h2 className="text-4xl font-bold text-slate-900 mb-4 relative">
        Oops! Page not found
      </h2>
      <p className="text-slate-500 max-w-md text-lg mb-10 leading-relaxed">
        It seems like you've wandered into an uncharted part of the clinic. 
        Don't worry, even the best doctors lose their way sometimes!
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Button 
          asChild 
          className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white shadow-lg"
        >
          <Link href="/">
            <Home size={18} className="mr-2" />
            Back to Home
          </Link>
        </Button>
        <Button 
          variant="outline" 
          className="flex-1 h-12 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
          onClick={() => window.history.back()}
        >
          <MoveLeft size={18} className="mr-2" />
          Previous Page
        </Button>
      </div>

      <div className="mt-16 pt-8 border-t border-slate-200 flex items-center gap-6 text-slate-400">
        <Link href="/help" className="flex items-center gap-1 hover:text-teal-500 transition-colors text-sm font-medium">
          <HelpCircle size={16} />
          Help Center
        </Link>
        <div className="h-1 w-1 bg-slate-300 rounded-full" />
        <Link href="/contact" className="hover:text-teal-500 transition-colors text-sm font-medium">
          Contact Support
        </Link>
      </div>
    </div>
  );
}
