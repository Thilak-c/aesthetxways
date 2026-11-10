"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import AdminShell from "@/components/AdminShell";
import { Globe, Bell, AlertTriangle, Save, CheckCircle, Sliders, Power, Wrench, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

export default function WebsiteSettings() {
  const [settings, setSettings] = useState({
    lowStockThreshold: 10,
    criticalThreshold: 5,
    autoHideOutOfStock: false,
    emailAlerts: false,
    alertEmail: "",
  });
  const [saved, setSaved] = useState(false);
  const [customMessage, setCustomMessage] = useState("");

  // Convex site status
  const siteStatus = useQuery(api.siteSettings.getSiteStatus);
  const setSiteStatusMutation = useMutation(api.siteSettings.setSiteStatus);

  useEffect(() => {
    if (siteStatus?.message) {
      setCustomMessage(siteStatus.message);
    }
  }, [siteStatus]);

  useEffect(() => {
    const stored = localStorage.getItem("web_settings");
    if (stored) setSettings({ ...settings, ...JSON.parse(stored) });
  }, []);

  const handleSave = () => {
    localStorage.setItem("web_settings", JSON.stringify(settings));
    toast.success("Settings saved!");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSetStatus = async (status) => {
    try {
      await setSiteStatusMutation({ status, message: customMessage });
      toast.success(`Site status set to ${status.toUpperCase()}`);
    } catch (err) {
      toast.error("Failed to update site status");
      console.error(err);
    }
  };

  const currentStatus = siteStatus?.status || "open";

  return (
    <div className="flex-1 p-4 lg:p-8 bg-[#fafafa] min-h-screen">
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="mb-6 pt-4 lg:pt-0">
            <div className="flex items-center gap-2 mb-1">
              <Globe size={16} className="text-gray-400" />
              <p className="text-gray-400 text-xs font-medium">WEBSITE STORE</p>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>

          {/* Site Status Control */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${
                currentStatus === "open" ? "bg-green-100" :
                currentStatus === "maintenance" ? "bg-yellow-100" :
                "bg-red-100"
              }`}>
                <Power size={18} className={
                  currentStatus === "open" ? "text-green-600" :
                  currentStatus === "maintenance" ? "text-yellow-600" :
                  "text-red-600"
                } />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Site Status</h3>
                <p className="text-sm text-gray-500">
                  Currently: <span className={`font-bold uppercase text-xs ${
                    currentStatus === "open" ? "text-green-600" :
                    currentStatus === "maintenance" ? "text-yellow-600" :
                    "text-red-600"
                  }`}>{currentStatus}</span>
                </p>
              </div>
            </div>

            {/* Status Toggle Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                onClick={() => handleSetStatus("open")}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border-2 transition-all ${
                  currentStatus === "open"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 bg-gray-50 text-gray-500 hover:border-green-300 hover:bg-green-50/50"
                }`}
              >
                <ShieldCheck size={20} />
                <span className="text-xs font-bold uppercase tracking-wide">Open</span>
              </button>
              <button
                onClick={() => handleSetStatus("maintenance")}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border-2 transition-all ${
                  currentStatus === "maintenance"
                    ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                    : "border-gray-200 bg-gray-50 text-gray-500 hover:border-yellow-300 hover:bg-yellow-50/50"
                }`}
              >
                <Wrench size={20} />
                <span className="text-xs font-bold uppercase tracking-wide">Maintenance</span>
              </button>
              <button
                onClick={() => handleSetStatus("closed")}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg border-2 transition-all ${
                  currentStatus === "closed"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-200 bg-gray-50 text-gray-500 hover:border-red-300 hover:bg-red-50/50"
                }`}
              >
                <Power size={20} />
                <span className="text-xs font-bold uppercase tracking-wide">Closed</span>
              </button>
            </div>

            {/* Custom Message */}
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Custom Message (shown on overlay)</label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="e.g. We'll be back soon! Upgrading our systems..."
                rows={2}
                className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm border-0 focus:ring-2 focus:ring-gray-900 resize-none"
              />
              <button
                onClick={() => handleSetStatus(currentStatus)}
                className="mt-2 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                Update message →
              </button>
            </div>
          </div>

          {/* Stock Thresholds */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <AlertTriangle size={18} className="text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Stock Thresholds</h3>
                <p className="text-sm text-gray-500">When to trigger alerts</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Low Stock Threshold</label>
                <input type="number" value={settings.lowStockThreshold} onChange={e => setSettings({ ...settings, lowStockThreshold: +e.target.value })} min="1" className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm border-0 focus:ring-2 focus:ring-gray-900" />
                <p className="text-xs text-gray-400 mt-1">Products below this show as "Low Stock"</p>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Critical Threshold</label>
                <input type="number" value={settings.criticalThreshold} onChange={e => setSettings({ ...settings, criticalThreshold: +e.target.value })} min="1" className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm border-0 focus:ring-2 focus:ring-gray-900" />
                <p className="text-xs text-gray-400 mt-1">Products below this trigger urgent alerts</p>
              </div>
            </div>
          </div>

          {/* Behavior */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Sliders size={18} className="text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Behavior</h3>
                <p className="text-sm text-gray-500">Inventory settings</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Auto-hide Out of Stock</p>
                <p className="text-xs text-gray-500">Hide products when stock is 0</p>
              </div>
              <button onClick={() => setSettings({ ...settings, autoHideOutOfStock: !settings.autoHideOutOfStock })} className={`w-12 h-6 rounded-full transition ${settings.autoHideOutOfStock ? "bg-gray-900" : "bg-gray-300"}`}>
                <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.autoHideOutOfStock ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Bell size={18} className="text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-500">Alert preferences</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Alerts</p>
                  <p className="text-xs text-gray-500">Get notified for low stock</p>
                </div>
                <button onClick={() => setSettings({ ...settings, emailAlerts: !settings.emailAlerts })} className={`w-12 h-6 rounded-full transition ${settings.emailAlerts ? "bg-gray-900" : "bg-gray-300"}`}>
                  <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.emailAlerts ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>
              {settings.emailAlerts && (
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Alert Email</label>
                  <input type="email" value={settings.alertEmail} onChange={e => setSettings({ ...settings, alertEmail: e.target.value })} placeholder="admin@example.com" className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm border-0 focus:ring-2 focus:ring-gray-900" />
                </div>
              )}
            </div>
          </div>

          {/* Save */}
          <button onClick={handleSave} className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition ${saved ? "bg-gray-700 text-white" : "bg-gray-900 text-white hover:bg-gray-800"}`}>
            {saved ? <><CheckCircle size={18} /> Saved!</> : <><Save size={18} /> Save Settings</>}
          </button>
        </div>
      </div>
  );
}
