const express = require("express");
const tagRouter = express.Router();
const { getAllTags, getPostsByTagName } = require("../db");
const { requireUser } = require("./utils");

tagRouter.use((req, res, next) => {
  console.log("A request is being made to /tags");
  next();
});

tagRouter.get("/", async (req, res) => {
  const tags = await getAllTags();
  res.send({
    tags,
  });
});

tagRouter.get("/:tagName/posts", requireUser, async (req, res, next) => {
  // read the tagname from the params
  const { tagName } = req.params;
  try {
    // use our method to get posts by tag name from the db
    const posts = await getPostsByTagName(tagName);
    // send out an object to the client { posts: // the posts }
    res.send({
      posts: posts,
    });
  } catch ({ name, message }) {
    // forward the name and message to the error handler
    next({ name, message });
  }
});

module.exports = tagRouter;
