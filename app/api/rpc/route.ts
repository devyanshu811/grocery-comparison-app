/**
 * API Route - JSON-RPC Endpoint
 * Handles JSON-RPC 2.0 requests
 */

import { NextRequest } from "next/server"
import { handleRpcRequest, isCorsEnabled, setCorsHeaders } from "../../server/default"

export async function POST(request: NextRequest) {
  // Handle CORS
  if (isCorsEnabled(request.nextUrl.pathname)) {
    const response = await handleRpcRequest(request)
    return setCorsHeaders(response as any)
  }

  return handleRpcRequest(request)
}

export async function OPTIONS(request: NextRequest) {
  const response = new Response(null, { status: 204 })
  setCorsHeaders(response)
  return response
}

