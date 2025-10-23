import { useState, useEffect } from 'react'
import { Heading, Box, Spinner, SimpleGrid, Text, Image, Badge, Stack, IconButton, useColorMode, Select, Button } from '@chakra-ui/react'
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
  const [yearFilter, setYearFilter] = useState('');
  const { colorMode, toggleColorMode } = useColorMode();
  const [albums, setAlbums] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    fetch(apiUrl)
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
            <Button variant="ghost" colorScheme="purple" onClick={() => setShowProfile(true)}>
              Mon profil
            </Button>
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
                <Select
                  placeholder="Filtrer par année"
                  value={yearFilter}
                  onChange={e => setYearFilter(e.target.value)}
                  bg={colorMode === 'dark' ? 'brand.800' : 'white'}
                  color={colorMode === 'dark' ? 'white' : 'brand.900'}
                  borderColor={colorMode === 'dark' ? 'brand.700' : 'brand.900'}
                  _hover={{ borderColor: 'accent.500' }}
                  maxW={"160px"}
                >
                  {[...new Set(albums.map(a => a.year))].sort().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </Select>
              </Box>
              <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing={6} mt={2}>
                {albums
                  .filter(album => (!artistFilter || album.artist === artistFilter) && (!yearFilter || String(album.year) === yearFilter))
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
