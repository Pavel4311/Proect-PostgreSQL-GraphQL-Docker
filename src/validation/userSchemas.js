const { z } = require("zod");

// Валидация тела запроса для POST /api/users
// age делаем опциональным, но если пришёл строкой - превратим в number.
const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "name обязателен")
    .max(100, "name слишком длинный"),
  email: z
    .string()
    .trim()
    .email("email некорректный")
    .max(100, "email слишком длинный"),
  age: z.coerce
    .number()
    .int("age должен быть целым")
    .min(0)
    .max(150)
    .optional(),
});

module.exports = { createUserSchema };
