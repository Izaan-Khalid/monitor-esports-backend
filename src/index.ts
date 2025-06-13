import express from "express"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"
import helmet from "helmet"
import cors from "cors"
import morgan from "morgan"

import authRoutes from "./routes/auth"
import redisClient from "./config/redis"

dotenv.config()

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Middlware
app.use(helmet())
app.use(cors())
app.use(morgan("combined"))
app.use(express.json())

// Routes
app.use("/api/auth", authRoutes)

// Health check
app.get("/health", (req, res) => {
	res.json({ status: "OK", timeStamp: new Date().toISOString() })
})

// Error handling
app.use(
	(
		err: Error,
		req: express.Request,
		res: express.Response,
		next: express.NextFunction
	) => {
		console.log(err.stack)
		res.status(500).json({ error: "Something went wrong!" })
	}
)

// Start server and connect to Redis
async function startServer() {
	try {
		// Connect to Redis first
		await redisClient.connect()
		console.log("✅ Redis connected")

		// Then start the server
		app.listen(PORT, () => {
			console.log(`🚀 Server running on port ${PORT}`)
		})
	} catch (error) {
		console.error("❌ Failed to start server:", error)
		process.exit(1)
	}
}

startServer()

// Graceful shutdown
process.on("SIGINT", async () => {
	await prisma.$disconnect()
	await redisClient.quit()
	process.exit(0)
})
