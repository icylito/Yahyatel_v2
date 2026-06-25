import { useState, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { ShoppingCart, Menu, X, LogOut, ChevronDown, LayoutDashboard, UserCircle } from "lucide-react";
import { Button } from "./ui/BuyButton";
import NewBrandLogo from "./NewBrandLogo";
import { cn } from "../lib/utils";
import { useCart } from "../context/CartContext";
import { API_BASE_URL } from "../lib/api";

type Role = "admin" | "customer_agent" | "customer" | null;

const getRole = (): Role => sessionStorage.getItem("role") as Role;
const getUserName = (): string => {
    const full = sessionStorage.getItem("userName") || "User";
    return full.split(" ")[0];
};
const getSubscribedServices = (): string[] => {
    try {
        return JSON.parse(sessionStorage.getItem("subscribedServices") || "[]");
    } catch {
        return [];
    }
};

const ROLE_LABELS: Record<string, string> = {
    admin: "Admin",
    customer_agent: "Agent",
    customer: "Customer",
};

const Navigatorbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const { cartCount } = useCart();

    const role = getRole();
    const isLoggedIn = !!role;
    const userName = getUserName();

    const handleLogout = () => {
        sessionStorage.removeItem("role");
        sessionStorage.removeItem("userName");
        setShowUserMenu(false);
        setIsMenuOpen(false);
        navigate("/login");
    };

    const switchLanguage = async (lang: 'en' | 'ar', force = false) => {
        if (lang === document.documentElement.lang && !force) return;
        setIsTranslating(true);
        try {
            const cacheKey = 'arTranslationsCache';
            const translationCache = JSON.parse(sessionStorage.getItem(cacheKey) || '{}');
            let hasNewCache = false;

            const textNodes: { node: Text, original: string, current: string }[] = [];
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
            let node;

            while ((node = walker.nextNode())) {
                const el = node.parentElement;
                if (!el || el.tagName === 'SCRIPT' || el.tagName === 'STYLE') continue;
                if (el.getAttribute('translate') === 'no' || el.classList.contains('notranslate')) continue;

                const val = node.nodeValue?.trim();
                if (val && val.length > 1 && !/^\d+$/.test(val)) {
                    const childIndex = Array.prototype.indexOf.call(el.childNodes, node);
                    const attrName = `data-orig-text-${childIndex}`;

                    let original = el.getAttribute(attrName);
                    if (!original) {
                        original = node.nodeValue || '';
                        el.setAttribute(attrName, original);
                    }

                    if (lang === 'en') {
                        node.nodeValue = original;
                    } else {
                        const origTrimmed = original.trim();
                        if (translationCache[origTrimmed]) {
                            node.nodeValue = node.nodeValue!.replace(val, translationCache[origTrimmed]);
                        } else if (origTrimmed === val) {
                            textNodes.push({ node: node as Text, original: origTrimmed, current: val });
                        }
                    }
                }
            }

            if (lang === 'en') {
                document.documentElement.lang = 'en';
                document.documentElement.dir = 'ltr';
                return;
            }

            if (textNodes.length === 0) {
                if (hasNewCache) sessionStorage.setItem(cacheKey, JSON.stringify(translationCache));
                document.documentElement.lang = lang;
                document.documentElement.dir = 'rtl';
                return;
            }

            const textsToTranslate = Array.from(new Set(textNodes.map(n => n.original)));
            const CHUNK_SIZE = 50;

            for (let i = 0; i < textsToTranslate.length; i += CHUNK_SIZE) {
                const chunk = textsToTranslate.slice(i, i + CHUNK_SIZE);
                try {
                    const res = await fetch(`${API_BASE_URL}/api/translate`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ texts: chunk, target_lang: lang })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        const translated = data.translated || [];
                        for (let j = 0; j < chunk.length; j++) {
                            if (translated[j] && translated[j] !== chunk[j]) {
                                translationCache[chunk[j]] = translated[j];
                                hasNewCache = true;
                                textNodes.filter(n => n.original === chunk[j]).forEach(tNode => {
                                    tNode.node.nodeValue = tNode.node.nodeValue!.replace(tNode.current, translated[j]);
                                });
                            }
                        }
                    }
                } catch (e) {
                    console.error("Translation chunk failed (possibly rate limited):", e);
                }
            }

            if (hasNewCache) sessionStorage.setItem(cacheKey, JSON.stringify(translationCache));

            document.documentElement.lang = lang;
            document.documentElement.dir = 'rtl';
        } finally {
            setIsTranslating(false);
        }
    };

    // Auto-translate new pages when routing if already in Arabic mode
    useEffect(() => {
        if (document.documentElement.lang === 'ar') {
            // Slight delay ensures React has finished mounting new DOM elements
            const timer = setTimeout(() => switchLanguage('ar', true), 100);
            return () => clearTimeout(timer);
        }
    }, [pathname]);

    // Build nav links — hide AI Analyzer for customers, show Dashboard only for admin
    const navLinks = [
        { name: "Home", href: "/" },
        { name: "About", href: "/about" },
        { name: "Services", href: "/services" },
        ...(role === "admin" || role === "customer_agent" ? [{ name: "AI Analyzer", href: "/ai-analyzer" }] : []),
        { name: "Contact", href: "/contact" },
        ...(role === "admin" ? [{ name: "Dashboard", href: "/admin", icon: LayoutDashboard }] : []),
    ];

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/70 backdrop-blur-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center">
                        <NewBrandLogo size="sm" />
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center bg-gray-50/50 rounded-xl p-1 gap-1 border border-gray-100">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.name}
                                to={link.href}
                                className={({ isActive }) =>
                                    cn(
                                        "px-4 py-1.5 text-xs font-bold transition-all duration-300 rounded-lg",
                                        isActive
                                            ? "bg-brand-600 text-white shadow-md shadow-brand-600/10"
                                            : "text-gray-500 hover:text-brand-600 hover:bg-brand-50"
                                    )
                                }
                            >
                                {link.name}
                            </NavLink>
                        ))}
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-3">
                        <div className="flex items-center gap-2 mr-2">
                            {isTranslating && <span className="text-xs text-brand-600 animate-pulse font-bold">Translating...</span>}
                            <button onClick={() => switchLanguage('en')} disabled={isTranslating} className="hover:scale-110 transition-transform disabled:opacity-50" title="English">
                                <img src="https://flagcdn.com/w40/us.png" alt="English (US)" className="w-6 h-4 rounded-sm shadow-sm object-cover" />
                            </button>
                            <button onClick={() => switchLanguage('ar')} disabled={isTranslating} className="hover:scale-110 transition-transform disabled:opacity-50" title="Arabic (Oman)">
                                <img src="https://flagcdn.com/w40/om.png" alt="Arabic (Oman)" className="w-6 h-4 rounded-sm shadow-sm object-cover" />
                            </button>
                        </div>
                        <Link to="/cart">
                            <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-white hover:border-brand-300 hover:text-brand-600 transition-all relative">
                                <ShoppingCart className="w-4 h-4" />
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] text-white font-bold border-2 border-white shadow-sm">
                                    {cartCount}
                                </span>
                            </div>
                        </Link>
                        <div className="h-6 w-px bg-gray-200 mx-1"></div>

                        {isLoggedIn ? (
                            /* Logged-in user pill */
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50 transition-all group"
                                >
                                    <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                                        {userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="text-left leading-none">
                                        <div className="text-xs font-black text-gray-800">{userName}</div>
                                        <div className="text-[9px] font-bold text-brand-600 uppercase tracking-widest">{ROLE_LABELS[role!] || ""}</div>
                                    </div>
                                    <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", showUserMenu && "rotate-180")} />
                                </button>

                                {/* Dropdown */}
                                {showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden z-50">
                                        <div className="px-4 py-3 border-b border-gray-50">
                                            <div className="text-xs font-black text-gray-800">{userName}</div>
                                            <div className="text-[10px] text-gray-400 font-medium leading-tight mt-0.5">
                                                {getSubscribedServices().length > 0 ? getSubscribedServices().join(", ") : "No Active Services"}
                                            </div>
                                        </div>
                                        <Link
                                            to="/profile"
                                            onClick={() => setShowUserMenu(false)}
                                            className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-gray-700 hover:bg-brand-50 hover:text-brand-600 transition-colors border-b border-gray-50"
                                        >
                                            <UserCircle className="w-3.5 h-3.5" />
                                            My Profile
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                            <LogOut className="w-3.5 h-3.5" />
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Guest buttons */
                            <>
                                <Link to="/login">
                                    <Button variant="outline" size="sm" className="rounded-lg font-bold">
                                        Sign in
                                    </Button>
                                </Link>
                                <Link to="/register">
                                    <Button size="sm" className="rounded-lg font-bold shadow-md shadow-brand-600/10">
                                        Get Started
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <button onClick={() => switchLanguage('en')} disabled={isTranslating} className="hover:scale-110 transition-transform disabled:opacity-50">
                                <img src="https://flagcdn.com/w40/us.png" alt="EN" className="w-6 h-4 rounded-sm shadow-sm" />
                            </button>
                            <button onClick={() => switchLanguage('ar')} disabled={isTranslating} className="hover:scale-110 transition-transform disabled:opacity-50">
                                <img src="https://flagcdn.com/w40/om.png" alt="AR" className="w-6 h-4 rounded-sm shadow-sm" />
                            </button>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)} className="rounded-xl h-10 w-10 p-0">
                            {isMenuOpen ? <X className="w-6 h-6 text-brand-600" /> : <Menu className="w-6 h-6 text-gray-700" />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden border-t bg-white absolute top-full left-0 w-full p-6 space-y-6 shadow-2xl animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.href}
                                className={cn(
                                    "block px-4 py-3 text-lg font-bold rounded-xl transition-all",
                                    pathname === link.href ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50 hover:text-brand-600"
                                )}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                    <div className="pt-6 border-t flex flex-col gap-3">
                        {isLoggedIn ? (
                            <>
                                <div className="flex items-center gap-3 px-4 py-3 bg-brand-50 rounded-2xl">
                                    <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black text-lg shadow-md">
                                        {userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-black text-gray-800">{userName}</div>
                                        <div className="text-xs text-brand-600 font-bold uppercase tracking-widest leading-tight mt-0.5 max-w-[200px] truncate">
                                            {getSubscribedServices().length > 0 ? getSubscribedServices().join(", ") : "No Active Services"}
                                        </div>
                                    </div>
                                </div>
                                <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                                    <Button variant="outline" className="w-full h-14 rounded-2xl text-lg font-bold text-gray-700 border-gray-200 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200">
                                        <UserCircle className="w-5 h-5 mr-2" />
                                        My Profile
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    className="w-full h-14 rounded-2xl text-lg font-bold text-red-500 border-red-200 hover:bg-red-50"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="w-5 h-5 mr-2" />
                                    Sign Out
                                </Button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                                    <Button variant="outline" className="w-full h-14 rounded-2xl text-lg font-bold">Sign in</Button>
                                </Link>
                                <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                                    <Button className="w-full h-14 rounded-2xl text-lg font-bold">Register Now</Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navigatorbar;
