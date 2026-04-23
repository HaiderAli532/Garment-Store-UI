(function () {
  const CART_KEY = "little_styles_cart_v1";
  const SHIPPING = 6;

  function formatUSD(value) {
    return `$${Number(value).toFixed(0)}`;
  }

  function readCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function cartCount(cart) {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }

  function cartSubtotal(cart) {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function updateCartBadge() {
    const count = cartCount(readCart());
    document.querySelectorAll(".js-cart-count").forEach((badge) => {
      badge.textContent = String(count);
      badge.style.display = count > 0 ? "grid" : "none";
    });
  }

  function addItemToCart(item) {
    const cart = readCart();
    const existing = cart.find((entry) => entry.id === item.id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ ...item, qty: 1 });
    }
    saveCart(cart);
    updateCartBadge();
    showToast(`${item.name} added to cart`);
  }

  function bindAddToCartButtons() {
    document.querySelectorAll(".add-to-cart").forEach((button) => {
      button.addEventListener("click", () => {
        const card = button.closest("[data-id][data-name][data-price][data-image]");
        if (!card) return;
        addItemToCart({
          id: card.dataset.id,
          name: card.dataset.name,
          image: card.dataset.image,
          price: Number(card.dataset.price),
        });
      });
    });
  }

  function bindProductGallery() {
    const thumbs = document.querySelectorAll(".thumb");
    const mainImage = document.getElementById("main-product-image");
    if (!thumbs.length || !mainImage) return;

    thumbs.forEach((thumb) => {
      thumb.addEventListener("click", () => {
        mainImage.src = thumb.dataset.image;
        thumbs.forEach((btn) => btn.classList.remove("active"));
        thumb.classList.add("active");
      });
    });
  }

  function bindOptionButtons() {
    const groups = [
      document.querySelectorAll(".size-btn"),
      document.querySelectorAll(".color-dot"),
    ];
    groups.forEach((items) => {
      items.forEach((item) => {
        item.addEventListener("click", () => {
          items.forEach((el) => el.classList.remove("active"));
          item.classList.add("active");
        });
      });
    });
  }

  function renderDrawer() {
    const drawerList = document.getElementById("drawer-list");
    const drawerTotal = document.getElementById("drawer-total");
    const drawerCount = document.getElementById("drawer-item-count");
    if (!drawerList || !drawerTotal || !drawerCount) return;

    const cart = readCart();
    drawerCount.textContent = String(cartCount(cart));
    drawerTotal.textContent = formatUSD(cartSubtotal(cart) + SHIPPING);
    drawerList.innerHTML = cart
      .slice(0, 4)
      .map(
        (item) =>
          `<div class="drawer-item"><span>${item.name} x${item.qty}</span><strong>${formatUSD(item.price * item.qty)}</strong></div>`
      )
      .join("") || '<p class="empty-cart">Your cart is empty.</p>';
  }

  function renderCartPage() {
    const cartItemsEl = document.getElementById("cart-items");
    const subtotalEl = document.getElementById("subtotal");
    const grandTotalEl = document.getElementById("grand-total");
    if (!cartItemsEl || !subtotalEl || !grandTotalEl) return;

    const cart = readCart();
    if (!cart.length) {
      cartItemsEl.innerHTML = '<p class="empty-cart">No items in cart yet. Start shopping from the collection page.</p>';
      subtotalEl.textContent = formatUSD(0);
      grandTotalEl.textContent = formatUSD(0);
      renderDrawer();
      return;
    }

    cartItemsEl.innerHTML = cart
      .map(
        (item) => `
          <article class="cart-item" data-id="${item.id}">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-meta">
              <h4>${item.name}</h4>
              <p class="price">${formatUSD(item.price)}</p>
              <div class="qty-wrap">
                <button class="qty-btn js-decrease">-</button>
                <span class="js-qty">${item.qty}</span>
                <button class="qty-btn js-increase">+</button>
              </div>
              <button class="remove-btn js-remove">Remove</button>
            </div>
            <p class="price js-item-total">${formatUSD(item.price * item.qty)}</p>
          </article>`
      )
      .join("");

    bindCartRowEvents();
    updateCartTotals();
    renderDrawer();
  }

  function updateCartTotals() {
    const subtotalEl = document.getElementById("subtotal");
    const grandTotalEl = document.getElementById("grand-total");
    const drawerTotal = document.getElementById("drawer-total");
    const subtotal = cartSubtotal(readCart());
    if (subtotalEl) subtotalEl.textContent = formatUSD(subtotal);
    if (grandTotalEl) grandTotalEl.textContent = formatUSD(subtotal ? subtotal + SHIPPING : 0);
    if (drawerTotal) drawerTotal.textContent = formatUSD(subtotal ? subtotal + SHIPPING : 0);
    updateCartBadge();
  }

  function bindCartRowEvents() {
    document.querySelectorAll("#cart-items .cart-item").forEach((row) => {
      const id = row.dataset.id;
      const decBtn = row.querySelector(".js-decrease");
      const incBtn = row.querySelector(".js-increase");
      const removeBtn = row.querySelector(".js-remove");

      decBtn?.addEventListener("click", () => updateCartQty(id, -1));
      incBtn?.addEventListener("click", () => updateCartQty(id, 1));
      removeBtn?.addEventListener("click", () => removeCartItem(id));
    });
  }

  function updateCartQty(id, delta) {
    const cart = readCart();
    const item = cart.find((entry) => entry.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      const nextCart = cart.filter((entry) => entry.id !== id);
      saveCart(nextCart);
    } else {
      saveCart(cart);
    }
    renderCartPage();
  }

  function removeCartItem(id) {
    const nextCart = readCart().filter((entry) => entry.id !== id);
    saveCart(nextCart);
    showToast("Item removed from cart");
    renderCartPage();
  }

  function bindDrawer() {
    const openDrawerBtn = document.querySelector(".js-open-drawer");
    const closeDrawerBtn = document.querySelector(".js-close-drawer");
    const drawer = document.getElementById("cart-drawer");
    const overlay = document.getElementById("drawer-overlay");
    if (!drawer || !overlay) return;

    function openDrawer() {
      drawer.classList.add("open");
      overlay.classList.add("open");
      document.body.classList.add("drawer-open");
      renderDrawer();
    }

    function closeDrawer() {
      drawer.classList.remove("open");
      overlay.classList.remove("open");
      document.body.classList.remove("drawer-open");
    }

    openDrawerBtn?.addEventListener("click", openDrawer);
    closeDrawerBtn?.addEventListener("click", closeDrawer);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeDrawer();
    });
  }

  function bindRevealAnimations() {
    const reveals = document.querySelectorAll(".reveal");
    if (!reveals.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    reveals.forEach((item) => observer.observe(item));
  }

  function setActiveNav() {
    const page = document.body.dataset.page;
    const routeMap = {
      home: "index.html",
      products: "products.html",
      detail: "product-detail.html",
      cart: "cart.html",
    };
    const targetHref = routeMap[page];
    if (!targetHref) return;
    document.querySelectorAll(".nav-links a").forEach((link) => {
      const href = link.getAttribute("href");
      if (href === targetHref) link.classList.add("active");
    });
  }

  function bindParallax() {
    const layers = document.querySelectorAll(".js-parallax");
    if (!layers.length) return;

    let ticking = false;
    function updateParallax() {
      const scrollY = window.scrollY;
      layers.forEach((layer) => {
        const speed = Number(layer.dataset.speed || 0.04);
        layer.style.transform = `translate3d(0, ${scrollY * speed}px, 0)`;
      });
      ticking = false;
    }

    window.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    });
  }

  function runDemoLoadingState() {
    document.body.classList.add("demo-loading");
    setTimeout(() => {
      document.body.classList.remove("demo-loading");
    }, 700);
  }

  runDemoLoadingState();
  bindAddToCartButtons();
  bindProductGallery();
  bindOptionButtons();
  bindDrawer();
  bindRevealAnimations();
  bindParallax();
  setActiveNav();
  renderCartPage();
  updateCartBadge();
  renderDrawer();
})();
