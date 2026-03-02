import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Vote, ShieldCheck, User, Smartphone, CheckCircle2, Loader2, Download, ArrowLeft } from 'lucide-react';
import { FaceCapture } from '../components/FaceCapture';
import { formatDate } from '../utils/utils';

export const VotePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [election, setElection] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [step, setStep] = useState(1); // 1: Voter ID, 2: Face, 3: Candidates, 4: Receipt
  const [voterId, setVoterId] = useState('');
  const [voterInfo, setVoterInfo] = useState<any>(null);
  const [voteToken, setVoteToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/elections/${id}/results`)
      .then(res => res.json())
      .then(data => {
        setElection(data.election);
        setCandidates(data.results);
      });
  }, [id]);

  const handleVoterIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleFaceVerify = async (embedding: number[]) => {
    setLoading(true);
    try {
      const response = await fetch('/api/vote/verify-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voterId, currentEmbedding: embedding }),
      });
      
      const data = await response.json();
      if (response.ok) {
        setVoterInfo(data.voter);
        setVoteToken(data.voteToken);
        setStep(3);
      } else {
        alert(data.error || "Verification failed");
      }
    } catch (error) {
      alert("An error occurred during verification.");
    } finally {
      setLoading(false);
    }
  };

  const handleCastVote = async (candidateId: string) => {
    if (!window.confirm("Are you sure you want to cast your vote for this candidate? This action cannot be undone.")) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/vote/cast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteToken, electionId: id, candidateId }),
      });
      
      const data = await response.json();
      if (response.ok) {
        setReceipt(data);
        setStep(4);
      } else {
        alert(data.error || "Voting failed");
      }
    } catch (error) {
      alert("An error occurred while casting your vote.");
    } finally {
      setLoading(false);
    }
  };

  if (!election) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <div className="mb-8 md:mb-12">
        <button onClick={() => navigate('/')} className="flex items-center text-slate-500 hover:text-slate-900 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          <span className="text-sm font-bold">Back to Dashboard</span>
        </button>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 tracking-tight">{election.title}</h1>
        <p className="text-slate-600 font-medium">{election.organization}</p>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.form
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleVoterIdSubmit}
            className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md mx-auto"
          >
            <div className="text-center mb-8">
              <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Voter Verification</h2>
              <p className="text-slate-500">Enter your Voter ID to begin.</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col space-y-2 text-left">
                <label className="text-sm font-bold text-slate-700">Voter ID Number</label>
                <input
                  type="text"
                  required
                  value={voterId}
                  onChange={(e) => setVoterId(e.target.value)}
                  className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Enter your unique ID"
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
              >
                Continue
              </button>
            </div>
          </motion.form>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md mx-auto text-center"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Biometric Verification</h2>
            <FaceCapture onCapture={handleFaceVerify} isProcessing={loading} />
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Voter Info Banner */}
            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="bg-emerald-500 text-white p-3 rounded-2xl flex-shrink-0">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Verified Voter</p>
                  <h3 className="text-xl font-bold text-slate-900">{voterInfo.firstName} {voterInfo.lastName}</h3>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-slate-500">
                <Smartphone className="w-4 h-4" />
                <span className="text-sm font-medium">{voterInfo.mobile}</span>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900">Select Your Candidate</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {candidates.map((candidate) => (
                <motion.div
                  key={candidate.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 group"
                >
                  <div className="flex items-center space-x-4 w-full">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-100">
                      {candidate.party_symbol ? (
                        <img src={candidate.party_symbol} alt={candidate.party_name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <Vote className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 leading-tight">{candidate.name}</h3>
                      <p className="text-slate-500 font-medium text-sm">{candidate.party_name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCastVote(candidate.id)}
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-primary transition-all group-hover:shadow-lg group-hover:shadow-primary/20 disabled:opacity-50"
                  >
                    Vote
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-xl text-center max-w-2xl mx-auto"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 md:w-12 md:h-12" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Vote Cast Successfully!</h2>
            <p className="text-slate-500 mb-8 md:mb-10 text-sm md:text-base">Thank you for participating in the democratic process.</p>
            
            <div className="bg-slate-50 p-6 md:p-8 rounded-2xl text-left mb-8 md:mb-10 space-y-4 font-mono text-xs md:text-sm border border-slate-100 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:justify-between border-b border-slate-200 pb-2 gap-1">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="text-slate-900 font-bold break-all">{receipt.transactionId}</span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-slate-400">Vote Hash (SHA256):</span>
                <span className="text-slate-900 break-all text-[10px] md:text-xs">{receipt.voteHash}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between pt-2 gap-1">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-slate-900">{formatDate(new Date())}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => window.print()}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 bg-slate-100 text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-all"
              >
                <Download className="w-5 h-5" />
                <span>Download Receipt</span>
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
              >
                Back to Dashboard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
