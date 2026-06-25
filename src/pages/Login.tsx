import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "../components/ui/BuyButton";
import { Card, CardContent } from "../components/ui/TelecomPlanCard";
import { LogIn, Lock, Mail, ChevronRight } from "lucide-react";
import { API_BASE_URL } from "../lib/api";

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address."),
    password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ── Quick Access credential pools ──────────────────────────────────────────
const ADMIN_ACCOUNT = { email: "lol@lol.net", password: "aA!11111" };

const AGENT_ACCOUNTS = [
    { email: "agent@yahyatel.om",        password: "agent123" },
    { email: "sara.agent@yahyatel.om",   password: "agent123" },
    { email: "omar.agent@yahyatel.om",   password: "agent123" },
    { email: "mariam.agent@yahyatel.om", password: "agent123" },
    { email: "hassan.agent@yahyatel.om", password: "agent123" },
];

const CUSTOMER_ACCOUNTS = [
    { email: "customer@yahyatel.om",         password: "password123" },
    { email: "ahmed.balushi91@gmail.com",    password: "password123" },
    { email: "fatima.zadjali@hotmail.com",   password: "password123" },
    { email: "s.maskari1987@gmail.com",      password: "password123" },
    { email: "muna.rawahi@icloud.com",       password: "password123" },
    { email: "khalid_harthy@outlook.com",    password: "password123" },
    { email: "amal.shanfari@gmail.com",      password: "password123" },
    { email: "said.habsi99@yahoo.com",       password: "password123" },
    { email: "lailakharusi@hotmail.com",     password: "password123" },
    { email: "nasser.ghafri@gmail.com",      password: "password123" },
    { email: "asma.balushi2001@icloud.com",  password: "password123" },
    { email: "maryam.lawati@gmail.com",      password: "password123" },
    { email: "yousuf_raisi@outlook.com",     password: "password123" },
    { email: "zainab.hinai95@yahoo.com",     password: "password123" },
    { email: "hamed.busaidi@gmail.com",      password: "password123" },
    { email: "shaikha.amri@hotmail.com",     password: "password123" },
    { email: "t.junaibi88@gmail.com",        password: "password123" },
    { email: "reem.hashmi@icloud.com",       password: "password123" },
    { email: "faisal.battashi@gmail.com",    password: "password123" },
    { email: "noora_shuaibi@outlook.com",    password: "password123" },
    { email: "ibrahim.mahrouqi@gmail.com",   password: "password123" },
];

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}
// ───────────────────────────────────────────────────────────────────────────

const LoginPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.status === 401) {
                toast.error("Incorrect email or password.");
                setIsLoading(false);
                return;
            }
            if (!res.ok) {
                toast.error("Login failed. Please try again later.");
                setIsLoading(false);
                return;
            }

            const dataResponse = await res.json();
            const { access_token, user } = dataResponse;
            const role = user.role as "admin" | "customer_agent" | "customer";

            sessionStorage.setItem("access_token", access_token);
            sessionStorage.setItem("role", role);
            sessionStorage.setItem("userName", user.name);
            sessionStorage.setItem("userId", user.id.toString());
            sessionStorage.setItem("subscribedServices", JSON.stringify([]));

            toast.success("Welcome back!", {
                description: `Successfully signed in as ${user.name}`,
            });

            setIsLoading(false);

            if (role === "admin") {
                navigate("/admin");
            } else if (role === "customer_agent") {
                navigate("/ai-analyzer");
            } else {
                navigate("/");
            }
        } catch {
            toast.error("Connection Error", {
                description: "Could not connect to the server. Check if the backend is running.",
            });
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4 bg-gray-50/50">
            <div className="max-w-md w-full">
                <Card className="border-none shadow-2xl overflow-hidden rounded-3xl">
                    <div className="brand-gradient h-32 flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <h2 className="text-3xl font-bold text-white relative z-10 flex items-center gap-3">
                            <LogIn className="w-8 h-8 text-brand-300" />
                            Sign In
                        </h2>
                    </div>

                    <CardContent className="p-10 space-y-7 bg-white">
                        <div className="text-center mb-4">
                            <p className="text-gray-500 text-sm">Welcome back to YahyaTel. Sign in with your account credentials.</p>
                        </div>

                        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center mb-3">Quick System Access</div>
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-[8px] font-black uppercase h-8 px-0 rounded-lg border-brand-100 text-brand-700 bg-white hover:bg-brand-600 hover:text-white transition-all"
                                    onClick={() => onSubmit(ADMIN_ACCOUNT)}
                                >
                                    Admin
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-[8px] font-black uppercase h-8 px-0 rounded-lg border-emerald-100 text-emerald-700 bg-white hover:bg-emerald-600 hover:text-white transition-all"
                                    onClick={() => onSubmit(pickRandom(AGENT_ACCOUNTS))}
                                >
                                    Agent
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-[8px] font-black uppercase h-8 px-0 rounded-lg border-blue-100 text-blue-700 bg-white hover:bg-blue-600 hover:text-white transition-all"
                                    onClick={() => onSubmit(pickRandom(CUSTOMER_ACCOUNTS))}
                                >
                                    Customer
                                </Button>
                            </div>
                        </div>



                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-brand-600" />
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    {...register("email")}
                                    placeholder="yourname@example.com"
                                    className={`w-full px-5 py-3 rounded-xl border focus:ring-2 outline-none transition-all placeholder:text-gray-400 bg-gray-50/50 ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-brand-500'}`}
                                />
                                {errors.email && <p className="text-red-500 text-xs font-bold">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-brand-600" />
                                        Password
                                    </label>
                                    <Link to="/contact#send-message" className="text-xs font-medium text-brand-700 hover:underline">Forgot password?</Link>
                                </div>
                                <input
                                    type="password"
                                    {...register("password")}
                                    placeholder="••••••••"
                                    className={`w-full px-5 py-3 rounded-xl border focus:ring-2 outline-none transition-all placeholder:text-gray-400 bg-gray-50/50 ${errors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:ring-brand-500'}`}
                                />
                                {errors.password && <p className="text-red-500 text-xs font-bold">{errors.password.message}</p>}
                            </div>

                            <Button
                                type="submit"
                                className="w-full py-4 rounded-xl text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Sign In <ChevronRight className="w-5 h-5" /></>
                                )}
                            </Button>
                        </form>



                        <p className="text-center text-sm text-gray-500">
                            Don't have an account? <Link to="/register" className="text-brand-600 font-bold hover:underline">Register Now</Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default LoginPage;
