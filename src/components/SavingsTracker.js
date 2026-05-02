import React, { useState, useEffect } from 'react';
import { useFirestore } from '../hooks/useFirestore';
import '../styles/SavingsTracker.css';

const SavingsTracker = ({ onClose }) => {
    const [history, setHistory] = useState([]);
    const [totalSavings, setTotalSavings] = useState(0);
    const [projection, setProjection] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const firestore = useFirestore();

    useEffect(() => {
        if (firestore.isAuthenticated && firestore.subscribeToPurchaseHistory) {
            setIsLoading(true);
            
            // Set up real-time listener for purchase history
            const unsubscribe = firestore.subscribeToPurchaseHistory((purchaseHistory) => {
                setHistory(purchaseHistory);
                const savings = purchaseHistory.reduce((acc, item) => acc + (item.savings || 0), 0);
                setTotalSavings(savings);

                if (savings > 0) {
                    calculateProjection(savings);
                }
                setIsLoading(false);
            });

            return () => {
                if (unsubscribe) {
                    unsubscribe();
                }
            };
        } else {
            // Fallback to localStorage for non-authenticated users
            const loadFromLocalStorage = () => {
                setIsLoading(true);
                const savedHistory = JSON.parse(localStorage.getItem('purchaseHistory') || '[]');
                const purchaseHistory = savedHistory.map(item => ({
                    ...item,
                    date: new Date(item.date)
                }));
                
                setHistory(purchaseHistory);
                const savings = purchaseHistory.reduce((acc, item) => acc + (item.savings || 0), 0);
                setTotalSavings(savings);

                if (savings > 0) {
                    calculateProjection(savings);
                }
                setIsLoading(false);
            };

            loadFromLocalStorage();
        }
    }, [firestore.isAuthenticated, firestore.subscribeToPurchaseHistory]);

    const calculateProjection = (currentSavings) => {
        const target = 1000000;
        const annualRate = 0.15; // 15%
        
        if (currentSavings >= target) {
            setProjection({ years: 0, finalAmount: currentSavings });
            return;
        }

        let years = 0;
        let futureValue = currentSavings;

        // Using a loop to find the number of years. A direct formula is complex.
        while (futureValue < target) {
            futureValue = futureValue * (1 + annualRate);
            years++;
            if (years > 200) break; // Safety break
        }

        setProjection({
            years,
            finalAmount: futureValue
        });
    };
    
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="savings-tracker-overlay">
                <div className="savings-tracker-container">
                    <button onClick={onClose} className="close-tracker-btn">×</button>
                    <div className="tracker-header">
                        <h2>Loading...</h2>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="savings-tracker-overlay">
            <div className="savings-tracker-container">
                <button onClick={onClose} className="close-tracker-btn">×</button>
                <div className="tracker-header">
                    <h2>Your Path to a Million</h2>
                    <p>Tracking savings from smarter purchase decisions.</p>
                </div>

                <div className="tracker-summary">
                    <div className="summary-card">
                        <h4>Total Saved</h4>
                        <p className="total-savings-value">{formatCurrency(totalSavings)}</p>
                        <span>From finding better prices.</span>
                    </div>
                    <div className="summary-card">
                        <h4>Million Dollar Projection</h4>
                        {projection ? (
                            <p className="projection-value">~{projection.years} Years</p>
                        ) : (
                             <p className="projection-value">N/A</p>
                        )}
                        <span>At 15% annual compound growth.</span>
                    </div>
                </div>

                <div className="history-log">
                    <h3>Purchase History</h3>
                    <div className="history-list">
                        {history.length > 0 ? (
                            history.map((item, index) => (
                                <div key={index} className="history-item">
                                    <div className="item-details">
                                        <span className="item-date">{item.date.toLocaleDateString()}</span>
                                        <strong className="item-name">{item.itemName}</strong>
                                        <span className={`item-decision ${item.decision.toLowerCase().replace("'", "")}`}>{item.decision}</span>
                                    </div>
                                    <div className="item-savings">
                                        {item.savings > 0 ? (
                                            <span className="savings-amount positive">
                                                Saved: {formatCurrency(item.savings)}
                                            </span>
                                        ) : (
                                            <span className="savings-amount">No savings</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>No purchase history yet. Analyze a purchase to start tracking!</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SavingsTracker;