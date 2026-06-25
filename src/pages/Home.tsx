import {
    Wifi,
    Phone,
    Shield,
    CheckCircle2,
    ArrowRight,
    Users,
    Globe,
    Clock,
    Star,
    Building,
    Tv,
    Cloud,
    ArrowUpRight
} from "lucide-react";
import { Button } from "../components/ui/BuyButton";
import { Card, CardContent } from "../components/ui/TelecomPlanCard";
import { Link } from "react-router";
import { cn } from "../lib/utils";

const Home = () => {
    const servicesPreview = [
        {
            id: 'home-internet',
            name: 'Home Internet',
            desc: 'Fiber optic plans',
            icon: Wifi,
            suggestedTier: 'Advanced',
            color: "text-blue-600",
            bg: "bg-blue-50"
        },
        {
            id: 'mobile-services',
            name: 'Mobile Plans',
            desc: '5G & 4G services',
            icon: Phone,
            suggestedTier: 'Advanced',
            color: "text-purple-600",
            bg: "bg-purple-50"
        },
        {
            id: 'business-solutions',
            name: 'Business Solutions',
            desc: 'Enterprise-grade',
            icon: Building,
            suggestedTier: 'Enterprise',
            color: "text-brand-600",
            bg: "bg-brand-50"
        },
        {
            id: 'tv-entertainment',
            name: 'TV & Entertainment',
            desc: 'Digital content',
            icon: Tv,
            suggestedTier: 'Premium',
            color: "text-orange-600",
            bg: "bg-orange-50"
        },
        {
            id: 'cyber-security',
            name: 'Cyber Security',
            desc: 'Protection services',
            icon: Shield,
            suggestedTier: 'Professional',
            color: "text-emerald-600",
            bg: "bg-emerald-50"
        },
        {
            id: 'cloud-services',
            name: 'Cloud Services',
            desc: 'Scalable solutions',
            icon: Cloud,
            suggestedTier: 'Professional',
            color: "text-indigo-600",
            bg: "bg-indigo-50"
        }
    ];

    return (
        <div className="flex flex-col">
            {/* Hero Section */}
            <section className="relative h-[450px] lg:h-[550px] flex items-center overflow-hidden hero-gradient text-white">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="max-w-7xl mx-auto px-4 w-full relative z-10">
                    <div className="max-w-2xl space-y-6">
                        <div className="space-y-4 animate-[fade-up_0.6s_ease-out_both]">
                            <h1 className="text-4xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                                Future Proof <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-white">
                                    Connectivity
                                </span>
                            </h1>
                            <p className="text-base lg:text-lg text-brand-100/80 leading-relaxed font-medium">
                                Experience ultra fast fiber internet and nationwide 5G mobile networks designed for the Sultanate's digital future.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <Link to="/services">
                                    <Button size="lg" className="bg-white text-brand-900 hover:bg-brand-50 h-12 px-8 rounded-lg font-black shadow-xl">
                                        Explore Services
                                    </Button>
                                </Link>
                                <Link to="/contact">
                                    <Button size="lg" variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 text-white h-12 px-8 rounded-lg font-black backdrop-blur-sm">
                                        Reach Out
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-brand-600/20 to-transparent"></div>
            </section>

            {/* Stats section */}
            <div className="max-w-7xl mx-auto px-4 -mt-10 lg:-mt-12 relative z-20 w-full">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Happy Customers", value: "500K+", icon: Users },
                        { label: "Network Coverage", value: "98%", icon: Globe },
                        { label: "Support Avail.", value: "24/7", icon: Clock },
                        { label: "Experience", value: "15+ Yrs", icon: Star },
                    ].map((stat) => (
                        <Card key={stat.label} className="border-none shadow-xl bg-white backdrop-blur-xl transition-transform hover:-translate-y-1">
                            <CardContent className="p-4 lg:p-6 flex items-center gap-3 lg:gap-4">
                                <div className="p-2 lg:p-3 bg-brand-50 rounded-xl text-brand-600 shrink-0">
                                    <stat.icon className="w-5 h-5 lg:w-6 lg:h-6" />
                                </div>
                                <div>
                                    <div className="text-xl lg:text-2xl font-black text-gray-900 leading-none">{stat.value}</div>
                                    <div className="text-[10px] lg:text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Global Services Preview - Updated to include all from zip */}
            <section className="py-16 lg:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col lg:flex-row justify-between items-end gap-6 mb-12 lg:mb-16">
                        <div className="space-y-4 max-w-2xl text-center lg:text-left">
                            <div className="text-brand-600 text-xs font-black uppercase tracking-widest">Our Ecosystem</div>
                            <h2 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                                Comprehensive Telecommunications <br /> for Every Need
                            </h2>
                        </div>
                        <Link to="/services">
                            <Button variant="ghost" className="hidden lg:flex items-center gap-2 text-brand-600 font-black hover:bg-brand-50 rounded-lg">
                                View Detailed Plans <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {servicesPreview.map((service) => (
                            <Link
                                key={service.id}
                                to={`/services?highlight=${service.id}&suggested=${service.suggestedTier}`}
                            >
                                <div className="group relative bg-gray-50/50 hover:bg-white border border-transparent hover:border-brand-100 p-8 rounded-2xl transition-all duration-300 hover:shadow-2xl cursor-pointer">
                                    <div className={cn("inline-flex p-4 rounded-xl mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3", service.bg, service.color)}>
                                        <service.icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 mb-3 group-hover:text-brand-600 transition-colors">{service.name}</h3>
                                    <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">{service.desc}</p>

                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-100 rounded-full text-[9px] font-black text-gray-400 group-hover:text-brand-600 transition-colors uppercase tracking-widest">
                                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                            Suggested: {service.suggestedTier}
                                        </div>
                                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-brand-600 group-hover:border-brand-200 transition-all">
                                            <ArrowUpRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                    <div className="mt-12 text-center lg:hidden">
                        <Link to="/services">
                            <Button className="w-full h-12 rounded-xl font-black">View All Plans</Button>
                        </Link>
                    </div>
                </div>
            </section>
            {/* Why Choose YahyaTel? */}
            <section className="py-16 lg:py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-center gap-16 lg:gap-24">
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <h2 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                                    Why Choose <span translate="no" className="notranslate">YahyaTel</span>?
                                </h2>
                                <p className="text-gray-600 font-medium leading-relaxed">
                                    We combine cutting edge technology with deep local expertise to provide the best telecommunications experience in Oman.
                                </p>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { title: "Ultra Fast Speed", desc: "Experience the fastest fiber and 5G connections available nationwide." },
                                    { title: "Enterprise Grade", desc: "Dedicated solutions for businesses that demand zero downtime." },
                                    { title: "Premium Support", desc: "Our Omani experts are available 24/7 to solve your technical needs." },
                                ].map((item) => (
                                    <div key={item.title} className="flex gap-4 p-4 rounded-xl bg-white shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-brand-100 group">
                                        <div className="mt-1">
                                            <CheckCircle2 className="w-5 h-5 text-brand-600" />
                                        </div>
                                        <div>
                                            <div className="font-black text-gray-900 uppercase tracking-tight text-sm group-hover:text-brand-600 transition-colors">{item.title}</div>
                                            <p className="text-xs text-gray-500 font-medium leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl relative z-10">
                                <img
                                    src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=2070"
                                    alt="Global Network"
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-brand-900/20"></div>
                            </div>
                            <div className="absolute -top-6 -right-6 w-32 h-32 bg-brand-600 rounded-2xl -z-0 blur-2xl opacity-20"></div>
                            <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-brand-400 rounded-full -z-0 blur-3xl opacity-20"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Middle Banner CTA */}
            <section className="relative overflow-hidden hero-gradient py-12 lg:py-16">
                <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="text-center lg:text-left space-y-2">
                        <h2 className="text-2xl lg:text-3xl font-black text-white">Ready to transform your connectivity?</h2>
                        <p className="text-brand-100 font-medium">Join over 500,000 happy users in Oman today.</p>
                    </div>
                    <Link to="/register">
                        <Button size="lg" className="bg-white text-brand-900 hover:bg-brand-50 h-14 px-10 rounded-xl font-black shadow-2xl transition-transform active:scale-95">
                            Get Started Now
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-16 lg:py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 text-center space-y-12 lg:space-y-16">
                    <div className="space-y-4">
                        <h2 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">Trusted across the Sultanate</h2>
                        <p className="text-gray-500 font-medium max-w-2xl mx-auto">Hear what our customers have to say about their experience with <span translate="no" className="notranslate">YahyaTel</span>.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { name: "Ahmed Al Balushi", role: "Customer", quote: "The dedicated fiber line has completely transformed how my office operates. Zero downtime and amazing speed." },
                            { name: "Sara Majali", role: "Remote Professional", quote: "Fastest 5G I've used in Muscat. The setup was instant and the customer support is always there when I need them." },
                            { name: "Khalid Said", role: "Gamer", quote: <>Low latency and consistent speeds. <span translate="no" className="notranslate">YahyaTel</span> is the only choice for anyone serious about gaming in Oman.</> },
                        ].map((t) => (
                            <Card key={t.name} className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-8 space-y-6">
                                    <div className="flex justify-center gap-1 text-yellow-400">
                                        {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                                    </div>
                                    <p className="text-gray-600 font-medium italic leading-relaxed">"{t.quote}"</p>
                                    <div className="pt-4 border-t border-gray-50">
                                        <div className="font-black text-gray-900 uppercase tracking-tight text-sm">{t.name}</div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{t.role}</div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
