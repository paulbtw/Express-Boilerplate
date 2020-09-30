require("dotenv").config();
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { createConnection } from "typeorm";

// Routes
import router from "./routes";

import { errorHandler } from "./helper/error-handler";

createConnection().then((connection) => {
  const app = express();

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(cors());

  app.use("/", router);

  app.use(errorHandler);

  const port = process.env.NODE_ENV === "production" ? 80 : 5000;
  app.listen(port, () => {
    console.log(`Server listening on ${port}`);
  });
});
