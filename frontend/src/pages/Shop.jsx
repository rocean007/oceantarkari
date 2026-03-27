import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { vegetableApi } from '../lib/api';
import VeggieCard from '../components/shop/VeggieCard';
import { VeggieCardSkeleton } from '../components/skeleton/PageSkeleton';
import styles from './Shop.module.css';

const CATEGORIES = ['All', 'Leafy', 'Root', 'Fresh', 'Herbs', 'Exotic', 'Organic'];
const SORT_OPTIONS = [
  { value: 'name_asc',   label: 'Name A–Z' },
  { value: 'name_desc',  label: 'Name Z–A' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest',     label: 'Newest First' },
];

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search,   setSearch]   = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [sort,     setSort]     = useState('name_asc');
  const [priceMax, setPriceMax] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Debounced search -> URL sync
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = {};
      if (search)   params.q = search;
      if (category && category !== 'All') params.category = category.toLowerCase();
      setSearchParams(params, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, category, setSearchParams]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['vegetables', { search, category, sort, priceMax }],
    queryFn: () => vegetableApi.list({
      search: search || undefined,
      category: category !== 'All' ? category.toLowerCase() : undefined,
      sort,
      maxPrice: priceMax || undefined,
    }).then(r => r.data),
    keepPreviousData: true,
  });

  const clearFilters = useCallback(() => {
    setSearch(''); setCategory('All'); setSort('name_asc'); setPriceMax('');
    setSearchParams({});
  }, [setSearchParams]);

  const hasFilters = search || category !== 'All' || priceMax;

  return (
    <div className={styles.page}>
      {/* Page header */}
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <h1 className={styles.title}>Fresh Vegetables</h1>
          <p className={styles.subtitle}>
            {isLoading ? 'Loading…' : `${data?.length ?? 0} items available today`}
          </p>
        </div>
      </div>

      <div className={styles.body}>
        {/* Sidebar filters — desktop */}
        <aside className={styles.sidebar} aria-label="Filter options">
          <div className={styles.sidebarCard}>
            <h2 className={styles.filterHeading}>Filters</h2>

            {/* Search */}
            <div className={styles.filterGroup}>
              <label htmlFor="shop-search" className={styles.filterLabel}>Search</label>
              <div className={styles.searchWrap}>
                <span className={styles.searchIcon}><SearchIcon /></span>
                <input
                  id="shop-search"
                  type="search"
                  placeholder="Search vegetables…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={styles.searchInput}
                  autoComplete="off"
                />
                {search && (
                  <button className={styles.clearSearch} onClick={() => setSearch('')} aria-label="Clear search">
                    <XIcon />
                  </button>
                )}
              </div>
            </div>

            {/* Category */}
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel} id="cat-label">Category</span>
              <div className={styles.catList} role="group" aria-labelledby="cat-label">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    className={category === cat ? styles.catBtnActive : styles.catBtn}
                    onClick={() => setCategory(cat)}
                    aria-pressed={category === cat}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Max price */}
            <div className={styles.filterGroup}>
              <label htmlFor="max-price" className={styles.filterLabel}>Max Price (Rs.)</label>
              <input
                id="max-price"
                type="number"
                placeholder="e.g. 200"
                min="0"
                value={priceMax}
                onChange={e => setPriceMax(e.target.value)}
                className={styles.priceInput}
                inputMode="numeric"
              />
            </div>

            {hasFilters && (
              <button className={styles.clearAll} onClick={clearFilters}>
                Clear all filters
              </button>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className={styles.main} id="main-content">
          {/* Top bar: sort + mobile filter toggle */}
          <div className={styles.topBar}>
            <button
              className={styles.mobileFilterBtn}
              onClick={() => setFiltersOpen(o => !o)}
              aria-expanded={filtersOpen}
            >
              <FilterIcon />
              Filters
              {hasFilters && <span className={styles.filterBadge} aria-label="Filters active" />}
            </button>

            <div className={styles.sortWrap}>
              <label htmlFor="sort-select" className={styles.sortLabel}>Sort:</label>
              <select
                id="sort-select"
                value={sort}
                onChange={e => setSort(e.target.value)}
                className={styles.sortSelect}
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Mobile filters drawer */}
          {filtersOpen && (
            <div className={styles.mobileFilters}>
              <div className={styles.mobileFilterInner}>
                <div className={styles.searchWrap}>
                  <span className={styles.searchIcon}><SearchIcon /></span>
                  <input
                    type="search"
                    placeholder="Search…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
                <div className={styles.catList} role="group" aria-label="Category filter">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      className={category === cat ? styles.catBtnActive : styles.catBtn}
                      onClick={() => setCategory(cat)}
                      aria-pressed={category === cat}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {hasFilters && (
                  <button className={styles.clearAll} onClick={clearFilters}>Clear all</button>
                )}
              </div>
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div className={styles.errorState} role="alert">
              <span aria-hidden="true">⚠️</span>
              <p>Failed to load vegetables. Please refresh the page.</p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && data?.length === 0 && (
            <div className={styles.emptyState}>
              <span className={styles.emptyEmoji} aria-hidden="true">🥲</span>
              <h3>No vegetables found</h3>
              <p>Try adjusting your search or filters.</p>
              <button className={styles.clearAllBtn} onClick={clearFilters}>Clear filters</button>
            </div>
          )}

          {/* Grid */}
          <div className={styles.grid} role="list" aria-live="polite" aria-busy={isLoading}>
            {isLoading
              ? Array.from({ length: 12 }).map((_, i) => (
                  <div role="listitem" key={i}><VeggieCardSkeleton /></div>
                ))
              : data?.map(v => (
                  <div role="listitem" key={v.id}><VeggieCard veggie={v} /></div>
                ))
            }
          </div>
        </main>
      </div>
    </div>
  );
}
