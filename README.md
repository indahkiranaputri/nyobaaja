# 🌟 Indah's Beauté Atelier

> Proyek tugas akhir untuk website toko produk kecantikan dengan tampilan modern, fitur belanja, checkout, dan halaman admin.

Website ini saat ini dikembangkan sebagai aplikasi frontend statis yang berjalan penuh tanpa Node.js. Semua data utama disimpan di browser melalui localStorage, sehingga bisa dibuka langsung dari GitHub Pages atau file lokal.

Link Admin: [https://indahkiranaputri.github.io/nyobaaja/admin.html](https://indahkiranaputri.github.io/nyobaaja/admin.html)

Link Customer: [https://indahkiranaputri.github.io/nyobaaja/customer.html](https://indahkiranaputri.github.io/nyobaaja/customer.html) (atau cust.html)

## Fitur Utama

- Katalog produk dan halaman detail produk
- Keranjang belanja dengan update jumlah dan hapus barang
- Checkout sederhana dengan formulir data pengiriman
- Halaman admin untuk mengelola produk dan melihat pesanan
- Data produk, keranjang, dan pesanan tersimpan di browser secara lokal
- Foto produk dipastikan tampil dari folder image di repository

## Struktur File Utama
Pastikan upload semua file berikut ke root repository GitHub:

- index.html
- keranjang.html
- checkout.html
- order_success.html
- detail_produk.html
- login.html
- register.html
- profile.html
- tracking.html
- admin_dashboard.html
- admin_produk.html
- admin_pesanan.html
- admin_tambah_produk.html
- admin_edit_produk.html
- admin_login.html
- css/
- js/
- image/

> Catatan penting: folder gambar berada di image/, bukan images/.

## Cara Upload ke GitHub Pages

1. Buka repository GitHub baru.
2. Klik Add file -> Upload files.
3. Seret seluruh isi folder indah ke area upload.
4. Pastikan index.html, css/, js/, dan image/ ikut terupload.
5. Tambahkan pesan commit, misalnya Upload website files.
6. Klik Commit changes.

## Aktifkan GitHub Pages

1. Buka Settings di repository GitHub.
2. Pilih Pages.
3. Pada Source, pilih branch main dan folder /(root).
4. Simpan.
5. Tunggu beberapa menit hingga website muncul.

## Catatan Penting

- Website ini sudah siap dipakai sebagai situs statis tanpa Node.js.
- Data tersimpan di localStorage per browser, sehingga tidak sinkron antar perangkat.
- Jika ingin sinkronisasi antar perangkat, maka butuh backend/server di kemudian hari.

## Akses Admin

Gunakan akun admin berikut saat membuka halaman admin:

- Username: admin
- Password: admin123

## Menjalankan Secara Lokal

Anda bisa membuka file index.html langsung di browser, atau memakai server statis sederhana jika ingin melihat lebih dekat perilaku URL relatif.

## Catatan Tambahan

Jika Anda ingin mengubah tampilan, menambah produk, atau mengubah data, Anda bisa melakukannya melalui halaman admin atau mengedit file di folder js/ dan image/.
