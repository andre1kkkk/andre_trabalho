// IndexedDB Database Manager
const DB_NAME = "SalesManagementDB"
const DB_VERSION = 1

class Database {
  constructor() {
    this.db = null
  }

  // Initialize database
  async init() {
    console.log("[v0] Initializing database...")
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error("[v0] Database error:", request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log("[v0] Database initialized successfully")
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        console.log("[v0] Upgrading database...")
        const db = event.target.result

        // Create Products store
        if (!db.objectStoreNames.contains("products")) {
          const productStore = db.createObjectStore("products", {
            keyPath: "id",
            autoIncrement: true,
          })
          productStore.createIndex("name", "name", { unique: false })
          console.log("[v0] Products store created")
        }

        // Create Sales store
        if (!db.objectStoreNames.contains("sales")) {
          const salesStore = db.createObjectStore("sales", {
            keyPath: "id",
            autoIncrement: true,
          })
          salesStore.createIndex("date", "date", { unique: false })
          salesStore.createIndex("client", "client", { unique: false })
          salesStore.createIndex("productId", "productId", { unique: false })
          console.log("[v0] Sales store created")
        }
      }
    })
  }

  // Generic add method
  async add(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.add(data)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Generic get all method
  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readonly")
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Generic get by id method
  async getById(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readonly")
      const store = transaction.objectStore(storeName)
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Generic update method
  async update(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.put(data)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Generic delete method
  async delete(storeName, id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readwrite")
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Get sales by date range
  async getSalesByDateRange(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["sales"], "readonly")
      const store = transaction.objectStore("sales")
      const index = store.index("date")
      const range = IDBKeyRange.bound(startDate, endDate)
      const request = index.getAll(range)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
}

window.db = new Database()
