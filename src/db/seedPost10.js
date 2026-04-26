const pool = require("./pool");

async function seedPosts10() {
  const posts = Array.from({ length: 10 }).map((_, i) => ({
    title: `Post #${i + 1}`,
    content: `Content for post #${i + 1}`,
  }));

  const values = [];
  const placeholders = posts
    .map((p, idx) => {
      const base = idx * 2;
      values.push(p.title, p.content);
      return `($${base + 1}, $${base + 2})`;
    })
    .join(", ");

  const sql = `
    INSERT INTO public.posts (title, content)
    VALUES ${placeholders}
    ON CONFLICT (title) DO NOTHING
    RETURNING id, title, content, created_at;
  `;

  const { rows } = await pool.query(sql, values);
  return rows; // сколько реально вставилось в этот запуск
}

module.exports = { seedPosts10 };