const { Client } = require("pg"); // imports the pg module

// supply the db name and location of the database
const client = new Client(
  process.env.DATABASE_URL || "postgres://localhost:5432/juicebox-dev"
);

async function getAllUsers() {
  const { rows } = await client.query(
    `SELECT id, username, name, location, active
    FROM users;
  `
  );

  return rows;
}

async function createUser({ username, password, name, location }) {
  try {
    const {
      rows: [user],
    } = await client.query(
      `
    INSERT INTO users(username, password, name, location) 
    VALUES($1, $2, $3, $4) 
    ON CONFLICT (username) DO NOTHING 
    RETURNING *;
  `,
      [username, password, name, location]
    );

    return user;
  } catch (error) {
    throw error;
  }
}
async function createPost({ authorId, title, content, tags = [] }) {
  try {
    const {
      rows: [post],
    } = await client.query(
      `
    INSERT INTO posts("authorId", title, content) 
    VALUES($1, $2, $3) 
    RETURNING *;
  `,
      [authorId, title, content]
    );
    const tagList = await createTags(tags);

    return await addTagsToPost(post.id, tagList);
  } catch (error) {
    throw error;
  }
}

async function createTags(tagList) {
  if (tagList.length === 0) {
    return;
  }

  // need something like: $1), ($2), ($3
  const insertValues = tagList.map((_, index) => `$${index + 1}`).join("), (");
  // then we can use: (${ insertValues }) in our string template

  // need something like $1, $2, $3
  const selectValues = tagList.map((_, index) => `$${index + 1}`).join(", ");
  // then we can use (${ selectValues }) in our string template
  console.log({ insertValues, selectValues, tagList });
  try {
    await client.query(
      `INSERT INTO tags (name)
      VALUES  (${insertValues})
      ON CONFLICT (name) DO NOTHING;`,
      tagList
    );

    const { rows } = await client.query(
      `SELECT * FROM tags
      WHERE name
      IN (${selectValues})
      `,
      tagList
    );
    console.log("This should run!");
    // select all tags where the name is in our taglist
    // return the rows from the query
    return rows;
  } catch (error) {
    throw error;
  }
}

async function createPostTag(postId, tagId) {
  try {
    const { row } = await client.query(
      `
  INSERT INTO post_tags("postId", "tagId")
  VALUES ($1, $2)
  ON CONFLICT ("postId", "tagId") DO NOTHING;
`,
      [postId, tagId]
    );
    return row;
  } catch (error) {
    throw error;
  }
}

async function addTagsToPost(postId, tagList) {
  try {
    const createPostTagPromises = tagList.map((tag) =>
      createPostTag(postId, tag.id)
    );

    await Promise.all(createPostTagPromises);
    return await getUserById(postId);
  } catch (error) {
    throw error;
  }
}

async function getPostById(postId) {
  try {
    const {
      rows: [post],
    } = await client.query(
      `
    SELECT *
    FROM posts
    WHERE id=$1;
    `,
      [postId]
    );
    if (!post) {
      throw {
        name: "PostNotFoundError",
        message: "Could not find a post with that postId",
      };
    }
    const { rows: tags } = await client.query(
      `
    SELECT tags.*
    FROM tags
    JOIN post_tags ON tags.id=post_tags."tagId"
    WHERE post_tags."postId"=$1;
  `,
      [postId]
    );

    const {
      rows: [author],
    } = await client.query(
      `
    SELECT id, username, name, location
    FROM users
    WHERE id=$1;
  `,
      [post.authorId]
    );

    post.tags = tags;
    post.author = author;

    delete post.authorId;

    return post;
  } catch (error) {
    throw error;
  }
}

async function updateUser(id, fields = {}) {
  // build the set string
  console.log("id", id);
  const setString = Object.keys(fields)
    .map((key, index) => `"${key}"=$${index + 1}`)
    .join(", ");

  // return early if this is called without fields
  if (setString.length === 0) {
    return;
  }

  try {
    const {
      rows: [user],
    } = await client.query(
      `
      UPDATE users
      SET ${setString}
      WHERE id=${id}
      RETURNING *;
    `,
      Object.values(fields)
    );

    return user;
  } catch (error) {
    throw error;
  }
}

async function updatePost(postId, fields = {}) {
  console.log(fields);
  console.log("updating the posts");

  const { tags } = fields;
  delete fields.tags;

  const setString = Object.keys(fields)
    .map((key, index) => `"${key}"=$${index + 1}`)
    .join(", ");

  // return early if this is called without fields
  try {
    if (setString.length > 0) {
      await client.query(
        `
      UPDATE posts
      SET ${setString}
      WHERE id=${postId}
      RETURNING *;
    `,
        Object.values(fields)
      );
    }
    if (tags === undefined) {
      return await getPostById(postId);
    }

    const tagList = await createTags(tags);
    const tagListIdString = tagList.map((tag) => `${tag.id}`).join(", ");

    await client.query(
      `
    DELETE FROM post_tags
    WHERE "tagId"
    NOT IN (${tagListIdString})
    AND "postId"=$1;
    `,
      [postId]
    );

    await addTagsToPost(postId, tagList);

    return await getPostById(postId);
  } catch (error) {
    throw error;
  }
}

async function getAllTags() {
  const { rows } = await client.query(
    `SELECT * FROM tags
  `
  );

  return rows;
}

async function getAllPosts() {
  try {
    const { rows: postIds } = await client.query(
      `SELECT id
      FROM posts;
    `
    );

    const posts = await Promise.all(
      postIds.map((post) => getPostById(post.id))
    );

    return posts;
  } catch (error) {
    throw error;
  }
}

async function getUserByUsername(username) {
  try {
    const {
      rows: [user],
    } = await client.query(
      `
      SELECT *
      FROM users
      WHERE username=$1;
    `,
      [username]
    );

    return user;
  } catch (error) {
    throw error;
  }
}

async function getPostsByUser(userId) {
  console.log("getting all posts!");
  try {
    const { rows: postIds } = await client.query(`
      SELECT id
      FROM posts
      WHERE "authorId"=${userId}
    `);
    const posts = await Promise.all(
      postIds.map((post) => getPostById(post.id))
    );
    console.log(posts);
    return posts;
  } catch (error) {
    throw error;
  }
}

async function getUserById(userId) {
  try {
    const {
      rows: [user],
    } = await client.query(
      `SELECT * FROM users
      WHERE id=${userId};
      `
    );
    if (!user) {
      return null;
    }

    delete user.password;
    user.posts = await getPostsByUser(userId);
    console.log(user);
    return user;
  } catch (error) {
    throw error;
  }
}

async function getPostsByTagName(tagName) {
  try {
    const { rows: postIds } = await client.query(
      `
    SELECT posts.id
    FROM posts
    JOIN post_tags ON posts.id=post_tags."postId"
    JOIN tags ON tags.id=post_tags."tagId"
    WHERE tags.name=$1;
    `,
      [tagName]
    );

    return await Promise.all(postIds.map((post) => getPostById(post.id)));
  } catch (error) {
    throw error;
  }
}

module.exports = {
  client,
  getAllUsers,
  createUser,
  updateUser,
  updatePost,
  getAllPosts,
  getPostsByUser,
  getUserById,
  createPost,
  getPostById,
  addTagsToPost,
  createTags,
  getPostsByTagName,
  getAllTags,
  getUserByUsername,
};
