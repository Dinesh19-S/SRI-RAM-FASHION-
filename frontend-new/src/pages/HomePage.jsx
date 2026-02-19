import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowRight, LayoutDashboard } from 'lucide-react';

const HomePage = () => {
    const { isAuthenticated } = useSelector((state) => state.auth);

    // Logo as base64 data URL (the lotus flower logo provided by the user)
    const logoDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    // Note: The actual logo image will be displayed via the showroom background
    // For now, using a lotus emoji as placeholder until the actual image is properly saved

    return (
        <div className="relative h-screen w-full flex items-center justify-center overflow-hidden font-sans">
            {/* Background Image - Showroom with white display shelf */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{
                    backgroundImage: 'linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%)',
                    backgroundColor: '#f0f0f0'
                }}
            ></div>

            {/* Light overlay for better text contrast */}
            <div className="absolute inset-0 z-[1] bg-white/30 backdrop-blur-sm"></div>

            {/* Centered Content */}
            <div className="relative z-[2] text-center px-5 max-w-2xl mx-auto flex flex-col items-center justify-center">

                {/* Logo - Lotus Flower */}
                <div className="mb-6 opacity-0 animate-fade-in-down">
                    <div className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-4 flex items-center justify-center">
                        {/* Lotus Flower Symbol */}
                        <div className="text-8xl md:text-9xl" style={{
                            background: 'linear-gradient(135deg, #8b7355 0%, #d4a574 50%, #8b7355 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))'
                        }}>
                            🪷
                        </div>
                    </div>
                </div>

                {/* Application Name */}
                <h1
                    className="font-serif text-4xl md:text-6xl font-bold uppercase tracking-wider mb-3 opacity-0 animate-fade-in-down delay-200"
                    style={{
                        background: 'linear-gradient(135deg, #2c2416 0%, #5a4a2f 50%, #2c2416 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                    }}
                >
                    SRI RAM FASHIONS
                </h1>

                {/* Tagline */}
                <p
                    className="text-base md:text-lg font-medium tracking-wide mb-10 opacity-0 animate-fade-in-up delay-400"
                    style={{
                        color: '#4a4a4a',
                        textShadow: '0 1px 2px rgba(255,255,255,0.8)'
                    }}
                >
                    Traditional Elegance Meets Modern Style
                </p>

                {/* Buttons */}
                <div
                    className="flex flex-col md:flex-row gap-4 justify-center items-center w-full opacity-0 animate-fade-in-up delay-600"
                >
                    {isAuthenticated ? (
                        <Link
                            to="/dashboard"
                            className="group flex items-center gap-3 px-10 py-4 text-base font-semibold uppercase tracking-wide rounded-full transition-all duration-300 shadow-lg"
                            style={{
                                background: 'linear-gradient(135deg, #8b7355 0%, #d4a574 100%)',
                                color: '#ffffff',
                                border: '2px solid transparent'
                            }}
                        >
                            <LayoutDashboard size={20} className="group-hover:scale-110 transition-transform" />
                            Dashboard
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="w-full md:w-auto min-w-[200px] px-10 py-4 text-base font-semibold uppercase tracking-wide rounded-full transition-all duration-300 shadow-md hover:shadow-lg"
                                style={{
                                    backgroundColor: 'transparent',
                                    color: '#2c2416',
                                    border: '2px solid #2c2416'
                                }}
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/register"
                                className="w-full md:w-auto min-w-[200px] px-10 py-4 text-base font-semibold uppercase tracking-wide rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
                                style={{
                                    background: 'linear-gradient(135deg, #8b7355 0%, #d4a574 100%)',
                                    color: '#ffffff',
                                    border: '2px solid transparent'
                                }}
                            >
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Inline Styles for Custom Animations & Fonts */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600&family=Playfair+Display:wght@700&display=swap');

                .font-sans { font-family: 'Montserrat', sans-serif; }
                .font-serif { font-family: 'Playfair Display', serif; }

                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .animate-fade-in-down {
                    animation: fadeInDown 1s ease-out forwards;
                }
                .animate-fade-in-up {
                    animation: fadeInUp 1s ease-out forwards;
                    animation-fill-mode: both;
                }
                .delay-200 { animation-delay: 0.2s; }
                .delay-400 { animation-delay: 0.4s; }
                .delay-600 { animation-delay: 0.6s; }
            `}</style>
        </div>
    );
};

export default HomePage;
