function validateBody(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation error",
        details: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }

    // Важно: теперь req.body — гарантированно валидный и “нормализованный”
    // (например age: "42" станет age: 42 из-за z.coerce.number()).
    req.body = parsed.data;
    next();
  };
}

module.exports = { validateBody };
