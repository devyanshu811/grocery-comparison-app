/**
 * Server Layer - Default
 * Main server initialization and request routing
 */

import type { NextRequest } from "next/server"
import { AuthController } from "../controller/auth"
import { CategoryController } from "../controller/category"
import { ProductController } from "../controller/product"
import { StoreController } from "../controller/store"
import { initDatabase } from "../database/default"
import { authenticateSession, createRequestContext, errorResponse, jsonRpcResponse, successResponse, type RequestContext } from "../middleware/default"

/**
 * Initialize server
 */
export async function init() {
  // Initialize database with mock data
  await initDatabase()
}

/**
 * Handle resource routing
 */
async function handleResource(req: RequestContext) {
  const { resource, action } = req

  if (!resource || !action) {
    throw new Error("Invalid method format: expected 'resource.action'")
  }

  // Route to appropriate controller
  switch (resource) {
    case "product":
      return await handleProduct(req, action)
    case "store":
      return await handleStore(req, action)
    case "category":
      return await handleCategory(req, action)
    case "auth":
      return await handleAuth(req, action)
    default:
      throw new Error(`Unknown resource: ${resource}`)
  }
}

/**
 * Handle product actions
 */
async function handleProduct(req: RequestContext, action: string) {
  switch (action) {
    case "get":
      return await ProductController.get(req)
    case "list":
      return await ProductController.list(req)
    case "create":
      return await ProductController.create(req)
    case "update":
      return await ProductController.update(req)
    case "delete":
      return await ProductController.delete(req)
    case "comparison":
      return await ProductController.getComparison(req)
    case "search":
      return await ProductController.search(req)
    case "getByCategory":
      return await ProductController.getByCategory(req)
    default:
      throw new Error(`Unknown product action: ${action}`)
  }
}

/**
 * Handle store actions
 */
async function handleStore(req: RequestContext, action: string) {
  switch (action) {
    case "get":
      return await StoreController.get(req)
    case "list":
      return await StoreController.list(req)
    case "create":
      return await StoreController.create(req)
    case "update":
      return await StoreController.update(req)
    case "delete":
      return await StoreController.delete(req)
    default:
      throw new Error(`Unknown store action: ${action}`)
  }
}

/**
 * Handle category actions
 */
async function handleCategory(req: RequestContext, action: string) {
  switch (action) {
    case "get":
      return await CategoryController.get(req)
    case "list":
      return await CategoryController.list(req)
    case "create":
      return await CategoryController.create(req)
    case "update":
      return await CategoryController.update(req)
    case "delete":
      return await CategoryController.delete(req)
    default:
      throw new Error(`Unknown category action: ${action}`)
  }
}

/**
 * Handle auth actions
 */
async function handleAuth(req: RequestContext, action: string) {
  switch (action) {
    case "login":
      return await AuthController.login(req)
    case "authenticate":
      return await AuthController.authenticate(req)
    case "logout":
      return await AuthController.logout(req)
    default:
      throw new Error(`Unknown auth action: ${action}`)
  }
}

/**
 * Main request handler
 */
export async function handleRequest(request: NextRequest, body?: any) {
  try {
    // Create request context
    const context = createRequestContext(request, body)

    // Handle authentication (skip for auth endpoints)
    if (context.resource !== "auth" && context.action !== "login") {
      const token = body?.token || 
                    request.headers.get("authorization")?.replace("Bearer ", "") ||
                    request.cookies.get("session")?.value

      if (token) {
        const authResult = await authenticateSession(token)
        if (authResult) {
          context.session = authResult.session
          context.user = authResult.user
        }
      }
    }

    // Handle resource
    const result = await handleResource(context)

    return successResponse(result)
  } catch (error: any) {
    return errorResponse(error.message || "Internal server error", 500)
  }
}

/**
 * Handle JSON-RPC request
 */
export async function handleRpcRequest(request: NextRequest) {
  let body: any
  let id: string | number | null = null

  try {
    body = await request.json()
    const { jsonrpc, method, params, id: requestId, token } = body
    id = requestId || null

    if (jsonrpc !== "2.0") {
      return jsonRpcResponse(id, null, {
        code: -32600,
        message: "Invalid Request",
      })
    }

    // Create request context
    const context = createRequestContext(request, {
      method,
      params: { ...params, token },
    })

    // Handle authentication
    if (context.resource !== "auth" && context.action !== "login") {
      if (token) {
        const authResult = await authenticateSession(token)
        if (authResult) {
          context.session = authResult.session
          context.user = authResult.user
        }
      }
    }

    // Handle resource
    const result = await handleResource(context)

    return jsonRpcResponse(id, result)
  } catch (error: any) {
    return jsonRpcResponse(
      id || body?.id || null,
      null,
      {
        code: -32000,
        message: error.message || "Server error",
      }
    )
  }
}

/**
 * Health check endpoint
 */
export function handleHealth() {
  return successResponse({ status: "OK", timestamp: new Date().toISOString() })
}

// Re-export middleware functions for API routes
export { isCorsEnabled, setCorsHeaders } from "../middleware/default"

