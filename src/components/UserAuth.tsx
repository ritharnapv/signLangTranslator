import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../firebase';
import { 
  KeyRound, 
  Mail, 
  User, 
  ShieldAlert, 
  Cpu, 
  ArrowRight, 
  CheckCircle2,
  Lock,
  RefreshCw
} from 'lucide-react';

interface UserAuthProps {
  onAuthSuccess?: () => void;
  darkMode?: boolean;
}

export default function UserAuth({ onAuthSuccess, darkMode }: UserAuthProps) {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [isForgot, setIsForgot] = useState<boolean>(false);
  
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const clearErrors = () => {
    setErrorCode(null);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp);
    setIsForgot(false);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    clearErrors();
  };

  const handleToggleForgot = () => {
    setIsForgot(!isForgot);
    setIsSignUp(false);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    clearErrors();
  };

  const handleFirebaseError = (error: any) => {
    console.error("Auth Error:", error);
    const code = error.code || '';
    setErrorCode(code);
    
    switch (code) {
      case 'auth/invalid-email':
        setErrorMsg('Please enter a valid email address.');
        break;
      case 'auth/user-disabled':
        setErrorMsg('This account has been disabled.');
        break;
      case 'auth/user-not-found':
        setErrorMsg('No user record found for this email.');
        break;
      case 'auth/wrong-password':
        setErrorMsg('Incorrect password. Please try again.');
        break;
      case 'auth/email-already-in-use':
        setErrorMsg('This email is already registered with another account.');
        break;
      case 'auth/weak-password':
        setErrorMsg('Password should be at least 6 characters long.');
        break;
      case 'auth/network-request-failed':
        setErrorMsg('Network error. Check your internet connection.');
        break;
      case 'auth/missing-password':
        setErrorMsg('Password is required.');
        break;
      case 'auth/invalid-credential':
        setErrorMsg('Invalid login credentials. Please check your email and password.');
        break;
      default:
        setErrorMsg(error.message || 'An unexpected error occurred. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setLoading(true);

    try {
      if (isForgot) {
        if (!email) {
          setErrorMsg('Please enter your email address.');
          setLoading(false);
          return;
        }
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg('Reset code sent! Please inspect your email inbox for further guidelines.');
      } else if (isSignUp) {
        // Sign Up Flow
        if (!email || !password || !displayName) {
          setErrorMsg('All fields (Name, Email, Password) are required.');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setErrorMsg('Passwords do not match.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Immediately update display name profile metadata
        await updateProfile(userCredential.user, {
          displayName: displayName
        });
        
        setSuccessMsg('Account registered successfully! Logging you in...');
        if (onAuthSuccess) {
          setTimeout(onAuthSuccess, 1000);
        }
      } else {
        // Sign In Flow
        if (!email || !password) {
          setErrorMsg('Email and Password are required.');
          setLoading(false);
          return;
        }
        await signInWithEmailAndPassword(auth, email, password);
        setSuccessMsg('Authenticated! Entering dashboard...');
        if (onAuthSuccess) {
          setTimeout(onAuthSuccess, 1000);
        }
      }
    } catch (err: any) {
      handleFirebaseError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 bg-[#fdfcf9] dark:bg-[#121214]`}>
      
      {/* Container Box */}
      <div className="w-full max-w-md bg-white dark:bg-[#1e1e22] border border-[#ecece0] dark:border-[#2d2d32] rounded-[32px] p-8 shadow-xl space-y-6 flex flex-col relative overflow-hidden" id="auth-box">
        
        {/* Subtle Decorative Background Elements */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#7c8d7c]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#ebdcd1]/10 rounded-full blur-2xl pointer-events-none" />
        
        {/* Logo / Header */}
        <div className="text-center space-y-2 relative" id="auth-header">
          <div className="w-12 h-12 bg-[#7c8d7c] dark:bg-[#4a5c4e] rounded-2xl flex items-center justify-center text-white mx-auto shadow-md" id="auth-logo">
            <Cpu className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-[#2d2d28] dark:text-[#f4f4f5] font-sans mt-3">
            SignSense AI
          </h2>
          <p className="text-[10px] text-[#7c8d7c] dark:text-[#9cd39c] uppercase font-bold tracking-widest font-mono">
            Secure Member Portal
          </p>
          <p className="text-xs text-[#7a7a6a] dark:text-[#a1a1aa] max-w-xs mx-auto leading-relaxed mt-2 font-sans">
            {isForgot 
              ? 'Reset security configurations and credentials'
              : isSignUp 
              ? 'Join our interactive A-Z American Sign Language workspace and custom ML dashboard'
              : 'Sign in to access your calibrated camera feed, stats trackers, and dataset collectors'}
          </p>
        </div>

        {/* Error / Success Notify Alerts */}
        {errorMsg && (
          <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 rounded-2xl p-4 text-xs font-medium leading-relaxed flex items-start gap-2.5 animate-fadeIn" id="auth-error">
            <ShieldAlert className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Credential Review Alert:</span>
              <p className="opacity-95">{errorMsg}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-2xl p-4 text-xs font-medium leading-relaxed flex items-start gap-2.5 animate-fadeIn" id="auth-success">
            <CheckCircle2 className="w-4.5 h-4.5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <div className="space-y-0.5">
              <span className="font-bold">Authentication Action Logged:</span>
              <p className="opacity-95">{successMsg}</p>
            </div>
          </div>
        )}

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="space-y-4" id="auth-form">
          
          {/* Display Name for SignUp */}
          {isSignUp && (
            <div className="space-y-1" id="auth-field-name">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#5a5a4a] dark:text-[#cbd5e1] font-mono block">
                Full Display Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pin pl-3.5 text-neutral-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rachel Practitioner"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-[#fdfcf9] dark:bg-[#121214] border border-[#e0e4db] dark:border-[#2d2d32] rounded-xl text-xs font-medium text-[#2d2d28] dark:text-white py-3 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-[#7c8d7c] transition-shadow shadow-sm font-sans"
                />
              </div>
            </div>
          )}

          {/* Email input field */}
          <div className="space-y-1" id="auth-field-email">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#5a5a4a] dark:text-[#cbd5e1] font-mono block">
              Email Coordinates
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pin pl-3.5 text-neutral-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#fdfcf9] dark:bg-[#121214] border border-[#e0e4db] dark:border-[#2d2d32] rounded-xl text-xs font-medium text-[#2d2d28] dark:text-white py-3 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-[#7c8d7c] transition-shadow shadow-sm font-sans"
              />
            </div>
          </div>

          {/* Password inputs if not forgot mode */}
          {!isForgot && (
            <div className="space-y-1" id="auth-field-password">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-wider text-[#5a5a4a] dark:text-[#cbd5e1] font-mono block">
                  Security Code / Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={handleToggleForgot}
                    className="text-[10px] text-[#7c8d7c] hover:underline font-bold"
                  >
                    Forgot Code?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pin pl-3.5 text-neutral-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#fdfcf9] dark:bg-[#121214] border border-[#e0e4db] dark:border-[#2d2d32] rounded-xl text-xs font-medium text-[#2d2d28] dark:text-white py-3 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-[#7c8d7c] transition-shadow shadow-sm font-sans"
                />
              </div>
            </div>
          )}

          {/* Confirm Password inputs if SignUp */}
          {isSignUp && (
            <div className="space-y-1" id="auth-field-confirm">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#5a5a4a] dark:text-[#cbd5e1] font-mono block">
                Verify Code / Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pin pl-3.5 text-neutral-400">
                  <KeyRound className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#fdfcf9] dark:bg-[#121214] border border-[#e0e4db] dark:border-[#2d2d32] rounded-xl text-xs font-medium text-[#2d2d28] dark:text-white py-3 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-[#7c8d7c] transition-shadow shadow-sm font-sans"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-[#7c8d7c] dark:bg-[#4a5c4e] text-white hover:bg-[#6c7d6c] dark:hover:bg-[#3d4c3f] rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-40"
            id="auth-submit-btn"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isForgot ? 'Send Recover Email' : isSignUp ? 'Initialize Profile' : 'Authenticate Session'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Alternate Toggles */}
        <div className="border-t border-[#f0f2ee] dark:border-[#2d2d32] pt-4 text-center" id="auth-toggles">
          {isForgot ? (
            <button
              onClick={handleToggleForgot}
              className="text-xs text-[#5a5a4a] dark:text-[#cbd5e1] hover:text-[#2d2d28] dark:hover:text-white font-bold transition-all"
            >
              ← Back to Sign In Portal
            </button>
          ) : (
            <p className="text-xs text-[#7a7a6a] dark:text-[#a1a1aa] font-sans">
              {isSignUp ? 'Already mapped an account? ' : 'First-time operator? '}
              <button
                type="button"
                onClick={handleToggleMode}
                className="text-[#7c8d7c] hover:underline font-bold font-sans ml-1"
              >
                {isSignUp ? 'Sign In Credentials' : 'Create Free Client'}
              </button>
            </p>
          )}
        </div>

      </div>

    </div>
  );
}
