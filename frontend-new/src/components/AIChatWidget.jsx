import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { aiAPI } from '../services/api';
import './AIChatWidget.css';

const AIChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            type: 'bot',
            text: "Hello! I'm your AI assistant for Sri Ram Fashions. Ask me anything about inventory, sales, customers, or how to use the app!",
            timestamp: new Date(),
        },
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isServiceReady, setIsServiceReady] = useState(true);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Check AI service health on mount
    useEffect(() => {
        const checkHealth = async () => {
            try {
                const response = await aiAPI.healthCheck();
                setIsServiceReady(response.data.status === 'ready');
            } catch (error) {
                console.log('AI service check failed:', error);
                setIsServiceReady(false);
            }
        };
        checkHealth();
    }, []);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    const handleSend = async () => {
        if (!inputText.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            text: inputText.trim(),
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            const response = await aiAPI.chat(userMessage.text);

            const botMessage = {
                id: Date.now() + 1,
                type: 'bot',
                text: response.data.success
                    ? response.data.message
                    : 'Sorry, I encountered an issue. Please try again.',
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage = {
                id: Date.now() + 1,
                type: 'bot',
                text: error.response?.data?.message || 'Sorry, I encountered an error. Please try again later.',
                timestamp: new Date(),
                isError: true,
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const quickQuestions = [
        "What products are low on stock?",
        "Show today's sales summary",
        "How do I create a new bill?",
    ];

    const handleQuickQuestion = (question) => {
        setInputText(question);
        inputRef.current?.focus();
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="ai-chat-widget">
            {/* Chat Window */}
            {isOpen && (
                <div className="chat-window">
                    {/* Header */}
                    <div className="chat-header">
                        <div className="chat-header-info">
                            <div className="chat-avatar">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h3>AI Assistant</h3>
                                <span className={`status ${isServiceReady ? 'online' : 'offline'}`}>
                                    {isServiceReady ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        </div>
                        <button className="close-btn" onClick={() => setIsOpen(false)}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="chat-messages">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`message ${message.type} ${message.isError ? 'error' : ''}`}
                            >
                                <div className="message-avatar">
                                    {message.type === 'bot' ? <Bot size={16} /> : <User size={16} />}
                                </div>
                                <div className="message-content">
                                    <p>{message.text}</p>
                                    <span className="message-time">{formatTime(message.timestamp)}</span>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="message bot loading">
                                <div className="message-avatar">
                                    <Bot size={16} />
                                </div>
                                <div className="message-content">
                                    <div className="typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Questions */}
                    {messages.length <= 2 && (
                        <div className="quick-questions">
                            <p>Try asking:</p>
                            <div className="quick-buttons">
                                {quickQuestions.map((q, i) => (
                                    <button key={i} onClick={() => handleQuickQuestion(q)}>
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="chat-input-area">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={isServiceReady ? "Type your message..." : "AI service unavailable"}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={!isServiceReady || isLoading}
                        />
                        <button
                            className="send-btn"
                            onClick={handleSend}
                            disabled={!inputText.trim() || isLoading || !isServiceReady}
                        >
                            {isLoading ? <Loader2 size={20} className="spin" /> : <Send size={20} />}
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <button
                className={`chat-toggle-btn ${isOpen ? 'hidden' : ''}`}
                onClick={() => setIsOpen(true)}
                title="AI Assistant"
            >
                <MessageCircle size={24} />
                <span className="pulse"></span>
            </button>
        </div>
    );
};

export default AIChatWidget;
