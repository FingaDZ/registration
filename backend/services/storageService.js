const fs = require('fs');
const path = require('path');

// Get file path by reference and language
function getFilePath(reference, language) {
    const generatedDir = path.join(__dirname, '../generated');
    const filename = `${reference}_${language}.docx`;

    // Search in date-based directory structure
    const years = fs.readdirSync(generatedDir).filter(f =>
        fs.statSync(path.join(generatedDir, f)).isDirectory()
    );

    for (const year of years) {
        const yearPath = path.join(generatedDir, year);
        const months = fs.readdirSync(yearPath).filter(f =>
            fs.statSync(path.join(yearPath, f)).isDirectory()
        );

        for (const month of months) {
            const monthPath = path.join(yearPath, month);
            const days = fs.readdirSync(monthPath).filter(f =>
                fs.statSync(path.join(monthPath, f)).isDirectory()
            );

            for (const day of days) {
                const dayPath = path.join(monthPath, day);
                const filePath = path.join(dayPath, filename);

                if (fs.existsSync(filePath)) {
                    return filePath;
                }
            }
        }
    }

    return null;
}

// Check if file exists
function fileExists(filePath) {
    return fs.existsSync(filePath);
}

// Delete file
function deleteFile(filePath) {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
    }
    return false;
}

// Ensure directory exists
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

module.exports = {
    getFilePath,
    fileExists,
    deleteFile,
    ensureDirectoryExists
};
