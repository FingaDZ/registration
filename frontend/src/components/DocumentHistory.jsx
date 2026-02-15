import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

function DocumentHistory() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        type: '',
        startDate: '',
        endDate: ''
    });
    const [pagination, setPagination] = useState({
        limit: 20,
        offset: 0,
        total: 0
    });

    // Edit/Delete states
    const [editingDoc, setEditingDoc] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchDocuments();
    }, [filters, pagination.offset]);

    const fetchDocuments = async () => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                limit: pagination.limit,
                offset: pagination.offset,
                ...(filters.type && { type: filters.type }),
                ...(filters.startDate && { startDate: filters.startDate }),
                ...(filters.endDate && { endDate: filters.endDate })
            });

            const response = await axios.get(`/api/documents?${params}`);
            setDocuments(response.data.documents);
            setPagination(prev => ({
                ...prev,
                total: response.data.pagination.total
            }));
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors du chargement des documents');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value
        });
        setPagination(prev => ({ ...prev, offset: 0 }));
    };

    const downloadDocument = (reference, language) => {
        window.open(`/api/download/${reference}/${language}`, '_blank');
    };

    const handleEdit = async (doc) => {
        try {
            const response = await axios.get(`/api/documents/${doc.reference}`);
            setEditingDoc(response.data.document);
        } catch (err) {
            setError('Erreur lors du chargement du document');
        }
    };

    const handleDelete = async (reference) => {
        setActionLoading(true);
        try {
            await axios.delete(`/api/documents/${reference}`);
            setDeleteConfirm(null);
            fetchDocuments();
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la suppression');
        } finally {
            setActionLoading(false);
        }
    };

    const nextPage = () => {
        setPagination(prev => ({
            ...prev,
            offset: prev.offset + prev.limit
        }));
    };

    const prevPage = () => {
        setPagination(prev => ({
            ...prev,
            offset: Math.max(0, prev.offset - prev.limit)
        }));
    };

    return (
        <div className="history-container">
            <h1>Historique des Documents</h1>
            <p>Consultez et téléchargez vos documents générés</p>

            <div className="filters">
                <div className="filter-group">
                    <label htmlFor="type">Type</label>
                    <select
                        id="type"
                        name="type"
                        value={filters.type}
                        onChange={handleFilterChange}
                    >
                        <option value="">Tous</option>
                        <option value="particuliers">Particuliers</option>
                        <option value="entreprise">Entreprise</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="startDate">Date début</label>
                    <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={filters.startDate}
                        onChange={handleFilterChange}
                    />
                </div>

                <div className="filter-group">
                    <label htmlFor="endDate">Date fin</label>
                    <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        value={filters.endDate}
                        onChange={handleFilterChange}
                    />
                </div>

                <button onClick={fetchDocuments} className="btn btn-primary">
                    🔍 Rechercher
                </button>
            </div>

            {error && (
                <div className="alert alert-error">
                    <strong>Erreur:</strong> {error}
                </div>
            )}

            {loading ? (
                <div className="loading">Chargement...</div>
            ) : (
                <>
                    <div className="table-container">
                        <table className="documents-table">
                            <thead>
                                <tr>
                                    <th>Référence</th>
                                    <th>Type</th>
                                    <th>Date de création</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {documents.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="no-data">Aucun document trouvé</td>
                                    </tr>
                                ) : (
                                    documents.map((doc) => (
                                        <tr key={doc.id}>
                                            <td className="reference">{doc.reference}</td>
                                            <td>
                                                <span className={`badge badge-${doc.document_type}`}>
                                                    {doc.document_type === 'particuliers' ? '👤 Particuliers' : '🏢 Entreprise'}
                                                </span>
                                            </td>
                                            <td>{format(new Date(doc.created_at), 'dd/MM/yyyy HH:mm')}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        onClick={() => downloadDocument(doc.reference, 'fr')}
                                                        className="btn btn-sm btn-success"
                                                        title="Télécharger version française"
                                                    >
                                                        FR
                                                    </button>
                                                    <button
                                                        onClick={() => downloadDocument(doc.reference, 'ar')}
                                                        className="btn btn-sm btn-success"
                                                        title="Télécharger version arabe"
                                                    >
                                                        AR
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(doc)}
                                                        className="btn btn-sm btn-edit"
                                                        title="Modifier"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirm(doc.reference)}
                                                        className="btn btn-sm btn-delete"
                                                        title="Supprimer"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {documents.length > 0 && (
                        <div className="pagination">
                            <button
                                onClick={prevPage}
                                disabled={pagination.offset === 0}
                                className="btn btn-secondary"
                            >
                                ← Précédent
                            </button>
                            <span className="pagination-info">
                                {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} sur {pagination.total}
                            </span>
                            <button
                                onClick={nextPage}
                                disabled={pagination.offset + pagination.limit >= pagination.total}
                                className="btn btn-secondary"
                            >
                                Suivant →
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Confirmer la suppression</h2>
                        <p>Êtes-vous sûr de vouloir supprimer le document <strong>{deleteConfirm}</strong> ?</p>
                        <p className="warning-text">Cette action est irréversible.</p>
                        <div className="modal-actions">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="btn btn-secondary"
                                disabled={actionLoading}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="btn btn-delete"
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Suppression...' : 'Supprimer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal - Placeholder for now */}
            {editingDoc && (
                <div className="modal-overlay" onClick={() => setEditingDoc(null)}>
                    <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
                        <h2>Modifier le document</h2>
                        <p>Référence: <strong>{editingDoc.reference}</strong></p>
                        <p className="info-text">La fonctionnalité d'édition complète sera implémentée prochainement.</p>
                        <p className="info-text">Pour l'instant, vous pouvez supprimer et recréer le document.</p>
                        <div className="modal-actions">
                            <button
                                onClick={() => setEditingDoc(null)}
                                className="btn btn-primary"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DocumentHistory;
