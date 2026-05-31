"use client";

import React, { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  ShoppingCart, 
  User, 
  Settings, 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  Heart, 
  Filter, 
  ArrowLeft, 
  Check, 
  CheckCircle2, 
  Package, 
  Truck, 
  CreditCard, 
  AlertTriangle, 
  TrendingUp, 
  LogOut, 
  MapPin, 
  ChevronRight, 
  Sparkles,
  DollarSign,
  Layers,
  ChevronDown,
  RefreshCw,
  Phone
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string; // JSON encoded or text
  price: number;
  inventory: number;
  images: string[];
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  items: any; // JSON array of items
  total: number;
  status: string;
  paymentId: string;
  createdAt: string;
}

interface EcommerceStoreProps {
  projectId: string;
  initialProducts: Product[];
  initialSettings: any;
  initialPathSlug?: string;
  projectSubdomain?: string;
}

export default function EcommerceStore({
  projectId,
  initialProducts,
  initialSettings,
  initialPathSlug = "index",
  projectSubdomain = ""
}: EcommerceStoreProps) {
  // Navigation Routing States: "home" | "shop" | "product" | "cart" | "checkout" | "account" | "admin"
  const [view, setView] = useState<string>("home");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Core Data States (Synced from API)
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [settings, setSettings] = useState<any>(initialSettings);
  const [orders, setOrders] = useState<Order[]>([]);

  // Client Interactivity States
  const [cart, setCart] = useState<Array<{ product: Product; quantity: number; selectedVariant?: string }>>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priceRange, setPriceRange] = useState<number>(15000);
  const [sortBy, setSortBy] = useState("featured");

  // Authentication States
  const [customer, setCustomer] = useState<any>(null);
  const [authForm, setAuthForm] = useState({ email: "", password: "", name: "", isRegister: false });
  const [authError, setAuthError] = useState("");
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");

  // Checkout Fields State
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    paymentMethod: "cod"
  });
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponFeedback, setCouponFeedback] = useState("");
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  // Admin Interface States
  const [adminTab, setAdminTab] = useState("overview");
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: "",
    descriptionText: "",
    price: "",
    inventory: "",
    category: "General",
    variants: "",
    specifications: "",
    imageUrl: ""
  });
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState({ orderId: "", status: "", trackingNumber: "" });

  // Load state from local storage on mount
  useEffect(() => {
    // Determine view from URL path slug
    if (initialPathSlug === "shop") setView("shop");
    else if (initialPathSlug.startsWith("product/")) {
      setView("product");
      setSelectedProductId(initialPathSlug.replace("product/", ""));
    }
    else if (initialPathSlug === "cart") setView("cart");
    else if (initialPathSlug === "checkout") setView("checkout");
    else if (initialPathSlug === "account") setView("account");
    else if (initialPathSlug === "admin") setView("admin");
    else setView("home");

    // Load Cart & Wishlist
    const localCart = localStorage.getItem(`cart_${projectId}`);
    if (localCart) setCart(JSON.parse(localCart));

    const localCustomer = localStorage.getItem(`customer_${projectId}`);
    if (localCustomer) setCustomer(JSON.parse(localCustomer));

    const localAdmin = localStorage.getItem(`admin_auth_${projectId}`);
    if (localAdmin) setAdminAuth(true);

    fetchProducts();
    fetchSettings();
  }, [initialPathSlug, projectId]);

  // Sync Cart to LocalStorage
  const syncCart = (newCart: typeof cart) => {
    setCart(newCart);
    localStorage.setItem(`cart_${projectId}`, JSON.stringify(newCart));
  };

  // API Call Helpers
  const fetchProducts = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/ecommerce/products`);
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch (e) { console.error("Error fetching products:", e); }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/ecommerce/settings`);
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
    } catch (e) { console.error("Error fetching settings:", e); }
  };

  const fetchAdminOrders = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/ecommerce/orders`);
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch (e) { console.error("Error fetching orders:", e); }
  };

  const fetchCustomerOrders = async (email: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/ecommerce/orders?customerEmail=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch (e) { console.error("Error fetching orders:", e); }
  };

  // Parsing Helper for Product Descriptions containing JSON metadata
  const parseProductDescription = (desc: string) => {
    try {
      if (desc.trim().startsWith("{") && desc.trim().endsWith("}")) {
        return JSON.parse(desc);
      }
    } catch (e) {}
    
    return {
      bodyText: desc,
      category: "General",
      variants: [],
      specifications: {},
      sku: `SKU-GEN-${Math.floor(100 + Math.random() * 900)}`
    };
  };

  // Unsplash Image Helper using exact query fallback
  const getProductImage = (prod: Product) => {
    if (prod.images && prod.images.length > 0 && prod.images[0].startsWith("http")) {
      return prod.images[0];
    }
    
    const parsed = parseProductDescription(prod.description);
    const query = encodeURIComponent(`${prod.name} ${parsed.category}`);
    return `https://images.unsplash.com/featured/?${query || "gadget"}`;
  };

  // Add Product to Cart
  const handleAddToCart = (product: Product, quantity = 1, selectedVariant?: string) => {
    const existingIdx = cart.findIndex(item => item.product.id === product.id && item.selectedVariant === selectedVariant);
    const newCart = [...cart];
    
    if (existingIdx > -1) {
      newCart[existingIdx].quantity += quantity;
    } else {
      newCart.push({ product, quantity, selectedVariant });
    }
    
    syncCart(newCart);
  };

  // Remove / Update Cart Items
  const handleUpdateCartQuantity = (idx: number, newQty: number) => {
    if (newQty <= 0) {
      const newCart = cart.filter((_, i) => i !== idx);
      syncCart(newCart);
    } else {
      const newCart = [...cart];
      newCart[idx].quantity = newQty;
      syncCart(newCart);
    }
  };

  // Apply Coupon Rules
  const handleApplyCoupon = () => {
    setCouponFeedback("");
    setAppliedCoupon(null);
    const code = couponCode.trim().toUpperCase();
    const activeCoupons = settings.coupons || [];

    const found = activeCoupons.find((c: any) => c.code.toUpperCase() === code && c.active);
    if (!found) {
      setCouponFeedback("Invalid or inactive coupon code.");
      return;
    }

    const subtotal = getCartSubtotal();
    if (found.minOrder && subtotal < found.minOrder) {
      setCouponFeedback(`Minimum purchase of ₹${found.minOrder} required for this discount.`);
      return;
    }

    setAppliedCoupon(found);
    setCouponFeedback(`Coupon Applied! Saved ₹${calculateDiscount(found).toFixed(2)}.`);
  };

  const getCartSubtotal = () => cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  const calculateDiscount = (coupon: any) => {
    if (!coupon) return 0;
    const subtotal = getCartSubtotal();
    if (coupon.type === "PERCENTAGE") {
      return subtotal * (coupon.value / 100);
    }
    if (coupon.type === "FIXED") {
      return Math.min(coupon.value, subtotal);
    }
    return 0; // FREE_SHIPPING is handled inside shipping
  };

  const getShippingCost = () => {
    const subtotal = getCartSubtotal();
    const zone = settings.shipping?.zones?.[0] || { charge: 60, freeShippingMin: 999 };
    
    // Check for free shipping coupon or rule threshold
    if (appliedCoupon && appliedCoupon.type === "FREE_SHIPPING") return 0;
    if (subtotal >= zone.freeShippingMin) return 0;
    
    return zone.charge;
  };

  const getCartTotal = () => {
    const subtotal = getCartSubtotal();
    const discount = calculateDiscount(appliedCoupon);
    const shipping = getShippingCost();
    return Math.max(0, subtotal - discount + shipping);
  };

  // Submit Order Checkout
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    try {
      const email = checkoutForm.email || customer?.email;
      const name = checkoutForm.name || customer?.name;

      if (!email || !name || !checkoutForm.address) {
        alert("Please complete name, email, and shipping address.");
        return;
      }

      const orderItems = cart.map(item => {
        const parsed = parseProductDescription(item.product.description);
        return {
          productId: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          selectedVariant: item.selectedVariant || null,
          category: parsed.category
        };
      });

      const res = await fetch(`/api/projects/${projectId}/ecommerce/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: email.toLowerCase().trim(),
          customerName: name,
          items: orderItems,
          total: getCartTotal(),
          paymentMethod: checkoutForm.paymentMethod
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order creation failed");

      setOrderSuccess(data.order);
      syncCart([]); // Clear cart
      
      // Sync customer orders list in session
      if (customer && customer.email.toLowerCase() === email.toLowerCase()) {
        fetchCustomerOrders(customer.email);
      }
    } catch (err: any) {
      alert(err.message || "An error occurred placing the order.");
    }
  };

  // Customer Authentication Handles
  const handleCustomerAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch(`/api/projects/${projectId}/ecommerce/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: authForm.isRegister ? "signup" : "signin",
          email: authForm.email,
          password: authForm.password,
          name: authForm.name
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");

      setCustomer(data.customer);
      localStorage.setItem(`customer_${projectId}`, JSON.stringify(data.customer));
      fetchCustomerOrders(data.customer.email);
      setAuthForm({ email: "", password: "", name: "", isRegister: false });
    } catch (err: any) {
      setAuthError(err.message || "Failed to log in.");
    }
  };

  const handleCustomerLogout = () => {
    setCustomer(null);
    localStorage.removeItem(`customer_${projectId}`);
    setOrders([]);
  };

  // Admin Authentication
  const handleAdminAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");
    
    // Simple verify against admin dashboard credentials matching project key or default pwd
    if (adminPassword === "admin123" || adminPassword === projectId.slice(0, 8)) {
      setAdminAuth(true);
      localStorage.setItem(`admin_auth_${projectId}`, "true");
      fetchAdminOrders();
      setAdminPassword("");
    } else {
      setAdminError("Invalid administrative password credentials.");
    }
  };

  const handleAdminLogout = () => {
    setAdminAuth(false);
    localStorage.removeItem(`admin_auth_${projectId}`);
    setOrders([]);
  };

  // Admin: Update order state
  const handleUpdateOrderStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    const { orderId, status, trackingNumber } = updatingOrderStatus;
    if (!orderId) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/ecommerce/orders`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status,
          trackingNumber: trackingNumber || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update order");

      fetchAdminOrders();
      setUpdatingOrderStatus({ orderId: "", status: "", trackingNumber: "" });
    } catch (err: any) {
      alert(err.message || "Error updating order.");
    }
  };

  // Admin: Add new product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, descriptionText, price, inventory, category, variants, specifications, imageUrl } = newProductForm;
    if (!name || !price) return;

    try {
      const parsedVariants = variants.split(",").map(v => v.trim()).filter(Boolean);
      const parsedSpecs: Record<string, string> = {};
      specifications.split(",").forEach(s => {
        const parts = s.split(":");
        if (parts.length === 2) {
          parsedSpecs[parts[0].trim()] = parts[1].trim();
        }
      });

      const description = {
        bodyText: descriptionText,
        category,
        variants: parsedVariants,
        specifications: parsedSpecs,
        sku: `SKU-${name.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`
      };

      const res = await fetch(`/api/projects/${projectId}/ecommerce/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          price: Number(price),
          inventory: Number(inventory || 0),
          images: imageUrl ? [imageUrl] : []
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add product");

      fetchProducts();
      setShowAddProductModal(false);
      setNewProductForm({
        name: "",
        descriptionText: "",
        price: "",
        inventory: "",
        category: "General",
        variants: "",
        specifications: "",
        imageUrl: ""
      });
    } catch (err: any) {
      alert(err.message || "Error adding product.");
    }
  };

  // Admin: Delete product
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/ecommerce/products?productId=${productId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete product");

      fetchProducts();
    } catch (err: any) {
      alert(err.message || "Error deleting product.");
    }
  };

  // Catalog Filters & Processing
  const getUniqueCategories = () => {
    const cats = new Set<string>();
    products.forEach(p => {
      const parsed = parseProductDescription(p.description);
      if (parsed.category) cats.add(parsed.category);
    });
    return ["All", ...Array.from(cats)];
  };

  const getFilteredProducts = () => {
    return products
      .filter(p => {
        const parsed = parseProductDescription(p.description);
        const matchesCategory = categoryFilter === "All" || parsed.category === categoryFilter;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              parsed.bodyText.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPrice = p.price <= priceRange;
        return matchesCategory && matchesSearch && matchesPrice;
      })
      .sort((a, b) => {
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return 0; // Default featured order
      });
  };

  const activeProduct = products.find(p => p.id === selectedProductId);
  const parsedActiveProduct = activeProduct ? parseProductDescription(activeProduct.description) : null;

  return (
    <div style={{ color: "#f8fafc", fontFamily: "'Outfit', 'Inter', sans-serif", minHeight: "100vh", background: "#0a0e17", display: "flex", flexDirection: "column" }}>
      
      {/* 1. STORE HEADER NAVIGATION */}
      <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", position: "sticky", top: 0, zIndex: 50, background: "rgba(10, 14, 23, 0.95)", backdropFilter: "blur(12px)", padding: "1rem 2rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
            <span 
              onClick={() => { setView("home"); setSelectedProductId(null); }}
              style={{ cursor: "pointer", fontSize: "1.3rem", fontWeight: 800, background: "linear-gradient(to right, #6366f1, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <ShoppingBag size={20} style={{ stroke: "#818cf8" }} />
              {settings.whatsapp?.phoneNumber ? projectSubdomain.toUpperCase() || "WEBBING SHOP" : "STORE PREVIEW"}
            </span>
            <div style={{ display: "flex", gap: "1.2rem", fontSize: "0.9rem" }}>
              <span onClick={() => { setView("home"); setSelectedProductId(null); }} style={{ cursor: "pointer", color: view === "home" ? "#818cf8" : "#94a3b8", fontWeight: view === "home" ? 700 : 500 }}>Home</span>
              <span onClick={() => { setView("shop"); setSelectedProductId(null); }} style={{ cursor: "pointer", color: view === "shop" ? "#818cf8" : "#94a3b8", fontWeight: view === "shop" ? 700 : 500 }}>Shop</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            {/* Search inputs */}
            <div style={{ position: "relative", display: "flex", alignItems: "center" }} className="mobile-hidden">
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setView("shop"); }}
                style={{ padding: "0.4rem 0.8rem 0.4rem 2rem", borderRadius: "1.5rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: "0.8rem", color: "#fff", width: "200px" }}
              />
              <Search size={14} style={{ position: "absolute", left: "0.75rem", color: "#64748b" }} />
            </div>

            {/* Wishlist Icon */}
            <span onClick={() => setView("account")} style={{ position: "relative", cursor: "pointer", color: "#94a3b8" }}>
              <Heart size={18} />
              {customer?.wishlist?.length > 0 && (
                <span style={{ position: "absolute", top: "-6px", right: "-8px", padding: "0.1rem 0.3rem", borderRadius: "50%", background: "#a855f7", color: "#fff", fontSize: "0.6rem", fontWeight: 800 }}>
                  {customer.wishlist.length}
                </span>
              )}
            </span>

            {/* Cart Icon */}
            <span onClick={() => setView("cart")} style={{ position: "relative", cursor: "pointer", color: "#94a3b8" }}>
              <ShoppingCart size={18} />
              {cart.length > 0 && (
                <span style={{ position: "absolute", top: "-6px", right: "-8px", padding: "0.1rem 0.3rem", borderRadius: "50%", background: "#6366f1", color: "#fff", fontSize: "0.6rem", fontWeight: 800 }}>
                  {cart.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              )}
            </span>

            {/* Account Icon */}
            <span onClick={() => setView("account")} style={{ cursor: "pointer", color: customer ? "#818cf8" : "#94a3b8", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.85rem" }}>
              <User size={18} />
              {customer && <span className="mobile-hidden">{customer.name}</span>}
            </span>

            {/* Admin Console Icon */}
            <span onClick={() => { setView("admin"); if (adminAuth) fetchAdminOrders(); }} style={{ cursor: "pointer", color: adminAuth ? "#a855f7" : "#64748b", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.85rem" }}>
              <Settings size={18} />
              <span className="mobile-hidden">Admin</span>
            </span>

          </div>

        </div>
      </nav>

      <main style={{ flex: 1, maxWidth: "1200px", margin: "0 auto", padding: "2rem", width: "100%" }}>
        
        {/* ==================== VIEW 1: HOME PAGE ==================== */}
        {view === "home" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem" }}>
            
            {/* HERO BANNER SECTION */}
            <section style={{ padding: "4rem 3rem", borderRadius: "1rem", background: "linear-gradient(to right, rgba(99,102,241,0.15), rgba(168,85,247,0.05))", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexWrap: "wrap", gap: "2rem", alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: "280px", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <span className="eyebrow" style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center", color: "#a5b4fc", fontSize: "0.8rem", fontWeight: 700 }}><Sparkles size={12} /> Live Niche Store Active</span>
                <h1 style={{ fontSize: "2.5rem", fontWeight: 900, lineHeight: 1.2, margin: 0 }}>
                  Elevate Your Style with Premium Dynamic Gear
                </h1>
                <p style={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: 1.6 }}>
                  Sourced and structured specifically for your niche. Buy, customize, and configure layouts in real-time.
                </p>
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                  <button onClick={() => setView("shop")} className="primary-action" style={{ padding: "0.6rem 1.2rem", fontSize: "0.9rem" }}>Shop Collection</button>
                  <button onClick={() => setView("account")} className="secondary-action" style={{ padding: "0.6rem 1.2rem", fontSize: "0.9rem" }}>Customer Portal</button>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: "280px", display: "flex", justifyContent: "center" }}>
                <img 
                  src={products.length > 0 ? getProductImage(products[0]) : "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80"}
                  alt="Featured product"
                  style={{ width: "100%", maxWidth: "380px", height: "260px", objectFit: "cover", borderRadius: "0.75rem", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}
                />
              </div>
            </section>

            {/* CATEGORIES SECTION */}
            <section style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Explore Categories</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
                {getUniqueCategories().map(cat => (
                  <div 
                    key={cat}
                    onClick={() => { setCategoryFilter(cat); setView("shop"); }}
                    className="glass-panel"
                    style={{ padding: "1.5rem", borderRadius: "0.75rem", cursor: "pointer", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", textAlign: "center", transition: "transform 0.2s" }}
                  >
                    <strong style={{ color: "#fff", display: "block" }}>{cat}</strong>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block", marginTop: "0.5rem" }}>View Products</span>
                  </div>
                ))}
              </div>
            </section>

            {/* FEATURED PRODUCTS SECTION */}
            <section style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Featured Products</h2>
                <span onClick={() => setView("shop")} style={{ cursor: "pointer", color: "#818cf8", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>View All <ChevronRight size={14} /></span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1.5rem" }}>
                {products.slice(0, 4).map(prod => {
                  const parsed = parseProductDescription(prod.description);
                  return (
                    <div 
                      key={prod.id} 
                      className="glass-panel" 
                      style={{ padding: "1rem", borderRadius: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem", border: "1px solid rgba(255,255,255,0.06)", position: "relative" }}
                    >
                      <img 
                        src={getProductImage(prod)} 
                        alt={prod.name}
                        style={{ width: "100%", height: "200px", objectFit: "cover", borderRadius: "0.5rem" }}
                      />
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <span style={{ fontSize: "0.75rem", color: "#818cf8", fontWeight: 700 }}>{parsed.category}</span>
                        <strong 
                          onClick={() => { setSelectedProductId(prod.id); setView("product"); }}
                          style={{ cursor: "pointer", color: "#fff", display: "block", fontSize: "0.95rem" }}
                        >
                          {prod.name}
                        </strong>
                        <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{parsed.bodyText.slice(0, 50)}...</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "0.5rem" }}>
                        <span style={{ fontSize: "1.1rem", fontWeight: 800 }}>₹{Number(prod.price).toLocaleString()}</span>
                        <button 
                          onClick={() => handleAddToCart(prod, 1)}
                          style={{ background: "#6366f1", border: 0, color: "#fff", padding: "0.4rem 0.8rem", borderRadius: "0.4rem", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600 }}
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

          </div>
        )}

        {/* ==================== VIEW 2: SHOP PAGE ==================== */}
        {view === "shop" && (
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            
            {/* SIDEBAR FILTERS */}
            <aside style={{ width: "240px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0.75rem" }}>
                <Filter size={16} />
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Filters</h3>
              </div>

              {/* Categories Filter */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 700 }}>Category</span>
                {getUniqueCategories().map(cat => (
                  <div 
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    style={{ cursor: "pointer", padding: "0.3rem 0.6rem", borderRadius: "0.25rem", background: categoryFilter === cat ? "rgba(99,102,241,0.15)" : "transparent", color: categoryFilter === cat ? "#818cf8" : "#94a3b8", fontSize: "0.85rem" }}
                  >
                    {cat}
                  </div>
                ))}
              </div>

              {/* Price Filter */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 700 }}>Max Price: ₹{priceRange.toLocaleString()}</span>
                <input 
                  type="range" 
                  min="0" 
                  max="50000" 
                  step="500" 
                  value={priceRange} 
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>

              {/* Sort selector */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 700 }}>Sort By</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.4rem", padding: "0.4rem", color: "#fff", fontSize: "0.85rem" }}
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Alphabetical</option>
                </select>
              </div>
            </aside>

            {/* PRODUCTS CATALOG LIST */}
            <div style={{ flex: 1, minWidth: "280px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748b", fontSize: "0.85rem" }}>
                <span>Showing {getFilteredProducts().length} products</span>
                <span style={{ cursor: "pointer", color: "#818cf8" }} onClick={() => { setCategoryFilter("All"); setSearchQuery(""); setPriceRange(50000); }}>Reset all filters</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.5rem" }}>
                {getFilteredProducts().map(prod => {
                  const parsed = parseProductDescription(prod.description);
                  return (
                    <div 
                      key={prod.id} 
                      className="glass-panel" 
                      style={{ padding: "1rem", borderRadius: "0.75rem", display: "flex", flexDirection: "column", gap: "0.75rem", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <img 
                        src={getProductImage(prod)} 
                        alt={prod.name}
                        style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "0.5rem" }}
                      />
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <span style={{ fontSize: "0.75rem", color: "#818cf8", fontWeight: 700 }}>{parsed.category}</span>
                        <strong 
                          onClick={() => { setSelectedProductId(prod.id); setView("product"); }}
                          style={{ cursor: "pointer", color: "#fff", display: "block", fontSize: "0.9rem" }}
                        >
                          {prod.name}
                        </strong>
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{parsed.bodyText.slice(0, 50)}...</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "0.5rem" }}>
                        <span style={{ fontSize: "1.05rem", fontWeight: 800 }}>₹{Number(prod.price).toLocaleString()}</span>
                        <button 
                          onClick={() => handleAddToCart(prod, 1)}
                          style={{ background: "#6366f1", border: 0, color: "#fff", padding: "0.4rem 0.7rem", borderRadius: "0.4rem", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600 }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ==================== VIEW 3: PRODUCT DETAIL ==================== */}
        {view === "product" && activeProduct && parsedActiveProduct && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <span 
              onClick={() => setView("shop")} 
              style={{ cursor: "pointer", color: "#818cf8", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", width: "fit-content" }}
            >
              <ArrowLeft size={14} /> Back to Shop
            </span>

            <div style={{ display: "flex", gap: "3rem", flexWrap: "wrap" }}>
              {/* Product Images Gallery */}
              <div style={{ flex: 1, minWidth: "280px" }}>
                <img 
                  src={getProductImage(activeProduct)} 
                  alt={activeProduct.name}
                  style={{ width: "100%", maxHeight: "400px", objectFit: "cover", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.06)" }}
                />
              </div>

              {/* Product Details Content */}
              <div style={{ flex: 1, minWidth: "280px", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <span style={{ fontSize: "0.8rem", color: "#818cf8", fontWeight: 700 }}>{parsedActiveProduct.category}</span>
                  <h1 style={{ fontSize: "2rem", fontWeight: 900, margin: "0.25rem 0 0.5rem 0" }}>{activeProduct.name}</h1>
                  <span style={{ fontSize: "1.75rem", fontWeight: 800 }}>₹{Number(activeProduct.price).toLocaleString()}</span>
                </div>

                <div style={{ paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
                    {parsedActiveProduct.bodyText}
                  </p>
                </div>

                {/* SKU and Inventory Details */}
                <div style={{ display: "flex", gap: "2rem", fontSize: "0.8rem", color: "#64748b" }}>
                  <span>SKU: <strong>{parsedActiveProduct.sku}</strong></span>
                  <span>Availability: <strong style={{ color: activeProduct.inventory > 0 ? "#34d399" : "#f87171" }}>{activeProduct.inventory > 0 ? `${activeProduct.inventory} In Stock` : "Out of Stock"}</strong></span>
                </div>

                {/* Variants Selection */}
                {parsedActiveProduct.variants && parsedActiveProduct.variants.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.85rem", color: "#94a3b8", fontWeight: 600 }}>Choose Variant</span>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {parsedActiveProduct.variants.map((v: string) => (
                        <div 
                          key={v}
                          style={{ padding: "0.4rem 0.8rem", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "0.4rem", fontSize: "0.8rem", cursor: "pointer", background: "rgba(255,255,255,0.03)" }}
                        >
                          {v}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Purchase Actions */}
                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button 
                    disabled={activeProduct.inventory <= 0}
                    onClick={() => handleAddToCart(activeProduct, 1)}
                    className="primary-action" 
                    style={{ flex: 1, padding: "0.8rem", justifyContent: "center" }}
                  >
                    Add To Cart
                  </button>
                  <button 
                    disabled={activeProduct.inventory <= 0}
                    onClick={() => { handleAddToCart(activeProduct, 1); setView("cart"); }}
                    className="secondary-action" 
                    style={{ flex: 1, padding: "0.8rem", justifyContent: "center", border: "1px solid #818cf8", color: "#818cf8" }}
                  >
                    Buy Now
                  </button>
                </div>

                {/* WhatsApp Chat Inquiry */}
                {settings.whatsapp?.enabled && (
                  <a 
                    href={`https://wa.me/${settings.whatsapp.phoneNumber}?text=${encodeURIComponent(`Hello! I would like to inquire about the product: ${activeProduct.name} (SKU: ${parsedActiveProduct.sku}) listing at ₹${activeProduct.price}.`)}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(37, 211, 102, 0.1)", border: "1px solid rgba(37, 211, 102, 0.2)", borderRadius: "0.5rem", padding: "0.75rem", justifyContent: "center", color: "#25d366", fontSize: "0.85rem", fontWeight: 700 }}
                  >
                    <Phone size={16} /> WhatsApp Inquiry
                  </a>
                )}

              </div>
            </div>

            {/* Specifications Tab */}
            {parsedActiveProduct.specifications && Object.keys(parsedActiveProduct.specifications).length > 0 && (
              <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "2rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem" }}>Specifications</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", maxWidth: "600px" }}>
                  {Object.entries(parsedActiveProduct.specifications).map(([key, val]: any) => (
                    <div key={key} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "0.4rem" }}>
                      <span style={{ color: "#64748b", fontSize: "0.85rem" }}>{key}</span>
                      <strong style={{ fontSize: "0.85rem" }}>{val}</strong>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        )}

        {/* ==================== VIEW 4: CART PAGE ==================== */}
        {view === "cart" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 900 }}>Your Shopping Cart</h1>

            {cart.length === 0 ? (
              <div style={{ padding: "4rem 2rem", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "1rem", textAlign: "center", display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
                <ShoppingCart size={40} style={{ color: "#64748b" }} />
                <strong style={{ color: "#94a3b8" }}>Your cart is empty.</strong>
                <button onClick={() => setView("shop")} className="primary-action">Continue Shopping</button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap" }}>
                
                {/* Cart Items List */}
                <div style={{ flex: 2, minWidth: "280px", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {cart.map((item, idx) => (
                    <div 
                      key={idx}
                      className="glass-panel"
                      style={{ padding: "1rem", borderRadius: "0.75rem", display: "flex", gap: "1rem", alignItems: "center", border: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap" }}
                    >
                      <img 
                        src={getProductImage(item.product)}
                        alt={item.product.name}
                        style={{ width: "70px", height: "70px", objectFit: "cover", borderRadius: "0.4rem" }}
                      />
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", flex: 1, minWidth: "150px" }}>
                        <strong style={{ fontSize: "0.9rem" }}>{item.product.name}</strong>
                        {item.selectedVariant && <span style={{ fontSize: "0.75rem", color: "#818cf8" }}>Variant: {item.selectedVariant}</span>}
                        <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>₹{Number(item.product.price).toLocaleString()}</span>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <button 
                          onClick={() => handleUpdateCartQuantity(idx, item.quantity - 1)}
                          style={{ width: "1.75rem", height: "1.75rem", borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: 0, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ width: "1.5rem", textAlign: "center", fontSize: "0.9rem" }}>{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateCartQuantity(idx, item.quantity + 1)}
                          style={{ width: "1.75rem", height: "1.75rem", borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: 0, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <span style={{ width: "80px", textAlign: "right", fontWeight: 800, fontSize: "0.9rem" }}>
                        ₹{(item.product.price * item.quantity).toLocaleString()}
                      </span>

                      <button 
                        onClick={() => handleUpdateCartQuantity(idx, 0)}
                        style={{ background: "rgba(239, 68, 68, 0.1)", border: 0, color: "#f87171", padding: "0.4rem", borderRadius: "0.4rem", cursor: "pointer" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Cart Order Summary */}
                <div style={{ flex: 1, minWidth: "280px" }}>
                  <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Order Summary</h3>
                    
                    {/* Coupon Box */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>Promo Coupon Code</label>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input 
                          type="text" 
                          placeholder="e.g. WELCOME10" 
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.4rem", padding: "0.4rem 0.6rem", fontSize: "0.8rem", color: "#fff" }}
                        />
                        <button 
                          onClick={handleApplyCoupon}
                          style={{ padding: "0.4rem 0.8rem", border: "1px solid #818cf8", color: "#818cf8", borderRadius: "0.4rem", cursor: "pointer", background: "transparent", fontSize: "0.8rem", fontWeight: 700 }}
                        >
                          Apply
                        </button>
                      </div>
                      {couponFeedback && <span style={{ fontSize: "0.75rem", color: appliedCoupon ? "#34d399" : "#f87171" }}>{couponFeedback}</span>}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem", fontSize: "0.85rem", color: "#94a3b8" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Subtotal</span>
                        <strong>₹{getCartSubtotal().toLocaleString()}</strong>
                      </div>
                      {appliedCoupon && (
                        <div style={{ display: "flex", justifyContent: "space-between", color: "#34d399" }}>
                          <span>Discount ({appliedCoupon.code})</span>
                          <strong>-₹{calculateDiscount(appliedCoupon).toLocaleString()}</strong>
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Shipping Charges</span>
                        <strong>{getShippingCost() === 0 ? "FREE" : `₹${getShippingCost()}`}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.75rem", fontSize: "1.1rem", color: "#fff", fontWeight: 800 }}>
                        <span>Total Cost</span>
                        <strong style={{ color: "#818cf8" }}>₹{getCartTotal().toLocaleString()}</strong>
                      </div>
                    </div>

                    <button 
                      onClick={() => setView("checkout")}
                      className="primary-action" 
                      style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }}
                    >
                      Proceed To Checkout
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* ==================== VIEW 5: CHECKOUT PAGE ==================== */}
        {view === "checkout" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 900 }}>Store Checkout</h1>

            {orderSuccess ? (
              <div style={{ padding: "4rem 2rem", border: "1px solid rgba(52, 211, 153, 0.2)", background: "rgba(52, 211, 153, 0.04)", borderRadius: "1rem", textAlign: "center", display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
                <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "50%", background: "rgba(52, 211, 153, 0.15)", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle2 size={30} />
                </div>
                <h2 style={{ color: "#fff", margin: 0 }}>Order Confirmed!</h2>
                <p style={{ color: "#cbd5e1", fontSize: "0.9rem" }}>
                  Your order <strong>{orderSuccess.id.slice(0, 8)}</strong> was placed successfully. Total: <strong>₹{Number(orderSuccess.total).toLocaleString()}</strong>.
                </p>
                <button 
                  onClick={() => { setOrderSuccess(null); setView("shop"); }}
                  className="primary-action"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <form onSubmit={handlePlaceOrder} style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap" }}>
                {/* Checkout Shipping Form */}
                <div className="glass-panel" style={{ flex: 2, minWidth: "280px", padding: "1.5rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0.5rem" }}>Shipping Details</h3>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="field-group">
                      <label>Contact Name</label>
                      <input 
                        type="text" 
                        required
                        className="field" 
                        value={checkoutForm.name || customer?.name || ""} 
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                        placeholder="Full Name" 
                      />
                    </div>
                    <div className="field-group">
                      <label>Contact Email</label>
                      <input 
                        type="email" 
                        required
                        className="field" 
                        value={checkoutForm.email || customer?.email || ""} 
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                        placeholder="email@example.com" 
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label>Shipping Address</label>
                    <textarea 
                      required
                      className="field" 
                      rows={3}
                      value={checkoutForm.address} 
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                      placeholder="Street address, apartment, suite" 
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                    <div className="field-group">
                      <label>City</label>
                      <input 
                        type="text" 
                        required
                        className="field" 
                        value={checkoutForm.city} 
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                        placeholder="City" 
                      />
                    </div>
                    <div className="field-group">
                      <label>State</label>
                      <input 
                        type="text" 
                        required
                        className="field" 
                        value={checkoutForm.state} 
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, state: e.target.value })}
                        placeholder="State" 
                      />
                    </div>
                    <div className="field-group">
                      <label>ZIP/PIN Code</label>
                      <input 
                        type="text" 
                        required
                        className="field" 
                        value={checkoutForm.zip} 
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, zip: e.target.value })}
                        placeholder="ZIP" 
                      />
                    </div>
                  </div>

                  {/* Payment Gateway Toggle */}
                  <h3 style={{ margin: "1rem 0 0 0", fontSize: "1.1rem", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0.5rem" }}>Payment Gateway</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
                    {settings.gateways?.upi && (
                      <label style={{ display: "flex", gap: "0.5rem", padding: "0.8rem", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.4rem", cursor: "pointer", background: checkoutForm.paymentMethod === "upi" ? "rgba(99,102,241,0.08)" : "transparent" }}>
                        <input type="radio" name="gateway" checked={checkoutForm.paymentMethod === "upi"} onChange={() => setCheckoutForm({ ...checkoutForm, paymentMethod: "upi" })} />
                        UPI Payment Instant
                      </label>
                    )}
                    {settings.gateways?.stripe && (
                      <label style={{ display: "flex", gap: "0.5rem", padding: "0.8rem", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.4rem", cursor: "pointer", background: checkoutForm.paymentMethod === "stripe" ? "rgba(99,102,241,0.08)" : "transparent" }}>
                        <input type="radio" name="gateway" checked={checkoutForm.paymentMethod === "stripe"} onChange={() => setCheckoutForm({ ...checkoutForm, paymentMethod: "stripe" })} />
                        Credit/Debit Card (Stripe)
                      </label>
                    )}
                    {settings.gateways?.cod && (
                      <label style={{ display: "flex", gap: "0.5rem", padding: "0.8rem", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.4rem", cursor: "pointer", background: checkoutForm.paymentMethod === "cod" ? "rgba(99,102,241,0.08)" : "transparent" }}>
                        <input type="radio" name="gateway" checked={checkoutForm.paymentMethod === "cod"} onChange={() => setCheckoutForm({ ...checkoutForm, paymentMethod: "cod" })} />
                        Cash On Delivery (COD)
                      </label>
                    )}
                  </div>
                </div>

                {/* Checkout Order Review */}
                <div style={{ flex: 1, minWidth: "280px" }}>
                  <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Review Order</h3>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {cart.map((item, idx) => (
                        <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#cbd5e1" }}>
                          <span>{item.product.name} (x{item.quantity})</span>
                          <strong>₹{(item.product.price * item.quantity).toLocaleString()}</strong>
                        </div>
                      ))}
                    </div>

                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.85rem", color: "#94a3b8" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Subtotal</span>
                        <span>₹{getCartSubtotal().toLocaleString()}</span>
                      </div>
                      {appliedCoupon && (
                        <div style={{ display: "flex", justifyContent: "space-between", color: "#34d399" }}>
                          <span>Discount ({appliedCoupon.code})</span>
                          <span>-₹{calculateDiscount(appliedCoupon).toLocaleString()}</span>
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Shipping Cost</span>
                        <span>{getShippingCost() === 0 ? "FREE" : `₹${getShippingCost()}`}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.75rem", fontSize: "1.1rem", color: "#fff", fontWeight: 800 }}>
                        <span>Final Amount</span>
                        <span style={{ color: "#818cf8" }}>₹{getCartTotal().toLocaleString()}</span>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="primary-action" 
                      style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }}
                    >
                      Place Order
                    </button>
                  </div>
                </div>

              </form>
            )}
          </div>
        )}

        {/* ==================== VIEW 6: CUSTOMER ACCOUNT ==================== */}
        {view === "account" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 900 }}>Customer Accounts Portal</h1>

            {!customer ? (
              <div style={{ maxWidth: "420px", margin: "2rem auto", width: "100%" }}>
                <form onSubmit={handleCustomerAuthSubmit} className="glass-panel" style={{ padding: "2rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", textAlign: "center" }}>
                    {authForm.isRegister ? "Create Customer Account" : "Customer Sign In"}
                  </h3>
                  
                  {authError && <div className="form-alert">{authError}</div>}

                  {authForm.isRegister && (
                    <div className="field-group">
                      <label>Full Name</label>
                      <input 
                        type="text" 
                        required
                        className="field" 
                        value={authForm.name} 
                        onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                        placeholder="John Doe" 
                      />
                    </div>
                  )}

                  <div className="field-group">
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      required
                      className="field" 
                      value={authForm.email} 
                      onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                      placeholder="email@example.com" 
                    />
                  </div>

                  <div className="field-group">
                    <label>Password</label>
                    <input 
                      type="password" 
                      required
                      className="field" 
                      value={authForm.password} 
                      onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                      placeholder="••••••••" 
                    />
                  </div>

                  <button type="submit" className="primary-action" style={{ width: "100%", justifyContent: "center", marginTop: "0.5rem" }}>
                    {authForm.isRegister ? "Sign Up" : "Log In"}
                  </button>

                  <span 
                    onClick={() => setAuthForm({ ...authForm, isRegister: !authForm.isRegister })}
                    style={{ fontSize: "0.8rem", color: "#818cf8", cursor: "pointer", textAlign: "center", display: "block", marginTop: "0.5rem" }}
                  >
                    {authForm.isRegister ? "Already registered? Sign in here" : "Need an account? Sign up here"}
                  </span>
                </form>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap" }}>
                
                {/* Account Side profile */}
                <div style={{ flex: 1, minWidth: "260px" }}>
                  <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", background: "linear-gradient(to right, #6366f1, #a855f7)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                        {customer.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <strong style={{ color: "#fff" }}>{customer.name}</strong>
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{customer.email}</span>
                      </div>
                    </div>
                    <button 
                      onClick={handleCustomerLogout}
                      className="secondary-action"
                      style={{ border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171", background: "rgba(239, 68, 68, 0.05)", justifyContent: "center", width: "100%" }}
                    >
                      <LogOut size={14} /> Log Out
                    </button>
                  </div>
                </div>

                {/* Account details & orders */}
                <div style={{ flex: 2, minWidth: "280px", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>Your Orders History</h3>
                  
                  {orders.length === 0 ? (
                    <div style={{ padding: "2.5rem", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "0.75rem", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
                      No order records found.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {orders.map((ord) => {
                        const tracking = ord.paymentId?.split("|")?.[1]?.replace("tracking:", "");
                        return (
                          <div key={ord.id} className="glass-panel" style={{ padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: "0.5rem" }}>
                              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Order ID: <strong>{ord.id.slice(0, 8)}</strong></span>
                              <span style={{ 
                                fontSize: "0.75rem", 
                                padding: "0.25rem 0.5rem", 
                                borderRadius: "0.25rem", 
                                background: ord.status === "DELIVERED" ? "rgba(52, 211, 153, 0.15)" : ord.status === "SHIPPED" ? "rgba(99, 102, 241, 0.15)" : "rgba(245, 158, 11, 0.15)",
                                color: ord.status === "DELIVERED" ? "#34d399" : ord.status === "SHIPPED" ? "#818cf8" : "#fbbf24",
                                fontWeight: 700
                              }}>{ord.status}</span>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                              {Array.isArray(ord.items) && ord.items.map((item: any, idx: number) => (
                                <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#94a3b8" }}>
                                  <span>{item.name} (x{item.quantity})</span>
                                  <span>₹{Number(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "0.5rem", fontSize: "0.85rem" }}>
                              <span style={{ color: "#64748b" }}>Placed: {new Date(ord.createdAt).toLocaleDateString()}</span>
                              <span>Total: <strong>₹{Number(ord.total).toLocaleString()}</strong></span>
                            </div>

                            {tracking && (
                              <div style={{ background: "rgba(99, 102, 241, 0.08)", padding: "0.5rem 0.75rem", borderRadius: "0.4rem", display: "flex", alignItems: "center", gap: "0.5rem", border: "1px solid rgba(99,102,241,0.15)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                                <Truck size={14} style={{ stroke: "#818cf8" }} />
                                <span>Courier Tracking Number: <strong style={{ color: "#fff" }}>{tracking}</strong></span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}

        {/* ==================== VIEW 7: ADMIN CONSOLE ==================== */}
        {view === "admin" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#a855f7" }}>Store Admin Dashboard</h1>

            {!adminAuth ? (
              <div style={{ maxWidth: "400px", margin: "4rem auto", width: "100%" }}>
                <form onSubmit={handleAdminAuthSubmit} className="glass-panel" style={{ padding: "2rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", textAlign: "center" }}>Enter Administrative Code</h3>
                  
                  {adminError && <div className="form-alert">{adminError}</div>}
                  
                  <div className="field-group">
                    <label>Admin Passcode</label>
                    <input 
                      type="password" 
                      required
                      className="field" 
                      value={adminPassword} 
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="e.g. admin123" 
                    />
                  </div>
                  
                  <button type="submit" className="primary-action" style={{ width: "100%", justifyContent: "center", background: "#a855f7" }}>Unlock Dashboard</button>
                  <span style={{ fontSize: "0.7rem", color: "#64748b", textAlign: "center" }}>Hint: Default password is `admin123`</span>
                </form>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                
                {/* Admin Navbar Tabs */}
                <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0.5rem", overflowX: "auto" }}>
                  <button onClick={() => { setAdminTab("overview"); fetchAdminOrders(); }} style={{ background: adminTab === "overview" ? "rgba(168,85,247,0.15)" : "transparent", border: 0, color: adminTab === "overview" ? "#c084fc" : "#94a3b8", padding: "0.4rem 0.8rem", borderRadius: "0.25rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700 }}>Overview</button>
                  <button onClick={() => setAdminTab("products")} style={{ background: adminTab === "products" ? "rgba(168,85,247,0.15)" : "transparent", border: 0, color: adminTab === "products" ? "#c084fc" : "#94a3b8", padding: "0.4rem 0.8rem", borderRadius: "0.25rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700 }}>Products</button>
                  <button onClick={() => { setAdminTab("orders"); fetchAdminOrders(); }} style={{ background: adminTab === "orders" ? "rgba(168,85,247,0.15)" : "transparent", border: 0, color: adminTab === "orders" ? "#c084fc" : "#94a3b8", padding: "0.4rem 0.8rem", borderRadius: "0.25rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700 }}>Orders</button>
                  <button onClick={() => setAdminTab("settings")} style={{ background: adminTab === "settings" ? "rgba(168,85,247,0.15)" : "transparent", border: 0, color: adminTab === "settings" ? "#c084fc" : "#94a3b8", padding: "0.4rem 0.8rem", borderRadius: "0.25rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700 }}>Config</button>
                  <button onClick={handleAdminLogout} style={{ border: 0, color: "#f87171", background: "transparent", cursor: "pointer", marginLeft: "auto", fontSize: "0.85rem", fontWeight: 700 }}>Log Out</button>
                </div>

                {/* TAB 1: OVERVIEW */}
                {adminTab === "overview" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                    
                    {/* Analytics Widgets */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                      <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", background: "rgba(168,85,247,0.15)", color: "#c084fc", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <TrendingUp size={20} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Total Revenue</span>
                          <strong style={{ fontSize: "1.3rem" }}>₹{orders.reduce((sum, o) => o.status !== "CANCELLED" ? sum + Number(o.total) : sum, 0).toLocaleString()}</strong>
                        </div>
                      </div>

                      <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", background: "rgba(99, 102, 241, 0.15)", color: "#818cf8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Package size={20} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Orders count</span>
                          <strong style={{ fontSize: "1.3rem" }}>{orders.length} Orders</strong>
                        </div>
                      </div>

                      <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", background: "rgba(52, 211, 153, 0.15)", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <User size={20} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Registered Customers</span>
                          <strong style={{ fontSize: "1.3rem" }}>{(settings.customers || []).length} Active</strong>
                        </div>
                      </div>

                      <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ width: "2.5rem", height: "2.5rem", borderRadius: "50%", background: "rgba(239, 68, 68, 0.15)", color: "#f87171", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <AlertTriangle size={20} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Low Inventory Alerts</span>
                          <strong style={{ fontSize: "1.3rem" }}>{products.filter(p => p.inventory < 10).length} Items</strong>
                        </div>
                      </div>
                    </div>

                    {/* Dashboard charts & recent orders */}
                    <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                      <div className="glass-panel" style={{ flex: 1.5, minWidth: "280px", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <h4 style={{ margin: "0 0 1rem 0" }}>Recent Placed Orders</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          {orders.slice(0, 5).map((ord) => (
                            <div key={ord.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "0.5rem", fontSize: "0.8rem" }}>
                              <div>
                                <strong>{ord.customerName}</strong>
                                <span style={{ color: "#64748b", display: "block" }}>{ord.customerEmail}</span>
                              </div>
                              <span style={{ color: "#a855f7", fontWeight: 700 }}>₹{Number(ord.total).toLocaleString()}</span>
                              <span style={{ 
                                padding: "0.15rem 0.35rem", 
                                borderRadius: "0.2rem", 
                                background: ord.status === "DELIVERED" ? "rgba(52, 211, 153, 0.15)" : "rgba(245, 158, 11, 0.15)",
                                color: ord.status === "DELIVERED" ? "#34d399" : "#fbbf24"
                              }}>{ord.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="glass-panel" style={{ flex: 1, minWidth: "240px", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <h4 style={{ margin: 0 }}>Inventory Reports</h4>
                        {products.slice(0, 4).map(p => (
                          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "0.4rem" }}>
                            <span style={{ color: "#94a3b8" }}>{p.name.slice(0, 20)}...</span>
                            <span style={{ color: p.inventory < 10 ? "#f87171" : "#34d399", fontWeight: 700 }}>{p.inventory} Qty</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* TAB 2: PRODUCTS MANAGEMENT */}
                {adminTab === "products" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ margin: 0, fontSize: "1.2rem" }}>Catalog Products List</h3>
                      <button onClick={() => setShowAddProductModal(true)} className="primary-action" style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", background: "#a855f7" }}>+ Add Store Product</button>
                    </div>

                    {/* Add Product Modal Form */}
                    {showAddProductModal && (
                      <form onSubmit={handleAddProduct} className="glass-panel" style={{ padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid rgba(168,85,247,0.3)", display: "flex", flexDirection: "column", gap: "1rem", background: "rgba(10,14,23,0.99)" }}>
                        <h4 style={{ margin: 0, color: "#c084fc" }}>New Product Config</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                          <div className="field-group">
                            <label>Product Name</label>
                            <input type="text" required className="field" value={newProductForm.name} onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })} placeholder="Retro Gaming Keyboard" />
                          </div>
                          <div className="field-group">
                            <label>Price (INR)</label>
                            <input type="number" required className="field" value={newProductForm.price} onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })} placeholder="1999" />
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                          <div className="field-group">
                            <label>Starting Inventory</label>
                            <input type="number" required className="field" value={newProductForm.inventory} onChange={(e) => setNewProductForm({ ...newProductForm, inventory: e.target.value })} placeholder="100" />
                          </div>
                          <div className="field-group">
                            <label>Category</label>
                            <input type="text" className="field" value={newProductForm.category} onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })} placeholder="Keyboards" />
                          </div>
                        </div>

                        <div className="field-group">
                          <label>Description Details</label>
                          <textarea className="field" rows={2} value={newProductForm.descriptionText} onChange={(e) => setNewProductForm({ ...newProductForm, descriptionText: e.target.value })} placeholder="A beautiful customizable mechanical keyboard for professional gamers." />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                          <div className="field-group">
                            <label>Variants (comma separated)</label>
                            <input type="text" className="field" value={newProductForm.variants} onChange={(e) => setNewProductForm({ ...newProductForm, variants: e.target.value })} placeholder="Red Switches, Blue Switches" />
                          </div>
                          <div className="field-group">
                            <label>Specifications (key:value, comma separated)</label>
                            <input type="text" className="field" value={newProductForm.specifications} onChange={(e) => setNewProductForm({ ...newProductForm, specifications: e.target.value })} placeholder="Brand:Keytron, Warranty:1 Year" />
                          </div>
                        </div>

                        <div className="field-group">
                          <label>Image Unsplash/Web URL (Optional)</label>
                          <input type="text" className="field" value={newProductForm.imageUrl} onChange={(e) => setNewProductForm({ ...newProductForm, imageUrl: e.target.value })} placeholder="https://images.unsplash.com/photo-..." />
                        </div>

                        <div style={{ display: "flex", gap: "1rem" }}>
                          <button type="button" onClick={() => setShowAddProductModal(false)} className="secondary-action" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
                          <button type="submit" className="primary-action" style={{ flex: 1, justifyContent: "center", background: "#a855f7" }}>Add Product</button>
                        </div>
                      </form>
                    )}

                    {/* Products Grid Table */}
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <thead>
                          <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)", textAlign: "left" }}>
                            <th style={{ padding: "0.75rem" }}>Product</th>
                            <th style={{ padding: "0.75rem" }}>Category</th>
                            <th style={{ padding: "0.75rem" }}>Price</th>
                            <th style={{ padding: "0.75rem" }}>Stock</th>
                            <th style={{ padding: "0.75rem" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map(p => {
                            const parsed = parseProductDescription(p.description);
                            return (
                              <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                                <td style={{ padding: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                  <img src={getProductImage(p)} style={{ width: "30px", height: "30px", objectFit: "cover", borderRadius: "0.2rem" }} />
                                  <strong>{p.name}</strong>
                                </td>
                                <td style={{ padding: "0.75rem" }}>{parsed.category}</td>
                                <td style={{ padding: "0.75rem" }}>₹{Number(p.price).toLocaleString()}</td>
                                <td style={{ padding: "0.75rem", color: p.inventory < 10 ? "#f87171" : "#34d399", fontWeight: 700 }}>{p.inventory}</td>
                                <td style={{ padding: "0.75rem" }}>
                                  <button 
                                    onClick={() => handleDeleteProduct(p.id)}
                                    style={{ background: "transparent", border: 0, color: "#f87171", cursor: "pointer" }}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                  </div>
                )}

                {/* TAB 3: ORDERS MANAGEMENT */}
                {adminTab === "orders" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <h3 style={{ margin: 0, fontSize: "1.2rem" }}>Customer Orders List</h3>

                    {/* Order Status Update Modal */}
                    {updatingOrderStatus.orderId && (
                      <form onSubmit={handleUpdateOrderStatus} className="glass-panel" style={{ padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid rgba(168,85,247,0.3)", display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <h4 style={{ margin: 0 }}>Update Order: {updatingOrderStatus.orderId.slice(0, 8)}</h4>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                          <div className="field-group">
                            <label>Order Status</label>
                            <select 
                              className="field"
                              value={updatingOrderStatus.status} 
                              onChange={(e) => setUpdatingOrderStatus({ ...updatingOrderStatus, status: e.target.value })}
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="PROCESSING">PROCESSING</option>
                              <option value="SHIPPED">SHIPPED</option>
                              <option value="DELIVERED">DELIVERED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </div>
                          <div className="field-group">
                            <label>Courier Tracking Number</label>
                            <input 
                              type="text" 
                              className="field" 
                              value={updatingOrderStatus.trackingNumber} 
                              onChange={(e) => setUpdatingOrderStatus({ ...updatingOrderStatus, trackingNumber: e.target.value })}
                              placeholder="e.g. TRK98342890" 
                            />
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "1rem" }}>
                          <button type="button" onClick={() => setUpdatingOrderStatus({ orderId: "", status: "", trackingNumber: "" })} className="secondary-action" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
                          <button type="submit" className="primary-action" style={{ flex: 1, justifyContent: "center", background: "#a855f7" }}>Save Updates</button>
                        </div>
                      </form>
                    )}

                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <thead>
                          <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)", textAlign: "left" }}>
                            <th style={{ padding: "0.75rem" }}>Order ID</th>
                            <th style={{ padding: "0.75rem" }}>Customer</th>
                            <th style={{ padding: "0.75rem" }}>Items</th>
                            <th style={{ padding: "0.75rem" }}>Amount</th>
                            <th style={{ padding: "0.75rem" }}>Status</th>
                            <th style={{ padding: "0.75rem" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map(ord => (
                            <tr key={ord.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                              <td style={{ padding: "0.75rem" }}><strong>{ord.id.slice(0, 8)}</strong></td>
                              <td style={{ padding: "0.75rem" }}>
                                {ord.customerName}
                                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>{ord.customerEmail}</span>
                              </td>
                              <td style={{ padding: "0.75rem" }}>
                                {Array.isArray(ord.items) ? ord.items.map((i: any) => `${i.name} (x${i.quantity})`).join(", ") : "Items parsing issue"}
                              </td>
                              <td style={{ padding: "0.75rem" }}>₹{Number(ord.total).toLocaleString()}</td>
                              <td style={{ padding: "0.75rem" }}>
                                <span style={{ 
                                  fontSize: "0.75rem",
                                  padding: "0.15rem 0.35rem", 
                                  borderRadius: "0.2rem", 
                                  background: ord.status === "DELIVERED" ? "rgba(52, 211, 153, 0.15)" : ord.status === "SHIPPED" ? "rgba(99, 102, 241, 0.15)" : "rgba(245, 158, 11, 0.15)",
                                  color: ord.status === "DELIVERED" ? "#34d399" : ord.status === "SHIPPED" ? "#818cf8" : "#fbbf24"
                                }}>{ord.status}</span>
                              </td>
                              <td style={{ padding: "0.75rem" }}>
                                <button 
                                  onClick={() => {
                                    const trk = ord.paymentId?.split("|")?.[1]?.replace("tracking:", "") || "";
                                    setUpdatingOrderStatus({ orderId: ord.id, status: ord.status, trackingNumber: trk });
                                  }}
                                  style={{ background: "transparent", border: 0, color: "#818cf8", cursor: "pointer", fontWeight: 700 }}
                                >
                                  Update Status
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                  </div>
                )}

                {/* TAB 4: STORE CONFIGURATION SETTINGS */}
                {adminTab === "settings" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <h3 style={{ margin: 0, fontSize: "1.2rem" }}>Payment & Channel Settings</h3>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", flexWrap: "wrap" }}>
                      
                      {/* Payment Gateways Config panel */}
                      <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <h4 style={{ margin: 0 }}>Active Gateways</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          {Object.entries(settings.gateways || {}).map(([gw, active]: any) => (
                            <label key={gw} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontSize: "0.85rem" }}>
                              <span style={{ textTransform: "uppercase" }}>{gw} integration</span>
                              <input 
                                type="checkbox" 
                                checked={active}
                                onChange={async (e) => {
                                  const updatedSettings = {
                                    ...settings,
                                    gateways: {
                                      ...settings.gateways,
                                      [gw]: e.target.checked
                                    }
                                  };
                                  setSettings(updatedSettings);
                                  await fetch(`/api/projects/${projectId}/ecommerce/settings`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ settings: updatedSettings })
                                  });
                                }}
                              />
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* WhatsApp Business integrations */}
                      <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "0.75rem", border: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <h4 style={{ margin: 0 }}>WhatsApp Business Notifications</h4>
                        <div className="field-group">
                          <label>WhatsApp Phone Number</label>
                          <input 
                            type="text" 
                            className="field" 
                            value={settings.whatsapp?.phoneNumber || ""} 
                            onChange={async (e) => {
                              const updatedSettings = {
                                ...settings,
                                whatsapp: {
                                  ...settings.whatsapp,
                                  phoneNumber: e.target.value
                                }
                              };
                              setSettings(updatedSettings);
                              await fetch(`/api/projects/${projectId}/ecommerce/settings`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ settings: updatedSettings })
                              });
                            }}
                            placeholder="e.g. 919999999999" 
                          />
                        </div>
                        <label style={{ display: "flex", gap: "0.5rem", fontSize: "0.8rem", cursor: "pointer" }}>
                          <input 
                            type="checkbox" 
                            checked={settings.whatsapp?.enabled} 
                            onChange={async (e) => {
                              const updatedSettings = {
                                ...settings,
                                whatsapp: {
                                  ...settings.whatsapp,
                                  enabled: e.target.checked
                                }
                              };
                              setSettings(updatedSettings);
                              await fetch(`/api/projects/${projectId}/ecommerce/settings`, {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ settings: updatedSettings })
                              });
                            }}
                          />
                          Enable WhatsApp customer chat button on detail pages
                        </label>
                      </div>

                    </div>

                  </div>
                )}

              </div>
            )}
          </div>
        )}

      </main>

      {/* WhatsApp Floating Contact CTA Widget */}
      {settings.whatsapp?.enabled && (
        <a 
          href={`https://wa.me/${settings.whatsapp.phoneNumber}?text=${encodeURIComponent(settings.whatsapp.supportText || "Hello!")}`}
          target="_blank" 
          rel="noopener noreferrer"
          style={{ position: "fixed", bottom: "2rem", right: "2rem", width: "3.5rem", height: "3.5rem", borderRadius: "50%", background: "#25d366", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(37,211,102,0.3)", zIndex: 100, cursor: "pointer" }}
        >
          <Phone size={24} />
        </a>
      )}

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "2rem", background: "rgba(0,0,0,0.2)", marginTop: "auto", fontSize: "0.8rem", color: "#64748b", textAlign: "center" }}>
        <p>© {new Date().getFullYear()} {settings.whatsapp?.phoneNumber ? projectSubdomain.toUpperCase() : "eCommerce Single Vendor Store"}. All rights reserved.</p>
        <p style={{ marginTop: "0.5rem" }}>
          Built with <span style={{ color: "#a855f7", fontWeight: 700 }}>Webbing AI Engine</span>
        </p>
      </footer>

    </div>
  );
}
