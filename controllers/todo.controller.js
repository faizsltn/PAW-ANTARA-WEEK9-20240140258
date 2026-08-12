const { Todo, Category } = require("../models");
const sendResponse = require("../utils/response");

// GET /todos -> ambil semua todo milik user yg login
// bisa difilter pake ?category_id=
async function getTodos(req, res) {
  try {
    const { category_id } = req.query;
    const where = { user_id: req.session.userId };
    if (category_id !== undefined) where.category_id = category_id;

    const todos = await Todo.findAll({
      where,
      include: [{ model: Category, attributes: ["id", "name"] }],
      order: [["createdAt", "DESC"]],
    });

    return sendResponse(res, { message: "Berhasil ambil todo", data: todos });
  } catch (err) {
    return sendResponse(res, {
      code: 500,
      success: false,
      message: err.message,
    });
  }
}

// POST /todos -> tambah todo baru
async function addTodo(req, res) {
  try {
    const { title, category_id } = req.body;

    if (!title) {
      return sendResponse(res, {
        code: 400,
        success: false,
        message: "title wajib diisi",
      });
    }

    if (category_id !== undefined && category_id !== null) {
      const category = await Category.findOne({
        where: { id: category_id, user_id: req.session.userId },
      });
      if (!category) {
        return sendResponse(res, {
          code: 404,
          success: false,
          message: "Kategori tidak ditemukan",
        });
      }
    }

    const todo = await Todo.create({
      title,
      user_id: req.session.userId,
      category_id: category_id ?? null,
    });

    return sendResponse(res, {
      code: 201,
      message: "Todo berhasil ditambahkan",
      data: todo,
    });
  } catch (err) {
    return sendResponse(res, {
      code: 500,
      success: false,
      message: err.message,
    });
  }
}

// PUT /todos/:id -> update todo (title / is_done / category_id)
async function updateTodo(req, res) {
  try {
    const { id } = req.params;
    const { title, is_done, category_id } = req.body;

    const todo = await Todo.findOne({
      where: { id, user_id: req.session.userId },
    });
    if (!todo) {
      return sendResponse(res, {
        code: 404,
        success: false,
        message: "Todo tidak ditemukan",
      });
    }

    if (category_id !== undefined && category_id !== null) {
      const category = await Category.findOne({
        where: { id: category_id, user_id: req.session.userId },
      });
      if (!category) {
        return sendResponse(res, {
          code: 404,
          success: false,
          message: "Kategori tidak ditemukan",
        });
      }
    }

    if (title !== undefined) todo.title = title;
    if (is_done !== undefined) todo.is_done = is_done;
    if (category_id !== undefined) todo.category_id = category_id;
    await todo.save();

    return sendResponse(res, { message: "Todo berhasil diupdate", data: todo });
  } catch (err) {
    return sendResponse(res, {
      code: 500,
      success: false,
      message: err.message,
    });
  }
}

// DELETE /todos/:id
async function deleteTodo(req, res) {
  try {
    const { id } = req.params;

    const todo = await Todo.findOne({
      where: { id, user_id: req.session.userId },
    });
    if (!todo) {
      return sendResponse(res, {
        code: 404,
        success: false,
        message: "Todo tidak ditemukan",
      });
    }

    await todo.destroy();

    return sendResponse(res, { message: "Todo berhasil dihapus" });
  } catch (err) {
    return sendResponse(res, {
      code: 500,
      success: false,
      message: err.message,
    });
  }
}

module.exports = { getTodos, addTodo, updateTodo, deleteTodo };
