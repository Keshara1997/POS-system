import { useState, useRef, useEffect } from 'react';
import { Search, Plus, Package, Scale, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../../types';
import { useApp } from '../../context/SupabaseAppContext';

interface ProductGridProps {
  onAddToCart: (product: Product, weight?: number) => void;
}

export function ProductGrid({ onAddToCart }: ProductGridProps) {
  const { state } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showWeightModal, setShowWeightModal] = useState<Product | null>(null);
  const [weight, setWeight] = useState('');
  const categoriesRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  const filteredProducts = state.products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.barcode && product.barcode.includes(searchTerm));
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.active;
  });

  const categories = ['All', ...Array.from(new Set(state.products.map(p => p.category)))];
  const isTouchMode = state.settings.interfaceMode === 'touch';

  const checkScrollButtons = () => {
    if (categoriesRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoriesRef.current;
      setShowLeftScroll(scrollLeft > 0);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 5); // 5px tolerance
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const categoriesElement = categoriesRef.current;
    if (categoriesElement) {
      categoriesElement.addEventListener('scroll', checkScrollButtons);
      return () => categoriesElement.removeEventListener('scroll', checkScrollButtons);
    }
  }, [categories]);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoriesRef.current) {
      const scrollAmount = 200;
      const currentScroll = categoriesRef.current.scrollLeft;
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      categoriesRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  const handleProductClick = (product: Product) => {
    if (product.isWeightBased) {
      setShowWeightModal(product);
      setWeight('');
    } else {
      onAddToCart(product);
    }
  };

  const handleWeightSubmit = () => {
    if (showWeightModal && weight && parseFloat(weight) > 0) {
      onAddToCart(showWeightModal, parseFloat(weight));
      setShowWeightModal(null);
      setWeight('');
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col bg-white">
        {/* Search and Filter Bar */}
        <div className="p-4 lg:p-6 border-b border-gray-100 bg-white">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search products by name, SKU, or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`input pl-12 ${isTouchMode ? 'h-14 text-lg' : 'h-12'}`}
              />
            </div>
            
            <div className="relative flex items-center">
              {/* Left scroll button */}
              {showLeftScroll && (
                <button
                  onClick={() => scrollCategories('left')}
                  className="absolute left-0 z-10 flex items-center justify-center w-8 h-8 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-all"
                  style={{ transform: 'translateX(-50%)' }}
                >
                  <ChevronLeft className="h-4 w-4 text-gray-600" />
                </button>
              )}

              {/* Categories container */}
              <div 
                ref={categoriesRef}
                className="flex overflow-x-auto space-x-2 lg:space-x-3 max-w-xl scrollbar-hide scroll-smooth px-6"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`btn whitespace-nowrap transition-all flex-shrink-0 ${
                      selectedCategory === category
                        ? 'btn-primary'
                        : 'btn-secondary'
                    } ${isTouchMode ? 'btn-lg touch-friendly' : 'btn-md'}`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Right scroll button */}
              {showRightScroll && (
                <button
                  onClick={() => scrollCategories('right')}
                  className="absolute right-0 z-10 flex items-center justify-center w-8 h-8 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-all"
                  style={{ transform: 'translateX(50%)' }}
                >
                  <ChevronRight className="h-4 w-4 text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 p-4 lg:p-6 overflow-auto">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="bg-gray-100 p-6 rounded-3xl mb-4">
                <Package className="h-16 w-16 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg font-medium">No products found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className={`grid gap-4 lg:gap-6 ${
              isTouchMode 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
            }`}>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleProductClick}
                  isTouchMode={isTouchMode}
                  currency={state.settings.currency}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Weight Input Modal */}
      {showWeightModal && (
        <div className="modal-overlay">
          <div className="modal max-w-sm">
            <div className="modal-header">
              <h3 className="text-lg font-bold text-gray-900">Enter Weight</h3>
              <button
                onClick={() => setShowWeightModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="modal-body space-y-4">
              <div className="text-center">
                <div className="bg-blue-100 p-4 rounded-2xl mb-4">
                  <Scale className="h-8 w-8 text-blue-600 mx-auto" />
                </div>
                <h4 className="font-semibold text-gray-900">{showWeightModal.name}</h4>
                <p className="text-sm text-gray-600">
                  {state.settings.currency} {showWeightModal.pricePerUnit?.toFixed(2)} per {showWeightModal.unit}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight ({showWeightModal.unit})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="input"
                  placeholder={`Enter weight in ${showWeightModal.unit}`}
                  autoFocus
                />
              </div>
              
              {weight && parseFloat(weight) > 0 && (
                <div className="bg-blue-50 p-3 rounded-xl">
                  <div className="flex justify-between text-sm">
                    <span>Total Price:</span>
                    <span className="font-semibold">
                      {state.settings.currency} {((showWeightModal.pricePerUnit || 0) * parseFloat(weight)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button
                onClick={() => setShowWeightModal(null)}
                className="btn btn-secondary btn-md"
              >
                Cancel
              </button>
              <button
                onClick={handleWeightSubmit}
                disabled={!weight || parseFloat(weight) <= 0}
                className="btn btn-primary btn-md disabled:opacity-50"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  isTouchMode: boolean;
  currency: string;
}

function ProductCard({ product, onAddToCart, isTouchMode, currency }: ProductCardProps) {
  // Only check stock levels if inventory tracking is enabled
  // Default to true if trackInventory is undefined (for backwards compatibility)
  const shouldTrackInventory = product.trackInventory !== false;
  const isLowStock = shouldTrackInventory ? product.stock <= product.minStock : false;
  const isOutOfStock = shouldTrackInventory ? product.stock === 0 : false;

  return (
    <div
      className={`card card-hover cursor-pointer transition-all duration-200 ${
        isLowStock && !isOutOfStock ? 'border-orange-200 bg-orange-50' : ''
      } ${isOutOfStock ? 'border-red-200 bg-red-50 opacity-75' : ''} ${
        isTouchMode ? 'p-4' : 'p-3'
      }`}
      onClick={() => !isOutOfStock && onAddToCart(product)}
    >
      <div className="flex flex-col h-full">
        {/* Product Image */}
        <div className={`bg-gray-100 rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden ${
          isTouchMode ? 'h-32' : 'h-24'
        }`}>
          {product.image ? (
            <img 
              src={product.image} 
              alt={product.name} 
              className="h-full w-full object-cover rounded-2xl" 
            />
          ) : (
            <Package className={`text-gray-400 ${isTouchMode ? 'h-10 w-10' : 'h-8 w-8'}`} />
          )}
          
          {/* Weight-based indicator */}
          {product.isWeightBased && (
            <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center space-x-1">
              <Scale className="h-3 w-3" />
              <span>{product.unit}</span>
            </div>
          )}
          
          {/* Stock Status Badge */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-2xl">
              <span className="text-white font-semibold text-sm">Out of Stock</span>
            </div>
          )}
          
          {isLowStock && !isOutOfStock && (
            <div className="absolute bottom-2 right-2 bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
              Low Stock
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div className="flex-1 space-y-2">
          <h3 className={`font-semibold text-gray-900 line-clamp-2 ${
            isTouchMode ? 'text-base' : 'text-sm'
          }`}>
            {product.name}
          </h3>
          
          <p className={`text-gray-500 ${isTouchMode ? 'text-sm' : 'text-xs'}`}>
            SKU: {product.sku}
          </p>
          
          <div className="flex items-center justify-between">
            <span className={`font-bold text-blue-600 ${isTouchMode ? 'text-lg' : 'text-base'}`}>
              {currency} {product.isWeightBased ? product.pricePerUnit?.toFixed(2) : product.price.toFixed(2)}
              {product.isWeightBased && <span className="text-xs text-gray-500">/{product.unit}</span>}
            </span>
            <span className={`text-gray-500 ${
              isLowStock ? 'text-orange-600 font-medium' : ''
            } ${isTouchMode ? 'text-sm' : 'text-xs'}`}>
              {shouldTrackInventory 
                ? `Stock: ${product.stock}${product.isWeightBased ? product.unit : ''}`
                : 'Unlimited stock'
              }
            </span>
          </div>
        </div>
        
        {/* Add to Cart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isOutOfStock) onAddToCart(product);
          }}
          disabled={isOutOfStock}
          className={`btn btn-primary w-full mt-4 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${
            isTouchMode ? 'btn-lg touch-friendly' : 'btn-md'
          }`}
        >
          {product.isWeightBased ? <Scale className={`${isTouchMode ? 'h-5 w-5' : 'h-4 w-4'}`} /> : <Plus className={`${isTouchMode ? 'h-5 w-5' : 'h-4 w-4'}`} />}
          <span>{isOutOfStock ? 'Out of Stock' : product.isWeightBased ? 'Enter Weight' : 'Add to Cart'}</span>
        </button>
      </div>
    </div>
  );
}