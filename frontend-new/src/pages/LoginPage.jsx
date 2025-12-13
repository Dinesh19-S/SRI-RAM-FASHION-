import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, sendOTP, loginWithPhone, clearError } from '../store/slices/authSlice';
import { Mail, Lock, Phone, Eye, EyeOff, ArrowRight, X } from 'lucide-react';

const LoginPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isLoading, error } = useSelector((state) => state.auth);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [otpStep, setOtpStep] = useState('phone');

    const handleLogin = async (e) => {
        e.preventDefault();
        const result = await dispatch(login({ email, password }));
        if (login.fulfilled.match(result)) {
            navigate('/');
        }
    };

    const handleSendOTP = async () => {
        const result = await dispatch(sendOTP(phone));
        if (sendOTP.fulfilled.match(result)) {
            setOtpStep('otp');
        }
    };

    const handleVerifyOTP = async () => {
        const otpString = otp.join('');
        const result = await dispatch(loginWithPhone({ phone, otp: otpString }));
        if (loginWithPhone.fulfilled.match(result)) {
            navigate('/');
        }
    };

    const handleOTPChange = (index, value) => {
        if (value.length > 1) value = value.slice(-1);
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <span className="text-2xl font-bold text-white">SRF</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Sri Ram Fashions</h1>
                    <p className="text-gray-500 mt-1">Business Management System</p>
                </div>

                {/* Login Card */}
                <div className="card animate-fade-in">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Welcome back</h2>

                    {error && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="form-label">Email</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    className="form-input pl-10"
                                    placeholder="admin@sriramfashions.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="form-label">Password</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input pl-10 pr-10"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                                <input type="checkbox" className="rounded border-gray-300" />
                                Remember me
                            </label>
                            <a href="#" className="text-purple-600 hover:text-purple-700">Forgot password?</a>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full justify-center"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Sign In <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-3 bg-white text-gray-500">or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button className="btn btn-secondary justify-center">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                        </button>
                        <button
                            className="btn btn-secondary justify-center"
                            onClick={() => {
                                setShowOTPModal(true);
                                dispatch(clearError());
                            }}
                        >
                            <Phone size={18} />
                            Phone OTP
                        </button>
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <a href="/register" className="text-purple-600 hover:text-purple-700 font-medium">
                                Sign Up
                            </a>
                        </p>
                    </div>
                </div>
            </div>

            {/* OTP Modal */}
            {showOTPModal && (
                <div className="modal-overlay" onClick={() => setShowOTPModal(false)}>
                    <div className="modal max-w-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {otpStep === 'phone' ? 'Enter Phone Number' : 'Verify OTP'}
                            </h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowOTPModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            {otpStep === 'phone' ? (
                                <div className="space-y-4">
                                    <p className="text-gray-500 text-sm">
                                        Enter your phone number to receive a one-time password.
                                    </p>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">+91</span>
                                        <input
                                            type="tel"
                                            className="form-input pl-12"
                                            placeholder="Enter 10-digit number"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        />
                                    </div>
                                    <button
                                        className="btn btn-primary w-full justify-center"
                                        onClick={handleSendOTP}
                                        disabled={isLoading || phone.length !== 10}
                                    >
                                        {isLoading ? 'Sending...' : 'Send OTP'}
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-gray-500 text-sm">
                                        We've sent a 6-digit code to <strong>+91 {phone}</strong>
                                    </p>
                                    <div className="flex justify-center gap-2">
                                        {otp.map((digit, index) => (
                                            <input
                                                key={index}
                                                id={`otp-${index}`}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleOTPChange(index, e.target.value)}
                                                className="w-12 h-14 text-center text-xl font-semibold form-input"
                                            />
                                        ))}
                                    </div>
                                    <button
                                        className="btn btn-primary w-full justify-center"
                                        onClick={handleVerifyOTP}
                                        disabled={isLoading || otp.join('').length !== 6}
                                    >
                                        {isLoading ? 'Verifying...' : 'Verify & Login'}
                                    </button>
                                    <div className="text-center">
                                        <button
                                            className="text-sm text-purple-600 hover:text-purple-700"
                                            onClick={() => setOtpStep('phone')}
                                        >
                                            Change Phone Number
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginPage;
