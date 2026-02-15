const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');
const { pool } = require('../database/init');
const dolibarrService = require('./dolibarrService');

// Template paths
const TEMPLATES = {
    particuliers: {
        fr: path.join(__dirname, '../templates/MODELE Particuliers.docx'),
        ar: path.join(__dirname, '../templates/MODELE Particuliers AR.docx')
    },
    entreprise: {
        fr: path.join(__dirname, '../templates/MODEL ENTREPRISE.docx'),
        ar: path.join(__dirname, '../templates/MODEL ENTREPRISE AR.docx')
    }
};

// Generate unique reference number
function generateReference() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `REG-${year}${month}${day}-${random}`;
}

// Format date to DD-MM-YYYY
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

// Generate document from template
function generateDocumentFromTemplate(templatePath, data) {
    try {
        // Load template
        const content = fs.readFileSync(templatePath, 'binary');
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        // Replace placeholders with data
        doc.render(data);

        // Generate buffer
        const buffer = doc.getZip().generate({
            type: 'nodebuffer',
            compression: 'DEFLATE',
        });

        return buffer;
    } catch (error) {
        console.error('Error generating document:', error);
        throw new Error(`Document generation failed: ${error.message}`);
    }
}

// Main document generation function
async function generateDocuments(type, data) {
    try {
        // Validate type
        if (!['particuliers', 'entreprise'].includes(type)) {
            throw new Error('Invalid document type. Must be "particuliers" or "entreprise"');
        }

        // Check if templates exist
        const templateFr = TEMPLATES[type].fr;
        const templateAr = TEMPLATES[type].ar;

        if (!fs.existsSync(templateFr)) {
            throw new Error(`French template not found: ${templateFr}`);
        }
        if (!fs.existsSync(templateAr)) {
            throw new Error(`Arabic template not found: ${templateAr}`);
        }

        // Generate reference
        const reference = generateReference();

        // Format dates to DD-MM-YYYY
        const formattedData = {
            ...data,
            date: formatDate(data.date),
            date_delivery: formatDate(data.date_delivery),
            Date: formatDate(data.Date || data.date),
            Reference_client: '' // Leave empty as requested
        };

        if (type === 'entreprise' && data.date_cin_gerant) {
            formattedData.date_cin_gerant = formatDate(data.date_cin_gerant);
        }

        // Handle Internet Offer mapping
        if (data.internet_offer) {
            formattedData.offre_p = type === 'particuliers' ? data.internet_offer : '';
            formattedData.offre_e = type === 'entreprise' ? data.internet_offer : '';
        } else {
            formattedData.offre_p = '';
            formattedData.offre_e = '';
        }

        // Map contract ID to the auto-generated reference
        formattedData.contratid = reference;

        // Generate both documents
        const docFr = generateDocumentFromTemplate(templateFr, formattedData);
        const docAr = generateDocumentFromTemplate(templateAr, formattedData);

        // Create output directory structure
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        const outputDir = path.join(__dirname, '../generated', year.toString(), month, day);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Save files
        const filenameFr = `${reference}_fr.docx`;
        const filenameAr = `${reference}_ar.docx`;
        const pathFr = path.join(outputDir, filenameFr);
        const pathAr = path.join(outputDir, filenameAr);

        fs.writeFileSync(pathFr, docFr);
        fs.writeFileSync(pathAr, docAr);

        // Save to database
        const relativePathFr = path.relative(path.join(__dirname, '..'), pathFr);
        const relativePathAr = path.relative(path.join(__dirname, '..'), pathAr);

        // Create client in Dolibarr (non-blocking - continues even if it fails)
        let dolibarrId = null;
        try {
            dolibarrId = await dolibarrService.createThirdParty(data, type, reference);
        } catch (dolibarrError) {
            console.error('[Dolibarr] Error during third party creation:', dolibarrError.message);
        }

        const query = `
      INSERT INTO documents (reference, document_type, user_data, file_path_fr, file_path_ar, dolibarr_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

        const result = await pool.query(query, [
            reference,
            type,
            JSON.stringify(formattedData),
            relativePathFr,
            relativePathAr,
            dolibarrId
        ]);

        return {
            reference,
            frenchDoc: relativePathFr,
            arabicDoc: relativePathAr,
            createdAt: result.rows[0].created_at,
            dolibarrId: dolibarrId
        };

    } catch (error) {
        console.error('Error in generateDocuments:', error);
        throw error;
    }
}

module.exports = {
    generateDocuments,
    generateReference
};
