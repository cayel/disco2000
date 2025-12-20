import { decodeJwt, isJwtExpired } from './utils/jwt';
import authFetch, { forceRefresh } from './utils/authFetch';
import { getCookie, setCookie, deleteCookie } from './utils/cookie';
import { debounce } from './utils/debounce';
import { useState, useEffect, useCallback, useMemo, lazy, Suspense, useRef } from 'react'
import { Heading, Box, Spinner, SimpleGrid, Text, IconButton, useColorMode, Button, RangeSlider, RangeSliderTrack, RangeSliderFilledTrack, RangeSliderThumb, Slider, SliderTrack, SliderFilledTrack, SliderThumb, FormControl, FormLabel, Tooltip, Input, InputGroup, InputRightElement, CloseButton, Select, ButtonGroup, Flex, Badge, Skeleton, SkeletonText, Fade, ScaleFade, Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton, useDisclosure, Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton, Stack, chakra, useToast } from '@chakra-ui/react'
import { AddIcon, ArrowLeftIcon, ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, HamburgerIcon, SearchIcon } from '@chakra-ui/icons'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'
import GoogleAuthButton from './components/GoogleAuthButton'
import SessionExpiredBanner from './components/SessionExpiredBanner'
import AlbumCard from './components/AlbumCard'
import { auth } from './firebase'
import { signOut } from 'firebase/auth'
import './App.css'
import TokenService from './utils/tokenService'

// Lazy loading des composants lourds pour améliorer les performances
const ProfilePage = lazy(() => import('./components/ProfilePage'))
const AddStudioAlbum = lazy(() => import('./components/AddStudioAlbum'))
const AlbumDetailsModal = lazy(() => import('./components/AlbumDetailsModal'))
const StudioStats = lazy(() => import('./components/StudioStats'))
const CollectionExplorer = lazy(() => import('./components/CollectionExplorer'))
const ArtistManager = lazy(() => import('./components/ArtistManager'))
const ListsManager = lazy(() => import('./components/ListsManager'))

function App() {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure(); // pour la modale d'ajout
  const {
    isOpen: isDetailsOpen,
    onOpen: openDetails,
    onClose: closeDetails
  } = useDisclosure();
  const {
    isOpen: isFiltersOpen,
    onOpen: openFilters,
    onClose: closeFilters
  } = useDisclosure(); // pour le drawer des filtres mobile
  const [user, setUser] = useState(() => {
    const current = auth.currentUser;
    const jwtFromCookie = getCookie('jwt');
    if (!jwtFromCookie || isJwtExpired(jwtFromCookie)) {
      return null;
    }
    return current;
  });
  const [showProfile, setShowProfile] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showCollection, setShowCollection] = useState(false);
  const [showArtistManager, setShowArtistManager] = useState(false);
  const [showLists, setShowLists] = useState(false);
  const [jwt, setJwt] = useState(() => {
    const token = getCookie('jwt');
    if (!token) return null;
    if (isJwtExpired(token)) {
      return null;
    }
    return token;
  });
  const [showExpiredBanner, setShowExpiredBanner] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalAlbums, setTotalAlbums] = useState(0);

  const [allAlbums, setAllAlbums] = useState([]);
  const [allAlbumsLoading, setAllAlbumsLoading] = useState(false);
  const [allAlbumsError, setAllAlbumsError] = useState(null);

  const jwtPayload = useMemo(() => (jwt ? decodeJwt(jwt) : null), [jwt]);
  // Pré-refresh silencieux: 5 minutes avant l'expiration, ping un endpoint protégé pour déclencher le refresh via authFetch
  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const { isJwtNearExpiry } = await import('./utils/authFetch');
        // Ne pinger que si un JWT est présent et proche d'expirer
        if (jwt && isJwtNearExpiry(300)) {
          if (import.meta.env.DEV) {
            console.log('[AUTH] pre-refresh:forceRefresh');
          }
          await forceRefresh();
        }
      } catch {}
    }, 60 * 1000);
    return () => clearInterval(intervalId);
  }, [jwt]);

  // Supprimé: refreshAccessToken (on délègue au wrapper authFetch pour éviter les doublons et les toasts multiples)

  // Supprimé: minuterie de refresh proactif (authFetch gère le refresh au moment des requêtes)

  useEffect(() => {
    const handleAuthChange = (firebaseUser) => {
      if (!jwt) {
        setUser(null);
        setShowProfile(false);
        setShowStats(false);
        setShowCollection(false);
        setShowArtistManager(false);
        return;
      }
      setUser(firebaseUser);
    };
    const unsubscribe = auth.onAuthStateChanged(handleAuthChange);
    return () => unsubscribe();
  }, [jwt]);

  useEffect(() => {
    const handleJwtUpdated = (event) => {
      const token = event.detail;
      if (!token || isJwtExpired(token)) {
        deleteCookie('jwt');
        deleteCookie('refresh_token');
        setJwt(null);
        setUser(null);
        try {
          toast({
            title: 'Session expirée',
            description: 'Veuillez vous reconnecter pour continuer.',
            status: 'warning',
            isClosable: true,
            duration: 9000,
            position: 'top-right',
          });
        } catch {}
        setShowProfile(false);
        setShowStats(false);
        setShowCollection(false);
        setShowArtistManager(false);
        setPage(1);
        setTotalAlbums(0);
        setAllAlbums([]);
        signOut(auth).catch(() => {});
        return;
      }
      setJwt(token);
    };
    window.addEventListener('jwt-updated', handleJwtUpdated);
    const handleJwtInvalidated = () => {
      // Afficher un toast persistant doux
      try {
        toast({
          title: 'Session expirée',
          description: 'Votre session a expiré. Cliquez sur le bouton Google pour vous reconnecter.',
          status: 'warning',
          isClosable: true,
          duration: 15000,
          position: 'top-right',
        });
      } catch {}
      setShowExpiredBanner(true);
      // Ne pas rediriger automatiquement pour éviter les boucles; laisser l'utilisateur reprendre la main
    };
    window.addEventListener('jwt-invalidated', handleJwtInvalidated);
    return () => {
      window.removeEventListener('jwt-updated', handleJwtUpdated);
      window.removeEventListener('jwt-invalidated', handleJwtInvalidated);
      setShowExpiredBanner(false);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const syncTokenFromCookie = () => {
      const token = getCookie('jwt');
      if (token && !isJwtExpired(token)) {
        if (token !== jwt && !cancelled) setJwt(token);
      } else {
        // Ne pas nettoyer agressivement; laisser le wrapper gérer les refresh/invalidations
        if (!cancelled && jwt !== null) setJwt(null);
      }
    };
    syncTokenFromCookie();
    return () => { cancelled = true; };
  }, [jwt]);

  // Rafraîchissement au retour d'inactivité: sur focus/visibilitychange, tenter un refresh si expiré ou proche
  useEffect(() => {
    const checkAndRefresh = async () => {
      try {
        const { isJwtNearExpiry } = await import('./utils/authFetch');
        const token = getCookie('jwt');
        const expired = !token || isJwtExpired(token);
        const nearly = token && isJwtNearExpiry(300);
        // Éviter les pings si pas de JWT (déconnecté)
        if (jwt && (expired || nearly)) {
          if (import.meta.env.DEV) {
            console.log('[AUTH] focus/visible:forceRefresh');
          }
          await forceRefresh();
        }
      } catch {}
    };

    const onFocus = () => { checkAndRefresh(); };
    const onVisible = () => { if (document.visibilityState === 'visible') checkAndRefresh(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  const [artistFilter, setArtistFilter] = useState('');
  const [artistQuery, setArtistQuery] = useState('');
  const [artistSuggestions, setArtistSuggestions] = useState([]);
  const [isSearchingArtists, setIsSearchingArtists] = useState(false);
  const [selectedArtistIndex, setSelectedArtistIndex] = useState(-1);
  const [yearRange, setYearRange] = useState([null, null]);
  const [appliedYearRange, setAppliedYearRange] = useState([null, null]);
  const [hasCustomYearRange, setHasCustomYearRange] = useState(false);
  const { colorMode, toggleColorMode } = useColorMode();
  const [albums, setAlbums] = useState([])
  // Adapter le nombre d'albums par ligne selon la taille d'écran
  const [albumsPerRow, setAlbumsPerRow] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 2 : 5;
    }
    return 5;
  })
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);

  // Réajuster albumsPerRow lors du resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && albumsPerRow > 3) {
        setAlbumsPerRow(2);
      } else if (window.innerWidth >= 768 && albumsPerRow < 4) {
        setAlbumsPerRow(5);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [albumsPerRow]);
  // Gestion du chargement initial et des rafraîchissements partiels (pagination / filtres)
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [albumsLoading, setAlbumsLoading] = useState(false);
  // Détermination des rôles
  const isContributor = jwtPayload && Array.isArray(jwtPayload.roles) && jwtPayload.roles.includes('contributeur');
  const isUser = jwtPayload && Array.isArray(jwtPayload.roles) && jwtPayload.roles.includes('utilisateur');
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isUser && showCollection) {
      setShowCollection(false);
    }
  }, [isUser, showCollection]);

  const fetchAlbums = useCallback(async (pageValue, pageSizeValue, artistValue, yearRangeValue) => {
    const apiBase = import.meta.env.VITE_API_URL;
    const effectivePage = Number(pageValue) > 0 ? Number(pageValue) : 1;
    const effectivePageSize = Number(pageSizeValue) > 0 ? Number(pageSizeValue) : 20;
    const cappedPageSize = Math.min(Math.max(effectivePageSize, 1), 100);
    const hasYearFilter = Array.isArray(yearRangeValue) && yearRangeValue[0] !== null && yearRangeValue[1] !== null;

    const params = new URLSearchParams({
      page: String(effectivePage),
      page_size: String(cappedPageSize),
    });
    if (artistValue) {
      params.append('artist', artistValue);
    }
    if (hasYearFilter) {
      params.append('year_from', String(yearRangeValue[0]));
      params.append('year_to', String(yearRangeValue[1]));
    }

    // Ne bloquer la page entière que pendant le premier chargement.
    if (!initialLoaded) {
      setLoading(true);
    } else {
      setAlbumsLoading(true);
    }
    setError(null);

  // authFetch gère automatiquement le JWT + refresh
    // L'API gère maintenant nativement les filtres artiste et années

    try {
      const res = await authFetch(`${apiBase}/api/albums?${params.toString()}`, { method: 'GET' }, { label: 'fetch-albums' });

      if (res.status === 403) {
        setError('Accès interdit (403) : vérifie ta clé API ou ton authentification.');
        setAlbums([]);
        setTotalAlbums(0);
        setLoading(false);
        return;
      }

      const data = await res.json().catch(() => ({}));
      const incomingAlbums = Array.isArray(data.albums) ? data.albums : [];
      const totalFromServer = Number.isFinite(data.total) ? data.total : incomingAlbums.length;
      const pageFromServer = Number.isFinite(data.page) ? data.page : effectivePage;
      const pageSizeFromServer = Number.isFinite(data.page_size) ? data.page_size : cappedPageSize;

      setAlbums(incomingAlbums);
      setPage(Math.max(1, pageFromServer));
      setPageSize(Math.min(Math.max(pageSizeFromServer, 1), 100));
      setTotalAlbums(totalFromServer);
    } catch (err) {
      setError(err.message || 'Erreur réseau');
      setAlbums([]);
      setTotalAlbums(0);
    } finally {
      if (!initialLoaded) {
        setLoading(false);
        setInitialLoaded(true);
      } else {
        setAlbumsLoading(false);
      }
    }
  }, [allAlbums, initialLoaded]);

  const fetchAllAlbums = useCallback(async () => {
    const apiBase = import.meta.env.VITE_API_URL;
    const pageSizeMax = 100;

    setAllAlbumsLoading(true);
    setAllAlbumsError(null);

    try {
      let pageCursor = 1;
      let aggregated = [];
      let totalItems = 0;
      let totalPages = 1;

      while (pageCursor <= totalPages) {
        const params = new URLSearchParams({
          page: String(pageCursor),
          page_size: String(pageSizeMax),
        });

        const res = await authFetch(`${apiBase}/api/albums?${params.toString()}`, { method: 'GET' }, { label: 'fetch-all-albums' });

        if (res.status === 403) {
          throw new Error('Accès interdit (403) lors du chargement complet des albums.');
        }

        if (!res.ok) {
          const message = await res.text().catch(() => 'Erreur lors du chargement complet des albums.');
          throw new Error(message || `Erreur ${res.status}`);
        }

        const data = await res.json().catch(() => ({}));
        const pageAlbums = Array.isArray(data.albums) ? data.albums : [];
        aggregated = aggregated.concat(pageAlbums);

        totalItems = Number.isFinite(data.total) ? data.total : aggregated.length;
        const serverPageSize = Number.isFinite(data.page_size) ? data.page_size : pageSizeMax;
        totalPages = Math.max(1, Math.ceil(totalItems / serverPageSize));

        if (pageAlbums.length === 0) {
          break;
        }

        pageCursor += 1;
      }

      setAllAlbums(aggregated);
    } catch (err) {
      setAllAlbums([]);
      setAllAlbumsError(err.message || 'Erreur réseau lors du chargement des albums.');
    } finally {
      setAllAlbumsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlbums(page, pageSize, artistFilter, appliedYearRange);
  }, [page, pageSize, artistFilter, appliedYearRange, fetchAlbums, jwt]);

  useEffect(() => {
    fetchAllAlbums();
  }, [fetchAllAlbums, jwt]);

  const refreshCurrentPage = useCallback(() => {
    return fetchAlbums(page, pageSize, artistFilter, appliedYearRange);
  }, [fetchAlbums, page, pageSize, artistFilter, appliedYearRange]);

  const refreshAllData = useCallback(() => {
    refreshCurrentPage();
    fetchAllAlbums();
  }, [refreshCurrentPage, fetchAllAlbums]);

  const handleLogout = useCallback(() => {
    TokenService.logout(() => {
      setJwt(null);
      setUser(null);
      setShowProfile(false);
      setShowStats(false);
      setShowCollection(false);
      setShowArtistManager(false);
      setPage(1);
      setTotalAlbums(0);
      setAllAlbums([]);
      setShowExpiredBanner(false);
      // Redirection douce vers accueil/stats public si nécessaire
      // window.location.href = '/';
    });
  }, []);

  const handleCollectionUpdate = useCallback((albumId, collection) => {
    setAlbums(prev => prev.map(album => (
      album.id === albumId ? { ...album, collection } : album
    )));
    setAllAlbums(prev => prev.map(album => (
      album.id === albumId ? { ...album, collection } : album
    )));
  }, []);

  const handleAlbumDelete = useCallback((albumId) => {
    setAlbums(prev => prev.filter(album => album.id !== albumId));
    setAllAlbums(prev => prev.filter(album => album.id !== albumId));
    setTotalAlbums(prev => (prev > 0 ? prev - 1 : 0));
    refreshCurrentPage();
  }, [refreshCurrentPage]);

  // Cache mémoire pour la recherche d'artistes afin d'éviter des appels répétés
  const artistSearchCacheRef = useRef(new Map());

  // Recherche d'artistes via l'API avec cache
  const searchArtistsAPI = useCallback(async (query) => {
    const trimmed = (query || '').trim();
    // Autoriser dès 1 caractère
    if (!trimmed || trimmed.length < 1) {
      setArtistSuggestions([]);
      setIsSearchingArtists(false);
      return;
    }

    setIsSearchingArtists(true);
    const apiBase = import.meta.env.VITE_API_URL;
    
    try {
      // Cache: si on a déjà des suggestions pour cette requête, les renvoyer directement
      const cacheKey = trimmed.toLowerCase();
      if (artistSearchCacheRef.current.has(cacheKey)) {
        const cached = artistSearchCacheRef.current.get(cacheKey) || [];
        setArtistSuggestions(cached);
        return;
      }

      const res = await authFetch(
        `${apiBase}/api/artists/search?q=${encodeURIComponent(trimmed)}&limit=20`,
        { method: 'GET' },
        { label: 'search-artists' }
      );

      if (!res.ok) {
        throw new Error(`Erreur API (${res.status})`);
      }

  const data = await res.json();
      let rawList = [];
      if (Array.isArray(data.artists)) rawList = data.artists;
      else if (Array.isArray(data.results)) rawList = data.results;
      else if (Array.isArray(data.items)) rawList = data.items;
      else if (Array.isArray(data.data)) rawList = data.data;
      else if (Array.isArray(data)) rawList = data;

      // Normalisation des objets artistes
      let apiArtists = rawList.map(a => {
        const name = a.name || a.artist_name || a.title || a.nom || '';
        const albumCount = a.album_count ?? a.albums_count ?? a.count ?? a.total_albums ?? 0;
        return { name, album_count: albumCount };
      }).filter(a => a.name && a.name.toLowerCase().includes(trimmed.toLowerCase()));

      // Fallback local si API vide mais on dispose des albums
      if (apiArtists.length === 0 && (allAlbums.length || albums.length)) {
        const localMap = new Map();
        const source = allAlbums.length ? allAlbums : albums;
        source.forEach(alb => {
          const name = typeof alb.artist === 'string' ? alb.artist : alb.artist?.name;
          if (!name) return;
          if (name.toLowerCase().includes(trimmed.toLowerCase())) {
            localMap.set(name, (localMap.get(name) || 0) + 1);
          }
        });
        apiArtists = Array.from(localMap.entries()).map(([name, album_count]) => ({ name, album_count }));
        // Trier par nombre décroissant
        apiArtists.sort((a, b) => b.album_count - a.album_count);
      }

      setArtistSuggestions(apiArtists);
      // Mettre en cache le résultat pour cette requête
      artistSearchCacheRef.current.set(cacheKey, apiArtists);
    } catch (err) {
      // Optionnel: garder silence en prod, ou notifier de manière discrète
      setArtistSuggestions([]);
    } finally {
      setIsSearchingArtists(false);
    }
  }, [allAlbums, albums]);

  // Surlignage de la portion recherchée (insensible à la casse)
  const highlightArtistName = useCallback((name, query) => {
    if (!query) return name;
    const q = query.trim();
    if (!q) return name;
    const lowerName = name.toLowerCase();
    const lowerQ = q.toLowerCase();
    const idx = lowerName.indexOf(lowerQ);
    if (idx === -1) return name;
    const before = name.slice(0, idx);
    const match = name.slice(idx, idx + q.length);
    const after = name.slice(idx + q.length);
    return (
      <>
        {before}
        <chakra.span px="1" borderRadius="sm" bg={colorMode === 'dark' ? 'purple.700' : 'purple.200'} fontWeight="semibold">
          {match}
        </chakra.span>
        {after}
      </>
    );
  }, [colorMode]);

  // Debounce pour éviter trop de requêtes API
  const debouncedSearchArtists = useRef(
    debounce((query) => searchArtistsAPI(query), 300)
  ).current;

  const availableYears = useMemo(() => {
    const source = allAlbums.length ? allAlbums : albums;
    if (!source.length) {
      return null;
    }

    let minYear = Infinity;
    let maxYear = -Infinity;
    source.forEach(album => {
      const yearValue = Number(album?.year);
      if (!Number.isFinite(yearValue)) {
        return;
      }
      if (yearValue < minYear) {
        minYear = yearValue;
      }
      if (yearValue > maxYear) {
        maxYear = yearValue;
      }
    });

    if (!Number.isFinite(minYear) || !Number.isFinite(maxYear)) {
      return null;
    }

    return { min: minYear, max: maxYear };
  }, [allAlbums, albums]);

  useEffect(() => {
    if (!availableYears) return;
    const fullRange = [availableYears.min, availableYears.max];

    const clampRange = (range) => {
      if (!Array.isArray(range) || range[0] === null || range[1] === null) {
        return fullRange;
      }
      const [minLimit, maxLimit] = fullRange;
      let nextMin = Math.max(minLimit, Math.min(range[0], maxLimit));
      let nextMax = Math.max(minLimit, Math.min(range[1], maxLimit));
      if (nextMin > nextMax) {
        nextMin = minLimit;
        nextMax = maxLimit;
      }
      if (nextMin === range[0] && nextMax === range[1]) {
        return range;
      }
      return [nextMin, nextMax];
    };

    if (!hasCustomYearRange) {
      setYearRange(prev => {
        if (Array.isArray(prev) && prev[0] === fullRange[0] && prev[1] === fullRange[1]) {
          return prev;
        }
        return fullRange;
      });
      setAppliedYearRange(prev => {
        if (Array.isArray(prev) && prev[0] === fullRange[0] && prev[1] === fullRange[1]) {
          return prev;
        }
        return fullRange;
      });
      return;
    }

    setYearRange(prev => clampRange(prev));
    setAppliedYearRange(prev => clampRange(prev));
  }, [availableYears, hasCustomYearRange]);

  const handleArtistSelect = useCallback((artistName) => {
    setArtistFilter(prev => {
      if (prev === artistName) {
        return '';
      }
      return artistName;
    });
    setArtistQuery(artistName);
    setArtistSuggestions([]); // Fermer les suggestions
    setSelectedArtistIndex(-1);
    setPage(1);
  }, []);

  const clearArtistFilter = useCallback(() => {
    setArtistFilter('');
    setArtistQuery('');
    setArtistSuggestions([]);
    setSelectedArtistIndex(-1);
    setPage(1);
  }, []);

  const handleYearRangeApply = useCallback((range) => {
    if (!Array.isArray(range) || range.length !== 2) {
      return;
    }
    setAppliedYearRange(range);
    setPage(1);
    if (availableYears) {
      const isDefaultRange = range[0] === availableYears.min && range[1] === availableYears.max;
      setHasCustomYearRange(!isDefaultRange);
    } else {
      setHasCustomYearRange(true);
    }
  }, [availableYears]);

  const handlePageSizeChange = useCallback((value) => {
    const numericValue = Number(value);
    const normalized = Number.isFinite(numericValue) ? Math.min(Math.max(numericValue, 1), 100) : 20;
    setPageSize(normalized);
    setPage(1);
  }, []);

  const totalPages = useMemo(() => {
    if (!totalAlbums) return 1;
    const pages = Math.ceil(totalAlbums / pageSize);
    return pages > 0 ? pages : 1;
  }, [totalAlbums, pageSize]);

  useEffect(() => {
    setPage(prev => {
      if (prev > totalPages) {
        return totalPages;
      }
      if (prev < 1) {
        return 1;
      }
      return prev;
    });
  }, [totalPages]);

  const goToFirstPage = useCallback(() => {
    setPage(1);
  }, []);

  const goToPrevPage = useCallback(() => {
    setPage(prev => Math.max(1, prev - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPage(prev => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  const goToLastPage = useCallback(() => {
    setPage(totalPages);
  }, [totalPages]);

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  // Calcul du nombre de filtres actifs
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (artistFilter) count++;
    if (hasCustomYearRange) count++;
    return count;
  }, [artistFilter, hasCustomYearRange]);

  // État pour le bouton scroll-to-top
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <>
      <Box
        as="nav"
        w="100vw"
        left="50%"
        right="50%"
        ml="-50vw"
        mr="-50vw"
        px={{ base: 3, md: 10 }}
        py={{ base: 2, md: 3 }}
        mb={{ base: 4, md: 8 }}
        boxShadow="sm"
  bg={colorMode === 'dark' ? 'slate.900' : 'white'}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        position="sticky"
        top={0}
        zIndex={10}
        borderBottomWidth={1}
  borderColor={colorMode === 'dark' ? 'slate.700' : 'gray.200'}
        style={{ left: 0, right: 0 }}
      >
        <Flex alignItems="center" gap={2}>
          <Heading
            as="h1"
            size={{ base: 'md', md: 'lg' }}
            fontWeight="bold"
            letterSpacing="tight"
            color={colorMode === 'dark' ? 'accent.500' : 'brand.900'}
            fontFamily="'Montserrat', 'Segoe UI', Arial, sans-serif"
          >
            Disco 2000
          </Heading>
          {activeFiltersCount > 0 && !showStats && !showProfile && !showCollection && !showLists && (
            <Badge
              colorScheme="purple"
              variant="solid"
              borderRadius="full"
              px={2}
              py={0.5}
              fontSize="0.75rem"
              fontWeight="bold"
            >
              {activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''}
            </Badge>
          )}
        </Flex>
        <Box display={{ base: 'none', md: 'flex' }} alignItems="center" gap={2}>
          <Button
            variant={!showStats && !showProfile && !showCollection && !showArtistManager && !showLists ? 'solid' : 'ghost'}
            size="sm"
            colorScheme="brand"
            onClick={() => {
              setShowStats(false);
              setShowProfile(false);
              setShowCollection(false);
              setShowArtistManager(false);
              setShowLists(false);
            }}
            fontWeight="bold"
            px={3}
          >
            Disques
          </Button>
          <Button
            variant={showStats && !showProfile && !showArtistManager ? 'solid' : 'ghost'}
            size="sm"
            colorScheme="brand"
            onClick={() => {
              setShowStats(true);
              setShowProfile(false);
              setShowCollection(false);
              setShowArtistManager(false);
              setShowLists(false);
            }}
            fontWeight="bold"
            px={3}
          >
            Statistiques
          </Button>
          {isUser && user && jwt ? (
            <Button
              variant={showCollection && !showProfile && !showArtistManager ? 'solid' : 'ghost'}
              size="sm"
              colorScheme="brand"
              onClick={() => {
                setShowCollection(true);
                setShowStats(false);
                setShowProfile(false);
                setShowArtistManager(false);
                setShowLists(false);
              }}
              fontWeight="bold"
              px={3}
            >
              Ma collection
            </Button>
          ) : null}
          {isUser && user && jwt ? (
            <Button
              variant={showLists && !showProfile && !showArtistManager ? 'solid' : 'ghost'}
              size="sm"
              colorScheme="brand"
              onClick={() => {
                setShowLists(true);
                setShowCollection(false);
                setShowStats(false);
                setShowProfile(false);
                setShowArtistManager(false);
              }}
              fontWeight="bold"
              px={3}
            >
              Listes
            </Button>
          ) : null}
          {isContributor && user && jwt ? (
            <Button
              variant={showArtistManager ? 'solid' : 'ghost'}
              size="sm"
              colorScheme="brand"
              onClick={() => {
                setShowArtistManager(true);
                setShowCollection(false);
                setShowStats(false);
                setShowProfile(false);
                setShowLists(false);
              }}
              fontWeight="bold"
              px={3}
            >
              Artistes
            </Button>
          ) : null}
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          {user && jwt ? (
            <IconButton
              variant="ghost"
              size="sm"
              colorScheme="gray"
              aria-label="Mon profil"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a8.38 8.38 0 0 1 13 0"/></svg>
              }
              onClick={() => {
                setShowProfile(true);
                setShowStats(false);
                setShowCollection(false);
                setShowArtistManager(false);
                setShowLists(false);
              }}
              title={user.displayName || user.email || 'Mon profil'}
            />
          ) : null}
          <GoogleAuthButton onLoginSuccess={fetchAlbums} jwtToken={jwt} />
          <IconButton
            aria-label={colorMode === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair'}
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            variant="ghost"
            size="lg"
          />
        </Box>
      </Box>
      <Fade in={showProfile && !!user} unmountOnExit>
        <Suspense fallback={
          <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
            <Spinner size="xl" color="purple.500" thickness="4px" />
              <Spinner size="xl" color="brand.500" thickness="4px" />
          </Box>
        }>
          <ProfilePage onLogout={() => setShowProfile(false)} onBack={() => setShowProfile(false)} />
        </Suspense>
      </Fade>
      <Fade in={showStats && !showProfile} unmountOnExit>
        <Suspense fallback={
          <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
            <Spinner size="xl" color="purple.500" thickness="4px" />
              <Spinner size="xl" color="brand.500" thickness="4px" />
          </Box>
        }>
          <StudioStats />
        </Suspense>
      </Fade>
      <Fade in={showCollection && isUser && !showProfile && !showStats && !showArtistManager} unmountOnExit>
        <Suspense fallback={
          <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
            <Spinner size="xl" color="purple.500" thickness="4px" />
              <Spinner size="xl" color="brand.500" thickness="4px" />
          </Box>
        }>
          <CollectionExplorer
            albums={allAlbums}
            loading={allAlbumsLoading}
            error={allAlbumsError}
            onRefresh={refreshAllData}
            isUser={isUser}
          />
        </Suspense>
      </Fade>
      <Fade in={showArtistManager && isContributor && !showProfile && !showStats && !showCollection} unmountOnExit>
        <Suspense fallback={
          <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
            <Spinner size="xl" color="purple.500" thickness="4px" />
              <Spinner size="xl" color="brand.500" thickness="4px" />
          </Box>
        }>
          <ArtistManager />
        </Suspense>
      </Fade>
      <Fade in={showLists && isUser && !showProfile && !showStats && !showCollection && !showArtistManager} unmountOnExit>
        <Suspense fallback={
          <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
            <Spinner size="xl" color="purple.500" thickness="4px" />
              <Spinner size="xl" color="brand.500" thickness="4px" />
          </Box>
        }>
          <ListsManager />
        </Suspense>
      </Fade>
      <Fade in={!showProfile && !showStats && !showCollection && !showArtistManager && !showLists} unmountOnExit>
        <Box
          minH="100vh"
          pb={{ base: 24, md: 12 }}
          bg={colorMode === 'dark' ? 'slate.900' : '#f7f7fa'}
          transition="background 0.3s"
          position="relative"
        >
          <Box maxW="1200px" mx="auto" px={{ base: 3, md: 4 }}>
          {/* Bouton flottant pour ouvrir la modale d'ajout */}
          {user && jwtPayload && Array.isArray(jwtPayload.roles) && jwtPayload.roles.includes('contributeur') && (
            <Tooltip label="Ajouter un album studio" placement="left">
              <IconButton
                icon={<AddIcon />}
                colorScheme="brand"
                borderRadius="full"
                size="lg"
                position="fixed"
                bottom={{ base: 6, md: 10 }}
                right={{ base: 6, md: 10 }}
                zIndex={20}
                boxShadow="2xl"
                onClick={onOpen}
                aria-label="Ajouter un album studio"
              />
            </Tooltip>
          )}

          {/* Modale d'ajout d'album studio */}
          <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
            <ModalOverlay />
            <ModalContent>
              <ModalCloseButton />
              <ModalBody p={0}>
                <Suspense fallback={
                  <Box p={8} display="flex" alignItems="center" justifyContent="center">
                    <Spinner size="lg" color="brand.500" thickness="3px" />
                  </Box>
                }>
                  <AddStudioAlbum 
                    onSuccess={() => {
                      // Rafraîchir la liste des albums
                      fetchAlbums(page, pageSize, artistFilter, yearRange);
                    }}
                  />
                </Suspense>
              </ModalBody>
            </ModalContent>
          </Modal>

          {loading && <Spinner size="xl" mt={8} />}
          {error && <Text color="red.500">Erreur : {error}</Text>}
          {!loading && !error && (
            <>
            {/* Bouton filtres mobile */}
            <Button
              display={{ base: 'flex', md: 'none' }}
              leftIcon={<HamburgerIcon />}
              onClick={openFilters}
              colorScheme="brand"
              variant="outline"
              size="sm"
              mb={4}
              width="full"
            >
              Filtres {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>

            <Box display="flex" flexDirection={{ base: 'column', md: 'row' }} gap={8} w="100%">
              {/* Sidebar des filtres à gauche (masqué sur mobile) */}
              <Box w={{ base: '100%', md: '320px' }} minW={{ md: '320px' }} maxW={{ md: '320px' }} mb={{ base: 8, md: 0 }} display={{ base: 'none', md: 'block' }} flexShrink={0}>
                <FormControl mb={4}>
                  <FormLabel fontSize="sm" color={colorMode === 'dark' ? 'gray.200' : 'gray.700'}>
                    Artistes
                  </FormLabel>
                  <Box position="relative">
                    <InputGroup size="sm">
                      <Input
                        placeholder="Rechercher un artiste"
                        value={artistQuery}
                        onChange={e => {
                          const query = e.target.value;
                          setArtistQuery(query);
                          setSelectedArtistIndex(-1);
                          // Appel debounced à l'API
                          debouncedSearchArtists(query);
                        }}
                        onKeyDown={(e) => {
                          if (!artistQuery) return;
                          
                          if (e.key === 'ArrowDown' && artistSuggestions.length > 0) {
                            e.preventDefault();
                            setSelectedArtistIndex(prev => 
                              prev < artistSuggestions.length - 1 ? prev + 1 : prev
                            );
                          } else if (e.key === 'ArrowUp' && artistSuggestions.length > 0) {
                            e.preventDefault();
                            setSelectedArtistIndex(prev => prev > 0 ? prev - 1 : -1);
                          } else if (e.key === 'Enter') {
                            e.preventDefault();
                            if (selectedArtistIndex >= 0 && artistSuggestions.length > 0) {
                              // Sélectionner l'artiste mis en surbrillance
                              const selectedArtist = artistSuggestions[selectedArtistIndex];
                              handleArtistSelect(selectedArtist.name);
                            } else {
                              // Rechercher avec la chaîne de caractères saisie
                              handleArtistSelect(artistQuery);
                            }
                          } else if (e.key === 'Escape') {
                            setSelectedArtistIndex(-1);
                            setArtistSuggestions([]);
                          }
                        }}
                        bg={colorMode === 'dark' ? 'slate.800' : 'white'}
                        color={colorMode === 'dark' ? 'white' : 'brand.900'}
                        borderColor={colorMode === 'dark' ? 'slate.700' : 'brand.900'}
                        _hover={{ borderColor: 'accent.500' }}
                        pr={artistQuery ? '2.5rem' : undefined}
                      />
                      {artistQuery && (
                        <InputRightElement height="100%" pr={1}>
                          <CloseButton 
                            size="sm" 
                            onClick={() => {
                              clearArtistFilter();
                            }} 
                            aria-label="Effacer la recherche d'artiste" 
                          />
                        </InputRightElement>
                      )}
                      {isSearchingArtists && (
                        <InputRightElement height="100%" pr={artistQuery ? '2.5rem' : '0.5rem'}>
                          <Spinner size="sm" color="purple.500" />
                        </InputRightElement>
                      )}
                    </InputGroup>
                    
                    {/* Bouton de recherche */}
                    {artistQuery && artistQuery !== artistFilter && (
                      <Button
                        mt={2}
                        size="sm"
                        leftIcon={<SearchIcon />}
                        colorScheme="brand"
                        variant="solid"
                        width="full"
                        onClick={() => {
                          handleArtistSelect(artistQuery);
                          setSelectedArtistIndex(-1);
                        }}
                      >
                        Rechercher "{artistQuery}"
                      </Button>
                    )}
                    
                    {/* Liste de suggestions d'artistes */}
                    {artistQuery && artistQuery !== artistFilter && (
                      <Box
                        position="absolute"
                        top="100%"
                        left={0}
                        right={0}
                        mt={1}
                        maxH="300px"
                        overflowY="auto"
                        bg={colorMode === 'dark' ? 'slate.800' : 'white'}
                        borderWidth={1}
                        borderColor={colorMode === 'dark' ? 'slate.700' : 'gray.200'}
                        borderRadius="md"
                        boxShadow="lg"
                        zIndex={10}
                      >
                        {isSearchingArtists && artistSuggestions.length === 0 && (
                          <Box px={3} py={2}>
                            <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>Recherche...</Text>
                          </Box>
                        )}
                        {!isSearchingArtists && artistSuggestions.length === 0 && (
                          <Box px={3} py={3}>
                            <Text fontSize="sm" fontWeight="semibold" color={colorMode === 'dark' ? 'gray.200' : 'gray.700'}>
                              Aucun artiste trouvé
                            </Text>
                            <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.500' : 'gray.500'}>
                              Essaie une autre orthographe
                            </Text>
                          </Box>
                        )}
                        {artistSuggestions.map((artist, index) => (
                          <Box
                            key={artist.name}
                            px={3}
                            py={2}
                            cursor="pointer"
                            bg={
                              index === selectedArtistIndex 
                                ? (colorMode === 'dark' ? 'purple.600' : 'purple.100')
                                : artistFilter === artist.name 
                                ? (colorMode === 'dark' ? 'purple.700' : 'purple.50') 
                                : 'transparent'
                            }
                            _hover={{
                              bg: colorMode === 'dark' ? 'whiteAlpha.200' : 'gray.100'
                            }}
                            onClick={() => {
                              handleArtistSelect(artist.name);
                              setSelectedArtistIndex(-1);
                            }}
                            transition="background 0.2s"
                          >
                            <Text fontSize="sm" fontWeight={artistFilter === artist.name ? 'bold' : 'normal'}>
                              {highlightArtistName(artist.name, artistQuery)}
                            </Text>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                  
                  {artistFilter && (
                    <Button mt={2} size="sm" variant="link" colorScheme="purple" onClick={clearArtistFilter}>
                      Réinitialiser le filtre
                    </Button>
                  )}
                </FormControl>
                {/* Double slider (RangeSlider) pour plage d'années */}
                {availableYears && (() => {
                  const [minSelected, maxSelected] = yearRange[0] !== null ? yearRange : [availableYears.min, availableYears.max];
                  return (
                    <Box mb={4}>
                      <Text fontSize="sm" mb={1} color={colorMode === 'dark' ? 'gray.200' : 'gray.700'}>
                        Plage d'années : {minSelected} - {maxSelected}
                      </Text>
                      <RangeSlider
                        min={availableYears.min}
                        max={availableYears.max}
                        step={1}
                        value={[minSelected, maxSelected]}
                        onChange={val => setYearRange(val)}
                        onChangeEnd={handleYearRangeApply}
                        colorScheme="purple"
                      >
                        <RangeSliderTrack>
                          <RangeSliderFilledTrack />
                        </RangeSliderTrack>
                        <RangeSliderThumb index={0} />
                        <RangeSliderThumb index={1} />
                      </RangeSlider>
                      <Button
                        mt={1}
                        size="xs"
                        variant="ghost"
                        colorScheme="gray"
                        onClick={() => {
                          const defaultRange = [availableYears.min, availableYears.max];
                          setYearRange(defaultRange);
                          handleYearRangeApply(defaultRange);
                          setHasCustomYearRange(false);
                        }}
                      >
                        Toutes les années
                      </Button>
                    </Box>
                  );
                })()}
                <FormControl mb={2} display={{ base: 'none', md: 'block' }}>
                  <FormLabel fontWeight="bold">Albums par ligne</FormLabel>
                  <Slider
                    min={4}
                    max={8}
                    step={1}
                    value={albumsPerRow}
                    onChange={setAlbumsPerRow}
                    colorScheme="purple"
                  >
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb boxSize={6} fontWeight="bold">{albumsPerRow}</SliderThumb>
                  </Slider>
                </FormControl>
              </Box>
              {/* Grille d'albums à droite */}
              <Box w={{ base: '100%', md: 'calc(100% - 320px - 2rem)' }} flexShrink={0}>
                <Box display="flex" flexDirection="column" gap={4}>
                  <Box
                    borderWidth={1}
                    borderColor={colorMode === 'dark' ? 'slate.700' : 'gray.200'}
                    borderRadius="lg"
                    bg={colorMode === 'dark' ? 'slate.800' : 'white'}
                    boxShadow="sm"
                    p={{ base: 3, md: 4 }}
                    // Hauteur minimale pour éviter le "saut" visuel quand aucun album n'est affiché
                    minH={{ base: '132px', md: '110px' }}
                    display="flex"
                    flexDirection="column"
                    justifyContent="space-between"
                  >
                    <Flex
                      direction={{ base: 'column', md: 'row' }}
                      align={{ base: 'flex-start', md: 'center' }}
                      justify="space-between"
                      gap={3}
                      wrap="wrap"
                    >
                      <Flex align="center" gap={3} wrap="wrap">
                        <Text fontWeight="bold" fontSize="lg" color={colorMode === 'dark' ? 'gray.100' : 'brand.800'}>
                          {totalAlbums.toLocaleString('fr-FR')} album{totalAlbums > 1 ? 's' : ''}
                        </Text>
                        <Badge colorScheme="brand" variant="subtle" borderRadius="md" px={2} py={0.5} fontSize="0.75rem">
                          Page {page} / {totalPages}
                        </Badge>
                      </Flex>
                      <Flex align="center" gap={2} wrap="wrap">
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>
                          Albums par page
                        </Text>
                        <Select
                          size="sm"
                          value={pageSize}
                          onChange={event => handlePageSizeChange(event.target.value)}
                          maxW="100px"
                          variant="filled"
                          focusBorderColor="brand.400"
                          bg={colorMode === 'dark' ? 'slate.700' : 'gray.50'}
                          borderColor={colorMode === 'dark' ? 'brand.600' : 'gray.200'}
                          color={colorMode === 'dark' ? 'gray.100' : 'brand.900'}
                        >
                          {[20, 40, 60, 100].map(optionValue => (
                            <option key={optionValue} value={optionValue}>{optionValue}</option>
                          ))}
                        </Select>
                      </Flex>
                    </Flex>

                    <Flex
                      mt={{ base: 3, md: 4 }}
                      direction={{ base: 'column', sm: 'row' }}
                      align={{ base: 'stretch', sm: 'center' }}
                      justify="space-between"
                      gap={3}
                    >
                      <Flex gap={2} align="center">
                        {/* Pagination compacte avec numéros et flèches */}
                        <ButtonGroup size={{ base: 'sm', md: 'sm' }} variant="ghost" colorScheme="gray" isAttached={false}>
                          <IconButton
                            aria-label="Page précédente"
                            icon={<ChevronLeftIcon />}
                            onClick={goToPrevPage}
                            isDisabled={!canGoPrev}
                            borderRadius="full"
                            _hover={{ bg: colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.100' }}
                          />
                          {(() => {
                            const items = [];
                            const start = Math.max(1, page - 2);
                            const end = Math.min(totalPages, page + 2);
                            if (start > 1) {
                              items.push(
                                <Button key="first" size="sm" onClick={() => setPage(1)} borderRadius="full" variant="ghost">1</Button>
                              );
                              if (start > 2) {
                                items.push(<Text key="dots-left" px={1} color={colorMode==='dark'?'gray.400':'gray.600'}>…</Text>);
                              }
                            }
                            for (let p = start; p <= end; p++) {
                              items.push(
                                <Button
                                  key={`p-${p}`}
                                  size="sm"
                                  onClick={() => setPage(p)}
                                  borderRadius="full"
                                  variant={p === page ? 'solid' : 'ghost'}
                                  colorScheme={p === page ? 'brand' : 'gray'}
                                >
                                  {p}
                                </Button>
                              );
                            }
                            if (end < totalPages) {
                              if (end < totalPages - 1) {
                                items.push(<Text key="dots-right" px={1} color={colorMode==='dark'?'gray.400':'gray.600'}>…</Text>);
                              }
                              items.push(
                                <Button key="last" size="sm" onClick={() => setPage(totalPages)} borderRadius="full" variant="ghost">{totalPages}</Button>
                              );
                            }
                            return items;
                          })()}
                          <IconButton
                            aria-label="Page suivante"
                            icon={<ChevronRightIcon />}
                            onClick={goToNextPage}
                            isDisabled={!canGoNext}
                            borderRadius="full"
                            _hover={{ bg: colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.100' }}
                          />
                        </ButtonGroup>
                      </Flex>
                      
                      <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} textAlign={{ base: 'center', sm: 'right' }}>
                        {albums.length} affiché{albums.length > 1 ? 's' : ''} sur cette page
                      </Text>
                    </Flex>
                  </Box>

                  <Box position="relative" w="100%">
                    {albumsLoading && (
                      <Flex
                        position="absolute"
                        inset={0}
                        align="center"
                        justify="center"
                        bg={colorMode === 'dark' ? 'rgba(10,10,25,0.6)' : 'rgba(255,255,255,0.6)'}
                        backdropFilter="blur(2px)"
                        zIndex={5}
                        borderRadius="md"
                      >
                        <Spinner size="lg" thickness="4px" speed="0.6s" color="purple.400" />
                      </Flex>
                    )}
                    
                    <SimpleGrid columns={albumsPerRow} spacing={{ base: 3, md: 2 }} mt={2} opacity={albumsLoading ? 0.55 : 1} transition="opacity 0.25s" minH="260px" w="100%">
                        {albums.length === 0 ? (
                          [...Array(albumsPerRow)].map((_, i) => (
                          <Box
                            key={`empty-skel-${i}`}
                            position="relative"
                            borderRadius="xl"
                            overflow="hidden"
                            boxShadow="md"
                            bg={colorMode === 'dark' ? 'slate.800' : 'white'}
                            aspectRatio={1}
                          >
                            {/* Skeleton de l'image */}
                            <Skeleton w="100%" h="100%" startColor={colorMode === 'dark' ? 'purple.900' : 'purple.50'} endColor={colorMode === 'dark' ? 'purple.700' : 'purple.100'} />
                            
                            {/* Overlay avec skeleton du texte */}
                            <Box
                              position="absolute"
                              bottom={0}
                              left={0}
                              right={0}
                              bg={colorMode === 'dark' ? 'rgba(35,37,38,0.95)' : 'rgba(255,255,255,0.95)'}
                              p={3}
                            >
                              <SkeletonText noOfLines={2} spacing={2} skeletonHeight={2.5} />
                              <Flex mt={2} gap={1.5}>
                                <Skeleton h="18px" w="45px" borderRadius="md" />
                                <Skeleton h="18px" w="55px" borderRadius="md" />
                              </Flex>
                            </Box>
                            
                            {i === 0 && (
                              <Box
                                position="absolute"
                                inset={0}
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                                justifyContent="center"
                                bg={colorMode === 'dark' ? 'rgba(10,10,25,0.92)' : 'rgba(255,255,255,0.92)'}
                                backdropFilter="blur(4px)"
                                zIndex={2}
                                p={4}
                              >
                                <Text fontSize="md" fontWeight="bold" color={colorMode === 'dark' ? 'gray.100' : 'brand.700'} mb={2}>
                                  Aucun résultat
                                </Text>
                                <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'} textAlign="center" mb={3}>
                                  Ajuste les filtres ou réinitialise
                                </Text>
                                {(artistFilter || (appliedYearRange[0] !== null && appliedYearRange[1] !== null)) && (
                                  <Button
                                    size="xs"
                                    colorScheme="brand"
                                    variant="solid"
                                    onClick={() => {
                                      clearArtistFilter();
                                      if (availableYears) {
                                        const defaultRange = [availableYears.min, availableYears.max];
                                        setYearRange(defaultRange);
                                        handleYearRangeApply(defaultRange);
                                      }
                                    }}
                                  >
                                    Réinitialiser
                                  </Button>
                                )}
                              </Box>
                            )}
                          </Box>
                        ))
                      ) : (
                        albums.map((album, index) => (
                          <AlbumCard
                            key={album.id ? album.id : `${album.title}-${album.year}-${index}`}
                            album={album}
                            index={index}
                            colorMode={colorMode}
                            isUser={isUser}
                            onClick={() => {
                              setSelectedAlbumId(album.id);
                              openDetails();
                            }}
                          />
                        ))
                      )}
                    </SimpleGrid>
                  </Box>
                </Box>
              </Box>
            </Box>
            {/* Drawer filtres mobile */}
            <Drawer isOpen={isFiltersOpen} placement="left" onClose={closeFilters} size="xs">
              <DrawerOverlay />
              <DrawerContent bg={colorMode === 'dark' ? 'slate.900' : 'white'}>
                <DrawerCloseButton />
                <DrawerHeader borderBottomWidth="1px" borderColor={colorMode === 'dark' ? 'slate.700' : 'gray.200'}>
                  Filtres
                </DrawerHeader>
                <DrawerBody pt={4}>
                  <FormControl mb={4}>
                    <FormLabel fontSize="sm" color={colorMode === 'dark' ? 'gray.200' : 'gray.700'}>
                      Artistes
                    </FormLabel>
                    <Box position="relative">
                      <InputGroup size="sm">
                        <Input
                          placeholder="Rechercher un artiste"
                          value={artistQuery}
                          onChange={e => {
                            const query = e.target.value;
                            setArtistQuery(query);
                            setSelectedArtistIndex(-1);
                            // Appel debounced à l'API
                            debouncedSearchArtists(query);
                          }}
                          onKeyDown={(e) => {
                            if (!artistQuery) return;
                            
                            if (e.key === 'ArrowDown' && artistSuggestions.length > 0) {
                              e.preventDefault();
                              setSelectedArtistIndex(prev => 
                                prev < artistSuggestions.length - 1 ? prev + 1 : prev
                              );
                            } else if (e.key === 'ArrowUp' && artistSuggestions.length > 0) {
                              e.preventDefault();
                              setSelectedArtistIndex(prev => prev > 0 ? prev - 1 : -1);
                            } else if (e.key === 'Enter') {
                              e.preventDefault();
                              if (selectedArtistIndex >= 0 && artistSuggestions.length > 0) {
                                // Sélectionner l'artiste mis en surbrillance
                                const selectedArtist = artistSuggestions[selectedArtistIndex];
                                handleArtistSelect(selectedArtist.name);
                              } else {
                                // Rechercher avec la chaîne de caractères saisie
                                handleArtistSelect(artistQuery);
                              }
                              closeFilters();
                            } else if (e.key === 'Escape') {
                              setSelectedArtistIndex(-1);
                              setArtistSuggestions([]);
                            }
                          }}
                          bg={colorMode === 'dark' ? 'slate.800' : 'white'}
                          color={colorMode === 'dark' ? 'white' : 'brand.900'}
                          borderColor={colorMode === 'dark' ? 'slate.700' : 'brand.900'}
                          _hover={{ borderColor: 'accent.500' }}
                          pr={artistQuery ? '2.5rem' : undefined}
                        />
                        {artistQuery && (
                          <InputRightElement height="100%" pr={1}>
                            <CloseButton 
                              size="sm" 
                              onClick={() => {
                                setArtistQuery('');
                                setArtistFilter('');
                                setSelectedArtistIndex(-1);
                              }} 
                              aria-label="Effacer la recherche d'artiste" 
                            />
                          </InputRightElement>
                        )}
                        {isSearchingArtists && (
                          <InputRightElement height="100%" pr={artistQuery ? '2.5rem' : '0.5rem'}>
                            <Spinner size="sm" color="brand.500" />
                          </InputRightElement>
                        )}
                      </InputGroup>
                      
                      {/* Bouton de recherche mobile */}
                      {artistQuery && artistQuery !== artistFilter && (
                        <Button
                          mt={2}
                          size="sm"
                          leftIcon={<SearchIcon />}
                          colorScheme="brand"
                          variant="solid"
                          width="full"
                          onClick={() => {
                            handleArtistSelect(artistQuery);
                            setSelectedArtistIndex(-1);
                            closeFilters();
                          }}
                        >
                          Rechercher "{artistQuery}"
                        </Button>
                      )}
                      
                      {/* Liste de suggestions d'artistes mobile (depuis API) */}
                      {artistQuery && artistQuery !== artistFilter && (
                        <Box
                          position="absolute"
                          top="100%"
                          left={0}
                          right={0}
                          mt={1}
                          maxH="300px"
                          overflowY="auto"
                          bg={colorMode === 'dark' ? 'slate.800' : 'white'}
                          borderWidth={1}
                          borderColor={colorMode === 'dark' ? 'slate.700' : 'gray.200'}
                          borderRadius="md"
                          boxShadow="lg"
                          zIndex={10}
                        >
                          {isSearchingArtists && artistSuggestions.length === 0 && (
                            <Box px={3} py={2}>
                              <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>Recherche...</Text>
                            </Box>
                          )}
                          {!isSearchingArtists && artistSuggestions.length === 0 && (
                            <Box px={3} py={3}>
                              <Text fontSize="sm" fontWeight="semibold" color={colorMode === 'dark' ? 'gray.200' : 'gray.700'}>
                                Aucun artiste trouvé
                              </Text>
                              <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.500' : 'gray.500'}>
                                Essaie une autre orthographe
                              </Text>
                            </Box>
                          )}
                          {artistSuggestions.map((artist, index) => (
                            <Box
                              key={artist.name}
                              px={3}
                              py={2}
                              cursor="pointer"
                              bg={
                                index === selectedArtistIndex 
                                  ? (colorMode === 'dark' ? 'purple.600' : 'purple.100')
                                  : artistFilter === artist.name 
                                  ? (colorMode === 'dark' ? 'purple.700' : 'purple.50') 
                                  : 'transparent'
                              }
                              _hover={{
                                bg: colorMode === 'dark' ? 'whiteAlpha.200' : 'gray.100'
                              }}
                              onClick={() => {
                                handleArtistSelect(artist.name);
                                setSelectedArtistIndex(-1);
                                closeFilters();
                              }}
                              transition="background 0.2s"
                            >
                              <Text fontSize="sm" fontWeight={artistFilter === artist.name ? 'bold' : 'normal'}>
                                {highlightArtistName(artist.name, artistQuery)}
                              </Text>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                    
                    {artistFilter && (
                      <Button mt={2} size="sm" variant="link" colorScheme="brand" onClick={() => { clearArtistFilter(); closeFilters(); }}>
                        Réinitialiser le filtre
                      </Button>
                    )}
                  </FormControl>
                  {availableYears && (() => {
                    const [minSelected, maxSelected] = yearRange[0] !== null ? yearRange : [availableYears.min, availableYears.max];
                    return (
                      <Box mb={4}>
                        <Text fontSize="sm" mb={1} color={colorMode === 'dark' ? 'gray.200' : 'gray.700'}>
                          Plage d'années : {minSelected} - {maxSelected}
                        </Text>
                        <RangeSlider
                          min={availableYears.min}
                          max={availableYears.max}
                          step={1}
                          value={[minSelected, maxSelected]}
                          onChange={val => setYearRange(val)}
                          onChangeEnd={(val) => {
                            handleYearRangeApply(val);
                            closeFilters();
                          }}
                          colorScheme="brand"
                        >
                          <RangeSliderTrack>
                            <RangeSliderFilledTrack />
                          </RangeSliderTrack>
                          <RangeSliderThumb index={0} />
                          <RangeSliderThumb index={1} />
                        </RangeSlider>
                        <Button
                          mt={1}
                          size="xs"
                          variant="ghost"
                          colorScheme="gray"
                          onClick={() => {
                            const defaultRange = [availableYears.min, availableYears.max];
                            setYearRange(defaultRange);
                            handleYearRangeApply(defaultRange);
                            setHasCustomYearRange(false);
                            closeFilters();
                          }}
                        >
                          Toutes les années
                        </Button>
                      </Box>
                    );
                  })()}
                </DrawerBody>
              </DrawerContent>
            </Drawer>

            {/* Fenêtre modale de détails d'album */}
            <Suspense fallback={null}>
              <AlbumDetailsModal
                albumId={selectedAlbumId}
                isOpen={isDetailsOpen}
                onClose={() => {
                  setSelectedAlbumId(null);
                  closeDetails();
                }}
                isContributor={isContributor}
                isUser={isUser}
                refreshAlbums={refreshCurrentPage}
                onCollectionUpdate={handleCollectionUpdate}
                onAlbumDelete={handleAlbumDelete}
              />
            </Suspense>
            </>
          )}
          </Box>
        </Box>
      </Fade>
      
      {/* Bottom Navigation Mobile */}
      <Box
        display={{ base: 'flex', md: 'none' }}
        position="fixed"
        bottom={0}
        left={0}
        right={0}
  bg={colorMode === 'dark' ? 'slate.900' : 'white'}
        borderTopWidth={1}
  borderColor={colorMode === 'dark' ? 'slate.700' : 'gray.200'}
        boxShadow="0 -2px 10px rgba(0,0,0,0.1)"
        zIndex={20}
        py={2}
        px={2}
      >
        <ButtonGroup isAttached={false} width="100%" justifyContent="space-around" variant="ghost">
          <Button
            flex={1}
            flexDirection="column"
            height="auto"
            py={2}
            colorScheme={!showStats && !showProfile && !showCollection && !showArtistManager && !showLists ? 'brand' : 'gray'}
            variant={!showStats && !showProfile && !showCollection && !showArtistManager && !showLists ? 'solid' : 'ghost'}
            onClick={() => {
              setShowStats(false);
              setShowProfile(false);
              setShowCollection(false);
              setShowArtistManager(false);
              setShowLists(false);
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
            <Text fontSize="xs" mt={1}>Disques</Text>
          </Button>
          <Button
            flex={1}
            flexDirection="column"
            height="auto"
            py={2}
            colorScheme={showStats && !showProfile && !showArtistManager ? 'brand' : 'gray'}
            variant={showStats && !showProfile && !showArtistManager ? 'solid' : 'ghost'}
            onClick={() => {
              setShowStats(true);
              setShowProfile(false);
              setShowCollection(false);
              setShowArtistManager(false);
                setShowLists(false);
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 20V10M12 20V4M6 20v-6"/>
            </svg>
            <Text fontSize="xs" mt={1}>Stats</Text>
          </Button>
          {isUser && user && jwt ? (
            <>
              <Button
                flex={1}
                flexDirection="column"
                height="auto"
                py={2}
                colorScheme={showCollection && !showProfile && !showArtistManager ? 'purple' : 'gray'}
                variant={showCollection && !showProfile && !showArtistManager ? 'solid' : 'ghost'}
                onClick={() => {
                  setShowCollection(true);
                  setShowStats(false);
                  setShowProfile(false);
                  setShowArtistManager(false);
                  setShowLists(false);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
                <Text fontSize="xs" mt={1}>Collection</Text>
              </Button>

              <Button
                flex={1}
                flexDirection="column"
                height="auto"
                py={2}
                colorScheme={showLists && !showProfile && !showArtistManager ? 'purple' : 'gray'}
                variant={showLists && !showProfile && !showArtistManager ? 'solid' : 'ghost'}
                onClick={() => {
                  setShowLists(true);
                  setShowCollection(false);
                  setShowStats(false);
                  setShowProfile(false);
                  setShowArtistManager(false);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
                </svg>
                <Text fontSize="xs" mt={1}>Listes</Text>
              </Button>
            </>
          ) : null}
          {isContributor && user && jwt ? (
            <Button
              flex={1}
              flexDirection="column"
              height="auto"
              py={2}
              colorScheme={showArtistManager ? 'purple' : 'gray'}
              variant={showArtistManager ? 'solid' : 'ghost'}
              onClick={() => {
                setShowArtistManager(true);
                setShowCollection(false);
                setShowStats(false);
                setShowProfile(false);
                setShowLists(false);
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <Text fontSize="xs" mt={1}>Artistes</Text>
            </Button>
          ) : null}
          {user && jwt ? (
            <Button
              flex={1}
              flexDirection="column"
              height="auto"
              py={2}
              colorScheme={showProfile ? 'purple' : 'gray'}
              variant={showProfile ? 'solid' : 'ghost'}
              onClick={() => {
                setShowProfile(true);
                setShowStats(false);
                setShowCollection(false);
                setShowArtistManager(false);
                setShowLists(false);
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="7" r="4"/>
                <path d="M5.5 21a8.38 8.38 0 0 1 13 0"/>
              </svg>
              <Text fontSize="xs" mt={1}>Profil</Text>
            </Button>
          ) : null}
        </ButtonGroup>
      </Box>
      
      {/* Bouton Scroll to Top */}
      <ScaleFade in={showScrollTop} initialScale={0.8}>
        <IconButton
          icon={<ChevronUpIcon boxSize={6} />}
          colorScheme="brand"
          borderRadius="full"
          size="lg"
          position="fixed"
          bottom={{ base: 24, md: 24 }}
          right={{ base: 6, md: 10 }}
          zIndex={15}
          boxShadow="2xl"
          onClick={scrollToTop}
          aria-label="Retour en haut"
          title="Retour en haut"
          display={{ base: showScrollTop ? 'flex' : 'none', md: showScrollTop ? 'flex' : 'none' }}
        />
      </ScaleFade>
    </>
  );
}

export default App
