import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

declare global {
	namespace Express {
		interface Request {
			user?: {
				userId: string
				email: string
			}
		}
	}
}

export const authenticateToken = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const token = req.headers["authorization"]

	console.log(token)

	if (!token) {
		return res.status(401).json({ error: "Access token required." })
	}

	jwt.verify(token, process.env.JWT_SECRET!, (err, decoded) => {
		if (err) {
			return res.status(403).json({ error: "Invalid token" })
		}

		req.user = decoded as { userId: string; email: string }
		next()
	})
}
