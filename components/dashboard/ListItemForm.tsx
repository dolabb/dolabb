'use client';

import { navigationCategories } from '@/data/navigation';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { HiPlus, HiXMark } from 'react-icons/hi2';
import TermsModal from '@/components/shared/TermsModal';

interface ListItemFormProps {
  onCancel: () => void;
}

const currencies = ['USD', 'AED', 'SAR', 'KWD', 'QAR', 'OMR', 'BHD'];
const genders = ['Men', 'Women', 'Unisex', 'Kids'];
const sizes = [
  '2XS',
  'XS',
  'Small',
  'Medium',
  'Large',
  'XL',
  '2XL',
  '3XL',
  '4XL',
  '5XL',
  'One Size',
];
const conditions = ['New with tag', 'Like new', 'Good', 'Fair', 'Poor'];

export default function ListItemForm({ onCancel }: ListItemFormProps) {
  const locale = useLocale();

  const [formData, setFormData] = useState({
    photos: [] as string[],
    title: '',
    description: '',
    price: '',
    currency: 'USD',
    category: '',
    gender: '',
    subCategory: '',
    size: '',
    customSize: '',
    condition: '',
    brandName: '',
    quantity: '',
    hasVariants: false,
    variants: '',
    sku: '',
    tags: '',
    shippingCost: '',
    processingTime: '',
  });

  const [customSizes, setCustomSizes] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
          if (e.target?.result) {
            setFormData(prev => ({
              ...prev,
              photos: [...prev.photos, e.target!.result as string],
            }));
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const addCustomSize = () => {
    if (formData.customSize.trim()) {
      setCustomSizes(prev => [...prev, formData.customSize.trim()]);
      setFormData(prev => ({ ...prev, customSize: '' }));
    }
  };

  const removeCustomSize = (index: number) => {
    setCustomSizes(prev => prev.filter((_, i) => i !== index));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (index: number) => {
    setTags(prev => prev.filter((_, i) => i !== index));
  };

  const selectedCategory = navigationCategories.find(
    cat => cat.key === formData.category
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Show terms modal if not accepted
    if (!termsAccepted) {
      setShowTermsModal(true);
      return;
    }

    // Handle form submission
    const submitData = {
      ...formData,
      tags: tags.join(', '),
    };
    console.log('Form submitted:', submitData);
    alert(
      locale === 'en' ? 'Item listed successfully!' : 'تم إضافة المنتج بنجاح!'
    );
    onCancel();
  };

  const handleAcceptTerms = () => {
    setTermsAccepted(true);
    setShowTermsModal(false);
    // Automatically submit form after accepting terms
    const submitData = {
      ...formData,
      tags: tags.join(', '),
    };
    console.log('Form submitted:', submitData);
    alert(
      locale === 'en' ? 'Item listed successfully!' : 'تم إضافة المنتج بنجاح!'
    );
    onCancel();
  };

  // Custom dropdown component
  const CustomDropdown = ({
    value,
    onChange,
    options,
    placeholder,
    className = '',
  }: {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder: string;
    className?: string;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          type='button'
          onClick={() => setIsOpen(!isOpen)}
          className='w-full px-3 py-2 text-sm border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green transition-colors bg-white text-deep-charcoal cursor-pointer text-left flex items-center justify-between'
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23006747' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
            backgroundPosition: 'right 0.5rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.5em 1.5em',
            paddingRight: '2.5rem',
          }}
        >
          <span className={selectedOption ? '' : 'text-deep-charcoal/50'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </button>
        {isOpen && (
          <div className='absolute z-50 w-full mt-1 bg-white border border-rich-sand/30 rounded-lg shadow-lg max-h-40 overflow-y-auto min-w-[150px]'>
            {options.map(option => (
              <button
                key={option.value}
                type='button'
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-sm text-left hover:bg-saudi-green/10 transition-colors ${
                  value === option.value
                    ? 'bg-saudi-green/20 text-saudi-green font-medium'
                    : 'text-deep-charcoal'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className='bg-white rounded-xl border border-rich-sand/30 shadow-lg overflow-hidden'>
      {/* Header */}
      <div className='bg-gradient-to-r from-saudi-green to-emerald-600 px-6 py-4'>
        <h2 className='text-2xl font-bold text-white'>
          {locale === 'en' ? 'List an Item' : 'إضافة منتج'}
        </h2>
        <p className='text-sm text-white/90 mt-1'>
          {locale === 'en'
            ? 'Fill in the details to list your item for sale'
            : 'املأ التفاصيل لإدراج منتجك للبيع'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className='p-6 space-y-4'>
        {/* Add Photos */}
        <div className='bg-rich-sand/10 rounded-lg p-4 border border-rich-sand/20'>
          <label className='block text-xs font-semibold text-deep-charcoal mb-2 uppercase tracking-wide'>
            {locale === 'en' ? 'Photos' : 'الصور'}
          </label>
          <input
            type='file'
            accept='image/*'
            multiple
            onChange={handlePhotoUpload}
            className='hidden'
            id='photo-upload'
          />
          <label
            htmlFor='photo-upload'
            className='inline-flex items-center gap-2 px-4 py-2 bg-saudi-green text-white rounded-lg text-sm font-medium hover:bg-saudi-green/90 transition-colors cursor-pointer shadow-sm'
          >
            <HiPlus className='w-4 h-4' />
            {locale === 'en' ? 'Add Photos' : 'إضافة صور'}
          </label>
          {formData.photos.length > 0 && (
            <div className='grid grid-cols-4 md:grid-cols-6 gap-2 mt-3'>
              {formData.photos.map((photo, index) => (
                <div
                  key={index}
                  className='relative aspect-square rounded-lg overflow-hidden border-2 border-rich-sand/30'
                >
                  <Image
                    src={photo}
                    alt={`Preview ${index + 1}`}
                    fill
                    className='object-cover'
                  />
                  <button
                    type='button'
                    onClick={() => removePhoto(index)}
                    className='absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md'
                  >
                    <HiXMark className='w-3 h-3' />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Item Title & Description Row */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
              {locale === 'en' ? 'Item Title' : 'عنوان المنتج'}
            </label>
            <input
              type='text'
              value={formData.title}
              onChange={e =>
                setFormData(prev => ({ ...prev, title: e.target.value }))
              }
              className='w-full px-3 py-2 text-sm border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green transition-colors'
              required
            />
          </div>
          <div>
            <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
              {locale === 'en' ? 'Brand Name' : 'اسم العلامة التجارية'}
            </label>
            <input
              type='text'
              value={formData.brandName}
              onChange={e =>
                setFormData(prev => ({ ...prev, brandName: e.target.value }))
              }
              className='w-full px-3 py-2 text-sm border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green transition-colors'
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
            {locale === 'en' ? 'Description' : 'الوصف'}
          </label>
          <textarea
            value={formData.description}
            onChange={e =>
              setFormData(prev => ({ ...prev, description: e.target.value }))
            }
            rows={3}
            className='w-full px-3 py-2 text-sm border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green transition-colors resize-none'
            required
          />
        </div>

        {/* Price, Currency, Quantity Row */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
              {locale === 'en' ? 'Price' : 'السعر'}
            </label>
            <input
              type='number'
              step='0.01'
              value={formData.price}
              onChange={e =>
                setFormData(prev => ({ ...prev, price: e.target.value }))
              }
              className='w-full px-3 py-2 text-sm border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green transition-colors'
              required
            />
          </div>
          <div>
            <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
              {locale === 'en' ? 'Currency' : 'العملة'}
            </label>
            <CustomDropdown
              value={formData.currency}
              onChange={value =>
                setFormData(prev => ({ ...prev, currency: value }))
              }
              options={currencies.map(c => ({ value: c, label: c }))}
              placeholder={locale === 'en' ? 'Select Currency' : 'اختر العملة'}
            />
          </div>
          <div>
            <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
              {locale === 'en' ? 'Quantity' : 'الكمية'}
            </label>
            <input
              type='number'
              min='1'
              value={formData.quantity}
              onChange={e =>
                setFormData(prev => ({ ...prev, quantity: e.target.value }))
              }
              className='w-full px-3 py-2 text-sm border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green transition-colors'
              required
            />
          </div>
        </div>

        {/* Category, Gender, Size, Sub Category Row */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <div>
            <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
              {locale === 'en' ? 'Category' : 'الفئة'}
            </label>
            <CustomDropdown
              value={formData.category}
              onChange={value =>
                setFormData(prev => ({
                  ...prev,
                  category: value,
                  subCategory: '',
                }))
              }
              options={[
                {
                  value: '',
                  label: locale === 'en' ? 'Select Category' : 'اختر الفئة',
                },
                ...navigationCategories.map(cat => ({
                  value: cat.key,
                  label: cat.name,
                })),
              ]}
              placeholder={locale === 'en' ? 'Select Category' : 'اختر الفئة'}
            />
          </div>
          <div>
            <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
              {locale === 'en' ? 'Gender' : 'الجنس'}
            </label>
            <CustomDropdown
              value={formData.gender}
              onChange={value =>
                setFormData(prev => ({ ...prev, gender: value }))
              }
              options={[
                { value: '', label: locale === 'en' ? 'Select' : 'اختر' },
                ...genders.map(g => ({ value: g, label: g })),
              ]}
              placeholder={locale === 'en' ? 'Select' : 'اختر'}
            />
          </div>
          <div>
            <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
              {locale === 'en' ? 'Size' : 'المقاس'}
            </label>
            <CustomDropdown
              value={formData.size}
              onChange={value =>
                setFormData(prev => ({ ...prev, size: value }))
              }
              options={[
                {
                  value: '',
                  label: locale === 'en' ? 'Select Size' : 'اختر المقاس',
                },
                ...sizes.map(s => ({ value: s, label: s })),
              ]}
              placeholder={locale === 'en' ? 'Select Size' : 'اختر المقاس'}
            />
            {/* Custom Size - Smaller */}
            <div className='flex gap-1.5 mt-1.5'>
              <input
                type='text'
                value={formData.customSize}
                onChange={e =>
                  setFormData(prev => ({ ...prev, customSize: e.target.value }))
                }
                placeholder={locale === 'en' ? 'Custom' : 'مخصص'}
                className='flex-1 px-2 py-1 text-xs border border-rich-sand/30 rounded focus:outline-none focus:ring-1 focus:ring-saudi-green focus:border-saudi-green transition-colors'
              />
              <button
                type='button'
                onClick={addCustomSize}
                className='px-2 py-1 bg-saudi-green text-white rounded hover:bg-saudi-green/90 transition-colors text-xs'
              >
                <HiPlus className='w-3 h-3' />
              </button>
            </div>
            {customSizes.length > 0 && (
              <div className='flex flex-wrap gap-1 mt-1.5'>
                {customSizes.map((size, index) => (
                  <span
                    key={index}
                    className='inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-saudi-green/10 text-saudi-green rounded text-xs'
                  >
                    {size}
                    <button
                      type='button'
                      onClick={() => removeCustomSize(index)}
                      className='hover:text-red-500'
                    >
                      <HiXMark className='w-2.5 h-2.5' />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          {selectedCategory && (
            <div>
              <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
                {locale === 'en' ? 'Sub Category' : 'الفئة الفرعية'}
              </label>
              <CustomDropdown
                value={formData.subCategory}
                onChange={value =>
                  setFormData(prev => ({ ...prev, subCategory: value }))
                }
                options={[
                  {
                    value: '',
                    label:
                      locale === 'en'
                        ? 'All Sub Categories'
                        : 'جميع الفئات الفرعية',
                  },
                  ...selectedCategory.subCategories.map(sub => ({
                    value: sub.key,
                    label: sub.name,
                  })),
                ]}
                placeholder={
                  locale === 'en' ? 'All Sub Categories' : 'جميع الفئات الفرعية'
                }
              />
            </div>
          )}
        </div>

        {/* Condition */}
        <div>
          <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
            {locale === 'en' ? 'Condition' : 'الحالة'}
          </label>
          <CustomDropdown
            value={formData.condition}
            onChange={value =>
              setFormData(prev => ({ ...prev, condition: value }))
            }
            options={[
              { value: '', label: locale === 'en' ? 'Select' : 'اختر' },
              ...conditions.map(c => ({ value: c, label: c })),
            ]}
            placeholder={locale === 'en' ? 'Select' : 'اختر'}
          />
        </div>

        {/* Variants, SKU, Tags Row */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='flex items-center gap-2 mb-1.5'>
              <input
                type='checkbox'
                checked={formData.hasVariants}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    hasVariants: e.target.checked,
                  }))
                }
                className='w-4 h-4 text-saudi-green focus:ring-saudi-green rounded'
              />
              <span className='text-xs font-semibold text-deep-charcoal uppercase tracking-wide'>
                {locale === 'en' ? 'Has Variants' : 'يحتوي على متغيرات'}
              </span>
            </label>
            {formData.hasVariants && (
              <textarea
                value={formData.variants}
                onChange={e =>
                  setFormData(prev => ({ ...prev, variants: e.target.value }))
                }
                placeholder={
                  locale === 'en' ? 'Describe variants...' : 'وصف المتغيرات...'
                }
                rows={2}
                className='w-full mt-1 px-3 py-2 text-sm border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green transition-colors resize-none'
              />
            )}
          </div>
          <div>
            <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
              {locale === 'en' ? 'SKU/ID (Optional)' : 'رمز المنتج (اختياري)'}
            </label>
            <input
              type='text'
              value={formData.sku}
              onChange={e =>
                setFormData(prev => ({ ...prev, sku: e.target.value }))
              }
              className='w-full px-3 py-2 text-sm border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green transition-colors'
            />
          </div>
        </div>

        {/* Tags/Keywords */}
        <div>
          <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
            {locale === 'en' ? 'Tags/Keywords' : 'العلامات/الكلمات المفتاحية'}
          </label>
          <input
            type='text'
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder={
              locale === 'en'
                ? 'Type and press Enter to add tag'
                : 'اكتب واضغط Enter لإضافة علامة'
            }
            className='w-full px-3 py-2 text-sm border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green transition-colors'
          />
          {tags.length > 0 && (
            <div className='flex flex-wrap gap-2 mt-2'>
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-saudi-green/10 text-saudi-green rounded-full text-sm border border-saudi-green/20'
                >
                  {tag}
                  <button
                    type='button'
                    onClick={() => removeTag(index)}
                    className='hover:text-red-500 transition-colors'
                  >
                    <HiXMark className='w-4 h-4' />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Shipping Information */}
        <div className='bg-rich-sand/10 rounded-lg p-4 border border-rich-sand/20'>
          <h3 className='text-sm font-semibold text-deep-charcoal mb-3 uppercase tracking-wide'>
            {locale === 'en' ? 'Shipping Information' : 'معلومات الشحن'}
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
                {locale === 'en' ? 'Shipping Cost' : 'تكلفة الشحن'}
              </label>
              <input
                type='number'
                step='0.01'
                value={formData.shippingCost}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    shippingCost: e.target.value,
                  }))
                }
                className='w-full px-3 py-2 text-sm border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green transition-colors'
                required
              />
            </div>
            <div>
              <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
                {locale === 'en'
                  ? 'Processing Time (days)'
                  : 'وقت المعالجة (أيام)'}
              </label>
              <input
                type='number'
                min='1'
                value={formData.processingTime}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    processingTime: e.target.value,
                  }))
                }
                className='w-full px-3 py-2 text-sm border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green transition-colors'
                required
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className='flex gap-3 pt-4 border-t-2 border-rich-sand/30'>
          <button
            type='button'
            onClick={onCancel}
            className='flex-1 px-4 py-2.5 border-2 border-rich-sand/30 text-deep-charcoal rounded-lg font-semibold hover:bg-rich-sand/20 hover:border-rich-sand/50 transition-all text-sm'
          >
            {locale === 'en' ? 'Cancel' : 'إلغاء'}
          </button>
          <button
            type='submit'
            className='flex-1 px-4 py-2.5 bg-gradient-to-r from-saudi-green to-emerald-600 text-white rounded-lg font-semibold hover:from-saudi-green/90 hover:to-emerald-500 transition-all shadow-md hover:shadow-lg text-sm'
          >
            {locale === 'en' ? 'Submit' : 'إرسال'}
          </button>
        </div>
      </form>

      {/* Terms Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onAccept={handleAcceptTerms}
        onClose={() => setShowTermsModal(false)}
        title={locale === 'en' ? 'Accept Terms of Service' : 'قبول شروط الخدمة'}
        description={locale === 'en' ? 'You must accept our Terms of Service to list an item' : 'يجب عليك قبول شروط الخدمة لإدراج منتج'}
      />
    </div>
  );
}
