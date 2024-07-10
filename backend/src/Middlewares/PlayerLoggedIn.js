const { DeveloperError } = require("../Utils/DeveloperError");
const JWTHelper = require("../Utils/JWTHelper");

const PlayerLoggedIn = async(req, res, next) => {
    const token = req.cookies.token;

    if(!token) return res.status(200).json({ success: false, message: "Unauthorized - Invalid Token" });

    try {
        const payload = await JWTHelper.verifyToken(token);
        req.player = payload;
        
        next();
    } catch(error) {
        if(error instanceof DeveloperError) {
            return res.status(401).json({ success: false, message: "Unauthorized - Invalid Token" });
        }

        return res.status(401).json({ success: false, message: "Unauthorized - Invalid Token"});
    }
}

module.exports = { PlayerLoggedIn };