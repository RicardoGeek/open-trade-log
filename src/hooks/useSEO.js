import { useEffect } from 'react';

export function useSEO({ title, description }) {
  useEffect(() => {
    const defaultTitle = 'TradeLog - Professional Trading Journal';
    const defaultDesc = 'A powerful trading journal to track, analyze, and optimize your trading performance. Seamlessly log trades, utilize technical indicators, and manage your portfolio.';
    
    document.title = title ? `${title} | TradeLog` : defaultTitle;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description || defaultDesc);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = description || defaultDesc;
      document.head.appendChild(meta);
    }

    // Update Open Graph tags for rich previews
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', document.title);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', description || defaultDesc);

  }, [title, description]);
}
