import express from "express"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"
import helmet from "helmet"
import cors from "cors"
import morgan from "morgan"

import authRoutes from "./routes/auth"

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

app.listen(PORT, () => {
	console.log(`🚀 Server running on port ${PORT}`)
})

// Graceful shutdown
process.on("SIGINT", async () => {
	await prisma.$disconnect()
	process.exit(0)
})
