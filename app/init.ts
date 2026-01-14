/**
 * Application Initialization
 * Initialize the application on startup
 */

import { init } from "./server/default"

let initialized = false

export async function initializeApp() {
  if (initialized) {
    return
  }

  try {
    await init()
    initialized = true
  } catch (error) {
    console.error("Failed to initialize application:", error)
    throw error
  }
}

