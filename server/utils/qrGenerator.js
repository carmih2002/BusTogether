import QRCode from 'qrcode';

/**
 * Generate QR code data URL for a bus
 */
export async function generateBusQR(busId, baseUrl = 'http://localhost:3000') {
    const url = `${baseUrl}/bus/${busId}`;

    try {
        const qrDataUrl = await QRCode.toDataURL(url, {
            width: 400,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });

        return {
            url,
            qrDataUrl
        };
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw error;
    }
}

/**
 * Generate QR code as buffer for download
 */
export async function generateBusQRBuffer(busId, baseUrl = 'http://localhost:3000') {
    const url = `${baseUrl}/bus/${busId}`;

    try {
        const buffer = await QRCode.toBuffer(url, {
            width: 800,
            margin: 2
        });

        return buffer;
    } catch (error) {
        console.error('Error generating QR buffer:', error);
        throw error;
    }
}
