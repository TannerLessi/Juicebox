const express = require("express");
const tagRouter = express.Router();
const { getAllTags } = require("../db");

tagRouter.get("/", async (req, res) => {
  const tags = await getAllTags();
  res.send({
    tags,
  });
});

tagRouter.use((req, res, next) => {
  console.log("A request is being made to /tags");

  res.send({ message: "hello from /tags!" });
});

module.exports = tagRouter;
