// Sales Management Module

class SalesManager {
  constructor() {
    this.currentEditId = null
    this.sales = []
    this.products = []
    console.log("[v0] SalesManager constructor called")
    this.init()
  }

  init() {
    console.log("[v0] Initializing SalesManager...")
    // Event listeners
    document.getElementById("addSaleBtn").addEventListener("click", () => {
      console.log("[v0] Add sale button clicked")
      this.openModal()
    })

    document.getElementById("saleForm").addEventListener("submit", (e) => this.handleSubmit(e))
    document.getElementById("searchSale").addEventListener("input", (e) => this.handleSearch(e))

    document.getElementById("filterPaymentStatus").addEventListener("change", (e) => this.handleFilter(e))

    // Calculate total on quantity change
    document.getElementById("saleQuantity").addEventListener("input", () => {
      this.calculateTotal()
      this.checkStock()
    })
    document.getElementById("saleProduct").addEventListener("change", () => {
      this.calculateTotal()
      this.checkStock()
      this.updateStockDisplay()
    })

    document.getElementById("salePaymentStatus").addEventListener("change", () => this.handlePaymentStatusChange())
    document.getElementById("saleAmountPaid").addEventListener("input", () => this.calculateBalance())

    // Modal close handlers
    document.querySelectorAll("#saleModal .close-btn, #saleModal .cancel-btn").forEach((btn) => {
      btn.addEventListener("click", () => this.closeModal())
    })

    // Set default date to today
    document.getElementById("saleDate").valueAsDate = new Date()

    // Load data
    this.loadSales()
    this.loadProductsDropdown()
    console.log("[v0] SalesManager initialized")
  }

  async loadSales() {
    try {
      console.log("[v0] Loading sales...")
      this.sales = await window.db.getAll("sales")
      this.products = await window.db.getAll("products")
      console.log("[v0] Sales loaded:", this.sales.length)
      this.renderSales(this.sales)
    } catch (error) {
      console.error("[v0] Error loading sales:", error)
    }
  }

  async loadProductsDropdown() {
    try {
      this.products = await window.db.getAll("products")
      const select = document.getElementById("saleProduct")

      select.innerHTML =
        '<option value="">Selecione um produto</option>' +
        this.products
          .map(
            (p) =>
              `<option value="${p.id}" data-price="${p.sellPrice}" data-cost="${p.buyPrice / p.packQty}" data-stock="${p.stock || 0}">
                        ${p.name} - R$ ${p.sellPrice.toFixed(2)} (Estoque: ${p.stock || 0})
                    </option>`,
          )
          .join("")
    } catch (error) {
      console.error("[v0] Error loading products:", error)
    }
  }

  updateStockDisplay() {
    const productSelect = document.getElementById("saleProduct")
    const stockDisplay = document.getElementById("stockAvailable")

    if (productSelect.value) {
      const selectedOption = productSelect.options[productSelect.selectedIndex]
      const stock = Number.parseInt(selectedOption.dataset.stock) || 0
      stockDisplay.textContent = `Estoque disponível: ${stock} unidades`
      stockDisplay.style.color = stock > 0 ? "var(--success)" : "var(--danger)"
    } else {
      stockDisplay.textContent = ""
    }
  }

  checkStock() {
    const productSelect = document.getElementById("saleProduct")
    const quantity = Number.parseInt(document.getElementById("saleQuantity").value) || 0

    if (productSelect.value && quantity > 0) {
      const selectedOption = productSelect.options[productSelect.selectedIndex]
      const stock = Number.parseInt(selectedOption.dataset.stock) || 0

      if (quantity > stock) {
        alert(`⚠️ ATENÇÃO: Quantidade solicitada (${quantity}) é maior que o estoque disponível (${stock})!`)
        document.getElementById("saleQuantity").value = stock
        this.calculateTotal()
      }
    }
  }

  handlePaymentStatusChange() {
    const status = document.getElementById("salePaymentStatus").value
    const amountPaidGroup = document.getElementById("amountPaidGroup")
    const dueDateGroup = document.getElementById("dueDateGroup")
    const balanceGroup = document.getElementById("balanceGroup")

    if (status === "paid") {
      amountPaidGroup.style.display = "none"
      dueDateGroup.style.display = "none"
      balanceGroup.style.display = "none"
    } else if (status === "partial") {
      amountPaidGroup.style.display = "block"
      dueDateGroup.style.display = "block"
      balanceGroup.style.display = "block"
      this.calculateBalance()
    } else if (status === "unpaid") {
      amountPaidGroup.style.display = "none"
      dueDateGroup.style.display = "block"
      balanceGroup.style.display = "block"
      document.getElementById("saleAmountPaid").value = "0"
      this.calculateBalance()
    }
  }

  calculateBalance() {
    const totalText = document.getElementById("saleTotal").value
    const total = Number.parseFloat(totalText.replace("R$ ", "").replace(",", ".")) || 0
    const amountPaid = Number.parseFloat(document.getElementById("saleAmountPaid").value) || 0
    const balance = total - amountPaid

    document.getElementById("saleBalance").value = `R$ ${balance.toFixed(2)}`
  }

  renderSales(sales) {
    const tbody = document.getElementById("salesTableBody")

    if (sales.length === 0) {
      tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 3rem;">
                        <div class="empty-state">
                            <div class="empty-state-icon">💰</div>
                            <h3>Nenhuma venda registrada</h3>
                            <p>Registre sua primeira venda para começar</p>
                        </div>
                    </td>
                </tr>
            `
      return
    }

    tbody.innerHTML = sales
      .map((sale) => {
        const product = this.products.find((p) => p.id === sale.productId)
        const productName = product ? product.name : "Produto não encontrado"
        const date = window.dateUtils.formatDateBR(sale.date)

        const paymentStatus = sale.paymentStatus || "paid"
        const statusText = {
          paid: "✅ Pago",
          partial: "⚠️ Parcial",
          unpaid: "❌ Não Pago",
        }[paymentStatus]

        const statusColor = {
          paid: "var(--success)",
          partial: "var(--warning)",
          unpaid: "var(--danger)",
        }[paymentStatus]

        const balance = sale.balance || 0

        return `
                <tr>
                    <td>${date}</td>
                    <td><strong>${sale.client}</strong></td>
                    <td>${productName}</td>
                    <td>${sale.quantity} un</td>
                    <td>R$ ${sale.total.toFixed(2)}</td>
                    <td><span style="color: ${statusColor}">${statusText}</span></td>
                    <td><span style="color: ${balance > 0 ? "var(--danger)" : "var(--success)"}">R$ ${balance.toFixed(2)}</span></td>
                    <td>
                        <span style="color: var(--success)">
                            R$ ${sale.profit.toFixed(2)}
                        </span>
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="action-btn edit-btn" onclick="window.salesManager.editSale(${sale.id})">
                                ✏️ Editar
                            </button>
                            <button class="action-btn delete-btn" onclick="window.salesManager.deleteSale(${sale.id})">
                                🗑️ Excluir
                            </button>
                        </div>
                    </td>
                </tr>
            `
      })
      .join("")
  }

  openModal(sale = null) {
    console.log("[v0] Opening sale modal", sale)
    const modal = document.getElementById("saleModal")
    const form = document.getElementById("saleForm")

    form.reset()
    this.currentEditId = null
    document.getElementById("saleDate").valueAsDate = new Date()

    document.getElementById("salePaymentStatus").value = "paid"
    this.handlePaymentStatusChange()

    if (sale) {
      // Edit mode
      document.getElementById("saleModalTitle").textContent = "Editar Venda"
      document.getElementById("saleId").value = sale.id
      document.getElementById("saleClient").value = sale.client
      document.getElementById("saleProduct").value = sale.productId
      document.getElementById("saleQuantity").value = sale.quantity
      document.getElementById("saleDate").value = sale.date

      document.getElementById("salePaymentStatus").value = sale.paymentStatus || "paid"
      if (sale.amountPaid) document.getElementById("saleAmountPaid").value = sale.amountPaid
      if (sale.dueDate) document.getElementById("saleDueDate").value = sale.dueDate

      this.currentEditId = sale.id
      this.calculateTotal()
      this.handlePaymentStatusChange()
      this.updateStockDisplay()
    } else {
      // Add mode
      document.getElementById("saleModalTitle").textContent = "Registrar Venda"
    }

    modal.classList.add("active")
  }

  closeModal() {
    document.getElementById("saleModal").classList.remove("active")
  }

  calculateTotal() {
    const productSelect = document.getElementById("saleProduct")
    const quantity = Number.parseInt(document.getElementById("saleQuantity").value) || 0

    if (productSelect.value && quantity > 0) {
      const selectedOption = productSelect.options[productSelect.selectedIndex]
      const price = Number.parseFloat(selectedOption.dataset.price)
      const total = price * quantity

      document.getElementById("saleTotal").value = `R$ ${total.toFixed(2)}`
      this.calculateBalance()
    } else {
      document.getElementById("saleTotal").value = "R$ 0,00"
    }
  }

  async handleSubmit(e) {
    e.preventDefault()
    console.log("[v0] Submitting sale form...")

    const productId = Number.parseInt(document.getElementById("saleProduct").value)
    const quantity = Number.parseInt(document.getElementById("saleQuantity").value)
    const product = this.products.find((p) => p.id === productId)

    if (!product) {
      alert("Produto não encontrado")
      return
    }

    const currentStock = product.stock || 0
    if (!this.currentEditId && quantity > currentStock) {
      alert(`Estoque insuficiente! Disponível: ${currentStock} unidades`)
      return
    }

    const costPerUnit = product.buyPrice / product.packQty
    const total = product.sellPrice * quantity
    const profit = (product.sellPrice - costPerUnit) * quantity

    const paymentStatus = document.getElementById("salePaymentStatus").value
    const amountPaid =
      paymentStatus === "paid" ? total : Number.parseFloat(document.getElementById("saleAmountPaid").value) || 0
    const balance = total - amountPaid
    const dueDate = document.getElementById("saleDueDate").value || null

    const saleData = {
      client: document.getElementById("saleClient").value,
      productId: productId,
      quantity: quantity,
      total: total,
      profit: profit,
      date: document.getElementById("saleDate").value,
      paymentStatus: paymentStatus,
      amountPaid: amountPaid,
      balance: balance,
      dueDate: dueDate,
    }

    try {
      if (this.currentEditId) {
        // Update existing sale
        const oldSale = await window.db.getById("sales", this.currentEditId)
        saleData.id = this.currentEditId
        await window.db.update("sales", saleData)

        // Restore old stock and update with new
        await window.productsManager.updateStock(oldSale.productId, -oldSale.quantity)
        await window.productsManager.updateStock(productId, quantity)
        console.log("[v0] Sale updated")
      } else {
        // Add new sale
        await window.db.add("sales", saleData)
        await window.productsManager.updateStock(productId, quantity)
        console.log("[v0] Sale added")
      }

      this.closeModal()
      await this.loadSales()
      await window.productsManager.loadProducts()

      // Update analytics and debtors
      if (window.analyticsManager) {
        window.analyticsManager.updateDashboard()
      }
      if (window.debtorsManager) {
        window.debtorsManager.loadDebtors()
      }
    } catch (error) {
      console.error("[v0] Error saving sale:", error)
      alert("Erro ao salvar venda")
    }
  }

  async editSale(id) {
    console.log("[v0] Editing sale:", id)
    try {
      const sale = await window.db.getById("sales", id)
      this.openModal(sale)
    } catch (error) {
      console.error("[v0] Error loading sale:", error)
    }
  }

  async deleteSale(id) {
    if (!confirm("Tem certeza que deseja excluir esta venda?")) {
      return
    }

    try {
      const sale = await window.db.getById("sales", id)
      await window.db.delete("sales", id)

      // Restore stock
      await window.productsManager.updateStock(sale.productId, -sale.quantity)

      console.log("[v0] Sale deleted")
      await this.loadSales()
      await window.productsManager.loadProducts()

      if (window.analyticsManager) {
        window.analyticsManager.updateDashboard()
      }
      if (window.debtorsManager) {
        window.debtorsManager.loadDebtors()
      }
    } catch (error) {
      console.error("[v0] Error deleting sale:", error)
      alert("Erro ao excluir venda")
    }
  }

  handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase()
    const filterStatus = document.getElementById("filterPaymentStatus").value
    this.applyFilters(searchTerm, filterStatus)
  }

  handleFilter(e) {
    const searchTerm = document.getElementById("searchSale").value.toLowerCase()
    const filterStatus = e.target.value
    this.applyFilters(searchTerm, filterStatus)
  }

  applyFilters(searchTerm, filterStatus) {
    const filtered = this.sales.filter((sale) => {
      const product = this.products.find((p) => p.id === sale.productId)
      const productName = product ? product.name.toLowerCase() : ""
      const matchesSearch = sale.client.toLowerCase().includes(searchTerm) || productName.includes(searchTerm)
      const matchesStatus = !filterStatus || sale.paymentStatus === filterStatus
      return matchesSearch && matchesStatus
    })
    this.renderSales(filtered)
  }

  viewClientSales(clientName) {
    const clientSales = this.sales.filter((sale) => sale.client === clientName)

    let message = `Vendas de ${clientName}:\n\n`
    clientSales.forEach((sale) => {
      const date = window.dateUtils.formatDateBR(sale.date)
      const status = {
        paid: "Pago",
        partial: "Parcial",
        unpaid: "Não Pago",
      }[sale.paymentStatus || "paid"]

      message += `${date} - R$ ${sale.total.toFixed(2)} - ${status} - Saldo: R$ ${(sale.balance || 0).toFixed(2)}\n`
    })

    alert(message)
  }
}

window.SalesManager = SalesManager
console.log("[v0] SalesManager class registered")
