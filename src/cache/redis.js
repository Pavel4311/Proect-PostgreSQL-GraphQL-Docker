const { createClient } = require("redis");

const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = Number(process.env.REDIS_PORT || 6379);

const redisClient = createClient({
  socket: {
    host: redisHost,
    port: redisPort,
  },
});

redisClient.on("error", (err) => {
  console.error("[Redis] error:", err);
});

let connectingPromise = null;

const connectRedis = async () => {
  if (redisClient.isOpen) return true;
  if (connectingPromise) return connectingPromise;

  connectingPromise = redisClient
    .connect()
    .then(() => {
      console.log(`[Redis] connected to ${redisHost}:${redisPort}`);
      return true;
    })
    .catch((err) => {
      console.error("[Redis] connection error:", err);
      return false;
    })
    .finally(() => {
      connectingPromise = null;
    });

  return connectingPromise;
};

module.exports = { redisClient, connectRedis };
