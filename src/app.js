const express = require("express");
const bodyParser = require("body-parser");
const routes = require("./routes/index");
const { runMigrations } = require("./db/migrations");
require("dotenv").config();

const { createHandler } = require("graphql-http/lib/use/express");
const { schema, rootValue } = require("./graphql/simple");

const app = express();
const port = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === "production";

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Ловим “битый JSON” (ошибка парсинга body-parser) и отдаём нормальный JSON-ответ
// Важно: этот middleware должен быть после bodyParser и ДО роутов.
app.use((err, req, res, next) => {
  const isBodyParserJsonError =
    err instanceof SyntaxError &&
    "body" in err &&
    (err.type === "entity.parse.failed" || /JSON/i.test(err.message));

  if (!isBodyParserJsonError) return next(err);

  // ✅ Логи, чтобы понять, ЧТО именно прилетело и с какими заголовками.
  // В проде лучше не логировать body целиком, но для обучения — ок.
  console.error("[Invalid JSON body]", {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    contentType: req.headers["content-type"],
    contentLength: req.headers["content-length"],
    userAgent: req.headers["user-agent"],
    message: err.message,
  });

  // raw-body кладёт "сырые" данные в err.body (если успело прочитать)
  if (typeof err.body === "string") {
    console.error("[Invalid JSON body] raw:", err.body);
  } else if (Buffer.isBuffer(err.body)) {
    console.error(
      "[Invalid JSON body] raw(buffer):",
      err.body.toString("utf8")
    );
  }

  return res.status(400).json({
    error: "Invalid JSON in request body",
    message:
      "Проверь JSON: кавычки, запятые, фигурные скобки. Отправляй Content-Type: application/json.",
    path: req.originalUrl,
    ...(isProd ? null : { details: err.message }),
  });
});

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

// Error handling (подробный)
app.use((err, req, res, next) => {
  const status = Number(err?.status || err?.statusCode || 500);

  console.error("Unhandled error:", {
    method: req.method,
    url: req.originalUrl,
    status,
    name: err?.name,
    message: err?.message,
    stack: err?.stack,
  });

  const isZodError =
    err?.name === "ZodError" ||
    Array.isArray(err?.issues) ||
    Array.isArray(err?.errors);

  if (isZodError) {
    const issues = err?.issues ?? err?.errors ?? [];
    return res.status(400).json({
      error: "Validation error",
      details: issues.map((i) => ({
        path: Array.isArray(i.path) ? i.path.join(".") : String(i.path ?? ""),
        message: i.message,
      })),
      ...(isProd ? null : { stack: err?.stack }),
    });
  }

  return res.status(status).json({
    error: err?.message || "Internal Server Error",
    status,
    path: req.originalUrl,
    ...(isProd ? null : { stack: err?.stack }),
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`GraphQL: http://localhost:${port}/graphql`);
});
