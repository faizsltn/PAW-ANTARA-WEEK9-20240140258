const { Category, Todo } = require("../models");
const sendResponse = require("../utils/response");

// GET /categories -> ambil semua kategori milik user yg login
async function getCategories(req, res) {
  try {
    const categories = await Category.findAll({
      where: { user_id: req.session.userId },
      order: [["createdAt", "DESC"]],
    });

    return sendResponse(res, {
      message: "Berhasil ambil kategori",
      data: categories,
    });
  } catch (err) {
    return sendResponse(res, {
      code: 500,
      success: false,
      message: err.message,
    });
  }
}

// GET /categories/:id -> ambil satu kategori beserta todo di dalamnya
async function getCategoryById(req, res) {
  try {
    const { id } = req.params;

    const category = await Category.findOne({
      where: { id, user_id: req.session.userId },
      include: [{ model: Todo }],
    });

    if (!category) {
      return sendResponse(res, {
        code: 404,
        success: false,
        message: "Kategori tidak ditemukan",
      });
    }

    return sendResponse(res, {
      message: "Berhasil ambil kategori",
      data: category,
    });
  } catch (err) {
    return sendResponse(res, {
      code: 500,
      success: false,
      message: err.message,
    });
  }
}

// POST /categories -> tambah kategori baru
async function addCategory(req, res) {
  try {
    const { name } = req.body;

    if (!name) {
      return sendResponse(res, {
        code: 400,
        success: false,
        message: "name wajib diisi",
      });
    }

    const existing = await Category.findOne({
      where: { name, user_id: req.session.userId },
    });
    if (existing) {
      return sendResponse(res, {
        code: 409,
        success: false,
        message: "Kategori dengan nama itu sudah ada",
      });
    }

    const category = await Category.create({
      name,
      user_id: req.session.userId,
    });

    return sendResponse(res, {
      code: 201,
      message: "Kategori berhasil ditambahkan",
      data: category,
    });
  } catch (err) {
    return sendResponse(res, {
      code: 500,
      success: false,
      message: err.message,
    });
  }
}

// PUT /categories/:id -> update nama kategori
async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const category = await Category.findOne({
      where: { id, user_id: req.session.userId },
    });
    if (!category) {
      return sendResponse(res, {
        code: 404,
        success: false,
        message: "Kategori tidak ditemukan",
      });
    }

    if (name !== undefined) category.name = name;
    await category.save();

    return sendResponse(res, {
      message: "Kategori berhasil diupdate",
      data: category,
    });
  } catch (err) {
    return sendResponse(res, {
      code: 500,
      success: false,
      message: err.message,
    });
  }
}

// DELETE /categories/:id
async function deleteCategory(req, res) {
  try {
    const { id } = req.params;

    const category = await Category.findOne({
      where: { id, user_id: req.session.userId },
    });
    if (!category) {
      return sendResponse(res, {
        code: 404,
        success: false,
        message: "Kategori tidak ditemukan",
      });
    }

    // lepasin todo yang masih nempel ke kategori ini (jadi tanpa kategori)
    await Todo.update(
      { category_id: null },
      { where: { category_id: id, user_id: req.session.userId } },
    );

    await category.destroy();

    return sendResponse(res, { message: "Kategori berhasil dihapus" });
  } catch (err) {
    return sendResponse(res, {
      code: 500,
      success: false,
      message: err.message,
    });
  }
}

module.exports = {
  getCategories,
  getCategoryById,
  addCategory,
  updateCategory,
  deleteCategory,
};
