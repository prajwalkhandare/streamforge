import { useState, useEffect, useCallback, useRef } from 'react';

export const useInfiniteScroll = (fetchMore, hasMore, options = {}) => {
  const {
    threshold = 0.5,
    rootMargin = '100px',
    enabled = true,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const observerRef = useRef(null);
  const lastElementRef = useRef(null);

  const handleObserver = useCallback(async (entries) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMore && !loading && enabled) {
      setLoading(true);
      try {
        await fetchMore();
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
  }, [fetchMore, hasMore, loading, enabled]);

  useEffect(() => {
    if (!enabled) return;

    const options = {
      root: null,
      rootMargin,
      threshold,
    };

    observerRef.current = new IntersectionObserver(handleObserver, options);

    if (lastElementRef.current) {
      observerRef.current.observe(lastElementRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver, rootMargin, threshold, enabled]);

  const setLastElement = useCallback((node) => {
    if (loading) return;
    if (lastElementRef.current) {
      observerRef.current?.unobserve(lastElementRef.current);
    }
    lastElementRef.current = node;
    if (lastElementRef.current) {
      observerRef.current?.observe(lastElementRef.current);
    }
  }, [loading]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    loading,
    error,
    setLastElement,
    reset,
  };
};
