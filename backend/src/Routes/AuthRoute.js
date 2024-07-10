const express = require("express");
const jwt = require("jsonwebtoken");
const AuthRoute = express.Router();

const { PlayerService } = require("../Services/PlayerService");
const JWTHelper = require("../Utils/JWTHelper");

const { PlayerNotLoggedIn } = require("../Middlewares/PlayerNotLoggedIn");
const { Validator } = require("../Utils/Validator");
const { PlayerLoggedIn } = require("../Middlewares/PlayerLoggedIn");
const { DeveloperError } = require("../Utils/DeveloperError");

const setTokenToCookies = (res, token, isGuest) => {
    const oneMonthInMilliesecond = 60 * 60 * 24 * 30 * 1000;

    let options = {
        httpOnly: true,
        secure: true,
    }
    if(!isGuest) options.maxAge = oneMonthInMilliesecond;

    res.cookie('token', token, options);
};

function validateLoginRequest(identifier, password) {
    const validator = new Validator(identifier);
    if (!validator.checkNotEmpty().isValid()) {
        return { valid: false, message: "Invalid email/name." };
    }

    const emailValidator = new Validator(identifier);
    if (!emailValidator.checkEmail().isValid()) {
        const nameValidator = new Validator(identifier);
        if (!nameValidator.checkLength(36, "name").isValid()) {
            return { valid: false, message: "Invalid email/name." };
        }
    }

    const passwordValidator = new Validator(password);
    if (!passwordValidator.checkNotEmpty("password").checkLength(8, 36, "password").isValid()) {
        return { valid: false, message: passwordValidator.getErrors().join(",") };
    }

    return { valid: true, message: "" };
}

AuthRoute.post("/register/guest", PlayerNotLoggedIn, async(req, res) => {
    const { name } = req.body;


    const nameValidation = new Validator(name).checkNotEmpty().checkLength(36, "name");
    if(!nameValidation.isValid()) return res.status(400).json({ success: false, message: nameValidation.getErrors().join(",") });

    const newGuestPlayer = new PlayerService(null);
    const playerExists = await newGuestPlayer.getPlayerByName(name);

    if(playerExists.player?.ID) return res.status(400).json({ success: false, message: "Player with that name already exists." });

    try {
        const created = await newGuestPlayer.createPlayer(true, name);
        if(!created) return res.status(400).json({ success: false, message: "Error while creating new player, please try again later." });
        
        const token = await JWTHelper.generateAccessToken(newGuestPlayer.player);
        setTokenToCookies(res, token);

        let player = {
            ID: newGuestPlayer.player.ID,
            name: newGuestPlayer.player.name,
            guest: newGuestPlayer.player.guest
        }

        res.status(201).json({ success: true, message: "Guest player created.", player: player });    
    } catch(err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

AuthRoute.post("/register", PlayerNotLoggedIn, async(req, res) => {
    const { name, email, password } = req.body;

    const validator = new Validator(name);
    validator.checkNotEmpty().checkLength(36, "name");
    if(!validator.isValid()) return res.status(400).json({ success: false, message: validator.getErrors().join(",") });

    validator.reset().setValue(email).checkNotEmpty("email").checkEmail();
    if(!validator.isValid()) return res.status(400).json({ success: false, message: validator.getErrors().join(",") });

    validator.reset().setValue(password).checkNotEmpty("password").checkLength(36, "password");
    if(!validator.isValid()) return res.status(400).json({ success: false, message: validator.getErrors().join(",") });

    const newPlayer = new PlayerService(null);

    try {
        await newPlayer.getPlayerByName(name);
        if(newPlayer.player) return res.status(400).json({ success: false, message: "Player with that name already exists!" });

        await newPlayer.getPlayerByEmail(email);
        if(newPlayer.player) return res.status(400).json({ success: false, message: "Player with that email already exists!" });
                
        await newPlayer.createPlayer(false, name, email, password);

        const token = await JWTHelper.generateAccessToken(newPlayer.player);
        setTokenToCookies(res, token);
        
        let player = {
            ID: newPlayer.player.ID,
            name: newPlayer.player.name,
            guest: newPlayer.player.guest
        }

        res.status(201).json({ success: true, message: "Player created.", player: player });
    } catch(err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

AuthRoute.post("/upgradeToFullPlayer", PlayerLoggedIn, async(req, res) => {
    const guestPlayer = new PlayerService(req.player.ID);
    const playerExists = await guestPlayer.isExists();
    if(!playerExists) return res.status(401).json({ success: false, message: "Player doesn't exists." });

    if(!guestPlayer.player.guest) return res.status(403).json({ success: false, message: "only guest players can preform this action." });

    const {email, password} = req.body;

    let validator = new Validator();
    validator.reset().setValue(email).checkNotEmpty("email").checkEmail();
    if(!validator.isValid()) return res.status(400).json({ success: false, message: validator.getErrors().join(",") });


    validator.reset().setValue(password).checkNotEmpty("password").checkLength(36, "password");
    if(!validator.isValid()) return res.status(400).json({ success: false, message: validator.getErrors().join(",") });

    try {
        await guestPlayer.upgradeToFullAccount(email, password);
        await guestPlayer.save();

        let player = {
            ID: guestPlayer.player.ID,
            name: guestPlayer.player.name,
            guest: guestPlayer.player.guest
        }

        res.status(201).json({ success: true, message: "Player upgraded successfully.", player: player });
    } catch(err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

AuthRoute.post("/login", PlayerNotLoggedIn, async (req, res) => {
    try {
        const { identifier, password } = req.body;

        // Validate the login request
        const { valid, message } = validateLoginRequest(identifier, password);
        if (!valid) {
            return res.status(400).json({ success: false, message });
        }

        const playerService = new PlayerService();
        let player;

        if (identifier.includes('@')) {
            player = await playerService.getPlayerByEmail(identifier);
        } else {
            player = await playerService.getPlayerByName(identifier);
        }

        if (!player) {
            return res.status(400).json({ success: false, message: "Invalid email/name." });
        }

        const isValidPassword = await player.checkPassword(password);
        if (!isValidPassword) {
            return res.status(400).json({ success: false, message: "Invalid password." });
        }

        const token = JWTHelper.generateAccessToken(player.player);
        setTokenToCookies(res, token);

        return res.status(200).json({ success: true, message: "Login successful." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error." });
        throw new DeveloperError("unknown error at the login endpoint", error.message, "Routes/AuthRoute", null, null);
    }
});

AuthRoute.post('/logout', PlayerLoggedIn, (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ success: true, message: 'Logout successful' });
});

AuthRoute.get("/isLoggedIn", PlayerLoggedIn, (req, res) => {
    res.status(200).json({ success: true });
})

//for testing purposes
// AuthRoute.get("/getToken", (req, res) => {
//     let info = jwt.verify(req.cookies.token, process.env.JWT_SECRET_ACCESS_TOKEN)
//     res.json({ token: req.cookies.token, info: JSON.stringify(info) })
// })

module.exports = AuthRoute;