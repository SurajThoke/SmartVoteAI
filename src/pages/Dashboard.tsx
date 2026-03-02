import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Vote, UserPlus, CheckCircle2, Shield, ArrowRight, Clock, MapPin } from 'lucide-react';
import { formatDate } from '../utils/utils';

export const Dashboard = () => {
  const [elections, setElections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/elections/active')
      .then(res => res.json())
      .then(data => {
        setElections(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <section className="text-center mb-16 md:mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-xs md:text-sm font-bold mb-6"
        >
          <Shield className="w-4 h-4" />
          <span>Secure AI-Powered Voting</span>
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight leading-tight"
        >
          Your Vote, <span className="text-primary">Secured by AI</span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 px-4"
        >
          SmartVoteAI uses advanced biometric face recognition and secure encryption to ensure a fair, transparent, and tamper-proof voting experience.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 px-4"
        >
          <Link
            to="/register"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 hover:-translate-y-1"
          >
            <UserPlus className="w-5 h-5" />
            <span>Register to Vote</span>
          </Link>
          <Link
            to="/results"
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 bg-white text-slate-900 border-2 border-slate-200 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all hover:-translate-y-1"
          >
            <span>View Results</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* Active Elections */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Active Elections</h2>
          <div className="flex items-center space-x-2 text-emerald-600 font-semibold bg-emerald-50 px-3 py-1 rounded-full text-sm self-start sm:self-center">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live Now</span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : elections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {elections.map((election) => (
              <motion.div
                key={election.id}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="bg-slate-100 p-3 rounded-2xl">
                    <Vote className="w-8 h-8 text-primary" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Active
                  </span>
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{election.title}</h3>
                <div className="flex items-center text-slate-500 text-sm mb-4">
                  <MapPin className="w-4 h-4 mr-1" />
                  {election.organization}
                </div>
                
                <p className="text-slate-600 mb-6 line-clamp-2">
                  {election.description}
                </p>
                
                <div className="space-y-3 mb-8">
                  <div className="flex items-center text-sm text-slate-500">
                    <Clock className="w-4 h-4 mr-2" />
                    Ends: {formatDate(election.end_time)}
                  </div>
                </div>

                <Link
                  to={`/vote/${election.id}`}
                  className="block w-full py-4 bg-slate-900 text-white text-center rounded-xl font-bold hover:bg-slate-800 transition-colors"
                >
                  Cast Your Vote
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <Vote className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900">No Active Elections</h3>
            <p className="text-slate-500">Check back later for upcoming voting events.</p>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-12">
        <FeatureCard
          icon={<Shield className="w-6 h-6" />}
          title="AI Identity Verification"
          description="Advanced face recognition ensures that only registered voters can cast their votes."
        />
        <FeatureCard
          icon={<CheckCircle2 className="w-6 h-6" />}
          title="Tamper-Proof Results"
          description="Every vote is hashed and stored securely, preventing any unauthorized modifications."
        />
        <FeatureCard
          icon={<Vote className="w-6 h-6" />}
          title="Real-time Auditing"
          description="Complete transparency with real-time audit logs for every action taken on the platform."
        />
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="flex flex-col items-start">
    <div className="bg-primary/10 p-3 rounded-2xl text-primary mb-6">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{description}</p>
  </div>
);
