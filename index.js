require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Product = require("./models/product");
const PORT = process.env.PORT || 8000;

const product_routes = require("./routes/product_router");
const user_routes = require("./routes/user_router");
const config = require("./config/db_config");

const session = require("express-session");
const passport = require("passport");

const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB || config.mongodb, { dbName: "eshop" });

let db = mongoose.connection;
db.once("open", function () {
  console.log("Connected to MongoDB");
});
db.on("error", function (err) {
  console.log("DB Error");
});

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: ["https://mw-project-fe.vercel.app"],
    methods: ["POST", "GET", "DELETE"],
    credentials: true,
  })
);

app.use("/product", product_routes);
app.use("/user", user_routes);

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {},
  })
);

require("./config/passport")(passport);
app.use(passport.initialize());
app.use(passport.session());

app.get("/", function (req, res) {
  Product.find({})
    .then((products) => {
      res.json(products);
    })
    .catch((error) => {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    });
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
