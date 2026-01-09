export interface Store {
  id: string
  name: string
  logo: string
  deliveryTime: string
}

export interface Product {
  id: string
  name: string
  image: string
  quantity: string
  category: string
  prices: {
    storeId: string
    price: number
  }[]
}

export interface CartItem {
  productId: string
  quantity: number
  selectedStoreId: string
}

export interface ComparisonProduct {
  id: string
  name: string
  image: string
  quantity: string
  prices: {
    store: Store
    price: number
  }[]
}
