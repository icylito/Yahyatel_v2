/**
 * examples/public_frontend_usage.ts
 * -----------------------------------
 * READING GUIDE — this file is for understanding the request shape,
 * not for running against the production backend.
 *
 * The real backend (/predict) requires a Bearer token from /api/users/login.
 * To test against the real backend, first log in and include the token:
 *
 *   headers: { "Authorization": `Bearer ${token}` }
 *
 * To test without any auth, run the standalone example backend instead:
 *   cd examples && uvicorn public_backend_example:app --reload --port 8001
 */

// Shape of the churn prediction request
export interface ChurnInput {
  tenure: number;        // months the customer has been subscribed
  monthlySpend: number;  // average monthly bill
  paymentDelays: number; // number of late payments
  satisfaction: number;  // self-reported score from 1 (worst) to 10 (best)
}

// Shape of the response
export interface ChurnResult {
  churnProbability: number; // 0.0 – 1.0
  mode: "xgboost" | "demo"; // "xgboost" = trained model, "demo" = rule-based fallback
}

// Example: call the standalone example backend (no auth needed)
export async function predictChurnExample(input: ChurnInput): Promise<ChurnResult> {
  const response = await fetch("http://127.0.0.1:8001/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Prediction failed: ${response.status}`);
  }

  return response.json();
}

// Example: call the real backend (requires a valid JWT from /api/users/login)
export async function predictChurnAuthenticated(
  input: ChurnInput,
  token: string
): Promise<ChurnResult> {
  const response = await fetch("http://localhost:8001/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Prediction failed: ${response.status}`);
  }

  return response.json();
}
