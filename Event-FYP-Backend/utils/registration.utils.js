const QRCode = require('qrcode');

/*
-----------------------------------
Generate Registration Code
-----------------------------------
*/
exports.generateRegistrationCode = (studentId, eventId) => {
  return `REG-${studentId}-${eventId}`;
};

/*
-----------------------------------
Generate QR Code for Registration
-----------------------------------
*/
exports.generateRegistrationQR = async (registrationId) => {
  try {
    const qrData = `REGISTRATION:${registrationId}`;
    const qrImage = await QRCode.toDataURL(qrData);
    return qrImage; // base64 QR image
  } catch (error) {
    throw new Error('QR code generation failed');
  }
};

/*
-----------------------------------
Check Eligibility for Certificate
-----------------------------------
*/
exports.isEligibleForCertificate = (registration) => {
  if (!registration) return false;
  return registration.attendance_status === 'Present';
};




