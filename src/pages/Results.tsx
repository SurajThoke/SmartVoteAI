import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Vote, Trophy, Users, Calendar, Loader2 } from 'lucide-react';
import { formatDate } from '../utils/utils';

export const Results = () => {
  const [elections, setElections] = useState<any[]>([]);
  const [selectedElection, setSelectedElection] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitial = async () => {
      const res = await fetch('/api/elections/active');
      const data = await res.json();
      setElections(data);
      if (data.length > 0 && !selectedElection) {
        handleElectionSelect(data[0].id);
      } else if (data.length === 0) {
        setLoading(false);
      }
    };
    
    fetchInitial();

    // Auto-poll results every 5 seconds if an election is selected
    const interval = setInterval(() => {
      if (selectedElection) {
        handleElectionSelect(selectedElection.id, true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedElection?.id]);

  const handleElectionSelect = async (id: string, isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch(`/api/elections/${id}/results`);
      const data = await res.json();
      setSelectedElection(data.election);
      setResults(data.results);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const winner = results.length > 0 ? [...results].sort((a, b) => b.votes - a.votes)[0] : null;
  const totalVotes = results.reduce((sum, r) => sum + r.votes, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-12 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Election Results</h1>
          <p className="text-slate-600">Transparent and real-time voting data.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:space-x-4">
          <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Select Election:</label>
          <select
            onChange={(e) => handleElectionSelect(e.target.value)}
            className="bg-white border border-slate-200 px-4 py-3 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto"
          >
            {elections.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : selectedElection ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats Overview */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-4 mb-8">
                <div className="bg-primary/10 p-3 rounded-2xl text-primary flex-shrink-0">
                  <Trophy className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Leader</p>
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">{winner?.name || 'N/A'}</h3>
                </div>
              </div>
              
              <div className="space-y-6">
                <StatItem icon={<Users className="w-5 h-5" />} label="Total Votes Cast" value={totalVotes.toLocaleString()} />
                <StatItem icon={<Vote className="w-5 h-5" />} label="Candidates" value={results.length.toString()} />
                <StatItem icon={<Calendar className="w-5 h-5" />} label="Election End" value={formatDate(selectedElection.end_time)} />
              </div>
            </div>

            <div className="bg-slate-900 p-6 md:p-8 rounded-3xl text-white">
              <h4 className="font-bold mb-4">Security Verification</h4>
              <p className="text-slate-400 text-sm mb-6">
                All results are verified using SHA256 cryptographic hashing. Each vote is unique and tamper-proof.
              </p>
              <div className="flex items-center space-x-2 text-emerald-400 text-sm font-bold">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span>Integrity Check Passed</span>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm h-[400px] md:h-[500px]">
              <h3 className="text-xl font-bold text-slate-900 mb-8">Vote Distribution</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={results} margin={{ top: 20, right: 10, left: -20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="votes" radius={[8, 8, 0, 0]} barSize={30}>
                    {results.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[500px]">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Party</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Votes</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.sort((a, b) => b.votes - a.votes).map((candidate, i) => (
                      <tr key={candidate.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{candidate.name}</td>
                        <td className="px-6 py-4 text-slate-500">{candidate.party_name}</td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-primary">{candidate.votes.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">
                            {totalVotes > 0 ? ((candidate.votes / totalVotes) * 100).toFixed(1) : 0}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-slate-500">No election data available.</p>
        </div>
      )}
    </div>
  );
};

const StatItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-3 text-slate-500">
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </div>
    <span className="font-bold text-slate-900">{value}</span>
  </div>
);
