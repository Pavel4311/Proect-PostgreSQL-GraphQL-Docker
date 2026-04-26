const { buildSchema } = require("graphql");
const pool = require("../db/pool");
const { seedPosts10 } = require("../db/seedPost10");

const schema = buildSchema(`
  type Post {
    id: Int!
    title: String!
    content: String!
    created_at: String!
  }

  type SeedResult {
    inserted: Int!
  }

  type Query {
    posts: [Post!]!
  }

  type Mutation {
    seedPosts10: SeedResult!
  }
`);

const rootValue = {
  posts: async () => {
    const { rows } = await pool.query(`
      SELECT id, title, content, created_at
      FROM public.posts
      ORDER BY id DESC;
    `);
    return rows;
  },

  seedPosts10: async () => {
    const insertedRows = await seedPosts10();
    return { inserted: insertedRows.length };
  },
};

module.exports = { schema, rootValue };
