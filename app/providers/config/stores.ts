/**
 * Store API configuration for all 8 grocery platforms.
 * Maps our store IDs to third-party API path segments (e.g. Nextract-style endpoints).
 * None of these companies offer public APIs; data is typically accessed via
 * aggregators like Nextract or RealDataAPI.
 */

export const STORE_API_CONFIG: Record<
  string,
  { name: string; apiPath: string; deliveryTime: string }
> = {
  swiggy: {
    name: "Swiggy Instamart",
    apiPath: "swiggy-instamart",
    deliveryTime: "13 mins",
  },
  blinkit: {
    name: "Blinkit",
    apiPath: "blinkit",
    deliveryTime: "17 mins",
  },
  zepto: {
    name: "Zepto",
    apiPath: "zepto",
    deliveryTime: "N/A",
  },
  bigbasket: {
    name: "Bigbasket",
    apiPath: "bigbasket",
    deliveryTime: "N/A",
  },
  amazon_now: {
    name: "Amazon Now",
    apiPath: "amazon-now",
    deliveryTime: "N/A",
  },
  flipkart_minutes: {
    name: "Flipkart MINUTES",
    apiPath: "flipkart-minutes",
    deliveryTime: "N/A",
  },
  jiomart: {
    name: "Jio Mart",
    apiPath: "jiomart",
    deliveryTime: "Quick Delivery",
  },
  dmart_ready: {
    name: "D'Mart Ready",
    apiPath: "dmart-ready",
    deliveryTime: "N/A",
  },
}

export const STORE_IDS = Object.keys(STORE_API_CONFIG) as string[]
