import { useRef } from 'react';

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function EntryImages({ images = [], editable, onChange }) {
  const fileInputRef = useRef(null);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // allow re-selecting the same file later
    if (files.length === 0) return;
    const added = await Promise.all(
      files.map(async (file) => ({
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        dataUrl: await fileToDataUrl(file),
      }))
    );
    onChange([...images, ...added]);
  };

  const removeImage = (id) => {
    onChange(images.filter((img) => img.id !== id));
  };

  if (!editable && images.length === 0) return null;

  return (
    <div className="mb-6">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center mb-3">
          {images.map((img) => (
            <div key={img.id} className="relative group">
              <img src={img.dataUrl} alt={img.name} className="h-40 w-auto rounded-sm border border-ink/15 object-cover shadow-sm" />
              {editable && (
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute top-1 right-1 bg-maroon-darker/85 text-parchment text-[10px] rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Remove ${img.name}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {editable && (
        <div className="flex justify-center">
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="font-display text-[11px] uppercase tracking-wide px-3 py-1.5 border border-maroon/40 rounded-sm text-maroon-dark hover:bg-maroon/5"
          >
            + Add Image
          </button>
        </div>
      )}
    </div>
  );
}
