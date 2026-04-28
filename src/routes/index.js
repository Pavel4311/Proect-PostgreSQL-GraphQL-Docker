const express = require("express");
const router = express.Router();
const { createTable, dropTable, updateTable } = require("../db/migrations");
const pool = require("../db/pool");
const { redisClient, connectRedis } = require("../cache/redis");
const { validateBody } = require("../middleware/validate");
const { createUserSchema } = require("../validation/userSchemas");

const USERS_CACHE_KEY = "users:all";
const USERS_CACHE_TTL_SEC = Math.max(
  5,
  Number(process.env.USERS_CACHE_TTL_SEC || 30)
);

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
    try {
      const isRedisReady = await connectRedis();
      if (isRedisReady && redisClient.isOpen) {
        await redisClient.del(USERS_CACHE_KEY);
        console.log("[Redis] cache invalidated: users");
      }
    } catch (cacheError) {
      console.error("[Redis] cache invalidate error:", cacheError);
    }
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
    const isRedisReady = await connectRedis();
    if (isRedisReady && redisClient.isOpen) {
      const cachedUsers = await redisClient.get(USERS_CACHE_KEY);
      if (cachedUsers) {
        console.log("[Redis] cache hit: users");
        try {
          return res.json({
            source: "cache",
            users: JSON.parse(cachedUsers),
          });
        } catch (parseError) {
          console.error("[Redis] cache parse error:", parseError);
        }
      }
      console.log("[Redis] cache miss: users");
    } else {
      console.log("[Redis] cache skipped: not connected");
    }

    const selectResult = await pool.query(`
        SELECT id, name, email,  created_at
        FROM public.users
        ORDER BY id DESC;
      `);

    const users = selectResult.rows;

    if (isRedisReady && redisClient.isOpen) {
      await redisClient.setEx(
        USERS_CACHE_KEY,
        USERS_CACHE_TTL_SEC,
        JSON.stringify(users)
      );
      console.log(`[Redis] cache set: users ttl=${USERS_CACHE_TTL_SEC}s`);
    }

    return res.json({ source: "db", users });
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
