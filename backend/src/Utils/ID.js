const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Generates a unique and hashed identifier.
 * @param {number} lenght - The lenght of the generated ID.
 * @returns {string} - A unique 8-character hashed identifier.
 */
function generateID(lenght = 8) {
    // Generate a random UUID using the uuidv4 library
    const fullUuid = uuidv4();

    // Hash the UUID using SHA256 algorithm
    const hashedUuid = crypto.createHash('sha256').update(fullUuid).digest('hex');

    // Return the first 8 characters of the hashed UUID as a unique identifier
    return hashedUuid.substring(0, lenght);
}

module.exports = { generateID };