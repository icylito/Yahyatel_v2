import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import {
    Wifi,
    Phone,
    Building,
    Tv,
    Shield,
    Cloud,
    CheckCircle2,
    ShoppingCart,
    ChevronRight,
    Star,
    Zap,
    Rocket,
    Globe,
    ShieldCheck,
    Server
} from "lucide-react";
import { Button } from "../components/ui/BuyButton";
import { Card } from "../components/ui/TelecomPlanCard";
import { cn } from "../lib/utils";
import { useCart } from "../context/CartContext";

const Services = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
    const { addToCart } = useCart();
    const [addedId, setAddedId] = useState<string | null>(null);

    const handleAddToCart = (plan: { name: string; price: string; speed: string; }, categoryName: string) => {
        const priceNum = parseFloat(plan.price.replace(/[^0-9.]/g, ""));
        const cartItemId = `${categoryName}-${plan.name}`;
        addToCart({
            id: cartItemId,
            name: `${categoryName} – ${plan.name}`,
            price: priceNum,
            type: categoryName,
            speed: plan.speed,
        });
        setAddedId(`${categoryName}-${plan.name}`);
        setTimeout(() => setAddedId(null), 1500);
    };

    useEffect(() => {
        const highlightId = searchParams.get("highlight");
        if (highlightId && sectionRefs.current[highlightId]) {
            setTimeout(() => {
                sectionRefs.current[highlightId]?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }, 500);
        }
    }, [searchParams]);

    const role = sessionStorage.getItem("role");

    const categories = [
        { id: "home-internet", name: "Home Internet", icon: Wifi, desc: "High speed fiber optic internet" },
        { id: "mobile-services", name: "Mobile Plans", icon: Phone, desc: "Nationwide coverage for mobile" },
        { id: "business-solutions", name: "Business Solutions", icon: Building, desc: "Enterprise-grade connectivity" },
        { id: "tv-entertainment", name: "TV & Entertainment", icon: Tv, desc: "Digital content and entertainment" },
        { id: "cyber-security", name: "Cyber Security", icon: Shield, desc: "Protection for your digital life" },
        { id: "cloud-services", name: "Cloud Services", icon: Cloud, desc: "Scalable storage and computing" },
    ];

    if (role === "customer_agent" || role === "admin") {
        categories.push({ id: "deep-insights", name: "Deep Insights", icon: Zap, desc: "Advanced AI Customer Analytics" });
    }

    interface ServicePlan {
        name: string;
        price: string;
        speed: string;
        features: string[];
        desc: string;
        icon: React.ElementType;
        popular?: boolean;
    }

    const servicesData: Record<string, ServicePlan[]> = {
        "home-internet": [
            { name: "Basic", price: "OMR 15/mo", speed: "50 Mbps", features: ["100 GB Data", "Basic Support"], desc: "Perfect for light browsing", icon: Zap },
            { name: "Advanced", price: "OMR 25/mo", speed: "100 Mbps", features: ["Unlimited Data", "Priority Support", "Free Router"], desc: "Ideal for streaming and gaming", popular: true, icon: Rocket },
            { name: "Premium", price: "OMR 40/mo", speed: "200 Mbps", features: ["Unlimited Data", "24/7 Premium Support", "Free Installation"], desc: "For power users", icon: Star },
            { name: "Ultra", price: "OMR 60/mo", speed: "500 Mbps", features: ["Unlimited Data", "Dedicated Support", "Premium Fiber Hub"], desc: "Ultimate speed", icon: Globe }
        ],
        "mobile-services": [
            { name: "Basic", price: "OMR 5/mo", speed: "5 GB", features: ["100 Minutes", "Unlimited SMS"], desc: "Essential connectivity", icon: Phone },
            { name: "Advanced", price: "OMR 8/mo", speed: "20 GB", features: ["Unlimited Minutes", "Unlimited SMS", "5G Access"], desc: "Great for everyday use", popular: true, icon: Zap },
            { name: "Premium", price: "OMR 15/mo", speed: "50 GB", features: ["Unlimited calls", "Premium 5G", "Roaming included"], desc: "For heavy data users", icon: Rocket },
            { name: "Ultra", price: "OMR 25/mo", speed: "100 GB", features: ["Unlimited everything", "International roaming", "Streaming benefits"], desc: "Ultimate mobile experience", icon: Star }
        ],
        "business-solutions": [
            { name: "Starter", price: "OMR 50/mo", speed: "100 Mbps", features: ["5 IP Addresses", "99.5% Uptime"], desc: "For small businesses", icon: Building },
            { name: "Professional", price: "OMR 100/mo", speed: "500 Mbps", features: ["10 IP Addresses", "Priority Support", "99.9% Uptime"], desc: "For growing businesses", popular: true, icon: Rocket },
            { name: "Enterprise", price: "OMR 200/mo", speed: "1 Gbps", features: ["20 IP Addresses", "SLA Guarantee", "24/7 Dedicated Support"], desc: "Enterprise-grade reliability", icon: Shield }
        ],
        "tv-entertainment": [
            { name: "Basic", price: "OMR 10/mo", speed: "50 Channels", features: ["HD Quality", "Basic On-Demand"], desc: "Essential entertainment", icon: Tv },
            { name: "Advanced", price: "OMR 20/mo", speed: "100 Channels", features: ["Sports Package", "Extended On-Demand"], desc: "Family entertainment", popular: true, icon: Rocket },
            { name: "Premium", price: "OMR 25/mo", speed: "200+ Channels", features: ["4K Quality", "Multi-screen", "Sports & Movies"], desc: "Ultimate experience", icon: Star }
        ],
        "cyber-security": [
            { name: "Basic", price: "OMR 10/mo", speed: "Antivirus", features: ["Firewall", "Basic Monitoring"], desc: "Essential security", icon: Shield },
            { name: "Professional", price: "OMR 50/mo", speed: "VPN Plus", features: ["24/7 Monitoring", "Threat Detection"], desc: "Comprehensive protection", popular: true, icon: Rocket },
            { name: "Enterprise", price: "OMR 100/mo", speed: "Full Suite", features: ["Advanced VPN", "Incident Response", "Dedicated Support"], desc: "Maximum coverage", icon: ShieldCheck }
        ],
        "cloud-services": [
            { name: "Starter", price: "OMR 25/mo", speed: "100 GB", features: ["100 GB Storage", "Basic Compute", "Email Support"], desc: "For personal use", icon: Cloud },
            { name: "Professional", price: "OMR 75/mo", speed: "1 TB", features: ["1 TB Storage", "Advanced Compute", "Backup Services", "Priority Support"], desc: "For pros", popular: true, icon: Rocket },
            { name: "Enterprise", price: "OMR 150/mo", speed: "5 TB+", features: ["5 TB Storage", "Dedicated Compute", "SLA Guarantee", "24/7 Support"], desc: "Enterprise cloud", icon: Server }
        ],
        "deep-insights": [
            { name: "Quarterly View", price: "OMR 100", speed: "3 Months", features: ["Churn Predictive Engine", "Retention Logic", "Agent Access"], desc: "Deep intelligent forecasting for 3 months", icon: Zap },
            { name: "Bi-Annual Elite", price: "OMR 200", speed: "6 Months", features: ["Advanced KPIs", "Behavior Modeling", "Agent Access"], desc: "Extended intelligence over 6 months", popular: true, icon: Star },
            { name: "Yearly Mastery", price: "OMR 350", speed: "12 Months", features: ["Full Analytics Suite", "Dedicated Setup", "Agent Access"], desc: "Ultimate yearly deep analysis", icon: Globe }
        ]
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50 pb-20">
            {/* Header Banner */}
            <section className="hero-gradient py-20 lg:py-32 relative overflow-hidden text-center text-white">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-6">
                    <div className="animate-[fade-up_0.6s_ease-out_both]">
                        <h1 className="text-4xl lg:text-7xl font-black tracking-tight leading-tight uppercase">
                            Our Services
                        </h1>
                        <p className="text-brand-100/70 text-lg lg:text-xl font-medium max-w-2xl mx-auto">Providing world class connectivity solutions across the Sultanate of Oman.</p>
                    </div>
                </div>
            </section>

            {/* Scrolling Sections */}
            <div className="max-w-7xl mx-auto px-4 py-20 space-y-32">
                {categories.map((category) => (
                    <section
                        key={category.id}
                        id={category.id}
                        ref={(el) => { sectionRefs.current[category.id] = el; }}
                        className={cn(
                            "scroll-mt-24 space-y-12 transition duration-500 p-6 rounded-3xl",
                            searchParams.get("highlight") === category.id ? "ring-4 ring-brand-500 bg-brand-50/40 shadow-xl" : ""
                        )}
                    >
                        {/* Section Header */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-gray-800 text-[10px] font-black uppercase tracking-widest border border-brand-100">
                                    <category.icon className="w-3.5 h-3.5" />
                                    {category.name}
                                </div>
                                <h2 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-none uppercase">{category.name}</h2>
                                <p className="text-gray-500 font-medium text-lg leading-relaxed max-w-2xl">{category.desc}</p>
                            </div>
                            <div className="hidden lg:block">
                                <category.icon className="w-20 h-20 text-gray-100" />
                            </div>
                        </div>

                        {/* Plans Grid for this Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {servicesData[category.id].map((plan) => (
                                <div key={plan.name} className="will-change-transform">
                                    <Card
                                        className={cn(
                                            "relative h-full flex flex-col border-2 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:-translate-y-2 rounded-2xl overflow-hidden bg-white",
                                            plan.popular ? "border-brand-600 shadow-xl ring-1 ring-brand-600" : "border-transparent shadow-md"
                                        )}
                                    >
                                        {plan.popular && (
                                            <div className="absolute top-0 right-0 bg-brand-600 text-white px-3 py-1 rounded-bl-xl text-[9px] font-black uppercase tracking-widest z-10">
                                                Most Popular
                                            </div>
                                        )}
                                        <div className="p-6 space-y-4 flex flex-col h-full">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-gray-50", plan.popular ? "text-gray-900 bg-brand-50" : "text-gray-700")}>
                                                    <plan.icon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-black text-gray-900 transition-colors uppercase tracking-tight leading-none">{plan.name}</h3>
                                                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{plan.speed} Performance</div>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="text-2xl font-black text-brand-700">{plan.price}</div>
                                                <p className="text-[10px] text-gray-500 font-medium leading-relaxed">{plan.desc}</p>
                                            </div>

                                            <div className="flex-1 space-y-2 pt-4 border-t border-gray-50">
                                                {plan.features.map((f: string) => (
                                                    <div key={f} className="flex items-center gap-2 text-[10px] text-gray-600 font-semibold">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                        {f}
                                                    </div>
                                                ))}
                                            </div>

                                            <Button
                                                size="sm"
                                                onClick={() => handleAddToCart(plan, category.name)}
                                                className={cn(
                                                    "w-full h-11 rounded-lg font-black uppercase tracking-widest text-[10px] transition-all mt-6 shadow-lg",
                                                    addedId === `${category.name}-${plan.name}`
                                                        ? "bg-emerald-600 shadow-emerald-600/20"
                                                        : plan.popular ? "bg-brand-600 shadow-brand-600/20" : "bg-gray-900 shadow-gray-900/10"
                                                )}
                                            >
                                                {addedId === `${category.name}-${plan.name}`
                                                    ? "✓ Added!"
                                                    : <><ShoppingCart className="w-3.5 h-3.5 mr-2" />Add to Cart</>
                                                }
                                            </Button>
                                        </div>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}

                {/* Final CTA Enterprise Section */}
                <div className="pt-10">
                    <Card className="bg-[#0b2744] text-white p-8 lg:p-16 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-10 shadow-2xl relative overflow-hidden border-none text-center md:text-left">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        <div className="space-y-6 relative z-10 max-w-2xl">
                            <div className="inline-flex items-center gap-2 bg-brand-600/30 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-500/30">
                                <Building className="w-3.5 h-3.5" />
                                Enterprise Elite
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-black tracking-tight leading-none uppercase">High Density Business Solutions</h2>
                            <p className="text-brand-100/70 text-lg font-medium leading-relaxed">Dedicated bandwidth, 24/7 technical guardians, and 99.99% uptime for the Sultanate's leading enterprises.</p>
                        </div>
                        <div className="relative z-10 shrink-0">
                            <Button onClick={() => navigate("/contact#send-message")} size="lg" className="bg-black text-white hover:bg-gray-900 h-16 px-12 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl transition-all active:scale-95 group">
                                Request Quote <ChevronRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Services;
