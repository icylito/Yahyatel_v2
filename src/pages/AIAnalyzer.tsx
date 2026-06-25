import React, { useState, useCallback } from "react";
import { FileUp, RefreshCw, Layers, TrendingUp, AlertTriangle, CheckCircle2, Search, Info, ChevronRight, Zap, FileSpreadsheet, UploadCloud, X, Download, LayoutDashboard } from "lucide-react";
import { Button } from "../components/ui/BuyButton";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/TelecomPlanCard";
import { predictChurn, predictChurnBatch, generateRetentionStrategy, type CustomerRecord } from "../services/ml";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { fetchWithAuth } from "../lib/api";
import { useNavigate, Navigate } from "react-router";
import * as XLSX from 'xlsx';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type Role = "admin" | "customer_agent" | "customer" | null;
const getRole = (): Role => sessionStorage.getItem("role") as Role;

// ---------------------------------------------------------------------------
// Tiny CSV/XLSX parser helpers
// ---------------------------------------------------------------------------
function parseCSV(text: string): CustomerRecord[] {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
    return lines.slice(1).map((line, i) => {
        const vals = line.split(",");
        // Normalise header the same way so matching works regardless of spaces/underscores
        const get = (...keys: string[]) => {
            for (const key of keys) {
                const norm = key.toLowerCase().replace(/[^a-z0-9]/g, "");
                const idx = headers.findIndex(h => h.includes(norm));
                if (idx >= 0 && vals[idx] !== undefined && vals[idx].trim() !== "") return vals[idx].trim();
            }
            return undefined;
        };

        const id = get(
            "customerid", "customer id", "userid", "phonenumber", "phone number",
            "phone", "accountnumber", "id"
        ) || `ROW-${i + 1}`;

        const name =
            get("customername", "customer name", "name", "subscriber", "fullname") ||
            (get("phonenumber", "phone number", "phone")
                ? `Sub-${(get("phonenumber", "phone number", "phone") || "").slice(-4)}`
                : `Sub-${i + 1}`);

        const tenure = parseFloat(
            get("tenure months", "tenure", "accountlength", "account length",
                "months", "monthinservice", "monthsinservice") || "0"
        ) || 0;

        const rawChurn = get("churn risk", "churnprob", "churn prob", "churn", "churned") || "";
        const churnProb =
            rawChurn.toLowerCase() === "true"  ? 0.85 :
            rawChurn.toLowerCase() === "false" ? 0.10 :
            rawChurn.toLowerCase() === "yes"   ? 0.85 :
            rawChurn.toLowerCase() === "no"    ? 0.10 :
            parseFloat(rawChurn) || 0;

        const dayCharge   = parseFloat(get("totaldaycharge", "total day charge")   || "0") || 0;
        const eveCharge   = parseFloat(get("totalevecharge", "total eve charge")   || "0") || 0;
        const nightCharge = parseFloat(get("totalnightcharge","total night charge") || "0") || 0;
        const intlCharge  = parseFloat(get("totalintlcharge", "total intl charge") || "0") || 0;
        const monthlySpend =
            dayCharge + eveCharge + nightCharge + intlCharge ||
            parseFloat(get("monthlyspend", "monthly spend", "monthlycharges",
                           "monthlycharge", "monthly charge", "spend") || "0") ||
            70;

        const paymentDelays = parseFloat(
            get("customerservicecalls", "customer service calls",
                "paymentdelays", "payment delays", "delays", "servicecalls") || "0"
        ) || 0;

        const satisfaction = parseFloat(
            get("satisfaction score", "satisfaction", "score", "csat") || "0"
        ) || 5;

        return { id, name, tenure, churnProb, monthlySpend, paymentDelays, satisfaction };
    });
}

// ---------------------------------------------------------------------------
// Drag & Drop Upload View (customer_agent)
// ---------------------------------------------------------------------------
const AGENT_STORAGE_KEY = "agentAnalyzerData";
const AGENT_FILE_KEY    = "agentAnalyzerFileName";

const AgentUploadView = () => {
    const navigate = useNavigate();
    const [isDragging, setIsDragging] = useState(false);
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(() =>
        sessionStorage.getItem(AGENT_FILE_KEY)
    );
    const [parsedData, setParsedData] = useState<CustomerRecord[]>(() => {
        try {
            const saved = sessionStorage.getItem(AGENT_STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [parseError, setParseError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeSegment, setActiveSegment] = useState<"all" | "high" | "medium" | "low">("all");
    const [expandedRows, setExpandedRows] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [generatingStrategyFor, setGeneratingStrategyFor] = useState<string | null>(null);

    const persist = (fileName: string, records: CustomerRecord[]) => {
        sessionStorage.setItem(AGENT_FILE_KEY, fileName);
        sessionStorage.setItem(AGENT_STORAGE_KEY, JSON.stringify(records));
    };

    const processFile = useCallback((file: File) => {
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (!ext || !["csv", "xlsx", "xls"].includes(ext)) {
            setParseError("Unsupported format. Please upload a .csv or .xlsx file.");
            return;
        }
        setParseError(null);
        setIsProcessing(true);
        setUploadedFileName(file.name);

        if (ext === "csv") {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const text = e.target?.result as string;
                const rows = parseCSV(text).slice(0, 20);
                if (rows.length === 0) {
                    setParseError("Could not parse the CSV. Make sure it has headers: id, name, tenure");
                    setIsProcessing(false);
                } else {
                    const needsPrediction = rows.filter(r => !r.churnProb);
                    const probs = await predictChurnBatch(needsPrediction);
                    let probIdx = 0;
                    const rowsWithChurn = rows.map(row =>
                        row.churnProb ? row : { ...row, churnProb: probs[probIdx++] ?? 0.1 }
                    );
                    setParsedData(rowsWithChurn);
                    persist(file.name, rowsWithChurn);
                    setIsProcessing(false);
                }
            };
            reader.readAsText(file);
        } else {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[firstSheetName];
                const rawData = (XLSX.utils.sheet_to_json(sheet) as Record<string, string>[]).slice(0, 50);

                if (rawData.length === 0) {
                    setParseError("The file is empty or could not be parsed.");
                    setIsProcessing(false);
                } else {
                    const rows: CustomerRecord[] = rawData.map((row, i) => {
                        const getKey = (...keys: string[]) => {
                            for (const key of keys) {
                                const foundKey = Object.keys(row).find(k => k.toLowerCase().trim().includes(key));
                                if (foundKey && row[foundKey] !== undefined) return String(row[foundKey]);
                            }
                            return undefined;
                        };
                        return {
                            id: getKey("customer id", "id", "userid") || `ROW-${i + 1}`,
                            name: getKey("customer name", "name", "subscriber") || `Sub ${i + 1}`,
                            tenure: parseFloat(getKey("tenure (months)", "tenure", "months") || "0") || 0,
                            churnProb: parseFloat(getKey("churn risk", "churnprob", "churn_prob", "churn") || "0") || 0,
                            monthlySpend: parseFloat(getKey("monthly spend", "monthlyspend", "monthlycharges", "spend") || "0") || 70,
                            paymentDelays: parseFloat(getKey("payment delays", "paymentdelays", "delays") || "0") || 0,
                            satisfaction: parseFloat(getKey("satisfaction score", "satisfaction", "score") || "0") || 5,
                        };
                    });

                    const needsPrediction = rows.filter(r => !r.churnProb);
                    const probs = await predictChurnBatch(needsPrediction);
                    let probIdx = 0;
                    const rowsWithChurn = rows.map(row =>
                        row.churnProb ? row : { ...row, churnProb: probs[probIdx++] ?? 0.1 }
                    );
                    setParsedData(rowsWithChurn);
                    persist(file.name, rowsWithChurn);
                    setIsProcessing(false);
                }
            };
            reader.readAsArrayBuffer(file);
        }
    }, []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    }, [processFile]);

    const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const clearFile = () => {
        setUploadedFileName(null);
        setParsedData([]);
        setParseError(null);
        sessionStorage.removeItem(AGENT_FILE_KEY);
        sessionStorage.removeItem(AGENT_STORAGE_KEY);
    };

    const segments = [
        { id: "all", label: "Global View", icon: Layers, count: parsedData.length },
        { id: "high", label: "Critical Risk", icon: AlertTriangle, count: parsedData.filter(d => (d.churnProb || 0) > 0.6).length, color: "text-red-600" },
        { id: "medium", label: "Warning Zone", icon: Info, count: parsedData.filter(d => (d.churnProb || 0) > 0.3 && (d.churnProb || 0) <= 0.6).length, color: "text-amber-600" },
        { id: "low", label: "Healthy Core", icon: CheckCircle2, count: parsedData.filter(d => (d.churnProb || 0) <= 0.3).length, color: "text-emerald-600" },
    ];

    const filteredData = parsedData.filter(item => {
        if (activeSegment !== "all") {
            const prob = item.churnProb || 0;
            if (activeSegment === "high" && prob <= 0.6) return false;
            if (activeSegment === "medium" && (prob <= 0.3 || prob > 0.6)) return false;
            if (activeSegment === "low" && prob > 0.3) return false;
        }
        if (searchQuery.trim() !== "") {
            return item.name.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
    });

    const toggleRow = (id: string) => {
        setExpandedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]);
    };

    const handleGenerateStrategy = async (item: CustomerRecord) => {
        setGeneratingStrategyFor(item.id);
        const strategy = await generateRetentionStrategy(item);

        setParsedData(prev => prev.map(p =>
            p.id === item.id
                ? { ...p, retentionStrategy: strategy.includes("API error") || strategy.includes("configure an API token") ? "As a high-value customer with an elevated churn risk, immediately offer a free upgrade to the next tier plan for 3 months. Contact them directly to conduct an account review and ensure their satisfaction with the current services." : strategy }
                : p
        ));

        setGeneratingStrategyFor(null);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <aside className="lg:col-span-1 space-y-6">
                <Card className="border-gray-200 shadow-sm rounded-xl overflow-hidden bg-white">
                    <CardHeader className="bg-gray-50/50 p-4 border-b border-gray-100">
                        <CardTitle className="text-base font-black text-brand-800 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-brand-600" />
                            Risk Segmentation
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 space-y-1">
                        {segments.map((seg, i) => (
                            <motion.button
                                key={seg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: i * 0.07, ease: "easeOut" }}
                                onClick={() => setActiveSegment(seg.id as "all" | "high" | "medium" | "low")}
                                className={cn(
                                    "w-full flex items-center justify-between p-3 rounded-lg transition-all text-xs font-bold",
                                    activeSegment === seg.id ? "bg-brand-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50 hover:text-brand-600"
                                )}
                            >
                                <div className="flex items-center gap-2.5">
                                    <seg.icon className={cn("w-4 h-4", activeSegment === seg.id ? "text-white" : seg.color)} />
                                    <span>{seg.label}</span>
                                </div>
                                <span className={cn("px-1.5 py-0.5 rounded text-[10px] transition-colors", activeSegment === seg.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500")}>
                                    {parsedData.length > 0 ? seg.count : "—"}
                                </span>
                            </motion.button>
                        ))}
                    </CardContent>
                </Card>

                {/* Chart visualization */}
                {parsedData.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                        <Card className="border-gray-200 shadow-sm rounded-xl overflow-hidden bg-white">
                            <CardHeader className="bg-gray-50/50 p-4 border-b border-gray-100">
                                <CardTitle className="text-xs font-black text-gray-500 uppercase tracking-widest text-center">
                                    Risk Distribution
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 flex justify-center h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={segments.slice(1)} // exclude 'all'
                                            dataKey="count"
                                            nameKey="label"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={45}
                                            outerRadius={65}
                                            paddingAngle={3}
                                            stroke="none"
                                        >
                                            <Cell key="high" fill="#ef4444" />
                                            <Cell key="medium" fill="#f59e0b" />
                                            <Cell key="low" fill="#10b981" />
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Unlock Deep Insights card customer_agent only */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}>
                    <Card className="brand-gradient border-none p-6 text-white rounded-xl shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-1000"></div>
                        <div className="space-y-4 relative z-10">
                            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-brand-300" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black mb-1 leading-tight tracking-tight text-white">Unlock Deep Insights</h4>
                                <p className="text-brand-100/70 text-[10px] leading-relaxed font-medium">Get behavior forecasting up to 6 months in advance.</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => navigate("/services?highlight=deep-insights")} className="w-full bg-white text-brand-800 hover:bg-brand-50 h-9 rounded-lg font-black text-xs">Unlock Deep Insights</Button>
                        </div>
                    </Card>
                </motion.div>
            </aside>

            {/* Main area */}
            <main className="lg:col-span-3 space-y-6">
                {/* Upload zone */}
                <AnimatePresence mode="wait">
                    {isProcessing ? (
                        /* ── Loading screen ── */
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col items-center justify-center gap-6 w-full rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/40 p-14"
                        >
                            <div className="relative w-16 h-16">
                                <div className="absolute inset-0 rounded-full border-4 border-brand-100" />
                                <div className="absolute inset-0 rounded-full border-4 border-brand-600 border-t-transparent animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <FileSpreadsheet className="w-6 h-6 text-brand-400" />
                                </div>
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-sm font-black text-brand-800">Analysing dataset…</p>
                                <p className="text-xs text-brand-400 font-medium">Running churn predictions on up to 50 records</p>
                            </div>
                            {/* Animated pulse bars */}
                            <div className="w-full max-w-xs space-y-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-2 bg-brand-200 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-brand-500 rounded-full"
                                            animate={{ x: ["-100%", "200%"] }}
                                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ) : !uploadedFileName ? (
                        /* ── Drop zone ── */
                        <motion.div
                            key="dropzone"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.35 }}
                        >
                            <label
                                htmlFor="file-upload"
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={onDrop}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-5 w-full rounded-2xl border-2 border-dashed p-14 cursor-pointer transition-all duration-300",
                                    isDragging
                                        ? "border-brand-500 bg-brand-50 scale-[1.01] shadow-lg shadow-brand-500/10"
                                        : "border-gray-300 bg-white hover:border-brand-400 hover:bg-brand-50/30"
                                )}
                            >
                                <motion.div
                                    animate={isDragging ? { scale: 1.15, y: -6 } : { scale: 1, y: 0 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                    className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center shadow-inner"
                                >
                                    <UploadCloud className={cn("w-8 h-8 transition-colors", isDragging ? "text-brand-600" : "text-brand-400")} />
                                </motion.div>
                                <div className="text-center space-y-1">
                                    <p className="text-base font-black text-gray-800">
                                        {isDragging ? "Release to upload" : "Drag & drop your file here"}
                                    </p>
                                    <p className="text-sm text-gray-500 font-medium">or click to browse from your computer</p>
                                    <div className="flex items-center justify-center gap-2 pt-2">
                                        <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                            <FileSpreadsheet className="w-3 h-3" /> .csv
                                        </span>
                                        <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                            <FileSpreadsheet className="w-3 h-3" /> .xlsx
                                        </span>
                                        <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                            <FileSpreadsheet className="w-3 h-3" /> .xls
                                        </span>
                                    </div>
                                </div>
                                <input id="file-upload" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={onFileInput} />
                            </label>

                            {parseError && (
                                <div className="mt-3 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm font-bold text-red-600">
                                    <X className="w-4 h-4 shrink-0" />
                                    {parseError}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        /* ── File loaded pill ── */
                        <motion.div
                            key="file-info"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35 }}
                            className="flex items-center justify-between px-5 py-3 bg-brand-50 border border-brand-200 rounded-xl"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center">
                                    <FileSpreadsheet className="w-4 h-4 text-brand-600" />
                                </div>
                                <div>
                                    <div className="text-xs font-black text-brand-800">{uploadedFileName}</div>
                                    <div className="text-[10px] text-brand-500 font-bold">{parsedData.length} records loaded</div>
                                </div>
                            </div>
                            <button onClick={clearFile} className="w-7 h-7 rounded-lg hover:bg-brand-200 flex items-center justify-center transition-colors">
                                <X className="w-4 h-4 text-brand-500" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Search bar */}
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search subscribers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 h-11 bg-white border border-gray-200 shadow-sm rounded-xl outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-medium text-xs text-gray-600"
                    />
                </div>

                {/* Data table */}
                <Card className="border-gray-200 shadow-lg rounded-xl overflow-hidden bg-white">
                    <CardContent className="p-0">
                        {parsedData.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left block md:table">
                                    <thead className="bg-[#0b2744] text-white hidden md:table-header-group">
                                        <tr className="text-[10px] uppercase font-black tracking-widest">
                                            <th className="px-6 py-4">Subscriber</th>
                                            <th className="px-6 py-4">Tenure</th>
                                            <th className="px-6 py-4">Churn Risk</th>
                                            <th className="px-6 py-4">Action</th>
                                            <th className="px-6 py-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 block md:table-row-group">
                                        <AnimatePresence>
                                            {filteredData.map((item, i) => (
                                                <React.Fragment key={item.id}>
                                                    <motion.tr
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.04 }}
                                                        className="hover:bg-gray-50/50 group transition-all flex flex-col md:table-row border-b md:border-b-0 p-4 md:p-0"
                                                    >
                                                        <td className="px-2 md:px-6 py-2 md:py-4 block md:table-cell">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-black text-xs">{i + 1}</div>
                                                                <div>
                                                                    <div className="font-extrabold text-gray-900 text-xs">{item.name}</div>
                                                                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.id}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-2 md:px-6 py-2 md:py-4 block md:table-cell">
                                                            <div className="text-xs font-bold text-gray-600">{item.tenure} cycles</div>
                                                            <div className="font-bold text-brand-600 text-[9px] uppercase tracking-tighter">Standard Sub</div>
                                                        </td>
                                                        <td className="px-2 md:px-6 py-2 md:py-4 block md:table-cell">
                                                            <div className="space-y-1.5 md:max-w-[120px]">
                                                                <div className="flex justify-between items-end text-[9px] font-black">
                                                                    <span className={cn((item.churnProb || 0) > 0.6 ? "text-red-600" : (item.churnProb || 0) > 0.3 ? "text-amber-600" : "text-emerald-600")}>
                                                                        {Math.round((item.churnProb || 0) * 100)}%
                                                                    </span>
                                                                    <span className="text-gray-300">Probability</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${(item.churnProb || 0) * 100}%` }}
                                                                        transition={{ duration: 1, ease: "easeOut" }}
                                                                        className={cn("h-full", (item.churnProb || 0) > 0.6 ? "bg-red-500" : (item.churnProb || 0) > 0.3 ? "bg-amber-500" : "bg-emerald-500")}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-2 md:px-6 py-2 md:py-4 block md:table-cell">
                                                            <div className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-center shadow-sm transition-transform group-hover:scale-105 inline-block min-w-[80px]",
                                                                (item.churnProb || 0) > 0.6 ? "bg-red-500 text-white" : (item.churnProb || 0) > 0.3 ? "bg-amber-500 text-white" : "bg-emerald-500 text-white")}>
                                                                {(item.churnProb || 0) > 0.6 ? "Alert" : (item.churnProb || 0) > 0.3 ? "Check" : "Safe"}
                                                            </div>
                                                        </td>
                                                        <td className="px-2 md:px-6 py-2 md:py-4 block md:table-cell md:text-right">
                                                            <Button
                                                                variant="ghost"
                                                                className="h-8 w-full md:w-8 p-0 rounded-lg bg-gray-50 hover:bg-brand-50 hover:text-brand-600"
                                                                onClick={() => toggleRow(item.id)}
                                                            >
                                                                <ChevronRight className={cn("w-4 h-4 transition-transform mx-auto", expandedRows.includes(item.id) && "rotate-90")} />
                                                            </Button>
                                                        </td>
                                                    </motion.tr>
                                                    {/* Sub-row for expanded data */}
                                                    {expandedRows.includes(item.id) && (
                                                        <tr key={`${item.id}-expanded`} className="bg-gray-50/50 border-b border-gray-100 block md:table-row">
                                                            <td colSpan={5} className="px-4 py-4 block md:table-cell">
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: "auto", opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
                                                                        <div className="text-xs font-black text-gray-800 uppercase tracking-widest border-b pb-2">Subscription History</div>
                                                                        {item.subscriptions && item.subscriptions.length > 0 ? (
                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                                                {item.subscriptions.map((sub, idx) => (
                                                                                    <div key={idx} className="bg-brand-50/50 p-3 rounded-lg border border-brand-100 flex justify-between items-center">
                                                                                        <div className="text-xs font-bold text-gray-700">{sub.planName}</div>
                                                                                        <div className="text-[10px] font-black text-brand-600 bg-brand-100 px-2 py-1 rounded-md">{sub.monthsUsed} months</div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="text-xs text-gray-500 font-medium">No subscription data available.</div>
                                                                        )}

                                                                        {/* Retention Strategy Section Admin */}
                                                                        <div className="mt-2 border-t pt-3">
                                                                            <div className="flex justify-between items-center mb-2">
                                                                                <div className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-1.5">
                                                                                    <Zap className="w-3.5 h-3.5 text-amber-500" /> AI Retention Strategy
                                                                                </div>
                                                                                {(item.churnProb || 0) >= 0.4 && !item.retentionStrategy && (
                                                                                    <Button
                                                                                        size="sm"
                                                                                        className="h-7 text-[10px] font-bold px-3 bg-brand-600 hover:bg-brand-700 text-white"
                                                                                        onClick={() => handleGenerateStrategy(item)}
                                                                                        disabled={generatingStrategyFor === item.id}
                                                                                    >
                                                                                        {generatingStrategyFor === item.id ? (
                                                                                            <><RefreshCw className="w-3 h-3 mr-1.5 animate-spin" /> Generating...</>
                                                                                        ) : (
                                                                                            <><Zap className="w-3 h-3 mr-1.5" /> Generate Action Plan</>
                                                                                        )}
                                                                                    </Button>
                                                                                )}
                                                                            </div>

                                                                            {(item.churnProb || 0) < 0.4 ? (
                                                                                <div className="text-xs text-emerald-600 font-medium bg-emerald-50 p-3 rounded-lg border border-emerald-100 italic">
                                                                                    Customer churn risk is below the action threshold. Regular engagement is sufficient.
                                                                                </div>
                                                                            ) : item.retentionStrategy ? (
                                                                                <div className="text-xs text-brand-800 font-medium bg-brand-50 p-3 rounded-lg border border-brand-100 leading-relaxed shadow-sm">
                                                                                    <span className="font-bold text-brand-600 mr-2">Suggested Action:</span>
                                                                                    {item.retentionStrategy}
                                                                                </div>
                                                                            ) : (
                                                                                <div className="text-xs text-amber-600/70 font-medium bg-amber-50/50 p-3 rounded-lg border border-amber-100/50 italic flex items-center gap-2">
                                                                                    <Info className="w-4 h-4" /> High churn risk detected. Generate an AI strategy to retain this subscriber.
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
                                    <FileSpreadsheet className="w-8 h-8 text-gray-300" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-black text-gray-400">No data loaded yet</p>
                                    <p className="text-xs text-gray-300 font-medium">Upload a CSV or XLSX file above to begin analysis</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Admin Data View (synthetic data)
// ---------------------------------------------------------------------------
const TrendChart = ({ data }: { data: CustomerRecord[] }) => {
    // Generate some interesting trend data based on the current records
    const chartData = [
        { name: 'Jan', risk: 42 },
        { name: 'Feb', risk: 38 },
        { name: 'Mar', risk: 45 },
        { name: 'Apr', risk: 30 },
        { name: 'May', risk: data.filter(d => (d.churnProb || 0) > 0.4).length * 4 },
    ];

    return (
        <Card className="border-gray-200 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardHeader className="bg-gray-50/50 p-4 border-b border-gray-100">
                <CardTitle className="text-xs font-black text-gray-500 uppercase tracking-widest text-center">
                    Churn Risk Trend
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{ fill: '#9ca3af', fontWeight: 'bold' }} />
                        <YAxis hide />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                            itemStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#8b5cf6' }}
                        />
                        <Area type="monotone" dataKey="risk" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRisk)" />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

// ---------------------------------------------------------------------------
// Admin Data View (synthetic data)
// ---------------------------------------------------------------------------
const AdminDataView = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeSegment, setActiveSegment] = useState<"all" | "high" | "medium" | "low">("all");
    const [expandedRows, setExpandedRows] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [generatingStrategyFor, setGeneratingStrategyFor] = useState<string | null>(null);

    const { data = [], isLoading: isAnalyzing, refetch: handleRefresh } = useQuery({
        queryKey: ['adminUsers'],
        staleTime: Infinity,
        queryFn: async () => {
            const res = await fetchWithAuth("/api/users");
            const users = await res.json();

            // Only run churn analysis on actual customers — exclude admin and agent accounts
            // Cap at 50 for demo performance
            const customers = users
                .filter((u: any) => u.role === "customer")
                .slice(0, 50);

            // Build base records first (no predictions yet)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const baseRecords = customers.map((user: any, i: number) => {
                const services = user.subscribedServices || [];
                const tenureMonths = services.length > 0
                    ? Math.round((Date.now() - new Date(services[0].since).getTime()) / (1000 * 60 * 60 * 24 * 30))
                    : 6;
                return {
                    id: user.id.toString(),
                    name: user.name,
                    tenure: tenureMonths,
                    churnProb: 0,
                    monthlySpend: 15 + (i * 7.5),
                    paymentDelays: Math.floor(i % 3),
                    satisfaction: Math.min(10, 6 + (services.length * 1.5)),
                    actionStatus: 'pending' as const,
                    subscriptions: services.map((s: { name: string; since: string }) => ({
                        planName: s.name,
                        monthsUsed: Math.round((Date.now() - new Date(s.since).getTime()) / (1000 * 60 * 60 * 24 * 30)),
                    })),
                };
            });

            // Single batch call — one HTTP round-trip for all predictions
            const probs = await predictChurnBatch(baseRecords);
            return baseRecords.map((r, i) => ({ ...r, churnProb: probs[i] ?? 0.1 }));
        }
    });


    const filteredData = data.filter(item => {
        if (activeSegment !== "all") {
            const prob = item.churnProb || 0;
            if (activeSegment === "high" && prob <= 0.6) return false;
            if (activeSegment === "medium" && (prob <= 0.3 || prob > 0.6)) return false;
            if (activeSegment === "low" && prob > 0.3) return false;
        }
        if (searchQuery.trim() !== "") {
            return item.name.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
    });

    const toggleRow = (id: string) => {
        setExpandedRows(prev => prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]);
    };

    const handleActionToggle = (id: string) => {
        queryClient.setQueryData(['adminUsers'], (oldData: CustomerRecord[] | undefined) => {
            if (!oldData) return [];
            return oldData.map(p =>
                p.id === id ? { ...p, actionStatus: p.actionStatus === 'resolved' ? 'pending' : 'resolved' } : p
            );
        });
    };

    const handleDownloadReport = () => {
        const exportData = filteredData.map(d => ({
            Subscriber: d.name,
            ID: d.id,
            Tenure: `${d.tenure} cycles`,
            'Churn Risk %': `${Math.round((d.churnProb || 0) * 100)}%`,
            Status: d.actionStatus,
            Strategy: d.retentionStrategy || 'N/A'
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "ChurnAnalysis");
        XLSX.writeFile(wb, `YahyaTel_Churn_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleGenerateStrategy = async (item: CustomerRecord) => {
        setGeneratingStrategyFor(item.id);
        const strategy = await generateRetentionStrategy(item);

        queryClient.setQueryData(['adminUsers'], (oldData: CustomerRecord[] | undefined) => {
            if (!oldData) return [];
            return oldData.map(p =>
                p.id === item.id
                    ? { ...p, retentionStrategy: strategy.includes("API error") || strategy.includes("configure an API token") ? "As a high-value customer with an elevated churn risk, immediately offer a free upgrade to the next tier plan for 3 months. Contact them directly to conduct an account review and ensure their satisfaction with the current services." : strategy }
                    : p
            );
        });

        setGeneratingStrategyFor(null);
    };

    const segments = [
        { id: "all", label: "Global View", icon: Layers, count: data.length },
        { id: "high", label: "Critical Risk", icon: AlertTriangle, count: data.filter(d => (d.churnProb || 0) > 0.6).length, color: "text-red-600" },
        { id: "medium", label: "Warning Zone", icon: Info, count: data.filter(d => (d.churnProb || 0) > 0.3 && (d.churnProb || 0) <= 0.6).length, color: "text-amber-600" },
        { id: "low", label: "Healthy Core", icon: CheckCircle2, count: data.filter(d => (d.churnProb || 0) <= 0.3).length, color: "text-emerald-600" },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <aside className="lg:col-span-1 space-y-6">
                <Card className="border-gray-200 shadow-sm rounded-xl overflow-hidden bg-white">
                    <CardHeader className="bg-gray-50/50 p-4 border-b border-gray-100">
                        <CardTitle className="text-base font-black text-brand-800 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-brand-600" />
                            Risk Segmentation
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 space-y-1">
                        {segments.map((seg, i) => (
                            <motion.button
                                key={seg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: i * 0.07, ease: "easeOut" }}
                                onClick={() => setActiveSegment(seg.id as "all" | "high" | "medium" | "low")}
                                className={cn(
                                    "w-full flex items-center justify-between p-3 rounded-lg transition-all text-xs font-bold",
                                    activeSegment === seg.id ? "bg-brand-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-50 hover:text-brand-600"
                                )}
                            >
                                <div className="flex items-center gap-2.5">
                                    <seg.icon className={cn("w-4 h-4", activeSegment === seg.id ? "text-white" : seg.color)} />
                                    <span>{seg.label}</span>
                                </div>
                                <span className={cn("px-1.5 py-0.5 rounded text-[10px] transition-colors", activeSegment === seg.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500")}>
                                    {seg.count}
                                </span>
                            </motion.button>
                        ))}
                    </CardContent>
                </Card>

                {/* Chart visualization */}
                {data.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                        <Card className="border-gray-200 shadow-sm rounded-xl overflow-hidden bg-white">
                            <CardHeader className="bg-gray-50/50 p-4 border-b border-gray-100">
                                <CardTitle className="text-xs font-black text-gray-500 uppercase tracking-widest text-center">
                                    Risk Distribution
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 flex justify-center h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={segments.slice(1)} // exclude 'all'
                                            dataKey="count"
                                            nameKey="label"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={45}
                                            outerRadius={65}
                                            paddingAngle={3}
                                            stroke="none"
                                        >
                                            <Cell key="high" fill="#ef4444" />
                                            <Cell key="medium" fill="#f59e0b" />
                                            <Cell key="low" fill="#10b981" />
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Trend Chart */}
                {data.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
                        <TrendChart data={data} />
                    </motion.div>
                )}

                {/* Unlock Deep Insights card customer_agent / admin */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}>
                    <Card className="brand-gradient border-none p-6 text-white rounded-xl shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-1000"></div>
                        <div className="space-y-4 relative z-10">
                            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-brand-300" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black mb-1 leading-tight tracking-tight text-white">Unlock Deep Insights</h4>
                                <p className="text-brand-100/70 text-[10px] leading-relaxed font-medium">Get behavior forecasting up to 6 months in advance.</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => navigate("/services#deep-insights")} className="w-full bg-white text-brand-800 hover:bg-brand-50 h-9 rounded-lg font-black text-xs">Unlock Deep Insights</Button>
                        </div>
                    </Card>
                </motion.div>
            </aside>

            {/* Main */}
            <main className="lg:col-span-3 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border-gray-200 shadow-sm bg-white p-4 flex flex-col justify-center">
                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Analysis</div>
                        <div className="text-2xl font-black text-brand-900">{data.length}</div>
                    </Card>
                    <Card className="border-emerald-100 shadow-sm bg-emerald-50/30 p-4 flex flex-col justify-center border-l-4">
                        <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Actions Resolved</div>
                        <div className="text-2xl font-black text-emerald-700">{data.filter(d => d.actionStatus === 'resolved').length}</div>
                    </Card>
                    <Card className="border-amber-100 shadow-sm bg-amber-50/30 p-4 flex flex-col justify-center border-l-4 font-black">
                        <div className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Pending Review</div>
                        <div className="text-2xl font-black text-amber-700">{data.filter(d => d.actionStatus !== 'resolved').length}</div>
                    </Card>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search subscribers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 h-11 bg-white border border-gray-200 shadow-sm rounded-xl outline-none focus:ring-2 focus:ring-brand-500 transition-all font-bold text-xs text-gray-600"
                        />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" size="sm" className="h-11 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] border-gray-200 bg-white shadow-sm flex-1 sm:flex-none" onClick={handleDownloadReport}>
                            <Download className="w-3.5 h-3.5 mr-2" /> Download Report
                        </Button>
                        <Button variant="outline" size="sm" className="h-11 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] border-gray-200 bg-white shadow-sm flex-1 sm:flex-none" onClick={() => handleRefresh()} disabled={isAnalyzing}>
                            <RefreshCw className={cn("w-3.5 h-3.5 mr-2", isAnalyzing && "animate-spin")} /> Refresh
                        </Button>
                    </div>
                </div>

                <Card className="border-gray-200 shadow-lg rounded-xl overflow-hidden bg-white min-h-[400px]">
                    <CardContent className="p-0">
                        {isAnalyzing && data.length === 0 ? (
                            <div className="p-6 space-y-6">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="flex items-center gap-6 animate-pulse">
                                        <div className="w-10 h-10 bg-gray-200/60 rounded-xl"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3.5 bg-gray-200/80 rounded-md w-1/4"></div>
                                            <div className="h-2.5 bg-gray-100/80 rounded-md w-1/5"></div>
                                        </div>
                                        <div className="hidden md:block w-32 h-3.5 bg-gray-200/60 rounded-md"></div>
                                        <div className="hidden md:block w-20 h-6 bg-gray-200/60 rounded-lg"></div>
                                        <div className="w-8 h-8 bg-gray-100 rounded-lg"></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left block md:table flex-1">
                                    <thead className="bg-[#0b2744] text-white hidden md:table-header-group">
                                        <tr className="text-[10px] uppercase font-black tracking-widest">
                                            <th className="px-6 py-4">Subscriber</th>
                                            <th className="px-6 py-4">Tenure</th>
                                            <th className="px-6 py-4">Churn Risk</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Action</th>
                                            <th className="px-6 py-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 block md:table-row-group">
                                        <AnimatePresence>
                                            {filteredData.map((item, i) => (
                                                <React.Fragment key={item.id}>
                                                    <motion.tr
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.05 }}
                                                        className="hover:bg-gray-50/50 group transition-all flex flex-col md:table-row border-b md:border-b-0 p-4 md:p-0"
                                                    >
                                                        <td className="px-2 md:px-6 py-2 md:py-4 block md:table-cell">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-black text-xs">{i + 1}</div>
                                                                <div>
                                                                    <div className="font-extrabold text-gray-900 text-xs">{item.name}</div>
                                                                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.id}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-2 md:px-6 py-2 md:py-4 block md:table-cell">
                                                            <div className="text-xs font-bold text-gray-600">{item.tenure} cycles</div>
                                                            <div className="font-bold text-brand-600 text-[9px] uppercase tracking-tighter">Standard Sub</div>
                                                        </td>
                                                        <td className="px-2 md:px-6 py-2 md:py-4 block md:table-cell">
                                                            <div className="space-y-1.5 md:max-w-[120px]">
                                                                <div className="flex justify-between items-end text-[9px] font-black">
                                                                    <span className={cn((item.churnProb || 0) > 0.6 ? "text-red-600" : (item.churnProb || 0) > 0.3 ? "text-amber-600" : "text-emerald-600")}>
                                                                        {Math.round((item.churnProb || 0) * 100)}%
                                                                    </span>
                                                                    <span className="text-gray-300">Probability</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${(item.churnProb || 0) * 100}%` }}
                                                                        transition={{ duration: 1, ease: "easeOut" }}
                                                                        className={cn("h-full", (item.churnProb || 0) > 0.6 ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]" : (item.churnProb || 0) > 0.3 ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]")}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-2 md:px-6 py-2 md:py-4 block md:table-cell">
                                                            <div className={cn("px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-center shadow-lg transition-transform group-hover:scale-105 inline-block min-w-[100px]",
                                                                (item.churnProb || 0) > 0.6 ? "bg-red-500 text-white" : (item.churnProb || 0) > 0.3 ? "bg-amber-500 text-white" : "bg-emerald-500 text-white")}>
                                                                {(item.churnProb || 0) > 0.6 ? "Alert" : (item.churnProb || 0) > 0.3 ? "Check" : "Safe"}
                                                            </div>
                                                        </td>
                                                        <td className="px-2 md:px-6 py-2 md:py-4 block md:table-cell">
                                                            <span className={cn("px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-tight",
                                                                item.actionStatus === 'resolved' ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                                                            )}>
                                                                {item.actionStatus || 'pending'}
                                                            </span>
                                                        </td>
                                                        <td className="px-2 md:px-6 py-2 md:py-4 block md:table-cell md:text-right">
                                                            <Button
                                                                variant="ghost"
                                                                className="h-8 w-full md:w-8 p-0 rounded-lg bg-gray-50 hover:bg-brand-50 hover:text-brand-600 transition-all shadow-sm"
                                                                onClick={() => toggleRow(item.id)}
                                                            >
                                                                <ChevronRight className={cn("w-4 h-4 transition-transform mx-auto", expandedRows.includes(item.id) && "rotate-90")} />
                                                            </Button>
                                                        </td>
                                                    </motion.tr>
                                                    {/* Sub-row for expanded data */}
                                                    {expandedRows.includes(item.id) && (
                                                        <tr key={`${item.id}-expanded`} className="bg-gray-50/50 border-b border-gray-100 block md:table-row">
                                                            <td colSpan={5} className="px-4 py-4 block md:table-cell">
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: "auto", opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
                                                                        <div className="text-xs font-black text-gray-800 uppercase tracking-widest border-b pb-2">Subscription History</div>
                                                                        {item.subscriptions && item.subscriptions.length > 0 ? (
                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                                                {item.subscriptions.map((sub, idx) => (
                                                                                    <div key={idx} className="bg-brand-50/50 p-3 rounded-lg border border-brand-100 flex justify-between items-center">
                                                                                        <div className="text-xs font-bold text-gray-700">{sub.planName}</div>
                                                                                        <div className="text-[10px] font-black text-brand-600 bg-brand-100 px-2 py-1 rounded-md">{sub.monthsUsed} months</div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="text-xs text-gray-500 font-medium">No subscription data available.</div>
                                                                        )}

                                                                        {/* Retention Strategy Section Admin */}
                                                                        <div className="mt-2 border-t pt-3">
                                                                            <div className="flex justify-between items-center mb-4">
                                                                                <div className="text-xs font-black text-gray-800 uppercase tracking-widest flex items-center gap-1.5 focus:outline-none">
                                                                                    <Zap className="w-3.5 h-3.5 text-amber-500" /> Strategic Intelligence
                                                                                    <span className={cn("ml-2 px-2 py-0.5 rounded text-[8px] border",
                                                                                        item.actionStatus === 'resolved' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-50 text-gray-500 border-gray-200"
                                                                                    )}>
                                                                                        {item.actionStatus === 'resolved' ? 'RESOLVED' : 'PENDING'}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex gap-2">
                                                                                    {(item.churnProb || 0) >= 0.4 && !item.retentionStrategy && (
                                                                                        <Button
                                                                                            size="sm"
                                                                                            className="h-7 text-[10px] font-black uppercase tracking-widest px-3 bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20"
                                                                                            onClick={() => handleGenerateStrategy(item)}
                                                                                            disabled={generatingStrategyFor === item.id}
                                                                                        >
                                                                                            {generatingStrategyFor === item.id ? (
                                                                                                <><RefreshCw className="w-2.5 h-2.5 mr-1.5 animate-spin" /> Computing...</>
                                                                                            ) : (
                                                                                                <><Zap className="w-2.5 h-2.5 mr-1.5" /> Plan Action</>
                                                                                            )}
                                                                                        </Button>
                                                                                    )}
                                                                                    {item.retentionStrategy && (
                                                                                        <Button
                                                                                            size="sm"
                                                                                            onClick={() => handleActionToggle(item.id)}
                                                                                            className={cn("h-7 text-[10px] font-black uppercase tracking-widest px-3 transition-all",
                                                                                                item.actionStatus === 'resolved' ? "bg-gray-100 text-gray-500 hover:bg-gray-200" : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20")}
                                                                                        >
                                                                                            {item.actionStatus === 'resolved' ? 'Undo Resolve' : 'Mark Resolved'}
                                                                                        </Button>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {(item.churnProb || 0) < 0.4 ? (
                                                                                <div className="text-xs text-emerald-600/80 font-medium bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/50 italic">
                                                                                    System Analysis: Churn risk nominal. Standard engagement protocols sufficient.
                                                                                </div>
                                                                            ) : item.retentionStrategy ? (
                                                                                <div className="text-xs text-brand-800 font-medium bg-brand-50 p-4 rounded-xl border border-brand-200 leading-relaxed shadow-inner">
                                                                                    <div className="flex items-center gap-2 mb-2 border-b border-brand-100 pb-2">
                                                                                        <LayoutDashboard className="w-3.5 h-3.5 text-brand-600" />
                                                                                        <span className="font-black text-brand-700 uppercase tracking-wider text-[10px]">Strategic Intelligence</span>
                                                                                    </div>
                                                                                    {item.retentionStrategy}
                                                                                </div>
                                                                            ) : (
                                                                                <div className="text-xs text-amber-700/70 font-medium bg-amber-50/50 p-3 rounded-lg border border-amber-200/50 italic flex items-center gap-2">
                                                                                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Critical Risk: Action plan generation required.
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </AnimatePresence>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Page shell
// ---------------------------------------------------------------------------
const AIAnalyzer = () => {
    const role = getRole();

    // Customers have no access — redirect to home
    if (role === "customer" || !role) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50">
            {/* Header Banner */}
            <section className="hero-gradient py-16 lg:py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="max-w-7xl mx-auto px-4 relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left space-y-1">
                        <h2 className="text-4xl lg:text-7xl font-black text-white tracking-tight leading-tight uppercase">
                            Churn Prediction & Retention Engine
                        </h2>
                        <p className="text-brand-100/70 text-base font-medium">Predicting subscriber behavior.</p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <Button size="sm" className="h-11 px-6 rounded-lg font-bold bg-white text-brand-800 hover:bg-brand-50 shadow-xl transition-all">
                            <FileUp className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>
            </section>

            {role === "admin" ? <AdminDataView /> : <AgentUploadView />}
        </div>
    );
};

export default AIAnalyzer;
