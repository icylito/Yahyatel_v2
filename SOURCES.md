# Dataset Sources

The churn prediction model was trained on four publicly available telecom datasets.
None of the datasets are included in this repository — they are ignored via `.gitignore`.
Download them separately and place them in the project root before running `examples/train_example.py`.

---

## 1. Cell2Cell (primary dataset)

**File expected:** `cell2celltrain.csv`

**Source:** Duke University Teradata Center — Cell2Cell Churn Dataset  
**URL:** https://www.kaggle.com/datasets/jpacse/datasets-for-churn-telecom

**Description:** ~71,000 US wireless customers with 76 features including usage patterns,
call behaviour, equipment age, and customer care interactions. Binary churn label (Yes/No).
This is the primary dataset and defines the feature schema the model expects.

---

## 2. WA Telco Customer Churn

**File expected:** `WA_Fn-UseC_-Telco-Customer-Churn.csv`

**Source:** IBM Sample Data Sets / Kaggle  
**URL:** https://www.kaggle.com/datasets/blastchar/telco-customer-churn

**Description:** ~7,000 customers from a fictional California telco. Features cover
contract type, internet/phone services, payment method, monthly charges, and tenure.
Widely used benchmark dataset for churn classification.

---

## 3. BigML Telecom Churn (20%)

**File expected:** `churn-bigml-20.csv`

**Source:** BigML sample datasets (Orange/US telecom)  
**URL:** https://www.kaggle.com/datasets/mnassrib/telecom-churn-datasets

**Description:** ~667 rows (20% split of the full Orange dataset). Covers daily/evening/
night/international call minutes and charges, customer service call volume, and voicemail.
Used to add call-behaviour signal to the merged training set.

---

## 4. California Telecom Customer Churn

**File expected:** `telecom_customer_churn.csv`

**Source:** Maven Analytics / Kaggle  
**URL:** https://www.kaggle.com/datasets/shilongzhuang/telecom-customer-churn-by-maven-analytics

**Description:** ~7,000 California customers with 38 features including referrals,
streaming services, unlimited data, premium tech support, and a multi-class churn label
(Churned / Stayed / Joined). Adds service-bundle and demographic signal.

---

## How the datasets are used

All four datasets are loaded, column-mapped to a common schema (defined by Cell2Cell),
and concatenated into a single training frame. Missing values are filled with column
medians (numeric) or modes (categorical). An XGBoost classifier is trained on the merged
data using 3-fold cross-validated grid search.

See `examples/train_example.py` for a clean walkthrough of the full pipeline.
