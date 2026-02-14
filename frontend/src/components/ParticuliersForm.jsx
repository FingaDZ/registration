import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function ParticuliersForm() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        Nom: '',
        Prenom: '',
        Num_CIN: '',
        Adresse: '',
        email: '',
        mobile: '',
        place: '',
        latitude: '',
        longitude: '',
        cpe_model: '',
        cpe_serial: '',
        authority: '',
        date_delivery: '',
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
                type: 'particuliers',
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
                <h1>Formulaire Particuliers</h1>
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
                    <h2>Informations Personnelles</h2>
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
                            <label htmlFor="Num_CIN">Numéro CIN *</label>
                            <input
                                type="text"
                                id="Num_CIN"
                                name="Num_CIN"
                                value={formData.Num_CIN}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email *</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="mobile">Mobile *</label>
                            <input
                                type="tel"
                                id="mobile"
                                name="mobile"
                                value={formData.mobile}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group full-width">
                            <label htmlFor="Adresse">Adresse *</label>
                            <input
                                type="text"
                                id="Adresse"
                                name="Adresse"
                                value={formData.Adresse}
                                onChange={handleChange}
                                required
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

                        <div className="form-group">
                            <label htmlFor="authority">Autorité</label>
                            <input
                                type="text"
                                id="authority"
                                name="authority"
                                value={formData.authority}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="date_delivery">Date CIN</label>
                            <input
                                type="date"
                                id="date_delivery"
                                name="date_delivery"
                                value={formData.date_delivery}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="date">Date du formulaire</label>
                            <input
                                type="date"
                                id="date"
                                name="date"
                                value={formData.date}
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

export default ParticuliersForm;
