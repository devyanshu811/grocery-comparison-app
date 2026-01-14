/**
 * Auth Controller
 * Authentication and session management
 */

import { db } from "../database/default";
import type { RequestContext } from "../middleware/default";
import { authenticateSession } from "../middleware/default";
import type { Session, User } from "../models/types";

export class AuthController {
  /**
   * Login user
   */
  static async login(req: RequestContext): Promise<{ session: Session; user: User }> {
    const { username, password } = req.params

    if (!username || !password) {
      throw new Error("Username and password are required")
    }

    // Get user by username
    const user = await db.getUserByUsername(username)
    if (!user) {
      throw new Error("Invalid credentials")
    }

    // In a real app, verify password hash here
    // For now, we'll just create a session
    const session = await this.createSession(user)

    return { session, user }
  }

  /**
   * Create session for user
   */
  static async createSession(user: User): Promise<Session> {
    const sessionId = this.generateSessionId()
    const token = this.generateToken()

    const session: Session = {
      id: sessionId,
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date(),
    }

    await db.createSession(session)
    return session
  }

  /**
   * Authenticate session
   */
  static async authenticate(req: RequestContext): Promise<{ session: Session; user: User } | null> {
    const token = req.params.token || 
                  (req as any).headers?.authorization?.replace("Bearer ", "")

    if (!token) {
      return null
    }

    return await authenticateSession(token)
  }

  /**
   * Logout user
   */
  static async logout(req: RequestContext): Promise<boolean> {
    const { sessionId } = req.params
    if (!sessionId) {
      throw new Error("Session ID is required")
    }

    return await db.deleteSession(sessionId)
  }

  /**
   * Generate session ID
   */
  private static generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Generate session token
   */
  private static generateToken(): string {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`
  }
}

