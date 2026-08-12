require("dotenv").config();
const express = require("express");
const session = require("express-session");
const path = require("path");
const { sequelize, Todo, Category, User } = require("./models");

const authRoutes = require("./routes/auth.routes");
const todoRoutes = require("./routes/todo.routes");
const categoryRoutes = require("./routes/category.routes");

const app = express();

// --- KONFIGURASI VIEW ENGINE (EJS) & BODY PARSER ---
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Agar form HTML/EJS bisa dibaca (req.body)

// --- SESSION MIDDLEWARE ---
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret-default",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 hari
      httpOnly: true,
    },
  })
);

// Middleware Proteksi untuk Halaman Web
const requireWebAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  next();
};

// ==========================================
// 1. ROUTES TAMPILAN WEB (EJS / UI)
// ==========================================

// Dashboard Utama Web
app.get("/", requireWebAuth, async (req, res) => {
  try {
    const { category_id } = req.query;
    const where = { user_id: req.session.userId };
    if (category_id) where.category_id = category_id;

    const user = await User.findByPk(req.session.userId);
    const todos = await Todo.findAll({
      where,
      include: [{ model: Category, attributes: ["name"] }],
      order: [["createdAt", "DESC"]],
    });
    const categories = await Category.findAll({
      where: { user_id: req.session.userId },
    });

    res.render("dashboard", {
      user,
      todos,
      categories,
      selectedCategory: category_id || "",
    });
  } catch (err) {
    res.status(500).send("Terjadi kesalahan server");
  }
});

// Halaman Login & Register
app.get("/login", (req, res) => {
  if (req.session.userId) return res.redirect("/");
  res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    
    if (!user || !(await user.validatePassword(password))) {
      return res.render("login", { error: "Username atau password salah" });
    }

    req.session.userId = user.id;
    res.redirect("/");
  } catch (err) {
    res.render("login", { error: "Terjadi kesalahan saat login" });
  }
});

app.get("/register", (req, res) => {
  if (req.session.userId) return res.redirect("/");
  res.render("register", { error: null });
});

app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.render("register", { error: "Username sudah digunakan" });
    }

    const user = await User.create({ username, password });
    req.session.userId = user.id;
    res.redirect("/");
  } catch (err) {
    res.render("register", { error: "Gagal mendaftarkan akun" });
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// Action Web: Todo (Tambah, Toggle Status, Hapus)
app.post("/web/todos", requireWebAuth, async (req, res) => {
  try {
    const { title, category_id } = req.body;
    await Todo.create({
      title,
      category_id: category_id ? category_id : null,
      user_id: req.session.userId,
    });
    res.redirect("/");
  } catch (err) {
    res.redirect("/");
  }
});

app.post("/web/todos/:id/toggle", requireWebAuth, async (req, res) => {
  try {
    const todo = await Todo.findOne({
      where: { id: req.params.id, user_id: req.session.userId },
    });
    if (todo) {
      todo.is_completed = !todo.is_completed;
      await todo.save();
    }
    res.redirect("/");
  } catch (err) {
    res.redirect("/");
  }
});

app.post("/web/todos/:id/delete", requireWebAuth, async (req, res) => {
  try {
    await Todo.destroy({
      where: { id: req.params.id, user_id: req.session.userId },
    });
    res.redirect("/");
  } catch (err) {
    res.redirect("/");
  }
});

// Action Web: Category (Tambah & Hapus)
app.post("/web/categories", requireWebAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (name) {
      await Category.create({ name, user_id: req.session.userId });
    }
    res.redirect("/");
  } catch (err) {
    res.redirect("/");
  }
});

app.post("/web/categories/:id/delete", requireWebAuth, async (req, res) => {
  try {
    await Category.destroy({
      where: { id: req.params.id, user_id: req.session.userId },
    });
    res.redirect("/");
  } catch (err) {
    res.redirect("/");
  }
});

// ==========================================
// 2. REST API ROUTES (Tetap Murni JSON)
// ==========================================
app.use("/api/auth", authRoutes);
app.use("/api/todos", todoRoutes);
app.use("/api/categories", categoryRoutes);

// Endpoint Health Check API
app.get("/api-status", (req, res) => {
  res.json({ message: "Todo API jalan 🚀" });
});

// ==========================================
// 3. START SERVER & DATABASE SYNC
// ==========================================
const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log("Koneksi database berhasil");

    // sync model ke db (bikin tabel kalo belum ada)
    await sequelize.sync();
    console.log("Sync model selesai");

    app.listen(PORT, () => {
      console.log(`Server jalan di http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Gagal konek ke database:", err.message);
  }
}

start();