'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HiChevronDown } from 'react-icons/hi2';

interface FilterDropdownProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
  isOpen: boolean;
  onToggle: () => void;
  isRTL: boolean;
}

export default function FilterDropdown({
  label,
  value,
  options,
  onChange,
  placeholder,
  isOpen,
  onToggle,
  isRTL,
}: FilterDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    right: 0,
    width: 0,
  });
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  );

  useEffect(() => {
    setIsMounted(true);
    if (typeof document !== 'undefined' && document.body) {
      setPortalContainer(document.body);
    }
  }, []);

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
          width: rect.width,
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

  // Prevent dropdown scroll from closing the dropdown
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

  const selectedOption = options.find(opt => opt.value === value);
  const displayValue = selectedOption
    ? selectedOption.label
    : placeholder || label;

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
          value ? 'text-deep-charcoal' : 'text-deep-charcoal/70'
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
            className='bg-white border border-rich-sand/30 rounded-lg shadow-xl max-h-60 overflow-y-auto scrollbar-transparent'
            style={{
              position: 'fixed',
              top: `${position.top}px`,
              left: isRTL ? 'auto' : `${position.left}px`,
              right: isRTL ? `${position.right}px` : 'auto',
              width: 'max-content',
              minWidth: `${Math.max(position.width, 200)}px`,
              maxWidth: '400px',
              zIndex: 10000,
            }}
          >
            {options.map(option => (
              <button
                key={option.value}
                onClick={e => {
                  e.stopPropagation();
                  e.preventDefault();
                  onChange(option.value);
                  onToggle();
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-rich-sand/10 transition-colors text-nowrap whitespace-nowrap ${
                  value === option.value
                    ? 'bg-saudi-green/10 text-saudi-green font-medium'
                    : 'text-deep-charcoal'
                }`}
                type='button'
              >
                {option.label}
              </button>
            ))}
          </div>,
          portalContainer
        )}
    </div>
  );
}
