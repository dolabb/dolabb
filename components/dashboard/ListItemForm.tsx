'use client';

import TermsModal from '@/components/shared/TermsModal';
import { navigationCategories } from '@/data/navigation';
import { authApi, useUploadImageMutation } from '@/lib/api/authApi';
import {
  productsApi,
  useCreateProductMutation,
  useUpdateProductMutation,
} from '@/lib/api/productsApi';
import { useAppDispatch } from '@/lib/store/hooks';
import type { Product } from '@/types/products';
import { toast } from '@/utils/toast';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { HiPlus, HiXMark } from 'react-icons/hi2';

interface ListItemFormProps {
  onCancel: () => void;
  productId?: string;
  initialData?: Product;
}

// Valid category values accepted by the backend
// IMPORTANT: These must match exactly what the backend expects
const VALID_BACKEND_CATEGORIES = ['women', 'men', 'watches', 'jewelry', 'accessories'] as const;
type ValidCategory = typeof VALID_BACKEND_CATEGORIES[number];

// Map any frontend category key to the valid backend category
// This handles any legacy data or typos (e.g., 'jewellery' -> 'jewelry')
const mapToValidCategory = (category: string): ValidCategory | string => {
  const normalized = category.toLowerCase().trim();
  
  // Handle jewellery (British spelling) -> jewelry (American spelling)
  if (normalized === 'jewellery') {
    return 'jewelry';
  }
  
  // If it's already a valid category, return it
  if (VALID_BACKEND_CATEGORIES.includes(normalized as ValidCategory)) {
    return normalized as ValidCategory;
  }
  
  // Return as-is if not found (will be rejected by backend validation)
  return normalized;
};

// Supported currencies with their symbols
const currencies = [
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'OMR', symbol: 'ر.ع', name: 'Omani Rial' },
  { code: 'QAR', symbol: 'ر.ق', name: 'Qatari Riyal' },
];
const genders = ['Men', 'Women', 'Unisex', 'Kids'];

// Category-specific size mappings
const categorySizes: Record<string, string[]> = {
  // Clothing - T-shirts, Shirts, Tops
  tshirts: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'],
  shirts: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'],
  tops: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'],
  blouses: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
  dresses: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
  pants: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
  jeans: [
    '24',
    '25',
    '26',
    '27',
    '28',
    '29',
    '30',
    '31',
    '32',
    '33',
    '34',
    '36',
    '38',
    '40',
    '42',
  ],
  shorts: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
  skirts: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
  jackets: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
  coats: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
  hoodies: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
  sweaters: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],

  // Shoes
  shoes: [
    '35',
    '36',
    '37',
    '38',
    '39',
    '40',
    '41',
    '42',
    '43',
    '44',
    '45',
    '46',
    '47',
    '48',
  ],
  sneakers: [
    '35',
    '36',
    '37',
    '38',
    '39',
    '40',
    '41',
    '42',
    '43',
    '44',
    '45',
    '46',
    '47',
    '48',
  ],
  boots: [
    '35',
    '36',
    '37',
    '38',
    '39',
    '40',
    '41',
    '42',
    '43',
    '44',
    '45',
    '46',
  ],
  sandals: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
  heels: ['35', '36', '37', '38', '39', '40', '41', '42', '43'],
  flats: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44'],

  // Bags
  bags: ['Small', 'Medium', 'Large', 'Extra Large'],
  handbags: ['Small', 'Medium', 'Large'],
  backpacks: ['Small', 'Medium', 'Large', 'Extra Large'],
  'tote-bags': ['Small', 'Medium', 'Large'],
  clutches: ['Small', 'Medium'],
  crossbody: ['Small', 'Medium', 'Large'],

  // Accessories
  accessories: ['One Size'],
  jewelry: ['One Size'],
  watches: ['Small', 'Medium', 'Large'],
  belts: ['XS', 'S', 'M', 'L', 'XL'],
  hats: ['S', 'M', 'L', 'XL'],
  scarves: ['One Size'],
  sunglasses: ['One Size'],

  // Underwear & Lingerie
  underwear: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
  bras: [
    '32A',
    '32B',
    '32C',
    '34A',
    '34B',
    '34C',
    '36A',
    '36B',
    '36C',
    '38A',
    '38B',
    '38C',
  ],
  lingerie: ['XS', 'S', 'M', 'L', 'XL'],

  // Swimwear
  swimwear: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
  bikinis: ['XS', 'S', 'M', 'L', 'XL'],

  // Kids
  'kids-clothing': ['2T', '3T', '4T', '5T', '6', '7', '8', '10', '12', '14'],
  'kids-shoes': [
    '25',
    '26',
    '27',
    '28',
    '29',
    '30',
    '31',
    '32',
    '33',
    '34',
    '35',
  ],
};

// Default sizes (fallback)
const defaultSizes = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  '2XL',
  '3XL',
  '4XL',
  '5XL',
  'One Size',
];

// Function to get sizes based on category and subcategory
const getSizesForCategory = (
  category: string,
  subCategory: string
): string[] => {
  // Normalize subcategory key (remove spaces, hyphens, convert to lowercase)
  const normalizedSubCategory = subCategory
    ? subCategory
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
    : '';

  // First try subcategory (exact match)
  if (normalizedSubCategory && categorySizes[normalizedSubCategory]) {
    return categorySizes[normalizedSubCategory];
  }

  // Try subcategory without normalization (for keys like 'tshirts', 'shoes')
  if (subCategory && categorySizes[subCategory.toLowerCase()]) {
    return categorySizes[subCategory.toLowerCase()];
  }

  // Try common subcategory patterns
  if (normalizedSubCategory) {
    // Check for shoes-related
    if (
      normalizedSubCategory.includes('shoe') ||
      normalizedSubCategory.includes('sneaker') ||
      normalizedSubCategory.includes('boot') ||
      normalizedSubCategory.includes('sandal') ||
      normalizedSubCategory.includes('heel') ||
      normalizedSubCategory.includes('flat')
    ) {
      return categorySizes['shoes'];
    }

    // Check for bags-related
    if (
      normalizedSubCategory.includes('bag') ||
      normalizedSubCategory.includes('purse') ||
      normalizedSubCategory.includes('backpack') ||
      normalizedSubCategory.includes('tote') ||
      normalizedSubCategory.includes('clutch') ||
      normalizedSubCategory.includes('crossbody')
    ) {
      return categorySizes['bags'];
    }

    // Check for clothing
    if (
      normalizedSubCategory.includes('tshirt') ||
      normalizedSubCategory.includes('shirt') ||
      normalizedSubCategory.includes('top') ||
      normalizedSubCategory.includes('blouse')
    ) {
      return categorySizes['tshirts'];
    }

    // Check for jeans
    if (normalizedSubCategory.includes('jean')) {
      return categorySizes['jeans'];
    }

    // Check for accessories
    if (
      normalizedSubCategory.includes('accessory') ||
      normalizedSubCategory.includes('jewelry') ||
      normalizedSubCategory.includes('jewellery') ||
      normalizedSubCategory.includes('sunglass') ||
      normalizedSubCategory.includes('scarf') ||
      normalizedSubCategory.includes('hat')
    ) {
      return categorySizes['accessories'];
    }
  }

  // Then try category
  if (category && categorySizes[category.toLowerCase()]) {
    return categorySizes[category.toLowerCase()];
  }

  // Default fallback
  return defaultSizes;
};
const conditions = ['New with tag', 'Like new', 'Good', 'Fair', 'Poor'];

// Map display condition values to API-expected values
const conditionMap: Record<string, string> = {
  'New with tag': 'new',
  'Like new': 'like-new',
  Good: 'good',
  Fair: 'fair',
  Poor: 'fair', // Map Poor to fair as API doesn't have 'poor'
};

// Reverse map: API values to display values (for edit mode)
const reverseConditionMap: Record<string, string> = {
  new: 'New with tag',
  'like-new': 'Like new',
  good: 'Good',
  fair: 'Fair',
};
const colors = [
  'Black',
  'Grey',
  'White',
  'Brown',
  'Tan',
  'Cream',
  'Yellow',
  'Red',
  'Burgundy',
  'Orange',
  'Pink',
  'Purple',
  'Blue',
  'Navy',
  'Green',
  'Khaki',
  'Multi',
  'Silver',
  'Gold',
];

// Color mapping for display swatches
const colorMap: Record<string, string> = {
  Black: '#000000',
  Grey: '#808080',
  White: '#FFFFFF',
  Brown: '#8B4513',
  Tan: '#D2B48C',
  Cream: '#FFFDD0',
  Yellow: '#FFFF00',
  Red: '#FF0000',
  Burgundy: '#800020',
  Orange: '#FFA500',
  Pink: '#FFC0CB',
  Purple: '#800080',
  Blue: '#0000FF',
  Navy: '#000080',
  Green: '#008000',
  Khaki: '#C3B091',
  Silver: '#C0C0C0',
  Gold: '#FFD700',
  Multi: 'multi', // Special case
};

export default function ListItemForm({
  onCancel,
  productId,
  initialData,
}: ListItemFormProps) {
  const locale = useLocale();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isEditMode = !!productId && !!initialData;

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [uploadImage, { isLoading: isUploadingImage }] =
    useUploadImageMutation();

  // Helper function to normalize API response to Product type
  // Handles both capitalized API field names and lowercase Product type field names
  const normalizeProductData = (data: any): Product | null => {
    if (!data) return null;

    // Handle images - check both "Images" (capital) and "images" (lowercase)
    const images = (data as any).Images || data.images || [];
    const filteredImages = Array.isArray(images)
      ? images.filter(
          (img: any) =>
            img && img.trim() !== '' && img !== 'undefined' && img !== 'null'
        )
      : [];

    // Handle tags - check both "Tags/Keywords" and "tags"
    const tagsData = (data as any)['Tags/Keywords'] || data.tags || [];
    const normalizedTags = Array.isArray(tagsData)
      ? tagsData.filter((tag: any) => tag && tag.trim() !== '')
      : typeof tagsData === 'string'
      ? tagsData
          .split(',')
          .map((t: string) => t.trim())
          .filter(Boolean)
      : [];

    // Handle shipping info - check both nested object and flat API fields
    const shippingCost =
      data.shippingInfo?.cost ?? (data as any)['Shipping Cost'] ?? 0;
    const estimatedDays =
      data.shippingInfo?.estimatedDays ??
      (data as any)['Processing Time (days)'] ??
      3;
    const shippingLocations = data.shippingInfo?.locations ??
      (data as any)['Shipping Locations'] ?? ['Saudi Arabia'];

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
        cost:
          typeof shippingCost === 'number'
            ? shippingCost
            : parseFloat(shippingCost) || 0,
        estimatedDays:
          typeof estimatedDays === 'number'
            ? estimatedDays
            : parseInt(estimatedDays) || 3,
        locations: Array.isArray(shippingLocations)
          ? shippingLocations
          : ['Saudi Arabia'],
      },
      affiliateCode:
        data.affiliateCode || (data as any)['Affiliate Code (Optional)'] || '',
      taxPercentage: (data as any)['Tax Percentage'] ?? data.taxPercentage,
      ...data, // Spread to include any other fields
    };
  };

  // Normalize initial data - use useMemo to avoid recalculating on every render
  const normalizedData = useMemo(
    () => normalizeProductData(initialData),
    [initialData]
  );

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
    currency:
      (normalizedData as any)?.Currency ||
      (normalizedData as any)?.currency ||
      'SAR', // Use product currency if available, default to SAR
    category: normalizedData?.category || '',
    gender: 'Unisex', // Default
    subCategory: normalizedData?.subcategory || '',
    size: normalizedData?.size || '',
    color: normalizedData?.color || '',
    customSize: '',
    condition: normalizedData?.condition
      ? reverseConditionMap[normalizedData.condition] ||
        normalizedData.condition
      : '',
    brandName: normalizedData?.brand || '',
    quantity: normalizedData?.quantity?.toString() || '',
    hasVariants: false,
    variants: '',
    sku: '',
    tags: normalizedData?.tags?.join(', ') || '',
    shippingCost: normalizedData?.shippingInfo?.cost?.toString() || '',
    processingTime:
      normalizedData?.shippingInfo?.estimatedDays?.toString() || '',
    affiliateCode: normalizedData?.affiliateCode || '',
    isVatRegistered: normalizedData?.taxPercentage ? true : false,
    taxPercentage: normalizedData?.taxPercentage?.toString() || '',
  });

  const [customSizes, setCustomSizes] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>(normalizedData?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [authenticityConfirmed, setAuthenticityConfirmed] = useState(false);
  const [newSubCategoryInput, setNewSubCategoryInput] = useState('');
  const [customSubCategories, setCustomSubCategories] = useState<string[]>([]);
  const [shippingLocations, setShippingLocations] = useState<string[]>(
    normalizedData?.shippingInfo?.locations || ['Saudi Arabia']
  );
  const [newShippingLocation, setNewShippingLocation] = useState('');
  // Validation errors state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showErrors, setShowErrors] = useState(false);
  
  // Helper function to clear a specific error when user corrects the field
  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  // Handle colors as array for multi-select
  const [selectedColors, setSelectedColors] = useState<string[]>(() => {
    if (normalizedData?.color) {
      // Handle both string (comma-separated) and array formats
      if (typeof normalizedData.color === 'string') {
        return normalizedData.color
          .split(',')
          .map(c => c.trim())
          .filter(Boolean);
      }
      if (Array.isArray(normalizedData.color)) {
        return normalizedData.color;
      }
    }
    return [];
  });

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
        currency:
          (normalizedData as any).Currency ||
          (normalizedData as any).currency ||
          'SAR',
        category: normalizedData.category || '',
        gender: 'Unisex',
        subCategory: normalizedData.subcategory || '',
        size: normalizedData.size || '',
        color: normalizedData.color || '',
        customSize: '',
        condition: normalizedData.condition
          ? reverseConditionMap[normalizedData.condition] ||
            normalizedData.condition
          : '',
        brandName: normalizedData.brand || '',
        quantity: normalizedData.quantity?.toString() || '',
        hasVariants: false,
        variants: '',
        sku: '',
        tags: normalizedData.tags?.join(', ') || '',
        shippingCost: normalizedData.shippingInfo?.cost?.toString() || '',
        processingTime:
          normalizedData.shippingInfo?.estimatedDays?.toString() || '',
        affiliateCode: normalizedData.affiliateCode || '',
        isVatRegistered: normalizedData.taxPercentage ? true : false,
        taxPercentage: normalizedData.taxPercentage?.toString() || '',
      });

      // Update tags
      setTags(normalizedData.tags || []);

      // Update shipping locations
      setShippingLocations(
        normalizedData.shippingInfo?.locations || ['Saudi Arabia']
      );

      // Update selected colors
      if (normalizedData.color) {
        if (typeof normalizedData.color === 'string') {
          setSelectedColors(
            normalizedData.color
              .split(',')
              .map(c => c.trim())
              .filter(Boolean)
          );
        } else if (Array.isArray(normalizedData.color)) {
          setSelectedColors(normalizedData.color);
        } else {
          setSelectedColors([]);
        }
      } else {
        setSelectedColors([]);
      }
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
          const preview = await new Promise<string>(resolve => {
            reader.onload = e => {
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
              ? `You can only upload ${maxAllowed} more image${
                  maxAllowed > 1 ? 's' : ''
                }. Maximum 5 images allowed.`
              : `يمكنك تحميل ${maxAllowed} صورة${
                  maxAllowed > 1 ? '' : ''
                } فقط. الحد الأقصى 5 صور.`
          );
          // Only process the files that fit within the limit
          setPhotoFiles(prev => [...prev, ...filesToAdd.slice(0, maxAllowed)]);
          clearError('photos');
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
      clearError('photos');
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
      setFormData(prev => ({
        ...prev,
        subCategory: `create ${newSubCategory}`,
      }));
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

  // Get dynamic sizes based on category and subcategory
  const availableSizes = getSizesForCategory(
    formData.category,
    formData.subCategory
  );

  const handleSubmit = async (e: React.FormEvent, skipTermsCheck = false) => {
    e.preventDefault();

    // Validate required fields
    const newErrors: Record<string, string> = {};
    
    if (photoFiles.length === 0) {
      newErrors.photos = locale === 'en' ? 'At least one photo is required' : 'مطلوب صورة واحدة على الأقل';
    }
    if (!formData.title.trim()) {
      newErrors.title = locale === 'en' ? 'Title is required' : 'العنوان مطلوب';
    }
    if (!formData.description.trim()) {
      newErrors.description = locale === 'en' ? 'Description is required' : 'الوصف مطلوب';
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = locale === 'en' ? 'Valid price is required' : 'السعر مطلوب';
    }
    if (!formData.quantity || parseInt(formData.quantity) < 0) {
      newErrors.quantity = locale === 'en' ? 'Quantity is required' : 'الكمية مطلوبة';
    }
    if (!formData.category) {
      newErrors.category = locale === 'en' ? 'Category is required' : 'الفئة مطلوبة';
    }
    if (!formData.condition) {
      newErrors.condition = locale === 'en' ? 'Condition is required' : 'الحالة مطلوبة';
    }
    if (!formData.shippingCost && formData.shippingCost !== '0') {
      newErrors.shippingCost = locale === 'en' ? 'Shipping cost is required' : 'تكلفة الشحن مطلوبة';
    }
    if (!formData.processingTime) {
      newErrors.processingTime = locale === 'en' ? 'Processing time is required' : 'وقت المعالجة مطلوب';
    }
    if (!authenticityConfirmed) {
      newErrors.authenticity = locale === 'en' ? 'Please confirm authenticity' : 'يرجى تأكيد الأصالة';
    }
    
    // If there are errors, show them and stop
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setShowErrors(true);
      // Scroll to first error
      setTimeout(() => {
        const firstErrorField = document.querySelector('[data-error="true"]');
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      toast.error(
        locale === 'en'
          ? 'Please fill in all required fields'
          : 'يرجى ملء جميع الحقول المطلوبة'
      );
      return;
    }
    
    // Clear errors if validation passes
    setErrors({});
    setShowErrors(false);

    // Show terms modal if not accepted (only for create mode)
    // Skip check if called from handleAcceptTerms
    if (!skipTermsCheck && !isEditMode && !termsAccepted) {
      setShowTermsModal(true);
      return;
    }

    // Check authenticity confirmation
    if (!authenticityConfirmed) {
      toast.error(
        locale === 'en'
          ? 'Please confirm that the item is authentic and legally owned by you.'
          : 'يرجى التأكيد على أن المنتج أصلي ومملوك قانونياً لك.'
      );
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

            // Extract error message from API response (check multiple possible error structures)
            const apiErrorMessage =
              uploadError?.data?.error ||
              uploadError?.data?.message ||
              uploadError?.error?.data?.error ||
              uploadError?.error?.data?.message ||
              uploadError?.error?.data ||
              (typeof uploadError?.data === 'string' ? uploadError.data : null);

            // Check if it's a timeout error (check multiple possible timeout indicators)
            const errorMessage =
              uploadError?.message ||
              uploadError?.error?.data ||
              uploadError?.data ||
              (typeof uploadError?.error?.data === 'string'
                ? uploadError.error.data
                : '') ||
              '';

            const errorString = String(errorMessage).toLowerCase();
            const isTimeout =
              errorString.includes('timeout') ||
              errorString.includes('exceeded') ||
              uploadError?.code === 'ECONNABORTED' ||
              uploadError?.name === 'TimeoutError' ||
              uploadError?.status === undefined; // Axios timeout errors often have undefined status

            if (isTimeout) {
              toast.error(
                locale === 'en'
                  ? 'Image upload timed out. The image might be too large or the connection is slow. Please try again with smaller images (under 5MB) or check your internet connection.'
                  : 'انتهت مهلة تحميل الصورة. قد تكون الصورة كبيرة جداً أو الاتصال بطيء. يرجى المحاولة مرة أخرى بصور أصغر (أقل من 5 ميجابايت) أو التحقق من اتصال الإنترنت.'
              );
            } else if (apiErrorMessage) {
              // Show the exact error message from the API
              toast.error(
                locale === 'en'
                  ? `Image upload failed: ${apiErrorMessage}`
                  : `فشل تحميل الصورة: ${apiErrorMessage}`
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
      // Ensure category is a valid backend value
      const validCategory = mapToValidCategory(formData.category);
      
      const apiData: any = {
        itemtitle: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        Images: imageUrls, // Use uploaded URLs instead of base64
        category: validCategory,
        subcategory: formData.subCategory,
        brand: formData.brandName,
        Size: formData.size,
        Condition: formData.condition
          ? conditionMap[formData.condition] || formData.condition.toLowerCase()
          : 'fair',
        'Tags/Keywords':
          tags.length > 0
            ? tags
            : formData.tags
            ? formData.tags.split(',').map(t => t.trim())
            : [],
        Quantity: formData.quantity ? parseInt(formData.quantity) : 1,
        currency: formData.currency,
        Gender: formData.gender || 'Unisex',
        'Shipping Cost': formData.shippingCost
          ? parseFloat(formData.shippingCost)
          : 0,
        'Processing Time (days)': formData.processingTime
          ? parseInt(formData.processingTime)
          : 3,
        'Shipping Locations':
          shippingLocations.length > 0 ? shippingLocations : ['Saudi Arabia'],
      };

      // Optional fields
      if (formData.sku) {
        apiData['SKU/ID (Optional)'] = formData.sku;
      }

      if (selectedColors.length > 0) {
        // Send colors as comma-separated string for API compatibility
        apiData.Color = selectedColors.join(', ');
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
        const result = await updateProduct({
          productId,
          data: apiData,
        }).unwrap();
        console.log('Update result:', result);

        // Check if product was restocked (quantity changed from 0 or less to positive)
        const wasOutOfStock =
          normalizedData?.isOutOfStock ??
          (normalizedData?.quantity === null ||
            normalizedData?.quantity === undefined ||
            normalizedData?.quantity <= 0);
        const newQuantity = formData.quantity ? parseInt(formData.quantity) : 0;
        const isRestocked = wasOutOfStock && newQuantity > 0;

        if (isRestocked) {
          toast.success(
            locale === 'en'
              ? 'Product restocked successfully! It is now available for purchase.'
              : 'تم تجديد المخزون بنجاح! المنتج متاح الآن للشراء.'
          );
        } else {
          toast.success(
            locale === 'en'
              ? 'Product updated successfully!'
              : 'تم تحديث المنتج بنجاح!'
          );
        }
        // Invalidate and refetch seller products, featured products, and trending products
        // Also invalidate the specific product detail cache to ensure it refreshes
        dispatch(
          productsApi.util.invalidateTags([
            { type: 'Product', id: productId },
            'Product',
            'FeaturedProducts',
            'TrendingProducts',
          ])
        );
        // Small delay to ensure cache is updated before redirect
        setTimeout(() => {
          router.push(`/${locale}/my-store`);
        }, 300);
      } else {
        // Create product
        console.log('Creating product with data:', apiData);
        await createProduct(apiData).unwrap();
        toast.success(
          locale === 'en'
            ? 'Product created successfully!'
            : 'تم إنشاء المنتج بنجاح!'
        );
        // Invalidate and refetch seller products, featured products, and trending products
        dispatch(
          productsApi.util.invalidateTags([
            'Product',
            'FeaturedProducts',
            'TrendingProducts',
          ])
        );
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
        (locale === 'en'
          ? 'Failed to save product. Please check the console for details.'
          : 'فشل حفظ المنتج. يرجى التحقق من وحدة التحكم للتفاصيل.');
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

  // Color Swatch Component
  const ColorSwatch = ({ colorName }: { colorName: string }) => {
    if (colorName === 'Multi') {
      // Show all colors for Multi - using a conic gradient pattern
      const allColors = colors
        .filter(c => c !== 'Multi')
        .map(c => colorMap[c] || '#CCCCCC');
      const colorStops = allColors
        .map((color, index) => {
          const percentage = (index / allColors.length) * 100;
          return `${color} ${percentage}%`;
        })
        .join(', ');

      return (
        <div
          className='w-5 h-5 rounded-full border border-gray-300 relative overflow-hidden flex-shrink-0'
          title='Multi'
        >
          <div
            className='absolute inset-0'
            style={{
              background: `conic-gradient(from 0deg, ${colorStops})`,
            }}
          />
        </div>
      );
    }

    const colorHex = colorMap[colorName] || '#CCCCCC';
    const isLight =
      colorName === 'White' ||
      colorName === 'Cream' ||
      colorName === 'Yellow' ||
      colorName === 'Silver' ||
      colorName === 'Gold';

    return (
      <div
        className={`w-5 h-5 rounded-full border ${
          isLight ? 'border-gray-300' : 'border-transparent'
        } flex-shrink-0`}
        style={{ backgroundColor: colorHex }}
        title={colorName}
      />
    );
  };

  // Multi-select Color Dropdown Component
  const MultiSelectColorDropdown = () => {
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

    const toggleColor = (colorName: string) => {
      if (selectedColors.includes(colorName)) {
        setSelectedColors(prev => prev.filter(c => c !== colorName));
      } else {
        setSelectedColors(prev => [...prev, colorName]);
      }
    };

    return (
      <div className='relative' ref={dropdownRef}>
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
          <span
            className={selectedColors.length > 0 ? '' : 'text-deep-charcoal/50'}
          >
            {selectedColors.length > 0
              ? `${selectedColors.length} ${
                  locale === 'en' ? 'color(s) selected' : 'لون محدد'
                }`
              : locale === 'en'
              ? 'Select Colors'
              : 'اختر الألوان'}
          </span>
        </button>
        {isOpen && (
          <div className='absolute z-50 w-full mt-1 bg-white border border-rich-sand/30 rounded-lg shadow-lg overflow-hidden min-w-[200px]'>
            <div className='max-h-[240px] overflow-y-auto'>
              {colors.map(colorName => {
                const isSelected = selectedColors.includes(colorName);
                return (
                  <button
                    key={colorName}
                    type='button'
                    onClick={() => toggleColor(colorName)}
                    className={`w-full px-3 py-2 text-sm text-left hover:bg-saudi-green/10 transition-colors cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? 'bg-saudi-green/20 text-saudi-green font-medium'
                        : 'text-deep-charcoal'
                    }`}
                  >
                    <ColorSwatch colorName={colorName} />
                    <span>{colorName}</span>
                    {isSelected && (
                      <span className='ml-auto text-saudi-green'>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Custom dropdown component
  const CustomDropdown = ({
    value,
    onChange,
    options,
    placeholder,
    className = '',
    hasError = false,
  }: {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder: string;
    className?: string;
    hasError?: boolean;
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
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green transition-colors bg-white text-deep-charcoal cursor-pointer text-left flex items-center justify-between ${hasError ? 'border-red-500' : 'border-rich-sand/30'}`}
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
        <div 
          className={`bg-rich-sand/10 rounded-lg p-4 border ${showErrors && errors.photos ? 'border-red-500' : 'border-rich-sand/20'}`}
          data-error={showErrors && errors.photos ? 'true' : undefined}
        >
          <div className='flex items-center justify-between mb-2'>
            <label className='block text-xs font-semibold text-deep-charcoal uppercase tracking-wide'>
              {locale === 'en' ? 'Photos' : 'الصور'} <span className='text-red-500'>*</span>
            </label>
            <span className='text-xs text-deep-charcoal/60'>
              {photoFiles.length}/5 {locale === 'en' ? 'images' : 'صور'}
            </span>
          </div>
          {showErrors && errors.photos && (
            <p className='text-xs text-red-500 mb-2'>{errors.photos}</p>
          )}
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
          <div data-error={showErrors && errors.title ? 'true' : undefined}>
            <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
              {locale === 'en' ? 'Item Title' : 'عنوان المنتج'} <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              value={formData.title}
              onChange={e => {
                setFormData(prev => ({ ...prev, title: e.target.value }));
                clearError('title');
              }}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green transition-colors ${showErrors && errors.title ? 'border-red-500' : 'border-rich-sand/30'}`}
              required
            />
            {showErrors && errors.title && (
              <p className='text-xs text-red-500 mt-1'>{errors.title}</p>
            )}
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
        <div data-error={showErrors && errors.description ? 'true' : undefined}>
          <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
            {locale === 'en' ? 'Description' : 'الوصف'} <span className='text-red-500'>*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={e => {
              setFormData(prev => ({ ...prev, description: e.target.value }));
              clearError('description');
            }}
            rows={3}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green transition-colors resize-none ${showErrors && errors.description ? 'border-red-500' : 'border-rich-sand/30'}`}
            required
          />
          {showErrors && errors.description && (
            <p className='text-xs text-red-500 mt-1'>{errors.description}</p>
          )}
        </div>

        {/* Price, Original Price, Currency, Quantity Row */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <div data-error={showErrors && errors.price ? 'true' : undefined}>
            <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
              {locale === 'en' ? 'Price' : 'السعر'} <span className='text-red-500'>*</span>
            </label>
            <input
              type='number'
              step='0.01'
              value={formData.price}
              onChange={e => {
                setFormData(prev => ({ ...prev, price: e.target.value }));
                clearError('price');
              }}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green transition-colors ${showErrors && errors.price ? 'border-red-500' : 'border-rich-sand/30'}`}
              required
            />
            {showErrors && errors.price && (
              <p className='text-xs text-red-500 mt-1'>{errors.price}</p>
            )}
          </div>
          <div>
            <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
              {locale === 'en'
                ? 'Original Price (Optional)'
                : 'السعر الأصلي (اختياري)'}
            </label>
            <input
              type='number'
              step='0.01'
              value={formData.originalPrice}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  originalPrice: e.target.value,
                }))
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
              options={currencies.map(c => ({
                value: c.code,
                label: `${c.code} (${c.symbol})`,
              }))}
              placeholder={locale === 'en' ? 'Select Currency' : 'اختر العملة'}
            />
          </div>
          <div data-error={showErrors && errors.quantity ? 'true' : undefined}>
            <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
              {locale === 'en' ? 'Quantity' : 'الكمية'} <span className='text-red-500'>*</span>
            </label>
            <input
              type='number'
              min='0'
              value={formData.quantity}
              onChange={e => {
                setFormData(prev => ({ ...prev, quantity: e.target.value }));
                clearError('quantity');
              }}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green transition-colors ${showErrors && errors.quantity ? 'border-red-500' : 'border-rich-sand/30'}`}
              required
            />
            {showErrors && errors.quantity && (
              <p className='text-xs text-red-500 mt-1'>{errors.quantity}</p>
            )}
            {/* Show helpful message for out of stock products */}
            {isEditMode &&
              normalizedData &&
              (normalizedData.isOutOfStock ??
                (normalizedData.quantity === null ||
                  normalizedData.quantity === undefined ||
                  normalizedData.quantity <= 0)) && (
                <p className='mt-1.5 text-xs text-amber-600 font-medium'>
                  {locale === 'en'
                    ? 'This product is out of stock. Increase quantity to make it available again.'
                    : 'هذا المنتج غير متوفر. قم بزيادة الكمية لجعله متاحاً مرة أخرى.'}
                </p>
              )}
          </div>
        </div>

        {/* Category, Gender, Size, Sub Category Row */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <div data-error={showErrors && errors.category ? 'true' : undefined}>
            <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
              {locale === 'en' ? 'Category' : 'الفئة'} <span className='text-red-500'>*</span>
            </label>
            <CustomDropdown
              value={formData.category}
              onChange={value => {
                const newCategory = value;
                const newSizes = getSizesForCategory(newCategory, '');
                const currentSizeValid =
                  !formData.size || newSizes.includes(formData.size);

                setFormData(prev => ({
                  ...prev,
                  category: newCategory,
                  subCategory: '',
                  size: currentSizeValid ? prev.size : '',
                }));
                setCustomSubCategories([]);
                setNewSubCategoryInput('');
                clearError('category');
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
              hasError={showErrors && !!errors.category}
            />
            {showErrors && errors.category && (
              <p className='text-xs text-red-500 mt-1'>{errors.category}</p>
            )}
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
                ...availableSizes.map(s => ({ value: s, label: s })),
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
                onChange={value => {
                  const newSubCategory = value;
                  const newSizes = getSizesForCategory(
                    formData.category,
                    newSubCategory
                  );
                  const currentSizeValid =
                    !formData.size || newSizes.includes(formData.size);

                  setFormData(prev => ({
                    ...prev,
                    subCategory: newSubCategory,
                    size: currentSizeValid ? prev.size : '',
                  }));
                }}
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
          <div data-error={showErrors && errors.condition ? 'true' : undefined}>
            <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
              {locale === 'en' ? 'Condition' : 'الحالة'} <span className='text-red-500'>*</span>
            </label>
            <CustomDropdown
              value={formData.condition}
              onChange={value => {
                setFormData(prev => ({ ...prev, condition: value }));
                clearError('condition');
              }}
              options={[
                { value: '', label: locale === 'en' ? 'Select' : 'اختر' },
                ...conditions.map(c => ({ value: c, label: c })),
              ]}
              placeholder={locale === 'en' ? 'Select' : 'اختر'}
              hasError={showErrors && !!errors.condition}
            />
            {showErrors && errors.condition && (
              <p className='text-xs text-red-500 mt-1'>{errors.condition}</p>
            )}
          </div>
          <div>
            <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
              {locale === 'en' ? 'Colors (Optional)' : 'الألوان (اختياري)'}
            </label>
            <MultiSelectColorDropdown />
            {selectedColors.length > 0 && (
              <div className='flex flex-wrap gap-2 mt-2'>
                {selectedColors.map((color, index) => (
                  <span
                    key={index}
                    className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-saudi-green/10 text-saudi-green rounded-full text-sm border border-saudi-green/20'
                  >
                    <ColorSwatch colorName={color} />
                    {color}
                    <button
                      type='button'
                      onClick={() =>
                        setSelectedColors(prev =>
                          prev.filter((_, i) => i !== index)
                        )
                      }
                      className='hover:text-red-500 transition-colors cursor-pointer ml-1'
                    >
                      <HiXMark className='w-4 h-4' />
                    </button>
                  </span>
                ))}
              </div>
            )}
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
            <div data-error={showErrors && errors.shippingCost ? 'true' : undefined}>
              <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
                {locale === 'en' ? 'Shipping Cost' : 'تكلفة الشحن'} <span className='text-red-500'>*</span>
              </label>
              <input
                type='number'
                step='0.01'
                value={formData.shippingCost}
                onChange={e => {
                  setFormData(prev => ({
                    ...prev,
                    shippingCost: e.target.value,
                  }));
                  clearError('shippingCost');
                }}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green transition-colors ${showErrors && errors.shippingCost ? 'border-red-500' : 'border-rich-sand/30'}`}
                required
              />
              {showErrors && errors.shippingCost && (
                <p className='text-xs text-red-500 mt-1'>{errors.shippingCost}</p>
              )}
            </div>
            <div data-error={showErrors && errors.processingTime ? 'true' : undefined}>
              <label className='block text-xs font-semibold text-deep-charcoal mb-1.5 uppercase tracking-wide'>
                {locale === 'en'
                  ? 'Processing Time (days)'
                  : 'وقت المعالجة (أيام)'} <span className='text-red-500'>*</span>
              </label>
              <input
                type='number'
                min='1'
                value={formData.processingTime}
                onChange={e => {
                  setFormData(prev => ({
                    ...prev,
                    processingTime: e.target.value,
                  }));
                  clearError('processingTime');
                }}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green transition-colors ${showErrors && errors.processingTime ? 'border-red-500' : 'border-rich-sand/30'}`}
                required
              />
              {showErrors && errors.processingTime && (
                <p className='text-xs text-red-500 mt-1'>{errors.processingTime}</p>
              )}
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
                  locale === 'en' ? 'Add shipping location' : 'إضافة موقع الشحن'
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
            {locale === 'en'
              ? 'Affiliate Code (Optional)'
              : 'رمز الشريك (اختياري)'}
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
                  {locale === 'en'
                    ? 'Are you VAT registered?'
                    : 'هل أنت مسجل في ضريبة القيمة المضافة؟'}
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
                  <span className='text-sm text-deep-charcoal/70 whitespace-nowrap'>
                    %
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Authenticity Confirmation */}
        <div 
          className={`bg-rich-sand/10 rounded-lg p-4 border ${showErrors && errors.authenticity ? 'border-red-500' : 'border-rich-sand/20'}`}
          data-error={showErrors && errors.authenticity ? 'true' : undefined}
        >
          <label className='flex items-start gap-3 cursor-pointer'>
            <input
              type='checkbox'
              checked={authenticityConfirmed}
              onChange={e => {
                setAuthenticityConfirmed(e.target.checked);
                if (e.target.checked) clearError('authenticity');
              }}
              className='mt-1 w-4 h-4 text-saudi-green focus:ring-saudi-green rounded cursor-pointer'
              required
            />
            <span className='text-sm text-deep-charcoal leading-relaxed'>
              {locale === 'en'
                ? 'I confirm that the item I am listing is authentic, legally owned by me, and not stolen, counterfeit, fake or an imitation.'
                : 'أؤكد أن المنتج الذي أقوم بإدراجه أصلي ومملوك قانونياً لي، وليس مسروقاً أو مزيفاً أو تقليداً.'} <span className='text-red-500'>*</span>
            </span>
          </label>
          {showErrors && errors.authenticity && (
            <p className='text-xs text-red-500 mt-2'>{errors.authenticity}</p>
          )}
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
        description={
          locale === 'en'
            ? 'You must accept our Terms of Service to list an item'
            : 'يجب عليك قبول شروط الخدمة لإدراج منتج'
        }
      />
    </div>
  );
}
