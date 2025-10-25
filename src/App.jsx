import { useState, useEffect } from 'react'
import { Heading, Box, Spinner, SimpleGrid, Text, Image, Badge, Stack, IconButton, useColorMode, Select, Button, RangeSlider, RangeSliderTrack, RangeSliderFilledTrack, RangeSliderThumb } from '@chakra-ui/react'
import { ViewIcon, HamburgerIcon, SmallCloseIcon, MinusIcon, AddIcon } from '@chakra-ui/icons'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'
import GoogleAuthButton from './components/GoogleAuthButton'
import ProfilePage from './components/ProfilePage'
import { auth } from './firebase'
// Les hooks doivent être dans le composant App
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [user, setUser] = useState(() => auth.currentUser);
  const [showProfile, setShowProfile] = useState(false);
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const apiKey = import.meta.env.VITE_API_KEY;
    fetch(apiUrl, {
      headers: {
        'X-API-KEY': apiKey
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Erreur API')
        return res.json()
      })
      .then((data) => {
        setAlbums(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <>
      {/* ...rien, logos supprimés... */}
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
      ) : (
        <Box
          px={4}
          minH="100vh"
          pb={12}
          bg={colorMode === 'dark' ? 'brand.900' : '#f7f7fa'}
          transition="background 0.3s"
        >
          {loading && <Spinner size="xl" mt={8} />}
          {error && <Text color="red.500">Erreur : {error}</Text>}
          {!loading && !error && (
            <Box>
              <Box maxW="1000px" mx="auto" mb={6} display="flex" flexWrap="wrap" flexDirection={{ base: 'column', md: 'row' }} gap={4} alignItems="center" justifyContent="center">
                <Select
                  placeholder="Filtrer par artiste"
                  value={artistFilter}
                  onChange={e => setArtistFilter(e.target.value)}
                  bg={colorMode === 'dark' ? 'brand.800' : 'white'}
                  color={colorMode === 'dark' ? 'white' : 'brand.900'}
                  borderColor={colorMode === 'dark' ? 'brand.700' : 'brand.900'}
                  _hover={{ borderColor: 'accent.500' }}
                  mb={{ base: 2, sm: 0 }}
                  maxW={"220px"}
                >
                  {[...new Set(albums.map(a => a.artist))].sort().map(artist => (
                    <option key={artist} value={artist}>{artist}</option>
                  ))}
                </Select>
                {/* Double slider (RangeSlider) pour plage d'années */}
                <Box maxW="320px" w="100%" px={2}>
                  {(() => {
                    const years = [...new Set(albums.map(a => a.year))].filter(Boolean).map(Number).sort((a, b) => a - b);
                    if (years.length === 0) return null;
                    const minYear = years[0];
                    const maxYear = years[years.length - 1];
                    const [minSelected, maxSelected] = yearRange[0] !== null ? yearRange : [minYear, maxYear];
                    return (
                      <Box>
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
                </Box>
              </Box>
              <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing={6} mt={2}>
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
                        <Badge
                          bg="accent.500"
                          color="brand.900"
                          fontSize="0.9em"
                          px={2}
                          py={1}
                          borderRadius="md"
                          boxShadow="md"
                          mb={2}
                        >
                          {album.year}
                        </Badge>
                        <Text fontWeight="bold" color="accent.600" fontSize="md" noOfLines={1}>
                          {album.artist}
                        </Text>
                      </Box>
                    </Box>
                  ))}
              </SimpleGrid>
            </Box>
          )}
        </Box>
      )}
      {/* ...counter et instructions supprimés... */}
    </>
  )
}

export default App
