'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HiChevronDown } from 'react-icons/hi2';

interface PriceFilterProps {
  minPrice: string;
  maxPrice: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  locale: string;
  isRTL: boolean;
}

export default function PriceFilter({
  minPrice,
  maxPrice,
  onMinChange,
  onMaxChange,
  isOpen,
  onToggle,
  locale,
  isRTL,
}: PriceFilterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, right: 0, width: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [tempMinPrice, setTempMinPrice] = useState(minPrice);
  const [tempMaxPrice, setTempMaxPrice] = useState(maxPrice);

  useEffect(() => {
    setIsMounted(true);
    if (typeof document !== 'undefined' && document.body) {
      setPortalContainer(document.body);
    }
  }, []);

  // Initialize temp values when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTempMinPrice(minPrice);
      setTempMaxPrice(maxPrice);
    }
  }, [isOpen, minPrice, maxPrice]);

  // Calculate position when dropdown opens and update on scroll/resize
  useEffect(() => {
    if (!isOpen || !containerRef.current || !isMounted) return;

    const updatePosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 4, // Consistent 4px gap
          left: rect.left,
          right: window.innerWidth - rect.right,
          width: Math.max(rect.width, 280), // Price filter needs more width
        });
      }
    };

    // Initial position
    requestAnimationFrame(updatePosition);

    // Update on scroll and resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, isMounted]);

  const handleDone = () => {
    onMinChange(tempMinPrice);
    onMaxChange(tempMaxPrice);
    onToggle();
  };

  const handleReset = () => {
    setTempMinPrice('');
    setTempMaxPrice('');
    onMinChange('');
    onMaxChange('');
    onToggle();
  };

  // Handle click outside and scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        onToggle();
      }
    };

    const handleWindowScroll = () => {
      // Close on window scroll (page scroll)
      onToggle();
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      // Only listen to window scroll, not dropdown scroll
      window.addEventListener('scroll', handleWindowScroll, false);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleWindowScroll, false);
    };
  }, [isOpen, onToggle]);

  // Prevent dropdown scroll from closing the dropdown (if dropdown has scrollable content)
  useEffect(() => {
    if (!isOpen || !dropdownRef.current) return;

    const handleDropdownScroll = (e: Event) => {
      e.stopPropagation();
    };

    const dropdownElement = dropdownRef.current;
    dropdownElement.addEventListener('scroll', handleDropdownScroll, true);

    return () => {
      dropdownElement.removeEventListener('scroll', handleDropdownScroll, true);
    };
  }, [isOpen]);

  const hasPrice = minPrice || maxPrice;
  const displayValue = hasPrice
    ? `${minPrice || '0'} - ${maxPrice || '∞'} ${
        locale === 'ar' ? 'ر.س' : 'SAR'
      }`
    : locale === 'en'
    ? 'Price'
    : 'السعر';

  return (
    <div 
      ref={containerRef} 
      className='relative inline-block' 
      style={{ 
        position: 'relative', 
        zIndex: isOpen ? 100 : 'auto',
        isolation: isOpen ? 'isolate' : 'auto',
      }}
    >
      <button
        onClick={e => {
          e.stopPropagation();
          e.preventDefault();
          onToggle();
        }}
        className={`flex items-center justify-between gap-2 px-4 py-2 bg-white border border-rich-sand/30 rounded-lg text-sm font-medium hover:bg-rich-sand/10 transition-colors whitespace-nowrap text-nowrap ${
          hasPrice ? 'text-deep-charcoal' : 'text-deep-charcoal/70'
        }`}
        style={{ width: 'auto', minWidth: 'fit-content' }}
        type='button'
      >
        <span>{displayValue}</span>
        <HiChevronDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen &&
        isMounted &&
        portalContainer &&
        createPortal(
          <div
            ref={dropdownRef}
            className='bg-white border border-rich-sand/30 rounded-lg shadow-xl p-4'
            style={{
              position: 'fixed',
              top: `${position.top}px`,
              left: isRTL ? 'auto' : `${position.left}px`,
              right: isRTL ? `${position.right}px` : 'auto',
              width: 'max-content',
              minWidth: `${Math.max(position.width, 280)}px`,
              maxWidth: '400px',
              zIndex: 10000,
            }}
          >
            <div className='space-y-3'>
              <div>
                <label className='block text-xs font-semibold text-deep-charcoal mb-1'>
                  {locale === 'en'
                    ? 'Min Price (SAR)'
                    : 'الحد الأدنى للسعر (ر.س)'}
                </label>
                <input
                  type='number'
                  value={tempMinPrice}
                  onChange={e => setTempMinPrice(e.target.value)}
                  placeholder='0'
                  className='w-full px-3 py-2 text-sm border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green'
                />
              </div>
              <div>
                <label className='block text-xs font-semibold text-deep-charcoal mb-1'>
                  {locale === 'en'
                    ? 'Max Price (SAR)'
                    : 'الحد الأقصى للسعر (ر.س)'}
                </label>
                <input
                  type='number'
                  value={tempMaxPrice}
                  onChange={e => setTempMaxPrice(e.target.value)}
                  placeholder='10000'
                  className='w-full px-3 py-2 text-sm border border-rich-sand/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-saudi-green focus:border-saudi-green'
                />
              </div>
              <div className='flex items-center gap-2 pt-2'>
                <button
                  onClick={handleReset}
                  className='flex-1 px-4 py-2 text-sm font-medium text-deep-charcoal bg-white border border-rich-sand/30 rounded-lg hover:bg-rich-sand/10 transition-colors'
                  type='button'
                >
                  {locale === 'en' ? 'Reset' : 'إعادة تعيين'}
                </button>
                <button
                  onClick={handleDone}
                  className='flex-1 px-4 py-2 text-sm font-medium text-white bg-saudi-green rounded-lg hover:bg-saudi-green/90 transition-colors'
                  type='button'
                >
                  {locale === 'en' ? 'Done' : 'تم'}
                </button>
              </div>
            </div>
          </div>,
          portalContainer
        )}
    </div>
  );
}

