require("dotenv").config();
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { sequelize } from "./helper/database";

// Routes
import userRoutes from "./routes/user";
import { errorHandler } from "./helper/error-handler";

// Middlewares

// Models
const { User } = require("./models");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.use("/auth", userRoutes);

app.use(errorHandler);

sequelize.sync({ force: false }).then(() => {
  const port = process.env.NODE_ENV === "production" ? 80 : 5000;
  app.listen(port, () => {
    console.log(`Server listening on ${port}`);
  });
});
