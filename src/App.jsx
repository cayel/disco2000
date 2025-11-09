import { decodeJwt, isJwtExpired } from './utils/jwt';
import authFetch from './utils/authFetch';
import { getCookie, setCookie, deleteCookie } from './utils/cookie';
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Heading, Box, Spinner, SimpleGrid, Text, IconButton, useColorMode, Button, RangeSlider, RangeSliderTrack, RangeSliderFilledTrack, RangeSliderThumb, Slider, SliderTrack, SliderFilledTrack, SliderThumb, FormControl, FormLabel, Tooltip, Input, InputGroup, InputRightElement, CloseButton, Select, ButtonGroup, Flex, Badge, Skeleton, SkeletonText } from '@chakra-ui/react'
import { AddIcon, ArrowLeftIcon, ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'
import GoogleAuthButton from './components/GoogleAuthButton'
import ProfilePage from './components/ProfilePage'
import AddStudioAlbum from './components/AddStudioAlbum'
import AlbumDetailsModal from './components/AlbumDetailsModal'
import StudioStats from './components/StudioStats'
import AlbumCard from './components/AlbumCard'
import CollectionExplorer from './components/CollectionExplorer'
import { Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton, useDisclosure } from '@chakra-ui/react';
import { auth } from './firebase'
import { signOut } from 'firebase/auth'
import './App.css'

function App() {
  const { isOpen, onOpen, onClose } = useDisclosure(); // pour la modale d'ajout
  const {
    isOpen: isDetailsOpen,
    onOpen: openDetails,
    onClose: closeDetails
  } = useDisclosure();
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
  const [jwt, setJwt] = useState(() => {
    const token = getCookie('jwt');
    if (!token) return null;
    if (isJwtExpired(token)) {
      return null;
    }
    return token;
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalAlbums, setTotalAlbums] = useState(0);

  const [allAlbums, setAllAlbums] = useState([]);
  const [allAlbumsLoading, setAllAlbumsLoading] = useState(false);
  const [allAlbumsError, setAllAlbumsError] = useState(null);

  const jwtPayload = useMemo(() => (jwt ? decodeJwt(jwt) : null), [jwt]);

  const refreshAccessToken = useCallback(async () => {
    const refreshToken = getCookie('refresh_token');
    if (!refreshToken) return null;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': import.meta.env.VITE_API_KEY,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!response.ok) throw new Error('Refresh failed');
      const data = await response.json();
      if (!data?.access_token) throw new Error('Missing access token');
      setCookie('jwt', data.access_token, 7, true);
      if (data.refresh_token) {
        setCookie('refresh_token', data.refresh_token, 30, true);
      }
      window.dispatchEvent(new CustomEvent('jwt-updated', { detail: data.access_token }));
      setJwt(data.access_token);
      return data.access_token;
    } catch {
      deleteCookie('jwt');
      deleteCookie('refresh_token');
      setJwt(null);
      setUser(null);
      setShowProfile(false);
      setShowStats(false);
      setShowCollection(false);
      setPage(1);
      setTotalAlbums(0);
      setAllAlbums([]);
      if (auth.currentUser) {
        signOut(auth).catch(() => {});
      }
      return null;
    }
  }, []);

  useEffect(() => {
    if (!jwtPayload?.exp) return;
    const now = Date.now();
    const expirationMs = jwtPayload.exp * 1000;
    const refreshLeadTime = 60 * 1000; // refresh 1 minute before expiry
    const refreshAt = expirationMs - refreshLeadTime;
    if (refreshAt <= now) {
      refreshAccessToken();
      return;
    }
    const timeoutId = setTimeout(() => {
      refreshAccessToken();
    }, refreshAt - now);
    return () => clearTimeout(timeoutId);
  }, [jwtPayload?.exp, refreshAccessToken]);

  useEffect(() => {
    const handleAuthChange = (firebaseUser) => {
      if (!jwt) {
        setUser(null);
        setShowProfile(false);
        setShowStats(false);
        setShowCollection(false);
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
        setShowProfile(false);
        setShowStats(false);
        setShowCollection(false);
        setPage(1);
        setTotalAlbums(0);
        setAllAlbums([]);
        signOut(auth).catch(() => {});
        return;
      }
      setJwt(token);
    };
    window.addEventListener('jwt-updated', handleJwtUpdated);
    return () => window.removeEventListener('jwt-updated', handleJwtUpdated);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const ensureValidToken = async () => {
      const token = getCookie('jwt');
      if (token && !isJwtExpired(token)) {
        if (token !== jwt && !cancelled) {
          setJwt(token);
        }
        return;
      }
      const refreshed = await refreshAccessToken();
      if (cancelled) return;
      if (refreshed) {
        return;
      }
      deleteCookie('jwt');
      deleteCookie('refresh_token');
      if (jwt !== null) {
        setJwt(null);
      }
      setUser(null);
      setShowProfile(false);
      setShowStats(false);
      setShowCollection(false);
      setPage(1);
      setTotalAlbums(0);
      setAllAlbums([]);
      if (auth.currentUser) {
        signOut(auth).catch(() => {});
      }
    };
    ensureValidToken();
    return () => {
      cancelled = true;
    };
  }, [jwt, refreshAccessToken]);
  const [artistFilter, setArtistFilter] = useState('');
  const [artistQuery, setArtistQuery] = useState('');
  const [yearRange, setYearRange] = useState([null, null]);
  const [appliedYearRange, setAppliedYearRange] = useState([null, null]);
  const [hasCustomYearRange, setHasCustomYearRange] = useState(false);
  const { colorMode, toggleColorMode } = useColorMode();
  const [albums, setAlbums] = useState([])
  const [albumsPerRow, setAlbumsPerRow] = useState(5)
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);
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

  // Mémorisation de la liste des artistes uniques pour le Select
  const uniqueArtists = useMemo(() => {
    const source = allAlbums.length ? allAlbums : albums;
    const artistSet = new Set();
    source.forEach(album => {
      if (!album) return;
      const rawArtist = typeof album.artist === 'string' ? album.artist : album.artist?.name;
      if (rawArtist) {
        artistSet.add(rawArtist);
      }
    });
    return Array.from(artistSet).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
  }, [allAlbums, albums]);

  const filteredArtistOptions = useMemo(() => {
    if (!artistQuery) {
      return uniqueArtists;
    }
    const normalizedQuery = artistQuery.trim().toLowerCase();
    return uniqueArtists.filter(artistName => artistName.toLowerCase().includes(normalizedQuery));
  }, [artistQuery, uniqueArtists]);

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
    setPage(1);
  }, []);

  const clearArtistFilter = useCallback(() => {
    setArtistFilter('');
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

  return (
    <>
      <Box
        as="nav"
        w="100vw"
        left="50%"
        right="50%"
        ml="-50vw"
        mr="-50vw"
        px={{ base: 4, md: 10 }}
        py={3}
        mb={8}
        boxShadow="sm"
        bg={colorMode === 'dark' ? 'brand.900' : 'white'}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        position="sticky"
        top={0}
        zIndex={10}
        borderBottomWidth={1}
        borderColor={colorMode === 'dark' ? 'brand.800' : 'gray.200'}
        style={{ left: 0, right: 0 }}
      >
        <Heading
          as="h1"
          size="lg"
          fontWeight="bold"
          letterSpacing="tight"
          color={colorMode === 'dark' ? 'accent.500' : 'brand.900'}
          fontFamily="'Montserrat', 'Segoe UI', Arial, sans-serif"
        >
          Disco 2000
        </Heading>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            variant={!showStats && !showProfile && !showCollection ? 'solid' : 'ghost'}
            size="sm"
            colorScheme="purple"
            onClick={() => {
              setShowStats(false);
              setShowProfile(false);
              setShowCollection(false);
            }}
            fontWeight="bold"
            px={3}
          >
            Disques
          </Button>
          <Button
            variant={showStats && !showProfile ? 'solid' : 'ghost'}
            size="sm"
            colorScheme="purple"
            onClick={() => {
              setShowStats(true);
              setShowProfile(false);
              setShowCollection(false);
            }}
            fontWeight="bold"
            px={3}
          >
            Statistiques
          </Button>
          {isUser && user && jwt ? (
            <Button
              variant={showCollection && !showProfile ? 'solid' : 'ghost'}
              size="sm"
              colorScheme="purple"
              onClick={() => {
                setShowCollection(true);
                setShowStats(false);
                setShowProfile(false);
              }}
              fontWeight="bold"
              px={3}
            >
              Ma collection
            </Button>
          ) : null}
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
      {showProfile && user ? (
        <ProfilePage onLogout={() => setShowProfile(false)} onBack={() => setShowProfile(false)} />
      ) : showStats ? (
        <StudioStats />
      ) : showCollection && isUser ? (
        <CollectionExplorer
          albums={allAlbums}
          loading={allAlbumsLoading}
          error={allAlbumsError}
          onRefresh={refreshAllData}
          isUser={isUser}
        />
      ) : (
        <Box
          px={4}
          minH="100vh"
          pb={12}
          bg={colorMode === 'dark' ? 'brand.900' : '#f7f7fa'}
          transition="background 0.3s"
          position="relative"
        >
          {/* Bouton flottant pour ouvrir la modale d'ajout */}
          {user && jwtPayload && Array.isArray(jwtPayload.roles) && jwtPayload.roles.includes('contributeur') && (
            <Tooltip label="Ajouter un album studio" placement="left">
              <IconButton
                icon={<AddIcon />}
                colorScheme="purple"
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
                <AddStudioAlbum />
              </ModalBody>
            </ModalContent>
          </Modal>

          {loading && <Spinner size="xl" mt={8} />}
          {error && <Text color="red.500">Erreur : {error}</Text>}
          {!loading && !error && (
            <>
            <Box display="flex" flexDirection={{ base: 'column', md: 'row' }} gap={8}>
              {/* Sidebar des filtres à gauche */}
              <Box w={{ base: '100%', md: '320px' }} mb={{ base: 8, md: 0 }}>
                <FormControl mb={4}>
                  <FormLabel fontSize="sm" color={colorMode === 'dark' ? 'gray.200' : 'gray.700'}>
                    Artistes
                  </FormLabel>
                  <InputGroup size="sm">
                    <Input
                      placeholder="Rechercher un artiste"
                      value={artistQuery}
                      onChange={e => setArtistQuery(e.target.value)}
                      bg={colorMode === 'dark' ? 'brand.800' : 'white'}
                      color={colorMode === 'dark' ? 'white' : 'brand.900'}
                      borderColor={colorMode === 'dark' ? 'brand.700' : 'brand.900'}
                      _hover={{ borderColor: 'accent.500' }}
                      pr={artistQuery ? '2.5rem' : undefined}
                    />
                    {artistQuery && (
                      <InputRightElement height="100%" pr={1}>
                        <CloseButton size="sm" onClick={() => setArtistQuery('')} aria-label="Effacer la recherche d'artiste" />
                      </InputRightElement>
                    )}
                  </InputGroup>
                  <Text mt={2} fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                    {filteredArtistOptions.length} artiste{filteredArtistOptions.length > 1 ? 's' : ''} {artistQuery ? 'correspondent à la recherche' : 'disponibles'}
                  </Text>
                  <Box
                    mt={2}
                    borderWidth={1}
                    borderColor={colorMode === 'dark' ? 'brand.700' : 'gray.200'}
                    borderRadius="md"
                    maxH="280px"
                    overflowY="auto"
                    bg={colorMode === 'dark' ? 'brand.800' : 'white'}
                    boxShadow="sm"
                  >
                    {filteredArtistOptions.length === 0 ? (
                      <Text px={3} py={2} fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                        Aucun artiste trouvé
                      </Text>
                    ) : (
                      filteredArtistOptions.map(artist => {
                        const isActive = artistFilter === artist;
                        return (
                          <Button
                            key={artist}
                            justifyContent="flex-start"
                            variant={isActive ? 'solid' : 'ghost'}
                            colorScheme={isActive ? 'purple' : undefined}
                            onClick={() => handleArtistSelect(artist)}
                            w="100%"
                            borderRadius={0}
                            size="sm"
                            fontWeight={isActive ? 'bold' : 'normal'}
                            bg={isActive ? (colorMode === 'dark' ? 'purple.500' : 'purple.100') : 'transparent'}
                            color={isActive ? (colorMode === 'dark' ? 'white' : 'purple.700') : (colorMode === 'dark' ? 'gray.100' : 'brand.900')}
                            _hover={{ bg: isActive ? (colorMode === 'dark' ? 'purple.600' : 'purple.200') : (colorMode === 'dark' ? 'brand.700' : 'gray.100') }}
                            textAlign="left"
                          >
                            {artist}
                          </Button>
                        );
                      })
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
                <FormControl mb={2}>
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
              <Box flex={1}>
                <Box display="flex" flexDirection="column" gap={4}>
                  <Box
                    borderWidth={1}
                    borderColor={colorMode === 'dark' ? 'brand.700' : 'gray.200'}
                    borderRadius="lg"
                    bg={colorMode === 'dark' ? 'brand.800' : 'white'}
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
                        <Badge colorScheme="purple" variant="subtle" borderRadius="md" px={2} py={0.5} fontSize="0.75rem">
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
                          focusBorderColor="purple.400"
                          bg={colorMode === 'dark' ? 'brand.700' : 'gray.50'}
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
                      <ButtonGroup size="sm" isAttached variant="outline" colorScheme="purple">
                        <Button
                          onClick={goToFirstPage}
                          isDisabled={!canGoPrev}
                          leftIcon={<ArrowLeftIcon />}
                        >
                          Première
                        </Button>
                        <Button
                          onClick={goToPrevPage}
                          isDisabled={!canGoPrev}
                          leftIcon={<ChevronLeftIcon />}
                        >
                          Précédent
                        </Button>
                        <Button
                          onClick={goToNextPage}
                          isDisabled={!canGoNext}
                          rightIcon={<ChevronRightIcon />}
                          variant="solid"
                        >
                          Suivant
                        </Button>
                        <Button
                          onClick={goToLastPage}
                          isDisabled={!canGoNext}
                          rightIcon={<ArrowRightIcon />}
                        >
                          Dernière
                        </Button>
                      </ButtonGroup>
                      <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} textAlign={{ base: 'center', sm: 'right' }}>
                        {albums.length} affiché{albums.length > 1 ? 's' : ''} sur cette page
                      </Text>
                    </Flex>
                  </Box>

                  <Box position="relative">
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
                    <SimpleGrid columns={albumsPerRow} spacing={2} mt={2} opacity={albumsLoading ? 0.55 : 1} transition="opacity 0.25s" minH="260px">
                      {albums.length === 0 ? (
                        [...Array(albumsPerRow)].map((_, i) => (
                          <Flex
                            key={`empty-skel-${i}`}
                            direction="column"
                            align="center"
                            justify="flex-start"
                            p={2}
                            borderWidth={1}
                            borderColor={colorMode === 'dark' ? 'brand.700' : 'gray.200'}
                            borderStyle="dashed"
                            borderRadius="md"
                            bg={colorMode === 'dark' ? 'brand.900' : 'white'}
                            minH="240px"
                          >
                            <Skeleton w="100%" h="140px" borderRadius="md" startColor={colorMode === 'dark' ? 'purple.900' : 'purple.50'} endColor={colorMode === 'dark' ? 'purple.700' : 'purple.100'} />
                            <SkeletonText mt={3} noOfLines={2} spacing={2} skeletonHeight={3} w="90%" />
                            {i === 0 && (
                              <Flex direction="column" align="center" mt={3} gap={2}>
                                <Text fontSize="sm" fontWeight="bold" color={colorMode === 'dark' ? 'gray.100' : 'brand.700'}>
                                  Aucun résultat
                                </Text>
                                <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'} textAlign="center" px={2}>
                                  Ajuste les filtres ou réinitialise pour revoir la liste complète.
                                </Text>
                                {(artistFilter || (appliedYearRange[0] !== null && appliedYearRange[1] !== null)) && (
                                  <Button
                                    size="xs"
                                    colorScheme="purple"
                                    variant="outline"
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
                              </Flex>
                            )}
                          </Flex>
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
            {/* Fenêtre modale de détails d'album */}
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
            </>
          )}
        </Box>
      )}
    </>
  );
}

export default App
