'use client';

import { useLocale } from 'next-intl';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const locale = useLocale();
  const isRTL = locale === 'ar';

  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5; // Maximum visible page numbers

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate start and end of middle section
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if we're near the start
      if (currentPage <= 3) {
        end = 4;
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }

      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push('...');
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }

      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8 mb-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Previous Button */}
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 ${
          currentPage === 1
            ? 'border-rich-sand/30 bg-off-white text-deep-charcoal/30 cursor-not-allowed'
            : 'border-rich-sand bg-white text-deep-charcoal hover:border-saudi-green hover:bg-saudi-green hover:text-white hover:scale-105'
        }`}
        aria-label={locale === 'en' ? 'Previous page' : 'الصفحة السابقة'}
      >
        {isRTL ? (
          <HiChevronRight className="w-5 h-5" />
        ) : (
          <HiChevronLeft className="w-5 h-5" />
        )}
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-2 text-deep-charcoal/50 font-medium"
              >
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = pageNum === currentPage;

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`min-w-[2.5rem] h-10 px-3 rounded-lg border transition-all duration-200 font-medium ${
                isActive
                  ? 'bg-saudi-green border-saudi-green text-white shadow-lg shadow-saudi-green/30 scale-105'
                  : 'bg-white border-rich-sand text-deep-charcoal hover:border-saudi-green hover:text-saudi-green hover:bg-saudi-green/5'
              }`}
              aria-label={`${locale === 'en' ? 'Page' : 'صفحة'} ${pageNum}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 ${
          currentPage === totalPages
            ? 'border-rich-sand/30 bg-off-white text-deep-charcoal/30 cursor-not-allowed'
            : 'border-rich-sand bg-white text-deep-charcoal hover:border-saudi-green hover:bg-saudi-green hover:text-white hover:scale-105'
        }`}
        aria-label={locale === 'en' ? 'Next page' : 'الصفحة التالية'}
      >
        {isRTL ? (
          <HiChevronLeft className="w-5 h-5" />
        ) : (
          <HiChevronRight className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}

