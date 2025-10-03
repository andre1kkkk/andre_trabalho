// Analytics and Dashboard Module

class AnalyticsManager {
  constructor() {
    this.currentPeriod = "day"
    this.charts = {}
    console.log("[v0] AnalyticsManager constructor called")
    this.init()
  }

  init() {
    console.log("[v0] Initializing AnalyticsManager...")
    // Period selector
    document.querySelectorAll(".period-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll(".period-btn").forEach((b) => b.classList.remove("active"))
        e.target.classList.add("active")
        this.currentPeriod = e.target.dataset.period
        console.log("[v0] Period changed to:", this.currentPeriod)
        this.updateDashboard()
      })
    })

    // Reports
    document.getElementById("generateReportBtn").addEventListener("click", () => this.generateReport())
    document.getElementById("exportReportBtn").addEventListener("click", () => this.exportToCSV())

    // Set default report dates
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    document.getElementById("reportStartDate").valueAsDate = firstDay
    document.getElementById("reportEndDate").valueAsDate = today

    this.updateDashboard()
    console.log("[v0] AnalyticsManager initialized")
  }

  async updateDashboard() {
    try {
      console.log("[v0] Updating dashboard...")
      const sales = await window.db.getAll("sales")
      const products = await window.db.getAll("products")

      const filteredSales = this.filterSalesByPeriod(sales, this.currentPeriod)

      // Update stats
      this.updateStats(filteredSales, products)

      // Update charts
      this.updateSalesChart(sales)
      this.updateTopProductsChart(sales, products)
      this.updateProfitChart(sales)

      console.log("[v0] Dashboard updated")
    } catch (error) {
      console.error("[v0] Error updating dashboard:", error)
    }
  }

  filterSalesByPeriod(sales, period) {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    return sales.filter((sale) => {
      const saleDate = new Date(sale.date)

      switch (period) {
        case "day":
          return saleDate >= today
        case "week":
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)
          return saleDate >= weekAgo
        case "month":
          const monthAgo = new Date(today)
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          return saleDate >= monthAgo
        default:
          return true
      }
    })
  }

  updateStats(sales, products) {
    const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0)
    const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0)
    const salesCount = sales.length
    const productsInStock = products.filter((p) => (p.stock || 0) > 0).length

    document.getElementById("periodSales").textContent = `R$ ${totalSales.toFixed(2)}`
    document.getElementById("periodProfit").textContent = `R$ ${totalProfit.toFixed(2)}`
    document.getElementById("totalSalesCount").textContent = salesCount
    document.getElementById("productsInStock").textContent = productsInStock
  }

  updateSalesChart(sales) {
    const ctx = document.getElementById("salesChart")

    // Group sales by date
    const salesByDate = {}
    sales.forEach((sale) => {
      const date = window.dateUtils.formatDateBR(sale.date)
      salesByDate[date] = (salesByDate[date] || 0) + sale.total
    })

    // Get last 7 days
    const labels = []
    const data = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = window.dateUtils.formatDateBR(window.dateUtils.getDateString(date))
      labels.push(dateStr)
      data.push(salesByDate[dateStr] || 0)
    }

    if (this.charts.sales) {
      this.charts.sales.destroy()
    }

    this.charts.sales = new window.Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Vendas (R$)",
            data: data,
            borderColor: "#6366f1",
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            labels: { color: "#f1f5f9" },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: "#cbd5e1" },
            grid: { color: "#475569" },
          },
          x: {
            ticks: { color: "#cbd5e1" },
            grid: { color: "#475569" },
          },
        },
      },
    })
  }

  async updateTopProductsChart(sales, products) {
    // Count sales by product
    const productSales = {}
    sales.forEach((sale) => {
      productSales[sale.productId] = (productSales[sale.productId] || 0) + sale.quantity
    })

    // Get top 5 products
    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const labels = topProducts.map(([id]) => {
      const product = products.find((p) => p.id === Number.parseInt(id))
      return product ? product.name : "Desconhecido"
    })

    const data = topProducts.map(([, qty]) => qty)

    const ctx = document.getElementById("topProductsChart")

    if (this.charts.topProducts) {
      this.charts.topProducts.destroy()
    }

    this.charts.topProducts = new window.Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Quantidade Vendida",
            data: data,
            backgroundColor: ["#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: "#cbd5e1" },
            grid: { color: "#475569" },
          },
          x: {
            ticks: { color: "#cbd5e1" },
            grid: { color: "#475569" },
          },
        },
      },
    })
  }

  updateProfitChart(sales) {
    // Group profit by date
    const profitByDate = {}
    sales.forEach((sale) => {
      const date = window.dateUtils.formatDateBR(sale.date)
      profitByDate[date] = (profitByDate[date] || 0) + sale.profit
    })

    // Get last 30 days
    const labels = []
    const data = []
    let accumulated = 0

    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = window.dateUtils.formatDateBR(window.dateUtils.getDateString(date))
      labels.push(dateStr)
      accumulated += profitByDate[dateStr] || 0
      data.push(accumulated)
    }

    const ctx = document.getElementById("profitChart")

    if (this.charts.profit) {
      this.charts.profit.destroy()
    }

    this.charts.profit = new window.Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Lucro Acumulado (R$)",
            data: data,
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            labels: { color: "#f1f5f9" },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: "#cbd5e1" },
            grid: { color: "#475569" },
          },
          x: {
            ticks: {
              color: "#cbd5e1",
              maxTicksLimit: 10,
            },
            grid: { color: "#475569" },
          },
        },
      },
    })
  }

  async generateReport() {
    const startDate = document.getElementById("reportStartDate").value
    const endDate = document.getElementById("reportEndDate").value

    if (!startDate || !endDate) {
      alert("Por favor, selecione as datas")
      return
    }

    try {
      console.log("[v0] Generating report from", startDate, "to", endDate)
      const sales = await window.db.getSalesByDateRange(startDate, endDate)
      const products = await window.db.getAll("products")

      const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0)
      const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0)

      document.getElementById("reportTotalSales").textContent = `R$ ${totalSales.toFixed(2)}`
      document.getElementById("reportTotalProfit").textContent = `R$ ${totalProfit.toFixed(2)}`
      document.getElementById("reportSalesCount").textContent = sales.length

      // Render report table
      const tbody = document.getElementById("reportTableBody")
      tbody.innerHTML = sales
        .map((sale) => {
          const product = products.find((p) => p.id === sale.productId)
          const productName = product ? product.name : "Desconhecido"
          const date = window.dateUtils.formatDateBR(sale.date)

          return `
                    <tr>
                        <td>${date}</td>
                        <td>${sale.client}</td>
                        <td>${productName}</td>
                        <td>${sale.quantity}</td>
                        <td>R$ ${sale.total.toFixed(2)}</td>
                        <td style="color: var(--success)">R$ ${sale.profit.toFixed(2)}</td>
                    </tr>
                `
        })
        .join("")

      console.log("[v0] Report generated with", sales.length, "sales")
    } catch (error) {
      console.error("[v0] Error generating report:", error)
    }
  }

  async exportToCSV() {
    const startDate = document.getElementById("reportStartDate").value
    const endDate = document.getElementById("reportEndDate").value

    if (!startDate || !endDate) {
      alert("Por favor, gere um relatório primeiro")
      return
    }

    try {
      console.log("[v0] Exporting CSV...")
      const sales = await window.db.getSalesByDateRange(startDate, endDate)
      const products = await window.db.getAll("products")

      // Create CSV content
      let csv = "Data,Cliente,Produto,Quantidade,Valor Total,Lucro\n"

      sales.forEach((sale) => {
        const product = products.find((p) => p.id === sale.productId)
        const productName = product ? product.name : "Desconhecido"
        const date = window.dateUtils.formatDateBR(sale.date)

        csv += `${date},${sale.client},${productName},${sale.quantity},${sale.total.toFixed(2)},${sale.profit.toFixed(2)}\n`
      })

      // Download CSV
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)

      link.setAttribute("href", url)
      link.setAttribute("download", `relatorio_${startDate}_${endDate}.csv`)
      link.style.visibility = "hidden"

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      console.log("[v0] CSV exported successfully")
    } catch (error) {
      console.error("[v0] Error exporting CSV:", error)
      alert("Erro ao exportar relatório")
    }
  }
}

window.AnalyticsManager = AnalyticsManager
console.log("[v0] AnalyticsManager class registered")
