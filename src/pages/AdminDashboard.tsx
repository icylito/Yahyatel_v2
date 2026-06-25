import { useState, useEffect } from "react";
import {
    Users,
    Settings,
    Clock,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Mail,
    PhoneCall,
    Download,
    MessageCircle,
    RefreshCw,
    Trash2,
    CheckCircle,
    Inbox,
    Send,
    UserX,
    XCircle,
    AlertTriangle,
    ChevronDown,
    ChevronUp
} from "lucide-react";
import { Button } from "../components/ui/BuyButton";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/TelecomPlanCard";
import { cn } from "../lib/utils";
import * as XLSX from "xlsx";
import { fetchWithAuth } from "../lib/api";

interface Service {
    name: string;
    since: string;
}

interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    subscribedServices?: Service[];
}

interface ChatLog {
    id: string;
    user: string;
    role: string;
    text: string;
    timestamp: string;
}

interface ContactMessage {
    id: number;
    name: string;
    email: string;
    subject: string;
    message: string;
    created_at: string;
    status: string;
    reply?: string;
    reply_at?: string;
}

interface DeletionRequest {
    id: number;
    user_id: number | null;
    user_name: string;
    user_email: string;
    reason: string;
    custom_reason: string | null;
    status: "Pending" | "Approved" | "Rejected";
    admin_note: string | null;
    created_at: string;
}

const AdminDashboard = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [chatlogs, setChatlogs] = useState<ChatLog[]>([]);
    const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);
    const [isClearingLogs, setIsClearingLogs] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);
    const [contacts, setContacts] = useState<ContactMessage[]>([]);
    const [isRefreshingContacts, setIsRefreshingContacts] = useState(false);
    const [resolvingId, setResolvingId] = useState<number | null>(null);
    // Reply state: contactId -> draft text
    const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
    const [replyOpenId, setReplyOpenId] = useState<number | null>(null);
    const [sendingReplyId, setSendingReplyId] = useState<number | null>(null);
    // Deletion requests
    const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
    const [isRefreshingDeletions, setIsRefreshingDeletions] = useState(false);
    const [rejectNotes, setRejectNotes] = useState<Record<number, string>>({});
    const [rejectOpenId, setRejectOpenId] = useState<number | null>(null);
    const [processingDeletionId, setProcessingDeletionId] = useState<number | null>(null);

    const fetchChatlogs = async () => {
        setIsRefreshingLogs(true);
        try {
            const res = await fetchWithAuth("/api/chatlogs");
            if (!res.ok) throw new Error("Failed to fetch logs");
            const data = await res.json();
            if (Array.isArray(data)) {
                setChatlogs(data);
            }
        } catch (err) {
            console.error("Could not fetch chatlogs:", err);
        } finally {
            setIsRefreshingLogs(false);
        }
    };

    const clearChatlogs = async () => {
        if (!confirmClear) {
            setConfirmClear(true);
            setTimeout(() => setConfirmClear(false), 4000); // auto-reset after 4s
            return;
        }
        setConfirmClear(false);
        setIsClearingLogs(true);
        try {
            await fetchWithAuth("/api/chatlogs", { method: "DELETE" });
            setChatlogs([]);
        } catch (err) {
            console.error("Could not clear chatlogs:", err);
        } finally {
            setIsClearingLogs(false);
        }
    };

    const fetchContacts = async () => {
        setIsRefreshingContacts(true);
        try {
            const res = await fetchWithAuth("/api/contact");
            if (!res.ok) throw new Error("Failed to fetch contacts");
            const data = await res.json();
            if (Array.isArray(data)) {
                setContacts(data);
            }
        } catch (err) {
            console.error("Could not fetch contacts:", err);
        } finally {
            setIsRefreshingContacts(false);
        }
    };

    const handleResolveContact = async (id: number) => {
        setResolvingId(id);
        try {
            const res = await fetchWithAuth(`/api/contact/${id}/resolve`, { method: "PUT" });
            if (res.ok) {
                setContacts(prev => prev.map(c => c.id === id ? { ...c, status: "Resolved" } : c));
            }
        } catch (err) {
            console.error("Could not resolve contact:", err);
        } finally {
            setResolvingId(null);
        }
    };

    const handleSendReply = async (id: number) => {
        const reply = replyDrafts[id]?.trim();
        if (!reply) return;
        setSendingReplyId(id);
        try {
            const res = await fetchWithAuth(`/api/contact/${id}/reply`, {
                method: "PUT",
                body: JSON.stringify({ reply }),
            });
            if (res.ok) {
                setContacts(prev => prev.map(c => c.id === id ? { ...c, status: "Resolved", reply, reply_at: new Date().toISOString() } : c));
                setReplyDrafts(prev => ({ ...prev, [id]: "" }));
                setReplyOpenId(null);
            }
        } catch (err) {
            console.error("Could not send reply:", err);
        } finally {
            setSendingReplyId(null);
        }
    };

    const fetchDeletionRequests = async () => {
        setIsRefreshingDeletions(true);
        try {
            const res = await fetchWithAuth("/api/deletion-requests");
            if (!res.ok) throw new Error("Failed to fetch deletion requests");
            const data = await res.json();
            if (Array.isArray(data)) setDeletionRequests(data);
        } catch (err) {
            console.error("Could not fetch deletion requests:", err);
        } finally {
            setIsRefreshingDeletions(false);
        }
    };

    const handleApproveDeletion = async (id: number) => {
        setProcessingDeletionId(id);
        try {
            const res = await fetchWithAuth(`/api/deletion-requests/${id}/approve`, { method: "PUT" });
            if (res.ok) {
                setDeletionRequests(prev => prev.map(r => r.id === id ? { ...r, status: "Approved" as const } : r));
            }
        } catch (err) {
            console.error("Could not approve deletion:", err);
        } finally {
            setProcessingDeletionId(null);
        }
    };

    const handleRejectDeletion = async (id: number) => {
        const note = rejectNotes[id]?.trim() || "";
        setProcessingDeletionId(id);
        try {
            const res = await fetchWithAuth(`/api/deletion-requests/${id}/reject`, {
                method: "PUT",
                body: JSON.stringify({ admin_note: note }),
            });
            if (res.ok) {
                setDeletionRequests(prev => prev.map(r => r.id === id ? { ...r, status: "Rejected" as const, admin_note: note } : r));
                setRejectOpenId(null);
                setRejectNotes(prev => ({ ...prev, [id]: "" }));
            }
        } catch (err) {
            console.error("Could not reject deletion:", err);
        } finally {
            setProcessingDeletionId(null);
        }
    };

    useEffect(() => {
        fetchWithAuth("/api/users")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setUsers(data);
            })
            .catch(err => console.error("Could not fetch user database:", err));

        fetchChatlogs();
        fetchContacts();
        fetchDeletionRequests();
    }, []);

    const handleExport = () => {
        if (!users || users.length === 0) return;

        // Prepare data for export
        const exportData = users.map(user => ({
            "User ID": user.id,
            "Full Name": user.name,
            "Email Address": user.email,
            "Phone Number": user.phone,
            "Account Role": user.role,
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Subscribers");
        XLSX.writeFile(wb, "admin_subscribers_export.xlsx");
    };

    const [stats, setStats] = useState([
        { label: "Active Subscriptions", value: "—", delta: "Live", trend: "up" as const, icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Subscriber Core", value: "—", delta: "Live", trend: "up" as const, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
        { label: "Chat Interactions", value: "—", delta: "Live", trend: "up" as const, icon: MessageCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Contact Messages", value: "—", delta: "Live", trend: "up" as const, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    ]);

    useEffect(() => {
        fetchWithAuth("/api/stats")
            .then(r => r.json())
            .then(data => {
                if (data && typeof data === 'object') {
                    setStats([
                        { label: "Active Subscriptions", value: (data.subscriptions ?? "0").toString(), delta: "Live", trend: "up" as const, icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
                        { label: "Subscriber Core", value: (data.users ?? "0").toString(), delta: "Live", trend: "up" as const, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
                        { label: "Chat Interactions", value: (data.chatInteractions ?? "0").toString(), delta: "Live", trend: "up" as const, icon: MessageCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
                        { label: "Contact Messages", value: (data.contactMessages ?? "0").toString(), delta: "Live", trend: "up" as const, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                    ]);
                }
            })
            .catch(err => console.error("Could not fetch stats:", err));

    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50">
            {/* Top Bar Navigation (Internal to Dashboard) */}


            {/* Main Content Area */}
            <main className="p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat) => (
                        <Card key={stat.label} className="border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl group overflow-hidden">
                            <CardContent className="p-5 flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</div>
                                    <div className="text-2xl font-black text-brand-900 tracking-tight">{stat.value}</div>
                                    <div className={cn(
                                        "flex items-center text-[10px] font-bold uppercase tracking-tighter",
                                        stat.trend === "up" ? "text-emerald-600" : "text-red-500"
                                    )}>
                                        {stat.trend === "up" ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                                        {stat.delta} <span className="text-gray-400 ml-1">v.last cycle</span>
                                    </div>
                                </div>
                                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center transition-all group-hover:scale-110", stat.bg, stat.color)}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* User Accounts Feed */}
                    <Card className="lg:col-span-2 border-gray-200 shadow-md rounded-xl overflow-hidden bg-white flex flex-col h-full">
                        <CardHeader className="bg-gray-50/50 p-5 border-b border-gray-100 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-black text-brand-800 flex items-center gap-2 uppercase tracking-widest">
                                <Users className="w-4 h-4 text-brand-600" />
                                Registered Accounts Database
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="h-8 p-2 rounded-lg bg-gray-100 hover:bg-gray-200" onClick={handleExport}>
                                <Download className="w-4 h-4 text-gray-600 mr-2" />
                                <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Export Excel</span>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto flex-1">
                            {users.length === 0 ? (
                                <div className="p-10 text-center text-sm font-bold text-gray-400 flex items-center justify-center h-full">
                                    No accounts registered yet.
                                </div>
                            ) : (
                                <table className="w-full text-left min-w-[500px]">
                                    <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        <tr>
                                            <th className="px-4 py-3">Account</th>
                                            <th className="px-4 py-3">Contact</th>
                                            <th className="px-4 py-3">Services</th>
                                            <th className="px-4 py-3">Role</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {users.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-black uppercase text-sm border border-brand-100">
                                                            {user.name?.charAt(0) || "?"}
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-black text-gray-800 uppercase tracking-tight">{user.name}</div>
                                                            <div className="text-[9px] font-bold text-gray-400 tracking-widest">ID: {user.id || "N/A"}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 space-y-1">
                                                    <div className="text-[10px] font-bold text-gray-600 flex items-center gap-1.5"><Mail className="w-3 h-3 text-gray-400" /> {user.email}</div>
                                                    <div className="text-[10px] font-bold text-gray-600 flex items-center gap-1.5"><PhoneCall className="w-3 h-3 text-gray-400" /> {user.phone}</div>
                                                </td>
                                                <td className="px-4 py-4 max-w-[200px] overflow-hidden">
                                                    {user.subscribedServices && user.subscribedServices.length > 0 ? (
                                                        <div className="flex flex-col gap-1.5">
                                                            {user.subscribedServices.map((svc, i) => (
                                                                <div key={i} className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-sm w-max border border-brand-100">
                                                                    {svc.name}
                                                                    <span className="text-gray-400 ml-1.5 font-medium uppercase tracking-tight opacity-70">
                                                                        SINCE {new Date(svc.since).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-gray-400 font-medium italic">No active services</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className={cn(
                                                        "px-2 py-1 rounded inline-flex text-[9px] font-black uppercase tracking-widest border",
                                                        user.role === "customer" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                    )}>
                                                        {user.role ? user.role.replace("_", " ") : "Unknown"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Config */}
                    <aside className="space-y-6">
                        <Card className="brand-gradient border-none p-8 text-white rounded-xl shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-1000"></div>
                            <div className="relative z-10 space-y-4">
                                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                    <Settings className="w-5 h-5 text-brand-300" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black mb-1 leading-tight tracking-tight uppercase">Dashboard Configuration</h3>
                                    <p className="text-brand-100/70 text-[10px] font-medium leading-relaxed uppercase tracking-widest italic">Modify matrix parameters and analytics frequency.</p>
                                </div>
                                <Button className="w-full bg-white text-brand-900 hover:bg-brand-50 h-10 rounded-lg font-black text-xs uppercase tracking-widest shadow-lg">Settings Core</Button>
                            </div>
                        </Card>

                        <Card className="border-gray-200 shadow-sm rounded-xl overflow-hidden bg-white">
                            <CardHeader className="bg-gray-50/50 p-4 border-b border-gray-100 flex justify-between items-center flex-row">
                                <CardTitle className="text-[10px] font-black text-brand-800 uppercase tracking-widest">
                                    Quick Shortcuts
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-2">
                                <Button variant="outline" size="sm" className="w-full h-10 rounded-lg justify-start gap-3 border-gray-100 hover:bg-gray-50 font-black text-xs text-gray-600 uppercase tracking-tighter">
                                    View Reports Matrix
                                </Button>
                                <Button variant="outline" size="sm" className="w-full h-10 rounded-lg justify-start gap-3 border-gray-100 hover:bg-gray-50 font-black text-xs text-gray-600 uppercase tracking-tighter" onClick={handleExport}>
                                    <Download className="w-4 h-4" /> Export Data (XLSX)
                                </Button>
                            </CardContent>
                        </Card>
                    </aside>
                </div>

                {/* Chatbots Logs Feed */}
                <Card className="border-gray-200 shadow-md rounded-xl overflow-hidden bg-white mt-8">
                    <CardHeader className="bg-gray-50/50 p-5 border-b border-gray-100 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-black text-brand-800 flex items-center gap-2 uppercase tracking-widest">
                            <MessageCircle className="w-4 h-4 text-brand-600" />
                            Chatbot Interaction Logs
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 rounded-lg bg-gray-50 hover:bg-gray-100/80 transition-colors border-gray-200"
                                onClick={fetchChatlogs}
                                disabled={isRefreshingLogs || isClearingLogs}
                            >
                                <RefreshCw className={cn("w-3.5 h-3.5 text-gray-600 mr-1.5", isRefreshingLogs && "animate-spin")} />
                                <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Refresh</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "h-8 px-3 rounded-lg shadow-sm border transition-colors group font-bold text-xs uppercase tracking-widest",
                                    confirmClear
                                        ? "bg-red-600 text-white border-red-600 hover:bg-red-700 animate-pulse"
                                        : "bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border-red-200"
                                )}
                                onClick={clearChatlogs}
                                disabled={isRefreshingLogs || isClearingLogs || chatlogs.length === 0}
                            >
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                {isClearingLogs ? "Clearing..." : confirmClear ? "Confirm? Click Again" : "Delete All"}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto max-h-[500px] overflow-y-auto">
                        {chatlogs.length === 0 ? (
                            <div className="p-10 text-center text-sm font-bold text-gray-400 flex items-center justify-center">
                                No chat logs found.
                            </div>
                        ) : (
                            <table className="w-full text-left min-w-[500px]">
                                <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3 w-[20%]">User</th>
                                        <th className="px-4 py-3 w-[60%]">Message</th>
                                        <th className="px-4 py-3 w-[20%]">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-xs">
                                    {[...chatlogs].reverse().map((log, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3 font-bold text-gray-800 uppercase tracking-tight">
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded text-[9px] mr-2 inline-flex border",
                                                    log.role === 'user' ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-brand-50 text-brand-700 border-brand-100"
                                                )}>
                                                    {log.role}
                                                </span>
                                                {log.user}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {log.text}
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 font-medium text-[10px] tracking-wide">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>

                {/* Customer Requests Logs */}
                <Card className="border-gray-200 shadow-md rounded-xl overflow-hidden bg-white mt-8">
                    <CardHeader className="bg-gray-50/50 p-5 border-b border-gray-100 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-black text-brand-800 flex items-center gap-2 uppercase tracking-widest">
                            <Inbox className="w-4 h-4 text-brand-600" />
                            Customer Requests
                        </CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 rounded-lg bg-gray-50 hover:bg-gray-100/80 transition-colors border-gray-200"
                            onClick={fetchContacts}
                            disabled={isRefreshingContacts}
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5 text-gray-600 mr-1.5", isRefreshingContacts && "animate-spin")} />
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Refresh</span>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto max-h-[500px] overflow-y-auto">
                        {contacts.length === 0 ? (
                            <div className="p-10 text-center text-sm font-bold text-gray-400 flex items-center justify-center">
                                No customer requests found.
                            </div>
                        ) : (
                            <table className="w-full text-left min-w-[800px]">
                                <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3">Sender</th>
                                        <th className="px-4 py-3">Subject</th>
                                        <th className="px-4 py-3">Message</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-xs">
                                    {contacts.map((contact) => (
                                        <>
                                        <tr key={contact.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-black uppercase text-xs border border-amber-100">
                                                        {contact.name?.charAt(0) || "?"}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-black text-gray-800 uppercase tracking-tight">{contact.name}</div>
                                                        <div className="text-[9px] font-bold text-gray-400 flex items-center gap-1"><Mail className="w-2.5 h-2.5" />{contact.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-sm border border-brand-100">
                                                    {contact.subject}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 max-w-[220px]">
                                                <div className="line-clamp-2">{contact.message}</div>
                                                {contact.reply && (
                                                    <div className="mt-1.5 text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-2 py-1">
                                                        <span className="font-black">Reply:</span> {contact.reply}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 font-medium text-[10px] tracking-wide whitespace-nowrap">
                                                {contact.created_at ? new Date(contact.created_at).toLocaleString() : "—"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={cn(
                                                    "px-2 py-1 rounded inline-flex text-[9px] font-black uppercase tracking-widest border",
                                                    contact.status === "Resolved"
                                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                        : "bg-amber-50 text-amber-600 border-amber-100"
                                                )}>
                                                    {contact.status || "Pending"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                                    {contact.status !== "Resolved" && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-600 border-emerald-200 transition-colors"
                                                            onClick={() => handleResolveContact(contact.id)}
                                                            disabled={resolvingId === contact.id}
                                                        >
                                                            <CheckCircle className={cn("w-3.5 h-3.5 mr-1", resolvingId === contact.id && "animate-spin")} />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                                                {resolvingId === contact.id ? "..." : "Resolve"}
                                                            </span>
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className={cn(
                                                            "h-7 px-2.5 rounded-lg transition-colors border",
                                                            replyOpenId === contact.id
                                                                ? "bg-brand-600 text-white border-brand-600"
                                                                : "bg-brand-50 text-brand-600 border-brand-200 hover:bg-brand-600 hover:text-white"
                                                        )}
                                                        onClick={() => setReplyOpenId(replyOpenId === contact.id ? null : contact.id)}
                                                    >
                                                        <Send className="w-3 h-3 mr-1" />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">Reply</span>
                                                        {replyOpenId === contact.id
                                                            ? <ChevronUp className="w-3 h-3 ml-1" />
                                                            : <ChevronDown className="w-3 h-3 ml-1" />}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                        {replyOpenId === contact.id && (
                                            <tr key={`reply-${contact.id}`} className="bg-brand-50/40">
                                                <td colSpan={6} className="px-4 py-3">
                                                    <div className="flex gap-2 items-start">
                                                        <textarea
                                                            value={replyDrafts[contact.id] || ""}
                                                            onChange={e => setReplyDrafts(prev => ({ ...prev, [contact.id]: e.target.value }))}
                                                            rows={2}
                                                            placeholder={`Reply to ${contact.name}...`}
                                                            className="flex-1 text-xs rounded-lg border border-brand-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
                                                        />
                                                        <Button
                                                            size="sm"
                                                            className="h-9 px-3 rounded-lg bg-brand-600 text-white hover:bg-brand-700 font-black text-[10px] uppercase tracking-widest"
                                                            onClick={() => handleSendReply(contact.id)}
                                                            disabled={sendingReplyId === contact.id || !(replyDrafts[contact.id]?.trim())}
                                                        >
                                                            <Send className={cn("w-3.5 h-3.5 mr-1", sendingReplyId === contact.id && "animate-pulse")} />
                                                            {sendingReplyId === contact.id ? "Sending..." : "Send"}
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>
                {/* Deletion Requests */}
                <Card className="border-gray-200 shadow-md rounded-xl overflow-hidden bg-white mt-8">
                    <CardHeader className="bg-gray-50/50 p-5 border-b border-gray-100 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-black text-brand-800 flex items-center gap-2 uppercase tracking-widest">
                            <UserX className="w-4 h-4 text-red-500" />
                            Account Deletion Requests
                            {deletionRequests.filter(r => r.status === "Pending").length > 0 && (
                                <span className="ml-1 text-[9px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded-full">
                                    {deletionRequests.filter(r => r.status === "Pending").length} Pending
                                </span>
                            )}
                        </CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 rounded-lg bg-gray-50 hover:bg-gray-100/80 transition-colors border-gray-200"
                            onClick={fetchDeletionRequests}
                            disabled={isRefreshingDeletions}
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5 text-gray-600 mr-1.5", isRefreshingDeletions && "animate-spin")} />
                            <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Refresh</span>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto max-h-[500px] overflow-y-auto">
                        {deletionRequests.length === 0 ? (
                            <div className="p-10 text-center text-sm font-bold text-gray-400 flex items-center justify-center">
                                No deletion requests.
                            </div>
                        ) : (
                            <table className="w-full text-left min-w-[700px]">
                                <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3">User</th>
                                        <th className="px-4 py-3">Reason</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 text-xs">
                                    {deletionRequests.map((req) => (
                                        <>
                                        <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-500 font-black uppercase text-xs border border-red-100">
                                                        {req.user_name?.charAt(0) || "?"}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-black text-gray-800 uppercase tracking-tight">{req.user_name}</div>
                                                        <div className="text-[9px] font-bold text-gray-400 flex items-center gap-1">
                                                            <Mail className="w-2.5 h-2.5" />{req.user_email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 max-w-[220px]">
                                                <div className="text-[11px] font-bold text-gray-700">{req.reason}</div>
                                                {req.custom_reason && (
                                                    <div className="text-[10px] text-gray-400 mt-0.5 italic">{req.custom_reason}</div>
                                                )}
                                                {req.admin_note && (
                                                    <div className="mt-1 text-[10px] text-blue-600 bg-blue-50 border border-blue-100 rounded px-2 py-1">
                                                        <span className="font-black">Note:</span> {req.admin_note}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 font-medium text-[10px] tracking-wide whitespace-nowrap">
                                                {req.created_at ? new Date(req.created_at).toLocaleString() : "—"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={cn(
                                                    "px-2 py-1 rounded inline-flex text-[9px] font-black uppercase tracking-widest border",
                                                    req.status === "Approved" ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                        : req.status === "Rejected" ? "bg-red-50 text-red-500 border-red-100"
                                                        : "bg-amber-50 text-amber-600 border-amber-100"
                                                )}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {req.status === "Pending" ? (
                                                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 px-2.5 rounded-lg bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border-red-200 transition-colors"
                                                            onClick={() => handleApproveDeletion(req.id)}
                                                            disabled={processingDeletionId === req.id}
                                                        >
                                                            <Trash2 className="w-3 h-3 mr-1" />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">Delete Account</span>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className={cn(
                                                                "h-7 px-2.5 rounded-lg transition-colors border",
                                                                rejectOpenId === req.id
                                                                    ? "bg-gray-700 text-white border-gray-700"
                                                                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-700 hover:text-white"
                                                            )}
                                                            onClick={() => setRejectOpenId(rejectOpenId === req.id ? null : req.id)}
                                                        >
                                                            <XCircle className="w-3 h-3 mr-1" />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">Reject</span>
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className={cn(
                                                        "text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1",
                                                        req.status === "Approved" ? "text-emerald-500" : "text-gray-400"
                                                    )}>
                                                        {req.status === "Approved"
                                                            ? <><Trash2 className="w-3.5 h-3.5" /> Deleted</>
                                                            : <><XCircle className="w-3.5 h-3.5" /> Rejected</>
                                                        }
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                        {rejectOpenId === req.id && req.status === "Pending" && (
                                            <tr key={`reject-${req.id}`} className="bg-gray-50/80">
                                                <td colSpan={5} className="px-4 py-3">
                                                    <div className="flex gap-2 items-start">
                                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-500 uppercase tracking-widest pt-2 shrink-0">
                                                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                                            Rejection message (shown to user):
                                                        </div>
                                                        <textarea
                                                            value={rejectNotes[req.id] || ""}
                                                            onChange={e => setRejectNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                                                            rows={2}
                                                            placeholder="Explain why you're rejecting this request (optional)..."
                                                            className="flex-1 text-xs rounded-lg border border-gray-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
                                                        />
                                                        <Button
                                                            size="sm"
                                                            className="h-9 px-3 rounded-lg bg-gray-700 text-white hover:bg-gray-800 font-black text-[10px] uppercase tracking-widest"
                                                            onClick={() => handleRejectDeletion(req.id)}
                                                            disabled={processingDeletionId === req.id}
                                                        >
                                                            <XCircle className="w-3.5 h-3.5 mr-1" />
                                                            Confirm Rejection
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        </>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default AdminDashboard;
