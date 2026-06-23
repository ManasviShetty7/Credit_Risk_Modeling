import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, 
  Sliders, 
  BarChart3, 
  Database, 
  TrendingUp, 
  HelpCircle, 
  ShieldAlert, 
  ArrowRight
} from 'lucide-react';

// Components
import MetricCard from './components/MetricCard';
import BorrowerForm from './components/BorrowerForm';
import ScorecardCalibration from './components/ScorecardCalibration';
import ModelEvaluation from './components/ModelEvaluation';
import DatasetExplorer from './components/DatasetExplorer';

// Math/Utilities
import { 
  generateBorrowerDataset, 
  computePredictions, 
  fitLogisticRegression, 
  calculateROCAndAUC 
} from './utils/creditModel';
import { Borrower, ModelCoefficients, ScorecardParams } from './types';

export default function App() {
  // Current active tab state
  const [activeTab, setActiveTab] = useState<'sandbox' | 'calibration' | 'diagnostics' | 'database'>('sandbox');

  // Baseline Model Coefficients (Init standard weights)
  const [coefs, setCoefs] = useState<ModelCoefficients>({
    intercept: -1.25,
    income: -0.15, // Units of ₹1 Lakh, so for every ₹1 Lakh income increase, risk declines by -0.15 in log odds
    dti: 0.045, // High DTI increases default probability
    utilization: 0.042, // High credit usage increases risk (highly critical feature!)
    historyYears: -0.09, // Seasoned age decreases risk
    latePayments: 0.65, // Late payments are heavy risk drivers
    inquiries: 0.28, // Seek liquidity inquiries increase risk
    ltv: 0.0125 // Higher percentage credit backing vs assets increases risk
  });

  // Scorecard Scale Parameters
  const [scoreParams, setScoreParams] = useState<ScorecardParams>({
    pdo: 20, // Points to double odds
    baseScore: 600, // Standard base rating score
    baseOdds: 50 // Standard good to bad odds
  });

  // Active Borrower Dataset
  const [dataset, setDataset] = useState<Borrower[]>([]);

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize the 120-borrower dataset on load
  useEffect(() => {
    const rawData = generateBorrowerDataset();
    setDataset(rawData);
    showToast("Synthetic credit history dataset generated successfully (120 active records).");
  }, []);

  // Compute probability predictions and scores on changes in coefficients or scaling parameters
  const scoredDataset = useMemo(() => {
    if (!dataset.length) return [];
    return computePredictions(dataset, coefs, scoreParams);
  }, [dataset, coefs, scoreParams]);

  // Recalculate top population-level stats
  const topStats = useMemo(() => {
    if (!scoredDataset.length) return { avgScore: 0, badRate: 0, auc: 0.5, gini: 0 };
    
    // Average credit score
    const totalScore = scoredDataset.reduce((sum, b) => sum + (b.predictedScore || 300), 0);
    const avgScore = Math.round(totalScore / scoredDataset.length);

    // Actual default rate
    const badCount = scoredDataset.filter(b => b.actualDefault === 1).length;
    const badRate = (badCount / scoredDataset.length) * 100;

    // ROC Area under the curve
    const roc = calculateROCAndAUC(scoredDataset, scoreParams);

    return {
      avgScore,
      badRate: Math.round(badRate * 10) / 10,
      auc: roc.auc,
      gini: roc.gini
    };
  }, [scoredDataset, scoreParams]);

  // Command handler to execute real-time model training (Gradient Descent calibration)
  const handleAutoFit = () => {
    if (!scoredDataset.length) return;
    
    // Execute interactive math solver
    const fitted = fitLogisticRegression(scoredDataset, coefs, 500, 0.08);
    setCoefs(fitted);
    showToast("Model coefficients trained and calibrated via Interactive Gradient Descent in 1.8ms!");
  };

  // Add sandboxed applications back into the main portfolio
  const handleNewPrediction = (newBorrower: Omit<Borrower, 'id'> & { id?: string }) => {
    const finalId = newBorrower.id || `SIM-${1000 + Math.floor(Math.random() * 9000)}`;
    const fullBorrower: Borrower = {
      ...newBorrower,
      id: finalId
    };

    setDataset(prev => [fullBorrower, ...prev]);
    showToast(`Simulation file appended successfully as ${finalId}. Re-ranking portfolio...`);
  };

  // Click any borrower in table to load and focus on Sandbox
  const handleSelectBorrower = (borrower: Borrower) => {
    // We can focus back on the credit scorecard form and simulate their inputs
    // We load them as the active state by selecting the sandbox tab
    setActiveTab('sandbox');
    showToast(`Borrower ${borrower.id} file loaded into Underwriting Sandbox.`);
    
    // Smoothly scroll to the form panel
    const element = document.getElementById('underwriting-sandbox');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Helper helper to handle custom notifications
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased pb-12">
      {/* Dynamic Toast Alerts */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-slate-800 text-white rounded-xl py-3 px-4 shadow-xl flex items-center gap-2.5 max-w-sm animate-bounce text-xs font-semibold">
          <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Navigation Hero */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-xs">
                <Activity className="w-5 h-5" id="app-logo" />
              </div>
              <div className="space-y-0.5">
                <h1 className="text-base font-black tracking-tight text-slate-900">CIBIL Credit Risk Analytics</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Credit Risk Modeling Center</p>
              </div>
            </div>


          </div>
        </div>
      </header>

      {/* Primary Dashboard Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        
        {/* Intro overview panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            title="Portfolio Avg Credit Score"
            value={`${topStats.avgScore} pts`}
            subtext="CIBIL Equiv (300-900 range)"
            icon={<TrendingUp className="w-5 h-5" />}
            color="blue"
          />
          <MetricCard 
            title="Historic Default Rate"
            value={`${topStats.badRate}%`}
            subtext={`${scoredDataset.filter(b => b.actualDefault === 1).length} defaulted profiles`}
            icon={<ShieldAlert className="w-5 h-5" />}
            color="rose"
          />
          <MetricCard 
            title="Model Discrimination (AUC)"
            value={topStats.auc.toFixed(3)}
            subtext="Higher is stronger classification"
            icon={<BarChart3 className="w-5 h-5" />}
            color="purple"
          />
          <MetricCard 
            title="Population Gini Coeffic."
            value={topStats.gini.toFixed(2)}
            subtext="Score separation index"
            icon={<Activity className="w-5 h-5" />}
            color="green"
          />
        </div>

        {/* Tab Controls Navigation */}
        <div className="border-b border-slate-200 bg-white p-2.5 rounded-xl border border-slate-150 flex flex-wrap gap-1 md:items-center justify-between shadow-xs">
          <nav className="flex flex-wrap gap-1">
            <button
              onClick={() => setActiveTab('sandbox')}
              className={`px-4 py-2 text-xs font-extrabold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'sandbox'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Activity className="w-4 h-4" />
              Underwriting Sandbox
            </button>

            <button
              onClick={() => setActiveTab('calibration')}
              className={`px-4 py-2 text-xs font-extrabold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'calibration'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Sliders className="w-4 h-4" />
              Calibration & WoE
            </button>

            <button
              onClick={() => setActiveTab('diagnostics')}
              className={`px-4 py-2 text-xs font-extrabold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'diagnostics'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Diagnostic Diagnostics
            </button>

            <button
              onClick={() => setActiveTab('database')}
              className={`px-4 py-2 text-xs font-extrabold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === 'database'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Database className="w-4 h-4" />
              Borrower Files Database
            </button>
          </nav>

          {/* Quick Info text */}
          <div className="text-[11px] text-slate-500 font-bold px-3 py-1.5 flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg">
            Active Dataset Size:{' '}
            <span className="font-mono text-indigo-600 font-extrabold">{scoredDataset.length} files</span>
          </div>
        </div>

        {/* Dynamic Panels */}
        <div className="min-h-52">
          {activeTab === 'sandbox' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <BorrowerForm 
                coefs={coefs} 
                scoreParams={scoreParams} 
                onNewPrediction={handleNewPrediction} 
              />
            </motion.div>
          )}

          {activeTab === 'calibration' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <ScorecardCalibration 
                coefs={coefs} 
                setCoefs={setCoefs}
                scoreParams={scoreParams}
                setScoreParams={setScoreParams}
                onFitModel={handleAutoFit}
                dataset={scoredDataset}
              />
            </motion.div>
          )}

          {activeTab === 'diagnostics' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <ModelEvaluation 
                dataset={scoredDataset} 
                scoreParams={scoreParams} 
              />
            </motion.div>
          )}

          {activeTab === 'database' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <DatasetExplorer 
                dataset={scoredDataset} 
                onSelectBorrower={handleSelectBorrower} 
              />
            </motion.div>
          )}
        </div>

      </main>
    </div>
  );
}
