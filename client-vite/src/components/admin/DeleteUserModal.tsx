import React from 'react';
import './DeleteUserModal.css';

interface DeleteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    loading: boolean;
    username?: string;
    count?: number;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    loading,
    username,
    count = 1
}) => {
    if (!isOpen) return null;

    return (
        <div className="delete-modal-overlay">
            <div className="delete-modal-content">
                <div className="delete-modal-icon">
                    !
                </div>
                <h2 className="delete-modal-title">Delete {count > 1 ? `${count} Users` : 'User'}?</h2>
                <p className="delete-modal-message">
                    {count > 1 ? (
                        <>Are you sure you want to delete <strong>{count} selected users</strong>?</>
                    ) : (
                        <>Are you sure you want to delete user <span className="delete-modal-user">{username}</span>?</>
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

export default DeleteUserModal;
