require("dotenv").config();
const bcrypt = require("bcrypt");
const { sequelize, User, Category, Todo } = require("../models");

const SALT_ROUNDS = 10;

async function seed() {
  try {
    await sequelize.authenticate();
    console.log("Koneksi database berhasil");

    // pastiin tabel udah ada
    await sequelize.sync();

    // password plain buat semua dummy user: "password123"
    const hashedPassword = await bcrypt.hash("password123", SALT_ROUNDS);

    // upsert biar aman kalo seed dijalanin berkali-kali (gak bikin duplikat)
    const [user1] = await User.findOrCreate({
      where: { username: "rizki" },
      defaults: { password: hashedPassword },
    });

    const [user2] = await User.findOrCreate({
      where: { username: "budi" },
      defaults: { password: hashedPassword },
    });

    console.log("User dummy siap:", user1.username, "&", user2.username);

    // bikin kategori dummy punya user1
    const [catKuliah] = await Category.findOrCreate({
      where: { name: "Kuliah", user_id: user1.id },
    });
    const [catKerja] = await Category.findOrCreate({
      where: { name: "Kerja", user_id: user1.id },
    });
    console.log("Kategori dummy siap:", catKuliah.name, "&", catKerja.name);

    // bikin todo dummy, tapi cek dulu biar gak numpuk kalo diulang-ulang
    const existingTodos = await Todo.count({ where: { user_id: user1.id } });

    if (existingTodos === 0) {
      await Todo.bulkCreate([
        {
          title: "Belajar Sequelize",
          is_done: true,
          user_id: user1.id,
          category_id: catKuliah.id,
        },
        {
          title: "Bikin API Todo",
          is_done: true,
          user_id: user1.id,
          category_id: catKuliah.id,
        },
        {
          title: "Nambahin fitur seeder",
          is_done: false,
          user_id: user1.id,
          category_id: catKerja.id,
        },
        { title: "Review PR temen", is_done: false, user_id: user2.id },
        { title: "Fix bug login", is_done: false, user_id: user2.id },
      ]);
      console.log("Todo dummy berhasil ditambahin");
    } else {
      console.log("Todo dummy udah ada, skip supaya gak dobel");
    }

    console.log("\nSeeding selesai ✅");
    console.log("Login pake salah satu ini:");
    console.log("  username: rizki  | password: password123");
    console.log("  username: budi   | password: password123");

    process.exit(0);
  } catch (err) {
    console.error("Gagal seeding:", err.message);
    process.exit(1);
  }
}

seed();
