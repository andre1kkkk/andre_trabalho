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

    document.getElementById("productAcquisitionCost").addEventListener("input", () => this.calculateCosts())
    document.getElementById("productInitialStock").addEventListener("input", () => this.calculateCosts())
    document.getElementById("productSellPrice").addEventListener("input", () => this.calculateCosts())

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

  async renderProducts(products) {
    const tbody = document.getElementById("productsTableBody")

    if (products.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 3rem;">
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

    // Get all sales to calculate revenue per product
    const sales = await window.db.getAll("sales")

    tbody.innerHTML = products
      .map((product) => {
        const investment = product.acquisitionCost || 0
        const initialStock = product.initialStock || 0
        const unitCost = initialStock > 0 ? investment / initialStock : 0

        // Calculate total revenue from sales of this product
        const productSales = sales.filter((s) => s.productId === product.id)
        const revenue = productSales.reduce((sum, sale) => sum + sale.total, 0)

        // Calculate real balance
        const balance = revenue - investment
        const balanceColor = balance >= 0 ? "var(--success)" : "var(--danger)"
        const balanceIcon = balance >= 0 ? "✅" : "❌"

        return `
                <tr>
                    <td><strong>${product.name}</strong></td>
                    <td>R$ ${investment.toFixed(2)}</td>
                    <td>${initialStock} un</td>
                    <td>R$ ${product.sellPrice.toFixed(2)}</td>
                    <td>R$ ${revenue.toFixed(2)}</td>
                    <td style="color: ${balanceColor}">
                        ${balanceIcon} R$ ${balance.toFixed(2)}
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
      document.getElementById("productAcquisitionCost").value = product.acquisitionCost || 0
      document.getElementById("productInitialStock").value = product.initialStock || 0
      document.getElementById("productSellPrice").value = product.sellPrice
      document.getElementById("productStock").value = product.stock || 0
      this.currentEditId = product.id
      this.calculateCosts()
    } else {
      // Add mode
      document.getElementById("productModalTitle").textContent = "Adicionar Produto"
    }

    modal.classList.add("active")
  }

  closeModal() {
    document.getElementById("productModal").classList.remove("active")
  }

  calculateCosts() {
    const acquisitionCost = Number.parseFloat(document.getElementById("productAcquisitionCost").value) || 0
    const initialStock = Number.parseInt(document.getElementById("productInitialStock").value) || 1
    const sellPrice = Number.parseFloat(document.getElementById("productSellPrice").value) || 0

    const unitCost = acquisitionCost / initialStock
    const profitPerUnit = sellPrice - unitCost
    const profitPercent = unitCost > 0 ? ((profitPerUnit / unitCost) * 100).toFixed(1) : 0

    // Calculate break-even point (how many units need to be sold to recover investment)
    const breakEven = profitPerUnit > 0 ? Math.ceil(acquisitionCost / profitPerUnit) : "∞"

    document.getElementById("productUnitCost").value = `R$ ${unitCost.toFixed(2)}`
    document.getElementById("productProfit").value = `R$ ${profitPerUnit.toFixed(2)} (${profitPercent}%)`
    document.getElementById("productBreakEven").value = `${breakEven} unidades`
  }

  async handleSubmit(e) {
    e.preventDefault()
    console.log("[v0] Submitting product form...")

    const productData = {
      name: document.getElementById("productName").value,
      acquisitionCost: Number.parseFloat(document.getElementById("productAcquisitionCost").value),
      initialStock: Number.parseInt(document.getElementById("productInitialStock").value),
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

      // Update dashboard
      if (window.analyticsManager) {
        window.analyticsManager.updateDashboard()
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
