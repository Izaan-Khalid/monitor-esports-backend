import express, { Request, Response } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import { authenticateToken } from "../middleware/auth"
import redisClient from "../config/redis"
const router = express.Router()
const prisma = new PrismaClient()

// Register
router.post("/registerWithEmail", async (req, res) => {
	try {
		const { username, email, password, name } = req.body

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 10)

		// Create user
		const user = await prisma.user.create({
			data: {
				username,
				email,
				password: hashedPassword,
				name,
			},
		})

		// Generate JWT
		const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
			expiresIn: "7d",
		})

		res.status(201).json({
			token,
			user: {
				id: user.id,
				username: user.username,
				email: user.email,
				name: user.name,
			},
		})
	} catch (err) {
		console.log(err)
		res.status(500).json({ error: "Server error" })
	}
})

router.post("/login", async (req, res) => {
	try {
		const { username, password } = req.body

		// Find user
		const user = await prisma.user.findUnique({
			where: {
				username: username as string,
			},
		})

		// Generate JWT
		const token = jwt.sign(
			{
				userId: user?.id,
				email: user?.email,
			},
			process.env.JWT_SECRET!,
			{ expiresIn: "7d" }
		)

		// Verify password
		const isPasswordValid = await bcrypt.compare(password, user!.password)

		if (!isPasswordValid) {
			console.log("invalid password")
		}

		res.json({
			sucess: true,
			message: "Login successful",
			token,
			user: {
				id: user?.id,
				username: user?.username,
				email: user?.email,
				name: user?.name,
			},
		})
	} catch (err) {
		console.error("Login error:", err)
		res.status(500).json({
			error: "Unable to log in. Please try again.",
		})
	}
})

// Get current user (protected route)
router.get(
	"/me",
	authenticateToken as any,
	async (req: Request, res: Response) => {
		try {
			const user = await prisma.user.findUnique({
				where: { id: req.user!.userId },
				select: {
					id: true,
					username: true,
					email: true,
					name: true,
					createdAt: true,
					updatedAt: true,
				},
			})
			res.json({
				success: true,
				user,
			})
		} catch (err) {
			console.error("Get user error:", err)
			res.status(500).json({
				error: "Unable to fetch user data",
			})
		}
	}
)

// Check username
router.post("/checkUsernames", async (req: Request, res: Response) => {
	try {
		const { username } = req.body
		const cacheKey = `username:${username}`

		// Check redis cache
		const cached = await redisClient.get(cacheKey)
		if (cached !== null) {
			console.log(`✅ Cache hit: ${username}`)
			res.json({ success: cached === "true" })
			return
		}

		// Cache miss - check database
		console.log(`❌ Cache miss: ${username}`)
		const usernameExists = await prisma.user.findUnique({
			where: { username: username },
		})

		const isAvailable = !usernameExists

		// Save to Redis (expires in 5 minutes)
		await redisClient.setEx(cacheKey, 300, isAvailable.toString())

		res.json({
			suceess: isAvailable,
		})
	} catch (err) {
		res.status(500).json({
			error: "Unable to fetch user data",
		})
	}
})

export default router
