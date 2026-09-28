import React, { useState } from "react";
import { Search, AlertTriangle, Info, XCircle, Clock, Server, Terminal, Filter } from "lucide-react";

// Mock Data vì chưa có API cho logs
const MOCK_LOGS = [
  { id: 1, level: "error", message: "Database connection timeout in module grading.", timestamp: "2026-09-24T08:15:30Z", source: "DBService" },
  { id: 2, level: "info", message: "User 'admin@art-ai.edu.vn' logged in successfully.", timestamp: "2026-09-24T08:14:12Z", source: "Auth" },
  { id: 3, level: "warn", message: "High CPU usage detected on Node 2 (85%).", timestamp: "2026-09-24T08:10:05Z", source: "System" },
  { id: 4, level: "info", message: "Daily backup completed successfully.", timestamp: "2026-09-24T02:00:00Z", source: "CronJob" },
  { id: 5, level: "error", message: "Failed to send email to 'student1@art-ai.edu.vn'.", timestamp: "2026-09-23T15:45:22Z", source: "Notification" },
  { id: 6, level: "info", message: "New assignment 'Capstone Project' created by 'lecturer_1'.", timestamp: "2026-09-23T09:30:00Z", source: "Assignment" },
  { id: 7, level: "warn", message: "API rate limit exceeded for IP 192.168.1.100.", timestamp: "2026-09-22T20:12:45Z", source: "Gateway" }
];

const SystemLogsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("all"); // 'all', 'error', 'warn', 'info'

  const getLevelStyles = (level) => {
    switch (level) {
      case "error":
        return { icon: XCircle, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" };
      case "warn":
        return { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" };
      case "info":
        return { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" };
      default:
        return { icon: Terminal, color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20" };
    }
  };

  const filteredLogs = MOCK_LOGS.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) || log.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === "all" || log.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-3">
            <Server className="w-8 h-8 text-indigo-400" />
            System Logs
          </h1>
          <p className="text-slate-400 text-sm">Theo dõi chi tiết hoạt động của hệ thống thời gian thực.</p>
        </div>
      </div>

      {/* Log Console Container */}
      <div className="bg-[#0D1117] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[700px]">
        
        {/* Terminal Header */}
        <div className="h-14 bg-slate-900/80 border-b border-white/5 flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500" />
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="ml-4 text-xs font-mono text-slate-500 font-semibold tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4" /> EDUX_SERVER_TTY
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Grep logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48 pl-9 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-slate-300 focus:border-indigo-500 outline-none transition-colors"
              />
            </div>
            
            <div className="flex items-center bg-black/40 border border-white/10 rounded-lg overflow-hidden">
               {["all", "error", "warn", "info"].map(level => (
                 <button
                   key={level}
                   onClick={() => setFilterLevel(level)}
                   className={`px-3 py-1.5 text-xs font-mono font-semibold transition-colors ${
                     filterLevel === level 
                     ? "bg-slate-700 text-white" 
                     : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                   }`}
                 >
                   {level.toUpperCase()}
                 </button>
               ))}
            </div>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="flex-1 overflow-y-auto p-6 font-mono text-[13px] custom-scrollbar bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/20 via-black to-black">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-600">
              <Terminal className="w-12 h-12 mb-3 opacity-20" />
              <p>No logs found matching criteria.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredLogs.map((log) => {
                const style = getLevelStyles(log.level);
                const Icon = style.icon;
                const time = new Date(log.timestamp).toLocaleString("vi-VN");
                
                return (
                  <div key={log.id} className="flex items-start gap-4 hover:bg-white/[0.02] py-1.5 px-2 rounded transition-colors group">
                    <div className="text-slate-600 shrink-0 select-none w-36">
                      [{time}]
                    </div>
                    
                    <div className={`shrink-0 flex items-center justify-center w-16 ${style.color}`}>
                       <span className="font-bold uppercase tracking-wider text-[11px] bg-current/10 px-2 py-0.5 rounded border border-current/20">
                          {log.level}
                       </span>
                    </div>

                    <div className="text-indigo-400/80 shrink-0 w-28">
                      [{log.source}]
                    </div>

                    <div className={`flex-1 break-all ${log.level === 'error' ? 'text-rose-200/90' : log.level === 'warn' ? 'text-amber-200/90' : 'text-slate-300'}`}>
                      {log.message}
                    </div>
                  </div>
                );
              })}
              
              {/* Blinking Cursor */}
              <div className="flex items-center gap-2 mt-4 text-emerald-500">
                 <span>edux@admin:~$</span>
                 <span className="w-2 h-4 bg-emerald-500 animate-pulse" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemLogsPage;