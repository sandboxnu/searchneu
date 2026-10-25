import { ImageZoom } from "fumadocs-ui/components/image-zoom";

interface DiagramProps {
  src: string;
  alt: string;
  width: number;
  height: number;
}

/**
 * Renders ERD for the SearchNEU database, scaled down.
 *
 * Can be clicked on and zoomed in for reading.
 */
export function Diagram({ src, alt, width, height }: DiagramProps) {
  return (
    <figure className="my-6">
      <figcaption className="text-fd-muted-foreground text-sm">
        {alt} &mdash; click to enlarge, or{" "}
        <a href={src} target="_blank" rel="noreferrer">
          open it full size
        </a>
        .
      </figcaption>
      <ImageZoom
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="border-fd-border bg-fd-card rounded-lg border mt-2"
      />
    </figure>
  );
}
