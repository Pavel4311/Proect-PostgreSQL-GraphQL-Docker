const pool = require("./pool");

const createTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS public.users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await pool.query(query);
  console.log("Таблица users успешно создана/уже существует");
};

const createPostsTable = async () => {
  const query = `
  CREATE TABLE IF NOT EXISTS public.posts (
      id SERIAL PRIMARY KEY,
      title TEXT UNIQUE NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;
  await pool.query(query);
  console.log("Таблица posts успешно создана/уже существует");
};

const updateTable = async () => {
  const query = `
    ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS age INT;
  `;
  await pool.query(query);
  console.log("Таблица users успешно обновлена (age есть)");
};

const dropTable = async () => {
  await pool.query(`DROP TABLE IF EXISTS public.users;`);
  console.log("Таблица users успешно удалена");
};

const runMigrations = async () => {
  await createTable();
  await updateTable();
  await createPostsTable();
};

module.exports = {
  createTable,
  updateTable,
  createPostsTable,
  dropTable,
  runMigrations,
};
