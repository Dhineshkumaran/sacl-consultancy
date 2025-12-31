import React from 'react';
import './DeleteUserModal.css'; // Reusing styles from DeleteUserModal

interface DeleteMasterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    loading: boolean;
    itemName?: string;
    count?: number;
}

const DeleteMasterModal: React.FC<DeleteMasterModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    loading,
    itemName,
    count = 1
}) => {
    if (!isOpen) return null;

    return (
        <div className="delete-modal-overlay">
            <div className="delete-modal-content">
                <div className="delete-modal-icon">
                    !
                </div>
                <h2 className="delete-modal-title">Delete {count > 1 ? `${count} Items` : 'Item'}?</h2>
                <p className="delete-modal-message">
                    {count > 1 ? (
                        <>Are you sure you want to delete <strong>{count} selected items</strong>?</>
                    ) : (
                        <>Are you sure you want to delete item <span className="delete-modal-user">{itemName}</span>?</>
                    )}
                    <br />
                    This action cannot be undone.
                </p>

                <div className="delete-modal-actions">
                    <button
                        className="btn-delete-cancel"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn-delete-confirm"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteMasterModal;
