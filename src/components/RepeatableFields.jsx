import { PageInput, PageTextarea } from './PageField.jsx';

// A repeatable list of multi-field rows (e.g. { name, desc } for traits/actions,
// { trigger, effect } for custom moves, { id, relationship } for related entries).
export function RepeatableFields({ items, fields, onChange, addLabel = '+ Add', emptyLabel }) {
  const update = (idx, key, value) => {
    const next = [...items];
    next[idx] = { ...next[idx], [key]: value };
    onChange(next);
  };
  const add = () => onChange([...items, Object.fromEntries(fields.map((f) => [f.key, '']))]);
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));

  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 && emptyLabel && <div className="text-[13px] italic text-ink/40">{emptyLabel}</div>}
      {items.map((item, idx) => (
        <div key={idx} className="border-b border-ink/10 pb-3">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 flex flex-col gap-1.5">
              {fields.map((f) =>
                f.type === 'textarea' ? (
                  <PageTextarea
                    key={f.key}
                    value={item[f.key] || ''}
                    onChange={(e) => update(idx, f.key, e.target.value)}
                    placeholder={f.placeholder}
                    rows={f.rows || 2}
                    className={f.className}
                  />
                ) : (
                  <PageInput
                    key={f.key}
                    value={item[f.key] || ''}
                    onChange={(e) => update(idx, f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className={f.className}
                  />
                )
              )}
            </div>
            <button onClick={() => remove(idx)} className="text-[11px] text-ink/40 hover:text-maroon-dark italic mt-1 whitespace-nowrap">
              remove
            </button>
          </div>
        </div>
      ))}
      <button onClick={add} className="self-start text-[12px] font-display uppercase tracking-wide text-maroon-dark/70 hover:text-maroon-dark">
        {addLabel}
      </button>
    </div>
  );
}

// A repeatable list of plain strings (e.g. flavor quotes, quest hooks).
export function RepeatableStrings({ items, onChange, placeholder, addLabel = '+ Add', emptyLabel }) {
  const update = (idx, value) => {
    const next = [...items];
    next[idx] = value;
    onChange(next);
  };
  const add = () => onChange([...items, '']);
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));

  return (
    <div className="flex flex-col gap-2">
      {items.length === 0 && emptyLabel && <div className="text-[13px] italic text-ink/40">{emptyLabel}</div>}
      {items.map((val, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <PageInput value={val} onChange={(e) => update(idx, e.target.value)} placeholder={placeholder} />
          <button onClick={() => remove(idx)} className="text-[11px] text-ink/40 hover:text-maroon-dark italic whitespace-nowrap">
            remove
          </button>
        </div>
      ))}
      <button onClick={add} className="self-start text-[12px] font-display uppercase tracking-wide text-maroon-dark/70 hover:text-maroon-dark">
        {addLabel}
      </button>
    </div>
  );
}
