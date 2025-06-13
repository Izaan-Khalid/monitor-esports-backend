import { createClient } from "redis"

const client = createClient({
	username: "default",
	password: process.env.REDIS_URL,
	socket: {
		host: "redis-15754.c267.us-east-1-4.ec2.redns.redis-cloud.com",
		port: 15754,
	},
})

client.on("error", (err) => console.log("Redis Client Error", err))
client.on("connect", () => console.log("Connected to Redis"))

export default client
