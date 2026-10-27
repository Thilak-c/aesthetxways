"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  History,
  Settings,
  ExternalLink,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Globe,
  ShoppingCart,
  Tag,
  Truck,
  Receipt,
  MessageCircle,
  Image,
  BarChart2,
  AlertTriangle,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import toast from "react-hot-toast";

const mainNavItems = [
  { href: "/website/orders", label: "Orders", icon: ShoppingCart },
  { href: "/website/billing", label: "Billing Desk", icon: Receipt },
  { href: "/website/add-product", label: "Add Product", icon: Package },
  { href: "/website/products", label: "All Products", icon: Package },
  { href: "/website/analytics", label: "Analytics", icon: BarChart2 },
];

const dropdownNavItems = [
  { href: "/website/banners", label: "Hero Banners", icon: Image },
  { href: "/website/coupons", label: "Coupons", icon: Tag },
  { href: "/website/whatsapp", label: "WhatsApp Console", icon: MessageCircle },
  { href: "/website/history", label: "History", icon: History },
  { href: "/website/shiprocket", label: "Shiprocket", icon: Truck },
  { href: "/website/reports", label: "Error Logs", icon: AlertTriangle },
  { href: "/website/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ defaultSmall = null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  // Auto-collapse when on billing desk
  const isBillingDesk = pathname === "/website/billing" || pathname === "/website/Bill-offline";
  const [isSmall, setIsSmall] = useState(defaultSmall !== null ? defaultSmall : isBillingDesk);

  useEffect(() => {
    if (defaultSmall !== null) {
      setIsSmall(defaultSmall);
    } else if (isBillingDesk) {
      setIsSmall(true);
    } else {
      setIsSmall(false);
    }
  }, [pathname, defaultSmall, isBillingDesk]);

  useEffect(() => {
    const isDropdownActive = dropdownNavItems.some((item) => pathname === item.href);
    if (isDropdownActive) {
      setMoreOpen(true);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("insys_auth");
    toast.success("Logged out successfully.");
    router.push("/login");
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-xs border border-zinc-150 shadow-xs hover:bg-zinc-50 transition-all cursor-pointer"
      >
        <Menu size={18} className="text-zinc-700" />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-zinc-950/20 backdrop-blur-xs z-40 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        ${isSmall ? "w-16" : "w-64"} bg-white border-r border-zinc-150
        transform transition-all duration-200 ease-out
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        flex flex-col select-none
      `}>
        {/* Header */}
        <div className={`${isSmall ? "p-3 flex flex-col items-center justify-center" : "p-4"} border-b border-zinc-100`}>
          {isSmall ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-xs flex items-center justify-center">
                <img src="/logo.png" alt="Aesthetx Ways Logo" className="w-6 h-6 object-contain" />
              </div>
              <button
                onClick={() => setIsSmall(false)}
                title="Expand Sidebar"
                className="hidden lg:flex p-1 text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 rounded-xs transition-colors cursor-pointer"
              >
                <PanelLeftOpen size={14} />
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-white rounded-xs flex items-center justify-center">
                    <img src="/logo.png" alt="Aesthetx Ways Logo" className="w-6 h-6 object-contain" />
                  </div>
                  <div>
                    <h1 className="text-xs font-bold text-zinc-900 font-sans tracking-tight">Aesthetx Ways</h1>
                    <p className="text-[8px] text-zinc-450 tracking-wider font-bold font-mono">Manage</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsSmall(true)}
                    title="Collapse Sidebar"
                    className="hidden lg:flex p-1 text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 rounded-xs transition-colors cursor-pointer"
                  >
                    <PanelLeftClose size={15} />
                  </button>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="lg:hidden p-1 hover:bg-zinc-50 rounded-xs transition-colors cursor-pointer"
                  >
                    <X size={16} className="text-zinc-400 hover:text-zinc-950" />
                  </button>
                </div>
              </div>

              {/* Static Website Store Indicator */}
              <div className="mt-3">
                <div className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-xs bg-zinc-50/50">
                  <Globe size={12} className="text-zinc-500" />
                  <span className="text-[9px] font-bold font-mono uppercase tracking-wider text-zinc-600">
                    Website Store
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${isSmall ? "py-2 px-1" : "py-4"} space-y-1 overflow-y-auto scrollbar-none`}>
          {!isSmall && (
            <p className="text-[9px] font-bold text-zinc-400 tracking-wider uppercase px-4 mb-2">
              Operations
            </p>
          )}
          
          <div className="space-y-0.5">
            {/* Main Navigation Items */}
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              if (isSmall) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      relative group flex items-center justify-center w-10 h-10 mx-auto rounded-xs transition-all my-1
                      ${isActive
                        ? "bg-zinc-950 text-white font-bold shadow-xs"
                        : "text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100"
                      }
                    `}
                  >
                    <Icon size={16} className={isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-950"} />
                    <span className="absolute left-full ml-2.5 px-2 py-1 bg-zinc-900 text-white text-[10px] font-mono font-medium rounded-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
                      {item.label}
                    </span>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    group flex items-center gap-2.5 px-4 py-2 border-l-2 text-xs font-mono transition-all
                    ${isActive
                      ? "border-zinc-950 text-zinc-950 bg-zinc-50/70 font-bold"
                      : "border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50/30"
                    }
                  `}
                >
                  <Icon size={13} className={isActive ? "text-zinc-950" : "text-zinc-400 group-hover:text-zinc-800"} />
                  <span className="flex-1 uppercase tracking-wider text-[10px]">{item.label}</span>
                </Link>
              );
            })}

            {isSmall ? (
              <>
                <div className="w-6 h-[1px] bg-zinc-200 mx-auto my-2" />
                {dropdownNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`
                        relative group flex items-center justify-center w-10 h-10 mx-auto rounded-xs transition-all my-1
                        ${isActive
                          ? "bg-zinc-950 text-white font-bold shadow-xs"
                          : "text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100"
                        }
                      `}
                    >
                      <Icon size={15} className={isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-950"} />
                      <span className="absolute left-full ml-2.5 px-2 py-1 bg-zinc-900 text-white text-[10px] font-mono font-medium rounded-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </>
            ) : (
              <>
                {/* Toggle Dropdown Button */}
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  className="w-full group flex items-center gap-2.5 px-4 py-2 border-l-2 border-transparent text-xs font-mono text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50/30 transition-all cursor-pointer text-left"
                >
                  <ChevronDown 
                    size={13} 
                    className={`text-zinc-450 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`} 
                  />
                  <span className="flex-1 uppercase tracking-wider text-[10px]">More Tools</span>
                </button>

                {/* Dropdown Items (Collapsible) */}
                <div className={`space-y-0.5 border-l border-zinc-200 ml-5.5 transition-all duration-300 overflow-hidden ${
                  moreOpen ? "max-h-[400px] opacity-100 mt-1" : "max-h-0 opacity-0 pointer-events-none"
                }`}>
                  {dropdownNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`
                          group flex items-center gap-2 px-3 py-1.5 text-xs font-mono transition-all border-l-2 -ml-[1px]
                          ${isActive
                            ? "border-zinc-950 text-zinc-950 bg-zinc-50/70 font-bold"
                            : "border-transparent text-zinc-400 hover:text-zinc-800 hover:bg-zinc-50/30"
                          }
                        `}
                      >
                        <Icon size={11} className={isActive ? "text-zinc-950" : "text-zinc-350 group-hover:text-zinc-750"} />
                        <span className="flex-1 uppercase tracking-wider text-[9px]">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className={`${isSmall ? "p-2 space-y-1 flex flex-col items-center" : "p-4 space-y-1"} border-t border-zinc-100 text-xs font-mono`}>
          {isSmall ? (
            <>
              <a
                href="https://aesthetxways.com/admin"
                target="_blank"
                rel="noopener noreferrer"
                className="relative group flex items-center justify-center w-10 h-10 rounded-xs text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
              >
                <ExternalLink size={16} />
                <span className="absolute left-full ml-2.5 px-2 py-1 bg-zinc-900 text-white text-[10px] font-mono font-medium rounded-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
                  Storefront Admin
                </span>
              </a>

              <button
                onClick={handleLogout}
                className="relative group flex items-center justify-center w-10 h-10 rounded-xs text-red-500 hover:text-red-700 hover:bg-red-50 transition-all cursor-pointer"
              >
                <LogOut size={16} />
                <span className="absolute left-full ml-2.5 px-2 py-1 bg-zinc-900 text-white text-[10px] font-mono font-medium rounded-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
                  Sign Out
                </span>
              </button>
            </>
          ) : (
            <>
              <a
                href="https://aesthetxways.com/admin"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50/50 rounded-xs transition-all group"
              >
                <ExternalLink size={13} className="text-zinc-400 group-hover:text-zinc-800" />
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider">Storefront Admin</p>
                  <p className="text-[8px] text-zinc-400 font-sans">aesthetxways.com</p>
                </div>
              </a>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-red-650 hover:text-red-750 hover:bg-red-50/40 rounded-xs transition-all group cursor-pointer"
              >
                <LogOut size={13} className="text-red-500" />
                <div className="flex-1 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider">Sign Out</p>
                </div>
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
