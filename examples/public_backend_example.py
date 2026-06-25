from fastapi import FastAPI
from pydantic import BaseModel, Field


app = FastAPI(title="YahyaTel Public Example API")


class ChurnRequest(BaseModel):
    tenure: int = Field(12, ge=0)
    monthlySpend: float = Field(70.0, ge=0)
    paymentDelays: int = Field(0, ge=0)
    satisfaction: float = Field(5.0, ge=1, le=10)


def estimate_churn_score(customer: ChurnRequest) -> float:
    """Small rule-based score for demos when private model files are unavailable."""
    score = 0.20

    if customer.tenure < 6:
        score += 0.20
    elif customer.tenure > 24:
        score -= 0.10

    score += min(customer.paymentDelays * 0.10, 0.30)
    score += (10 - customer.satisfaction) * 0.04

    if customer.monthlySpend > 100:
        score += 0.05

    return round(max(0.01, min(score, 0.99)), 4)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/predict")
def predict_churn(customer: ChurnRequest):
    probability = estimate_churn_score(customer)
    return {"churnProbability": probability}
