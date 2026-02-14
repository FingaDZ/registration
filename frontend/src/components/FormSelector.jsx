import { Link } from 'react-router-dom';

function FormSelector() {
    return (
        <div className="form-selector">
            <h1>Choisissez le type de formulaire</h1>
            <p className="subtitle">Sélectionnez le type d'enregistrement que vous souhaitez effectuer</p>

            <div className="card-grid">
                <Link to="/particuliers" className="selection-card">
                    <div className="card-icon">👤</div>
                    <h2>PARTICULIERS</h2>
                    <p>Enregistrement pour les clients individuels. Génération automatique des contrats.</p>
                    <span className="btn btn-primary">COMMANDER</span>
                </Link>

                <Link to="/entreprise" className="selection-card">
                    <div className="card-icon">🏢</div>
                    <h2>ENTREPRISE</h2>
                    <p>Enregistrement pour les clients professionnels et gestion des gérants.</p>
                    <span className="btn btn-primary">COMMANDER</span>
                </Link>
            </div>
        </div>
    );
}

export default FormSelector;
