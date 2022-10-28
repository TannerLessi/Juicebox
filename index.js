const PORT = 3000;
const express = require("express");
const server = express();
server.use(express.json());

require("dotenv").config();
console.log("this is the dotEnv", process.env.JWT_SECRET);

const morgan = require("morgan");
server.use(morgan("dev"));

server.use((req, res, next) => {
  console.log("<____Body Logger START____>");
  console.log(req.body);
  console.log("<_____Body Logger END_____>");

  next();
});

const apiRouter = require("./api");
server.use("/api", apiRouter);

const { client } = require("./db");
client.connect();
server.listen(PORT, () => {
  console.log("The server is up on port", PORT);
});
