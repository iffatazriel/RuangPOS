import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Trash2 } from "lucide-react";
import { db } from "../lib/db";
import { rupiah, type Product } from "../lib/logic";
import { Title } from "../components/Title";
import { Modal } from "../components/Modal";
import { productChanges } from "../lib/product";

export function Produk() {
  const products = useLiveQuery(() => db.products.toArray()) ?? [];
  const categories = useLiveQuery(() => db.categories.toArray()) ?? [];
  const [edit, setEdit] = useState<Product | null>(null);
  const [originalStock, setOriginalStock] = useState<Product["stock"]>(null);
  const [cat, setCat] = useState("");
  const [manage, setManage] = useState(false);
  const [query, setQuery] = useState("");
  return (
    <>
      <Title eyebrow="KELOLA YANG ANDA TAWARKAN" title="Produk">
        <div className="actions">
          <button onClick={() => setManage(true)}>Kelola kategori</button>
          <button
            className="primary"
            onClick={() =>
              setEdit({
                id: crypto.randomUUID(),
                name: "",
                category: categories[0]?.id ?? "",
                price: 0,
                stock: null,
                emoji: "☕",
                active: true,
              })
            }
          >
            <Plus size={17} /> Tambah produk
          </button>
        </div>
      </Title>
      <div className="panel">
        <div className="section-heading">
          <h2>
            Daftar produk <span className="subtle">({products.length})</span>
          </h2>
          <input
            aria-label="Cari daftar produk"
            placeholder="Cari produk..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama produk</th>
                <th>Kategori</th>
                <th>Harga</th>
                <th>Stok</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products
                .filter((p) =>
                  p.name.toLowerCase().includes(query.toLowerCase()),
                )
                .map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="table-emoji">{p.emoji}</span>
                      <strong>{p.name}</strong>
                    </td>
                    <td>
                      {categories.find((c) => c.id === p.category)?.name ??
                        "Lainnya"}
                    </td>
                    <td>{rupiah(p.price)}</td>
                    <td>{p.stock ?? "∞"}</td>
                    <td>
                      <span className={"status " + (!p.active ? "muted" : "")}>
                        {p.active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => { setOriginalStock(p.stock); setEdit(p); }}>Edit</button>{" "}
                      <button
                        aria-label={"Hapus " + p.name}
                        onClick={() => {
                          if (
                            confirm(
                              `Hapus ${p.name}? Riwayat transaksi tetap disimpan.`,
                            )
                          )
                            void db.products.delete(p.id);
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {!products.length && (
            <p className="no-data">
              Belum ada produk. Tambahkan produk pertama Anda.
            </p>
          )}
        </div>
      </div>
      {edit && (
        <Modal
          title={
            products.some((p) => p.id === edit.id)
              ? "Edit produk"
              : "Tambah produk"
          }
          close={() => setEdit(null)}
        >
          <form
            className="form-grid"
            onSubmit={async (e) => {
              e.preventDefault();
              if (products.some((p) => p.id === edit.id)) {
                await db.products.update(edit.id, productChanges(originalStock, edit));
              } else {
                await db.products.add(edit);
              }
              setEdit(null);
            }}
          >
            <label>
              Nama produk
              <input
                required
                value={edit.name}
                onChange={(e) => setEdit({ ...edit, name: e.target.value })}
              />
            </label>
            <label>
              Kategori
              <select
                value={edit.category}
                onChange={(e) => setEdit({ ...edit, category: e.target.value })}
              >
                <option value="">Lainnya</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Harga (Rp)
              <input
                required
                type="number"
                min="0"
                step="1"
                value={edit.price}
                onChange={(e) =>
                  setEdit({ ...edit, price: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Stok (kosong = tidak dibatasi)
              <input
                type="number"
                min="0"
                step="1"
                value={edit.stock ?? ""}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    stock:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              Emoji
              <input
                required
                maxLength={12}
                value={edit.emoji}
                onChange={(e) => setEdit({ ...edit, emoji: e.target.value })}
              />
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={edit.active}
                onChange={(e) => setEdit({ ...edit, active: e.target.checked })}
              />{" "}
              Produk aktif
            </label>
            <button className="primary">Simpan produk</button>
          </form>
        </Modal>
      )}
      {manage && (
        <Modal title="Kelola kategori" close={() => setManage(false)}>
          <form
            className="actions"
            onSubmit={async (e) => {
              e.preventDefault();
              if (cat.trim()) {
                await db.categories.add({
                  id: crypto.randomUUID(),
                  name: cat.trim(),
                });
                setCat("");
              }
            }}
          >
            <input
              required
              placeholder="Nama kategori baru"
              value={cat}
              onChange={(e) => setCat(e.target.value)}
            />
            <button className="primary">Tambah</button>
          </form>
          {categories.map((c) => (
            <div className="category-row" key={c.id}>
              <span>{c.name}</span>
              <div>
                <button
                  onClick={() => {
                    const name = prompt("Nama kategori", c.name);
                    if (name?.trim())
                      void db.categories.update(c.id, { name: name.trim() });
                  }}
                >
                  Ubah
                </button>{" "}
                <button
                  onClick={() => {
                    if (products.some((p) => p.category === c.id))
                      alert("Pindahkan produk ke kategori lain dahulu.");
                    else if (confirm("Hapus kategori ini?"))
                      void db.categories.delete(c.id);
                  }}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </Modal>
      )}
    </>
  );
}
