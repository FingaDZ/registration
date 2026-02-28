import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DynamicSelect from './DynamicSelect';
import { format } from 'date-fns';

function ParticuliersForm() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [duplicateWarning, setDuplicateWarning] = useState(null); // { existingClient, existingDocuments }

    // Dynamic Data States
    const [cpeModels, setCpeModels] = useState([]);
    const [internetOffers, setInternetOffers] = useState([]);

    const [formData, setFormData] = useState({
        // French (Latin) fields
        Nom: '',
        Prenom: '',
        Num_CIN: '',
        Adresse: '',
        authority: '',
        place: '',
        email: '',
        mobile: '',
        latitude: '',
        longitude: '',
        cpe_model: '',
        cpe_serial: '',
        date_delivery: '',
        date: new Date().toISOString().split('T')[0],
        internet_offer: '',
        // Arabic fields (for AR document)
        Nom_ar: '',
        Prenom_ar: '',
        Adresse_ar: '',
        authority_ar: '',
        place_ar: ''
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async (retries = 3) => {
        try {
            const [modelsRes, offersRes] = await Promise.all([
                axios.get('/api/config/models'),
                axios.get('/api/config/offers')
            ]);
            setCpeModels(modelsRes.data.map(m => m.name));
            setInternetOffers(offersRes.data.map(o => o.name));
        } catch (err) {
            console.error(`Error fetching config (${retries} retries left):`, err);
            if (retries > 0) {
                setTimeout(() => fetchConfig(retries - 1), 3000);
            }
        }
    };

    const handleAddModel = async (newValue) => {
        const res = await axios.post('/api/config/models', { name: newValue });
        return res.data.name;
    };

    const handleAddOffer = async (newValue) => {
        const res = await axios.post('/api/config/offers', { name: newValue });
        return res.data.name;
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e, force = false) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        // Check for duplicates first (unless forced)
        if (!force) {
            try {
                const dupRes = await axios.post('/api/check-duplicate', { type: 'particuliers', data: formData });
                if (dupRes.data.isDuplicate) {
                    setDuplicateWarning(dupRes.data);
                    setLoading(false);
                    return;
                }
            } catch (dupErr) {
                console.warn('Duplicate check failed (non-blocking):', dupErr.message);
            }
        }

        try {
            const response = await axios.post('/api/generate', {
                type: 'particuliers',
                data: formData
            });

            setResult(response.data);
            setDuplicateWarning(null);
            // Scroll to bottom to see results
            setTimeout(() => {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }, 100);
        } catch (err) {
            setError(err.response?.data?.message || 'Erreur lors de la génération du document');
        } finally {
            setLoading(false);
        }
    };

    const handleForceSubmit = (e) => {
        // Create a synthetic event-like object for handleSubmit
        handleSubmit({ preventDefault: () => { } }, true);
    };

    const downloadDocument = (reference, language) => {
        const token = localStorage.getItem('token');
        window.open(`/api/download/${reference}/${language}?token=${token}`, '_blank');
    };

    return (
        <div className="form-container">
            <div className="form-header">
                <button onClick={() => navigate('/')} className="btn-back">← Retour</button>
                <h1>Formulaire Particuliers</h1>
                <p>Remplissez les informations ci-dessous pour générer le contrat.</p>
            </div>

            {/* Duplicate Warning Modal */}
            {duplicateWarning && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>⚠️ Client déjà enregistré</h2>
                        {duplicateWarning.existingClient && (
                            <div className="duplicate-info">
                                <p><strong>Dolibarr :</strong> {duplicateWarning.existingClient.name} ({duplicateWarning.existingClient.code_client})</p>
                                {duplicateWarning.existingClient.email && <p>Email: {duplicateWarning.existingClient.email}</p>}
                                {duplicateWarning.existingClient.phone && <p>Tél: {duplicateWarning.existingClient.phone}</p>}
                            </div>
                        )}
                        {duplicateWarning.existingDocuments?.length > 0 && (
                            <div className="duplicate-docs">
                                <p><strong>Documents existants :</strong></p>
                                <ul>
                                    {duplicateWarning.existingDocuments.map(doc => (
                                        <li key={doc.reference}>
                                            {doc.reference} — {doc.prenom} {doc.nom} — {format(new Date(doc.created_at), 'dd/MM/yyyy')}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <p className="warning-text">Ce client semble déjà exister. Voulez-vous continuer quand même (ex: renouvellement) ?</p>
                        <div className="modal-actions">
                            <button onClick={() => setDuplicateWarning(null)} className="btn btn-secondary">Annuler</button>
                            <button onClick={handleForceSubmit} className="btn btn-primary" disabled={loading}>
                                {loading ? 'Génération...' : 'Continuer quand même'}
                            </button>
                        </div>
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

                    {/* Bilingual two-column layout */}
                    <div className="bilingual-grid">
                        {/* FR Column */}
                        <div className="lang-col lang-fr">
                            <div className="lang-col-header">🇫🇷 Version Française</div>
                            <div className="form-group">
                                <label htmlFor="Nom">Nom de famille *</label>
                                <input type="text" id="Nom" name="Nom" value={formData.Nom}
                                    onChange={handleChange} placeholder="ex: BENALI" required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="Prenom">Prénom *</label>
                                <input type="text" id="Prenom" name="Prenom" value={formData.Prenom}
                                    onChange={handleChange} placeholder="ex: Mohamed" required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="authority">Autorité (délivrée par) *</label>
                                <input type="text" id="authority" name="authority" value={formData.authority}
                                    onChange={handleChange} placeholder="ex: APC Alger Centre" required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="Adresse">Adresse de résidence *</label>
                                <input type="text" id="Adresse" name="Adresse" value={formData.Adresse}
                                    onChange={handleChange} placeholder="ex: 12 Rue des Martyrs, Alger" required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="place">Lieu de signature</label>
                                <input type="text" id="place" name="place" value={formData.place}
                                    onChange={handleChange} placeholder="ex: Alger" />
                            </div>
                        </div>

                        {/* AR Column */}
                        <div className="lang-col lang-ar" dir="rtl">
                            <div className="lang-col-header">🇩🇿 النسخة العربية</div>
                            <div className="form-group">
                                <label htmlFor="Nom_ar">اللقب</label>
                                <input type="text" id="Nom_ar" name="Nom_ar" value={formData.Nom_ar}
                                    onChange={handleChange} placeholder="مثال: بن علي" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="Prenom_ar">الاسم</label>
                                <input type="text" id="Prenom_ar" name="Prenom_ar" value={formData.Prenom_ar}
                                    onChange={handleChange} placeholder="مثال: محمد" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="authority_ar">جهة الإصدار</label>
                                <input type="text" id="authority_ar" name="authority_ar" value={formData.authority_ar}
                                    onChange={handleChange} placeholder="مثال: بلدية الجزائر الوسطى" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="Adresse_ar">عنوان الإقامة</label>
                                <input type="text" id="Adresse_ar" name="Adresse_ar" value={formData.Adresse_ar}
                                    onChange={handleChange} placeholder="مثال: 12 شارع الشهداء، الجزائر" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="place_ar">مكان التوقيع</label>
                                <input type="text" id="place_ar" name="place_ar" value={formData.place_ar}
                                    onChange={handleChange} placeholder="مثال: الجزائر" />
                            </div>
                        </div>
                    </div>

                    {/* Shared fields (universal) */}
                    <div className="form-grid" style={{ marginTop: '1.5rem' }}>
                        <div className="form-group">
                            <label htmlFor="Num_CIN">Numéro CIN *</label>
                            <input type="text" id="Num_CIN" name="Num_CIN" value={formData.Num_CIN}
                                onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="date_delivery">Date de délivrance CIN *</label>
                            <input type="date" id="date_delivery" name="date_delivery" value={formData.date_delivery}
                                onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">Adresse Email</label>
                            <input type="email" id="email" name="email" value={formData.email}
                                onChange={handleChange} placeholder="Optionnel" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="mobile">Numéro Mobile *</label>
                            <input type="tel" id="mobile" name="mobile" value={formData.mobile}
                                onChange={handleChange} placeholder="05XXXXXXXX" required />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h2>Données Techniques & Offre</h2>
                    <div className="form-grid">

                        <DynamicSelect
                            label="Modèle du CPE"
                            value={formData.cpe_model}
                            onChange={(val) => handleSelectChange('cpe_model', val)}
                            options={cpeModels}
                            onAdd={handleAddModel}
                            placeholder="Choisir un modèle..."
                            required={true}
                        />

                        <div className="form-group">
                            <label htmlFor="cpe_serial">Numéro de série (S/N) *</label>
                            <input
                                type="text"
                                id="cpe_serial"
                                name="cpe_serial"
                                value={formData.cpe_serial}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <DynamicSelect
                            label="Offre Internet"
                            value={formData.internet_offer}
                            onChange={(val) => handleSelectChange('internet_offer', val)}
                            options={internetOffers}
                            onAdd={handleAddOffer}
                            placeholder="Choisir une offre..."
                            required={true}
                        />

                        <div className="form-group">
                            <label htmlFor="place">Fait à (Lieu) *</label>
                            <input
                                type="text"
                                id="place"
                                name="place"
                                value={formData.place}
                                onChange={handleChange}
                                placeholder="ex: Alger"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="date">Date du formulaire *</label>
                            <input
                                type="date"
                                id="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="latitude">Latitude GPS</label>
                            <input
                                type="text"
                                id="latitude"
                                name="latitude"
                                value={formData.latitude}
                                onChange={handleChange}
                                placeholder="Ex: 36.7538 (Optionnel)"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="longitude">Longitude GPS</label>
                            <input
                                type="text"
                                id="longitude"
                                name="longitude"
                                value={formData.longitude}
                                onChange={handleChange}
                                placeholder="Ex: 3.0588 (Optionnel)"
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

            {result && (
                <div className="result-section">
                    <div className="alert alert-success">
                        <h3>✓ Documents générés avec succès!</h3>
                        {result.dolibarrId ? (
                            <p className="status-success">✓ Client créé dans Dolibarr (ID: {result.dolibarrId})</p>
                        ) : (
                            <p className="status-warning">⚠ Inscription Dolibarr échouée (vérifier logs)</p>
                        )}
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
                </div>
            )}
        </div>
    );
}

export default ParticuliersForm;
