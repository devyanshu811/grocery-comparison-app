/**
 * Middleware Layer - Default
 * Request handling, authentication, and routing middleware
 */

import type { NextRequest, NextResponse } from "next/server"
import { db } from "../database/default"
import type { Session, User } from "../models/types"

export interface RequestContext {
  method: string
  resource?: string
  action?: string
  params: any
  session?: Session
  user?: User
  ip?: string
}

/**
 * Parse method string (format: "resource.action")
 */
export function parseMethod(method: string): { resource: string; action: string } {
  const parts = method.split(".")
  return {
    resource: parts[0] || "",
    action: parts[1] || "",
  }
}

/**
 * Authenticate session from token
 */
export async function authenticateSession(token: string): Promise<{ session: Session; user: User } | null> {
  if (!token) return null

  // Find session by token
  const dbAny = db as any
  const sessionsMap = dbAny.sessions as Map<string, Session> | undefined
  if (!sessionsMap) return null
  
  const sessions = Array.from(sessionsMap.values())
  const session = sessions.find((s) => s.token === token) as Session | undefined

  if (!session) return null

  // Check if session is expired
  if (session.expiresAt && new Date() > session.expiresAt) {
    await db.deleteSession(session.id)
    return null
  }

  // Get user
  const user = await db.getUser(session.userId)
  if (!user) return null

  return { session, user }
}

/**
 * Create request context from Next.js request
 */
export function createRequestContext(
  request: NextRequest,
  body?: any
): RequestContext {
  const method = body?.method || request.nextUrl.searchParams.get("method") || ""
  const { resource, action } = parseMethod(method)
  
  const token =
    request.headers.get("authorization")?.replace("Bearer ", "") ||
    request.cookies.get("session")?.value ||
    body?.token

  return {
    method,
    resource,
    action,
    params: body?.params || {},
    ip: request.headers.get("x-forwarded-for") || "unknown",
  }
}

/**
 * Handle CORS headers
 */
export function setCorsHeaders(response: Response | NextResponse): Response | NextResponse {
  response.headers.set("Access-Control-Allow-Origin", "*")
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  return response
}

/**
 * Check if route allows CORS
 */
export function isCorsEnabled(pathname: string): boolean {
  const corsRoutes = ["/api/rpc", "/api/upload", "/api/health"]
  return corsRoutes.some(route => pathname.startsWith(route))
}

/**
 * Error response helper
 */
export function errorResponse(message: string, code: number = 400, data?: any) {
  return Response.json(
    {
      error: {
        code,
        message,
        data,
      },
    },
    { status: code }
  )
}

/**
 * Success response helper
 */
export function successResponse(data: any, status: number = 200) {
  return Response.json(
    {
      result: data,
    },
    { status }
  )
}

/**
 * JSON-RPC response helper
 */
export function jsonRpcResponse(id: string | number | null, result?: any, error?: any) {
  return Response.json({
    jsonrpc: "2.0",
    id: id ?? null,
    ...(error ? { error } : { result }),
  })
}

