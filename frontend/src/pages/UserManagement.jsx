import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../index.css'; // Use shared styles

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null); // For editing
    const [formData, setFormData] = useState({ username: '', password: '', role: 'operator' });

    const { user: authUser } = useAuth();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/users');
            setUsers(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Impossible de charger les utilisateurs');
            setLoading(false);
        }
    };

    const handleOpenModal = (user = null) => {
        if (user) {
            setCurrentUser(user);
            setFormData({ username: user.username, password: '', role: user.role });
        } else {
            setCurrentUser(null);
            setFormData({ username: '', password: '', role: 'operator' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (currentUser) {
                // Update
                const payload = { role: formData.role };
                if (formData.password) payload.password = formData.password;

                await axios.put(`/api/users/${currentUser.id}`, payload);
            } else {
                // Create
                await axios.post('/api/users', formData);
            }
            fetchUsers();
            handleCloseModal();
        } catch (err) {
            setError(err.response?.data?.error || 'Une erreur est survenue');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

        try {
            await axios.delete(`/api/users/${id}`);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.error || 'Erreur lors de la suppression');
        }
    };

    return (
        <div className="history-container">
            <h1 style={{ marginBottom: '2rem' }}>Gestion des Utilisateurs</h1>

            <div style={{ marginBottom: '2rem' }}>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    + Nouvel Utilisateur
                </button>
            </div>

            <div className="table-container">
                <table className="documents-table">
                    <thead>
                        <tr>
                            <th>Utilisateur</th>
                            <th>Rôle</th>
                            <th>Date Création</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ textAlign: 'center' }}>Chargement...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan="4" className="no-data">Aucun utilisateur trouvé</td></tr>
                        ) : (
                            users.map(u => (
                                <tr key={u.id}>
                                    <td>{u.username}</td>
                                    <td>
                                        <span className={`badge ${u.role === 'admin' ? 'badge-entreprise' : 'badge-particuliers'}`}>
                                            {u.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="btn btn-sm btn-edit"
                                                onClick={() => handleOpenModal(u)}
                                            >
                                                Modifier
                                            </button>
                                            {// Prevent deleting self
                                                u.id !== authUser?.id && (
                                                    <button
                                                        className="btn btn-sm btn-delete"
                                                        onClick={() => handleDelete(u.id)}
                                                    >
                                                        Supprimer
                                                    </button>
                                                )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>{currentUser ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}</h2>

                        {error && <div className="warning-text" style={{ marginBottom: '1rem' }}>{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label>Nom d'utilisateur</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    disabled={!!currentUser} // Cannot change username
                                    required
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label>Mot de passe {currentUser && '(laisser vide pour ne pas changer)'}</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required={!currentUser}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label>Rôle</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    style={{
                                        background: 'var(--surface-color)',
                                        border: '1px solid var(--border-color)',
                                        color: 'white',
                                        padding: '1rem',
                                        width: '100%',
                                        borderRadius: '4px'
                                    }}
                                >
                                    <option value="operator">Opérateur</option>
                                    <option value="admin">Administrateur</option>
                                </select>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Annuler</button>
                                <button type="submit" className="btn btn-primary">Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
