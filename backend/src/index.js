require("dotenv").config();
const mongoose = require("mongoose");

async function connect() {
    await mongoose.connect(process.env.MongoDB_URL)
    .then(() => console.log("Connected To The Database Successfully."))
    .catch((error) => console.log("Error While Connecting To the Database.", error));
}

const {PlayerService} = require("./Services/PlayerService");

connect();