import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/commonService';
import GearSpinner from '../common/GearSpinner';
import './AddUserModal.css'; // Reusing CSS
import { useAlert } from '../../hooks/useAlert';
import type { User } from '../../types/user';

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUserUpdated?: () => void;
    user: User | null;
}

interface Department {
    department_id: number;
    department_name: string;
}

const ROLES = ['HOD', 'User'];

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, onUserUpdated, user }) => {
    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        department_id: '',
        role: 'User',
    });
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { showAlert } = useAlert();

    useEffect(() => {
        if (isOpen) {
            fetchDepartments();
        }
    }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (user && isOpen) {
            setFormData({
                username: user.username || '',
                full_name: user.full_name || '',
                email: user.email || '',
                password: '',
                confirmPassword: '',
                department_id: user.department_id ? String(user.department_id) : '',
                role: user.role || 'User',
            });
        }
    }, [user, isOpen]);

    const fetchDepartments = async () => {
        try {
            const departments = await apiService.getDepartments();
            setDepartments(departments);
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error('Failed to fetch departments:', err);
            showAlert('error', 'Could not load departments');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!formData.username || !formData.full_name) {
            showAlert('error', 'Username and Full Name are required');
            return;
        }

        if (formData.password) {
            if (formData.password !== formData.confirmPassword) {
                showAlert('error', 'Passwords do not match');
                return;
            }
            if (formData.password.length < 6) {
                showAlert('error', 'Password must be at least 6 characters');
                return;
            }
        }

        setLoading(true);

        try {
            const payload: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
                username: formData.username,
                full_name: formData.full_name,
                email: formData.email,
                department_id: formData.department_id ? parseInt(formData.department_id) : null,
                role: formData.role,
            };

            if (formData.password) {
                payload.password = formData.password;
            }

            await apiService.adminUpdateUser(user.user_id, payload);

            await showAlert('success', 'User updated successfully!');
            onUserUpdated?.();
            onClose();

        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            showAlert('error', err.message || 'Failed to update user');
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    if (!isOpen || !user) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Edit User Profile</h2>
                    <button className="close-btn" onClick={onClose} disabled={loading}>
                        âœ•
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="user-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Enter username"
                                disabled={loading}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="full_name">Full Name</label>
                            <input
                                type="text"
                                id="full_name"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                placeholder="Enter full name"
                                disabled={loading}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter email"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="role">Role</label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                {ROLES.map((r) => (
                                    <option key={r} value={r}>
                                        {r}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="department_id">Department</label>
                            <select
                                id="department_id"
                                name="department_id"
                                value={formData.department_id}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <option value="">Select Department</option>
                                {departments.map((dept) => (
                                    <option key={dept.department_id} value={String(dept.department_id)}>
                                        {dept.department_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group password-field">
                            <label htmlFor="password">New Password (Optional)</label>
                            <div className="password-input-container">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Leave blank to keep current"
                                    disabled={loading}
                                />
                                <span
                                    className="password-toggle"
                                    onClick={togglePasswordVisibility}
                                >
                                    {showPassword ? 'ðŸ‘ï¸' : 'ðŸ‘ï¸â€ðŸ—¨ï¸'}
                                </span>
                            </div>
                        </div>
                        <div className="form-group password-field">
                            <label htmlFor="confirmPassword">Confirm New Password</label>
                            <div className="password-input-container">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm new password"
                                    disabled={loading || !formData.password}
                                />
                                <span
                                    className="password-toggle"
                                    onClick={toggleConfirmPasswordVisibility}
                                >
                                    {showConfirmPassword ? 'ðŸ‘ï¸' : 'ðŸ‘ï¸â€ðŸ—¨ï¸'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <div style={{ transform: 'scale(0.4)', height: '20px', width: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GearSpinner /></div>
                                    <span>Updating...</span>
                                </div>
                            ) : 'Update User'}
                        </button>
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserModal;
