import React, { useState, useEffect } from 'react';
import { X, Scale } from 'lucide-react';
import { Product, ProductBatch } from '../../types';
import { useApp } from '../../context/SupabaseAppContext';
import Swal from 'sweetalert2';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export function ProductModal({ isOpen, onClose, product }: ProductModalProps) {
  const { dispatch } = useApp();
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '',
    category: '',
    description: '',
    taxable: true,
    active: true,
    isWeightBased: false,
    pricePerUnit: '',
    unit: 'kg',
    image: '',
    trackInventory: true,
  });
  
  const [batches, setBatches] = useState<ProductBatch[]>([]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        sku: product.sku,
        barcode: product.barcode || '',
        price: product.price.toString(),
        cost: product.cost.toString(),
        stock: product.stock.toString(),
        minStock: product.minStock.toString(),
        category: product.category,
        description: product.description,
        taxable: product.taxable,
        active: product.active,
        isWeightBased: product.isWeightBased || false,
        pricePerUnit: product.pricePerUnit?.toString() || '',
        unit: product.unit || 'kg',
        image: product.image || '',
        trackInventory: product.trackInventory ?? true,
      });
      setBatches(product.batches || []);
    } else {
      setFormData({
        name: '',
        sku: '',
        barcode: '',
        price: '',
        cost: '',
        stock: '',
        minStock: '',
        category: '',
        description: '',
        taxable: true,
        active: true,
        isWeightBased: false,
        pricePerUnit: '',
        unit: 'kg',
        image: '',
        trackInventory: true,
      });
      setBatches([]);
    }
  }, [product]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name.trim()) {
      await Swal.fire({
        title: 'Error!',
        text: 'Please enter a product name',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (!formData.category.trim()) {
      await Swal.fire({
        title: 'Error!',
        text: 'Please enter a category',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (!formData.sku.trim()) {
      await Swal.fire({
        title: 'Error!',
        text: 'Please enter a SKU',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    if (formData.isWeightBased) {
      if (!formData.pricePerUnit || parseFloat(formData.pricePerUnit) <= 0) {
        await Swal.fire({
          title: 'Error!',
          text: 'Please enter a valid price per unit for weight-based product',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        return;
      }
    } else {
      if (!formData.price || parseFloat(formData.price) <= 0) {
        await Swal.fire({
          title: 'Error!',
          text: 'Please enter a valid price',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        return;
      }
    }

    if (!formData.cost || parseFloat(formData.cost) < 0) {
      await Swal.fire({
        title: 'Error!',
        text: 'Please enter a valid cost price (or 0 if no cost)',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    // Only validate stock fields if inventory tracking is enabled
    if (formData.trackInventory) {
      if (!formData.stock || parseInt(formData.stock) < 0) {
        await Swal.fire({
          title: 'Error!',
          text: 'Please enter a valid stock quantity',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        return;
      }

      if (!formData.minStock || parseInt(formData.minStock) < 0) {
        await Swal.fire({
          title: 'Error!',
          text: 'Please enter a valid minimum stock level',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        return;
      }
    }

    const productData: Product = {
      id: product?.id || Date.now().toString(),
      name: formData.name,
      sku: formData.sku,
      barcode: formData.barcode || undefined,
      price: formData.isWeightBased ? 0 : parseFloat(formData.price),
      cost: parseFloat(formData.cost),
      stock: formData.trackInventory ? parseInt(formData.stock) : 999999,
      minStock: formData.trackInventory ? parseInt(formData.minStock) : 0,
      category: formData.category,
      description: formData.description,
      taxable: formData.taxable,
      active: formData.active,
      isWeightBased: formData.isWeightBased,
      pricePerUnit: formData.isWeightBased ? parseFloat(formData.pricePerUnit) : undefined,
      unit: formData.isWeightBased ? formData.unit : undefined,
      image: formData.image || undefined,
      trackInventory: formData.trackInventory,
      batches,
      createdAt: product?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    try {
      const { productsService } = await import('../../lib/services');
      
      if (product) {
        await productsService.update(productData.id, productData);
        dispatch({ type: 'UPDATE_PRODUCT', payload: productData });
        await Swal.fire({
          title: 'Success!',
          text: 'Product updated successfully',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      } else {
        const newProduct = await productsService.create(productData);
        dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
        await Swal.fire({
          title: 'Success!',
          text: 'Product added successfully',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      await Swal.fire({
        title: 'Error!',
        text: 'Failed to save product. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          image: event.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addBatch = () => {
    const newBatch: ProductBatch = {
      id: Date.now().toString(),
      batchNumber: `BATCH-${Date.now().toString().slice(-6)}`,
      manufacturingDate: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      quantity: 0,
      costPrice: parseFloat(formData.cost) || 0,
      supplierInfo: '',
    };
    setBatches(prev => [...prev, newBatch]);
  };

  const updateBatch = (index: number, field: keyof ProductBatch, value: any) => {
    setBatches(prev => prev.map((batch, i) => 
      i === index ? { ...batch, [field]: value } : batch
    ));
  };

  const removeBatch = (index: number) => {
    setBatches(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="modal-overlay">
      <div className="modal max-w-4xl">
        <div className="modal-header">
          <h2 className="text-xl font-bold text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="modal-body space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="Enter category"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU *
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="Enter SKU"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Barcode
                </label>
                <input
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  className="input"
                  placeholder="Enter barcode"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="textarea"
                  placeholder="Enter product description"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Stock</h3>
            
            <div className="mb-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="isWeightBased"
                  checked={formData.isWeightBased}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                />
                <div className="flex items-center space-x-2">
                  <Scale className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Weight-based pricing</span>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.isWeightBased ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price per Unit *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="pricePerUnit"
                      value={formData.pricePerUnit}
                      onChange={handleChange}
                      required
                      className="input"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit *
                    </label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      className="select"
                    >
                      <option value="kg">Kilogram (kg)</option>
                      <option value="g">Gram (g)</option>
                      <option value="lb">Pound (lb)</option>
                      <option value="oz">Ounce (oz)</option>
                      <option value="l">Liter (l)</option>
                      <option value="ml">Milliliter (ml)</option>
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sale Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    className="input"
                    placeholder="0.00"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="mt-6 mb-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="trackInventory"
                  checked={formData.trackInventory}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                />
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Track inventory for this product</span>
                </div>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-8">
                When disabled, stock levels won't be managed and inventory won't be deducted during sales
              </p>
            </div>

            {formData.trackInventory && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    required
                    className="input"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Stock Level *
                  </label>
                  <input
                    type="number"
                    min="0"
                    name="minStock"
                    value={formData.minStock}
                    onChange={handleChange}
                    required
                    className="input"
                    placeholder="0"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Image</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="input"
                />
              </div>
              
              {formData.image && (
                <div className="flex items-center space-x-4">
                  <img
                    src={formData.image}
                    alt="Product preview"
                    className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                    className="btn btn-secondary btn-sm"
                  >
                    Remove Image
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Batch Management</h3>
                <p className="text-sm text-gray-600">Track manufacturing and expiry dates for better inventory control</p>
              </div>
              <button
                type="button"
                onClick={addBatch}
                className="btn btn-primary btn-sm"
              >
                Add Batch
              </button>
            </div>
            
            {batches.length > 0 && (
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {batches.map((batch, index) => (
                  <div key={batch.id} className="card p-4 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Batch Number
                        </label>
                        <input
                          type="text"
                          value={batch.batchNumber}
                          onChange={(e) => updateBatch(index, 'batchNumber', e.target.value)}
                          className="input input-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Manufacturing Date
                        </label>
                        <input
                          type="date"
                          value={batch.manufacturingDate.toISOString().split('T')[0]}
                          onChange={(e) => updateBatch(index, 'manufacturingDate', new Date(e.target.value))}
                          className="input input-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry Date
                        </label>
                        <input
                          type="date"
                          value={batch.expiryDate.toISOString().split('T')[0]}
                          onChange={(e) => updateBatch(index, 'expiryDate', new Date(e.target.value))}
                          className="input input-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={batch.quantity}
                          onChange={(e) => updateBatch(index, 'quantity', parseInt(e.target.value))}
                          className="input input-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cost Price
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={batch.costPrice}
                          onChange={(e) => updateBatch(index, 'costPrice', parseFloat(e.target.value))}
                          className="input input-sm"
                        />
                      </div>
                      
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => removeBatch(index)}
                          className="btn btn-danger btn-sm w-full"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="taxable"
                  checked={formData.taxable}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                />
                <span className="ml-2 text-sm text-gray-700">Taxable</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-md"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary btn-md"
          >
            {product ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  );
}