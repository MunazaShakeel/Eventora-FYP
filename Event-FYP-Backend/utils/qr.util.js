const QRCode = require('qrcode');

/**
 * Generate QR code in base64 format
 * @param {String} data - Unique identifier (e.g., registrationId or certificateId)
 * @returns {Promise<String>} - Base64 QR image
 */
exports.generateQR = async (data) => {
    try {
        // Convert unique data to QR code
        const qrUrl = await QRCode.toDataURL(data);
        return qrUrl; // returns base64 string
    } catch (error) {
        throw new Error('QR generation failed: ' + error.message);
    }
};


exports.generateQR = async (data) => {
    if (!data) throw new Error('Invalid data');

    const qr = await QRCode.toDataURL(String(data));
    return qr;
};