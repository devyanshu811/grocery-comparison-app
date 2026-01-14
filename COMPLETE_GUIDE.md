# Complete Code Structure & Function Guide

## 📐 Architecture Overview

This application follows a **5-layer architecture pattern**:

```
┌─────────────────────────────────────┐
│  1. Presentation Layer (React)     │
│     - Components, Pages             │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  2. API Client Layer                │
│     - lib/api.ts                     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  3. Server Layer                    │
│     - app/server/default.ts         │
│     - app/api/*/route.ts            │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  4. Middleware Layer                 │
│     - app/middleware/default.ts     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  5. Controller Layer                 │
│     - app/controller/*.ts           │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  6. Model Layer                      │
│     - app/models/*.ts               │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  7. Database Layer                   │
│     - app/database/default.ts       │
└─────────────────────────────────────┘
```

---

## 📁 Directory Structure

```
grocery-comparison-app/
├── app/
│   ├── api/                    # Next.js API Routes (Entry Point)
│   │   ├── rpc/route.ts        # JSON-RPC endpoint
│   │   ├── health/route.ts     # Health check
│   │   └── [...resource]/      # RESTful endpoint
│   │
│   ├── server/                 # Server Layer
│   │   └── default.ts          # Request routing & orchestration
│   │
│   ├── middleware/             # Middleware Layer
│   │   └── default.ts          # Auth, CORS, request processing
│   │
│   ├── controller/             # Controller Layer
│   │   ├── product.ts          # Product business logic
│   │   ├── store.ts            # Store business logic
│   │   ├── category.ts         # Category business logic
│   │   └── auth.ts             # Authentication logic
│   │
│   ├── models/                 # Model Layer
│   │   ├── types.ts            # TypeScript interfaces
│   │   ├── product.ts          # Product model operations
│   │   ├── store.ts            # Store model operations
│   │   └── category.ts         # Category model operations
│   │
│   ├── database/               # Database Layer
│   │   └── default.ts          # Database operations (Mock)
│   │
│   └── init.ts                 # Application initialization
│
└── lib/
    ├── api.ts                  # API Client (Frontend)
    └── types.ts                # Type re-exports
```

---

## 🔍 Layer-by-Layer Explanation

### **LAYER 1: Models - Type Definitions**

**File:** `app/models/types.ts`

**Purpose:** Defines all TypeScript interfaces for the application.

#### Functions/Interfaces:

1. **`interface Store`**

   - Defines store structure (id, name, logo, deliveryTime, status, timestamps)
   - Used to represent grocery stores (BigBasket, Zepto, etc.)

2. **`interface Product`**

   - Defines product structure (id, name, image, quantity, category, prices array)
   - `prices` array contains `{storeId, price}` objects for each store

3. **`interface ComparisonProduct`**

   - Special product format with full store objects in prices
   - Used for comparison views

4. **`interface Category`**

   - Defines product categories (Grains, Vegetables, Dairy, etc.)

5. **`interface User`**

   - User account structure (id, username, role, projects)

6. **`interface Session`**

   - Session/token structure for authentication

7. **`interface CartItem`**
   - Shopping cart item structure

---

### **LAYER 2: Database Layer**

**File:** `app/database/default.ts`

**Purpose:** Abstract database operations. Currently uses in-memory Map storage (mock database).

#### Key Components:

1. **`mockDatabase` (Object)**

   - Contains 5 Maps: stores, products, categories, users, sessions
   - Acts as in-memory database storage

2. **`interface Database`**

   - Defines contract for all database operations
   - Methods: createStore, getStore, listStores, updateStore, deleteStore
   - Similar methods for products, categories, users, sessions

3. **`class MockDatabase`**
   - Implements Database interface
   - All methods are async and return Promises

#### Functions:

**Store Operations:**

- **`createStore(store: Store)`**: Adds store to Map
- **`getStore(id: string)`**: Retrieves store by ID
- **`listStores()`**: Returns all stores as array
- **`updateStore(id, data)`**: Updates store fields
- **`deleteStore(id)`**: Removes store from Map

**Product Operations:**

- **`createProduct(product)`**: Adds product to Map
- **`getProduct(id)`**: Retrieves product by ID
- **`listProducts(filters?)`**: Lists products with optional filtering
  - Filters by category if provided
  - Filters by search term (case-insensitive name matching)
- **`updateProduct(id, data)`**: Updates product
- **`deleteProduct(id)`**: Removes product

**Category Operations:**

- Similar CRUD operations for categories

**User Operations:**

- **`getUserByUsername(username)`**: Finds user by username (searches all users)

**Session Operations:**

- CRUD operations for sessions

4. **`export const db`**

   - Singleton instance of MockDatabase
   - Used throughout the application

5. **`initDatabase()`**
   - **Purpose:** Populates database with initial mock data
   - **Process:**
     1. Creates array of 4 stores (BigBasket, Zepto, Blinkit, Amazon Fresh)
     2. Creates array of 5 categories
     3. Creates array of 6 products with prices across stores
     4. Uses `Promise.all()` to initialize all data in parallel
   - **Called:** Once on application startup

---

### **LAYER 3: Model Layer**

**Files:** `app/models/product.ts`, `app/models/store.ts`, `app/models/category.ts`

**Purpose:** Provides model-level operations and business rules.

#### Product Model (`app/models/product.ts`)

**Class:** `ProductModel` (static methods only)

**Functions:**

1. **`create(product)`**

   - **Input:** Product data without id/timestamps
   - **Process:**
     - Generates unique ID using `generateId()`
     - Sets default status to "active"
     - Adds createdAt/updatedAt timestamps
     - Calls `db.createProduct()`
   - **Returns:** Created Product

2. **`get(id)`**

   - **Input:** Product ID
   - **Returns:** Product or null
   - **Calls:** `db.getProduct(id)`

3. **`list(filters?)`**

   - **Input:** Optional filters (category, search, status)
   - **Returns:** Array of products
   - **Calls:** `db.listProducts(filters)`

4. **`update(id, data)`**

   - **Input:** Product ID and partial update data
   - **Returns:** Updated Product
   - **Calls:** `db.updateProduct(id, data)`

5. **`delete(id)`**

   - **Input:** Product ID
   - **Process:** Soft delete - sets status to "archived" instead of removing
   - **Returns:** true

6. **`generateId()` (private)**
   - **Purpose:** Generates unique product ID
   - **Format:** `prod_{timestamp}_{random}`
   - **Example:** `prod_1703123456789_k3j9x2m1p`

#### Store Model (`app/models/store.ts`)

Similar structure to ProductModel:

- `create()`, `get()`, `list()`, `update()`, `delete()`
- `generateId()` creates IDs like `store_{timestamp}_{random}`

#### Category Model (`app/models/category.ts`)

Similar structure:

- `create()`, `get()`, `list()`, `update()`, `delete()`
- `generateId()` creates IDs like `cat_{timestamp}_{random}`

---

### **LAYER 4: Middleware Layer**

**File:** `app/middleware/default.ts`

**Purpose:** Request processing, authentication, CORS, response formatting.

#### Types:

1. **`interface RequestContext`**
   - **Fields:**
     - `method`: Full method string (e.g., "product.get")
     - `resource`: Extracted resource (e.g., "product")
     - `action`: Extracted action (e.g., "get")
     - `params`: Request parameters
     - `session`: Authenticated session (optional)
     - `user`: Authenticated user (optional)
     - `ip`: Client IP address

#### Functions:

1. **`parseMethod(method: string)`**

   - **Input:** Method string like "product.get"
   - **Process:** Splits by "." to extract resource and action
   - **Returns:** `{resource: "product", action: "get"}`
   - **Example:** "store.list" → `{resource: "store", action: "list"}`

2. **`authenticateSession(token: string)`**

   - **Input:** Session token string
   - **Process:**
     1. Gets sessions Map from database
     2. Finds session with matching token
     3. Checks if session is expired
     4. If expired, deletes session and returns null
     5. Gets user associated with session
   - **Returns:** `{session, user}` or `null`

3. **`createRequestContext(request, body?)`**

   - **Input:** Next.js request and optional body
   - **Process:**
     1. Extracts method from body or query params
     2. Parses method to get resource/action
     3. Extracts token from:
        - Authorization header (Bearer token)
        - Cookie (session)
        - Body params
     4. Gets client IP from headers
   - **Returns:** RequestContext object

4. **`setCorsHeaders(response)`**

   - **Input:** Response object
   - **Process:** Sets CORS headers:
     - Access-Control-Allow-Origin: \*
     - Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
     - Access-Control-Allow-Headers: Content-Type, Authorization
   - **Returns:** Response with CORS headers

5. **`isCorsEnabled(pathname)`**

   - **Input:** URL pathname
   - **Process:** Checks if pathname starts with allowed CORS routes
   - **Allowed routes:** `/api/rpc`, `/api/upload`, `/api/health`
   - **Returns:** boolean

6. **`errorResponse(message, code, data?)`**

   - **Input:** Error message, HTTP code, optional data
   - **Returns:** JSON response with error structure:
     ```json
     {
       "error": {
         "code": 400,
         "message": "Error message",
         "data": {}
       }
     }
     ```

7. **`successResponse(data, status?)`**

   - **Input:** Data to return, optional HTTP status
   - **Returns:** JSON response:
     ```json
     {
       "result": <data>
     }
     ```

8. **`jsonRpcResponse(id, result?, error?)`**
   - **Input:** Request ID, optional result, optional error
   - **Returns:** JSON-RPC 2.0 formatted response:
     ```json
     {
       "jsonrpc": "2.0",
       "id": <id>,
       "result": <data> OR "error": <error>
     }
     ```

---

### **LAYER 5: Controller Layer**

**Files:** `app/controller/product.ts`, `app/controller/store.ts`, `app/controller/category.ts`, `app/controller/auth.ts`

**Purpose:** Business logic, validation, authorization.

#### Product Controller (`app/controller/product.ts`)

**Class:** `ProductController` (static methods)

**Functions:**

1. **`get(req: RequestContext)`**

   - **Input:** Request context with params containing `id`
   - **Validation:** Checks if `id` exists
   - **Returns:** Product or null
   - **Calls:** `ProductModel.get(id)`

2. **`list(req: RequestContext)`**

   - **Input:** Request context with optional params (category, search, status)
   - **Returns:** Array of products
   - **Calls:** `ProductModel.list(filters)`

3. **`create(req: RequestContext)`**

   - **Input:** Request context with product data in params
   - **Authorization:** Checks if user role is "admin"
   - **Returns:** Created product
   - **Calls:** `ProductModel.create(productData)`

4. **`update(req: RequestContext)`**

   - **Input:** Request context with `id` and update data in params
   - **Authorization:** Admin only
   - **Validation:** Checks if `id` exists
   - **Returns:** Updated product

5. **`delete(req: RequestContext)`**

   - **Input:** Request context with `id` in params
   - **Authorization:** Admin only
   - **Returns:** true

6. **`getComparison(req: RequestContext)`**

   - **Input:** Request context with `id` in params
   - **Process:**
     1. Gets product by ID
     2. Gets all stores
     3. Creates Map of stores by ID for fast lookup
     4. Maps product prices to include full store objects
     5. Filters out null entries (stores not found)
   - **Returns:** ComparisonProduct with full store details

7. **`search(req: RequestContext)`**

   - **Input:** Request context with `query` in params
   - **Process:** If query exists, searches products; otherwise lists all
   - **Returns:** Array of matching products

8. **`getByCategory(req: RequestContext)`**
   - **Input:** Request context with `category` in params
   - **Returns:** Products filtered by category

#### Store Controller (`app/controller/store.ts`)

Similar structure:

- `get()`, `list()`, `create()`, `update()`, `delete()`
- All create/update/delete require admin role

#### Category Controller (`app/controller/category.ts`)

Similar structure:

- `get()`, `list()`, `create()`, `update()`, `delete()`
- Admin-only for mutations

#### Auth Controller (`app/controller/auth.ts`)

**Functions:**

1. **`login(req: RequestContext)`**

   - **Input:** Request context with `username` and `password` in params
   - **Process:**
     1. Validates username and password exist
     2. Gets user by username
     3. Creates session for user
   - **Returns:** `{session, user}`

2. **`createSession(user)`**

   - **Input:** User object
   - **Process:**
     1. Generates session ID
     2. Generates token
     3. Sets expiration (7 days from now)
     4. Creates session in database
   - **Returns:** Session object

3. **`authenticate(req: RequestContext)`**

   - **Input:** Request context with token
   - **Returns:** `{session, user}` or null

4. **`logout(req: RequestContext)`**
   - **Input:** Request context with `sessionId`
   - **Returns:** true (session deleted)

---

### **LAYER 6: Server Layer**

**File:** `app/server/default.ts`

**Purpose:** Main request routing and orchestration.

#### Functions:

1. **`init()`**

   - **Purpose:** Initialize application
   - **Process:** Calls `initDatabase()` to populate mock data
   - **Called:** Once on app startup (via `app/init.ts`)

2. **`handleResource(req: RequestContext)`**

   - **Input:** Request context with resource and action
   - **Process:**
     1. Validates resource and action exist
     2. Routes to appropriate handler based on resource:
        - "product" → `handleProduct()`
        - "store" → `handleStore()`
        - "category" → `handleCategory()`
        - "auth" → `handleAuth()`
   - **Returns:** Result from handler

3. **`handleProduct(req, action)`**

   - **Input:** Request context and action string
   - **Process:** Routes to ProductController method based on action:
     - "get" → `ProductController.get()`
     - "list" → `ProductController.list()`
     - "create" → `ProductController.create()`
     - "update" → `ProductController.update()`
     - "delete" → `ProductController.delete()`
     - "comparison" → `ProductController.getComparison()`
     - "search" → `ProductController.search()`
     - "getByCategory" → `ProductController.getByCategory()`
   - **Returns:** Result from controller

4. **`handleStore(req, action)`**

   - Similar routing for store actions

5. **`handleCategory(req, action)`**

   - Similar routing for category actions

6. **`handleAuth(req, action)`**

   - Routes to AuthController methods

7. **`handleRequest(request, body?)`**

   - **Input:** Next.js request and optional body
   - **Process:**
     1. Creates request context
     2. Authenticates if not auth endpoint
     3. Handles resource routing
     4. Returns success response
   - **Error Handling:** Catches errors and returns error response
   - **Returns:** JSON response

8. **`handleRpcRequest(request)`**

   - **Input:** Next.js request
   - **Process:**
     1. Parses JSON body
     2. Validates JSON-RPC 2.0 format
     3. Extracts method, params, id, token
     4. Creates request context
     5. Authenticates if needed
     6. Handles resource routing
     7. Returns JSON-RPC formatted response
   - **Error Handling:** Returns JSON-RPC error response
   - **Returns:** JSON-RPC 2.0 response

9. **`handleHealth()`**
   - **Returns:** Success response with status and timestamp

---

### **LAYER 7: API Routes (Entry Points)**

**Files:** `app/api/rpc/route.ts`, `app/api/health/route.ts`, `app/api/[...resource]/route.ts`

**Purpose:** Next.js API route handlers (HTTP endpoints).

#### RPC Route (`app/api/rpc/route.ts`)

1. **`POST(request)`**

   - **Input:** Next.js request
   - **Process:**
     1. Checks if CORS enabled for pathname
     2. Calls `handleRpcRequest()`
     3. Adds CORS headers if needed
   - **Returns:** JSON-RPC response

2. **`OPTIONS(request)`**
   - **Purpose:** Handle CORS preflight requests
   - **Returns:** 204 No Content with CORS headers

#### Health Route (`app/api/health/route.ts`)

1. **`GET(request)`**
   - **Returns:** Health check response
   - **Calls:** `handleHealth()`

#### Resource Route (`app/api/[...resource]/route.ts`)

1. **`POST(request)`**

   - **Process:**
     1. Parses JSON body
     2. Calls `handleRequest()`
     3. Adds CORS headers if needed
   - **Returns:** JSON response

2. **`GET(request)`**

   - **Process:**
     1. Extracts method from query params
     2. Extracts other params from query string
     3. Calls `handleRequest()`
   - **Returns:** JSON response

3. **`OPTIONS(request)`**
   - Handles CORS preflight

---

### **LAYER 8: API Client (Frontend)**

**File:** `lib/api.ts`

**Purpose:** Frontend functions that call backend API.

#### Functions:

1. **`apiRequest<T>(method, params?, options?)`**

   - **Input:** Method string, params object, fetch options
   - **Process:**
     1. Makes POST request to `/api/rpc`
     2. Sends JSON-RPC 2.0 formatted request:
        ```json
        {
          "jsonrpc": "2.0",
          "method": "product.get",
          "params": { "id": "1" },
          "id": 1234567890
        }
        ```
     3. Checks HTTP status
     4. Parses JSON response
     5. Checks for JSON-RPC error
   - **Returns:** Typed result
   - **Throws:** Error if request fails

2. **`getStores()`**

   - **Calls:** `apiRequest<Store[]>("store.list")`
   - **Returns:** Array of stores

3. **`getStore(id)`**

   - **Calls:** `apiRequest("store.get", { id })`
   - **Returns:** Store or null

4. **`getCategories()`**

   - **Calls:** `apiRequest("category.list")`
   - **Returns:** Array of categories

5. **`searchProducts(query)`**

   - **Calls:** `apiRequest("product.search", { query })`
   - **Returns:** Array of matching products

6. **`getProductsByCategory(category)`**

   - **Calls:** `apiRequest("product.getByCategory", { category })`
   - **Returns:** Array of products

7. **`getProduct(id)`**

   - **Calls:** `apiRequest("product.get", { id })`
   - **Returns:** Product or null

8. **`getProductComparison(productId)`**

   - **Calls:** `apiRequest("product.comparison", { id: productId })`
   - **Returns:** ComparisonProduct with full store details

9. **`listProducts(filters?)`**
   - **Calls:** `apiRequest("product.list", filters)`
   - **Returns:** Array of products

---

## 🔄 Complete Request Flow Example

### Example: Get Product Comparison

**User Action:** Clicks "Compare" button on product

**Step 1: Frontend Component**

```typescript
// components/product-card.tsx
const comparison = await getProductComparison("1");
```

**Step 2: API Client**

```typescript
// lib/api.ts - getProductComparison()
return apiRequest("product.comparison", { id: "1" });
```

**Step 3: HTTP Request**

```http
POST /api/rpc
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "product.comparison",
  "params": { "id": "1" },
  "id": 1703123456789
}
```

**Step 4: API Route Handler**

```typescript
// app/api/rpc/route.ts - POST()
handleRpcRequest(request);
```

**Step 5: Server Layer**

```typescript
// app/server/default.ts - handleRpcRequest()
1. Parse JSON body
2. Extract: method="product.comparison", params={id:"1"}, id=1703123456789
3. Create request context
4. Authenticate (if token provided)
5. handleResource(context)
```

**Step 6: Resource Routing**

```typescript
// app/server/default.ts - handleResource()
resource = "product", action = "comparison"
→ handleProduct(context, "comparison")
→ ProductController.getComparison(context)
```

**Step 7: Controller**

```typescript
// app/controller/product.ts - getComparison()
1. Extract id from params: "1"
2. ProductModel.get("1")
3. StoreModel.list()
4. Build comparison object with store details
5. Return ComparisonProduct
```

**Step 8: Model**

```typescript
// app/models/product.ts - get()
db.getProduct("1");
```

**Step 9: Database**

```typescript
// app/database/default.ts - getProduct()
mockDatabase.products.get("1")
→ Returns Product object
```

**Step 10: Response Flow (Back Up)**

```
Database → Model → Controller → Server → Middleware → API Route → Frontend
```

**Step 11: JSON-RPC Response**

```json
{
  "jsonrpc": "2.0",
  "id": 1703123456789,
  "result": {
    "id": "1",
    "name": "Basmati Rice (1kg)",
    "image": "/red-apples.png",
    "quantity": "1 kg",
    "prices": [
      {
        "store": {
          "id": "1",
          "name": "BigBasket",
          "logo": "🛒",
          "deliveryTime": "30-45 mins"
        },
        "price": 349
      },
      ...
    ]
  }
}
```

**Step 12: Frontend Receives Data**

```typescript
// Component receives ComparisonProduct
// Renders comparison view with prices across stores
```

---

## 🔐 Authentication Flow

### Login Process:

1. **User submits credentials**

   ```typescript
   // Frontend
   POST /api/rpc
   {
     "method": "auth.login",
     "params": { "username": "admin", "password": "pass123" }
   }
   ```

2. **Server routes to AuthController.login()**

3. **Controller validates and creates session**

   ```typescript
   // app/controller/auth.ts
   - Gets user by username
   - Creates session with token
   - Returns {session, user}
   ```

4. **Frontend stores token**

   ```typescript
   localStorage.setItem("token", session.token);
   ```

5. **Subsequent requests include token**

   ```http
   Authorization: Bearer token_1234567890_abc123
   ```

6. **Middleware authenticates**
   ```typescript
   // app/middleware/default.ts - authenticateSession()
   - Finds session by token
   - Checks expiration
   - Gets user
   - Adds to request context
   ```

---

## 📊 Data Flow Diagram

```
┌─────────────┐
│   React     │
│ Component   │
└──────┬──────┘
       │ getProductComparison("1")
       ↓
┌─────────────┐
│  lib/api.ts │
│ apiRequest()│
└──────┬──────┘
       │ POST /api/rpc
       ↓
┌─────────────┐
│  API Route  │
│ handleRpc() │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Server    │
│ handleRpc() │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ Middleware  │
│ authenticate│
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  Controller │
│ getComparison│
└──────┬──────┘
       │
       ↓
┌─────────────┐
│    Model    │
│ Product.get │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  Database   │
│ getProduct()│
└──────┬──────┘
       │
       ↓ Returns Product
       │
       ↑ Response flows back up
       │
┌─────────────┐
│   React     │
│ Component   │
│ (Receives)  │
└─────────────┘
```

---

## 🎯 Key Design Patterns

1. **Layered Architecture**: Clear separation of concerns
2. **Dependency Injection**: Controllers depend on Models, Models depend on Database
3. **Singleton Pattern**: Database instance (`db`) is shared
4. **Factory Pattern**: Model classes generate IDs
5. **Strategy Pattern**: Different handlers for different resources
6. **Middleware Pattern**: Request processing pipeline

---

## 🔧 Key Functions Summary

| Layer      | Key Function                 | Purpose                     |
| ---------- | ---------------------------- | --------------------------- |
| Database   | `initDatabase()`             | Populate mock data          |
| Database   | `db.getProduct(id)`          | Retrieve product            |
| Model      | `ProductModel.get(id)`       | Get product via model       |
| Controller | `ProductController.get(req)` | Business logic + validation |
| Middleware | `createRequestContext()`     | Build request context       |
| Middleware | `authenticateSession()`      | Validate token              |
| Server     | `handleResource()`           | Route to controller         |
| Server     | `handleRpcRequest()`         | Process JSON-RPC            |
| API Route  | `POST()`                     | HTTP endpoint handler       |
| API Client | `apiRequest()`               | Make HTTP request           |

---

This architecture provides:

- ✅ Clear separation of concerns
- ✅ Easy testing (each layer can be tested independently)
- ✅ Scalability (easy to add new resources)
- ✅ Maintainability (standardized patterns)
- ✅ Flexibility (can swap database implementation)
