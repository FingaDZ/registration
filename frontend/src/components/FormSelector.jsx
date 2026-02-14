import { Link } from 'react-router-dom';

function FormSelector() {
    return (
        <div className="form-selector">
            <h1>Choisissez le type de formulaire</h1>
            <p className="subtitle">Sélectionnez le type d'enregistrement que vous souhaitez effectuer</p>

            <div className="card-grid">
                <Link to="/particuliers" className="selection-card">
                    <div className="card-icon">👤</div>
                    <h2>Particuliers</h2>
                    <p>Formulaire d'enregistrement pour les particuliers</p>
                    <button className="btn btn-primary">Commencer →</button>
                </Link>

                <Link to="/entreprise" className="selection-card">
                    <div className="card-icon">🏢</div>
                    <h2>Entreprise</h2>
                    <p>Formulaire d'enregistrement pour les entreprises</p>
                    <button className="btn btn-primary">Commencer →</button>
                </Link>
            </div>
        </div>
    );
}

export default FormSelector;
