import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sliders, RefreshCcw, HelpCircle, BarChart2, Info, CheckCircle2, TrendingUp } from 'lucide-react';
import { calculateVariableWoEAndIV } from '../utils/creditModel';
import { ModelCoefficients, ScorecardParams, Borrower } from '../types';

interface ScorecardCalibrationProps {
  coefs: ModelCoefficients;
  setCoefs: React.Dispatch<React.SetStateAction<ModelCoefficients>>;
  scoreParams: ScorecardParams;
  setScoreParams: React.Dispatch<React.SetStateAction<ScorecardParams>>;
  onFitModel: () => void;
  dataset: Borrower[];
}

export default function ScorecardCalibration({
  coefs,
  setCoefs,
  scoreParams,
  setScoreParams,
  onFitModel,
  dataset
}: ScorecardCalibrationProps) {
  // WoE Viewer Variable Selection
  const [selectedWoeVar, setSelectedWoeVar] = useState<'creditUtilRate' | 'dti' | 'annualIncome' | 'latePayments'>('creditUtilRate');
  const [woeData, setWoeData] = useState<any>({ bins: [], totalIV: 0, predictivePower: 'Uninformative' });

  // Load WoE stats
  useEffect(() => {
    const stats = calculateVariableWoEAndIV(dataset, selectedWoeVar);
    setWoeData(stats);
  }, [selectedWoeVar, dataset]);

  // Handle coefficient adjustments
  const handleCoefChange = (key: keyof ModelCoefficients, value: number) => {
    setCoefs(prev => ({
      ...prev,
      [key]: Math.round(value * 1000) / 1000
    }));
  };

  // Handle scorecard scaling adjustments
  const handleScaleParamChange = (key: keyof ScorecardParams, value: number) => {
    setScoreParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Human readable variables
  const getVarLabel = (v: string) => {
    switch (v) {
      case 'creditUtilRate': return 'Credit Card Utilization (%)';
      case 'dti': return 'Debt-To-Income (DTI) (%)';
      case 'annualIncome': return 'Annual Income (₹)';
      case 'latePayments': return 'Delinquent Late Payments count';
      default: return 'Asset-backed Loan-to-Value (LTV) (%)';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="calibrator-panel">
      {/* Parameters Panel */}
      <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-500" />
              Logistic Regression Calibration
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Adjust linear log-odds coefficients (β) or trigger an automatic gradient descent optimization.
            </p>
          </div>
          <button
            onClick={onFitModel}
            className="px-3 py-1.5 text-xs font-bold font-sans rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-700 flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Iterative Fit
          </button>
        </div>

        {/* Coeffs parameters */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Model Coefficients</h4>
          
          <div className="space-y-3.5">
            {/* Intercept */}
            <div className="space-y-1 bg-slate-50 border border-slate-100/70 p-3 rounded-lg">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  Baseline Intercept <span className="font-mono text-indigo-500 font-extrabold text-[11px]">(β₀)</span>
                </span>
                <span className="font-mono text-indigo-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded-sm">{coefs.intercept}</span>
              </div>
              <input
                type="range"
                min={-10.0}
                max={5.0}
                step={0.1}
                value={coefs.intercept}
                onChange={(e) => handleCoefChange('intercept', parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <p className="text-[10px] text-slate-500">The baseline log-odds of defaulting when all other assets and parameters are zero.</p>
            </div>

            {/* Income Coeff */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  Annual Income Coeff (<span className="text-emerald-600 font-mono font-bold">β_income</span>)
                </span>
                <span className="font-mono text-slate-600 font-bold">{coefs.income}</span>
              </div>
              <input
                type="range"
                min={-3.0}
                max={0.5}
                step={0.05}
                value={coefs.income}
                onChange={(e) => handleCoefChange('income', parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <p className="text-[10px] text-slate-400 font-medium">Negative values signify higher earnings decrease risk. Units: per ₹1 Lakh annual index.</p>
            </div>

            {/* DTI Coeff */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  Debt-to-Income Coeff (<span className="text-red-500 font-mono font-bold">β_dti</span>)
                </span>
                <span className="font-mono text-slate-600 font-bold">{coefs.dti}</span>
              </div>
              <input
                type="range"
                min={-0.1}
                max={0.8}
                step={0.01}
                value={coefs.dti}
                onChange={(e) => handleCoefChange('dti', parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Utilization Coeff */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  Credit Card Utilization Coeff (Engineered Variable <span className="text-red-500 font-mono font-bold">β_util</span>)
                </span>
                <span className="font-mono text-slate-600 font-bold">{coefs.utilization}</span>
              </div>
              <input
                type="range"
                min={-0.1}
                max={0.8}
                step={0.01}
                value={coefs.utilization}
                onChange={(e) => handleCoefChange('utilization', parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Credit History Age Coeff */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  Credit History Age Coeff (<span className="text-emerald-600 font-mono font-bold">β_history</span>)
                </span>
                <span className="font-mono text-slate-600 font-bold">{coefs.historyYears}</span>
              </div>
              <input
                type="range"
                min={-1.5}
                max={0.1}
                step={0.02}
                value={coefs.historyYears}
                onChange={(e) => handleCoefChange('historyYears', parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Late Payment Coeff */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  Late Payments Coeff (<span className="text-red-500 font-mono font-bold">β_late</span>)
                </span>
                <span className="font-mono text-slate-600 font-bold">{coefs.latePayments}</span>
              </div>
              <input
                type="range"
                min={-0.2}
                max={2.5}
                step={0.05}
                value={coefs.latePayments}
                onChange={(e) => handleCoefChange('latePayments', parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Inquiries Coeff */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  Velocity Inquiries Coeff (<span className="text-red-500 font-mono font-bold">β_inq</span>)
                </span>
                <span className="font-mono text-slate-600 font-bold">{coefs.inquiries}</span>
              </div>
              <input
                type="range"
                min={-0.2}
                max={1.5}
                step={0.05}
                value={coefs.inquiries}
                onChange={(e) => handleCoefChange('inquiries', parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* LTV Coeff */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1">
                  Loan-to-Value (LTV) Coeff (<span className="text-red-500 font-mono font-bold">β_ltv</span>)
                </span>
                <span className="font-mono text-slate-600 font-bold">{coefs.ltv}</span>
              </div>
              <input
                type="range"
                min={-0.05}
                max={0.3}
                step={0.005}
                value={coefs.ltv}
                onChange={(e) => handleCoefChange('ltv', parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Scorecard Parameters */}
        <div className="border-t border-slate-100 pt-5 space-y-4">
          <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Scorecard Points Scaler (PDO Methods)</h4>
          <p className="text-[10px] text-slate-400 leading-tight">Translate standard default probabilities into consumer score ranges (CIBIL score analog).</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1 bg-slate-50 border border-slate-100/70 p-3 rounded-lg">
              <label className="text-[10px] font-bold text-slate-500 block">Base Score (Scale Lock)</label>
              <span className="text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 px-1 py-0.5 rounded-sm inline-block mb-1">{scoreParams.baseScore}</span>
              <input
                type="range"
                min={400}
                max={750}
                step={5}
                value={scoreParams.baseScore}
                onChange={(e) => handleScaleParamChange('baseScore', parseInt(e.target.value))}
                className="w-full h-1 bg-slate-200 rounded-lg accent-indigo-600"
              />
            </div>

            <div className="space-y-1 bg-slate-50 border border-slate-100/70 p-3 rounded-lg">
              <label className="text-[10px] font-bold text-slate-500 block">Points to Double Odds (PDO)</label>
              <span className="text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 px-1 py-0.5 rounded-sm inline-block mb-1">{scoreParams.pdo}</span>
              <input
                type="range"
                min={10}
                max={100}
                step={1}
                value={scoreParams.pdo}
                onChange={(e) => handleScaleParamChange('pdo', parseInt(e.target.value))}
                className="w-full h-1 bg-slate-200 rounded-lg accent-indigo-600"
              />
            </div>

            <div className="space-y-1 bg-slate-50 border border-slate-100/70 p-3 rounded-lg">
              <label className="text-[10px] font-bold text-slate-500 block">Base Odds (Good : Bad)</label>
              <span className="text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 px-1 py-0.5 rounded-sm inline-block mb-1">{scoreParams.baseOdds} : 1</span>
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={scoreParams.baseOdds}
                onChange={(e) => handleScaleParamChange('baseOdds', parseInt(e.target.value))}
                className="w-full h-1 bg-slate-200 rounded-lg accent-indigo-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Weight of Evidence Dashboard */}
      <div className="lg:col-span-6 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-5">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-500" />
              Weight of Evidence (WoE) Explorer
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Understand variable discretization and the predictive capacity of credit features.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">Select Variable for Analysis</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => setSelectedWoeVar('creditUtilRate')}
                className={`px-2 py-1.5 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                  selectedWoeVar === 'creditUtilRate'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                }`}
              >
                Credit Utilization
              </button>
              <button
                onClick={() => setSelectedWoeVar('dti')}
                className={`px-2 py-1.5 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                  selectedWoeVar === 'dti'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                }`}
              >
                Debt-to-Income (DTI)
              </button>
              <button
                onClick={() => setSelectedWoeVar('annualIncome')}
                className={`px-2 py-1.5 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                  selectedWoeVar === 'annualIncome'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                }`}
              >
                Annual Income
              </button>
              <button
                onClick={() => setSelectedWoeVar('latePayments')}
                className={`px-2 py-1.5 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                  selectedWoeVar === 'latePayments'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                    : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                }`}
              >
                Late Payments
              </button>
            </div>
          </div>

          {/* Predictor Power Display */}
          <div className="bg-slate-50/50 rounded-xl px-4 py-3.5 border border-slate-100 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase">Information Value (IV) metric</span>
              <p className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                This feature holds <span className="font-extrabold font-mono text-slate-800">{woeData.totalIV.toFixed(3)}</span> total IV.
              </p>
            </div>
            <div className={`px-2.5 py-1 rounded-sm text-[10px] uppercase font-bold tracking-wider ${
              woeData.predictivePower === 'Strong Predictor' ? 'bg-emerald-100 text-emerald-800' :
              woeData.predictivePower === 'Medium Predictor' ? 'bg-amber-100 text-amber-800' :
              'bg-slate-100 text-slate-800'
            }`}>
              {woeData.predictivePower}
            </div>
          </div>

          {/* Bins Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] font-sans">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold text-left">
                  <th className="pb-2">Discretized Range (Bin)</th>
                  <th className="pb-2 text-center">N Count</th>
                  <th className="pb-2 text-center">Obs Goods</th>
                  <th className="pb-2 text-center">Obs Bads</th>
                  <th className="pb-2 text-center">Default %</th>
                  <th className="pb-2 text-right">WoE Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-600">
                {woeData.bins.map((bin: any, index: number) => {
                  return (
                    <tr key={index}>
                      <td className="py-2.5 font-semibold text-slate-700">{bin.binName}</td>
                      <td className="py-2.5 text-center font-mono">{bin.totalCount}</td>
                      <td className="py-2.5 text-center font-mono text-emerald-600">{bin.goodCount}</td>
                      <td className="py-2.5 text-center font-mono text-rose-500">{bin.badCount}</td>
                      <td className="py-2.5 text-center font-mono font-medium">{(bin.badRate * 100).toFixed(1)}%</td>
                      <td className={`py-2.5 text-right font-mono font-bold ${
                        bin.woe >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {bin.woe >= 0 ? '+' : ''}{bin.woe.toFixed(3)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* WoE Explanation */}
          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex gap-2.5">
            <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <span className="text-xs font-bold text-indigo-900 block">Interpretation of Weight of Evidence (WoE)</span>
              <p className="text-[10px] text-slate-500 leading-normal">
                WoE indicates how much a specific bin's default likelihood differs from the overall population average. 
                A <strong>positive WoE</strong> means the group has <strong>lower risk (more goods)</strong>, contributing higher positive scorecard points.
                A <strong>negative WoE</strong> signals <strong>higher risk (more defaults)</strong>, leading to credit score deductions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
