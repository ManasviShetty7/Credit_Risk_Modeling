export interface Borrower {
  id: string;
  name: string;
  age: number;
  annualIncome: number;
  dti: number; // Debt-to-Income ratio (%)
  creditLimit: number;
  balance: number;
  creditUtilRate: number; // Engineered Feature: balance / creditLimit (%)
  creditHistoryYears: number;
  latePayments: number; // Late payments count
  inquiries: number; // Recent inquiries in last 6 months
  loanAmount: number;
  ltv: number; // Loan-to-Value ratio (%)
  actualDefault: number; // 0 = Good (Paid/Paying), 1 = Bad (Defaulted)
  
  // Model output fields calculated in real-time
  predictedPD?: number; // Probability of Default (0 to 1)
  predictedScore?: number; // Scorecard points (e.g., 300 to 850)
  riskCategory?: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface ModelCoefficients {
  intercept: number;
  income: number; // negative (higher income -> lower default risk)
  dti: number; // positive (higher DTI -> higher risk)
  utilization: number; // positive (higher utilization -> higher risk)
  historyYears: number; // negative (longer history -> lower risk)
  latePayments: number; // positive (more late payments -> higher risk)
  inquiries: number; // positive (more inquiries -> higher risk)
  ltv: number; // positive (higher loan-to-value -> higher risk)
}

export interface ScorecardParams {
  pdo: number; // Points to Double Odds (e.g., 20 or 50)
  baseScore: number; // e.g., 600
  baseOdds: number; // e.g., 50 (i.e., 50 good to 1 bad)
}

export interface ThresholdMetrics {
  threshold: number; // e.g., 0.15
  tp: number;
  fp: number;
  tn: number;
  fn: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
}

export interface ROCPoint {
  fpr: number; // False Positive Rate
  tpr: number; // True Positive Rate
  threshold: number;
  cutoffScore: number;
}

export interface FeatureImportance {
  feature: string;
  label: string;
  coefficient: number;
  relativeImportance: number;
  description: string;
}

export interface WoEBin {
  variable: string;
  binName: string;
  minVal: number;
  maxVal: number;
  totalCount: number;
  goodCount: number;
  badCount: number;
  goodRate: number;
  badRate: number;
  woe: number; // Weight of Evidence
  iv: number; // Information Value contribution
}
