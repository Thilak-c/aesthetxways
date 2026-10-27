"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Sidebar from "@/components/Sidebar";
import { 
  Globe, 
  AlertOctagon, 
  Clock, 
  Terminal, 
  Link as LinkIcon, 
  ChevronRight, 
  ChevronDown,
  RefreshCw,
  Search,
  Filter
} from "lucide-react";

export default function ErrorReportsPage() {
  const reportsData = useQuery(api.reports.getAllReports) || [];
  const isLoading = reportsData === undefined;
  
  const [expandedReportId, setExpandedReportId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all', 'technical', 'feedback'

  // Helper to parse JSON messages if possible
  const parseMessage = (msg) => {
    try {
      const parsed = JSON.parse(msg);
      if (parsed && typeof parsed === 'object') {
        return { isJson: true, data: parsed };
      }
    } catch (e) {
      // Not JSON
    }
    return { isJson: false, data: msg };
  };

  // Filtered reports
  const filteredReports = reportsData.filter(report => {
    const parsed = parseMessage(report.message);
    const textToSearch = parsed.isJson 
      ? `${parsed.data.errorName} ${parsed.data.errorMessage} ${parsed.data.pageUrl}` 
      : report.message;
      
    const matchesSearch = textToSearch.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterType === "technical") {
      return matchesSearch && parsed.isJson;
    } else if (filterType === "feedback") {
      return matchesSearch && !parsed.isJson;
    }
    return matchesSearch;
  });

  const toggleExpand = (id) => {
    setExpandedReportId(expandedReportId === id ? null : id);
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto pt-12 lg:pt-0">
          
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Globe size={14} className="text-rose-500 animate-pulse" />
                <p className="text-rose-500 text-[10px] font-extrabold uppercase tracking-widest">Website Gate</p>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-poppins">System Error Logs</h1>
              <p className="text-slate-500 text-xs mt-1">Real-time error boundary captures and maintenance reports from client browsers</p>
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="bg-white rounded-3xl border border-slate-200/60 p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 w-full md:w-auto items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-3.5 py-1.5 focus-within:border-slate-350 transition-colors">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Search error messages, status, page URLs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-xs text-slate-700 placeholder-slate-400 py-1"
              />
            </div>

            <div className="flex w-full md:w-auto items-center gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <Filter size={14} className="text-slate-400" />
                <span className="text-[10px] uppercase font-bold text-slate-400">Filter:</span>
              </div>
              <div className="flex bg-slate-50 border border-slate-100 rounded-2xl p-1 w-full md:w-auto">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterType === "all" 
                      ? "bg-white text-slate-950 shadow-sm border border-slate-100" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  All Logs
                </button>
                <button
                  onClick={() => setFilterType("technical")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterType === "technical" 
                      ? "bg-white text-rose-600 shadow-sm border border-slate-100" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Technical
                </button>
                <button
                  onClick={() => setFilterType("feedback")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterType === "feedback" 
                      ? "bg-white text-slate-950 shadow-sm border border-slate-100" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Feedback
                </button>
              </div>
            </div>
          </div>

          {/* Logs List */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mb-4" />
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Fetching latest diagnostics...</span>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-16 text-center shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
                <AlertOctagon size={24} className="text-slate-400" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wide">No diagnostic logs found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">Either no errors have occurred, or they do not match your current query filters.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredReports.map((report) => {
                const parsed = parseMessage(report.message);
                const isExpanded = expandedReportId === report._id;
                
                return (
                  <div 
                    key={report._id}
                    className={`bg-white border rounded-3xl transition-all duration-300 shadow-xs hover:shadow-md ${
                      isExpanded 
                        ? "border-slate-800" 
                        : parsed.isJson 
                        ? "border-rose-100/80 hover:border-rose-300/60" 
                        : "border-slate-200/60 hover:border-slate-350/50"
                    }`}
                  >
                    {/* Header bar of the report */}
                    <div 
                      onClick={() => toggleExpand(report._id)}
                      className="p-5 flex items-start gap-4 cursor-pointer select-none"
                    >
                      <div className={`p-2.5 rounded-2xl border ${
                        parsed.isJson 
                          ? "bg-rose-50 border-rose-100 text-rose-500" 
                          : "bg-slate-50 border-slate-150 text-slate-500"
                      }`}>
                        <AlertOctagon size={18} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                            parsed.isJson 
                              ? "bg-rose-50/50 border-rose-100 text-rose-600" 
                              : "bg-slate-100 border-slate-150 text-slate-600"
                          }`}>
                            {parsed.isJson ? parsed.data.errorName : 'User Report'}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1">
                            <Clock size={11} />
                            {new Date(report.createdAt).toLocaleString("en-IN")}
                          </span>
                        </div>

                        <p className={`text-xs font-bold text-slate-800 mt-2 line-clamp-2 leading-relaxed ${
                          isExpanded ? "line-clamp-none font-extrabold text-slate-900" : ""
                        }`}>
                          {parsed.isJson ? parsed.data.errorMessage : parsed.data}
                        </p>

                        {parsed.isJson && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold font-mono mt-2 uppercase tracking-wide">
                            <LinkIcon size={11} className="shrink-0" />
                            <span className="truncate max-w-[280px] sm:max-w-md">{parsed.data.pageUrl}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-slate-400 self-center">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </div>
                    </div>

                    {/* Collapsible content containing details */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-1 border-t border-slate-100">
                        {parsed.isJson ? (
                          <div className="flex flex-col gap-4 mt-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                              <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex flex-col gap-1">
                                <span className="text-[9px] uppercase font-bold text-slate-400">Page Route URL</span>
                                <span className="font-mono text-slate-700 break-all select-all font-semibold">{parsed.data.pageUrl}</span>
                              </div>
                              <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex flex-col gap-1">
                                <span className="text-[9px] uppercase font-bold text-slate-400">Browser Environment (UserAgent)</span>
                                <span className="font-mono text-slate-700 break-words select-all">{parsed.data.userAgent}</span>
                              </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-950 p-4 rounded-2xl flex flex-col gap-2 shadow-inner">
                              <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 flex items-center gap-1.5">
                                <Terminal size={12} className="text-rose-500" />
                                Stack Trace (Component Error Details)
                              </span>
                              <pre className="font-mono text-[10px] leading-relaxed text-rose-400 overflow-x-auto p-1.5 bg-black/40 rounded-xl select-all whitespace-pre-wrap max-h-[300px]">
                                {parsed.data.errorStack}
                              </pre>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs text-slate-700 leading-relaxed mt-3">
                            <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Message Body</span>
                            {parsed.data}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
