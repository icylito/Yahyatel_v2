import { useEffect } from "react";
import { Link, useLocation } from "react-router";
import { CheckCircle2, Sparkles, ArrowRight, Home } from "lucide-react";
import { Button } from "../components/ui/BuyButton";

interface PurchasedItem {
    name: string;
    price: number;
    quantity: number;
}

const ThankYou = () => {
    const { state } = useLocation();
    const items: PurchasedItem[] = (state as { items?: PurchasedItem[] })?.items ?? [];
    const total: number = (state as { total?: number })?.total ?? 0;

    // Scroll to top on load
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50">
            {/* Hero Banner */}
            <section className="hero-gradient py-20 lg:py-32 relative overflow-hidden text-center text-white">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                <div className="max-w-3xl mx-auto px-4 relative z-10 space-y-6">
                    <div className="w-24 h-24 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center mx-auto animate-[scale-in_0.4s_ease-out]">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                    </div>

                    <div className="space-y-3 animate-[fade-up_0.5s_ease-out_0.2s_both]">
                        <h1 className="text-4xl lg:text-6xl font-black tracking-tight leading-tight uppercase">
                            Thank You!
                        </h1>
                        <p className="text-brand-100/80 text-lg font-medium max-w-xl mx-auto leading-relaxed">
                            Your order has been confirmed. Enjoy your plan here at <span translate="no" className="notranslate">YahyaTel</span> Oman's premier connectivity provider.
                        </p>
                    </div>
                </div>
            </section>

            {/* Order Summary */}
            <div className="max-w-2xl mx-auto px-4 py-16 w-full space-y-8">

                {/* Purchased plans */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-[fade-up_0.5s_ease-out_0.3s_both]">
                    <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                        <Sparkles className="w-5 h-5 text-brand-600" />
                        <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Your Purchased Plans</h2>
                    </div>

                    {items.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                            {items.map((item, i) => (
                                <div key={i} className="px-6 py-5 flex justify-between items-center">
                                    <div>
                                        <p className="font-black text-gray-900 text-base">{item.name}</p>
                                        <p className="text-xs text-gray-400 font-medium mt-0.5 uppercase tracking-wide">
                                            Qty: {item.quantity} × OMR {item.price.toFixed(2)} / mo
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-brand-700 text-lg">OMR {(item.price * item.quantity).toFixed(2)}</p>
                                        <p className="text-[10px] text-gray-400">/ month</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-400 font-medium">
                            No plan details available.
                        </div>
                    )}

                    {/* Total */}
                    {total > 0 && (
                        <div className="p-6 bg-brand-50 flex justify-between items-center border-t border-brand-100">
                            <span className="text-sm font-black text-gray-700 uppercase tracking-widest">Total Monthly</span>
                            <span className="text-2xl font-black text-brand-700">OMR {total.toFixed(2)}</span>
                        </div>
                    )}
                </div>

                {/* Message card */}
                <div className="bg-[#0b2744] rounded-3xl p-8 text-white text-center space-y-3 animate-[fade-up_0.5s_ease-out_0.45s_both]">
                    <div className="text-2xl">🎉</div>
                    <h3 className="text-xl font-black tracking-tight">Welcome to the <span translate="no" className="notranslate">YahyaTel</span> Family!</h3>
                    <p className="text-brand-100/70 text-sm leading-relaxed max-w-md mx-auto">
                        Your service will be activated shortly. Our team will reach out to you within 24 hours to confirm setup details.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 animate-[fade-up_0.5s_ease-out_0.55s_both]">
                    <Link to="/" className="flex-1">
                        <Button variant="outline" className="w-full h-12 rounded-2xl font-black border-gray-200 gap-2">
                            <Home className="w-4 h-4" />
                            Go to Home
                        </Button>
                    </Link>
                    <Link to="/services" className="flex-1">
                        <Button className="w-full h-12 rounded-2xl font-black gap-2">
                            Browse More Services
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ThankYou;
