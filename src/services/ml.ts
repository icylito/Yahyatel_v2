import { fetchWithAuth } from "../lib/api";

/**
 * Lightweight ML logic for Churn Prediction
 * Ported and simplified from the original YahyaTel system.
 */

export interface CustomerRecord {
    id: string;
    name: string;
    tenure: number;
    monthlySpend: number;
    paymentDelays: number;
    satisfaction: number;
    churnProb?: number;
    retentionStrategy?: string;
    actionStatus?: 'pending' | 'resolved';
    subscriptions?: { planName: string; monthsUsed: number }[];
}

export async function generateSyntheticData(count: number = 20): Promise<CustomerRecord[]> {
    const names = ["Ahmed", "Fatima", "Salim", "Muna", "Khalid", "Amal", "Said", "Laila"];

    const mockUsers = Array.from({ length: count }, (_, i) => {
        const tenure = Math.floor(Math.random() * 60) + 1;
        const paymentDelays = Math.random() > 0.8 ? Math.floor(Math.random() * 5) : 0;
        const satisfaction = Math.floor(Math.random() * 10) + 1;
        const monthlySpend = Math.floor(Math.random() * 100) + 20;

        const plans = ["Fiber 500Mbps", "5G Home Broadband", "Mobile Unlimited Plus", "Mobile Starter 5GB", "Business Essential"];
        let remainingTenure = tenure;
        const subscriptions = [];
        const numSubs = Math.floor(Math.random() * 3) + 1;

        for (let j = 0; j < numSubs; j++) {
            const planName = plans[Math.floor(Math.random() * plans.length)];
            let monthsUsed = j === numSubs - 1 ? remainingTenure : Math.floor(Math.random() * remainingTenure) + 1;
            if (monthsUsed === 0) monthsUsed = 1;
            remainingTenure -= monthsUsed;
            if (monthsUsed > 0) subscriptions.push({ planName, monthsUsed });
            if (remainingTenure <= 0) break;
        }

        return {
            id: `CUST-${1000 + i}`,
            name: names[Math.floor(Math.random() * names.length)] + " " + String.fromCharCode(65 + Math.floor(Math.random() * 26)),
            tenure,
            monthlySpend,
            paymentDelays,
            satisfaction,
            subscriptions
        };
    });

    return await Promise.all(mockUsers.map(async (u) => ({
        ...u,
        churnProb: await predictChurn(u)
    })));
}

export async function predictChurn(customer: Partial<CustomerRecord>): Promise<number> {
    try {
        const response = await fetchWithAuth("/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                tenure: customer.tenure || 12,
                monthlySpend: customer.monthlySpend || 70.0,
                paymentDelays: customer.paymentDelays || 0,
                satisfaction: customer.satisfaction || 5.0,
            })
        });
        if (!response.ok) return 0.1;
        const data = await response.json();
        return data.churnProbability;
    } catch {
        return 0.1;
    }
}

/**
 * Batch version — one HTTP call for all customers.
 * Returns probabilities in the same order as the input array.
 */
export async function predictChurnBatch(customers: Partial<CustomerRecord>[]): Promise<number[]> {
    if (customers.length === 0) return [];
    try {
        const response = await fetchWithAuth("/predict/batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customers: customers.map(c => ({
                    tenure: c.tenure || 12,
                    monthlySpend: c.monthlySpend || 70.0,
                    paymentDelays: c.paymentDelays || 0,
                    satisfaction: c.satisfaction || 5.0,
                }))
            })
        });
        if (!response.ok) return customers.map(() => 0.1);
        const data = await response.json();
        return data.predictions as number[];
    } catch {
        return customers.map(() => 0.1);
    }
}

// Deterministic pick: same customer → same message, different customers → different messages
function pickStrategy(pool: string[], seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return pool[hash % pool.length];
}

export async function generateRetentionStrategy(customer: Partial<CustomerRecord>): Promise<string> {
    const probability = Math.round((customer.churnProb || 0) * 100);
    const tenure = customer.tenure || 0;
    const satisfaction = customer.satisfaction || 5;
    const paymentDelays = customer.paymentDelays || 0;
    const spend = customer.monthlySpend || 70;
    const seed = customer.id || customer.name || String(Math.random());

    await new Promise(resolve => setTimeout(resolve, 800));

    // ── 1. Stable long-term customer ─────────────────────────
    if (tenure > 24 && satisfaction >= 7 && paymentDelays <= 1) {
        return pickStrategy([
            "Customer demonstrates outstanding loyalty with consistent payments and long tenure. No intervention required — maintain standard quarterly wellness check-in.",
            "Subscriber profile is stable and healthy. Consider nominating this customer for the YahyaTel Ambassador Program to leverage their loyalty as organic advocacy.",
            "No churn indicators present. Mark for a proactive 6-month renewal offer to lock in another contract term and reward their loyalty with a complementary speed upgrade.",
            "Excellent subscriber health score. Schedule a brief satisfaction call to gather testimonial feedback and offer an early renewal discount of 10% on their next billing cycle.",
        ], seed);
    }

    // ── 2. Early lifecycle with high friction ─────────────────
    if (tenure <= 6 && satisfaction <= 4) {
        return pickStrategy([
            "Early lifecycle friction detected. Assign a Customer Success representative within 48 hours to conduct an onboarding review, resolve any setup issues, and offer a 15% first-month credit.",
            "New subscriber showing dissatisfaction signals. Escalate to Tier-2 support for an immediate root cause call. Offer a free speed upgrade for 2 months to demonstrate service quality.",
            "Critical early churn window. Send a personalized service health check survey, then follow up with a dedicated agent to realign the plan to better fit their usage pattern.",
            "Onboarding risk detected. Offer a complimentary plan downgrade option with a 30-day price-lock guarantee, and schedule a technical visit to ensure service quality meets expectations.",
        ], seed);
    }

    // ── 3. High churn risk + high spend (VIP) ────────────────
    if (probability >= 60 && spend > 100) {
        return pickStrategy([
            "Critical VIP churn signal. Immediately assign a dedicated account manager. Offer a 3-month premium tier upgrade at no additional cost and schedule a priority retention call within 24 hours.",
            "High-value customer is at critical risk of leaving. Authorize a loyalty package: complimentary Cloud Storage (1TB) add-on for 6 months, plus a dedicated 24/7 support line.",
            "VIP subscriber with elevated exit probability. Apply an immediate 20% bill discount for the next 3 cycles and offer an exclusive early access to the upcoming 5G Ultra plan.",
            "Premium account at critical risk. Trigger the executive retention protocol: personal call from the Customer Relations Director, and a tailored enterprise-grade SLA to lock in commitment.",
            "High spend, high risk — this account represents significant revenue. Propose a multi-service bundle discount of 25% to increase switching costs and strengthen product stickiness.",
        ], seed);
    }

    // ── 4. Financial friction (payment delays) ────────────────
    if (paymentDelays >= 3) {
        return pickStrategy([
            "Recurring payment delays indicate financial strain. Proactively reach out to offer a flexible bi-monthly billing cycle and a temporary plan reduction to prevent accidental churn.",
            "Financial friction detected. Issue a grace period extension of 14 days on the next overdue invoice and present a bundled lower-cost plan with equivalent core features.",
            "Payment irregularity pattern identified. Offer an interest-free installment arrangement on outstanding balance and enroll the customer in autopay with a 5% autopay discount incentive.",
            "Multiple payment delays logged. Schedule a financial wellness call to restructure the account, offering a scaled-back plan with a clear path to re-upgrade once payment health improves.",
        ], seed);
    }

    // ── 5. Long-term but highly dissatisfied ─────────────────
    if (tenure > 24 && satisfaction <= 4) {
        return pickStrategy([
            "Long-standing customer showing severe dissatisfaction. Escalate immediately to a senior account manager. Offer a 'Loyalty Apology' bill credit equal to one month's charges and a free service review.",
            "Veteran subscriber in distress. Issue a formal service quality apology and propose a full plan replacement at the same price point, including a free home network audit.",
            "Extended tenure customer flagged for dissatisfaction. Apply an immediate upgrade to the next service tier at no cost for 3 months while a root cause investigation is completed.",
            "Long-term relationship at risk. Authorize a personalized retention package: speed double, bill credit, and dedicated support line. Flag for quarterly satisfaction monitoring going forward.",
        ], seed);
    }

    // ── 6. Medium risk, moderate tenure ──────────────────────
    if (probability >= 30 && probability < 60 && tenure > 6 && tenure <= 24) {
        return pickStrategy([
            "Moderate churn risk with a developing customer history. Send a personalized email campaign highlighting unused plan features and offer a loyalty discount of 10% on the next billing cycle.",
            "Warning zone subscriber. Trigger a re-engagement workflow: SMS with a personalized offer, followed by a 2-week free trial of a premium add-on service to increase plan value perception.",
            "Mid-tenure customer showing drift signals. Recommend a plan review call to realign services with current usage. Offer complementary access to the AI usage dashboard for 90 days.",
            "Moderate risk profile. Activate the cross-sell retention path: offer a bundled mobile + fiber package with a combined 15% discount to increase product attachment and reduce churn probability.",
            "Customer sits in the warning zone — not critical, but trending downward. A targeted rewards campaign (loyalty points, referral bonus) could re-engage interest and shift sentiment.",
        ], seed);
    }

    // ── 7. Zero subscriptions / no services attached ──────
    if (!customer.subscriptions || customer.subscriptions.length === 0) {
        return pickStrategy([
            "Customer has no active services linked to their account. Send an onboarding nudge campaign with a curated starter bundle recommendation based on their profile demographics.",
            "No service subscriptions detected. Assign to a proactive sales outreach queue with a first-plan discount of 20% to convert this inactive account into an active revenue stream.",
            "Unsubscribed account at risk of going dormant. Issue a 'Welcome Back' incentive: free first month on the Basic Fiber or Mobile Starter plan to restart engagement.",
        ], seed);
    }

    // ── 8. Single service only (low attachment) ───────────
    if ((customer.subscriptions?.length ?? 0) === 1) {
        return pickStrategy([
            "Low product attachment — customer uses only one service. Recommend a complementary mobile or TV bundle with a 3-month introductory rate to deepen service stickiness.",
            "Single-service subscriber at moderate exit risk. Present a curated 'Power User Bundle' combining their current plan with a aligned add-on at a 15% combined discount.",
            "One-product subscriber: high risk of full churn if that service is disrupted. Urgently cross-sell a secondary product to increase switching cost before the next billing cycle.",
        ], seed);
    }

    // ── 9. High satisfaction but moderate churn risk ──────
    if (satisfaction >= 8 && probability >= 40) {
        return pickStrategy([
            "Paradox profile: high satisfaction yet elevated churn risk — likely driven by a competitor price offer. Propose a proactive price-match guarantee and a loyalty recognition call.",
            "Customer is happy but still showing churn signals. This may be a relocation or budget constraint. Offer a flexible plan pause option for up to 60 days to retain without losing the account.",
            "High satisfaction but rising churn probability is a red flag for external market pressure. Counter with an exclusive 'Loyalty Shield' rate lock for 12 months to remove competitor advantage.",
        ], seed);
    }

    // ── 10. Very new customer (≤ 3 months), any risk ──────
    if (tenure <= 3) {
        return pickStrategy([
            "Subscriber is in the critical 90-day window — the highest risk period for first-year churn. Trigger a structured 3-touch onboarding sequence: call on day 7, email on day 30, review on day 60.",
            "New account in the honeymoon phase. Proactively resolve any pending service tickets and send a curated 'Getting Started' guide to set expectations and demonstrate full service value.",
            "Early subscriber with undetermined risk profile. Enroll in the new customer success program: monthly usage digest and a dedicated onboarding advisor for the first quarter.",
        ], seed);
    }

    // ── 11. Senior subscriber (high tenure, high delays) ──
    if (tenure > 36 && paymentDelays >= 2) {
        return pickStrategy([
            "Veteran customer with recurring payment friction — likely a billing method issue rather than financial strain. Assign an agent to personally assist with updating to automated payment.",
            "Long-term subscriber experiencing payment difficulties. Offer a compassionate 'Senior Loyalty Plan': reduced rate, simplified billing, and a dedicated support contact number.",
            "Established account with billing irregularities. Issue a proactive courtesy credit for the current month and propose a bank-transfer autopay setup with a permanent 5% discount incentive.",
        ], seed);
    }

    // ── 12. Medium tenure, zero payment delays, low satisfaction ──
    if (tenure > 6 && paymentDelays === 0 && satisfaction <= 4) {
        return pickStrategy([
            "Financially reliable customer who is deeply dissatisfied — a service quality issue, not a payment one. Prioritize a technical service audit and offer a free speed upgrade pending the results.",
            "On-time payer with low satisfaction: this customer is loyal in behaviour but unhappy in experience. Escalate to quality assurance for a service experience review and issue a bill credit.",
            "Good payment record, poor satisfaction score. This profile often churns silently. Schedule a mandatory satisfaction call and present a 'Service Guarantee' pledge with a compensation offer.",
        ], seed);
    }

    // ── 13. High churn risk, long tenure, low spend ───────
    if (probability >= 60 && tenure > 18 && spend <= 30) {
        return pickStrategy([
            "Long-term low-spend customer suddenly showing critical churn risk. Their plan may no longer suit their needs. Offer a tailored upgrade path with a 6-month graduated pricing ramp.",
            "Established budget customer at critical risk — this profile often churns silently. A personal outreach call acknowledging their loyalty and presenting a curated 'Best Value' plan is the priority.",
            "High churn risk on a legacy plan. Migrate them to a modern equivalent plan at the same price point with added benefits to reinvigorate their perception of service value.",
        ], seed);
    }

    // ── 14. Low risk, low satisfaction, medium tenure ─────
    if (probability < 30 && satisfaction <= 5 && tenure > 6) {
        return pickStrategy([
            "Low churn probability despite moderate dissatisfaction — watch closely. Add to a passive monitoring queue and trigger a check-in if satisfaction doesn't improve within 30 days.",
            "Model shows low exit risk but satisfaction score is a warning signal. Send a proactive 'How are we doing?' NPS survey and apply a goodwill data top-up gift regardless of response.",
            "Statistically stable but subjectively unhappy. Preventive action now is cheaper than retention later. A small, surprise loyalty reward (e.g., free add-on month) can shift sentiment immediately.",
        ], seed);
    }

    // ── 15. General / fallback ────────────────────────────
    return pickStrategy([
        "General risk indicators present. Initiate a proactive feedback call to understand current pain points and offer a personalized loyalty discount based on recent usage history.",
        "Risk signals detected without a clear pattern. Assign to the standard re-engagement queue: send a service quality survey, act on findings, and apply a goodwill bill credit of OMR 5.",
        "Subscriber flagged for review. Recommend a 15-minute service health consultation with an account agent to identify any hidden issues and realign the plan to actual usage.",
        "Undetermined risk pattern. Schedule an automated well-being check-in email and monitor response. If no engagement within 7 days, escalate to direct outreach with a promotional offer.",
        "Customer profile shows mild drift. A targeted promotion — such as a free month of TV & Entertainment or a data top-up gift — can be used to rekindle engagement at minimal cost.",
    ], seed);
}


