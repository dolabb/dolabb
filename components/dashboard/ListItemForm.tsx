'use client';

import { navigationCategories } from '@/data/navigation';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HiPlus, HiXMark } from 'react-icons/hi2';
import TermsModal from '@/components/shared/TermsModal';
import { useCreateProductMutation, useUpdateProductMutation } from '@/lib/api/productsApi';
import { useAppDispatch } from '@/lib/store/hooks';
import { productsApi } from '@/lib/api/productsApi';
import { authApi } from '@/lib/api/authApi';
import { useUploadImageMutation } from '@/lib/api/authApi';
import { toast } from '@/utils/toast';
import type { Product } from '@/types/products';

interface ListItemFormProps {
  onCancel: () => void;
  productId?: string;
  initialData?: Product;
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

// Map display condition values to API-expected values
const conditionMap: Record<string, string> = {
  'New with tag': 'new',
  'Like new': 'like-new',
  'Good': 'good',
  'Fair': 'fair',
  'Poor': 'fair', // Map Poor to fair as API doesn't have 'poor'
};

// Reverse map: API values to display values (for edit mode)
const reverseConditionMap: Record<string, string> = {
  'new': 'New with tag',
  'like-new': 'Like new',
  'good': 'Good',
  'fair': 'Fair',
};
const colors = [
  'Black',
  'White',
  'Navy',
  'Gray',
  'Beige',
  'Red',
  'Blue',
  'Green',
  'Pink',
  'Yellow',
  'Purple',
  'Orange',
  'Brown',
  'Silver',
  'Gold',
];

export default function ListItemForm({ onCancel, productId, initialData }: ListItemFormProps) {
  const locale = useLocale();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isEditMode = !!productId && !!initialData;
  
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [uploadImage, { isLoading: isUploadingImage }] = useUploadImageMutation();

  // Helper function to normalize API response to Product type
  // Handles both capitalized API field names and lowercase Product type field names
  const normalizeProductData = (data: any): Product | null => {
    if (!data) return null;
    
    // Handle images - check both "Images" (capital) and "images" (lowercase)
    const images = (data as any).Images || data.images || [];
    const filteredImages = Array.isArray(images) 
      ? images.filter((img: any) => img && img.trim() !== '' && img !== 'undefined' && img !== 'null')
      : [];

    // Handle tags - check both "Tags/Keywords" and "tags"
    const tagsData = (data as any)['Tags/Keywords'] || data.tags || [];
    const normalizedTags = Array.isArray(tagsData) 
      ? tagsData.filter((tag: any) => tag && tag.trim() !== '')
      : (typeof tagsData === 'string' 
          ? tagsData.split(',').map((t: string) => t.trim()).filter(Boolean) 
          : []);

    // Handle shipping info - check both nested object and flat API fields
    const shippingCost = data.shippingInfo?.cost ?? (data as any)['Shipping Cost'] ?? 0;
    const estimatedDays = data.shippingInfo?.estimatedDays ?? (data as any)['Processing Time (days)'] ?? 3;
    const shippingLocations = data.shippingInfo?.locations ?? (data as any)['Shipping Locations'] ?? ['Saudi Arabia'];

    // Handle currency - check both "Currency" (capital) and "currency" (lowercase)
    const currency = (data as any).Currency || (data as any).currency || 'SAR';

    return {
      id: data.id || '',
      title: data.itemtitle || data.title || '',
      description: data.description || '',
      price: data.price || 0,
      originalPrice: data.originalPrice,
      currency: currency,
      images: filteredImages,
      category: data.category || '',
      subcategory: data.subcategory || '',
      brand: data.brand || '',
      size: (data as any).Size || data.size || '',
      color: (data as any).Color || data.color || '',
      condition: (data as any).Condition || data.condition || 'fair',
      tags: normalizedTags,
      quantity: (data as any).Quantity ?? data.quantity ?? 1,
      seller: data.seller || { id: '', username: '' },
      shippingInfo: {
        cost: typeof shippingCost === 'number' ? shippingCost : parseFloat(shippingCost) || 0,
        estimatedDays: typeof estimatedDays === 'number' ? estimatedDays : parseInt(estimatedDays) || 3,
        locations: Array.isArray(shippingLocations) ? shippingLocations : ['Saudi Arabia'],
      },
      affiliateCode: data.affiliateCode || (data as any)['Affiliate Code (Optional)'] || '',
      taxPercentage: (data as any)['Tax Percentage'] ?? data.taxPercentage,
      ...data, // Spread to include any other fields
    };
  };

  // Normalize initial data - use useMemo to avoid recalculating on every render
  const normalizedData = useMemo(() => normalizeProductData(initialData), [initialData]);

  // Store photo files and previews separately
  // photos array contains: File objects for new uploads, or string URLs for existing images
  const [photoFiles, setPhotoFiles] = useState<(File | string)[]>(
    normalizedData?.images || []
  );
  // Initialize previews with existing URLs if in edit mode
  const [photoPreviews, setPhotoPreviews] = useState<string[]>(
    normalizedData?.images || []
  );

  // Initialize form data from initialData if in edit mode
  const [formData, setFormData] = useState({
    photos: [] as string[], // Will be populated with URLs after upload
    title: normalizedData?.title || '',
    description: normalizedData?.description || '',
    price: normalizedData?.price?.toString() || '',
    originalPrice: normalizedData?.originalPrice?.toString() || '',
    currency: (normalizedData as any)?.Currency || (normalizedData as any)?.currency || 'SAR', // Use product currency if available, default to SAR
    category: normalizedData?.category || '',
    gender: 'Unisex', // Default
    subCategory: normalizedData?.subcategory || '',
    size: normalizedData?.size || '',
    color: normalizedData?.color || '',
    customSize: '',
    condition: normalizedData?.condition 
      ? (reverseConditionMap[normalizedData.condition] || normalizedData.condition)
      : '',
    brandName: normalizedData?.brand || '',
    quantity: normalizedData?.quantity?.toString() || '',
    hasVariants: false,
    variants: '',
    sku: '',
    tags: normalizedData?.tags?.join(', ') || '',
    shippingCost: normalizedData?.shippingInfo?.cost?.toString() || '',
    processingTime: normalizedData?.shippingInfo?.estimatedDays?.toString() || '',
    affiliateCode: normalizedData?.affiliateCode || '',
    isVatRegistered: normalizedData?.taxPercentage ? true : false,
    taxPercentage: normalizedData?.taxPercentage?.toString() || '',
  });

  const [customSizes, setCustomSizes] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>(normalizedData?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [newSubCategoryInput, setNewSubCategoryInput] = useState('');
  const [customSubCategories, setCustomSubCategories] = useState<string[]>([]);
  const [shippingLocations, setShippingLocations] = useState<string[]>(
    normalizedData?.shippingInfo?.locations || ['Saudi Arabia']
  );
  const [newShippingLocation, setNewShippingLocation] = useState('');

  // Update form when initialData changes (for edit mode)
  useEffect(() => {
    if (isEditMode && normalizedData) {
      // Update images
      const images = normalizedData.images || [];
      setPhotoFiles(images);
      setPhotoPreviews(images);

      // Update form data
      setFormData({
        photos: [],
        title: normalizedData.title || '',
        description: normalizedData.description || '',
        price: normalizedData.price?.toString() || '',
        originalPrice: normalizedData.originalPrice?.toString() || '',
        currency: (normalizedData as any).Currency || (normalizedData as any).currency || 'SAR',
        category: normalizedData.category || '',
        gender: 'Unisex',
        subCategory: normalizedData.subcategory || '',
        size: normalizedData.size || '',
        color: normalizedData.color || '',
        customSize: '',
        condition: normalizedData.condition 
          ? (reverseConditionMap[normalizedData.condition] || normalizedData.condition)
          : '',
        brandName: normalizedData.brand || '',
        quantity: normalizedData.quantity?.toString() || '',
        hasVariants: false,
        variants: '',
        sku: '',
        tags: normalizedData.tags?.join(', ') || '',
        shippingCost: normalizedData.shippingInfo?.cost?.toString() || '',
        processingTime: normalizedData.shippingInfo?.estimatedDays?.toString() || '',
        affiliateCode: normalizedData.affiliateCode || '',
        isVatRegistered: normalizedData.taxPercentage ? true : false,
        taxPercentage: normalizedData.taxPercentage?.toString() || '',
      });

      // Update tags
      setTags(normalizedData.tags || []);

      // Update shipping locations
      setShippingLocations(normalizedData.shippingInfo?.locations || ['Saudi Arabia']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isEditMode]);

  // Generate preview URLs for File objects
  useEffect(() => {
    const generatePreviews = async () => {
      const previews: string[] = [];
      for (const item of photoFiles) {
        if (item instanceof File) {
          // Create preview for File object
          const reader = new FileReader();
          const preview = await new Promise<string>((resolve) => {
            reader.onload = (e) => {
              resolve(e.target?.result as string);
            };
            reader.readAsDataURL(item);
          });
          previews.push(preview);
        } else {
          // Use existing URL
          previews.push(item);
        }
      }
      setPhotoPreviews(previews);
    };
    generatePreviews();
  }, [photoFiles]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const currentPhotoCount = photoFiles.length;
      const filesToAdd = Array.from(files);
      
      // Validate file sizes (10MB limit per file)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      const oversizedFiles = filesToAdd.filter(file => file.size > maxSize);
      
      if (oversizedFiles.length > 0) {
        toast.error(
          locale === 'en'
            ? `Some images are too large. Maximum size is 10MB per image. Please compress the images or choose smaller files.`
            : `بعض الصور كبيرة جداً. الحد الأقصى هو 10 ميجابايت لكل صورة. يرجى ضغط الصور أو اختيار ملفات أصغر.`
        );
        e.target.value = '';
        return;
      }
      
      const totalAfterUpload = currentPhotoCount + filesToAdd.length;
      
      // Check if adding these files would exceed the limit of 5
      if (totalAfterUpload > 5) {
        const maxAllowed = 5 - currentPhotoCount;
        if (maxAllowed > 0) {
          toast.warning(
            locale === 'en' 
              ? `You can only upload ${maxAllowed} more image${maxAllowed > 1 ? 's' : ''}. Maximum 5 images allowed.`
              : `يمكنك تحميل ${maxAllowed} صورة${maxAllowed > 1 ? '' : ''} فقط. الحد الأقصى 5 صور.`
          );
          // Only process the files that fit within the limit
          setPhotoFiles(prev => [...prev, ...filesToAdd.slice(0, maxAllowed)]);
        } else {
          toast.error(
            locale === 'en' 
              ? 'Maximum 5 images allowed. Please remove some images before adding new ones.'
              : 'الحد الأقصى 5 صور. يرجى إزالة بعض الصور قبل إضافة صور جديدة.'
          );
          }
        // Reset the input so the same file can be selected again if needed
        e.target.value = '';
        return;
      }
      
      // If within limit, add all files
      setPhotoFiles(prev => [...prev, ...filesToAdd]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
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

  const addCustomSubCategory = () => {
    if (newSubCategoryInput.trim() && selectedCategory) {
      const newSubCategory = newSubCategoryInput.trim();
      setCustomSubCategories(prev => [...prev, newSubCategory]);
      setFormData(prev => ({ ...prev, subCategory: `create ${newSubCategory}` }));
      setNewSubCategoryInput('');
    }
  };

  const addShippingLocation = () => {
    if (newShippingLocation.trim()) {
      setShippingLocations(prev => [...prev, newShippingLocation.trim()]);
      setNewShippingLocation('');
    }
  };

  const removeShippingLocation = (index: number) => {
    setShippingLocations(prev => prev.filter((_, i) => i !== index));
  };

  const selectedCategory = navigationCategories.find(
    cat => cat.key === formData.category
  );

  const handleSubmit = async (e: React.FormEvent, skipTermsCheck = false) => {
    e.preventDefault();
    
    // Show terms modal if not accepted (only for create mode)
    // Skip check if called from handleAcceptTerms
    if (!skipTermsCheck && !isEditMode && !termsAccepted) {
      setShowTermsModal(true);
      return;
    }

    try {
      // Step 1: Upload all new image files first
      const imageUrls: string[] = [];
      
      for (const item of photoFiles) {
        if (item instanceof File) {
          // Upload new file
          try {
            const imageFormData = new FormData();
            imageFormData.append('image', item, item.name);
            
            const uploadResult = await uploadImage(imageFormData).unwrap();
            
            if (uploadResult.success && uploadResult.image_url) {
              imageUrls.push(uploadResult.image_url);
            } else {
              throw new Error('Image upload failed: No image URL returned');
            }
          } catch (uploadError: any) {
            console.error('Image upload failed:', uploadError);
            
            // Check if it's a timeout error
            const isTimeout = 
              uploadError?.message?.toLowerCase().includes('timeout') ||
              uploadError?.message?.toLowerCase().includes('time') ||
              uploadError?.code === 'ECONNABORTED' ||
              uploadError?.name === 'TimeoutError' ||
              uploadError?.error?.data?.message?.toLowerCase().includes('timeout');
            
            if (isTimeout) {
              toast.error(
                locale === 'en'
                  ? 'Image upload timed out. The image might be too large or the connection is slow. Please try again with smaller images or check your internet connection.'
                  : 'انتهت مهلة تحميل الصورة. قد تكون الصورة كبيرة جداً أو الاتصال بطيء. يرجى المحاولة مرة أخرى بصور أصغر أو التحقق من اتصال الإنترنت.'
              );
            } else {
              toast.error(
                locale === 'en'
                  ? 'Failed to upload one or more images. Please try again.'
                  : 'فشل تحميل صورة واحدة أو أكثر. يرجى المحاولة مرة أخرى.'
              );
            }
            return; // Stop the process if image upload fails
          }
        } else {
          // Use existing URL (for edit mode)
          imageUrls.push(item);
        }
      }

      // Validate that we have at least one image
      if (imageUrls.length === 0) {
        toast.error(
          locale === 'en'
            ? 'Please add at least one image for your product.'
            : 'يرجى إضافة صورة واحدة على الأقل لمنتجك.'
        );
        return;
      }

      // Step 2: Prepare API data with uploaded image URLs
      const apiData: any = {
        itemtitle: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        Images: imageUrls, // Use uploaded URLs instead of base64
        category: formData.category,
        subcategory: formData.subCategory,
        brand: formData.brandName,
        Size: formData.size,
        Condition: formData.condition ? conditionMap[formData.condition] || formData.condition.toLowerCase() : 'fair',
        'Tags/Keywords': tags.length > 0 ? tags : (formData.tags ? formData.tags.split(',').map(t => t.trim()) : []),
        Quantity: formData.quantity ? parseInt(formData.quantity) : 1,
        currency: formData.currency,
        Gender: formData.gender || 'Unisex',
        'Shipping Cost': formData.shippingCost ? parseFloat(formData.shippingCost) : 0,
        'Processing Time (days)': formData.processingTime ? parseInt(formData.processingTime) : 3,
        'Shipping Locations': shippingLocations.length > 0 ? shippingLocations : ['Saudi Arabia'],
      };

      // Optional fields
      if (formData.sku) {
        apiData['SKU/ID (Optional)'] = formData.sku;
      }
      
      if (formData.color) {
        apiData.Color = formData.color;
      }
      
      if (formData.originalPrice) {
        apiData.originalPrice = parseFloat(formData.originalPrice);
      }
      
      if (formData.affiliateCode) {
        apiData['Affiliate Code (Optional)'] = formData.affiliateCode;
      }
      
      // Add tax percentage if VAT registered
      if (formData.isVatRegistered && formData.taxPercentage) {
        const taxPercent = parseFloat(formData.taxPercentage);
        if (!isNaN(taxPercent) && taxPercent > 0) {
          apiData['Tax Percentage'] = taxPercent;
        }
      }

      if (isEditMode && productId) {
        // Update product
        console.log('Updating product with data:', apiData);
        const result = await updateProduct({ productId, data: apiData }).unwrap();
        console.log('Update result:', result);
        toast.success(locale === 'en' ? 'Product updated successfully!' : 'تم تحديث المنتج بنجاح!');
        // Invalidate and refetch seller products, featured products, and trending products
        dispatch(productsApi.util.invalidateTags(['Product', 'FeaturedProducts', 'TrendingProducts']));
        // Small delay to ensure cache is updated before redirect
        setTimeout(() => {
          router.push(`/${locale}/my-store`);
        }, 300);
      } else {
        // Create product
        console.log('Creating product with data:', apiData);
        await createProduct(apiData).unwrap();
        toast.success(locale === 'en' ? 'Product created successfully!' : 'تم إنشاء المنتج بنجاح!');
        // Invalidate and refetch seller products, featured products, and trending products
        dispatch(productsApi.util.invalidateTags(['Product', 'FeaturedProducts', 'TrendingProducts']));
        // Invalidate user profile to refetch updated role (buyer -> seller)
        dispatch(authApi.util.invalidateTags(['User']));
        onCancel();
      }
    } catch (error: any) {
      console.error('Product update/create error:', error);
      const errorMessage = 
        error?.data?.message || 
        error?.data?.error || 
        error?.message || 
        (locale === 'en' ? 'Failed to save product. Please check the console for details.' : 'فشل حفظ المنتج. يرجى التحقق من وحدة التحكم للتفاصيل.');
      toast.error(errorMessage);
    }
  };

  const handleAcceptTerms = async () => {
    setTermsAccepted(true);
    setShowTermsModal(false);
    // Automatically submit form after accepting terms
    // Pass skipTermsCheck=true to avoid checking terms again
    await handleSubmit(new Event('submit') as any, true);
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
                className={`w-full px-3 py-2 text-sm text-left hover:bg-saudi-green/10 transition-colors cursor-pointer ${
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
          {isEditMode
            ? locale === 'en'
              ? 'Edit Product'
              : 'تعديل المنتج'
            : locale === 'en'
            ? 'List an Item'
            : 'إضافة منتج'}
        </h2>
        <p className='text-sm text-white/90 mt-1'>
          {isEditMode
            ? locale === 'en'
              ? 'Update your product details'
              : 'قم بتحديث تفاصيل منتجك'
            : locale === 'en'
            ? 'Fill in the details to list your item for sale'
            : 'املأ التفاصيل لإدراج منتجك للبيع'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className='p-6 space-y-4'>
        {/* Add Photos */}
        <div className='bg-rich-sand/10 rounded-lg p-4 border border-rich-sand/20'>
          <div className='flex items-center justify-between mb-2'>
            <label className='block text-xs font-semibold text-deep-charcoal uppercase tracking-wide'>
            {locale === 'en' ? 'Photos' : 'الصور'}
          </label>
            <span className='text-xs text-deep-charcoal/60'>
              {photoFiles.length}/5 {locale === 'en' ? 'images' : 'صور'}
            </span>
          </div>
          <input
            type='file'
            accept='image/*'
            multiple
            onChange={handlePhotoUpload}
            className='hidden'
            id='photo-upload'
            disabled={photoFiles.length >= 5 || isUploadingImage}
          />
          <label
            htmlFor='photo-upload'
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ${
              photoFiles.length >= 5 || isUploadingImage
                ? 'bg-gray-400 text-white cursor-not-allowed opacity-60'
                : 'bg-saudi-green text-white hover:bg-saudi-green/90 cursor-pointer'
            }`}
          >
            <HiPlus className='w-4 h-4' />
            {photoFiles.length >= 5
              ? locale === 'en'
                ? 'Maximum 5 images reached'
                : 'تم الوصول إلى الحد الأقصى 5 صور'
              : locale === 'en'
              ? 'Add Photos'
              : 'إضافة صور'}
          </label>
          {photoFiles.length >= 5 && (
            <p className='mt-2 text-xs text-amber-600'>
              {locale === 'en'
                ? 'You have reached the maximum of 5 images. Remove some images to add new ones.'
                : 'لقد وصلت إلى الحد الأقصى من 5 صور. قم بإزالة بعض الصور لإضافة صور جديدة.'}
            </p>
          )}
          {photoPreviews.length > 0 && (
            <div className='grid grid-cols-4 md:grid-cols-6 gap-2 mt-3'>
              {photoPreviews.map((preview, index) => (
                <div
                  key={index}
                  className='relative aspect-square rounded-lg overflow-hidden border-2 border-rich-sand/30'
                >
                  <Image
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    fill
                    className='object-cover'
                    unoptimized
                  />
                  <button
                    type='button'
                    onClick={() => removePhoto(index)}
                    className='absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-md cursor-pointer'
                    disabled={isUploadingImage}
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

        {/* Price, Original Price, Currency, Quantity Row */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
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
              {locale === 'en' ? 'Original Price (Optional)' : 'السعر الأصلي (اختياري)'}
            </label>
            <input
              type='number'
              step='0.01'
              value={formData.originalPrice}
              onChange={e =>
                setFormData(prev => ({ ...prev, originalPrice: e.target.value }))
              }
              className='w-full px-3 py-2 text-sm border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green transition-colors'
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
              onChange={value => {
                setFormData(prev => ({
                  ...prev,
                  category: value,
                  subCategory: '',
                }));
                setCustomSubCategories([]);
                setNewSubCategoryInput('');
              }}
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
                className='px-2 py-1 bg-saudi-green text-white rounded hover:bg-saudi-green/90 transition-colors text-xs cursor-pointer'
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
                      className='hover:text-red-500 cursor-pointer'
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
                  ...customSubCategories.map(sub => ({
                    value: `create ${sub}`,
                    label: sub,
                  })),
                ]}
                placeholder={
                  locale === 'en' ? 'All Sub Categories' : 'جميع الفئات الفرعية'
                }
              />
              {/* Add New Subcategory */}
              <div className='flex gap-1.5 mt-1.5'>
                <input
                  type='text'
                  value={newSubCategoryInput}
                  onChange={e => setNewSubCategoryInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomSubCategory();
                    }
                  }}
                  placeholder={
                    locale === 'en'
                      ? 'Add new subcategory'
                      : 'إضافة فئة فرعية جديدة'
                  }
                  className='flex-1 px-2 py-1 text-xs border border-rich-sand/30 rounded focus:outline-none focus:ring-1 focus:ring-saudi-green focus:border-saudi-green transition-colors'
                />
                <button
                  type='button'
                  onClick={addCustomSubCategory}
                  className='px-2 py-1 bg-saudi-green text-white rounded hover:bg-saudi-green/90 transition-colors text-xs cursor-pointer'
                >
                  <HiPlus className='w-3 h-3' />
                </button>
              </div>
              {customSubCategories.length > 0 && (
                <div className='flex flex-wrap gap-1 mt-1.5'>
                  {customSubCategories.map((sub, index) => (
                    <span
                      key={index}
                      className='inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-saudi-green/10 text-saudi-green rounded text-xs'
                    >
                      {sub}
                      <button
                        type='button'
                        onClick={() => {
                          setCustomSubCategories(prev =>
                            prev.filter((_, i) => i !== index)
                          );
                          if (formData.subCategory === `create ${sub}`) {
                            setFormData(prev => ({ ...prev, subCategory: '' }));
                          }
                        }}
                        className='hover:text-red-500 cursor-pointer'
                      >
                        <HiXMark className='w-2.5 h-2.5' />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Condition and Color Row */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
          <div>
            <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
              {locale === 'en' ? 'Color (Optional)' : 'اللون (اختياري)'}
            </label>
            <CustomDropdown
              value={formData.color}
              onChange={value =>
                setFormData(prev => ({ ...prev, color: value }))
              }
              options={[
                { value: '', label: locale === 'en' ? 'Select Color' : 'اختر اللون' },
                ...colors.map(c => ({ value: c, label: c })),
              ]}
              placeholder={locale === 'en' ? 'Select Color' : 'اختر اللون'}
            />
          </div>
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
                    className='hover:text-red-500 transition-colors cursor-pointer'
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
          {/* Shipping Locations */}
          <div className='mt-4'>
            <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
              {locale === 'en' ? 'Shipping Locations' : 'مواقع الشحن'}
            </label>
            <div className='flex gap-1.5'>
              <input
                type='text'
                value={newShippingLocation}
                onChange={e => setNewShippingLocation(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addShippingLocation();
                  }
                }}
                placeholder={
                  locale === 'en'
                    ? 'Add shipping location'
                    : 'إضافة موقع الشحن'
                }
                className='flex-1 px-3 py-2 text-sm border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green transition-colors'
              />
              <button
                type='button'
                onClick={addShippingLocation}
                className='px-4 py-2 bg-saudi-green text-white rounded-lg hover:bg-saudi-green/90 transition-colors text-sm cursor-pointer'
              >
                <HiPlus className='w-4 h-4' />
              </button>
            </div>
            {shippingLocations.length > 0 && (
              <div className='flex flex-wrap gap-2 mt-2'>
                {shippingLocations.map((location, index) => (
                  <span
                    key={index}
                    className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-saudi-green/10 text-saudi-green rounded-full text-sm border border-saudi-green/20'
                  >
                    {location}
                    <button
                      type='button'
                      onClick={() => removeShippingLocation(index)}
                      className='hover:text-red-500 transition-colors cursor-pointer'
                    >
                      <HiXMark className='w-4 h-4' />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Affiliate Code (Optional) */}
        <div>
          <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
            {locale === 'en' ? 'Affiliate Code (Optional)' : 'رمز الشريك (اختياري)'}
          </label>
          <input
            type='text'
            value={formData.affiliateCode}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                affiliateCode: e.target.value.toUpperCase(),
              }))
            }
            placeholder={locale === 'en' ? 'AFF-XXXXXX' : 'AFF-XXXXXX'}
            className='w-full px-3 py-2 text-sm border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green transition-colors'
            style={{ textTransform: 'uppercase' }}
          />
        </div>

        {/* VAT Registration and Tax Percentage */}
        <div className='bg-rich-sand/10 rounded-lg p-4 border border-rich-sand/20'>
          <h3 className='text-sm font-semibold text-deep-charcoal mb-3 uppercase tracking-wide'>
            {locale === 'en' ? 'Tax Information' : 'معلومات الضريبة'}
          </h3>
          <div className='space-y-4'>
            <div>
              <label className='flex items-center gap-2 mb-2'>
                <input
                  type='checkbox'
                  checked={formData.isVatRegistered}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      isVatRegistered: e.target.checked,
                      taxPercentage: e.target.checked ? prev.taxPercentage : '',
                    }))
                  }
                  className='w-4 h-4 text-saudi-green focus:ring-saudi-green rounded'
                />
                <span className='text-sm font-medium text-deep-charcoal'>
                  {locale === 'en' ? 'Are you VAT registered?' : 'هل أنت مسجل في ضريبة القيمة المضافة؟'}
                </span>
              </label>
            </div>
            {formData.isVatRegistered && (
              <div>
                <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
                  {locale === 'en' ? 'Tax Percentage' : 'نسبة الضريبة'}
                </label>
                <div className='flex items-center gap-2'>
                  <input
                    type='number'
                    step='0.01'
                    min='0'
                    max='100'
                    value={formData.taxPercentage}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        taxPercentage: e.target.value,
                      }))
                    }
                    placeholder={locale === 'en' ? '15.0' : '15.0'}
                    className='w-full px-3 py-2 text-sm border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green transition-colors'
                  />
                  <span className='text-sm text-deep-charcoal/70 whitespace-nowrap'>%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className='flex gap-3 pt-4 border-t-2 border-rich-sand/30'>
          <button
            type='button'
            onClick={onCancel}
            className='flex-1 px-4 py-2.5 border-2 border-rich-sand/30 text-deep-charcoal rounded-lg font-semibold hover:bg-rich-sand/20 hover:border-rich-sand/50 transition-all text-sm cursor-pointer'
          >
            {locale === 'en' ? 'Cancel' : 'إلغاء'}
          </button>
          <button
            type='submit'
            disabled={isCreating || isUpdating || isUploadingImage}
            className='flex-1 px-4 py-2.5 bg-gradient-to-r from-saudi-green to-emerald-600 text-white rounded-lg font-semibold hover:from-saudi-green/90 hover:to-emerald-500 transition-all shadow-md hover:shadow-lg text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isCreating || isUpdating || isUploadingImage
              ? locale === 'en'
                ? isUploadingImage
                  ? 'Uploading images...'
                  : 'Saving...'
                : isUploadingImage
                ? 'جاري رفع الصور...'
                : 'جاري الحفظ...'
              : isEditMode
              ? locale === 'en'
                ? 'Update Product'
                : 'تحديث المنتج'
              : locale === 'en'
              ? 'Submit'
              : 'إرسال'}
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
