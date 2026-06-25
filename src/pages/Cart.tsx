import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/BuyButton";
import { ShoppingCart, Trash2, Minus, Plus, CreditCard, ChevronRight, ShieldCheck, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/TelecomPlanCard";
import { useCart } from "../context/CartContext";
import { API_BASE_URL } from "../lib/api";

const CartPage = () => {
    const { cartItems, removeFromCart, updateQuantity, clearCart, totalAmount } = useCart();
    const navigate = useNavigate();

    const handleCheckout = async () => {
        const userId = sessionStorage.getItem("userId");
        const snapshot = cartItems.map(item => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
        }));

        // Save subscriptions to DB if user is logged in
        if (userId) {
            const services = cartItems.map(item => ({
                name: item.name,
                since: new Date().toISOString(),
            }));
            try {
                await fetch(`${API_BASE_URL}/api/users/${userId}/subscribe`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ services }),
                });
            } catch (err) {
                console.error("Could not save subscriptions:", err);
            }
        }

        clearCart();
        navigate("/thank-you", { state: { items: snapshot, total: total } });
    };

    const subtotal = totalAmount;
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    if (cartItems.length === 0) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 space-y-6">
                <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center text-brand-300">
                    <ShoppingCart className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Your cart is empty</h2>
                <p className="text-gray-500 max-w-sm text-center">It looks like you haven't added any services yet. Start exploring our premium plans today.</p>
                <Link to="/services">
                    <Button size="lg" className="rounded-full px-10">Browse Services</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen pb-20 overflow-hidden bg-gray-50/50">
            {/* Header Banner */}
            <section className="hero-gradient py-20 lg:py-32 relative overflow-hidden text-center text-white">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-4">
                    <h1 className="text-4xl lg:text-7xl font-black tracking-tight leading-tight uppercase flex items-center justify-center gap-4">
                        Checkout
                    </h1>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 py-16 space-y-10">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-6">
                        {cartItems.map((item) => (
                            <Card key={item.cartId} className="overflow-hidden border-gray-100 hover:border-brand-200 transition-colors shadow-sm bg-white">
                                <CardContent className="p-0">
                                    <div className="p-5 flex items-center gap-4">
                                        {/* Accent bar */}
                                        <div className="w-1 self-stretch bg-brand-600 rounded-full shrink-0" />

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-black text-brand-800 truncate">{item.name}</h3>
                                            <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">{item.type} • {item.speed}</p>
                                            <div className="text-sm font-bold text-gray-500 mt-1">
                                                OMR {item.price.toFixed(2)} <span className="font-medium text-gray-400">/ mo each</span>
                                            </div>
                                        </div>

                                        {/* Qty stepper */}
                                        <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-1 py-1 shrink-0">
                                            <button
                                                onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                                                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-white hover:text-brand-600 hover:shadow-sm transition-all"
                                            >
                                                <Minus className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="w-6 text-center text-sm font-black text-gray-900">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                                                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-white hover:text-brand-600 hover:shadow-sm transition-all"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {/* Total price */}
                                        <div className="text-right shrink-0 min-w-[80px]">
                                            <div className="text-xl font-black text-gray-900">OMR {(item.price * item.quantity).toFixed(2)}</div>
                                            <p className="text-[10px] text-gray-400">/ mo total</p>
                                        </div>

                                        {/* Remove - far right */}
                                        <button
                                            onClick={() => removeFromCart(item.cartId)}
                                            className="ml-1 w-9 h-9 rounded-xl flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all shrink-0 border border-gray-100 hover:border-red-100"
                                            title="Remove item"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        <div className="p-6 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center space-y-4 text-center">
                            <Plus className="w-8 h-8 text-gray-300" />
                            <p className="text-sm text-gray-400 font-medium">Add another plan or device to your cart</p>
                            <Link to="/services">
                                <Button variant="outline" size="sm" className="rounded-full border-gray-200 text-gray-600 px-8">Continue Shopping</Button>
                            </Link>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="space-y-6">
                        <Card className="shadow-lg border-2 border-brand-100">
                            <CardHeader className="border-b pb-4">
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-brand-600" />
                                    Order Checkout
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Subtotal</span>
                                        <span className="font-bold">OMR {subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>VAT (5%)</span>
                                        <span className="font-bold">OMR {tax.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t pt-3 flex justify-between text-xl font-black text-gray-900">
                                        <span>Total Value</span>
                                        <span className="text-brand-700">OMR {total.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4">
                                    <Button onClick={handleCheckout} className="w-full py-6 rounded-2xl text-lg font-bold shadow-xl shadow-brand-600/20 active:scale-95 transition-transform flex items-center justify-center gap-2">
                                        Checkout Now <ChevronRight className="w-5 h-5" />
                                    </Button>
                                    <p className="text-[10px] text-center text-gray-400 leading-relaxed px-4">
                                        By clicking checkout you agree to our service terms and conditions. Secure 256-bit SSL connection.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-brand-50 border-none">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-start gap-3">
                                    <ShieldCheck className="w-5 h-5 text-emerald-600 mt-1" />
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">Safe & Secure</h4>
                                        <p className="text-xs text-gray-500">Verified by <span translate="no" className="notranslate">YahyaTel</span> Security Systems for every transaction.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Zap className="w-5 h-5 text-brand-500 mt-1" />
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">Instant Activation</h4>
                                        <p className="text-xs text-gray-500">Service begins exactly after successful payment processing.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
