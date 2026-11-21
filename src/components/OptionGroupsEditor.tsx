import type { OptionGroup } from "../lib/options";

function move<T>(items: T[], from: number, to: number) {
  const result = [...items];
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);
  return result;
}
export function OptionGroupsEditor({ groups, change }: { groups: OptionGroup[]; change: (groups: OptionGroup[]) => void }) {
  const update = (index: number, patch: Partial<OptionGroup>) => change(groups.map((g, i) => i === index ? { ...g, ...patch } : g));
  return <section className="option-editor">
    <h3>Varian & tambahan</h3>
    <p className="notice">Nama grup dan pilihan harus unik. Perubahan tidak mengubah transaksi lama.</p>
    {groups.map((group, index) => <fieldset key={index} className="option-group form-grid">
      <legend>Grup {index + 1}</legend>
      <label>Nama grup<input required maxLength={60} value={group.name} onChange={e => update(index, { name: e.target.value })} /></label>
      <div className="actions">
        <label className="checkbox"><input type="checkbox" checked={group.required} onChange={e => update(index, { required: e.target.checked })} />Wajib dipilih</label>
        <label className="checkbox"><input type="checkbox" checked={group.multiple} onChange={e => update(index, { multiple: e.target.checked })} />Boleh pilih beberapa</label>
      </div>
      {group.options.map((option, oi) => <div className="option-row" key={oi}>
        <label>Nama pilihan<input required maxLength={60} value={option.name} onChange={e => update(index, { options: group.options.map((o, j) => j === oi ? { ...o, name: e.target.value } : o) })} /></label>
        <label>Selisih harga (Rp)<input required type="number" step="1" value={option.priceDelta} onChange={e => update(index, { options: group.options.map((o, j) => j === oi ? { ...o, priceDelta: Number(e.target.value) } : o) })} /></label>
        <div className="actions">
          <button type="button" aria-label={`Naikkan pilihan ${oi + 1} grup ${index + 1}`} disabled={oi === 0} onClick={() => update(index, { options: move(group.options, oi, oi - 1) })}>↑</button>
          <button type="button" aria-label={`Turunkan pilihan ${oi + 1} grup ${index + 1}`} disabled={oi === group.options.length - 1} onClick={() => update(index, { options: move(group.options, oi, oi + 1) })}>↓</button>
          <button type="button" aria-label={`Hapus pilihan ${oi + 1} grup ${index + 1}`} onClick={() => update(index, { options: group.options.filter((_, j) => j !== oi) })}>Hapus</button>
        </div>
      </div>)}
      <button type="button" disabled={group.options.length >= 30} onClick={() => update(index, { options: [...group.options, { name: "", priceDelta: 0 }] })}>Tambah pilihan</button>
      <div className="actions">
        <button type="button" disabled={index === 0} onClick={() => change(move(groups, index, index - 1))}>Naikkan grup</button>
        <button type="button" disabled={index === groups.length - 1} onClick={() => change(move(groups, index, index + 1))}>Turunkan grup</button>
        <button type="button" className="danger-text" onClick={() => change(groups.filter((_, i) => i !== index))}>Hapus grup</button>
      </div>
    </fieldset>)}
    <button type="button" disabled={groups.length >= 12} onClick={() => change([...groups, { name: "", required: false, multiple: false, options: [{ name: "", priceDelta: 0 }] }])}>Tambah grup varian</button>
  </section>;
}
