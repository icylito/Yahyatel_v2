import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "../components/ui/BuyButton";
import { Card, CardContent } from "../components/ui/TelecomPlanCard";
import { UserPlus, Check, ShieldCheck, AlertCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { COUNTRIES } from "../lib/countries";
import { API_BASE_URL } from "../lib/api";

// Zod schemas for multi-step validation
const step1Schema = z.object({
    name: z.string().min(1, "Name is required").regex(/^[a-zA-Z\s]+$/, "Name must contain only letters and spaces."),
    phone: z.string().min(8, "Phone must be at least 8 digits."),
    countryCode: z.string().min(1),
    email: z.string().email("Please enter a valid email address."),
    role: z.string(),
});

const step2Schema = z.object({
    password: z.string().min(8, "Password must be at least 8 characters").regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, "Password must meet all requirements."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
});

const registerSchema = step1Schema.and(step2Schema);

type RegisterFormValues = z.infer<typeof registerSchema>;

const RegisterPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const navigate = useNavigate();

    const {
        register,
        trigger,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        mode: "onBlur",
        defaultValues: {
            countryCode: "+968",
            role: "customer"
        }
    });

    const watchPassword = watch("password", "");

    const handleNext = async () => {
        if (step === 1) {
            const isValid = await trigger(["name", "phone", "email", "countryCode"]);
            if (isValid) setStep(2);
        } else if (step === 2) {
            const isValid = await trigger(["password", "confirmPassword"]);
            if (isValid) setStep(3);
        }
    };

    const onSubmit = async (data: RegisterFormValues) => {
        if (step !== 3 || !agreedToTerms) return;

        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: data.name,
                    phone: data.countryCode + data.phone,
                    email: data.email,
                    password: data.password,
                    role: data.role,
                }),
            });

            if (res.status === 409) {
                toast.error("Account Exists", { description: "This email is already registered." });
                setStep(1);
                setIsLoading(false);
                return;
            }

            if (!res.ok) {
                toast.error("Registration Failed", { description: "Please try again later." });
                setIsLoading(false);
                return;
            }

            const dataResponse = await res.json();
            const { access_token, user } = dataResponse;

            sessionStorage.setItem("access_token", access_token);
            sessionStorage.setItem("role", user.role);
            sessionStorage.setItem("userName", user.name);
            sessionStorage.setItem("userId", user.id.toString());
            sessionStorage.setItem("subscribedServices", JSON.stringify([]));

            toast.success("Account Created!", { description: <>Welcome to <span translate="no" className="notranslate">YahyaTel</span>.</> });

            setTimeout(() => {
                setIsLoading(false);
                navigate("/");
            }, 1000);
        } catch {
            toast.error("Connection Error", { description: "Could not connect to the server." });
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center p-4 bg-gray-50/50">
            <div className="max-w-2xl w-full">
                <Card className="border-none shadow-2xl overflow-hidden rounded-3xl">
                    <div className="brand-gradient h-32 flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <h2 className="text-3xl font-bold text-white relative z-10 flex items-center gap-3 tracking-tight">
                            <UserPlus className="w-8 h-8 text-brand-300" />
                            Join <span translate="no" className="notranslate">YahyaTel</span>
                        </h2>
                    </div>

                    <CardContent className="p-10 space-y-10 bg-white">
                        <div className="flex justify-between items-center mb-6">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex-1 flex items-center">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300",
                                        step === s ? "bg-brand-600 text-white shadow-lg" :
                                            step > s ? "bg-emerald-500 text-white" : "bg-brand-50 text-brand-300"
                                    )}>
                                        {step > s ? <Check className="w-5 h-5" /> : s}
                                    </div>
                                    {s < 3 && <div className={cn("flex-1 h-1 mx-2 rounded-full", step > s ? "bg-emerald-300" : "bg-gray-100")}></div>}
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 min-h-[300px]">
                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-bold text-gray-900">Personal Details</h3>
                                            <p className="text-sm text-gray-500">Tell us basic information to get started.</p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider px-2">Full Name</label>
                                                <input
                                                    type="text"
                                                    {...register("name")}
                                                    placeholder="Ahmed Ali"
                                                    className={cn("w-full px-5 py-3 rounded-xl border bg-gray-50 focus:ring-2 outline-none transition-all", errors.name ? "border-red-500 focus:ring-red-200" : "border-gray-200 focus:ring-brand-500")}
                                                />
                                                {errors.name && <p className="text-red-500 text-[10px] font-bold px-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name.message as string}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider px-2">Phone Number</label>
                                                <div className="flex gap-2 relative">
                                                    <select
                                                        {...register("countryCode")}
                                                        className="w-[110px] bg-gray-50 border border-gray-200 rounded-xl px-2 py-3 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-brand-500"
                                                    >
                                                        {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                                                    </select>
                                                    <div className="relative flex-1">
                                                        <input
                                                            type="tel"
                                                            {...register("phone")}
                                                            placeholder="9XXXXXXX"
                                                            className={cn("w-full px-4 py-3 rounded-xl border bg-gray-50 focus:ring-2 outline-none transition-all", errors.phone ? "border-red-500 focus:ring-red-200" : "border-gray-200 focus:ring-brand-500")}
                                                        />
                                                    </div>
                                                </div>
                                                {errors.phone && <p className="text-red-500 text-[10px] font-bold px-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.phone.message as string}</p>}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider px-2">Email Address</label>
                                            <input
                                                type="email"
                                                {...register("email")}
                                                placeholder="ahmed@example.com"
                                                className={cn("w-full px-5 py-3 rounded-xl border bg-gray-50 focus:ring-2 outline-none transition-all", errors.email ? "border-red-500 focus:ring-red-200" : "border-gray-200 focus:ring-brand-500")}
                                            />
                                            {errors.email && <p className="text-red-500 text-[10px] font-bold px-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email.message as string}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider px-2">Account Type</label>
                                            <select
                                                {...register("role")}
                                                className="w-full px-5 py-3 rounded-xl border bg-gray-50 focus:ring-2 border-gray-200 focus:ring-brand-500 outline-none transition-all cursor-pointer"
                                            >
                                                <option value="customer">Customer</option>
                                                <option value="customer_agent">Customer Agent</option>
                                            </select>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-bold text-gray-900">Secure Your Account</h3>
                                            <p className="text-sm text-gray-500">Create a password to keep your data safe.</p>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider px-2">Password</label>
                                                <div className="relative">
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        {...register("password")}
                                                        placeholder="••••••••"
                                                        className={cn("w-full px-5 py-3 rounded-xl border bg-gray-50 focus:ring-2 outline-none transition-all pr-12", errors.password ? "border-red-500 focus:ring-red-200" : "border-gray-200 focus:ring-brand-500")}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                                    >
                                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                                {errors.password && <p className="text-red-500 text-[10px] font-bold px-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password.message as string}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider px-2">Confirm Password</label>
                                                <div className="relative">
                                                    <input
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        {...register("confirmPassword")}
                                                        placeholder="••••••••"
                                                        className={cn("w-full px-5 py-3 rounded-xl border bg-gray-50 focus:ring-2 outline-none transition-all pr-12", errors.confirmPassword ? "border-red-500 focus:ring-red-200" : "border-gray-200 focus:ring-brand-500")}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                                    >
                                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                                {errors.confirmPassword && <p className="text-red-500 text-[10px] font-bold px-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.confirmPassword.message as string}</p>}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-brand-50 rounded-xl space-y-3">
                                            <p className="text-xs font-bold text-brand-700 uppercase tracking-wider flex items-center gap-2">
                                                <ShieldCheck className="w-4 h-4" /> Password Requirements
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {[
                                                    { label: "At least 8 characters", met: watchPassword.length >= 8 },
                                                    { label: "1 lowercase letter", met: /[a-z]/.test(watchPassword) },
                                                    { label: "1 uppercase letter", met: /[A-Z]/.test(watchPassword) },
                                                    { label: "1 number", met: /\d/.test(watchPassword) },
                                                    { label: "1 special character", met: /[\W_]/.test(watchPassword) },
                                                ].map((req, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        {req.met ? (
                                                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                                        ) : (
                                                            <AlertCircle className="w-4 h-4 text-brand-300 shrink-0" />
                                                        )}
                                                        <span className={cn("text-xs font-medium transition-colors", req.met ? "text-emerald-700" : "text-gray-500")}>
                                                            {req.label}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 3 && (
                                    <motion.div
                                        key="step3"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6 text-center py-10"
                                    >
                                        <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                            <Check className="w-12 h-12 animate-pulse" />
                                        </div>
                                        <h3 className="text-3xl font-bold text-gray-900">Ready to Go!</h3>
                                        <p className="text-lg text-gray-600 max-w-sm mx-auto">Click register to confirm your account and join the <span translate="no" className="notranslate">YahyaTel</span> family.</p>
                                        <div className="p-6 border rounded-2xl bg-gray-50 flex items-start text-left gap-4 max-w-md mx-auto shadow-sm">
                                            <input
                                                type="checkbox"
                                                checked={agreedToTerms}
                                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                                className="mt-1 flex-shrink-0 w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                                            />
                                            <div className="text-sm text-gray-600">
                                                I agree to the <Link to="/terms" className="text-brand-700 font-bold hover:underline">Terms & Conditions</Link> and <Link to="#" className="text-brand-700 font-bold hover:underline">Privacy Policy</Link> of <span translate="no" className="notranslate">YahyaTel</span>.
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex gap-4 items-center">
                                {step > 1 && (
                                    <Button type="button" variant="outline" className="flex-1 py-4 border-gray-200 text-gray-600 hover:bg-gray-50 hidden md:flex" onClick={() => setStep(step - 1)}>
                                        Go Back
                                    </Button>
                                )}
                                <Button
                                    type={step === 3 ? "submit" : "button"}
                                    onClick={(e) => {
                                        if (step < 3) {
                                            e.preventDefault();
                                            handleNext();
                                        }
                                    }}
                                    className={cn(
                                        "w-full flex-[2] py-4 text-lg rounded-xl shadow-lg transition-all",
                                        step === 3 && !agreedToTerms
                                            ? "bg-gray-400 hover:bg-gray-400 opacity-70 cursor-not-allowed text-white"
                                            : "hover:scale-[1.02] active:scale-[0.98] brand-gradient"
                                    )}
                                    disabled={isLoading || (step === 3 && !agreedToTerms)}
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        step === 3 ? "Register Now" : "Continue"
                                    )}
                                </Button>
                            </div>
                        </form>

                        <p className="text-center text-sm text-gray-500">
                            Already a member? <Link to="/login" className="text-brand-600 font-bold hover:underline">Sign In</Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default RegisterPage;
