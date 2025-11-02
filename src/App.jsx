import { decodeJwt, isJwtExpired } from './utils/jwt';
import { getCookie } from './utils/cookie';
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Heading, Box, Spinner, SimpleGrid, Text, IconButton, useColorMode, Select, Button, RangeSlider, RangeSliderTrack, RangeSliderFilledTrack, RangeSliderThumb, Slider, SliderTrack, SliderFilledTrack, SliderThumb, FormControl, FormLabel, Tooltip } from '@chakra-ui/react'
import { AddIcon } from '@chakra-ui/icons'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'
import GoogleAuthButton from './components/GoogleAuthButton'
import ProfilePage from './components/ProfilePage'
import AddStudioAlbum from './components/AddStudioAlbum'
import AlbumDetailsModal from './components/AlbumDetailsModal'
import StudioStats from './components/StudioStats'
import AlbumCard from './components/AlbumCard'
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
  const [jwt, setJwt] = useState(() => {
    const token = getCookie('jwt');
    if (!token) return null;
    if (isJwtExpired(token)) {
      return null;
    }
    return token;
  });

  const jwtPayload = useMemo(() => (jwt ? decodeJwt(jwt) : null), [jwt]);

  useEffect(() => {
    const handleAuthChange = (firebaseUser) => {
      if (!jwt) {
        setUser(null);
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
        setJwt(null);
        setUser(null);
        signOut(auth).catch(() => {});
        return;
      }
      setJwt(token);
    };
    window.addEventListener('jwt-updated', handleJwtUpdated);
    return () => window.removeEventListener('jwt-updated', handleJwtUpdated);
  }, []);

  useEffect(() => {
    const token = getCookie('jwt');
    if (!token || isJwtExpired(token)) {
      if (jwt !== null) {
        setJwt(null);
      }
      if (user !== null || auth.currentUser) {
        signOut(auth).catch(() => {});
      }
      setUser(null);
    } else if (token !== jwt) {
      setJwt(token);
    }
  }, [jwt, user]);
  const [artistFilter, setArtistFilter] = useState('');
  const [yearRange, setYearRange] = useState([null, null]);
  const { colorMode, toggleColorMode } = useColorMode();
  const [albums, setAlbums] = useState([])
  const [albumsPerRow, setAlbumsPerRow] = useState(5)
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);
  // Détermination des rôles
  const isContributor = jwtPayload && Array.isArray(jwtPayload.roles) && jwtPayload.roles.includes('contributeur');
  const isUser = jwtPayload && Array.isArray(jwtPayload.roles) && jwtPayload.roles.includes('utilisateur');
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fonction pour rafraîchir la liste des albums (mémorisée avec useCallback)
  const fetchAlbums = useCallback(() => {
    const apiBase = import.meta.env.VITE_API_URL;
    const apiKey = import.meta.env.VITE_API_KEY;
    setLoading(true);
    const currentJwt = getCookie('jwt');
    fetch(`${apiBase}/api/albums`, {
      headers: {
        'X-API-KEY': apiKey,
        ...(currentJwt ? { 'Authorization': `Bearer ${currentJwt}` } : {})
      }
    })
      .then(async res => {
        if (res.status === 403) {
          setError('Accès interdit (403) : vérifie ta clé API ou ton authentification.');
          setAlbums([]);
          setLoading(false);
          return;
        }
        let data;
        try {
          data = await res.json();
        } catch {
          data = [];
        }
        if (!Array.isArray(data)) data = [];
        setAlbums(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setAlbums([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums, jwt]);

  const handleCollectionUpdate = useCallback((albumId, collection) => {
    setAlbums(prev => prev.map(album => (
      album.id === albumId ? { ...album, collection } : album
    )));
  }, []);

  const handleAlbumDelete = useCallback((albumId) => {
    setAlbums(prev => prev.filter(album => album.id !== albumId));
  }, []);

  // Mémorisation de la liste des artistes uniques pour le Select
  const uniqueArtists = useMemo(() => {
    return [...new Set(albums.map(a => a.artist))].sort();
  }, [albums]);

  // Mémorisation des années disponibles pour le RangeSlider
  const availableYears = useMemo(() => {
    const years = [...new Set(albums.map(a => a.year))].filter(Boolean).map(Number).sort((a, b) => a - b);
    return years.length > 0 ? { min: years[0], max: years[years.length - 1], all: years } : null;
  }, [albums]);

  // Mémorisation des albums filtrés
  const filteredAlbums = useMemo(() => {
    return albums.filter(album => {
      const matchesArtist = !artistFilter || album.artist === artistFilter;
      const matchesYear = yearRange[0] === null || yearRange[1] === null || 
        (album.year >= yearRange[0] && album.year <= yearRange[1]);
      return matchesArtist && matchesYear;
    });
  }, [albums, artistFilter, yearRange]);

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
            variant={!showStats && !showProfile ? 'solid' : 'ghost'}
            size="sm"
            colorScheme="purple"
            onClick={() => { setShowStats(false); setShowProfile(false); }}
            fontWeight="bold"
            px={3}
          >
            Disques
          </Button>
          <Button
            variant={showStats && !showProfile ? 'solid' : 'ghost'}
            size="sm"
            colorScheme="purple"
            onClick={() => { setShowStats(true); setShowProfile(false); }}
            fontWeight="bold"
            px={3}
          >
            Statistiques
          </Button>
          {user && jwt ? (
            <IconButton
              variant="ghost"
              size="sm"
              colorScheme="gray"
              aria-label="Mon profil"
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a8.38 8.38 0 0 1 13 0"/></svg>
              }
              onClick={() => setShowProfile(true)}
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
                <AddStudioAlbum onClose={onClose} refreshAlbums={fetchAlbums} />
              </ModalBody>
            </ModalContent>
          </Modal>

          {loading && <Spinner size="xl" mt={8} />}
          {error && <Text color="red.500">Erreur : {error}</Text>}
          {!loading && !error && (
            <Box display="flex" flexDirection={{ base: 'column', md: 'row' }} gap={8}>
              {/* Sidebar des filtres à gauche */}
              <Box w={{ base: '100%', md: '280px' }} mb={{ base: 8, md: 0 }}>
                <Select
                  placeholder="Filtrer par artiste"
                  value={artistFilter}
                  onChange={e => setArtistFilter(e.target.value)}
                  bg={colorMode === 'dark' ? 'brand.800' : 'white'}
                  color={colorMode === 'dark' ? 'white' : 'brand.900'}
                  borderColor={colorMode === 'dark' ? 'brand.700' : 'brand.900'}
                  _hover={{ borderColor: 'accent.500' }}
                  mb={4}
                >
                  {uniqueArtists.map(artist => (
                    <option key={artist} value={artist}>{artist}</option>
                  ))}
                </Select>
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
                        colorScheme="purple"
                      >
                        <RangeSliderTrack>
                          <RangeSliderFilledTrack />
                        </RangeSliderTrack>
                        <RangeSliderThumb index={0} />
                        <RangeSliderThumb index={1} />
                      </RangeSlider>
                      <Button mt={1} size="xs" variant="ghost" colorScheme="gray" onClick={() => setYearRange([availableYears.min, availableYears.max])}>Toutes les années</Button>
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
                <SimpleGrid columns={albumsPerRow} spacing={2} mt={2}>
                  {filteredAlbums.map((album, index) => (
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
                  ))}
                </SimpleGrid>
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
        refreshAlbums={fetchAlbums}
        onCollectionUpdate={handleCollectionUpdate}
        onAlbumDelete={handleAlbumDelete}
      />
              </Box>
            </Box>
          )}
        </Box>
      )}
    </>
  );
}

export default App
