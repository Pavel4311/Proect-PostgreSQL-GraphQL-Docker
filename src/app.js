const express = require("express");
const bodyParser = require("body-parser");
const routes = require("./routes/index");
const { runMigrations } = require("./db/migrations");
require("dotenv").config();

const { createHandler } = require("graphql-http/lib/use/express");
const { schema, rootValue } = require("./graphql/simple");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Миграции при старте
runMigrations().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});

// REST routes
app.use("/api", routes);

// GraphQL endpoint
app.all(
  "/graphql",
  createHandler({
    schema,
    rootValue,
  })
);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`GraphQL: http://localhost:${port}/graphql`);
});
