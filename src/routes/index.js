const express = require("express");
const router = express.Router();
const { createTable, dropTable, updateTable } = require("../db/migrations");
const pool = require("../db/pool");
const { validateBody } = require("../middleware/validate");
const { createUserSchema } = require("../validation/userSchemas");

// Route to create a new table
router.post("/create-table", async (req, res) => {
  try {
    await createTable();
    res.status(201).send("Table created successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating table");
  }
});

// Route to drop an existing table
router.delete("/drop-table", async (req, res) => {
  try {
    await dropTable();
    res.status(200).send("Table dropped successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error dropping table");
  }
});

router.post("/users", validateBody(createUserSchema), async (req, res) => {
  const { name, email, age } = req.body;

  // Ручная проверка больше не нужна — Zod уже проверил:
  // if (!name || !email) ...

  try {
    const query = `
        INSERT INTO public.users (name, email, age)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, age, created_at;
        `;
    const values = [name, email, age ?? null];
    const result = await pool.query(query, values);
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("INSERT error:", error);
    return res
      .status(500)
      .json({ error: "Ошибка при добавлении пользователя" });
  }
});
router.get("/users", async (req, res) => {
  try {
    // 1) Добавляем новую строку (тестовые данные)
    const insertResult = await pool.query(
      `
        INSERT INTO public.users (name, email)
        VALUES ($1, $2)
        RETURNING id, name, email, created_at;
        `,
      [
        "Test User",
        `test_${Date.now()}@example.com`, // уникальный email, чтобы не упасть на UNIQUE
      ]
    );

    // 2) Читаем все строки и возвращаем
    const selectResult = await pool.query(`
        SELECT id, name, email,  created_at
        FROM public.users
        ORDER BY id DESC;
      `);

    return res.json({
      inserted: insertResult.rows[0],
      users: selectResult.rows,
    });
  } catch (error) {
    console.error("GET /users error:", error);
    return res
      .status(500)
      .json({ error: "Ошибка при получении пользователей" });
  }
});

router.post("/update-table", async (req, res) => {
  try {
    await updateTable();
    return res.status(200).send("Table updated successfully");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Error updating table");
  }
});

// Additional routes can be added here

module.exports = router;
