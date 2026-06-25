import { ShieldAlert, Scale, Handshake, Globe, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/TelecomPlanCard";

const TermsPage = () => {
    const sections = [
        { title: "Service Agreement", icon: Handshake, content: <>By using <span translate="no" className="notranslate">YahyaTel</span> services, you agree to comply with all regional regulations and international telecom standards. This agreement is between the customer and <span translate="no" className="notranslate">YahyaTel</span> LLC, Muscat, Oman.</> },
        { title: "Privacy & Data", icon: ShieldAlert, content: "Your data is protected under the National Data Privacy Law of Oman. We only collect essential information required for service delivery and billing." },
        { title: "Billing & Payments", icon: Scale, content: "All invoices are issued monthly and must be settled within 15 days of issuance. Late payments may result in service restriction or additional administrative fees." },
        { title: "Network Fair Use", icon: Globe, content: <><span translate="no" className="notranslate">YahyaTel</span> provides unlimited data plans for Home Fiber, subject to fair usage policies to ensure network stability for all concurrent users in your residential area.</> },
    ];

    return (
        <div className="flex flex-col min-h-screen pb-20 overflow-hidden bg-gray-50/50">
            {/* Header Banner */}
            <section className="hero-gradient py-20 lg:py-32 relative overflow-hidden text-center text-white">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-4">
                    <h1 className="text-4xl lg:text-7xl font-black tracking-tight leading-tight uppercase flex items-center justify-center gap-4">
                        Policy Center
                    </h1>
                    <p className="text-brand-100/70 text-sm font-medium">Last updated: March 2, 2026. Official <span translate="no" className="notranslate">YahyaTel</span> Service Policy Document.</p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 py-20 space-y-12">
                {/* Disclaimer */}
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-center text-red-600 font-bold uppercase tracking-widest text-xs shadow-sm">
                    Disclaimer: This is a final year project, not an actual company please don't share your personal data here.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10">
                    {sections.map(section => (
                        <Card key={section.title} className="hover:border-brand-200 transition-all shadow-sm">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className="p-3 bg-gray-50 rounded-xl text-brand-600">
                                    <section.icon className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-xl font-bold">{section.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 text-sm leading-relaxed">{section.content}</p>
                                <div className="pt-6 border-t mt-6 flex justify-between items-center text-xs font-bold text-brand-700 cursor-pointer hover:underline uppercase tracking-widest">
                                    <span>Read Full Clause v2.0</span>
                                    <ExternalLink className="w-4 h-4" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Legal Footer Info */}
                <div className="p-10 bg-gray-900 rounded-3xl text-white text-center space-y-6">
                    <h3 className="text-xl font-bold">Have questions about our legal policies?</h3>
                    <p className="text-gray-400 text-sm max-w-2xl mx-auto leading-relaxed">
                        If you have any questions or concerns regarding our terms of service, privacy policy, or legal compliance,
                        please contact our legal department directly at legal@yahyatel.com or visit our headquarters.
                    </p>
                    <div className="pt-4 flex justify-center gap-4">
                        <span className="px-4 py-2 bg-white/10 rounded-full text-xs font-bold uppercase">Privacy Policy</span>
                        <span className="px-4 py-2 bg-white/10 rounded-full text-xs font-bold uppercase">GDPR Compliance</span>
                        <span className="px-4 py-2 bg-white/10 rounded-full text-xs font-bold uppercase">TRA Oman Regulations</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsPage;
