import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ShieldCheck, HelpCircle, ArrowUpRight, ArrowDownRight, RefreshCcw } from 'lucide-react';
import { evaluateBorrower } from '../utils/creditModel';
import { ModelCoefficients, ScorecardParams, Borrower } from '../types';

interface BorrowerFormProps {
  coefs: ModelCoefficients;
  scoreParams: ScorecardParams;
  onNewPrediction?: (borrower: Omit<Borrower, 'id'> & { id?: string }) => void;
}

export default function BorrowerForm({ coefs, scoreParams, onNewPrediction }: BorrowerFormProps) {
  // Form State
  const [name, setName] = useState('Arjun Sharma');
  const [age, setAge] = useState(36);
  const [income, setIncome] = useState(1200000);
  const [creditLimit, setCreditLimit] = useState(300000);
  const [creditBalance, setCreditBalance] = useState(35000);
  const [dti, setDti] = useState(22.5);
  const [historyYears, setHistoryYears] = useState(12);
  const [latePayments, setLatePayments] = useState(0);
  const [inquiries, setInquiries] = useState(1);
  const [loanAmount, setLoanAmount] = useState(500000);
  const [ltv, setLtv] = useState(70);

  // Computed state (Feature Engineering)
  const [utilization, setUtilization] = useState(11.7);

  // Scorecard Outputs
  const [calculatedPD, setCalculatedPD] = useState(0.015);
  const [creditScore, setCreditScore] = useState(742);
  const [riskCategory, setRiskCategory] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Low');

  // Perform dynamic feature engineering: Utilization = (Balance / Limit) * 100
  useEffect(() => {
    if (creditLimit > 0) {
      const util = (creditBalance / creditLimit) * 100;
      setUtilization(Math.round(util * 10) / 10);
    } else {
      setUtilization(0);
    }
  }, [creditBalance, creditLimit]);

  // Recalculate credit score every time inputs or parameters change
  useEffect(() => {
    const tempBorrower = {
      id: 'SANDBOX',
      name,
      age,
      annualIncome: income,
      dti,
      creditLimit,
      balance: creditBalance,
      creditUtilRate: utilization,
      creditHistoryYears: historyYears,
      latePayments,
      inquiries,
      loanAmount,
      ltv,
      actualDefault: 0 // Mock actual default for sandbox evaluation
    };

    const result = evaluateBorrower(tempBorrower, coefs, scoreParams);
    setCalculatedPD(result.pd);
    setCreditScore(result.score);
    setRiskCategory(result.riskCategory);
  }, [name, age, income, creditLimit, creditBalance, utilization, dti, historyYears, latePayments, inquiries, loanAmount, ltv, coefs, scoreParams]);

  // Handler for presets
  const loadPreset = (type: 'prime' | 'subprime' | 'medium') => {
    if (type === 'prime') {
      setName('Priya Patel');
      setAge(45);
      setIncome(2400000);
      setCreditLimit(800000);
      setCreditBalance(15000);
      setDti(11.8);
      setHistoryYears(18);
      setLatePayments(0);
      setInquiries(0);
      setLoanAmount(1000000);
      setLtv(55);
    } else if (type === 'subprime') {
      setName('Amit Verma');
      setAge(24);
      setIncome(360000);
      setCreditLimit(40000);
      setCreditBalance(38000);
      setDti(52.4);
      setHistoryYears(2);
      setLatePayments(3);
      setInquiries(5);
      setLoanAmount(200000);
      setLtv(98);
    } else {
      setName('Vikram Joshi');
      setAge(31);
      setIncome(720000);
      setCreditLimit(150000);
      setCreditBalance(65000);
      setDti(34.2);
      setHistoryYears(7);
      setLatePayments(1);
      setInquiries(2);
      setLoanAmount(300000);
      setLtv(82);
    }
  };

  // Log simulation to the portfolio table
  const handleSaveToPortfolio = () => {
    if (onNewPrediction) {
      onNewPrediction({
        name,
        age,
        annualIncome: income,
        dti,
        creditLimit,
        balance: creditBalance,
        creditUtilRate: utilization,
        creditHistoryYears: historyYears,
        latePayments,
        inquiries,
        loanAmount,
        ltv,
        actualDefault: calculatedPD > 0.4 ? 1 : 0, // Mock outcome prediction
        predictedPD: calculatedPD,
        predictedScore: creditScore,
        riskCategory
      });
    }
  };

  // Helper properties for Scorecard breakdown
  // Traditional credit score: Points = Offset/features values representing the raw breakdown of inputs
  // We can calculate points contribution of each feature to show the scorecard math
  // Points_k = (coef_k / factor) * input_k
  // Points = intercept_points + features_points
  const factor = scoreParams.pdo / Math.log(2);
  const offset = scoreParams.baseScore - (factor * Math.log(scoreParams.baseOdds));
  
  // Map feature value onto coefficients to demonstrate mathematical weights in the score:
  const mathBreakdown = [
    {
      label: 'Annual Income',
      value: `₹${income.toLocaleString('en-IN')}`,
      impact: -(coefs.income * (income / 100000) * factor),
      higherIsBetter: true,
      desc: 'Sufficient income improves debt service capability.'
    },
    {
      label: 'Debt-to-Income (DTI)',
      value: `${dti}%`,
      impact: -(coefs.dti * dti * factor),
      higherIsBetter: false,
      desc: 'Ratio of fixed debt payments to pre-tax income.'
    },
    {
      label: 'Credit Utilization Rate',
      value: `${utilization}%`,
      impact: -(coefs.utilization * utilization * factor),
      higherIsBetter: false,
      desc: 'Credit usage speed. Low rates indicate conservative borrowing.'
    },
    {
      label: 'Age of Credit History',
      value: `${historyYears} yrs`,
      impact: -(coefs.historyYears * historyYears * factor),
      higherIsBetter: true,
      desc: 'Seasoned trade lines show a long billing reputation.'
    },
    {
      label: 'Late Payments Count',
      value: latePayments,
      impact: -(coefs.latePayments * latePayments * factor),
      higherIsBetter: false,
      desc: 'Direct delinquency count, highly damaging to FICO.'
    },
    {
      label: 'Recent Credit Inquiries',
      value: inquiries,
      impact: -(coefs.inquiries * inquiries * factor),
      higherIsBetter: false,
      desc: 'Velocity of credit requests indicates seeking liquidity.'
    },
    {
      label: 'Loan-to-Value (LTV) Ratio',
      value: `${ltv}%`,
      impact: -(coefs.ltv * ltv * factor),
      higherIsBetter: false,
      desc: 'The size of the loan compared to collateral value.'
    }
  ];

  const getMeterColor = (cat: string) => {
    switch (cat) {
      case 'Low': return 'border-emerald-500 text-emerald-600 bg-emerald-50/50';
      case 'Medium': return 'border-amber-400 text-amber-600 bg-amber-50/50';
      case 'High': return 'border-orange-500 text-orange-600 bg-orange-50/50';
      case 'Critical': return 'border-rose-500 text-rose-600 bg-rose-50/50';
      default: return 'border-indigo-500 text-indigo-600';
    }
  };

  const getCircleBarColor = (pd: number) => {
    if (pd < 0.05) return 'stroke-emerald-500 text-emerald-500';
    if (pd < 0.15) return 'stroke-amber-500 text-amber-500';
    if (pd < 0.35) return 'stroke-orange-500 text-orange-500';
    return 'stroke-rose-600 text-rose-600';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="underwriting-sandbox">
      {/* Input panel */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
              Borrower Underwriting Sandbox
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Configure parameters to calculate score and default probabilities in real-time.
            </p>
          </div>
          <div className="flex bg-slate-50 border border-slate-200/60 p-1 rounded-lg gap-1">
            <button
              onClick={() => loadPreset('prime')}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-xs cursor-pointer transition-colors"
            >
              Prime
            </button>
            <button
              onClick={() => loadPreset('medium')}
              className="px-2.5 py-1 text-xs font-semibold rounded-md hover:bg-white text-slate-600 cursor-pointer transition-colors"
            >
              Medium
            </button>
            <button
              onClick={() => loadPreset('subprime')}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-50 hover:bg-rose-100/70 border border-rose-100 text-rose-700 cursor-pointer transition-colors"
            >
              Subprime
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* General info */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 flex items-center justify-between">
              Borrower Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:border-indigo-400 focus:outline-hidden text-slate-800 font-medium bg-slate-50/50 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 flex items-center justify-between">
              Age (Years) <span>{age} yrs</span>
            </label>
            <input
              type="range"
              min={18}
              max={85}
              value={age}
              onChange={(e) => setAge(parseInt(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 flex items-center justify-between">
              Annual Income (₹) <span>₹{income.toLocaleString('en-IN')}</span>
            </label>
            <input
              type="range"
              min={120000}
              max={3600000}
              step={10000}
              value={income}
              onChange={(e) => setIncome(parseInt(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 flex items-center justify-between">
              Debt-to-Income (DTI)% <span>{dti}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={80}
              step={0.5}
              value={dti}
              onChange={(e) => setDti(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 flex items-center justify-between">
              Credit Card Limit (₹) <span>₹{creditLimit.toLocaleString('en-IN')}</span>
            </label>
            <input
              type="range"
              min={10000}
              max={1200000}
              step={5000}
              value={creditLimit}
              onChange={(e) => setCreditLimit(parseInt(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 flex items-center justify-between">
              Credit Balance (₹) <span>₹{creditBalance.toLocaleString('en-IN')}</span>
            </label>
            <input
              type="range"
              min={0}
              max={creditLimit}
              step={1000}
              value={creditBalance}
              onChange={(e) => setCreditBalance(parseInt(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div className="md:col-span-2 bg-indigo-50/50 rounded-xl px-4 py-3 border border-indigo-100 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-indigo-600 block">Engineered Feature: Credit Utilization Rate</span>
              <p className="text-xs text-slate-500">Balance (₹{creditBalance.toLocaleString('en-IN')}) / Limit (₹{creditLimit.toLocaleString('en-IN')})</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-extrabold text-indigo-700 font-sans">{utilization}%</span>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 ml-2 rounded-full leading-none inline-block ${utilization < 30 ? 'bg-emerald-100 text-emerald-800' : utilization < 75 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                {utilization < 30 ? 'Healthy' : utilization < 75 ? 'Warning' : 'Over-Leveraged'}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 flex items-center justify-between">
              Credit History Age (Years) <span>{historyYears} yrs</span>
            </label>
            <input
              type="range"
              min={1}
              max={40}
              value={historyYears}
              onChange={(e) => setHistoryYears(parseInt(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 flex items-center justify-between">
              Late Payments Count <span>{latePayments} late</span>
            </label>
            <input
              type="range"
              min={0}
              max={10}
              value={latePayments}
              onChange={(e) => setLatePayments(parseInt(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 flex items-center justify-between">
              Inquiries last 6 months <span>{inquiries} times</span>
            </label>
            <input
              type="range"
              min={0}
              max={12}
              value={inquiries}
              onChange={(e) => setInquiries(parseInt(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 flex items-center justify-between">
              Loan Amount Request (₹) <span>₹{loanAmount.toLocaleString('en-IN')}</span>
            </label>
            <input
              type="range"
              min={50000}
              max={2500000}
              step={10000}
              value={loanAmount}
              onChange={(e) => setLoanAmount(parseInt(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-bold text-slate-500 flex items-center justify-between">
              Loan-to-Collateral-Value (LTV) Ratio <span>{ltv}%</span>
            </label>
            <input
              type="range"
              min={20}
              max={120}
              value={ltv}
              onChange={(e) => setLtv(parseInt(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
          <p className="text-xs text-slate-400">
            *Outputs dynamically calibrate based on current regression parameters.
          </p>
          <button
            onClick={handleSaveToPortfolio}
            className="px-4 py-2.5 text-xs font-bold rounded-lg border border-indigo-600 bg-indigo-600 hover:bg-indigo-700 hover:border-indigo-700 text-white cursor-pointer shadow-xs transition-all flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-4 h-4" />
            Append to Portfolio List
          </button>
        </div>
      </div>

      {/* Credit Decision Engine Scorecard */}
      <div className="lg:col-span-5 space-y-6">
        {/* Output score display */}
        <div className="bg-slate-950 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-6 relative overflow-hidden">
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-20 pointer-events-none"></div>

          <div className="relative flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-indigo-400 font-extrabold uppercase text-[10px] tracking-widest block">Standard Credit Scorecard</span>
              <h4 className="text-base font-bold text-slate-200">Scoring Engine Results</h4>
            </div>
            <div className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${getMeterColor(riskCategory)} shadow-xs`}>
              {riskCategory} Risk
            </div>
          </div>

          <div className="relative flex flex-col items-center justify-center py-4 space-y-4">
            {/* Speedometer Gauge/Circle */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-slate-800 fill-none"
                  strokeWidth="8"
                />
                {/* Colored Track representing standard score representation */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className={`fill-none ${getCircleBarColor(calculatedPD)} transition-all duration-700`}
                  strokeWidth="8"
                  strokeDasharray={`${((creditScore - 300) / 600) * 263} 263`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center z-10 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Score</span>
                <div className="text-4xl font-extrabold font-sans text-white leading-none">{creditScore}</div>
                <p className="text-[10px] text-slate-500 font-bold">CIBIL Equivalent (300-900)</p>
              </div>
            </div>

            {/* Probability of Default Hazard Bar */}
            <div className="w-full space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-300">
                <span>Probability of Default (PD)</span>
                <span className="font-mono text-indigo-400 font-black">
                  {(calculatedPD * 100).toFixed(2)}%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 leading-none ${
                    calculatedPD < 0.05 ? 'bg-emerald-500' :
                    calculatedPD < 0.15 ? 'bg-amber-400' :
                    calculatedPD < 0.35 ? 'bg-orange-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${calculatedPD * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                <span>Safe ({'<'} 5%)</span>
                <span>Subprime ({'>'} 35%)</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-4 grid grid-cols-2 gap-4 text-center">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Log-Odds (Z)</span>
              <p className="text-sm font-semibold font-mono text-slate-200">
                {Math.log(calculatedPD / (1 - calculatedPD)).toFixed(3)}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Base Odds Scaled</span>
              <p className="text-sm font-semibold font-mono text-slate-200">
                {((1 - calculatedPD) / calculatedPD).toFixed(1)} : 1 Good
              </p>
            </div>
          </div>
        </div>

        {/* Score Breakdown Analysis */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Scorecard Breakdown (Attribute Weights)
          </h4>
          <p className="text-xs text-slate-500">
            How individual attributes scaled relative to base odds coefficients:
          </p>

          <div className="space-y-3">
            {mathBreakdown.map((item, index) => {
              const impactPoints = Math.round(item.impact);
              const isPositive = impactPoints >= 0;
              
              return (
                <div key={index} className="flex items-start justify-between text-xs border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
                  <div className="space-y-0.5 max-w-[70%]">
                    <span className="font-semibold text-slate-700 block">{item.label}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Value: {item.value}</span>
                    <p className="text-[10px] text-slate-400 leading-tight">{item.desc}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`font-mono font-bold text-xs inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm ${
                      isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                    }`}>
                      {isPositive ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                      {isPositive ? '+' : ''}{impactPoints} pts
                    </span>
                    <span className="block text-[9px] text-slate-400/90 font-medium mt-1">
                      {isPositive ? 'Decreases PD' : 'Increases PD'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
