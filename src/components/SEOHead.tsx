import React, { useEffect } from 'react';
import { SEOMetadata } from '../utils/seo';

interface SEOHeadProps {
  seo: SEOMetadata;
}

export const SEOHead: React.FC<SEOHeadProps> = ({ seo }) => {
  useEffect(() => {
    // 1. Update Document Title
    if (seo.title) {
      document.title = seo.title;
    }

    // Helper to set or create meta tag
    const setMetaTag = (attributeName: string, attributeValue: string, content: string) => {
      let meta = document.querySelector(`meta[${attributeName}="${attributeValue}"]`) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attributeName, attributeValue);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Helper to set or create link tag
    const setLinkTag = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    // 2. Meta Description & Keywords
    if (seo.description) {
      setMetaTag('name', 'description', seo.description);
    }
    if (seo.keywords) {
      setMetaTag('name', 'keywords', seo.keywords);
    }

    // 3. Canonical Tag
    if (seo.canonicalUrl) {
      setLinkTag('canonical', seo.canonicalUrl);
    }

    // 4. OpenGraph Tags
    setMetaTag('property', 'og:title', seo.ogTitle || seo.title);
    setMetaTag('property', 'og:description', seo.ogDescription || seo.description);
    setMetaTag('property', 'og:url', seo.canonicalUrl);
    setMetaTag('property', 'og:type', seo.ogType || 'website');
    if (seo.ogImage) {
      setMetaTag('property', 'og:image', seo.ogImage);
      setMetaTag('property', 'og:image:secure_url', seo.ogImage);
    }

    // 5. Twitter Card Tags
    setMetaTag('name', 'twitter:title', seo.ogTitle || seo.title);
    setMetaTag('name', 'twitter:description', seo.ogDescription || seo.description);
    if (seo.ogImage) {
      setMetaTag('name', 'twitter:image', seo.ogImage);
    }

    // 6. Dynamic JSON-LD Structured Data
    const scriptId = 'dynamic-jsonld-schema';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (seo.jsonLd && seo.jsonLd.length > 0) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = scriptId;
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }

      // If single schema or multiple schemas
      const schemaData = seo.jsonLd.length === 1 ? seo.jsonLd[0] : {
        '@context': 'https://schema.org',
        '@graph': seo.jsonLd
      };
      scriptTag.textContent = JSON.stringify(schemaData, null, 2);
    } else if (scriptTag) {
      // Remove previous dynamic schema if current view doesn't provide one
      scriptTag.remove();
    }

    return () => {
      // Cleanup when unmounting or changing views
    };
  }, [seo]);

  return null;
};
