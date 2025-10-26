import { decodeJwt } from './utils/jwt';
import { getCookie } from './utils/cookie';
import { useState, useEffect } from 'react'
import { Heading, Box, Spinner, SimpleGrid, Text, Image, Badge, Stack, IconButton, useColorMode, Select, Button, RangeSlider, RangeSliderTrack, RangeSliderFilledTrack, RangeSliderThumb, Slider, SliderTrack, SliderFilledTrack, SliderThumb, FormControl, FormLabel } from '@chakra-ui/react'
import { ViewIcon, HamburgerIcon, SmallCloseIcon, MinusIcon, AddIcon } from '@chakra-ui/icons'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'
import GoogleAuthButton from './components/GoogleAuthButton'
import ProfilePage from './components/ProfilePage'
import AddStudioAlbum from './components/AddStudioAlbum'
import AlbumDetailsModal from './components/AlbumDetailsModal'
import StudioStats from './components/StudioStats'
import { Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton, useDisclosure, Tooltip } from '@chakra-ui/react';
import { auth } from './firebase'
// Les hooks doivent être dans le composant App
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const { isOpen, onOpen, onClose } = useDisclosure(); // pour la modale d'ajout
  const {
    isOpen: isDetailsOpen,
    onOpen: openDetails,
    onClose: closeDetails
  } = useDisclosure();
  const [user, setUser] = useState(() => auth.currentUser);
  const [showProfile, setShowProfile] = useState(false);
  const [showStats, setShowStats] = useState(false);
    // Décodage du JWT pour les rôles
    const jwt = getCookie('jwt');
    const jwtPayload = decodeJwt(jwt);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);
  // Suppression des options de personnalisation d'affichage
  const coverSizes = [
    { value: 'sm', icon: <SmallCloseIcon boxSize={5} />, label: 'Petite' },
    { value: 'md', icon: <MinusIcon boxSize={6} />, label: 'Moyenne' },
    { value: 'lg', icon: <AddIcon boxSize={7} />, label: 'Grande' },
  ];
  const [artistFilter, setArtistFilter] = useState('');
  const [yearRange, setYearRange] = useState([null, null]);
  const { colorMode, toggleColorMode } = useColorMode();
  const [albums, setAlbums] = useState([])
  const [albumsPerRow, setAlbumsPerRow] = useState(5)
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);
  // Détermination du rôle contributeur
  const isContributor = jwtPayload && Array.isArray(jwtPayload.roles) && jwtPayload.roles.includes('contributeur');
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fonction pour rafraîchir la liste des albums
  const fetchAlbums = () => {
    const apiBase = import.meta.env.VITE_API_URL;
    const apiKey = import.meta.env.VITE_API_KEY;
    setLoading(true);
    fetch(`${apiBase}/api/albums`, {
      headers: {
        'X-API-KEY': apiKey
      }
    })
      .then(res => res.json())
      .then(data => {
        setAlbums(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAlbums();
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
          {user && (
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
          )}
          <GoogleAuthButton />
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
                  {[...new Set(albums.map(a => a.artist))].sort().map(artist => (
                    <option key={artist} value={artist}>{artist}</option>
                  ))}
                </Select>
                {/* Double slider (RangeSlider) pour plage d'années */}
                {(() => {
                  const years = [...new Set(albums.map(a => a.year))].filter(Boolean).map(Number).sort((a, b) => a - b);
                  if (years.length === 0) return null;
                  const minYear = years[0];
                  const maxYear = years[years.length - 1];
                  const [minSelected, maxSelected] = yearRange[0] !== null ? yearRange : [minYear, maxYear];
                  return (
                    <Box mb={4}>
                      <Text fontSize="sm" mb={1} color={colorMode === 'dark' ? 'gray.200' : 'gray.700'}>
                        Plage d'années : {minSelected} - {maxSelected}
                      </Text>
                      <RangeSlider
                        min={minYear}
                        max={maxYear}
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
                      <Button mt={1} size="xs" variant="ghost" colorScheme="gray" onClick={() => setYearRange([minYear, maxYear])}>Toutes les années</Button>
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
                  {albums
                    .filter(album =>
                      (!artistFilter || album.artist === artistFilter) &&
                      (yearRange[0] === null || yearRange[1] === null || (album.year >= yearRange[0] && album.year <= yearRange[1]))
                    )
                    .map((album, index) => (
                      <Box
                        key={album.id ? album.id : `${album.title}-${album.year}-${index}`}
                        position="relative"
                        borderRadius="xl"
                        overflow="hidden"
                        boxShadow="xl"
                        bg={colorMode === 'dark' ? 'brand.800' : 'white'}
                        _hover={{ boxShadow: '2xl', transform: 'scale(1.04)' }}
                        aspectRatio={1}
                        cursor="pointer"
                        transition="background 0.3s"
                        onClick={() => {
                          setSelectedAlbumId(album.id);
                          openDetails();
                        }}
                      >
                        {album.cover_url && (
                          <Image
                            src={album.cover_url}
                            alt={album.title}
                            objectFit="cover"
                            w="100%"
                            h="100%"
                            transition="all 0.3s"
                          />
                        )}
                        <Box
                          position="absolute"
                          top={0}
                          left={0}
                          w="100%"
                          h="100%"
                          bg="rgba(35,37,38,0.92)"
                          color="#f5f6fa"
                          opacity={0}
                          _hover={{ opacity: 1 }}
                          display="flex"
                          flexDirection="column"
                          alignItems="center"
                          justifyContent="center"
                          transition="opacity 0.3s"
                          p={4}
                          textAlign="center"
                        >
                          <Heading as="h2" size="sm" mb={2} color="brand.700" fontWeight="bold" noOfLines={2}>
                            {album.title}
                          </Heading>
                          <Badge bg="accent.500" color="brand.900" fontSize="0.9em" px={2} py={1} borderRadius="md" boxShadow="md" mb={2}>
                            {album.year}
                          </Badge>
                          <Text fontWeight="bold" color="accent.600" fontSize="md" noOfLines={1}>
                            {album.artist}
                          </Text>
                        </Box>
                      </Box>
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
        refreshAlbums={fetchAlbums}
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
