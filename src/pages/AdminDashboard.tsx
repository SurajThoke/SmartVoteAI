import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Users, Vote, History, Loader2, CheckCircle2, XCircle, Search, Filter, Edit, X } from 'lucide-react';
import { formatDate } from '../utils/utils';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('elections');
  const [logs, setLogs] = useState<any[]>([]);
  const [elections, setElections] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalVoters: 0, totalElections: 0, status: 'Healthy' });
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingElection, setEditingElection] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    organization: '',
    description: '',
    startTime: '',
    endTime: '',
    isActive: true,
    candidates: [] as any[]
  });

  const [newCandidate, setNewCandidate] = useState({
    name: '',
    partyName: '',
    partySymbol: ''
  });

  const fetchData = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    try {
      const [logsRes, electionsRes, statsRes] = await Promise.all([
        fetch('/api/admin/audit-logs', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/elections/active'),
        fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const logsData = await logsRes.json();
      const electionsData = await electionsRes.json();
      const statsData = await statsRes.json();
      
      setLogs(logsData);
      setElections(electionsData);
      setStats(statsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-poll every 10 seconds for real-time updates
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenModal = async (election: any = null) => {
    if (election) {
      setEditingElection(election);
      
      // Fetch candidates for this election
      const token = localStorage.getItem('adminToken');
      let candidates = [];
      try {
        const res = await fetch(`/api/admin/elections/${election.id}/candidates`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          candidates = data.map((c: any) => ({
            name: c.name,
            partyName: c.party_name,
            partySymbol: c.party_symbol
          }));
        }
      } catch (e) {
        console.error("Failed to fetch candidates", e);
      }

      setFormData({
        title: election.title,
        organization: election.organization,
        description: election.description || '',
        startTime: election.start_time.slice(0, 16),
        endTime: election.end_time.slice(0, 16),
        isActive: election.is_active === 1,
        candidates
      });
    } else {
      setEditingElection(null);
      setFormData({
        title: '',
        organization: '',
        description: '',
        startTime: '',
        endTime: '',
        isActive: true,
        candidates: []
      });
    }
    setIsModalOpen(true);
  };

  const handleAddCandidate = () => {
    if (!newCandidate.name || !newCandidate.partyName) {
      alert("Candidate name and party name are required");
      return;
    }
    
    // Prevent duplicate candidate names
    const isDuplicate = formData.candidates.some(c => c.name.toLowerCase() === newCandidate.name.toLowerCase());
    if (isDuplicate) {
      alert("A candidate with this name already exists in this election");
      return;
    }

    setFormData({
      ...formData,
      candidates: [...formData.candidates, { ...newCandidate }]
    });
    setNewCandidate({ name: '', partyName: '', partySymbol: '' });
  };

  const handleRemoveCandidate = (index: number) => {
    const updated = [...formData.candidates];
    updated.splice(index, 1);
    setFormData({ ...formData, candidates: updated });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingElection(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final check for candidates
    let finalCandidates = [...formData.candidates];
    if (finalCandidates.length === 0) {
      if (newCandidate.name && newCandidate.partyName) {
        // Automatically add the current candidate if filled
        finalCandidates = [{ ...newCandidate }];
      } else {
        alert("Please add at least one candidate to the election.");
        return;
      }
    }

    console.log("Submitting Election Data:", { ...formData, candidates: finalCandidates });

    const token = localStorage.getItem('adminToken');
    const url = editingElection ? `/api/admin/elections/${editingElection.id}` : '/api/admin/elections';
    const method = editingElection ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          candidates: finalCandidates,
          startTime: new Date(formData.startTime).toISOString(),
          endTime: new Date(formData.endTime).toISOString()
        })
      });

      if (res.ok) {
        handleCloseModal();
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save election");
      }
    } catch (error) {
      alert("Error saving election");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 md:mb-12 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Admin Control Center</h1>
          <p className="text-slate-600">Manage elections, candidates, and system integrity.</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm self-start lg:self-center overflow-x-auto max-w-full">
          <TabButton active={activeTab === 'elections'} onClick={() => setActiveTab('elections')} icon={<Vote className="w-4 h-4" />} label="Elections" />
          <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={<History className="w-4 h-4" />} label="Audit Logs" />
        </div>
      </div>

      {activeTab === 'elections' ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard label="Total Elections" value={stats.totalElections.toString()} icon={<Vote />} color="bg-blue-500" />
            <StatCard label="Registered Voters" value={stats.totalVoters.toString()} icon={<Users />} color="bg-emerald-500" />
            <StatCard label="System Status" value={stats.status} icon={<CheckCircle2 />} color="bg-indigo-500" />
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-xl font-bold text-slate-900">Election Management</h3>
              <button 
                onClick={() => handleOpenModal()}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-all w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Election</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Organization</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timeline</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {elections.map((election) => (
                    <tr key={election.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{election.title}</td>
                      <td className="px-6 py-4 text-slate-500">{election.organization}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">
                        {formatDate(election.start_time)} - {formatDate(election.end_time)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-bold uppercase tracking-wider",
                          election.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                        )}>
                          {election.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleOpenModal(election)}
                          className="text-primary font-bold text-sm hover:underline flex items-center justify-end space-x-1 ml-auto"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search logs by user, IP, or event..."
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button className="flex items-center justify-center space-x-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 w-full sm:w-auto">
              <Filter className="w-5 h-5" />
              <span>Filter</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[900px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Event</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 text-sm whitespace-nowrap">{formatDate(log.timestamp)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 capitalize">{log.event_type.replace('_', ' ')}</span>
                          <span className="text-xs text-slate-400">{log.description}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{log.user_identifier || 'System'}</td>
                      <td className="px-6 py-4">
                        {log.status === 'success' ? (
                          <div className="flex items-center text-emerald-600 space-x-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">Success</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600 space-x-1">
                            <XCircle className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase">Failed</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs">{log.ip_address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Election Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingElection ? 'Edit Election' : 'Create New Election'}
                </h3>
                <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-bold text-slate-700">Election Title</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-bold text-slate-700">Organization</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.organization}
                      onChange={(e) => setFormData({...formData, organization: e.target.value})}
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-bold text-slate-700">Description</label>
                  <textarea 
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-bold text-slate-700">Start Time</label>
                    <input 
                      type="datetime-local" 
                      required 
                      value={formData.startTime}
                      onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-bold text-slate-700">End Time</label>
                    <input 
                      type="datetime-local" 
                      required 
                      value={formData.endTime}
                      onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    className="w-5 h-5 text-primary rounded border-slate-300 focus:ring-primary"
                  />
                  <label htmlFor="isActive" className="text-sm font-bold text-slate-700">Election is Active</label>
                </div>

                {/* Candidates Section */}
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-slate-900">Manage Candidates</h4>
                    <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-lg">
                      {formData.candidates.length} Added
                    </span>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Candidate Name <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          placeholder="e.g. John Doe"
                          value={newCandidate.name}
                          onChange={(e) => setNewCandidate({...newCandidate, name: e.target.value})}
                          className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Party Name <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          placeholder="e.g. Liberty Party"
                          value={newCandidate.partyName}
                          onChange={(e) => setNewCandidate({...newCandidate, partyName: e.target.value})}
                          className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Symbol URL (Optional)</label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input 
                          type="text" 
                          placeholder="https://..."
                          value={newCandidate.partySymbol}
                          onChange={(e) => setNewCandidate({...newCandidate, partySymbol: e.target.value})}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        />
                        <button 
                          type="button"
                          onClick={handleAddCandidate}
                          className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center space-x-2 flex-shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="text-sm font-bold">Add Candidate</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {formData.candidates.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm italic">No candidates added yet.</p>
                      </div>
                    ) : (
                      formData.candidates.map((c, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={idx} 
                          className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                              {c.partySymbol ? (
                                <img src={c.partySymbol} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <Users className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{c.name}</p>
                              <p className="text-xs text-slate-500">{c.partyName}</p>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => handleRemoveCandidate(idx)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={handleCloseModal}
                    className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 w-full sm:w-auto"
                  >
                    {editingElection ? 'Update Election' : 'Create Election'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center space-x-2 px-6 py-2 rounded-xl text-sm font-bold transition-all",
      active ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:text-slate-900"
    )}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center space-x-4">
    <div className={cn("p-3 rounded-2xl text-white", color)}>
      {React.cloneElement(icon, { className: "w-6 h-6" })}
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
    </div>
  </div>
);

const cn = (...classes: any) => classes.filter(Boolean).join(' ');
