import { Product, Category } from '../types';

export const BASE_URL = typeof window !== 'undefined'
  ? window.location.origin
  : 'https://grfurniturelahore.com';

export const BUSINESS_INFO = {
  name: 'GR Furniture Lahore',
  alternateNames: [
    'GR Furniture',
    'GR Furniture Factory',
    'GR Furniture Lahore Wholesale Dealer',
    'جی آر فرنیچر لاہور'
  ],
  phone: '+923446784419',
  phoneDisplay: '0344 6784419',
  address: 'Chungi Amar Sidhu, Main Ferozepur Road',
  city: 'Lahore',
  region: 'Punjab',
  postalCode: '54000',
  country: 'PK',
  currency: 'PKR',
  priceRange: '₨₨₨',
  geo: {
    latitude: 31.4647,
    longitude: 74.3644,
  },
  openingHours: 'Mo-Sa 10:00-21:00',
  mapUrl: 'https://maps.app.goo.gl/eidhnxs8N86PB2aN7',
  youtube: 'https://youtube.com/@grfurniturefactory?si=9y-BxOetXKcMSaTe',
  facebook: 'https://www.facebook.com/p/GR-Furniture-Lahore-100064194690152/',
  tiktok: 'https://www.tiktok.com/@grfurniturelahore1?_r=1&_t=ZS-99btFwCHWp3',
};

export const CORE_KEYWORDS = [
  'Furniture',
  'Furniture in Lahore',
  'Best furniture in Lahore',
  'Furniture shop in Lahore',
  'Furniture store in Lahore',
  'Good quality furniture',
  'Premium furniture',
  'Affordable furniture',
  'Bedroom furniture',
  'Living room furniture',
  'Bed sets',
  'Beds',
  'Sofa sets',
  'Dining tables',
  'Wardrobes',
  'Dressing tables',
  'GR Furniture',
  'GR Furniture Lahore',
  'GR Furniture Factory',
  'gr furniture',
  'Best furniture shop',
  'Furniture near me',
  'Furniture shops near me',
  // Urdu keywords
  'فرنیچر',
  'لاہور فرنیچر',
  'لاہور میں فرنیچر',
  'بہترین فرنیچر',
  'فرنیچر کی دکان',
  'بیڈ سیٹ',
  'صوفہ سیٹ',
  'اچھا فرنیچر',
  'سستا فرنیچر',
  // Roman Urdu search keywords
  'furniture ki dukaan',
  'Lahore furniture',
  'achha furniture',
  'best furniture Lahore',
  'bed set Lahore',
  'sofa set Lahore',
  'sasta furniture lahore',
  'lakri ka furniture'
].join(', ');

export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: 'website' | 'product' | 'article';
  jsonLd?: Record<string, any>[];
}

// 1. Default Homepage SEO
export function getHomeSEO(): SEOMetadata {
  const canonicalUrl = `${BASE_URL}/`;
  const logoUrl = `${BASE_URL}/logo.png`;
  const heroImage = `${BASE_URL}/logo.jpg`;

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'FurnitureStore',
    '@id': `${canonicalUrl}#localbusiness`,
    name: BUSINESS_INFO.name,
    alternateName: BUSINESS_INFO.alternateNames,
    description: 'Wholesale dealer & master woodcraft factory in Lahore. Handcrafted solid Sheesham beds, velvet sofas, marble dining tables, and bespoke luxury furniture with factory-direct pricing.',
    url: canonicalUrl,
    logo: {
      '@type': 'ImageObject',
      url: logoUrl,
      caption: 'GR Furniture Lahore Official Logo'
    },
    image: [heroImage, logoUrl],
    telephone: BUSINESS_INFO.phone,
    priceRange: BUSINESS_INFO.priceRange,
    currenciesAccepted: BUSINESS_INFO.currency,
    paymentAccepted: 'Cash, Bank Transfer, WhatsApp Order',
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS_INFO.address,
      addressLocality: BUSINESS_INFO.city,
      addressRegion: BUSINESS_INFO.region,
      postalCode: BUSINESS_INFO.postalCode,
      addressCountry: BUSINESS_INFO.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: BUSINESS_INFO.geo.latitude,
      longitude: BUSINESS_INFO.geo.longitude,
    },
    hasMap: BUSINESS_INFO.mapUrl,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '10:00',
        closes: '21:00'
      }
    ],
    areaServed: [
      { '@type': 'City', name: 'Lahore' },
      { '@type': 'AdministrativeArea', name: 'Punjab' },
      { '@type': 'Country', name: 'Pakistan' }
    ],
    sameAs: [
      BUSINESS_INFO.youtube,
      BUSINESS_INFO.facebook,
      BUSINESS_INFO.tiktok
    ]
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${canonicalUrl}#website`,
    url: canonicalUrl,
    name: 'GR Furniture Lahore',
    alternateName: [
      'GR Furniture',
      'GR Furniture Factory',
      'GR Furniture Lahore Wholesale Dealer',
      'جی آر فرنیچر لاہور'
    ],
    description: 'Official Online Showroom of GR Furniture Lahore - Factory Direct Solid Wood & Bespoke Luxury Furniture.',
    inLanguage: ['en-PK', 'ur-PK'],
    publisher: {
      '@id': `${canonicalUrl}#localbusiness`
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/shop?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Where is GR Furniture showroom and factory located in Lahore?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'GR Furniture showroom and master workshop is located on Main Ferozepur Road (Chungi Amar Sidhu), Lahore, Punjab, Pakistan. Customers are welcome to visit our workshop to inspect wood seasoning, carving, and upholstery.'
        }
      },
      {
        '@type': 'Question',
        name: 'Do you offer custom furniture sizing and fabric selection?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, GR Furniture specializes in bespoke furniture. You can customize dimensions, timber species (Sheesham, Ash Wood, Solid Teak), fabric swatches (Turkish velvet, suede, textured linen), and polish finishes for any bed set, sofa set, or dining table.'
        }
      },
      {
        '@type': 'Question',
        name: 'Do you deliver furniture across Lahore and other cities in Pakistan?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! We provide safe doorstep delivery with professional installation across all areas of Lahore (DHA, Bahria Town, Gulberg, Model Town, Johar Town, Cantt, Wapda Town) and scheduled logistics across Punjab and Pakistan.'
        }
      },
      {
        '@type': 'Question',
        name: 'Why are GR Furniture prices lower than typical retail stores in Lahore?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Because we are wholesale woodcraft manufacturers and direct factory producers. By purchasing directly from our Lahore workshop, you bypass retail middleman markups and expensive showroom overheads.'
        }
      }
    ]
  };

  return {
    title: 'GR Furniture Lahore | Wholesale Dealer & Luxury Handcrafted Furniture',
    description: 'Official showroom of GR Furniture Lahore. Direct factory rates on handcrafted solid wood bed sets, luxury velvet sofas, marble dining tables & custom furniture in Lahore, Pakistan. لاہور میں بہترین فرنیچر.',
    keywords: CORE_KEYWORDS,
    canonicalUrl,
    ogTitle: 'GR Furniture Lahore | Wholesale Dealer & Luxury Furniture',
    ogDescription: 'Direct factory pricing on solid wood beds, velvet sofas, dining suites, and bespoke luxury furniture in Lahore. Call/WhatsApp 0344 6784419.',
    ogImage: heroImage,
    ogType: 'website',
    jsonLd: [localBusinessSchema, websiteSchema, faqSchema]
  };
}

// 2. Dynamic Product SEO
export function generateProductSEO(product: Product, categoryName?: string): SEOMetadata {
  const prodSlug = product.slug || product.id;
  const canonicalUrl = `${BASE_URL}/furniture/${prodSlug}`;
  const mainImage = product.images && product.images.length > 0
    ? (product.images[0].startsWith('http') ? product.images[0] : `${BASE_URL}${product.images[0]}`)
    : `${BASE_URL}/logo.jpg`;

  const catTitle = categoryName || product.category.replace(/-/g, ' ');
  const formattedPrice = `PKR ${product.price.toLocaleString()}`;

  // Clean, natural bilingual meta description with zero spam
  const briefDesc = product.description
    ? product.description.replace(/\s+/g, ' ').slice(0, 140)
    : `Handcrafted in solid wood with premium polish and master upholstery`;

  const metaDescription = `Buy ${product.name} (${formattedPrice}) at GR Furniture Lahore. ${briefDesc}. لاہور میں بیڈ سیٹ اور صوفہ سیٹ. Direct factory rates & safe delivery across Lahore, Pakistan.`;

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${canonicalUrl}#product`,
    name: product.name,
    image: product.images.map((img) => (img.startsWith('http') ? img : `${BASE_URL}${img}`)),
    description: product.description || `${product.name} - Handcrafted furniture piece by GR Furniture Lahore`,
    sku: product.id,
    mpn: product.id,
    brand: {
      '@type': 'Brand',
      name: 'GR Furniture'
    },
    material: product.material || 'Solid Seasoned Wood, High-Density Foam & Premium Upholstery',
    category: catTitle,
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'PKR',
      price: product.price,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'FurnitureStore',
        name: 'GR Furniture Lahore',
        telephone: BUSINESS_INFO.phone,
        url: BASE_URL,
        address: {
          '@type': 'PostalAddress',
          streetAddress: BUSINESS_INFO.address,
          addressLocality: BUSINESS_INFO.city,
          addressCountry: BUSINESS_INFO.country
        }
      }
    }
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${BASE_URL}/`
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: catTitle,
        item: `${BASE_URL}/category/${product.category}`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: canonicalUrl
      }
    ]
  };

  return {
    title: `${product.name} | Luxury Furniture Lahore | GR Furniture`,
    description: metaDescription,
    keywords: `${product.name}, ${product.name} Lahore, ${catTitle} Lahore, furniture in Lahore, GR Furniture, bed sets Lahore, sofa sets Lahore, ${product.material || 'solid wood furniture'}, فرنیچر لاہور`,
    canonicalUrl,
    ogTitle: `${product.name} - ${formattedPrice} | GR Furniture Lahore`,
    ogDescription: metaDescription,
    ogImage: mainImage,
    ogType: 'product',
    jsonLd: [productSchema, breadcrumbSchema]
  };
}

// 3. Dynamic Category SEO
export function generateCategorySEO(category: Category, count?: number): SEOMetadata {
  const catSlug = category.slug || category.id;
  const canonicalUrl = `${BASE_URL}/category/${catSlug}`;
  const image = category.image && category.image.startsWith('http')
    ? category.image
    : (category.image ? `${BASE_URL}${category.image}` : `${BASE_URL}/logo.jpg`);

  const title = `${category.name} in Lahore | Factory Direct Luxury Furniture | GR Furniture`;
  const description = `Shop handcrafted ${category.name.toLowerCase()} at GR Furniture Lahore. ${category.description ? category.description.slice(0, 130) + '...' : 'Solid wood framing, custom velvet upholstery & export-grade finishes.'} لاہور میں فرنیچر کی دکان. Factory direct prices with safe delivery across Lahore & Punjab.`;

  const categorySchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${canonicalUrl}#category`,
    url: canonicalUrl,
    name: `${category.name} Collection - GR Furniture Lahore`,
    description: category.description || `Handcrafted ${category.name} available at factory wholesale rates in Lahore, Pakistan.`,
    isPartOf: {
      '@type': 'WebSite',
      url: `${BASE_URL}/`
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `${BASE_URL}/`
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: category.name,
          item: canonicalUrl
        }
      ]
    }
  };

  return {
    title,
    description,
    keywords: `${category.name} Lahore, ${category.name} in Lahore, best ${category.name.toLowerCase()} in Lahore, furniture shop in Lahore, affordable ${category.name.toLowerCase()}, GR Furniture Lahore, فرنیچر لاہور, ${category.name.toLowerCase()} ki dukaan`,
    canonicalUrl,
    ogTitle: title,
    ogDescription: description,
    ogImage: image,
    ogType: 'website',
    jsonLd: [categorySchema]
  };
}

// 4. Shop Page SEO
export function getShopSEO(searchQuery?: string): SEOMetadata {
  const canonicalUrl = `${BASE_URL}/shop`;
  const title = searchQuery
    ? `Search: "${searchQuery}" | Furniture in Lahore | GR Furniture`
    : `Furniture Collections in Lahore | Beds, Sofas, Dining Sets | GR Furniture`;
  
  const description = `Explore all furniture collections at GR Furniture Lahore. Solid wood king bed sets, 7-seater velvet sofas, marble dining tables, wardrobes & vanity dressers at wholesale factory rates in Lahore, Pakistan.`;

  return {
    title,
    description,
    keywords: CORE_KEYWORDS,
    canonicalUrl,
    ogTitle: title,
    ogDescription: description,
    ogImage: `${BASE_URL}/logo.jpg`,
    ogType: 'website'
  };
}
