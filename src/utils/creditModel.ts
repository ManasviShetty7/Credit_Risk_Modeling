import { Borrower, ModelCoefficients, ScorecardParams, ROCPoint, ThresholdMetrics } from '../types';

// Let's generate a highly realistic set of 120 borrowers with realistic Indian demographics and financials
export function generateBorrowerDataset(): Borrower[] {
  const firstNames = [
    'Aarav', 'Ananya', 'Amit', 'Aditya', 'Arjun', 'Priya', 'Rahul', 'Neha', 'Sanjay', 'Rohan', 'Vikram', 'Anjali', 'Kunal', 'Deepak', 'Siddharth', 'Divya', 'Pooja', 'Sunita', 'Rajesh', 'Sameer', 'Vijay', 'Kiran', 'Aisha', 'Varun', 'Ravi', 'Vivek', 'Nikhil', 'Tanvi', 'Abhishek', 'Karan', 'Sneha', 'Pranav', 'Ishaan', 'Kartik', 'Shruti', 'Preeti', 'Harish', 'Manish', 'Kavita', 'Shreya', 'Aakash', 'Alok', 'Yash', 'Ritu', 'Vidya', 'Rupa', 'Anil', 'Suresh', 'Ramesh', 'Mohan', 'Arvind', 'Madhav', 'Gopal', 'Radha', 'Lata', 'Usha', 'Savita', 'Asha', 'Swati', 'Kavya', 'Anita', 'Nisha', 'Jyoti', 'Komal', 'Maya', 'Seema', 'Rekha', 'Kusum', 'Dev', 'Raj', 'Kabir', 'Akshay', 'Manoj', 'Dilip', 'Kamal', 'Pran', 'Amrish', 'Prem', 'Shashi', 'Dharmendra', 'Jeetendra', 'Vinod', 'Kishore', 'Mukesh', 'Lalit', 'Sunil', 'Anupam', 'Paresh', 'Naseer', 'Om', 'Boman', 'Pankaj', 'Nawaz', 'KayKay', 'Rajpal', 'Saurabh', 'Ashutosh', 'Jaideep', 'Gajraj', 'Neena', 'Ratna', 'Supriya'
  ];

  const lastNames = [
    'Sharma', 'Verma', 'Gupta', 'Patel', 'Mehta', 'Singh', 'Kumar', 'Joshi', 'Shah', 'Trivedi', 'Iyer', 'Reddy', 'Nair', 'Pillai', 'Rao', 'Choudhury', 'Bose', 'Mukherjee', 'Chatterjee', 'Sen', 'Das', 'Roy', 'Banerjee', 'Mishra', 'Pandey', 'Dubey', 'Tripathi', 'Tiwari', 'Shukla', 'Yadav', 'Sinha', 'Prasad', 'Sahay', 'Ketan', 'Bhatt', 'Vyas', 'Parekh', 'Desai', 'Sanghvi', 'Merchant', 'Chawla', 'Sethi', 'Malhotra', 'Kapoor', 'Khanna', 'Anand', 'Chopra', 'Johar', 'Dutta', 'Sarkar', 'Gill', 'Dhillon', 'Sandhu', 'Sidhu', 'Grewal', 'Sodhi', 'Garg', 'Bansal', 'Goel', 'Mittal'
  ];

  const borrowers: Borrower[] = [];
  const seedRandom = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash % 1000) / 1000;
  };

  for (let i = 0; i < 120; i++) {
    const id = `B-${1001 + i}`;
    const nameSeed = id + i;
    const r1 = seedRandom(nameSeed + 'r1');
    const r2 = seedRandom(nameSeed + 'r2');
    const r3 = seedRandom(nameSeed + 'r3');
    const r4 = seedRandom(nameSeed + 'r4');

    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[(i * 3) % lastNames.length];
    const name = `${firstName} ${lastName}`;

    const age = Math.floor(21 + r1 * 55);
    
    // Core Risk Factor: underlying credit quality (0 = perfect credit, 1 = high risk / prone to default)
    // We base it on age, plus some random noise
    const latentRisk = Math.max(0, Math.min(1, 0.5 - (age - 35) / 120 + (r2 - 0.5) * 0.7));

    // Generate correlated financial attributes based on latent risk
    // Income: higher latent risk tends to correspond to lower income, with noise (in INR, average retail loan applicants)
    const annualIncomeRaw = 300000 + (1 - latentRisk) * 2200000 + (r3 - 0.5) * 800000;
    const annualIncome = Math.round(Math.max(180000, Math.min(4500000, annualIncomeRaw)) / 10000) * 10000;

    // Debt-To-Income (DTI)%: higher risk corresponds to higher DTI
    const dtiRaw = 10 + latentRisk * 35 + (r4 - 0.5) * 18;
    const dti = Math.round(Math.max(2, Math.min(65, dtiRaw)) * 10) / 10;

    // Credit Limit and Balance -> Credit Card Utilization (Indian limits: ₹15,000 to ₹15 Lakhs)
    const baseLimit = (annualIncome * 0.35) * (0.4 + (1 - latentRisk) * 0.6);
    const creditLimit = Math.round(Math.max(20000, Math.min(1500000, baseLimit)) / 5000) * 5000;
    
    // Credit utilization rate: higher latent risk -> higher utilization
    const utilNoise = seedRandom(nameSeed + 'util');
    const rawUtil = Math.max(0, Math.min(1, latentRisk * 0.85 + (utilNoise - 0.4) * 0.3));
    const balance = Math.round(creditLimit * rawUtil);
    const creditUtilRate = Math.round((balance / creditLimit) * 1000) / 10;

    // Credit history age (years)
    const histNoise = seedRandom(nameSeed + 'hist');
    const creditHistoryYears = Math.max(1, Math.floor((age - 18) * (0.3 + (1 - latentRisk) * 0.6) + histNoise * 3));

    // Non-payment count (late payments in last 2 years)
    const lateNoise = seedRandom(nameSeed + 'late');
    let latePayments = 0;
    if (latentRisk > 0.45) {
      latePayments = Math.floor(latentRisk * 4.5 + lateNoise * 2);
    }

    // Inquiries in last 6 months
    const inqNoise = seedRandom(nameSeed + 'inq');
    let inquiries = Math.floor(latentRisk * 3.5 + inqNoise * 1.5);
    inquiries = Math.max(0, inquiries);

    // Loan details (Typical retail/personal loan sizes: ₹50,000 to ₹30 Lakhs)
    const loanNoise = seedRandom(nameSeed + 'loan');
    const loanAmountRaw = (annualIncome * 0.6) * (0.6 + loanNoise * 1.2);
    const loanAmount = Math.round(Math.max(50000, Math.min(3000000, loanAmountRaw)) / 10000) * 10000;

    // LTV (Loan-To-Value) Ratio: loan amount vs underlying asset value (or mock asset value)
    // Higher risk -> higher LTV ratio
    const ltvNoise = seedRandom(nameSeed + 'ltv');
    const ltvRaw = 55 + latentRisk * 35 + (ltvNoise - 0.5) * 20;
    const ltv = Math.round(Math.max(30, Math.min(105, ltvRaw)));

    // Assign actual default status based on simple threshold with randomness
    // Probability of defaulting is mathematically dependent on latentRisk
    const defaultProb = Math.min(0.98, Math.max(0.01, 
      1 / (1 + Math.exp(-(latentRisk - 0.58) * 8.0))
    ));
    const actualDefault = seedRandom(nameSeed + 'outcome') < defaultProb ? 1 : 0;

    borrowers.push({
      id,
      name,
      age,
      annualIncome,
      dti,
      creditLimit,
      balance,
      creditUtilRate,
      creditHistoryYears,
      latePayments,
      inquiries,
      loanAmount,
      ltv,
      actualDefault
    });
  }

  return borrowers;
}

// Convert a borrower's attributes to pd and credit score based on logistic regression parameters
export function evaluateBorrower(
  borrower: Omit<Borrower, 'predictedPD' | 'predictedScore' | 'riskCategory'>,
  coefs: ModelCoefficients,
  scoreParams: ScorecardParams
): { pd: number; score: number; riskCategory: 'Low' | 'Medium' | 'High' | 'Critical' } {
  
  // Transform variables. Feature engineering values:
  const x_income = borrower.annualIncome / 100000; // units of ₹100,000 (1 Lakh)
  const x_dti = borrower.dti; // raw %
  const x_utilization = borrower.creditUtilRate; // raw %
  const x_history = borrower.creditHistoryYears; // raw years
  const x_late = borrower.latePayments; // count
  const x_inquiries = borrower.inquiries; // count
  const x_ltv = borrower.ltv; // raw %

  // Calculate Z (Log-Odds of Default)
  // Z = intercept + coef1*X1 + coef2*X2 + ...
  const z = coefs.intercept
    + (coefs.income * x_income)
    + (coefs.dti * x_dti)
    + (coefs.utilization * x_utilization)
    + (coefs.historyYears * x_history)
    + (coefs.latePayments * x_late)
    + (coefs.inquiries * x_inquiries)
    + (coefs.ltv * x_ltv);

  // Probability of Default (PD) via Sigmoid
  const pd = 1 / (1 + Math.exp(-z));

  // Scale PD to Scorecard Points
  // Standard financial formula:
  // Odds (of being Good) = Good / Bad = (1 - PD) / PD
  // Score = Offset + Factor * ln(Odds)
  // Factor = PDO / ln(2)
  // Offset = Base Score - (Factor * ln(Base Odds))
  const factor = scoreParams.pdo / Math.log(2);
  const offset = scoreParams.baseScore - (factor * Math.log(scoreParams.baseOdds));

  // Avoid log(0) or division by zero errors by capping the odds
  const oddsGood = Math.max(0.0001, Math.min(99999, (1 - pd) / pd));
  let score = Math.round(offset + factor * Math.log(oddsGood));

  // Cap credit score between standard CIBIL ranges: 300 to 900
  if (score < 300) score = 300;
  if (score > 900) score = 900;

  // Determine Risk Category based on PD
  let riskCategory: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
  if (pd >= 0.35) {
    riskCategory = 'Critical';
  } else if (pd >= 0.15) {
    riskCategory = 'High';
  } else if (pd >= 0.05) {
    riskCategory = 'Medium';
  } else {
    riskCategory = 'Low';
  }

  return { pd, score, riskCategory };
}

// Compute PD and Scores for the entire dataset
export function computePredictions(
  dataset: Borrower[],
  coefs: ModelCoefficients,
  scoreParams: ScorecardParams
): Borrower[] {
  return dataset.map(borrower => {
    const { pd, score, riskCategory } = evaluateBorrower(borrower, coefs, scoreParams);
    return {
      ...borrower,
      predictedPD: pd,
      predictedScore: score,
      riskCategory
    };
  });
}

// Interactive Gradient Descent Solver to fit the Logistic Regression coefficients to the current dataset
export function fitLogisticRegression(
  dataset: Borrower[],
  initialCoefs: ModelCoefficients,
  iterations: number = 300,
  learningRate: number = 0.05
): ModelCoefficients {
  
  // Clean inputs
  const records = dataset.map(b => ({
    y: b.actualDefault,
    x: [
      1.0, // Intercept
      b.annualIncome / 100000, 
      b.dti, 
      b.creditUtilRate, 
      b.creditHistoryYears, 
      b.latePayments, 
      b.inquiries, 
      b.ltv
    ]
  }));

  // Standardize columns 1-7 for training stability, then project back to unstandardized coefs
  // This makes sure gradient descent converges instantly (within milliseconds!)
  const N = records.length;
  const numFeatures = 8; // Including intercept

  const means = Array(numFeatures).fill(0);
  const stds = Array(numFeatures).fill(1);

  // Compute means
  for (let f = 1; f < numFeatures; f++) {
    let sum = 0;
    for (let i = 0; i < N; i++) {
      sum += records[i].x[f];
    }
    means[f] = sum / N;
  }

  // Compute standard deviations
  for (let f = 1; f < numFeatures; f++) {
    let varianceSum = 0;
    for (let i = 0; i < N; i++) {
      varianceSum += Math.pow(records[i].x[f] - means[f], 2);
    }
    stds[f] = Math.sqrt(varianceSum / N) || 1.0;
  }

  // Normalize data for training
  const normalizedRecords = records.map(r => {
    const normalizedX = [...r.x];
    for (let f = 1; f < numFeatures; f++) {
      normalizedX[f] = (r.x[f] - means[f]) / stds[f];
    }
    return { y: r.y, x: normalizedX };
  });

  // Initialize weights for normalized variables
  const w = Array(numFeatures).fill(0);
  // Set slight smart initializations
  w[0] = -1.0; // Moderate base default probability
  w[1] = -0.5; // Income
  w[2] = 0.5;  // DTI
  w[3] = 0.5;  // Utilization
  w[4] = -0.5; // Credit history age
  w[5] = 0.8;  // Late payments
  w[6] = 0.4;  // Inquiries
  w[7] = 0.5;  // LTV

  // Run Batch Gradient Descent
  for (let iter = 0; iter < iterations; iter++) {
    const gradients = Array(numFeatures).fill(0);

    for (let i = 0; i < N; i++) {
      const x = normalizedRecords[i].x;
      const y = normalizedRecords[i].y;

      // Predicted default prob
      let z = 0;
      for (let f = 0; f < numFeatures; f++) {
        z += w[f] * x[f];
      }
      const p = 1.0 / (1.0 + Math.exp(-z));
      const error = p - y;

      for (let f = 0; f < numFeatures; f++) {
        gradients[f] += error * x[f];
      }
    }

    // Update weights
    for (let f = 0; f < numFeatures; f++) {
      w[f] -= (learningRate * gradients[f]) / N;
    }
  }

  // Now, un-normalize coefficients to project back map on natural values
  // Since normalized_X_f = (X_f - mean_f)/std_f
  // Z = w_0 + sum_{f>=1} ( w_f * (X_f - mean_f) / std_f )
  // Z = ( w_0 - sum_{f>=1} (w_f * mean_f / std_f) ) + sum_{f>=1} ( (w_f / std_f) * X_f )
  // So:
  // Decoupled Intercept = w_0 - sum_{f>=1} (w_f * mean_f / std_f)
  // Decoupled Coefficient f = w_f / std_f

  let interceptUnnorm = w[0];
  for (let f = 1; f < numFeatures; f++) {
    interceptUnnorm -= (w[f] * means[f]) / stds[f];
  }

  const coefs: ModelCoefficients = {
    intercept: Math.round(interceptUnnorm * 1000) / 1000,
    income: Math.round((w[1] / stds[1]) * 1000) / 1000,
    dti: Math.round((w[2] / stds[2]) * 1000) / 1000,
    utilization: Math.round((w[3] / stds[3]) * 1000) / 1000,
    historyYears: Math.round((w[4] / stds[4]) * 1000) / 1000,
    latePayments: Math.round((w[5] / stds[5]) * 1000) / 1000,
    inquiries: Math.round((w[6] / stds[6]) * 1000) / 1000,
    ltv: Math.round((w[7] / stds[7]) * 1000) / 1000,
  };

  return coefs;
}

// Calculate ROC point coordinates and AUC (Area Under Curve)
export function calculateROCAndAUC(datasetWithPreds: Borrower[], scoreParams: ScorecardParams): { points: ROCPoint[], auc: number, gini: number } {
  // Sort dataset by PD descending (or credit score ascending, which is equivalent for risk ranks)
  const sorted = [...datasetWithPreds].sort((a, b) => (b.predictedPD || 0) - (a.predictedPD || 0));
  
  const totalPos = sorted.filter(b => b.actualDefault === 1).length;
  const totalNeg = sorted.filter(b => b.actualDefault === 0).length;

  if (totalPos === 0 || totalNeg === 0) {
    return { points: [], auc: 0.5, gini: 0 };
  }

  const points: ROCPoint[] = [{ fpr: 0, tpr: 0, threshold: 1.0, cutoffScore: 900 }];
  
  let currentTP = 0;
  let currentFP = 0;
  let accumulatedArea = 0;
  let lastFPR = 0;

  for (let i = 0; i < sorted.length; i++) {
    const record = sorted[i];
    if (record.actualDefault === 1) {
      currentTP++;
    } else {
      currentFP++;
    }

    const fpr = currentFP / totalNeg;
    const tpr = currentTP / totalPos;
    const threshold = record.predictedPD || 0;
    const cutoffScore = record.predictedScore || 300;

    // Numerical integration for AUC using trapezoidal rule
    // area = (fpr - lastFPR) * (tpr + lastTPR) / 2
    if (fpr !== lastFPR) {
      const lastTPR = points[points.length - 1].tpr;
      accumulatedArea += (fpr - lastFPR) * (tpr + lastTPR) / 2;
      lastFPR = fpr;
    }

    points.push({ fpr, tpr, threshold, cutoffScore });
  }

  // Cap at final standard bounds
  if (lastFPR < 1.0) {
    accumulatedArea += (1.0 - lastFPR) * (1.0 + points[points.length - 1].tpr) / 2;
    points.push({ fpr: 1.0, tpr: 1.0, threshold: 0.0, cutoffScore: 300 });
  }

  const auc = Math.round(accumulatedArea * 1000) / 1000;
  const gini = Math.round((2 * auc - 1) * 1000) / 1000;

  // Downsample to ~25 points for concise chart rendering if needed, but keeping actual curves beautiful
  return { points, auc, gini };
}

// Compute Threshold Metrics (TP, FP, TN, FN, Accuracy, Precision, Recall, F1)
export function computeThresholdMetrics(datasetWithPreds: Borrower[], threshold: number): ThresholdMetrics {
  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;

  datasetWithPreds.forEach(b => {
    const pd = b.predictedPD || 0;
    const predicted = pd >= threshold ? 1 : 0;
    const actual = b.actualDefault;

    if (predicted === 1 && actual === 1) tp++;
    else if (predicted === 1 && actual === 0) fp++;
    else if (predicted === 0 && actual === 0) tn++;
    else if (predicted === 0 && actual === 1) fn++;
  });

  const total = datasetWithPreds.length;
  const accuracy = total > 0 ? (tp + tn) / total : 0;
  const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
  const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
  const f1 = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

  return {
    threshold,
    tp,
    fp,
    tn,
    fn,
    accuracy: Math.round(accuracy * 1000) / 1000,
    precision: Math.round(precision * 1000) / 1000,
    recall: Math.round(recall * 1000) / 1000,
    f1: Math.round(f1 * 1000) / 1000
  };
}

// Perform simple WoE (Weight of Evidence) and IV (Information Value) analytics for variable discretization
// Let's implement IV to show the predictive power of variables:
// WoE = ln( % Good / % Bad )
// IV = sum ( (% Good - % Bad) * WoE )
export function calculateVariableWoEAndIV(dataset: Borrower[], variableName: 'creditUtilRate' | 'dti' | 'annualIncome' | 'latePayments'): { bins: any[], totalIV: number, predictivePower: string } {
  let bins: any[] = [];
  
  const badsTotal = dataset.filter(b => b.actualDefault === 1).length;
  const goodsTotal = dataset.filter(b => b.actualDefault === 0).length;

  if (variableName === 'creditUtilRate') {
    bins = [
      { label: '0% to 15% (Very Low)', min: 0, max: 15 },
      { label: '15% to 40% (Low)', min: 15, max: 40 },
      { label: '40% to 70% (Medium)', min: 40, max: 70 },
      { label: '70% to 100%+ (High)', min: 70, max: Infinity }
    ];
  } else if (variableName === 'dti') {
    bins = [
      { label: 'Under 15% (Low)', min: 0, max: 15 },
      { label: '15% to 30% (Medium)', min: 15, max: 30 },
      { label: '30% to 45% (High)', min: 30, max: 45 },
      { label: '45%+ (Extreme)', min: 45, max: Infinity }
    ];
  } else if (variableName === 'annualIncome') {
    bins = [
      { label: 'Under ₹5,00,000', min: 0, max: 500000 },
      { label: '₹5L to ₹12L', min: 500000, max: 1200000 },
      { label: '₹12L to ₹25L', min: 1200000, max: 2500000 },
      { label: '₹25L+', min: 2500000, max: Infinity }
    ];
  } else { // latePayments
    bins = [
      { label: '0 Late Payments', min: 0, max: 0.5 },
      { label: '1 Late Payment', min: 0.5, max: 1.5 },
      { label: '2-3 Late Payments', min: 1.5, max: 3.5 },
      { label: '4+ Late Payments', min: 3.5, max: Infinity }
    ];
  }

  const processedBins = bins.map(bin => {
    // Get values based on variable
    const filtered = dataset.filter(b => {
      let val = 0;
      if (variableName === 'creditUtilRate') val = b.creditUtilRate;
      else if (variableName === 'dti') val = b.dti;
      else if (variableName === 'annualIncome') val = b.annualIncome;
      else if (variableName === 'latePayments') val = b.latePayments;

      return val >= bin.min && val < bin.max;
    });

    const totalCount = filtered.length;
    const bads = filtered.filter(b => b.actualDefault === 1).length;
    const goods = totalCount - bads;

    // Avoid 0 in counts to prevent ln(0) errors (LaPlace-like smoothing)
    const adjGoods = goods || 0.5;
    const adjBads = bads || 0.5;

    const marginGoodObserved = adjGoods / (goodsTotal || 1);
    const marginBadObserved = adjBads / (badsTotal || 1);

    const woe = Math.log(marginGoodObserved / marginBadObserved);
    const ivContribution = (marginGoodObserved - marginBadObserved) * woe;

    return {
      binName: bin.label,
      totalCount,
      goodCount: goods,
      badCount: bads,
      goodRate: totalCount > 0 ? goods / totalCount : 0,
      badRate: totalCount > 0 ? bads / totalCount : 0,
      woe: Math.round(woe * 1000) / 1000,
      iv: Math.max(0, Math.round(ivContribution * 1000) / 1000)
    };
  });

  const totalIV = processedBins.reduce((sum, b) => sum + b.iv, 0);

  let predictivePower = 'Uninformative';
  if (totalIV >= 0.3) {
    predictivePower = 'Strong Predictor';
  } else if (totalIV >= 0.1) {
    predictivePower = 'Medium Predictor';
  } else if (totalIV >= 0.02) {
    predictivePower = 'Weak Predictor';
  }

  return {
    bins: processedBins,
    totalIV: Math.round(totalIV * 1000) / 1000,
    predictivePower
  };
}
