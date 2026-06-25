import {
    Target,
    Globe,
    ShieldCheck,
    Calendar,
    Star,
    Crown
} from "lucide-react";
import { Card } from "../components/ui/TelecomPlanCard";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { useNavigate } from "react-router";

const About = () => {
    const navigate = useNavigate();
    const milestones = [
        { year: '2010', title: 'Company Founded', desc: 'Started operations in Muscat, Oman with a vision to bridge the digital divide.' },
        { year: '2013', title: 'Fiber Network Launch', desc: 'Deployed Oman\'s first wide-scale fiber optic infrastructure for residential areas.' },
        { year: '2016', title: 'Mobile Services', desc: 'Launched nationwide mobile telecommunications with 4G LTE coverage.' },
        { year: '2019', title: '5G Deployment', desc: 'Pioneered the first 5G network in the Sultanate, setting new speed records.' },
        { year: '2022', title: '500K Customers', desc: 'Reached the milestone of 500,000 active and happy customers.' },
        { year: '2024', title: 'Digital Transformation', desc: 'Launched a complete AI digital service platform for all users.' }
    ];

    return (
        <div className="flex flex-col pb-20 overflow-hidden">
            {/* Hero Section */}
            <section className="hero-gradient py-20 lg:py-32 relative overflow-hidden text-center text-white">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-8">
                    <div className="animate-[fade-up_0.7s_ease-out_both]">
                        <h1 className="text-4xl lg:text-7xl font-black tracking-tight leading-tight">
                            Connecting Hearts <br /> Across the Sultanate
                        </h1>
                        <p className="text-brand-100/70 text-lg lg:text-xl font-medium max-w-2xl mx-auto leading-relaxed mt-6">
                            We create trusted, people first telecommunications solutions for home and business. Our goal is to connect communities with a best-in-class network.
                        </p>
                    </div>
                </div>
            </section>

            {/* Our Story & Owner */}
            <section className="max-w-7xl mx-auto px-4 py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                    <div className="space-y-4">
                        <div className="text-brand-600 font-black text-xs uppercase tracking-widest">Our Heritage</div>
                        <h2 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">The Story of <span translate="no" className="notranslate">YahyaTel</span></h2>
                        <p className="text-gray-600 font-medium leading-relaxed">
                            Founded in 2010, <span translate="no" className="notranslate">YahyaTel</span> has grown from a small startup to one of Oman's most trusted telecommunications providers. Our journey began with a simple vision: to bridge the digital divide and bring world class connectivity to every corner of Oman.
                        </p>
                        <p className="text-gray-600 font-medium leading-relaxed">
                            Today, we serve over 500,000 customers across the country, providing reliable internet, mobile, and enterprise solutions that power homes, businesses, and communities.
                        </p>
                        <p className="text-gray-600 font-medium leading-relaxed italic border-l-4 border-brand-600 pl-6 py-2 bg-brand-50/50 rounded-r-xl">
                            "Our commitment to innovation and customer satisfaction has earned us the trust of the Omani people. We continue to invest in cutting-edge technology to ensure we remain at the forefront."
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-4">
                        <div className="space-y-1">
                            <div className="text-3xl font-black text-brand-700">15+</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Years of Excellence</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-3xl font-black text-brand-700">500K+</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Happy Customers</div>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <Card className="p-10 border-none bg-white shadow-2xl relative overflow-hidden group rounded-3xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                        <div className="relative z-10 text-center space-y-6">
                            <div className="relative inline-block">
                                <img
                                    src="https://pub-cdn.sider.ai/u/U07GH2E5WOJ/web-coder/68e942976b803a5b0ffaa244/resource/57fd2529-20a5-44cb-9cd0-ade72934e0e0.jpg"
                                    alt="Yahya Al Bahanata"
                                    className="w-32 h-32 rounded-3xl object-cover mx-auto shadow-xl ring-4 ring-brand-50"
                                />
                                <div className="absolute -bottom-3 -right-3 bg-brand-600 text-white p-2 rounded-xl shadow-lg">
                                    <Crown className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight"><span translate="no" className="notranslate">Yahya Al Bahanata</span></h3>
                                <div className="text-xs font-bold text-brand-600 uppercase tracking-widest">Founder and CEO</div>
                            </div>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed px-4">
                                "The visionary leader shaping the future of telecommunications in Oman through dedication and innovation."
                            </p>
                        </div>
                    </Card>
                    <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-brand-600/10 rounded-full blur-3xl"></div>
                </div>
            </section>

            {/* Our Journey Timeline */}
            <section className="py-20 bg-gray-50 border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-4 text-center mb-16 space-y-4">
                    <div className="text-brand-600 font-black text-xs uppercase tracking-widest">Growth Line</div>
                    <h2 className="text-3xl lg:text-4xl font-black text-gray-900 tracking-tight">Our Journey So Far</h2>
                </div>

                <div className="max-w-5xl mx-auto px-4 relative">
                    {/* Central vertical line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-brand-200 hidden md:block"></div>

                    <div className="space-y-12 relative">
                        {milestones.map((m, i) => (
                            <motion.div
                                key={m.year}
                                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className={cn(
                                    "flex flex-col md:flex-row items-center gap-8",
                                    i % 2 === 0 ? "md:flex-row-reverse" : ""
                                )}
                            >
                                <div className="flex-1 text-center md:text-right w-full">
                                    <div className={cn("inline-block", i % 2 === 0 ? "text-left md:text-right" : "text-left")}>
                                        <div className="text-2xl font-black text-brand-700 mb-2">{m.year}</div>
                                        <h4 className="text-lg font-black text-gray-900 mb-2 uppercase tracking-tight">{m.title}</h4>
                                        <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-sm">{m.desc}</p>
                                    </div>
                                </div>

                                <div className="relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-xl shadow-brand-600/30 ring-4 ring-white">
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                </div>

                                <div className="flex-1 hidden md:block"></div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission, Vision & Promise - Grid of Cards */}
            <section className="max-w-7xl mx-auto px-4 py-24">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { title: "Our Mission", icon: Target, text: "To provide innovative telecommunications solutions that connect people and empower businesses across Oman.", color: "text-blue-600", bg: "bg-blue-50" },
                        { title: "Our Vision", icon: Globe, text: "To be the leading telecommunications provider in Oman, driving digital transformation and connectivity.", color: "text-purple-600", bg: "bg-purple-50" },
                        { title: "Our Values", icon: Star, text: "Integrity, innovation, customer focus, and commitment to excellence guide everything we do.", color: "text-orange-600", bg: "bg-orange-50" },
                        { title: "Our Promise", icon: ShieldCheck, text: "Reliable, secure, and cutting-edge telecommunications services you can trust for years to come.", color: "text-emerald-600", bg: "bg-emerald-50" },
                    ].map((v) => (
                        <Card key={v.title} className="p-8 border-none bg-white shadow-lg hover:shadow-2xl transition-all duration-300 group rounded-3xl h-full">
                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3", v.bg, v.color)}>
                                <v.icon className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tight">{v.title}</h3>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">{v.text}</p>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Bottom Join Section */}
            <section className="max-w-7xl mx-auto px-4 mt-12 mb-20">
                <Card className="hero-gradient p-12 rounded-3xl border-none shadow-2xl relative overflow-hidden text-center text-white">
                    <div className="absolute inset-0 bg-white/5 opacity-50"></div>
                    <div className="relative z-10 space-y-6">
                        <h2 className="text-3xl lg:text-5xl font-black tracking-tight leading-tight">Be part of our next chapter.</h2>
                        <p className="text-brand-100/80 font-medium max-w-2xl mx-auto">We are always looking for better ways to serve you and advance the digital landscape of the Sultanate.</p>
                        <div className="pt-4">
                            <button
                                onClick={() => navigate("/contact#send-message")}
                                className="bg-white text-brand-900 px-10 py-4 rounded-xl font-black shadow-xl hover:bg-brand-50 transition-all active:scale-95 uppercase tracking-widest text-xs">
                                Contact Our Team
                            </button >
                        </div>
                    </div>
                </Card>
            </section>
        </div>
    );
};

export default About;
