import { useEffect } from "react";

function setMeta(selector: string, attr: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    const [, key, name] = /\[(\w+)="([^"]+)"\]/.exec(selector) ?? [];
    if (key && name) el.setAttribute(key, name);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

export function usePageMeta(opts: {
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
}) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = opts.title;
    if (opts.description) setMeta('meta[name="description"]', "content", opts.description);
    setMeta('meta[property="og:title"]', "content", opts.ogTitle ?? opts.title);
    if (opts.ogDescription)
      setMeta('meta[property="og:description"]', "content", opts.ogDescription);
    return () => {
      document.title = prevTitle;
    };
  }, [opts.title, opts.description, opts.ogTitle, opts.ogDescription]);
}
