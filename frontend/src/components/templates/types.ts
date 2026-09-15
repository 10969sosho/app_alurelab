export interface ProductVariant {
  id: string;
  sku: string;
  title: string;
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  title: string;
  category: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price?: number;
  images: string[];
  variants: ProductVariant[];
  details?: string[];
}

export interface NavMenuItem {
  id: string;
  label: string;
  url: string;
  enabled: boolean;
  isExternal?: boolean;
}

export interface CollectionCardSetting {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  image: string;
  link: string;
}

export interface CmsBranding {
  storeName?: string;
  tagline?: string;
  fontHeading?: 'bebas' | 'playfair' | 'montserrat' | 'inter' | 'serif';
  fontBody?: 'inter' | 'sans' | 'mono';
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
}

export interface CmsHero {
  badgeText?: string;
  headline?: string;
  description?: string;
  bannerImage?: string;
  ctaText?: string;
  ctaLink?: string;
}

export interface CmsNavigation {
  menuItems: NavMenuItem[];
  socialLinks?: {
    instagram?: string;
    whatsapp?: string;
    tiktok?: string;
  };
}

export interface CmsSections {
  showAnnouncementBar?: boolean;
  showHero?: boolean;
  showCollections?: boolean;
  showFeaturedProducts?: boolean;
  showAbout?: boolean;
  showLookbook?: boolean;
  showTrustGuarantee?: boolean;
}

export interface CmsHighlights {
  announcementText?: string;
  featuredCategory?: string;
  collections?: CollectionCardSetting[];
  aboutHeading?: string;
  aboutStory?: string;
  lookbookHeading?: string;
  lookbookImages?: string[];
}

export interface CmsSettings {
  template?: 'editorial' | 'modern';
  branding?: CmsBranding;
  hero?: CmsHero;
  navigation?: CmsNavigation;
  sections?: CmsSections;
  highlights?: CmsHighlights;
  [key: string]: any;
}

export interface StoreData {
  storeName: string;
  tagline: string;
  categories: string[];
  products: Product[];
  logo_url?: string;
  phone_number?: string;
  address_detail?: string;
  settings?: CmsSettings;
}

export interface TemplateProps {
  storeSlug: string;
  store: StoreData;
  buyer: any;
  onOpenCart: () => void;
  onOpenProfile: () => void;
  onOpenTrackOrder: () => void;
  onAddToCart: (product: Product, variant: ProductVariant) => void;
  getTotalItems: () => number;
}
