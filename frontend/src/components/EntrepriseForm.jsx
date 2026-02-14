import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function EntrepriseForm() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        raison_sociale: '',
        Adresse_entreprise: '',
        nif: '',
        nis: '',
        rc: '',
        article: '',
        Nom: '',
        Prenom: '',
        numero_cin_gerant: '',
        date_cin_gerant: '',
        authority_gerant: '',
        mail: '',
        mobilegerant: '',
        Adresse: '',
        place: '',
        latitude: '',
        longitude: '',
        cpe_model: '',
        cpe_serial: '',
        Date: new Date().toISOString().split('T')[0],
        date: new Date().toISOString().split('T')[0]
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await axios.post('/api/generate', {
                type: 'entreprise',
                data: formData
            });

            setResult(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la génération du document');
        } finally {
            setLoading(false);
        }
    };

    const downloadDocument = (reference, language) => {
        window.open(`/api/download/${reference}/${language}`, '_blank');
    };

    return (
        <div className="form-container">
            <div className="form-header">
                <button onClick={() => navigate('/')} className="btn-back">← Retour</button>
                <h1>Formulaire Entreprise</h1>
                <p>Remplissez tous les champs requis pour générer les documents</p>
            </div>

            {result && (
                <div className="alert alert-success">
                    <h3>✓ Documents générés avec succès!</h3>
                    <p><strong>Référence:</strong> {result.reference}</p>
                    <div className="download-buttons">
                        <button
                            onClick={() => downloadDocument(result.reference, 'fr')}
                            className="btn btn-success"
                        >
                            📄 Télécharger (Français)
                        </button>
                        <button
                            onClick={() => downloadDocument(result.reference, 'ar')}
                            className="btn btn-success"
                        >
                            📄 Télécharger (Arabe)
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    <strong>Erreur:</strong> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="form">
                <div className="form-section">
                    <h2>Informations Entreprise</h2>
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label htmlFor="raison_sociale">Raison Sociale *</label>
                            <input
                                type="text"
                                id="raison_sociale"
                                name="raison_sociale"
                                value={formData.raison_sociale}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group full-width">
                            <label htmlFor="Adresse_entreprise">Adresse Entreprise *</label>
                            <input
                                type="text"
                                id="Adresse_entreprise"
                                name="Adresse_entreprise"
                                value={formData.Adresse_entreprise}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="nif">NIF *</label>
                            <input
                                type="text"
                                id="nif"
                                name="nif"
                                value={formData.nif}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="nis">NIS *</label>
                            <input
                                type="text"
                                id="nis"
                                name="nis"
                                value={formData.nis}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="rc">RC *</label>
                            <input
                                type="text"
                                id="rc"
                                name="rc"
                                value={formData.rc}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="article">Article</label>
                            <input
                                type="text"
                                id="article"
                                name="article"
                                value={formData.article}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h2>Informations Gérant</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="Nom">Nom *</label>
                            <input
                                type="text"
                                id="Nom"
                                name="Nom"
                                value={formData.Nom}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="Prenom">Prénom *</label>
                            <input
                                type="text"
                                id="Prenom"
                                name="Prenom"
                                value={formData.Prenom}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="numero_cin_gerant">Numéro CIN Gérant *</label>
                            <input
                                type="text"
                                id="numero_cin_gerant"
                                name="numero_cin_gerant"
                                value={formData.numero_cin_gerant}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="date_cin_gerant">Date CIN Gérant</label>
                            <input
                                type="date"
                                id="date_cin_gerant"
                                name="date_cin_gerant"
                                value={formData.date_cin_gerant}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="authority_gerant">Autorité Gérant</label>
                            <input
                                type="text"
                                id="authority_gerant"
                                name="authority_gerant"
                                value={formData.authority_gerant}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="mail">Email *</label>
                            <input
                                type="email"
                                id="mail"
                                name="mail"
                                value={formData.mail}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="mobilegerant">Mobile Gérant *</label>
                            <input
                                type="tel"
                                id="mobilegerant"
                                name="mobilegerant"
                                value={formData.mobilegerant}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group full-width">
                            <label htmlFor="Adresse">Adresse Gérant</label>
                            <input
                                type="text"
                                id="Adresse"
                                name="Adresse"
                                value={formData.Adresse}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h2>Localisation</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="place">Lieu *</label>
                            <input
                                type="text"
                                id="place"
                                name="place"
                                value={formData.place}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="latitude">Latitude</label>
                            <input
                                type="text"
                                id="latitude"
                                name="latitude"
                                value={formData.latitude}
                                onChange={handleChange}
                                placeholder="Ex: 36.7538"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="longitude">Longitude</label>
                            <input
                                type="text"
                                id="longitude"
                                name="longitude"
                                value={formData.longitude}
                                onChange={handleChange}
                                placeholder="Ex: 3.0588"
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h2>Informations Techniques</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="cpe_model">Modèle CPE *</label>
                            <input
                                type="text"
                                id="cpe_model"
                                name="cpe_model"
                                value={formData.cpe_model}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="cpe_serial">Numéro de série CPE *</label>
                            <input
                                type="text"
                                id="cpe_serial"
                                name="cpe_serial"
                                value={formData.cpe_serial}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" onClick={() => navigate('/')} className="btn btn-secondary">
                        Annuler
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Génération en cours...' : '📄 Générer les documents'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default EntrepriseForm;
