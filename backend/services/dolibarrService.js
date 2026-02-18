/**
 * Dolibarr API Integration Service
 * 
 * Handles communication with the Dolibarr ERP system to automatically
 * register clients (third parties) when documents are generated.
 */

const http = require('http');
const https = require('https');

// Dolibarr configuration from environment variables
const DOLIBARR_API_URL = process.env.DOLIBARR_API_URL || 'http://192.168.20.47/api/index.php';
const DOLIBARR_API_KEY = process.env.DOLIBARR_API_KEY || '';
const DOLIBARR_ENABLED = process.env.DOLIBARR_ENABLED === 'true';

/**
 * Make an HTTP request to the Dolibarr API
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {string} endpoint - API endpoint path (e.g., '/thirdparties')
 * @param {Object|null} body - Request body for POST/PUT requests
 * @returns {Promise<Object>} - Parsed JSON response
 */
function dolibarrRequest(method, endpoint, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${DOLIBARR_API_URL}${endpoint}`);
        const isHttps = url.protocol === 'https:';
        const transport = isHttps ? https : http;

        const options = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname + url.search,
            method: method,
            headers: {
                'DOLAPIKEY': DOLIBARR_API_KEY,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        const req = transport.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        reject(new Error(`Dolibarr API error (${res.statusCode}): ${JSON.stringify(parsed)}`));
                    }
                } catch (e) {
                    reject(new Error(`Dolibarr API invalid response (${res.statusCode}): ${data}`));
                }
            });
        });

        req.on('error', (err) => {
            reject(new Error(`Dolibarr API connection error: ${err.message}`));
        });

        // Set a 10-second timeout
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Dolibarr API request timed out after 10 seconds'));
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

/**
 * Map form data from the "Particuliers" (individual) form to Dolibarr thirdparty format
 * @param {Object} data - Form data from the registration form
 * @returns {Object} - Dolibarr thirdparty model
 */
function mapParticuliersToDolibarr(data) {
    return {
        name: `${data.Prenom || ''} ${data.Nom || ''}`.trim(),
        name_alias: data.Nom || '',
        firstname: data.Prenom || '',
        lastname: data.Nom || '',
        email: data.email || '',
        phone_mobile: data.mobile || '',
        address: data.Adresse || '',
        town: data.place || '',
        country_code: 'DZ',
        client: '1',
        code_client: '-1',
        fournisseur: '0',
        typent_code: 'TE_PRIVATE',
        status: '1',
        idprof5: data.Num_CIN || '',       // CIN         (ProfId5DZ=CIN)
        idprof6: data.date_delivery || '', // Date CIN    (ProfId6DZ=DATE CIN)
        note_private: [
            `Autorité: ${data.authority || ''}`,
            `CPE: ${data.cpe_model || ''} (S/N: ${data.cpe_serial || ''})`,
            `Offre: ${data.internet_offer || ''}`,
            `Coordonnées: ${data.latitude || ''}, ${data.longitude || ''}`,
            `Lieu: ${data.place || ''}`
        ].join('\n')
    };
}

/**
 * Map form data from the "Entreprise" (company) form to Dolibarr thirdparty format
 * @param {Object} data - Form data from the registration form
 * @returns {Object} - Dolibarr thirdparty model
 */
function mapEntrepriseToDolibarr(data) {
    return {
        name: data.raison_sociale || '',
        name_alias: data.raison_sociale || '',
        firstname: data.Prenom || '', // Prénom du gérant
        lastname: data.Nom || '',     // Nom du gérant
        email: data.mail || '',
        phone_mobile: data.mobile_gerant || '',
        address: data.Adresse_entreprise || '',
        town: data.place || '',
        country_code: 'DZ',
        idprof1: data.rc || '',                    // RC           (ProfId1DZ=RC)
        idprof2: data.nif || '',                   // NIF          (ProfId2DZ=NIF)
        idprof3: data.article || '',               // AI           (ProfId3DZ=AI)
        idprof4: data.nis || '',                   // NIS          (ProfId4DZ=NIS)
        idprof5: data.numero_cin_gerant || '',     // CIN Gérant   (ProfId5DZ=CIN)
        idprof6: data.date_cin_gerant || '',       // Date CIN Gér (ProfId6DZ=DATE CIN)
        client: '1',
        code_client: '-1',
        fournisseur: '0',
        typent_code: 'TE_SMALL',
        status: '1',
        price_level: '2',
        cond_reglement_code: 'RECEP',
        mode_reglement_code: 'LIQ',
        fk_account: '1',
        note_private: [
            `Gérant: ${data.Prenom || ''} ${data.Nom || ''}`,
            `Autorité CIN: ${data.authority_gerant || ''}`,
            `Adresse installation: ${data.Adresse || ''}`,
            `CPE: ${data.cpe_model || ''} (S/N: ${data.cpe_serial || ''})`,
            `Offre: ${data.internet_offer || ''}`,
            `Coordonnées: ${data.latitude || ''}, ${data.longitude || ''}`,
            `Lieu: ${data.place || ''}`
        ].join('\n')
    };
}

/**
 * Create a new third party (client) in Dolibarr
 * @param {Object} formData - The form data submitted by the user
 * @param {string} clientType - 'particuliers' or 'entreprise'
 * @param {string} reference - The document reference number
 * @returns {Promise<number|null>} - The Dolibarr third party ID, or null if disabled/failed
 */
/**
 * Search for an existing third party by CIN number (Particuliers)
 * @param {string} cin - The CIN number to search for
 * @returns {Promise<Object|null>} - The found third party or null
 */
async function searchThirdPartyByCIN(cin) {
    if (!DOLIBARR_ENABLED || !DOLIBARR_API_KEY || !cin) return null;
    try {
        // Dolibarr 22.x: thirdparties table alias is 's' in sqlfilters
        const encoded = encodeURIComponent(`(s.idprof5:=:'${cin}')`);
        const results = await dolibarrRequest('GET', `/thirdparties?sqlfilters=${encoded}&limit=5`);
        if (Array.isArray(results) && results.length > 0) {
            return results[0];
        }
        return null;
    } catch (error) {
        console.warn(`[Dolibarr] CIN sqlfilters failed: ${error.message}`);
        return null;
    }
}

/**
 * Search for an existing third party by company name (fallback for NIF search)
 * @param {string} name - The company name to search for
 * @returns {Promise<Object|null>} - The found third party or null
 */
async function searchThirdPartyByName(name) {
    if (!DOLIBARR_ENABLED || !DOLIBARR_API_KEY || !name) return null;
    try {
        const encoded = encodeURIComponent(name);
        const results = await dolibarrRequest('GET', `/thirdparties?name=${encoded}&limit=5`);
        if (Array.isArray(results) && results.length > 0) {
            // Verify exact match (API may return partial matches)
            const exact = results.find(r =>
                r.name && r.name.toLowerCase() === name.toLowerCase()
            );
            return exact || results[0];
        }
        return null;
    } catch (error) {
        console.warn(`[Dolibarr] Name search failed: ${error.message}`);
        return null;
    }
}

/**
 * Search for an existing third party by NIF (Entreprise)
 * @param {string} nif - The NIF number to search for
 * @returns {Promise<Object|null>} - The found third party or null
 */
async function searchThirdPartyByNIF(nif, raisonSociale) {
    if (!DOLIBARR_ENABLED || !DOLIBARR_API_KEY || !nif) return null;
    try {
        // Dolibarr 22.x: thirdparties table alias is 's' in sqlfilters
        const encoded = encodeURIComponent(`(s.idprof2:=:'${nif}')`);
        const results = await dolibarrRequest('GET', `/thirdparties?sqlfilters=${encoded}&limit=5`);
        if (Array.isArray(results) && results.length > 0) {
            return results[0];
        }
        return null;
    } catch (error) {
        console.warn(`[Dolibarr] NIF sqlfilters failed (${error.message}), trying name search...`);
        // Fallback: search by company name
        if (raisonSociale) {
            return await searchThirdPartyByName(raisonSociale);
        }
        return null;
    }
}

/**
 * Create a new third party (client) in Dolibarr
 * @param {Object} formData - The form data submitted by the user
 * @param {string} clientType - 'particuliers' or 'entreprise'
 * @param {string} reference - The document reference number
 * @returns {Promise<{id: number, code_client: string}|null>} - The Dolibarr ID and client code, or null
 */
async function createThirdParty(formData, clientType, reference) {
    if (!DOLIBARR_ENABLED) {
        console.log('[Dolibarr] Integration disabled - skipping client creation');
        return null;
    }

    if (!DOLIBARR_API_KEY) {
        console.error('[Dolibarr] API key not configured - skipping client creation');
        return null;
    }

    try {
        // Map form data to Dolibarr format based on client type
        let dolibarrData;
        if (clientType === 'particuliers') {
            dolibarrData = mapParticuliersToDolibarr(formData);
        } else {
            dolibarrData = mapEntrepriseToDolibarr(formData);
        }

        // Add reference to notes
        dolibarrData.note_private += `\nRéférence contrat: ${reference}`;

        console.log(`[Dolibarr] Creating third party for ${clientType}: ${dolibarrData.name}`);

        // Call Dolibarr API to create the third party - returns the new ID
        const thirdPartyId = await dolibarrRequest('POST', '/thirdparties', dolibarrData);

        // Fetch the full record to get the auto-generated code_client
        let code_client = null;
        try {
            const fullRecord = await dolibarrRequest('GET', `/thirdparties/${thirdPartyId}`);
            code_client = fullRecord.code_client || null;
        } catch (fetchErr) {
            console.warn(`[Dolibarr] Could not fetch code_client: ${fetchErr.message}`);
        }

        console.log(`[Dolibarr] ✅ Third party created (ID: ${thirdPartyId}, code: ${code_client})`);
        return { id: thirdPartyId, code_client };

    } catch (error) {
        console.error(`[Dolibarr] ❌ Failed to create third party: ${error.message}`);
        // Don't throw - let document generation continue even if Dolibarr fails
        return null;
    }
}

/**
 * Check connectivity to Dolibarr API
 * @returns {Promise<boolean>} - True if connection is successful
 */
async function checkConnection() {
    try {
        const result = await dolibarrRequest('GET', '/status');
        console.log('[Dolibarr] Connection check: OK');
        return true;
    } catch (error) {
        console.error(`[Dolibarr] Connection check failed: ${error.message}`);
        return false;
    }
}

module.exports = {
    createThirdParty,
    searchThirdPartyByCIN,
    searchThirdPartyByNIF,
    searchThirdPartyByName,
    checkConnection,
    DOLIBARR_ENABLED
};
