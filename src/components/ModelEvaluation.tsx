import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, ReferenceLine, ReferenceDot } from 'recharts';
import { ShieldCheck, Target, Award, Play, AlertCircle, TrendingUp, HelpCircle } from 'lucide-react';
import { calculateROCAndAUC, computeThresholdMetrics } from '../utils/creditModel';
import { Borrower, ScorecardParams, ROCPoint, ThresholdMetrics } from '../types';

interface ModelEvaluationProps {
  dataset: Borrower[];
  scoreParams: ScorecardParams;
}

export default function ModelEvaluation({ dataset, scoreParams }: ModelEvaluationProps) {
  const [pdThreshold, setPdThreshold] = useState(0.15); // Default PD Cutoff at 15%

  // Compute ROC & AUC
  const rocResult = useMemo(() => {
    return calculateROCAndAUC(dataset, scoreParams);
  }, [dataset, scoreParams]);

  // Compute Threshold metrics
  const stats: ThresholdMetrics = useMemo(() => {
    return computeThresholdMetrics(dataset, pdThreshold);
  }, [dataset, pdThreshold]);

  // Calculate corresponding score cutoff
  // OddsGood = (1 - PD) / PD
  // Score = Offset + Factor * log(OddsGood)
  const scoreCutoff = useMemo(() => {
    const factor = scoreParams.pdo / Math.log(2);
    const offset = scoreParams.baseScore - (factor * Math.log(scoreParams.baseOdds));
    const oddsGood = Math.max(0.0001, Math.min(99999, (1 - pdThreshold) / pdThreshold));
    let s = Math.round(offset + factor * Math.log(oddsGood));
    if (s < 300) s = 300;
    if (s > 900) s = 900;
    return s;
  }, [pdThreshold, scoreParams]);

  // Calculate ROC point closest to selected threshold for visual highlight
  const activeROCPoint = useMemo(() => {
    if (!rocResult.points.length) return { fpr: 0, tpr: 0 };
    let bestPoint = rocResult.points[0];
    let minDiff = Math.abs(bestPoint.threshold - pdThreshold);
    
    for (let i = 1; i < rocResult.points.length; i++) {
      const diff = Math.abs(rocResult.points[i].threshold - pdThreshold);
      if (diff < minDiff) {
        minDiff = diff;
        bestPoint = rocResult.points[i];
      }
    }
    return bestPoint;
  }, [rocResult, pdThreshold]);

  // Compute Score Distribution buckets for population histogram
  const scoreDistribution = useMemo(() => {
    const buckets = [
      { range: '300-399', label: 'Very Poor', count: 0, good: 0, bad: 0 },
      { range: '400-499', label: 'Poor', count: 0, good: 0, bad: 0 },
      { range: '500-599', label: 'Fair', count: 0, good: 0, bad: 0 },
      { range: '600-699', label: 'Good', count: 0, good: 0, bad: 0 },
      { range: '700-799', label: 'Very Good', count: 0, good: 0, bad: 0 },
      { range: '800-900', label: 'Exceptional', count: 0, good: 0, bad: 0 },
    ];

    dataset.forEach(b => {
      const score = b.predictedScore || 300;
      let bucketIdx = 0;
      if (score >= 800) bucketIdx = 5;
      else if (score >= 700) bucketIdx = 4;
      else if (score >= 600) bucketIdx = 3;
      else if (score >= 500) bucketIdx = 2;
      else if (score >= 400) bucketIdx = 1;
      else bucketIdx = 0;

      buckets[bucketIdx].count++;
      if (b.actualDefault === 1) {
        buckets[bucketIdx].bad++;
      } else {
        buckets[bucketIdx].good++;
      }
    });

    return buckets;
  }, [dataset]);

  // Compute total approved/denied stats based on current threshold
  const portfolioApprovedCount = dataset.filter(b => (b.predictedPD || 0) < pdThreshold).length;
  const portfolioApprovedDefaultRate = useMemo(() => {
    const approvedList = dataset.filter(b => (b.predictedPD || 0) < pdThreshold);
    if (approvedList.length === 0) return 0;
    const defaults = approvedList.filter(b => b.actualDefault === 1).length;
    return (defaults / approvedList.length) * 100;
  }, [dataset, pdThreshold]);

  const approvalRate = (portfolioApprovedCount / (dataset.length || 1)) * 100;

  // Render labels for Confusion Matrix
  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start animate-fade-in" id="evaluation-view">
      {/* Visual Analytics Charts (ROC & Distribution) */}
      <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-500" />
            Model Predictive Diagnostics
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Review of key model accuracy signals: discrimination metrics (ROC curve) and risk distributions.
          </p>
        </div>

        {/* Charts Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ROC Area Chart */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">ROC Curve (TPR vs FPR)</span>
              <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-sm font-mono leading-none">
                AUC: {rocResult.auc.toFixed(3)} (Gini: {rocResult.gini.toFixed(2)})
              </span>
            </div>

            <div className="h-60 border border-slate-100/70 p-2 rounded-xl bg-slate-50/50">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={rocResult.points}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorOcr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="fpr" 
                    type="number" 
                    domain={[0, 1]} 
                    tickFormatter={(v) => v.toFixed(1)} 
                    label={{ value: 'False Positive Rate (1-Specificity)', position: 'insideBottom', offset: -5, size: 10, style: { fontSize: '10px', fill: '#94a3b8', fontWeight: 600 } }}
                    tick={{ fontSize: 9 }}
                  />
                  <YAxis 
                    dataKey="tpr" 
                    type="number" 
                    domain={[0, 1]} 
                    tickFormatter={(v) => v.toFixed(1)} 
                    label={{ value: 'True Positive Rate (Sensitivity)', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: '10px', fill: '#94a3b8', fontWeight: 600 } }}
                    tick={{ fontSize: 9 }}
                  />
                  <Tooltip
                    formatter={(val, name, props) => {
                      if (name === 'tpr') return [`${(Number(val) * 100).toFixed(1)}%`, 'True Positive Rate'];
                      if (name === 'fpr') return [`${(Number(val) * 100).toFixed(1)}%`, 'False Positive Rate'];
                      return [val, name];
                    }}
                    labelFormatter={(label) => `FPR: ${Number(label).toFixed(3)}`}
                  />
                  {/* Diagonal random selector */}
                  <ReferenceLine 
                    segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} 
                    stroke="#cbd5e1" 
                    strokeDasharray="4 4" 
                    strokeWidth={1.5}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="tpr" 
                    stroke="#4f46e5" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorOcr)" 
                  />
                  {/* Active dot highlight on the curve */}
                  {activeROCPoint && (
                    <ReferenceDot
                      x={activeROCPoint.fpr}
                      y={activeROCPoint.tpr}
                      r={5}
                      fill="#e11d48"
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Credit Score Distribution */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Score Distribution & Cutoff</span>
            <div className="h-60 border border-slate-100/70 p-2 rounded-xl bg-slate-50/50 relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={scoreDistribution}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorDistribution" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="range" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorDistribution)"
                    name="Borrowers Count"
                  />
                </AreaChart>
              </ResponsiveContainer>
              
              {/* Floating Overlay Line showing Credit Score Cut-off threshold */}
              <div className="absolute right-4 top-4 text-right bg-white/90 border border-slate-200 p-2 rounded-lg text-[10px] space-y-0.5 font-sans shadow-xs">
                <span className="text-rose-600 block font-bold text-left">&#9679; Active Cutoff Score: {scoreCutoff}</span>
                <p className="text-slate-500">Scores below this value are declined.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Underwriting Decisions KPIs */}
        <div className="border-t border-slate-100 pt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase">Approval Rate</span>
            <div className="text-xl font-extrabold text-slate-800">{approvalRate.toFixed(1)}%</div>
            <p className="text-[10px] text-slate-400 font-bold">{portfolioApprovedCount} / {dataset.length} approved</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase">Expected Approved Def. Rate</span>
            <div className={`text-xl font-extrabold ${portfolioApprovedDefaultRate > 10 ? 'text-red-600' : 'text-emerald-700'}`}>
              {portfolioApprovedDefaultRate.toFixed(1)}%
            </div>
            <p className="text-[10px] text-slate-400 font-bold">Incurred default risk of approved list</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase">Decisions Cutoff (PD)</span>
            <div className="text-xl font-extrabold text-indigo-700 font-mono">{(pdThreshold * 100).toFixed(0)}%</div>
            <p className="text-[10px] text-slate-400 font-bold">Standard score cut {scoreCutoff}</p>
          </div>
        </div>
      </div>

      {/* Decision threshold slider, Confusion Matrix % evaluation */}
      <div className="xl:col-span-5 space-y-6">
        {/* Threshold selection Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Award className="w-4.5 h-4.5 text-indigo-500" />
              Underwriting Tolerance Adjustment
            </h4>
            <p className="text-[11px] text-slate-500 leading-tight">
              Adjust the model's probability tolerance threshold to find the sweet spot between risk capture and loan approval volumes.
            </p>
          </div>

          <div className="space-y-2 bg-indigo-50/40 border border-indigo-100/60 p-4 rounded-xl">
            <div className="flex justify-between items-center text-xs font-bold text-indigo-900">
              <span>Decision Threshold (PD Limit)</span>
              <span className="font-mono text-sm font-black text-indigo-700">{(pdThreshold * 100).toFixed(1)}% PD</span>
            </div>
            <input
              type="range"
              min={0.02}
              max={0.80}
              step={0.01}
              value={pdThreshold}
              onChange={(e) => setPdThreshold(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-1 rounded-full bg-slate-200 appearance-none"
            />
            <div className="flex justify-between text-[9px] text-slate-400 leading-tight">
              <span>Strict Underwriting (High Approval bar)</span>
              <span>Lax Underwriting (High default exposure)</span>
            </div>
          </div>
        </div>

        {/* 2x2 Confusion Matrix */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Confusion Matrix (Cutoff Alignment)
          </h4>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            {/* Headers */}
            <div className="bg-transparent"></div>
            <div className="bg-slate-150 p-2 rounded-t-lg font-bold text-slate-700">Predicted Good (PD {'<'} Thresh)</div>
            <div className="bg-slate-150 p-2 rounded-t-lg font-bold text-slate-700">Predicted Default (PD {'>='} Thresh)</div>

            {/* Actual Good Row */}
            <div className="bg-slate-100/70 p-3 rounded-l-lg font-extrabold text-slate-600 flex items-center justify-center">
              Actual Good (Label 0)
            </div>
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 flex flex-col justify-center items-center rounded-sm">
              <span className="text-base font-extrabold font-mono">{stats.tn}</span>
              <span className="text-[10px] opacity-80">True Negative (Pay)</span>
            </div>
            <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 flex flex-col justify-center items-center rounded-sm">
              <span className="text-base font-extrabold font-mono">{stats.fp}</span>
              <span className="text-[10px] opacity-80">False Positive (Missed Trade)</span>
            </div>

            {/* Actual Default Row */}
            <div className="bg-slate-100/70 p-3 rounded-l-lg font-extrabold text-slate-600 flex items-center justify-center">
              Actual Bad (Label 1)
            </div>
            <div className="bg-red-50 border border-red-100 text-red-800 p-3 flex flex-col justify-center items-center rounded-sm">
              <span className="text-base font-extrabold font-mono">{stats.fn}</span>
              <span className="text-[10px] opacity-80">False Negative (Chargeoff!)</span>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 p-3 flex flex-col justify-center items-center rounded-sm">
              <span className="text-base font-extrabold font-mono">{stats.tp}</span>
              <span className="text-[10px] opacity-80">True Positive (Declined Def.)</span>
            </div>
          </div>

          <div className="bg-amber-50/50 p-3.5 border border-amber-100 rounded-xl flex gap-2.5">
            <AlertCircle className="w-4.5 h-4.5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-[10px] text-amber-800/90 leading-normal">
              <strong>Risk Warning:</strong> False negatives correspond to borrowers predicted as "Good" who ultimately defaulted. These result in <strong>direct capital chargeoffs</strong>. Standard banking practices prioritize reducing false negatives over maximizing loan issue volumes.
            </p>
          </div>
        </div>

        {/* Evaluation Metrics Cards */}
        <div className="bg-slate-950 text-white rounded-2xl p-5 shadow-xs space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Classifier Performance Metrics
          </h4>

          <div className="grid grid-cols-2 gap-3 font-sans">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-1">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Classification Accuracy</div>
              <div className="text-lg font-extrabold text-cyan-400 font-mono">{(stats.accuracy * 100).toFixed(1)}%</div>
              <p className="text-[9px] text-slate-500">Correctly classified borrowers</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-1">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">F1-Score (Overlapping Balance)</div>
              <div className="text-lg font-extrabold text-violet-400 font-mono">{(stats.f1 * 100).toFixed(1)}%</div>
              <p className="text-[9px] text-slate-500">Combined harmonic index</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-1">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Recall / Sensitivity</div>
              <div className="text-lg font-extrabold text-emerald-400 font-mono">{(stats.recall * 100).toFixed(1)}%</div>
              <p className="text-[9px] text-slate-500">Ratio of risk captured</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl space-y-1">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Precision (Declined Accuracy)</div>
              <div className="text-lg font-extrabold text-amber-400 font-mono">{(stats.precision * 100).toFixed(1)}%</div>
              <p className="text-[9px] text-slate-500">% of predicted defaults that were actual</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
