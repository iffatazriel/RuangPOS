# RuangPOS

Kasir lokal gratis dan terbuka untuk warung, kafe, dan UMKM Indonesia. Tanpa backend, tanpa akun, tanpa biaya langganan.

## Fitur
- Ringkasan harian, produk terlaris, dan grafik pendapatan 7/30 hari.
- Kasir dengan keranjang, diskon Rupiah, pajak, Tunai/QRIS/Transfer, kembalian, serta cetak struk 80mm (dapat diskalakan ke 58mm di dialog cetak).
- Kelola produk, kategori, stok opsional, riwayat, dan pembatalan dengan pengembalian stok.
- Foto dan deskripsi produk; foto diperkecil di perangkat menjadi maksimal 600px dan disertakan dalam cadangan JSON. Data lama tanpa foto tetap didukung.
- Tampilan terang/gelap, navigasi atas, pencarian dan urutan menu, serta keranjang drawer di tablet/ponsel.
- Profil usaha, cadangan JSON tervalidasi, dan data contoh 30 hari.
- PWA responsif, font lokal DM Sans, IndexedDB (Dexie skema versi 2, kompatibel dengan data lama), bekerja offline setelah kunjungan awal.

## Menggunakan PWA
Buka URL RuangPOS yang disediakan pengelola hosting Anda melalui HTTPS. Tambahkan produk di **Produk**, atau pilih **Isi data contoh** di halaman awal. Atur profil dan pajak di **Pengaturan**, lalu mulai menjual di **Kasir**. QRIS dan Transfer adalah pencatatan manual, bukan integrasi pembayaran.

Di Chrome/Edge pilih **Install aplikasi** di menu browser; di Safari iPhone pilih **Bagikan → Tambahkan ke Layar Utama**. Buka sekali saat online agar aset tersimpan, lalu aplikasi dapat digunakan tanpa internet. Tidak ada URL hosted resmi yang diasumsikan oleh proyek ini.

## Privasi & cadangan
**Semua data tetap di browser/perangkat Anda.** Tidak ada sinkronisasi cloud atau akun. Tiap browser dan alamat situs memiliki penyimpanan terpisah. Mode privat, pembersihan data browser, kerusakan perangkat, atau penghapusan aplikasi dapat menghilangkan data. Ekspor cadangan JSON secara rutin melalui Pengaturan dan simpan di lokasi aman. Impor mengganti seluruh data setelah konfirmasi. File cadangan berisi data usaha; jangan bagikan sembarangan. Untuk penggunaan bersama, perangkat harus dikelola sendiri: aplikasi ini tidak menyediakan autentikasi atau otorisasi.

## Self-host
Node.js 22 diperlukan.
```sh
npm ci && npm run build
```
Deploy isi `dist/` ke static host mana pun melalui HTTPS (atau localhost untuk pengembangan). Atur fallback semua route ke `index.html`. Aplikasi diasumsikan berada di root domain. Service worker menyimpan aset lokal untuk offline; deployment baru diperbarui otomatis saat online.

### Docker
```sh
docker build -t ruangpos .
docker run --rm -p 8080:80 ruangpos
```
Buka http://localhost:8080. Gunakan reverse proxy HTTPS untuk akses non-lokal. Nginx menyertakan SPA fallback. Data tidak disimpan dalam container, melainkan browser pengguna.

## Pengembangan
```sh
npm ci
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```
Stack: React, TypeScript strict, Vite, Tailwind CSS v4, React Router, Dexie, dan vite-plugin-pwa. Logika uang integer Rupiah, statistik, dan validasi backup berada di `src/lib/logic.ts`; database dan transaksi atomik di `src/lib/db.ts`. Pengujian menggunakan Vitest. Pajak dibulatkan ke Rupiah terdekat setelah diskon; diskon dibatasi subtotal. Transaksi batal tetap tersimpan tetapi tidak dihitung dalam statistik.

## Kontribusi
Buat issue untuk mendiskusikan perubahan besar. Fork, buat branch fitur, sertakan pengujian untuk logika baru, jalankan seluruh pemeriksaan di atas, lalu ajukan pull request. Pertahankan antarmuka Bahasa Indonesia, akses offline, dan privasi lokal. Jangan sertakan data usaha asli atau cadangan dalam kontribusi.

## Lisensi
GNU Affero General Public License v3.0 (AGPL-3.0), lihat [LICENSE](LICENSE). Perubahan yang disediakan melalui jaringan juga tunduk pada kewajiban sumber AGPL.
