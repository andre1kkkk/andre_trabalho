// Main Application Initialization

class App {
  constructor() {
    console.log("[v0] App constructor called")
    this.managers = {}
  }

  async init() {
    try {
      console.log("[v0] Initializing application...")

      await window.db.init()
      console.log("[v0] Database ready")

      await new Promise((resolve) => setTimeout(resolve, 100))

      console.log("[v0] Creating ProductsManager...")
      this.managers.products = new window.ProductsManager()
      window.productsManager = this.managers.products

      console.log("[v0] Creating SalesManager...")
      this.managers.sales = new window.SalesManager()
      window.salesManager = this.managers.sales

      console.log("[v0] Creating DebtorsManager...")
      this.managers.debtors = new window.DebtorsManager()
      window.debtorsManager = this.managers.debtors

      console.log("[v0] Creating AnalyticsManager...")
      this.managers.analytics = new window.AnalyticsManager()
      window.analyticsManager = this.managers.analytics

      // Setup navigation
      this.setupNavigation()

      console.log("[v0] Application initialized successfully ✓")
    } catch (error) {
      console.error("[v0] Error initializing application:", error)
      alert("Erro ao inicializar aplicação: " + error.message + "\n\nPor favor, recarregue a página.")
    }
  }

  setupNavigation() {
    const navItems = document.querySelectorAll(".nav-item")
    const pages = document.querySelectorAll(".page")

    navItems.forEach((item) => {
      item.addEventListener("click", () => {
        const targetPage = item.dataset.page
        console.log("[v0] Navigating to:", targetPage)

        // Update active nav item
        navItems.forEach((nav) => nav.classList.remove("active"))
        item.classList.add("active")

        // Update active page
        pages.forEach((page) => page.classList.remove("active"))
        document.getElementById(targetPage).classList.add("active")

        if (targetPage === "dashboard" && window.analyticsManager) {
          window.analyticsManager.updateDashboard()
        }
        if (targetPage === "debtors" && window.debtorsManager) {
          window.debtorsManager.loadDebtors()
        }
      })
    })

    console.log("[v0] Navigation setup complete")
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    console.log("[v0] DOM loaded, starting application...")
    const app = new App()
    app.init()
  })
} else {
  // DOM already loaded
  console.log("[v0] DOM already loaded, starting application...")
  const app = new App()
  app.init()
}
