import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import logoImage from '../assets/logo.jpg';

const HomePage = () => {
    const { isAuthenticated } = useSelector((state) => state.auth);

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
            style={{
                backgroundImage: 'url("/home-bg.jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            {/* Dark Overlay for better text readability */}
            <div className="absolute inset-0 bg-black/30"></div>

            {/* Main Content */}
            <div
                className="relative z-10 flex flex-col items-center text-center"
            >
                {/* Logo */}
                <img
                    src={logoImage}
                    alt="Sri Ram Fashions"
                    className="w-48 h-48 mb-6 rounded-3xl object-cover"
                    style={{
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 80px rgba(139, 92, 246, 0.3)'
                    }}
                />

                {/* Brand Name */}
                <h1
                    className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-4"
                    style={{
                        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5), 0 0 60px rgba(139, 92, 246, 0.5), 0 0 100px rgba(139, 92, 246, 0.3)'
                    }}
                >
                    SRI RAM FASHIONS
                </h1>

                {/* Tagline */}
                <p
                    className="text-white/90 text-lg md:text-xl mb-12 max-w-md font-medium"
                    style={{
                        textShadow: '1px 1px 3px rgba(0, 0, 0, 0.5)'
                    }}
                >
                    Your complete business management solution
                </p>

                {/* Buttons */}
                <div
                    className="flex flex-col sm:flex-row items-center gap-5"
                >
                    {isAuthenticated ? (
                        <Link
                            to="/dashboard"
                            className="group relative"
                        >
                            <div
                                className="flex items-center gap-3 px-8 py-4 text-white font-bold text-lg rounded-2xl backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(168, 85, 247, 0.9) 100%)',
                                    boxShadow: '0 8px 32px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                                }}
                            >
                                <LayoutDashboard size={22} />
                                Go to Dashboard
                                <ArrowRight size={20} />
                            </div>
                        </Link>
                    ) : (
                        <>
                            <Link to="/login">
                                <div
                                    className="w-48 px-8 py-4 text-white font-bold text-lg rounded-2xl text-center backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(168, 85, 247, 0.95) 100%)',
                                        boxShadow: '0 8px 32px rgba(139, 92, 246, 0.5), inset 0 1px 0 rgba(255,255,255,0.2)'
                                    }}
                                >
                                    SIGN IN
                                </div>
                            </Link>
                            <Link to="/register">
                                <div
                                    className="w-48 px-8 py-4 text-white font-bold text-lg rounded-2xl text-center backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.15)',
                                        border: '2px solid rgba(255, 255, 255, 0.4)',
                                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                                    }}
                                >
                                    SIGN UP
                                </div>
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div
                className="absolute bottom-8 left-0 right-0 flex justify-center gap-6 text-sm"
                style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }}
            >
                <button className="text-white/70 hover:text-white transition-colors">Marketplace</button>
                <button className="text-white/70 hover:text-white transition-colors">Blog</button>
                <button className="text-white/70 hover:text-white transition-colors">License</button>
            </div>
        </div>
    );
};

export default HomePage;


