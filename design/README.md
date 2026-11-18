# Opsi Desain Website Aditek

HTML statis, buka `index.html` di browser. Disusun dengan metode skill [Hallmark](https://github.com/nutlope/hallmark).

| Halaman | File | Endpoint rencana |
|---|---|---|
| Home | `index.html` | `/` |
| Security | `security-system/index.html` | `/security-system` |
| ERP | `erp-system/index.html` | `/erp-system` |
| Workplace (Spaces) | `workplace-management/index.html` | `/workplace-management` |

## Arah desain

- **Tema:** Wayfind, gaya papan petunjuk/peta jaringan: kertas abu dingin, tinta biru-hitam, Chivo Mono, garis 2px, sudut siku.
- **Konsep:** tiga sistem digambar sebagai tiga "jalur" satu jaringan, masing-masing punya warna:
  biru = Keamanan, kuning = ERP, hijau = Workplace.
- **Signature:** papan "satu tap kartu" di hero Home: satu kejadian mengalir ke tiga sistem.
- **Visual:** layar produk dibangun dalam HTML (contoh data), tanpa foto stok. Bisa diganti screenshot asli nanti.

## Yang masih perlu diisi

| Slot | Isi |
|---|---|
| `data-fill="email"` | Email kontak resmi |
| `data-fill="whatsapp"` | Nomor WhatsApp bisnis |
| `data-slot="hero-board"` | Screenshot dashboard/log asli (opsional) |
| `data-slot="security-console"` | Screenshot konsol keamanan asli (opsional) |
| `data-slot="erp-trail"` | Screenshot ERP asli (opsional) |
| `data-slot="spaces-booking"` | Screenshot Spaces asli: form booking ruang |

Semua angka, jam, nama ruang, dan nomor dokumen di halaman adalah **contoh**, bukan klaim.
