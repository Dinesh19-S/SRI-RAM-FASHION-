import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ArrowRight, LayoutDashboard } from 'lucide-react';

const HomePage = () => {
    const { isAuthenticated } = useSelector((state) => state.auth);

    return (
        <div className="relative h-screen w-full flex items-center justify-center overflow-hidden font-sans">
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop")',
                }}
            ></div>

            {/* Dark Overlay */}
            <div className="absolute inset-0 z-[1] bg-black/50"></div>

            {/* Content */}
            <div className="relative z-[2] text-center text-white px-5 max-w-4xl mx-auto">
                {/* Brand Name */}
                <h1
                    className="font-serif text-5xl md:text-7xl font-bold uppercase tracking-wider mb-4 drop-shadow-lg opacity-0 animate-fade-in-down"
                >
                    Sri Ram Fashions
                </h1>

                {/* Tagline */}
                <p
                    className="text-lg md:text-xl font-light tracking-wide mb-10 opacity-0 animate-fade-in-up delay-300"
                >
                    Traditional Elegance Meets Modern Style
                </p>

                {/* Buttons */}
                <div
                    className="flex flex-col md:flex-row gap-5 justify-center items-center opacity-0 animate-fade-in-up delay-600"
                >
                    {isAuthenticated ? (
                        <Link
                            to="/dashboard"
                            className="group flex items-center gap-3 px-10 py-4 text-base font-semibold uppercase tracking-wide rounded-full bg-white text-black border-2 border-white hover:bg-[#d4af37] hover:border-[#d4af37] hover:text-white transition-all duration-300 shadow-lg"
                        >
                            <LayoutDashboard size={20} className="group-hover:scale-110 transition-transform" />
                            Dashboard
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="w-full md:w-auto min-w-[200px] px-10 py-4 text-base font-semibold uppercase tracking-wide rounded-full border-2 border-white text-black bg-white hover:bg-transparent hover:text-white transition-all duration-300 shadow-lg"
                            >
                                Sign In
                            </Link>
                            <Link
                                to="/register"
                                className="w-full md:w-auto min-w-[200px] px-10 py-4 text-base font-semibold uppercase tracking-wide rounded-full border-2 border-white bg-white text-black hover:bg-[#d4af37] hover:border-[#d4af37] hover:text-white transition-all duration-300 shadow-lg"
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
                .delay-300 { animation-delay: 0.3s; }
                .delay-600 { animation-delay: 0.6s; }
            `}</style>
        </div>
    );
};

export default HomePage;


