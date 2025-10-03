// Products Management Module

class ProductsManager {
  constructor() {
    this.currentEditId = null
    this.products = []
    console.log("[v0] ProductsManager constructor called")
    this.init()
  }

  init() {
    console.log("[v0] Initializing ProductsManager...")
    // Event listeners
    document.getElementById("addProductBtn").addEventListener("click", () => {
      console.log("[v0] Add product button clicked")
      this.openModal()
    })

    document.getElementById("productForm").addEventListener("submit", (e) => this.handleSubmit(e))
    document.getElementById("searchProduct").addEventListener("input", (e) => this.handleSearch(e))

    // Calculate profit on price changes
    document.getElementById("productBuyPrice").addEventListener("input", () => this.calculateProfit())
    document.getElementById("productSellPrice").addEventListener("input", () => this.calculateProfit())
    document.getElementById("productPackQty").addEventListener("input", () => this.calculateProfit())

    // Modal close handlers
    document.querySelectorAll("#productModal .close-btn, #productModal .cancel-btn").forEach((btn) => {
      btn.addEventListener("click", () => this.closeModal())
    })

    // Load products
    this.loadProducts()
    console.log("[v0] ProductsManager initialized")
  }

  async loadProducts() {
    try {
      console.log("[v0] Loading products...")
      this.products = await window.db.getAll("products")
      console.log("[v0] Products loaded:", this.products.length)
      this.renderProducts(this.products)
    } catch (error) {
      console.error("[v0] Error loading products:", error)
    }
  }

  renderProducts(products) {
    const tbody = document.getElementById("productsTableBody")

    if (products.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem;">
                        <div class="empty-state">
                            <div class="empty-state-icon">📦</div>
                            <h3>Nenhum produto cadastrado</h3>
                            <p>Adicione seu primeiro produto para começar</p>
                        </div>
                    </td>
                </tr>
            `
      return
    }

    tbody.innerHTML = products
      .map((product) => {
        const profit = this.calculateProductProfit(product)
        const profitPercent = ((profit / product.buyPrice) * 100).toFixed(1)

        return `
                <tr>
                    <td><strong>${product.name}</strong></td>
                    <td>R$ ${product.buyPrice.toFixed(2)}</td>
                    <td>${product.packQty} un</td>
                    <td>R$ ${product.sellPrice.toFixed(2)}</td>
                    <td>
                        <span style="color: var(--success)">
                            R$ ${profit.toFixed(2)} (${profitPercent}%)
                        </span>
                    </td>
                    <td>${product.stock || 0} un</td>
                    <td>
                        <div class="table-actions">
                            <button class="action-btn edit-btn" onclick="window.productsManager.editProduct(${product.id})">
                                ✏️ Editar
                            </button>
                            <button class="action-btn delete-btn" onclick="window.productsManager.deleteProduct(${product.id})">
                                🗑️ Excluir
                            </button>
                        </div>
                    </td>
                </tr>
            `
      })
      .join("")
  }

  calculateProductProfit(product) {
    const costPerUnit = product.buyPrice / product.packQty
    return product.sellPrice - costPerUnit
  }

  openModal(product = null) {
    console.log("[v0] Opening product modal", product)
    const modal = document.getElementById("productModal")
    const form = document.getElementById("productForm")

    form.reset()
    this.currentEditId = null

    if (product) {
      // Edit mode
      document.getElementById("productModalTitle").textContent = "Editar Produto"
      document.getElementById("productId").value = product.id
      document.getElementById("productName").value = product.name
      document.getElementById("productBuyPrice").value = product.buyPrice
      document.getElementById("productPackQty").value = product.packQty
      document.getElementById("productSellPrice").value = product.sellPrice
      document.getElementById("productStock").value = product.stock || 0
      this.currentEditId = product.id
      this.calculateProfit()
    } else {
      // Add mode
      document.getElementById("productModalTitle").textContent = "Adicionar Produto"
    }

    modal.classList.add("active")
  }

  closeModal() {
    document.getElementById("productModal").classList.remove("active")
  }

  calculateProfit() {
    const buyPrice = Number.parseFloat(document.getElementById("productBuyPrice").value) || 0
    const packQty = Number.parseInt(document.getElementById("productPackQty").value) || 1
    const sellPrice = Number.parseFloat(document.getElementById("productSellPrice").value) || 0

    const costPerUnit = buyPrice / packQty
    const profit = sellPrice - costPerUnit
    const profitPercent = buyPrice > 0 ? ((profit / costPerUnit) * 100).toFixed(1) : 0

    document.getElementById("productProfit").value = `R$ ${profit.toFixed(2)} (${profitPercent}%)`
  }

  async handleSubmit(e) {
    e.preventDefault()
    console.log("[v0] Submitting product form...")

    const productData = {
      name: document.getElementById("productName").value,
      buyPrice: Number.parseFloat(document.getElementById("productBuyPrice").value),
      packQty: Number.parseInt(document.getElementById("productPackQty").value),
      sellPrice: Number.parseFloat(document.getElementById("productSellPrice").value),
      stock: Number.parseInt(document.getElementById("productStock").value) || 0,
    }

    try {
      if (this.currentEditId) {
        // Update existing product
        productData.id = this.currentEditId
        await window.db.update("products", productData)
        console.log("[v0] Product updated")
      } else {
        // Add new product
        await window.db.add("products", productData)
        console.log("[v0] Product added")
      }

      this.closeModal()
      await this.loadProducts()

      // Update sales product dropdown
      if (window.salesManager) {
        window.salesManager.loadProductsDropdown()
      }
    } catch (error) {
      console.error("[v0] Error saving product:", error)
      alert("Erro ao salvar produto")
    }
  }

  async editProduct(id) {
    console.log("[v0] Editing product:", id)
    try {
      const product = await window.db.getById("products", id)
      this.openModal(product)
    } catch (error) {
      console.error("[v0] Error loading product:", error)
    }
  }

  async deleteProduct(id) {
    if (!confirm("Tem certeza que deseja excluir este produto?")) {
      return
    }

    try {
      await window.db.delete("products", id)
      console.log("[v0] Product deleted")
      await this.loadProducts()
    } catch (error) {
      console.error("[v0] Error deleting product:", error)
      alert("Erro ao excluir produto")
    }
  }

  handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase()
    const filtered = this.products.filter((product) => product.name.toLowerCase().includes(searchTerm))
    this.renderProducts(filtered)
  }

  async updateStock(productId, quantity) {
    try {
      const product = await window.db.getById("products", productId)
      product.stock = (product.stock || 0) - quantity
      await window.db.update("products", product)
    } catch (error) {
      console.error("[v0] Error updating stock:", error)
    }
  }
}

window.ProductsManager = ProductsManager
console.log("[v0] ProductsManager class registered")
