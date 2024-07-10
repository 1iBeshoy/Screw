require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const app = express();

app.use(express.json());
app.use(cookieParser());

mongoose.connect(process.env.local_MongoDB_URL)
.then(() => console.log("Connected To The Database Successfully."))
.catch((error) => console.log("Error While Connecting To the Database.", error));

const AuthRoute = require("./Routes/AuthRoute");
app.use("/authentication/", AuthRoute);

app.listen(3005, () => {
    console.log("Started.")
})