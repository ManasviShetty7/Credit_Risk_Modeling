# CIBIL Credit Risk Analytics

An interactive, high-fidelity **Retail Credit Risk Underwriting & Scorecard Calibration Hub** built with React, Vite, and Tailwind CSS. This full-stack simulation implements credit scoring based on realistic Indian borrower demographics, financial thresholds, and a standard credit range (CIBIL equivalent of `300–900` points).

Developers can simulation-test borrower underwriting, manually calibrate logistic regression coefficients, scale log-odds metrics using customizable Points to Double Odds (PDO) systems, run an in-browser Gradient Descent optimizer, and validate models instantly using built-in ROC curves, Gini indicators, and confusion threshold matrices.

---

## 📸 Screenshots

### 1. Main Dashboard & Portfolio metrics
![Portfolio Dashboard](https://github.com/ManasviShetty7/Credit_Risk_Modeling/blob/main/CRM%201.png)

![Portfolio Dashboard](https://github.com/ManasviShetty7/Credit_Risk_Modeling/blob/main/CRM%202.png)

![Portfolio Dashboard](https://github.com/ManasviShetty7/Credit_Risk_Modeling/blob/main/CRM%203.png)

![Portfolio Dashboard](https://github.com/ManasviShetty7/Credit_Risk_Modeling/blob/main/CRM%204.png)

![Portfolio Dashboard](https://github.com/ManasviShetty7/Credit_Risk_Modeling/blob/main/CRM%205.png)

---

## 🚀 Key Features

### 🇮🇳 Demographics & Financial Guardrails
- **Indian Financial Context**: Structured around Indian Rupee (`₹`) denominations, with average salary distributions, realistic credit card limits, and asset-backed loan demands mapping cleanly to local industry averages.
- **CIBIL Equivalent Scoring**: Operates strictly within the standard credit scale range of **`300` to `900` points** (replacing legacy international FICO ranges of 300–850).

### 🩺 Borrower Underwriting Sandbox
- **Dynamic Scenario Presets**: Instant loading of representative prime, medium-grade, and subprime borrower templates (e.g., Priya Patel, Amit Verma, Vikram Joshi).
- **Logarithmic Odds Waterfall**: Visually outlines how individual features (DTI ratios, annualized earnings, Credit Card utilization scales) mathematically contribute toward or protect against Default Risk.

### 🎛️ Mathematical Calibration & Scalers
- **Logistic Coefficients Adjustment**: Sliders to intuitively fine-tune Linear Predictor weights ($\beta$) for multiple credit features.
- **Points to Double Odds (PDO) Scaling**: Allows real-time mathematical translation using standard formulaic configurations:
  $$\text{Score} = \text{Offset} + \text{Factor} \times \ln(\text{Odds})$$
  $$\text{Factor} = \frac{\text{PDO}}{\ln(2)}$$
- **Dynamic In-Browser Optimization**: Includes a direct Logistic Regression solver using standardized batch-gradient descent, generating maximum likelihood estimates directly on the active dataset of 120 test borrowers.

### 📊 Comprehensive Model Diagnostics
- **Interactive Cutoff Score Selector**: Slide a threshold controller to observe dynamic shifts in False Positives, False Negatives, Approvals, and Projected Bad Rates.
- **Advanced Charts**: Interactive layout representing ROC Curves (computing AUC & Gini) and score category histograms built using standard responsive design patterns.
- **Dataset Explorer**: Searchable and filterable data grid listing realistic, synthetic borrower credits for instant underwriting assessment.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: [React 19+](https://react.dev/) + [Vite](https://vite.dev/) 
- **Language**: TypeScript (Type-safe domain schemas)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Visuals & Charts**: [Recharts](https://recharts.org/) & [Lucide-React Icons](https://lucide.dev/)
- **Animations**: [Motion](https://motion.dev/) (Smooth transitions and micro-interactions)
