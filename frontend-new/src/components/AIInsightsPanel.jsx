import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Loader2, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import { aiAPI } from '../services/api';
import './AIInsightsPanel.css';

const AIInsightsPanel = () => {
    const [insights, setInsights] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchInsights = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await aiAPI.getInsights();
            if (response.data.success) {
                setInsights(response.data.insights);
                setLastUpdated(new Date());
            } else {
                setError('Unable to generate insights');
            }
        } catch (err) {
            console.error('Failed to fetch insights:', err);
            setError('Failed to connect to AI service');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInsights();
    }, []);

    const formatInsights = (text) => {
        if (!text) return [];
        // Split by newlines or bullet points
        return text
            .split(/\n+/)
            .filter(line => line.trim())
            .map(line => line.replace(/^[-•*]\s*/, '').trim())
            .filter(line => line.length > 0);
    };

    const getIcon = (index) => {
        const icons = [TrendingUp, Package, AlertTriangle, Sparkles];
        const Icon = icons[index % icons.length];
        return <Icon size={16} />;
    };

    return (
        <div className="ai-insights-panel">
            <div className="panel-header">
                <div className="header-left">
                    <div className="header-icon">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h3>AI Business Insights</h3>
                        {lastUpdated && (
                            <span className="last-updated">
                                Updated {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                </div>
                <button
                    className="refresh-btn"
                    onClick={fetchInsights}
                    disabled={isLoading}
                    title="Refresh Insights"
                >
                    {isLoading ? (
                        <Loader2 size={18} className="spin" />
                    ) : (
                        <RefreshCw size={18} />
                    )}
                </button>
            </div>

            <div className="panel-content">
                {isLoading && !insights ? (
                    <div className="loading-state">
                        <Loader2 size={24} className="spin" />
                        <p>Analyzing your business data...</p>
                    </div>
                ) : error ? (
                    <div className="error-state">
                        <AlertTriangle size={24} />
                        <p>{error}</p>
                        <button onClick={fetchInsights}>Try Again</button>
                    </div>
                ) : (
                    <div className="insights-list">
                        {formatInsights(insights).map((insight, index) => (
                            <div key={index} className="insight-item">
                                <div className="insight-icon">{getIcon(index)}</div>
                                <p>{insight}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="panel-footer">
                <span>Powered by AI</span>
            </div>
        </div>
    );
};

export default AIInsightsPanel;
