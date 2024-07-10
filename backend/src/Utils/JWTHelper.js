const jwt = require("jsonwebtoken");
const { DeveloperError } = require("./DeveloperError");

async function verifyToken(token) {
    let jwtPlayer;

    try {
        jwtPlayer = jwt.verify(token, process.env.JWT_SECRET_ACCESS_TOKEN);
    } catch(error) {
        if(error instanceof jwt.JsonWebTokenError) {
            throw new Error("Unauthorized - Invalid Token");
        }

        throw new DeveloperError("error while verifying json web token", error.message, "Utils/JWTHelper.js", "verifyToken", 15);
    }

    if(!jwtPlayer.ID || !jwtPlayer.name || !jwtPlayer.tokenVersion) throw new Error("Unauthorized - Invalid Token");
    
    return jwtPlayer;    
}

async function generateAccessToken(player) {
    const payload = {
        ID: player.ID,
        name: player.name,
        tokenVersion: 1
    }

    let options = { algorithm: "HS384" };
    if(!player.guest) options.expiresIn = "30D"

    return jwt.sign(payload, process.env.JWT_SECRET_ACCESS_TOKEN, options);
}

module.exports = { verifyToken, generateAccessToken }