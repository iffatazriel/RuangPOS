import { useState } from "react";
import { rupiah, type Product, type Line } from "../lib/logic";
import { optionLine } from "../lib/options";
import { Modal } from "./Modal";

export function OptionPicker({ product, add, close }: { product: Product; add: (line: Line) => void; close: () => void }) {
  const [choices, setChoices] = useState<number[][]>([]);
  const [error, setError] = useState("");
  const groups = product.optionGroups ?? [];
  const price = product.price + groups.reduce((sum, g, gi) => sum + g.options.reduce((n, o, oi) => n + (choices[gi]?.includes(oi) ? o.priceDelta : 0), 0), 0);
  return <Modal title={`Pilih varian · ${product.name}`} close={close}>
    <form className="form-grid" onSubmit={e => {
      e.preventDefault();
      try { add(optionLine(product, choices)); close(); }
      catch (error) { setError((error as Error).message); }
    }}>
      {groups.map((group, gi) => <fieldset className="option-group form-grid" key={gi}>
        <legend>{group.name} · {group.required ? "Wajib" : "Opsional"} · {group.multiple ? "Boleh beberapa" : "Pilih satu"}</legend>
        {group.options.map((option, oi) => <label className="checkbox option-choice" key={oi}>
          <input type={group.multiple ? "checkbox" : "radio"} name={`group-${gi}`} checked={choices[gi]?.includes(oi) ?? false} onChange={e => {
            const next = groups.map((_, i) => choices[i] ?? []);
            next[gi] = group.multiple ? e.target.checked ? [...next[gi], oi] : next[gi].filter(i => i !== oi) : [oi];
            setChoices(next); setError("");
          }} />
          {option.name} {option.priceDelta !== 0 && <span>{option.priceDelta > 0 ? "+" : ""}{rupiah(option.priceDelta)}</span>}
        </label>)}
        {!group.multiple && !group.required && <button type="button" onClick={() => setChoices(groups.map((_, i) => i === gi ? [] : choices[i] ?? []))}>Tanpa {group.name}</button>}
      </fieldset>)}
      <p className="grand-total">Harga satuan <b>{rupiah(price)}</b></p>
      {error && <p role="alert" className="error">{error}</p>}
      <button className="primary">Tambah ke keranjang</button>
    </form>
  </Modal>;
}
