/**
 * API Route - Health Check
 * Returns server health status
 */

import { NextRequest } from "next/server"
import { handleHealth } from "../../server/default"

export async function GET(request: NextRequest) {
  return handleHealth()
}

