import { useState, useMemo } from 'react';
import { Filter, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductCard } from '../components/ProductCard';
import { DividerLine } from '../components/IndianMotifs';
import { products, categories } from '../data/products';

export function ShopPage() {
  const { categoryFilter, searchQuery, setSearchQuery } = useApp();
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryFilter ? [categoryFilter] : []
  );
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  const allColors = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.colors.forEach((c) => set.add(c)));
    return Array.from(set);
  }, []);

  const allSizes = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.sizes.forEach((s) => set.add(s)));
    return Array.from(set);
  }, []);

  const filtered = useMemo(() => {
    let result = [...products];

    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
          (Array.isArray(p.tags) && p.tags.some((t) => t && t.toLowerCase().includes(q)))
      );
    }

    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.category));
    }

    if (selectedColors.length > 0) {
      result = result.filter((p) => p.colors.some((c) => selectedColors.includes(c)));
    }

    if (selectedSizes.length > 0) {
      result = result.filter((p) => p.sizes.some((s) => selectedSizes.includes(s)));
    }

    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        result.sort((a, b) => parseInt(b.id) - parseInt(a.id));
        break;
      default:
        break;
    }

    return result;
  }, [searchQuery, selectedCategories, selectedColors, selectedSizes, priceRange, sortBy]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setPriceRange([0, 10000]);
    setSearchQuery('');
  };

  const activeFiltersCount =
    selectedCategories.length + selectedColors.length + selectedSizes.length + (searchQuery ? 1 : 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#F7F2E8] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-[#2C2C2C] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Shop All
          </h1>
          <DividerLine className="justify-start mb-2" />
          <p className="text-[#6B6560] text-sm">
            {filtered.length} {filtered.length === 1 ? 'product' : 'products'} found
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                showFilters
                  ? 'border-[#6B1D1D] bg-[#6B1D1D] text-white'
                  : 'border-gray-200 hover:border-[#6B1D1D] text-[#2C2C2C]'
              }`}
            >
              <SlidersHorizontal size={16} />
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-[#C4A35A] text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-[#6B1D1D] hover:text-[#4A1212] transition-colors flex items-center gap-1"
              >
                <X size={14} /> Clear all
              </button>
            )}
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none px-4 py-2.5 pr-10 rounded-lg border border-gray-200 text-sm text-[#2C2C2C] bg-white cursor-pointer outline-none focus:border-[#6B1D1D]"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6560] pointer-events-none" />
          </div>
        </div>

        <div className="flex gap-6">
          {showFilters && (
            <aside className="w-64 flex-shrink-0 hidden lg:block">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-[#2C2C2C] mb-3 uppercase tracking-wider">Categories</h4>
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            selectedCategories.includes(cat.id)
                              ? 'bg-[#6B1D1D] border-[#6B1D1D]'
                              : 'border-gray-300 group-hover:border-[#6B1D1D]'
                          }`}
                        >
                          {selectedCategories.includes(cat.id) && (
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                              <path d="M1 5l3 3 5-6" stroke="white" strokeWidth="1.5" />
                            </svg>
                          )}
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={selectedCategories.includes(cat.id)}
                          onChange={() => toggleCategory(cat.id)}
                        />
                        <span className="text-sm text-[#6B6560] group-hover:text-[#2C2C2C] transition-colors">
                          {cat.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-gray-200" />

                <div>
                  <h4 className="text-sm font-semibold text-[#2C2C2C] mb-3 uppercase tracking-wider">Price Range</h4>
                  <div className="px-1">
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="100"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                      className="w-full accent-[#6B1D1D]"
                    />
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-[#6B6560]">₹0</span>
                      <span className="text-xs text-[#6B6560]">₹{priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-200" />

                <div>
                  <h4 className="text-sm font-semibold text-[#2C2C2C] mb-3 uppercase tracking-wider">Colors</h4>
                  <div className="flex flex-wrap gap-2">
                    {allColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => toggleColor(color)}
                        className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                          selectedColors.includes(color)
                            ? 'bg-[#6B1D1D] text-white border-[#6B1D1D]'
                            : 'bg-white text-[#6B6560] border-gray-200 hover:border-[#6B1D1D]'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-gray-200" />

                <div>
                  <h4 className="text-sm font-semibold text-[#2C2C2C] mb-3 uppercase tracking-wider">Sizes</h4>
                  <div className="flex flex-wrap gap-2">
                    {allSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => toggleSize(size)}
                        className={`w-10 h-10 rounded-lg text-xs border flex items-center justify-center transition-colors ${
                          selectedSizes.includes(size)
                            ? 'bg-[#6B1D1D] text-white border-[#6B1D1D]'
                            : 'bg-white text-[#6B6560] border-gray-200 hover:border-[#6B1D1D]'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          )}

          <div className="flex-1">
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <Filter size={48} className="text-[#D4C5A9] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#2C2C2C] mb-2">No products found.</h3>
                <p className="text-sm text-[#6B6560] mb-4">Try adjusting your filters or search query</p>
                <button
                  onClick={clearFilters}
                  className="bg-[#6B1D1D] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#4A1212] transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
