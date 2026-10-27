"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Globe, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [credentials, setCredentials] = useState({
    adminId: "",
    password: "",
  });

  // Load valid credentials from environment variables
  const VALID_CREDENTIALS = (() => {
    try {
      const envCreds = process.env.NEXT_PUBLIC_VALID_CREDENTIALS;
      if (envCreds) return JSON.parse(envCreds);
    } catch (e) {
      console.error("Failed to parse NEXT_PUBLIC_VALID_CREDENTIALS:", e);
    }
    return [
      // { adminId: "Aesthetx Ways", password: "aesthetx123" },
      { adminId: "Thilak", password: "8008439762" },
      { adminId: "Prince", password: "7033769997" }
    ];
  })();

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      const isValid = VALID_CREDENTIALS.some(
        (cred) =>
          cred.adminId.toLowerCase() === credentials.adminId.trim().toLowerCase() &&
          cred.password === credentials.password
      );

      if (isValid) {
        // Save to localStorage with website storeType
        localStorage.setItem("insys_auth", JSON.stringify({
          isLoggedIn: true,
          storeType: "website",
          loginTime: new Date().toISOString()
        }));

        toast.success("Welcome to Website Store Inventory!");
        router.push("/website/orders");
      } else {
        toast.error("Invalid credentials");
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle modern gradient glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100/45 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-100/35 blur-3xl" />
      
      <div className="relative w-full max-w-sm sm:max-w-md animate-fadeIn">
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center  p-2 mb-2">
            <img src="/logo.png" alt="Aesthetx Ways Logo" className="w-7 h-7 object-contain" />
          </div>
          <h1 className="text-base font-bold text-slate-900 font-poppins tracking-tight">Aesthetx Ways</h1>
          <p className="text-[9px] text-slate-400 tracking-widest font-extrabold">INVENTORY SYSTEM</p>
        </div>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur-md shadow-xl border border-slate-200/50 rounded-3xl overflow-hidden">
          <form onSubmit={handleLogin} className="p-6 sm:p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-1 font-poppins">Welcome back</h2>
            <p className="text-slate-400 text-xs mb-6">Enter credentials to access website inventory</p>

            <div className="space-y-4">
              {/* Admin ID */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-poppins">Admin ID</label>
                <input
                  type="text"
                  value={credentials.adminId}
                  onChange={(e) => setCredentials({ ...credentials, adminId: e.target.value })}
                  placeholder="Enter admin ID"
                  className="w-full px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-300/80 focus:border-slate-800 rounded-xl text-xs focus:outline-none transition-all font-medium"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-poppins">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    placeholder="Enter password"
                    className="w-full px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-300/80 focus:border-slate-800 rounded-xl text-xs focus:outline-none transition-all pr-12 font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-all font-bold text-xs shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Access Catalog
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-400 mt-6">
          © 2026 Aesthetx Ways. All rights reserved.
        </p>
      </div>
    </div>
  );
}
