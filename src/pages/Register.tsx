import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Mail, Phone, CreditCard, Fingerprint, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { FaceCapture } from '../components/FaceCapture';

export const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    mobile: '',
    email: '',
    aadhaar: '',
    voterId: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Aadhaar (12 digits) and Mobile (10 digits)
    if (!/^\d{10}$/.test(formData.mobile)) {
      alert("Mobile number must be exactly 10 digits");
      return;
    }
    if (!/^\d{12}$/.test(formData.aadhaar)) {
      alert("Aadhaar number must be exactly 12 digits");
      return;
    }
    if (!/^[A-Z]{3}\d{5}$/.test(formData.voterId)) {
      alert("Voter ID must be 3 uppercase letters followed by 5 digits (e.g., ABC12345)");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json();
      if (response.ok) {
        setStep(2);
      } else {
        alert(data.error || "Failed to send OTP");
      }
    } catch (error) {
      alert("Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp }),
      });
      const data = await response.json();
      if (response.ok) {
        setStep(3);
      } else {
        alert(data.error || "Invalid OTP");
      }
    } catch (error) {
      alert("Error verifying OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      if (response.ok) {
        alert("OTP resent successfully");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to resend OTP");
      }
    } catch (error) {
      alert("Error resending OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleFaceCapture = async (embedding: number[]) => {
    setLoading(true);
    try {
      const response = await fetch('/api/voter/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, faceEmbedding: embedding }),
      });
      
      const data = await response.json();
      if (response.ok) {
        setStep(4);
      } else {
        alert(data.error || "Registration failed");
      }
    } catch (error) {
      alert("An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Voter Registration</h1>
        <p className="text-slate-600">Complete the steps below to register for SmartVoteAI.</p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-center mb-8 md:mb-12 overflow-x-auto pb-2">
        <StepIndicator current={step} step={1} label="Details" />
        <div className={cn("w-8 md:w-16 h-1 mx-1 md:mx-2 rounded flex-shrink-0", step > 1 ? "bg-primary" : "bg-slate-200")} />
        <StepIndicator current={step} step={2} label="OTP" />
        <div className={cn("w-8 md:w-16 h-1 mx-1 md:mx-2 rounded flex-shrink-0", step > 2 ? "bg-primary" : "bg-slate-200")} />
        <StepIndicator current={step} step={3} label="Biometrics" />
        <div className={cn("w-8 md:w-16 h-1 mx-1 md:mx-2 rounded flex-shrink-0", step > 3 ? "bg-primary" : "bg-slate-200")} />
        <StepIndicator current={step} step={4} label="Complete" />
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.form
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleNext}
            className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
              <Input label="Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} />
              <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input label="Mobile Number" name="mobile" type="tel" value={formData.mobile} onChange={handleChange} required pattern="[0-9]{10}" placeholder="10-digit mobile" />
              <Input label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input label="Aadhaar Number" name="aadhaar" value={formData.aadhaar} onChange={handleChange} required pattern="\d{12}" placeholder="12-digit Aadhaar" maxLength={12} />
              <Input label="Voter ID" name="voterId" value={formData.voterId} onChange={handleChange} required pattern="[A-Z]{3}\d{5}" placeholder="e.g. ABC12345" maxLength={8} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary-dark transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <span>Send OTP Verification</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </motion.form>
        )}

        {step === 2 && (
          <motion.form
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleVerifyOtp}
            className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6 text-center"
          >
            <div className="mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">Email Verification</h2>
              <p className="text-slate-500 text-sm md:text-base">Enter the 6-digit OTP sent to {formData.email}</p>
            </div>
            
            <div className="max-w-xs mx-auto">
              <Input 
                label="OTP Code" 
                name="otp" 
                value={otp} 
                onChange={(e: any) => setOtp(e.target.value)} 
                required 
                pattern="[0-9]{6}" 
                placeholder="000000"
                className="text-center text-2xl tracking-widest"
              />
            </div>

            <div className="flex flex-col space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary-dark transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Verify OTP</span>}
              </button>
              
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-sm font-bold text-primary hover:underline"
              >
                Resend OTP
              </button>
            </div>
          </motion.form>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl text-center"
          >
            <div className="mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">Face Identity Capture</h2>
              <p className="text-slate-500 text-sm md:text-base">Position your face in the center of the frame.</p>
            </div>
            <FaceCapture onCapture={handleFaceCapture} isProcessing={loading} />
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-xl text-center"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 md:w-12 md:h-12" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Registration Successful!</h2>
            <p className="text-slate-600 mb-8 md:mb-10 max-w-md mx-auto text-sm md:text-base">
              Your identity has been verified and your voter profile is now active. You can now participate in live elections.
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
            >
              Go to Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StepIndicator = ({ current, step, label }: { current: number; step: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className={cn(
      "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all",
      current >= step ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
    )}>
      {current > step ? <CheckCircle2 className="w-6 h-6" /> : step}
    </div>
    <span className={cn("text-xs font-bold mt-2 uppercase tracking-wider", current >= step ? "text-primary" : "text-slate-400")}>
      {label}
    </span>
  </div>
);

const Input = ({ label, ...props }: any) => (
  <div className="flex flex-col space-y-2">
    <label className="text-sm font-bold text-slate-700">{label}</label>
    <input
      {...props}
      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
    />
  </div>
);

const cn = (...classes: any) => classes.filter(Boolean).join(' ');
