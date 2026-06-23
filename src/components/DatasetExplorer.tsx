import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, UserCheck, ShieldAlert, ArrowUpRight, CheckCircle2, XCircle } from 'lucide-react';
import { Borrower } from '../types';

interface DatasetExplorerProps {
  dataset: Borrower[];
  onSelectBorrower: (borrower: Borrower) => void;
}

export default function DatasetExplorer({ dataset, onSelectBorrower }: DatasetExplorerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('All');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<keyof Borrower | 'score'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Multi-filter dataset
  const filteredDataset = useMemo(() => {
    return dataset.filter(b => {
      const matchSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) || b.id.includes(searchTerm);
      const matchRisk = riskFilter === 'All' || b.riskCategory === riskFilter;
      
      let matchOutcome = true;
      if (outcomeFilter === 'Defaulted') matchOutcome = b.actualDefault === 1;
      else if (outcomeFilter === 'Paid') matchOutcome = b.actualDefault === 0;

      return matchSearch && matchRisk && matchOutcome;
    });
  }, [dataset, searchTerm, riskFilter, outcomeFilter]);

  // Sort logic
  const sortedDataset = useMemo(() => {
    const list = [...filteredDataset];
    list.sort((a, b) => {
      let valA: any = a[sortField as keyof Borrower] ?? 0;
      let valB: any = b[sortField as keyof Borrower] ?? 0;

      if (sortField === 'predictedScore') {
        valA = a.predictedScore || 300;
        valB = b.predictedScore || 300;
      }
      if (sortField === 'predictedPD') {
        valA = a.predictedPD || 0;
        valB = b.predictedPD || 0;
      }

      if (typeof valA === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else {
        return sortDirection === 'asc' 
          ? valA - valB 
          : valB - valA;
      }
    });
    return list;
  }, [filteredDataset, sortField, sortDirection]);

  const toggleSort = (field: keyof Borrower | 'score') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // default to high-value sorting first
    }
  };

  const getRiskBadgeStyles = (cat?: string) => {
    switch (cat) {
      case 'Low': return 'bg-emerald-50 text-emerald-800 border-emerald-100';
      case 'Medium': return 'bg-amber-50 text-amber-800 border-amber-100';
      case 'High': return 'bg-orange-50 text-orange-800 border-orange-100';
      case 'Critical': return 'bg-rose-50 text-rose-800 border-rose-100';
      default: return 'bg-slate-50 text-slate-800 border-slate-100';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6" id="dataset-explorer">
      {/* Title & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            User Portfolio & Credit Database
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Explore {dataset.length} active consumer files. Select any row to examine their parameters inside the sandbox.
          </p>
        </div>

        {/* Inputs row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 focus:border-indigo-400 text-xs rounded-lg focus:outline-hidden text-slate-700 font-medium placeholder-slate-400 bg-slate-50/50"
            />
          </div>

          {/* Risk Level Filter dropdown */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium mr-1">Risk:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="focus:outline-hidden text-slate-700 font-bold bg-transparent border-0 p-0 cursor-pointer"
            >
              <option value="All">All Risks</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
              <option value="Critical">Critical Risk</option>
            </select>
          </div>

          {/* Actual defaults filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium mr-1">Outcome:</span>
            <select
              value={outcomeFilter}
              onChange={(e) => setOutcomeFilter(e.target.value)}
              className="focus:outline-hidden text-slate-700 font-bold bg-transparent border-0 p-0 cursor-pointer"
            >
              <option value="All">All Outcomes</option>
              <option value="Paid">Good (Non-default)</option>
              <option value="Defaulted">Bad (Defaulted)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dataset main grid table */}
      <div className="overflow-x-auto border border-slate-100 rounded-xl bg-slate-50/20">
        <table className="w-full text-xs text-left text-slate-700 font-sans">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold leading-none select-none">
              <th onClick={() => toggleSort('id')} className="py-3 px-4 cursor-pointer hover:text-slate-600 transition-colors">
                <div className="flex items-center gap-1">Borrower ID <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th onClick={() => toggleSort('name')} className="py-3 px-4 cursor-pointer hover:text-slate-600 transition-colors">
                <div className="flex items-center gap-1">Name <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th onClick={() => toggleSort('annualIncome')} className="py-3 px-4 cursor-pointer hover:text-slate-600 transition-colors">
                <div className="flex items-center gap-1">Income <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th onClick={() => toggleSort('dti')} className="py-3 px-4 cursor-pointer hover:text-slate-600 transition-colors">
                <div className="flex items-center gap-1">DTI (%) <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th onClick={() => toggleSort('creditUtilRate')} className="py-3 px-4 cursor-pointer hover:text-slate-600 transition-colors">
                <div className="flex items-center gap-1">Utilization <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th onClick={() => toggleSort('latePayments')} className="py-3 px-4 cursor-pointer hover:text-slate-600 transition-colors">
                <div className="flex items-center gap-1">Delinq <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th onClick={() => toggleSort('ltv')} className="py-3 px-4 cursor-pointer hover:text-slate-600 transition-colors">
                <div className="flex items-center gap-1">LTV (%) <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th onClick={() => toggleSort('predictedScore')} className="py-3 px-4 cursor-pointer hover:text-slate-600 transition-colors">
                <div className="flex items-center gap-1">Model Score <ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th onClick={() => toggleSort('predictedPD')} className="py-3 px-4 cursor-pointer hover:text-slate-600 transition-colors">
                <div className="flex items-center gap-1">Calc. PD<ArrowUpDown className="w-3 h-3" /></div>
              </th>
              <th className="py-3 px-4">Actual Label</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {sortedDataset.length > 0 ? (
              sortedDataset.map((row) => {
                return (
                  <tr
                    key={row.id}
                    className="hover:bg-indigo-50/20 active:bg-indigo-50/50 cursor-pointer group transition-colors odd:bg-slate-50/[0.04]"
                    onClick={() => onSelectBorrower(row)}
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-slate-400">{row.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 leading-tight block group-hover:text-indigo-600">
                        {row.name}
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold">Age: {row.age} / Hist: {row.creditHistoryYears} yrs</span>
                    </td>
                    <td className="py-3 px-4 font-sans font-bold text-slate-700">
                      ₹{row.annualIncome.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">{row.dti}%</td>
                    <td className="py-3 px-4 font-mono">
                      <span className={row.creditUtilRate > 75 ? 'text-red-600 font-extrabold' : 'text-slate-600'}>
                        {row.creditUtilRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {row.latePayments > 0 ? (
                        <span className="text-red-700 font-extrabold font-mono bg-red-100/55 border border-red-100/70 px-1 py-0.5 rounded-xs">
                          {row.latePayments} late
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">{row.ltv}%</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-extrabold text-slate-800">{row.predictedScore}</span>
                        <span className={`text-[9px] font-bold border rounded-full px-1.5 py-0.2 leading-none inline-block ${getRiskBadgeStyles(row.riskCategory)}`}>
                          {row.riskCategory}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-extrabold text-indigo-700">
                      {((row.predictedPD || 0) * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4">
                      {row.actualDefault === 1 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 leading-none">
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                          Defaulted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 leading-none">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          Good paying
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBorrower(row);
                        }}
                        className="py-1 px-2.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-150 rounded-lg group-hover:bg-indigo-600 group-hover:text-white cursor-pointer group-hover:border-indigo-600 transition-all flex items-center gap-0.5 mx-auto"
                      >
                        Details
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={11} className="py-8 text-center text-slate-400 font-medium">
                  No matching borrower records found for the selected filter keywords.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
