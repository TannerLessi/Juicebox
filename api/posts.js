const express = require("express");
const postRouter = express.Router();
const { getAllPosts, createPost, getPostById } = require("../db");
const { requireUser } = require("./utils");

postRouter.post("/", requireUser, async (req, res, next) => {
  res.send({ message: "under construction" });
});

postRouter.post("/", requireUser, async (req, res, next) => {
  const { title, content, tags = "" } = req.body;

  const tagArr = tags.trim().split(/\s+/);
  const postData = {};

  // only send the tags if there are some to send
  if (tagArr.length) {
    postData.tags = tagArr;
  }

  try {
    const _post = await getPostById(postData);

    if (_post) {
      next({
        message: "That post exists!",
      });
    }
    // add authorId, title, content to postData object
    const posts = await createPost(postData);

    res.send({
      message: "Post created!",
      posts,
    });
    // const post = await createPost(postData);
    // this will create the post and the tags for us
    // if the post comes back, res.send({ post });
    // otherwise, next an appropriate error object
  } catch ({ name, message }) {
    next({ name, message });
  }
});

postRouter.get("/", async (req, res) => {
  const posts = await getAllPosts();
  res.send({
    posts,
  });
});

postRouter.use((req, res, next) => {
  console.log("A request is being made to /posts");

  res.send({ message: "hello from /posts!" });
});

module.exports = postRouter;
