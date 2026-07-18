/** Captures beforeinstallprompt before React hydrates (Chrome can fire it early). */
export function PwaScript() {
  const code = `(function(){try{window.__logistikaPwaDeferred=null;window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__logistikaPwaDeferred=e;window.dispatchEvent(new CustomEvent('logistika:pwa-bip'));});}catch(e){}})();`;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: code }}
      suppressHydrationWarning
    />
  );
}
