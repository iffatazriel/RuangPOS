import { useEffect, useState } from "react";
export function ProductImage({
  photo,
  emoji,
  name,
  className = "",
}: {
  photo?: Blob;
  emoji: string;
  name: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!photo) {
      setUrl(undefined);
      return;
    }
    const next = URL.createObjectURL(photo);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [photo]);
  return (
    <span className={`product-image ${className}`}>
      {url ? (
        <img src={url} alt={name} />
      ) : (
        <span className="emoji" aria-hidden="true">
          {emoji}
        </span>
      )}
    </span>
  );
}
