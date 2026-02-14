const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');
const { pool } = require('../database/init');

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

        // Prepare data with reference
        const documentData = {
            ...data,
            Reference_client: reference
        };

        // Generate both documents
        const docFr = generateDocumentFromTemplate(templateFr, documentData);
        const docAr = generateDocumentFromTemplate(templateAr, documentData);

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

        const query = `
      INSERT INTO documents (reference, document_type, user_data, file_path_fr, file_path_ar)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

        const result = await pool.query(query, [
            reference,
            type,
            JSON.stringify(documentData),
            relativePathFr,
            relativePathAr
        ]);

        return {
            reference,
            frenchDoc: relativePathFr,
            arabicDoc: relativePathAr,
            createdAt: result.rows[0].created_at
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
