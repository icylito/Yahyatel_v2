import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import {
    User, Mail, Phone, Shield, LogOut, Trash2, ChevronRight,
    Wifi, MessageCircle, HelpCircle, CreditCard, AlertTriangle,
    CheckCircle, XCircle, Clock, Send
} from "lucide-react";
import { fetchWithAuth } from "../lib/api";
import { cn } from "../lib/utils";

interface Service {
    name: string;
    since: string;
}

interface UserProfile {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: string;
    services: Service[];
}

interface DeletionStatus {
    id?: number;
    status?: "Pending" | "Approved" | "Rejected";
    reason?: string;
    custom_reason?: string;
    admin_note?: string;
    created_at?: string;
}

const DELETION_REASONS = [
    "Not using the service anymore",
    "Price is too high",
    "Switching to a competitor",
    "Poor network coverage",
    "Technical issues unresolved",
    "Other",
];

function getNextBillingDate(since: string): string {
    const sinceDate = new Date(since);
    const billingDay = sinceDate.getDate();
    const today = new Date();
    let next = new Date(today.getFullYear(), today.getMonth(), billingDay);
    if (next <= today) {
        next = new Date(today.getFullYear(), today.getMonth() + 1, billingDay);
    }
    return `${next.getDate()}/${next.getMonth() + 1}/${next.getFullYear()}`;
}

function getMemberSince(services: Service[]): string {
    if (!services || services.length === 0) return "N/A";
    const dates = services.map(s => new Date(s.since).getTime()).filter(Boolean);
    if (dates.length === 0) return "N/A";
    const oldest = new Date(Math.min(...dates));
    return oldest.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

type Tab = "overview" | "support" | "about";

const Profile = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [deletionStatus, setDeletionStatus] = useState<DeletionStatus>({});
    const [loading, setLoading] = useState(true);

    // Deletion form state
    const [selectedReason, setSelectedReason] = useState("");
    const [customReason, setCustomReason] = useState("");
    const [submittingDeletion, setSubmittingDeletion] = useState(false);
    const [deletionError, setDeletionError] = useState("");

    const role = sessionStorage.getItem("role");

    useEffect(() => {
        if (!role) {
            navigate("/login");
            return;
        }
        Promise.all([
            fetchWithAuth("/api/users/me").then(r => r.json()),
            fetchWithAuth("/api/users/me/deletion-status").then(r => r.json()),
        ])
            .then(([profileData, statusData]) => {
                setProfile(profileData);
                setDeletionStatus(statusData || {});
            })
            .catch(err => console.error("Profile fetch error:", err))
            .finally(() => setLoading(false));
    }, []);

    const handleLogout = () => {
        sessionStorage.clear();
        navigate("/login");
    };

    const handleDeletionSubmit = async () => {
        if (!selectedReason) {
            setDeletionError("Please select a reason.");
            return;
        }
        setDeletionError("");
        setSubmittingDeletion(true);
        try {
            const res = await fetchWithAuth("/api/users/deletion-request", {
                method: "POST",
                body: JSON.stringify({
                    reason: selectedReason,
                    custom_reason: selectedReason === "Other" && customReason.trim() ? customReason.trim() : null,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setDeletionStatus(data);
                setSelectedReason("");
                setCustomReason("");
            }
        } catch {
            setDeletionError("Failed to submit request. Try again.");
        } finally {
            setSubmittingDeletion(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-sm font-bold text-gray-500">Could not load profile.</p>
                    <Link to="/" className="text-brand-600 text-sm font-bold mt-2 inline-block hover:underline">Go Home</Link>
                </div>
            </div>
        );
    }

    const initials = profile.name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";

    const tabs: { id: Tab; label: string; icon: typeof User }[] = [
        { id: "overview", label: "Account Overview", icon: User },
        { id: "support", label: "Support", icon: HelpCircle },
        { id: "about", label: "About Account", icon: Shield },
    ];

    return (
        <div className="min-h-screen bg-gray-50/60 py-8 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Page header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">My Account</h1>
                    <p className="text-xs text-gray-400 font-medium mt-0.5 uppercase tracking-widest">Manage your profile, services, and account settings</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* ── Left Sidebar ── */}
                    <aside className="w-full lg:w-64 shrink-0 space-y-4">
                        {/* Avatar card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center space-y-3">
                            <div className="w-20 h-20 rounded-2xl brand-gradient flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-brand-600/20">
                                {initials}
                            </div>
                            <div>
                                <div className="text-sm font-black text-gray-900 tracking-tight">{profile.name}</div>
                                <div className="text-[10px] text-gray-400 font-medium mt-0.5">{profile.email}</div>
                            </div>
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border",
                                profile.role === "admin" ? "bg-purple-50 text-purple-600 border-purple-100"
                                    : profile.role === "customer_agent" ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                        : "bg-blue-50 text-blue-600 border-blue-100"
                            )}>
                                {profile.role?.replace("_", " ")}
                            </span>
                            <div className="text-[10px] text-gray-400 font-medium">
                                Member since {getMemberSince(profile.services)}
                            </div>
                        </div>

                        {/* Tab nav */}
                        <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-4 py-3.5 text-xs font-bold transition-all border-b border-gray-50 last:border-0",
                                        activeTab === tab.id
                                            ? "bg-brand-50 text-brand-700 border-l-2 border-l-brand-600"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-brand-600"
                                    )}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <tab.icon className="w-4 h-4 opacity-70" />
                                        <span className="uppercase tracking-tighter">{tab.label}</span>
                                    </div>
                                    <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", activeTab === tab.id && "rotate-90 text-brand-600")} />
                                </button>
                            ))}
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2.5 px-4 py-3.5 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="w-4 h-4 opacity-70" />
                                <span className="uppercase tracking-tighter">Sign Out</span>
                            </button>
                        </nav>
                    </aside>

                    {/* ── Right Content ── */}
                    <main className="flex-1 space-y-5">

                        {/* ══ ACCOUNT OVERVIEW ══ */}
                        {activeTab === "overview" && (
                            <div className="space-y-5">
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                                    <h2 className="text-xs font-black text-gray-800 uppercase tracking-widest border-b border-gray-50 pb-3">Personal Information</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <InfoField icon={User} label="Full Name" value={profile.name} />
                                        <InfoField icon={Mail} label="Email Address" value={profile.email} />
                                        <InfoField icon={Phone} label="Phone Number" value={profile.phone || "Not set"} />
                                        <InfoField icon={Shield} label="Account Role" value={profile.role?.replace("_", " ")} />
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                                    <h2 className="text-xs font-black text-gray-800 uppercase tracking-widest border-b border-gray-50 pb-3">Active Services</h2>
                                    {profile.services.length === 0 ? (
                                        <p className="text-sm text-gray-400 font-medium italic">No active services. <Link to="/services" className="text-brand-600 hover:underline font-bold">Browse plans →</Link></p>
                                    ) : (
                                        <div className="space-y-3">
                                            {profile.services.map((svc, i) => (
                                                <div key={i} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center">
                                                            <Wifi className="w-4 h-4 text-brand-600" />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-black text-gray-800 uppercase tracking-tight">{svc.name}</div>
                                                            <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                                                                Since {new Date(svc.since).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Next Billing</div>
                                                        <div className="text-xs font-black text-brand-600">{getNextBillingDate(svc.since)}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ══ SUPPORT ══ */}
                        {activeTab === "support" && (
                            <div className="space-y-5">
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                                    <h2 className="text-xs font-black text-gray-800 uppercase tracking-widest border-b border-gray-50 pb-3">Get Help</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <SupportCard
                                            icon={MessageCircle}
                                            title="Live AI Chat"
                                            desc="Instant answers about your plans, billing, and services from our AI assistant."
                                            action="Open Chat"
                                            onClick={() => {
                                                const btn = document.querySelector('[aria-label="Open chat"]') as HTMLButtonElement;
                                                if (btn) btn.click();
                                            }}
                                            color="brand"
                                        />
                                        <SupportCard
                                            icon={Mail}
                                            title="Contact Us"
                                            desc="Send a message to our support team. We respond within 24 hours."
                                            action="Send Message"
                                            href="/contact"
                                            color="blue"
                                        />
                                        <SupportCard
                                            icon={CreditCard}
                                            title="View Plans"
                                            desc="Browse and upgrade your current service plans."
                                            action="See Services"
                                            href="/services"
                                            color="purple"
                                        />
                                        <SupportCard
                                            icon={Phone}
                                            title="Call Support"
                                            desc="Reach our team directly at +968 800 00000, available 8am–8pm."
                                            action="+968 800 00000"
                                            color="emerald"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ══ ABOUT ACCOUNT ══ */}
                        {activeTab === "about" && (
                            <div className="space-y-5">
                                {/* Subscriptions summary */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                                    <h2 className="text-xs font-black text-gray-800 uppercase tracking-widest border-b border-gray-50 pb-3">Your Subscriptions</h2>
                                    {profile.services.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic">No active subscriptions.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {profile.services.map((svc, i) => (
                                                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                                    <div className="text-xs font-bold text-gray-700 uppercase tracking-tight">{svc.name}</div>
                                                    <div className="text-[10px] font-black text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                                                        Renews {getNextBillingDate(svc.since)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Deletion request */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                                    <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
                                        <AlertTriangle className="w-4 h-4 text-red-500" />
                                        <h2 className="text-xs font-black text-gray-800 uppercase tracking-widest">Delete Account</h2>
                                    </div>

                                    {/* Show status if a request exists */}
                                    {deletionStatus.status === "Pending" && (
                                        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100">
                                            <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                            <div>
                                                <div className="text-xs font-black text-amber-700 uppercase tracking-widest">Request Under Review</div>
                                                <p className="text-[11px] text-amber-600 mt-1">Your deletion request has been submitted and is pending admin review. You will be notified once a decision is made.</p>
                                                <div className="text-[10px] text-amber-500 mt-1.5 font-medium">Reason: {deletionStatus.reason}{deletionStatus.custom_reason ? ` — ${deletionStatus.custom_reason}` : ""}</div>
                                            </div>
                                        </div>
                                    )}

                                    {deletionStatus.status === "Approved" && (
                                        <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                            <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                            <div>
                                                <div className="text-xs font-black text-emerald-700 uppercase tracking-widest">Deletion Approved</div>
                                                <p className="text-[11px] text-emerald-600 mt-1">Your account deletion has been approved. Your account will be removed shortly.</p>
                                            </div>
                                        </div>
                                    )}

                                    {deletionStatus.status === "Rejected" && (
                                        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                                            <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                            <div>
                                                <div className="text-xs font-black text-red-600 uppercase tracking-widest">Deletion Request Rejected</div>
                                                <p className="text-[11px] text-red-500 mt-1">Your account deletion request was not approved.</p>
                                                {deletionStatus.admin_note && (
                                                    <div className="mt-2 p-2.5 bg-white rounded-lg border border-red-100">
                                                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Message from YahyaTel Support</div>
                                                        <p className="text-xs text-gray-700">{deletionStatus.admin_note}</p>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => setDeletionStatus({})}
                                                    className="text-[10px] text-brand-600 font-bold mt-2 hover:underline"
                                                >
                                                    Submit a new request →
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Deletion form — show only when no active request exists */}
                                    {!deletionStatus.status && (
                                            <div className="space-y-4">
                                                <p className="text-[11px] text-gray-500 leading-relaxed">
                                                    Deleting your account is permanent and requires admin approval. Please select a reason below. Your request will be reviewed within 1-3 business days.
                                                </p>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Reason for Leaving</label>
                                                    <div className="space-y-2">
                                                        {DELETION_REASONS.map((reason) => (
                                                            <label key={reason} className={cn(
                                                                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                                                                selectedReason === reason
                                                                    ? "bg-red-50 border-red-200 text-red-700"
                                                                    : "bg-gray-50 border-gray-100 text-gray-700 hover:border-gray-200 hover:bg-white"
                                                            )}>
                                                                <input
                                                                    type="radio"
                                                                    name="deletion-reason"
                                                                    value={reason}
                                                                    checked={selectedReason === reason}
                                                                    onChange={() => setSelectedReason(reason)}
                                                                    className="accent-red-500"
                                                                />
                                                                <span className="text-xs font-bold">{reason}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>

                                                {selectedReason === "Other" && (
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                            Additional Details <span className="normal-case font-medium text-gray-400">(optional)</span>
                                                        </label>
                                                        <textarea
                                                            value={customReason}
                                                            onChange={e => setCustomReason(e.target.value)}
                                                            rows={3}
                                                            placeholder="Tell us more (optional)..."
                                                            className="w-full text-xs rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 resize-none"
                                                        />
                                                    </div>
                                                )}

                                                {deletionError && (
                                                    <p className="text-xs text-red-500 font-bold">{deletionError}</p>
                                                )}

                                                <button
                                                    onClick={handleDeletionSubmit}
                                                    disabled={submittingDeletion || !selectedReason}
                                                    className={cn(
                                                        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                                        submittingDeletion || !selectedReason
                                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                            : "bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-600/20"
                                                    )}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                    {submittingDeletion ? "Submitting..." : "Submit Deletion Request"}
                                                </button>
                                            </div>
                                    )}
                                </div>

                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

// ── Sub-components ──

function InfoField({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-brand-600" />
            </div>
            <div>
                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</div>
                <div className="text-xs font-bold text-gray-800 mt-0.5 capitalize">{value}</div>
            </div>
        </div>
    );
}

function SupportCard({
    icon: Icon, title, desc, action, href, onClick, color
}: {
    icon: typeof MessageCircle;
    title: string;
    desc: string;
    action: string;
    href?: string;
    onClick?: () => void;
    color: "brand" | "blue" | "purple" | "emerald";
}) {
    const colorMap = {
        brand: { bg: "bg-brand-50", border: "border-brand-100", icon: "text-brand-600", btn: "bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/20" },
        blue: { bg: "bg-blue-50", border: "border-blue-100", icon: "text-blue-600", btn: "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20" },
        purple: { bg: "bg-purple-50", border: "border-purple-100", icon: "text-purple-600", btn: "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20" },
        emerald: { bg: "bg-emerald-50", border: "border-emerald-100", icon: "text-emerald-600", btn: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20" },
    };
    const c = colorMap[color];

    const inner = (
        <div className={cn("p-4 rounded-xl border h-full flex flex-col justify-between gap-3 hover:shadow-md transition-all", c.bg, c.border)}>
            <div className="space-y-1.5">
                <div className={cn("w-8 h-8 rounded-lg bg-white border flex items-center justify-center", c.border)}>
                    <Icon className={cn("w-4 h-4", c.icon)} />
                </div>
                <div className="text-xs font-black text-gray-800 uppercase tracking-tight">{title}</div>
                <p className="text-[10px] text-gray-500 font-medium leading-relaxed">{desc}</p>
            </div>
            <span className={cn("inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md", c.btn)}>
                <Send className="w-3 h-3" />
                {action}
            </span>
        </div>
    );

    if (href) return <Link to={href}>{inner}</Link>;
    if (onClick) return <button onClick={onClick} className="text-left w-full">{inner}</button>;
    return <div>{inner}</div>;
}

export default Profile;
