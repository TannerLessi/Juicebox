const express = require("express");
const postRouter = express.Router();
const { getAllPosts } = require("../db");

postRouter.get('/', async (req, res) => {
    const posts = await getAllPosts();
    res.send({
      posts
    });
  });

  postRouter.use((req, res, next) => {
    console.log("A request is being made to /posts");
  
    res.send({ message: "hello from /posts!" });
  });

module.exports = postRouter;