import React, { useState } from 'react';
import { useFirestore } from '@/hooks/useFirestore';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/ClearDataButton.css';

export const ClearDataButton: React.FC = () => {
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [clearResult, setClearResult] = useState<any>(null);
    const [confirmText, setConfirmText] = useState('');

    const { clearAllData } = useFirestore();
    const navigate = useNavigate();

    const handleClearClick = () => {
        setShowConfirmDialog(true);
        setConfirmText('');
        setClearResult(null);
    };

    const handleConfirmClear = async () => {
        if (confirmText !== 'DELETE ALL') {
            alert('Please type "DELETE ALL" to confirm');
            return;
        }

        setIsClearing(true);

        try {
            const result = await clearAllData();
            setClearResult(result);

            if (result.success) {
                setTimeout(() => {
                    // Redirect to home and reload to ensure fresh state
                    navigate('/');
                    window.location.reload();
                }, 2000);
            }
        } catch (error) {
            setClearResult({
                success: false,
                errors: ['An unexpected error occurred']
            });
        } finally {
            setIsClearing(false);
        }
    };

    const handleCancel = () => {
        setShowConfirmDialog(false);
        setConfirmText('');
        setClearResult(null);
    };    
return (
        <>
            <button
                onClick={handleClearClick}
                className="clear-data-button"
                aria-label="Clear all data"
            >
                <span className="button-icon">🗑️</span>
                Clear All Data
            </button>

            {showConfirmDialog && (
                <div className="confirm-dialog-overlay">
                    <div className="confirm-dialog">
                        <h2>⚠️ Clear All Data</h2>

                        {!clearResult ? (
                            <>
                                <div className="warning-message">
                                    <p><strong>This action will permanently delete:</strong></p>
                                    <ul>
                                        <li>All purchase history and decisions</li>
                                        <li>Your financial profile</li>
                                        <li>Chat conversations</li>
                                        <li>Pro Mode analyses</li>
                                        <li>Savings goals and progress</li>
                                        <li>All locally stored data</li>
                                    </ul>
                                    <p className="warning-text">
                                        <strong>⚠️ This action cannot be undone!</strong>
                                    </p>
                                </div>

                                <div className="confirm-input-group">
                                    <label htmlFor="confirm-text">
                                        Type <strong>DELETE ALL</strong> to confirm:
                                    </label>
                                    <input
                                        id="confirm-text"
                                        type="text"
                                        value={confirmText}
                                        onChange={(e) => setConfirmText(e.target.value)}
                                        placeholder="DELETE ALL"
                                        disabled={isClearing}
                                    />
                                </div>

                                <div className="dialog-actions">
                                    <button
                                        onClick={handleConfirmClear}
                                        className="btn-danger"
                                        disabled={isClearing || confirmText !== 'DELETE ALL'}
                                    >
                                        {isClearing ? (
                                            <>
                                                <span className="spinner"></span>
                                                Clearing Data...
                                            </>
                                        ) : (
                                            'Delete Everything'
                                        )}
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="btn-cancel"
                                        disabled={isClearing}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="result-message">
                                {clearResult.success ? (
                                    <>
                                        <div className="success-icon">✅</div>
                                        <h3>Data Cleared Successfully</h3>
                                        <p>All your data has been removed.</p>
                                        <p className="redirect-message">Redirecting to home page...</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="error-icon">❌</div>
                                        <h3>Some Errors Occurred</h3>
                                        <ul className="error-list">
                                            {clearResult.errors?.map((error: string, index: number) => (
                                                <li key={index}>{error}</li>
                                            ))}
                                        </ul>
                                        <button onClick={handleCancel} className="btn-primary">
                                            Close
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default ClearDataButton;