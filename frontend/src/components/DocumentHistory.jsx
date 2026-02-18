import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

function DocumentHistory() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ type: '', startDate: '', endDate: '' });
    const [pagination, setPagination] = useState({ limit: 20, offset: 0, total: 0 });

    // Edit/Delete states
    const [editingDoc, setEditingDoc] = useState(null);
    const [editFormData, setEditFormData] = useState({});
    const [editError, setEditError] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Config for dropdowns
    const [cpeModels, setCpeModels] = useState([]);
    const [internetOffers, setInternetOffers] = useState([]);

    useEffect(() => {
        fetchDocuments();
        fetchConfig();
    }, [filters, pagination.offset]);

    const fetchConfig = async () => {
        try {
            const [modelsRes, offersRes] = await Promise.all([
                axios.get('/api/config/models'),
                axios.get('/api/config/offers')
            ]);
            setCpeModels(modelsRes.data.map(m => m.name));
            setInternetOffers(offersRes.data.map(o => o.name));
        } catch (err) {
            console.error('Error fetching config:', err);
        }
    };

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
        const token = localStorage.getItem('token');
        window.open(`/api/download/${reference}/${language}?token=${token}`, '_blank');
    };

    const handleEdit = async (doc) => {
        try {
            const response = await axios.get(`/api/documents/${doc.reference}`);
            const fullDoc = response.data.document;
            setEditingDoc(fullDoc);
            // Pre-fill form with existing user_data, convert dates back to YYYY-MM-DD for inputs
            const ud = fullDoc.user_data || {};
            const toInputDate = (val) => {
                if (!val) return '';
                // If already YYYY-MM-DD, return as-is
                if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
                // If DD-MM-YYYY, convert
                const parts = val.split('-');
                if (parts.length === 3 && parts[0].length === 2) return `${parts[2]}-${parts[1]}-${parts[0]}`;
                return val;
            };
            setEditFormData({
                ...ud,
                date: toInputDate(ud.date),
                date_delivery: toInputDate(ud.date_delivery),
                date_cin_gerant: toInputDate(ud.date_cin_gerant),
            });
            setEditError(null);
        } catch (err) {
            setError('Erreur lors du chargement du document');
        }
    };

    const handleEditChange = (e) => {
        setEditFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSaveEdit = async () => {
        if (!editFormData.cpe_model?.trim()) {
            setEditError('Le modèle CPE est obligatoire.');
            return;
        }
        if (!editFormData.cpe_serial?.trim()) {
            setEditError('Le numéro de série CPE est obligatoire.');
            return;
        }
        setActionLoading(true);
        setEditError(null);
        try {
            await axios.put(`/api/documents/${editingDoc.reference}`, { data: editFormData });
            setEditingDoc(null);
            setEditFormData({});
            fetchDocuments();
        } catch (err) {
            setEditError(err.response?.data?.error || 'Erreur lors de la sauvegarde.');
        } finally {
            setActionLoading(false);
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

            {/* Edit Modal */}
            {editingDoc && (
                <div className="modal-overlay" onClick={() => setEditingDoc(null)}>
                    <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
                        <h2>✏️ Modifier le document</h2>
                        <p style={{ opacity: 0.6, marginBottom: '1.5rem' }}>Référence: <strong>{editingDoc.reference}</strong> — {editingDoc.document_type === 'particuliers' ? '👤 Particuliers' : '🏢 Entreprise'}</p>

                        {editError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}><strong>Erreur:</strong> {editError}</div>}

                        <div className="edit-form-grid">
                            {editingDoc.document_type === 'particuliers' ? (
                                <>
                                    <div className="form-group"><label>Nom *</label><input name="Nom" value={editFormData.Nom || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>Prénom *</label><input name="Prenom" value={editFormData.Prenom || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>N° CIN *</label><input name="Num_CIN" value={editFormData.Num_CIN || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>Autorité</label><input name="authority" value={editFormData.authority || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>Date délivrance CIN</label><input type="date" name="date_delivery" value={editFormData.date_delivery || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>Adresse</label><input name="Adresse" value={editFormData.Adresse || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>Email</label><input type="email" name="email" value={editFormData.email || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>Mobile</label><input name="mobile" value={editFormData.mobile || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>Lieu</label><input name="place" value={editFormData.place || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>Date contrat</label><input type="date" name="date" value={editFormData.date || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>Modèle CPE *</label>
                                        <select name="cpe_model" value={editFormData.cpe_model || ''} onChange={handleEditChange} className="form-input">
                                            <option value="">Sélectionner...</option>
                                            {cpeModels.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group"><label>N° Série CPE *</label><input name="cpe_serial" value={editFormData.cpe_serial || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>Offre Internet</label>
                                        <select name="internet_offer" value={editFormData.internet_offer || ''} onChange={handleEditChange} className="form-input">
                                            <option value="">Sélectionner...</option>
                                            {internetOffers.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Latitude</label><input name="latitude" value={editFormData.latitude || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>Longitude</label><input name="longitude" value={editFormData.longitude || ''} onChange={handleEditChange} className="form-input" /></div>
                                </>
                            ) : (
                                <>
                                    <div className="form-group"><label>Raison Sociale *</label><input name="raison_sociale" value={editFormData.raison_sociale || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>NIF</label><input name="nif" value={editFormData.nif || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>RC</label><input name="rc" value={editFormData.rc || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>AI (Article)</label><input name="article" value={editFormData.article || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>NIS</label><input name="nis" value={editFormData.nis || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>Adresse Entreprise</label><input name="Adresse_entreprise" value={editFormData.Adresse_entreprise || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>Email</label><input type="email" name="mail" value={editFormData.mail || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>Nom Gérant</label><input name="Nom" value={editFormData.Nom || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>Prénom Gérant</label><input name="Prenom" value={editFormData.Prenom || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>CIN Gérant</label><input name="numero_cin_gerant" value={editFormData.numero_cin_gerant || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>Date CIN Gérant</label><input type="date" name="date_cin_gerant" value={editFormData.date_cin_gerant || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>Autorité CIN Gérant</label><input name="authority_gerant" value={editFormData.authority_gerant || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>Mobile Gérant</label><input name="mobile_gerant" value={editFormData.mobile_gerant || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>Lieu</label><input name="place" value={editFormData.place || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>Date contrat</label><input type="date" name="date" value={editFormData.date || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>Modèle CPE *</label>
                                        <select name="cpe_model" value={editFormData.cpe_model || ''} onChange={handleEditChange} className="form-input">
                                            <option value="">Sélectionner...</option>
                                            {cpeModels.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group"><label>N° Série CPE *</label><input name="cpe_serial" value={editFormData.cpe_serial || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>Offre Internet</label>
                                        <select name="internet_offer" value={editFormData.internet_offer || ''} onChange={handleEditChange} className="form-input">
                                            <option value="">Sélectionner...</option>
                                            {internetOffers.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group"><label>Adresse Installation</label><input name="Adresse" value={editFormData.Adresse || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>Latitude</label><input name="latitude" value={editFormData.latitude || ''} onChange={handleEditChange} className="form-input" /></div>
                                    <div className="form-group"><label>Longitude</label><input name="longitude" value={editFormData.longitude || ''} onChange={handleEditChange} className="form-input" /></div>
                                </>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button onClick={() => { setEditingDoc(null); setEditError(null); }} className="btn btn-secondary" disabled={actionLoading}>Annuler</button>
                            <button onClick={handleSaveEdit} className="btn btn-primary" disabled={actionLoading}>
                                {actionLoading ? 'Sauvegarde...' : '💾 Sauvegarder et régénérer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DocumentHistory;
