/**
 * Location-aware product catalog.
 * Represents "products available from store websites in the user's area".
 * With a real third-party API (Nextract, RealDataAPI), this would be replaced
 * by live data; until then we use this expanded mock so the app shows a full
 * catalog for the selected location.
 */

import type { Product } from "../models/types"

const STORE_IDS = [
  "swiggy",
  "blinkit",
  "zepto",
  "bigbasket",
  "amazon_now",
  "flipkart_minutes",
  "jiomart",
  "dmart_ready",
] as const

/** Generate a price for a store (deterministic from product name + store for consistency) */
function priceFor(storeId: string, base: number, name: string): number {
  const hash = (name + storeId).split("").reduce((a, c) => (a + c.charCodeAt(0)) | 0, 0)
  const offset = (hash % 41) - 20
  return Math.max(10, base + offset)
}

/** Build product with prices across all 8 stores (simulates availability in user's location) */
function product(
  id: string,
  name: string,
  image: string,
  quantity: string,
  category: string,
  basePrice: number
): Product {
  const prices = STORE_IDS.map((storeId) => ({
    storeId,
    price: priceFor(storeId, basePrice, name),
  }))
  return {
    id,
    name,
    image,
    quantity,
    category,
    prices,
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * Full catalog of products as if "available in stores at user's location".
 * Used by the mock provider when serving list/search so the app shows
 * a rich, location-aware catalog until a real API is connected.
 */
export function getLocationCatalogProducts(): Product[] {
  const now = new Date()
  const p = (id: string, name: string, img: string, qty: string, cat: string, base: number) =>
    ({ ...product(id, name, img, qty, cat, base), createdAt: now, updatedAt: now }) as Product

  return [
    p("1", "Basmati Rice (1kg)", "/red-apples.png", "1 kg", "Grains & Rice", 340),
    p("2", "Organic Tomatoes", "/orange-carrots.jpg", "500g", "Vegetables", 42),
    p("3", "Amul Milk", "/milk-carton.png", "1L", "Dairy & Eggs", 58),
    p("4", "Turmeric Powder", "/mixed-nuts-snack.jpg", "100g", "Spices", 85),
    p("5", "Lay's Chips (Classic)", "/orange-juice-bottle.jpg", "40g", "Snacks", 24),
    p("6", "Indian Bananas", "/yellow-bananas.jpg", "1 kg", "Fruits", 45),
    p("7", "Toor Dal", "/red-apples.png", "1 kg", "Grains & Rice", 120),
    p("8", "Onions", "/orange-carrots.jpg", "1 kg", "Vegetables", 35),
    p("9", "Potatoes", "/orange-carrots.jpg", "1 kg", "Vegetables", 28),
    p("10", "Eggs (Dozen)", "/milk-carton.png", "12 pcs", "Dairy & Eggs", 72),
    p("11", "Curd (500g)", "/milk-carton.png", "500g", "Dairy & Eggs", 45),
    p("12", "Red Chilli Powder", "/mixed-nuts-snack.jpg", "100g", "Spices", 55),
    p("13", "Cumin Seeds", "/mixed-nuts-snack.jpg", "50g", "Spices", 42),
    p("14", "Kurkure", "/orange-juice-bottle.jpg", "50g", "Snacks", 20),
    p("15", "Biscuits (Parle-G)", "/orange-juice-bottle.jpg", "100g", "Snacks", 30),
    p("16", "Apple (1kg)", "/red-apples.png", "1 kg", "Fruits", 180),
    p("17", "Orange (1kg)", "/orange-carrots.jpg", "1 kg", "Fruits", 90),
    p("18", "Spinach", "/orange-carrots.jpg", "200g", "Vegetables", 25),
    p("19", "Capsicum", "/orange-carrots.jpg", "500g", "Vegetables", 65),
    p("20", "Cooking Oil (1L)", "/orange-juice-bottle.jpg", "1L", "Grains & Rice", 180),
    p("21", "Wheat Flour (1kg)", "/red-apples.png", "1 kg", "Grains & Rice", 48),
    p("22", "Sugar (1kg)", "/red-apples.png", "1 kg", "Grains & Rice", 52),
    p("23", "Salt (1kg)", "/mixed-nuts-snack.jpg", "1 kg", "Spices", 22),
    p("24", "Tea (500g)", "/mixed-nuts-snack.jpg", "500g", "Beverages", 250),
    p("25", "Nescafe Coffee", "/orange-juice-bottle.jpg", "50g", "Beverages", 140),
    p("26", "Cola (2L)", "/orange-juice-bottle.jpg", "2L", "Beverages", 99),
    p("27", "Mineral Water (1L)", "/orange-juice-bottle.jpg", "1L", "Beverages", 20),
    p("28", "Bread (White)", "/red-apples.png", "400g", "Grains & Rice", 35),
    p("29", "Butter (100g)", "/milk-carton.png", "100g", "Dairy & Eggs", 55),
    p("30", "Paneer (200g)", "/milk-carton.png", "200g", "Dairy & Eggs", 80),
    p("31", "Coriander Leaves", "/orange-carrots.jpg", "100g", "Vegetables", 15),
    p("32", "Green Peas (Frozen)", "/orange-carrots.jpg", "500g", "Vegetables", 95),
    p("33", "Ginger", "/orange-carrots.jpg", "250g", "Vegetables", 40),
    p("34", "Garlic", "/orange-carrots.jpg", "250g", "Vegetables", 55),
    p("35", "Maggi Noodles (12 pack)", "/orange-juice-bottle.jpg", "12 x 70g", "Snacks", 144),
    p("36", "Oats (500g)", "/red-apples.png", "500g", "Grains & Rice", 95),
    p("37", "Honey (500g)", "/orange-juice-bottle.jpg", "500g", "Beverages", 220),
    p("38", "Soap (3 pack)", "/orange-juice-bottle.jpg", "3 pcs", "Personal Care", 99),
    p("39", "Toothpaste", "/orange-juice-bottle.jpg", "200g", "Personal Care", 115),
    p("40", "Shampoo (400ml)", "/orange-juice-bottle.jpg", "400ml", "Personal Care", 185),
  ]
}
