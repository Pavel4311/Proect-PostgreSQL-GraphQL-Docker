const {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  gql,
} = require("@apollo/client/core");

const GRAPHQL_URL = process.env.GRAPHQL_URL || "http://localhost:3000/graphql";

async function main() {
  const client = new ApolloClient({
    link: new HttpLink({ uri: GRAPHQL_URL, fetch }),
    cache: new InMemoryCache(),
    defaultOptions: { query: { fetchPolicy: "no-cache" } },
  });

  // 1) seed 10 posts
  const seedRes = await client.mutate({
    mutation: gql`
      mutation {
        seedPosts10 {
          inserted
        }
      }
    `,
  });
  console.log("inserted:", seedRes.data.seedPosts10.inserted);

  // 2) get posts
  const postsRes = await client.query({
    query: gql`
      query {
        posts {
          id
          title
          content
          created_at
        }
      }
    `,
  });

  console.log("posts:", postsRes.data.posts.length);
  console.log(postsRes.data.posts.slice(0, 3));
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
