"use client";

type ItemImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
};

export function ItemImage({ src, alt, className = "" }: ItemImageProps) {
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-[var(--wash,#e8ddd2)] text-xs text-[var(--muted)] ${className}`}
        aria-hidden
      >
        Sem foto
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`object-cover ${className}`}
      loading="lazy"
    />
  );
}
