import { Mail, Phone, MapPin, Send, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/BuyButton";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/TelecomPlanCard";
import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { API_BASE_URL } from "../lib/api";

const Contact = () => {
    const { hash } = useLocation();
    const [form, setForm] = useState({ name: "", email: "", subject: "Home Internet", message: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.message) {
            setError("Please fill in all required fields.");
            return;
        }
        setError(null);
        setIsSubmitting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/contact`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error();
            setSubmitted(true);
            setForm({ name: "", email: "", subject: "Home Internet", message: "" });
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (hash) {
            // Remove the '#' to get the id
            const id = hash.replace('#', '');
            const element = document.getElementById(id);
            if (element) {
                // Short timeout to ensure elements are rendered 
                setTimeout(() => {
                    // You can change yOffset to tweak how much it scrolls:
                    // - Negative value (e.g., -100) scrolls slightly above the element
                    // - Positive value scrolls slightly below the top of the element
                    const yOffset = -100;
                    const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
                    window.scrollTo({ top: y, behavior: "smooth" });
                }, 100);
            }
        } else {
            window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        }
    }, [hash]);

    return (
        <div className="flex flex-col min-h-screen pb-20 overflow-hidden bg-gray-50/50">
            {/* Hero Section */}
            <section className="hero-gradient py-20 lg:py-32 relative overflow-hidden text-center text-white">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-6">
                    <h1 className="text-4xl lg:text-7xl font-black tracking-tight leading-tight uppercase">
                        Help Center
                    </h1>
                    <p className="text-brand-100/70 text-lg lg:text-xl font-medium max-w-2xl mx-auto">Our team is here to support you 24/7. Reach out through any of our channels.</p>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 py-20 space-y-16">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contact Info */}
                    <div className="space-y-6">
                        <Card>
                            <CardContent className="p-8 space-y-8">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-brand-50 rounded-xl text-brand-600">
                                        <Phone className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">Call Us</h3>
                                        <p className="text-sm text-gray-600 mt-1">General: 800-77-777</p>
                                        <p className="text-sm text-gray-600">Support: +968 2477 8800</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-brand-50 rounded-xl text-brand-600">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">Email Us</h3>
                                        <p className="text-sm text-gray-600 mt-1">support@yahyatel.com</p>
                                        <p className="text-sm text-gray-600">sales@yahyatel.com</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-brand-50 rounded-xl text-brand-600">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">Visit Us</h3>
                                        <p className="text-sm text-gray-600 mt-1">Headquarters: Muscat, Oman</p>
                                        <p className="text-sm text-gray-600">Business District, Floor 4</p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t">
                                    <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                                        <Clock className="w-4 h-4" />
                                        Average response time: 2 hours
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2" id="send-message">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-2xl">Send us a message</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {submitted ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">Message Sent!</h3>
                                        <p className="text-gray-500 text-sm max-w-xs">Thank you for reaching out. Our team will get back to you within 2 hours.</p>
                                        <Button variant="outline" onClick={() => setSubmitted(false)} className="mt-2">Send Another Message</Button>
                                    </div>
                                ) : (
                                    <form className="space-y-6" onSubmit={handleSubmit}>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">Full Name *</label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={form.name}
                                                    onChange={handleChange}
                                                    placeholder="Ahmed Ali"
                                                    required
                                                    className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">Email Address *</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={form.email}
                                                    onChange={handleChange}
                                                    placeholder="ahmed@example.com"
                                                    required
                                                    className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Service Inquiry</label>
                                            <select name="subject" value={form.subject} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-brand-500 outline-none bg-white transition-all">
                                                <option>Home Internet</option>
                                                <option>Mobile Plans</option>
                                                <option>Business Solutions</option>
                                                <option>Billing Support</option>
                                                <option>Technical Issue</option>
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Message *</label>
                                            <textarea
                                                rows={6}
                                                name="message"
                                                value={form.message}
                                                onChange={handleChange}
                                                placeholder="Tell us how we can help..."
                                                required
                                                className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none"
                                            ></textarea>
                                        </div>

                                        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

                                        <Button type="submit" disabled={isSubmitting} className="w-full py-4 rounded-xl flex items-center justify-center gap-2">
                                            {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send className="w-4 h-4" />Send Message</>}
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
