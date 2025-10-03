// Debtors Management Module

class DebtorsManager {
  constructor() {
    this.sales = []
    this.debtors = []
    console.log("[v0] DebtorsManager constructor called")
    this.init()
  }

  init() {
    console.log("[v0] Initializing DebtorsManager...")
    this.loadDebtors()
    console.log("[v0] DebtorsManager initialized")
  }

  async loadDebtors() {
    try {
      console.log("[v0] Loading debtors...")
      this.sales = await window.db.getAll("sales")

      // Group sales by client and calculate debts
      const clientDebts = {}

      this.sales.forEach((sale) => {
        const paymentStatus = sale.paymentStatus || "paid"
        if (paymentStatus !== "paid") {
          if (!clientDebts[sale.client]) {
            clientDebts[sale.client] = {
              client: sale.client,
              totalSales: 0,
              totalPaid: 0,
              balance: 0,
              dueDate: sale.dueDate || null,
              sales: [],
            }
          }

          clientDebts[sale.client].totalSales += sale.total
          clientDebts[sale.client].totalPaid += sale.amountPaid || 0
          clientDebts[sale.client].balance += sale.balance || 0
          clientDebts[sale.client].sales.push(sale)

          // Use the earliest due date
          if (sale.dueDate) {
            if (!clientDebts[sale.client].dueDate || sale.dueDate < clientDebts[sale.client].dueDate) {
              clientDebts[sale.client].dueDate = sale.dueDate
            }
          }
        }
      })

      this.debtors = Object.values(clientDebts)
      console.log("[v0] Debtors loaded:", this.debtors.length)

      this.renderDebtors()
      this.updateStats()
    } catch (error) {
      console.error("[v0] Error loading debtors:", error)
    }
  }

  updateStats() {
    const totalDebt = this.debtors.reduce((sum, debtor) => sum + debtor.balance, 0)
    const debtorsCount = this.debtors.length

    document.getElementById("totalDebt").textContent = `R$ ${totalDebt.toFixed(2)}`
    document.getElementById("debtorsCount").textContent = debtorsCount
  }

  renderDebtors() {
    const tbody = document.getElementById("debtorsTableBody")

    if (this.debtors.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 3rem;">
            <div class="empty-state">
              <div class="empty-state-icon">✅</div>
              <h3>Nenhum devedor</h3>
              <p>Todos os pagamentos estão em dia!</p>
            </div>
          </td>
        </tr>
      `
      return
    }

    tbody.innerHTML = this.debtors
      .map((debtor) => {
        const dueDate = window.dateUtils.formatDateBR(debtor.dueDate)
        const isOverdue = window.dateUtils.isOverdue(debtor.dueDate)

        return `
          <tr style="${isOverdue ? "background-color: rgba(239, 68, 68, 0.1);" : ""}">
            <td><strong>${debtor.client}</strong> ${isOverdue ? "⚠️" : ""}</td>
            <td>R$ ${debtor.totalSales.toFixed(2)}</td>
            <td>R$ ${debtor.totalPaid.toFixed(2)}</td>
            <td><span style="color: var(--danger); font-weight: bold;">R$ ${debtor.balance.toFixed(2)}</span></td>
            <td>${dueDate}</td>
            <td>
              <button class="action-btn" onclick="window.debtorsManager.viewClientSales('${debtor.client}')" style="background: var(--primary); color: white;">
                📋 Ver Vendas
              </button>
            </td>
          </tr>
        `
      })
      .join("")
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

window.DebtorsManager = DebtorsManager
console.log("[v0] DebtorsManager class registered")
