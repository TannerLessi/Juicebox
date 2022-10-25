const { client, getAllUsers } = require("./index");

async function testDB() {
  try {
    // connect the client to the database, finally
    client.connect();

    const users = await getAllUsers();
    console.log(users);

    // queries are promises, so we can await them
    const { rows } = await client.query(`SELECT * FROM users;`);
    console.log(rows);
    // for now, logging is a fine way to see what's up
    console.log(result);
  } catch (error) {
    console.error(error);
  } finally {
    // it's important to close out the client connection
    client.end();
  }
}

testDB();
