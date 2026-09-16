import React, { useState } from 'react';
import { ProductCard } from '../components/ProductCard';
import { Product, Category } from '../types';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { formatPKR } from '../context/CartContext';

interface ShopViewProps {
  products: Product[];
  categories: Category[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  onSelectProduct: (product: Product) => void;
  onQuickOrder: (product: Product) => void;
}

export const ShopView: React.FC<ShopViewProps> = ({
  products,
  categories,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  onSelectProduct,
  onQuickOrder,
}) => {
  const maxProductPrice = Math.max(...products.map((p) => p.price), 350000);
  const minProductPrice = Math.min(...products.map((p) => p.price), 20000);

  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(maxProductPrice);

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = product.price <= maxPriceFilter;
    return matchesCategory && matchesSearch && matchesPrice;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setMaxPriceFilter(maxProductPrice);
    setSortBy('newest');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 bg-[#FAF7F2]">
      {/* Header & Breadcrumb */}
      <div className="mb-8 sm:mb-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-2 text-xs text-[#82756A]">
          <span className="hover:text-[#231B15] cursor-pointer" onClick={() => setSelectedCategory('all')}>
            Home
          </span>
          <span className="text-[#C4B29E]">/</span>
          <span className="text-[#231B15] font-medium capitalize">
            {selectedCategory === 'all'
              ? 'Furniture in Lahore'
              : categories.find((c) => c.id === selectedCategory)?.name || 'Category'}
          </span>
        </nav>

        <span className="text-[11px] uppercase tracking-[0.2em] text-[#8C7A6B] font-medium block mb-1">
          GR Furniture Lahore • فیکٹری ریٹ پر فرنیچر
        </span>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h1 className="text-2xl sm:text-4xl font-serif-luxury font-normal text-[#231B15] tracking-tight">
            {selectedCategory === 'all'
              ? 'Luxury Furniture in Lahore'
              : `${categories.find((c) => c.id === selectedCategory)?.name || 'Furniture'} Collection`}
          </h1>
          <span className="text-xs sm:text-sm text-[#82756A]">
            {sortedProducts.length} items available
          </span>
        </div>

        {/* Dynamic Category Description */}
        {selectedCategory !== 'all' && (
          <p className="mt-2 text-xs sm:text-sm text-[#6A5E54] leading-relaxed max-w-3xl font-light">
            {categories.find((c) => c.id === selectedCategory)?.description ||
              `Handcrafted solid wood ${selectedCategory.replace(/-/g, ' ')} manufactured with seasoned timber, Turkish velvet fabrics, and export polish at direct workshop rates in Lahore.`}
          </p>
        )}
      </div>

      {/* Clean Filter Controls */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8E1D7] mb-8 space-y-5 shadow-2xs">
        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#9E9083] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search furniture by name..."
              className="w-full pl-10 pr-8 py-2 bg-[#FAF7F2] border border-[#E8E1D7] rounded-xl text-xs sm:text-sm text-[#231B15] placeholder:text-[#9E9083] focus:outline-hidden focus:border-[#6E4D2E]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E9083] hover:text-[#231B15]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#9E9083]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#FAF7F2] border border-[#E8E1D7] rounded-xl px-3 py-2 text-xs sm:text-sm text-[#4A3E36] focus:outline-hidden focus:border-[#6E4D2E] cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name (A to Z)</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none momentum-scroll">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#6E4D2E] text-white shadow-xs'
                : 'bg-[#FAF7F2] text-[#5C5046] hover:text-[#231B15] border border-[#E8E1D7]'
            }`}
          >
            All ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter((p) => p.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-[#6E4D2E] text-white shadow-xs'
                    : 'bg-[#FAF7F2] text-[#5C5046] hover:text-[#231B15] border border-[#E8E1D7]'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Quiet Price Slider */}
        <div className="pt-2 border-t border-[#EFE9DF] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#5C5046]">
            <span>Maximum Price: <strong className="text-[#231B15] font-semibold">{formatPKR(maxPriceFilter)}</strong></span>
            {maxPriceFilter < maxProductPrice && (
              <button
                onClick={() => setMaxPriceFilter(maxProductPrice)}
                className="text-[11px] text-[#6E4D2E] hover:underline cursor-pointer font-medium"
              >
                Reset
              </button>
            )}
          </div>
          <input
            type="range"
            min={minProductPrice}
            max={maxProductPrice}
            step={5000}
            value={maxPriceFilter}
            onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
            className="w-full h-1.5 bg-[#E8E1D7] rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Products Grid */}
      {sortedProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8E1D7] p-12 text-center my-8 max-w-md mx-auto space-y-3 shadow-2xs">
          <h3 className="text-base font-serif-luxury text-[#231B15]">No furniture found</h3>
          <p className="text-xs text-[#82756A] leading-relaxed">
            Try searching with different words or changing the price filter.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-2 px-5 py-2 rounded-full bg-[#6E4D2E] text-white text-xs font-medium hover:bg-[#583B20] transition-colors cursor-pointer shadow-xs"
          >
            Show All Furniture
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {sortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelectProduct={onSelectProduct}
              onQuickOrder={onQuickOrder}
            />
          ))}
        </div>
      )}
    </div>
  );
};
