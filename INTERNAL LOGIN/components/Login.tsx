
import React, { useState } from 'react';
import { auth, db } from '../firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { EyeIcon, EyeSlashIcon } from './icons/Icons';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Create new user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Create user document in Firestore with super_admin role
        // This ensures the new user can access all modules immediately
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            email: email,
            role: 'super_admin',
            createdAt: new Date().toISOString()
        });
      } else {
        // Sign in existing user
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error("Authentication failed", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
          setError("Invalid email or password. If you haven't registered, please create an account.");
      } else if (err.code === 'auth/email-already-in-use') {
          setError("This email is already registered. Please sign in.");
      } else if (err.code === 'auth/weak-password') {
          setError("Password must be at least 6 characters long.");
      } else {
          setError(err.message || "Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
      setIsSignUp(!isSignUp);
      setError(null);
      setPassword('');
  };

  return (
    <div className="min-h-screen flex bg-white">
        {/* Left Side - Branding & Visuals */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-primary-900 flex-col justify-center items-center text-white overflow-hidden">
            {/* Abstract Background Decoration */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-800 to-primary-950"></div>
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary-700 opacity-20 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-primary-500 opacity-20 blur-3xl"></div>
            
            {/* Content */}
            <div className="relative z-10 px-12 text-center">
                <h1 className="text-6xl font-bold tracking-tight mb-6">Aarya</h1>
                <p className="text-xl text-primary-100 max-w-md mx-auto leading-relaxed">
                    The complete solution for workforce management and production tracking.
                </p>
            </div>
            
             <div className="absolute bottom-8 text-primary-300 text-xs">
                &copy; {new Date().getFullYear()} Aarya Systems. Internal Use Only.
            </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
            <div className="mx-auto w-full max-w-sm lg:w-96">
                <div className="lg:hidden text-center mb-10">
                    <h1 className="text-4xl font-bold text-primary-700">Aarya</h1>
                </div>
                
                <div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">{isSignUp ? 'Create Account' : 'Welcome back'}</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {isSignUp ? 'Register to access the Aarya dashboard.' : 'Please enter your credentials to access the dashboard.'}
                    </p>
                </div>

                <div className="mt-8">
                    <form onSubmit={handleAuth} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900"
                                    placeholder="admin@company.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete={isSignUp ? "new-password" : "current-password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm pr-10 bg-white text-gray-900"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeSlashIcon className="h-5 w-5" />
                                    ) : (
                                        <EyeIcon className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                         {error && (
                            <div className="rounded-md bg-red-50 p-4 border-l-4 border-red-500">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-red-800">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {isSignUp ? 'Creating account...' : 'Signing in...'}
                                    </div>
                                ) : (
                                    isSignUp ? 'Create Account' : 'Sign in'
                                )}
                            </button>
                        </div>
                    </form>
                    
                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">
                                    {isSignUp ? 'Already have an account?' : 'Need an account?'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 text-center">
                            <button onClick={toggleMode} className="text-primary-600 hover:text-primary-500 font-medium">
                                {isSignUp ? 'Sign in instead' : 'Create a new account'}
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-gray-400">
                             Unauthorized access is strictly prohibited.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Login;
