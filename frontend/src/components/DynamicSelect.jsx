import { useState, useRef, useEffect } from 'react';

function DynamicSelect({ label, value, onChange, options, onAdd, placeholder, required = false }) {
    const [isAdding, setIsAdding] = useState(false);
    const [newValue, setNewValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [localOptions, setLocalOptions] = useState(options);

    // Update local options when props change
    useEffect(() => {
        setLocalOptions(options);
    }, [options]);

    const handleSelectChange = (e) => {
        const selected = e.target.value;
        if (selected === '__NEW__') {
            setIsAdding(true);
            setNewValue('');
        } else {
            onChange(selected);
        }
    };

    const handleAdd = async () => {
        if (!newValue.trim()) return;

        setLoading(true);
        try {
            const addedItem = await onAdd(newValue);
            if (addedItem) {
                // Determine if addedItem is string or object with name
                const itemName = typeof addedItem === 'object' ? addedItem.name : addedItem;

                // Add to local options if not already there (though parent should update props)
                if (!localOptions.some(opt => (typeof opt === 'object' ? opt.name : opt) === itemName)) {
                    setLocalOptions([...localOptions, addedItem]);
                }

                onChange(itemName);
                setIsAdding(false);
            }
        } catch (error) {
            console.error("Failed to add item:", error);
            alert("Erreur lors de l'ajout: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsAdding(false);
        setNewValue('');
        // Revert to previous value or empty if previous was invalid
        if (!value) onChange('');
    };

    return (
        <div className="form-group dynamic-select-container">
            <label>{label} {required && '*'}</label>

            {!isAdding ? (
                <select
                    value={value}
                    onChange={handleSelectChange}
                    className="dynamic-select"
                    required={required}
                >
                    <option value="">{placeholder || 'Sélectionner...'}</option>
                    {localOptions.map((opt, index) => {
                        const optValue = typeof opt === 'object' ? opt.name : opt;
                        return (
                            <option key={index} value={optValue}>
                                {optValue}
                            </option>
                        );
                    })}
                    <option value="__NEW__" className="add-new-option">
                        + Ajouter nouveau...
                    </option>
                </select>
            ) : (
                <div className="dynamic-input-group">
                    <input
                        type="text"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        placeholder="Saisir nouvelle valeur..."
                        autoFocus
                        className="dynamic-input"
                    />
                    <div className="dynamic-actions">
                        <button
                            type="button"
                            onClick={handleAdd}
                            disabled={loading}
                            className="btn-add-confirm"
                        >
                            {loading ? '...' : '✓'}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="btn-add-cancel"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DynamicSelect;
