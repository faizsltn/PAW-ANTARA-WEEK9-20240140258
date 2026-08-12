# Todo API (Express + Sequelize + PostgreSQL)

Struktur MVC simple, auth pake session (bukan JWT), buat login & CRUD todo.

## Struktur folder
```
todo-api/
├── app.js                  # entry point
├── config/
│   └── database.js         # koneksi sequelize
├── models/
│   ├── user.model.js
│   ├── todo.model.js
│   ├── category.model.js   # kategori todo (fitur tambahan)
│   └── index.js
├── controllers/
│   ├── auth.controller.js
│   ├── todo.controller.js
│   └── category.controller.js
├── middlewares/
│   └── auth.middleware.js  # cek session login
├── routes/
│   ├── auth.routes.js
│   ├── todo.routes.js
│   └── category.routes.js
├── seeders/
│   └── seed.js              # data dummy user & todo
└── utils/
    └── response.js         # format response konsisten
```

## Cara install & jalanin

1. Bikin database postgres dulu:
```sql
CREATE DATABASE todo_db;
```

2. Copy `.env.example` jadi `.env`, terus sesuaikan kredensial DB kamu.

3. Install dependency:
```bash
npm install
```

4. Jalankan server:
```bash
npm run dev
```
Tabel `users` dan `todos` bakal otomatis kebuat pas server pertama kali nyala (lewat `sequelize.sync()`).

## Seeder (data dummy)

Buat isi database dengan data awal (2 user + beberapa todo), tinggal jalanin:
```bash
npm run seed
```
Ini bakal bikin (atau skip kalo udah ada, aman dijalanin berkali-kali):
- User `rizki` & `budi`, password sama-sama `password123`
- Beberapa todo dummy punya masing-masing user

Setelah itu langsung bisa login pake salah satu user di atas buat testing endpoint todo.

## Endpoint

### Auth
| Method | Endpoint            | Body                          | Keterangan          |
|--------|----------------------|--------------------------------|----------------------|
| POST   | /api/auth/register   | `{ username, password }`      | Daftar user baru     |
| POST   | /api/auth/login      | `{ username, password }`      | Login, bikin session |
| POST   | /api/auth/logout     | -                              | Logout               |

### Todo (wajib login / punya session valid)
| Method | Endpoint         | Body                                        | Keterangan            |
|--------|-------------------|----------------------------------------------|-------------------------|
| GET    | /api/todos        | - (query opsional `?category_id=`)           | List semua todo user, bisa difilter per kategori |
| POST   | /api/todos        | `{ title, category_id? }`                    | Tambah todo baru       |
| PUT    | /api/todos/:id    | `{ title?, is_done?, category_id? }`         | Update todo            |
| DELETE | /api/todos/:id    | -                                              | Hapus todo             |

`category_id` bersifat opsional (todo boleh gak punya kategori). Kalo dikirim, harus id kategori yang emang punya user yang login, kalo enggak balikin `404`.

### Category (wajib login / punya session valid)
Fitur tambahan untuk ngelompokin todo jadi beberapa kategori (mis. "Kuliah", "Kerja"). Kategori juga cuma keliatan sama pemiliknya, sama kayak todo.

| Method | Endpoint              | Body           | Keterangan                                      |
|--------|------------------------|-----------------|---------------------------------------------------|
| GET    | /api/categories        | -               | List semua kategori milik user                    |
| GET    | /api/categories/:id    | -               | Detail 1 kategori + list todo yang ada di dalamnya |
| POST   | /api/categories        | `{ name }`      | Tambah kategori baru (nama unik per user)          |
| PUT    | /api/categories/:id    | `{ name }`      | Update nama kategori                               |
| DELETE | /api/categories/:id    | -               | Hapus kategori (todo yang nempel jadi tanpa kategori, gak ikut kehapus) |

## Format response
Semua response pake format seragam:
```json
{
  "code": 200,
  "success": true,
  "message": "...",
  "data": { }
}
```

## Catatan
- Auth pake `express-session`, session id disimpan di cookie `connect.sid`. Kalo test pake Postman/Insomnia, pastiin cookie di-enable biar session kebawa antar-request.
- Kalo mau deploy production, ganti session store default (in-memory) ke store yang persist, misal `connect-pg-simple` biar session gak ilang tiap restart server.

Langkah 1: Login
Method: POST
URL: http://localhost:3000/api/auth/login
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/e7b223a8-dc69-43dd-b2d0-39d89e8bb35a" />

Langkah 2: Ambil Daftar Kategori
Method: GET
URL: http://localhost:3000/api/categories
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/c3922437-481c-4025-86ef-2d148769cd14" />

Langkah 3: Ambil Daftar Todo
Method: GET
URL: http://localhost:3000/api/todos
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/015e1713-9302-4966-9b4d-f75d38e291ba" />

SS tampilan
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/08de792f-22b7-46dd-8f11-8d334f05d666" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/14244109-78c2-425d-9240-bd5ec85516d0" />
