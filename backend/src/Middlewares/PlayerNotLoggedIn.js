const PlayerNotLoggedIn = (req, res, next) => {
    const token = req.cookies.token;

    if(token) return res.status(403).json({ error: "You are already logged in" });

    next();
}

module.exports = { PlayerNotLoggedIn }