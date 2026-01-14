/**
 * API Route - Resource Handler
 * Handles RESTful API requests
 */

import { NextRequest } from "next/server"
import { handleRequest, isCorsEnabled, setCorsHeaders } from "../../server/default"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Handle CORS
    if (isCorsEnabled(request.nextUrl.pathname)) {
      const response = await handleRequest(request, body)
      return setCorsHeaders(response as any)
    }

    return handleRequest(request, body)
  } catch (error: any) {
    return Response.json(
      { error: { message: error.message || "Invalid request" } },
      { status: 400 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const method = request.nextUrl.searchParams.get("method") || ""
    const params: any = {}
    
    // Extract params from query string
    request.nextUrl.searchParams.forEach((value, key) => {
      if (key !== "method") {
        params[key] = value
      }
    })

    const body = { method, params }

    // Handle CORS
    if (isCorsEnabled(request.nextUrl.pathname)) {
      const response = await handleRequest(request, body)
      return setCorsHeaders(response as any)
    }

    return handleRequest(request, body)
  } catch (error: any) {
    return Response.json(
      { error: { message: error.message || "Invalid request" } },
      { status: 400 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  const response = new Response(null, { status: 204 })
  setCorsHeaders(response)
  return response
}

