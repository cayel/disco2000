import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Input,
  InputGroup,
  InputRightElement,
  CloseButton,
  Button,
  Flex,
  Stack,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Spinner,
  Badge,
  List,
  ListItem,
  useColorMode,
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';

const formatLabel = (hasCd, hasVinyl) => {
  if (hasCd && hasVinyl) return 'CD & Vinyle';
  if (hasCd) return 'CD';
  if (hasVinyl) return 'Vinyle';
  return '—';
};

const normalizeName = (value) => (typeof value === 'string' ? value : 'Inconnu');

const sortAlbums = (a, b) => {
  const yearA = Number.parseInt(a.year, 10) || 0;
  const yearB = Number.parseInt(b.year, 10) || 0;
  if (yearA !== yearB) return yearA - yearB;
  return a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' });
};

export default function CollectionExplorer({ albums, loading, error, onRefresh, isUser }) {
  const { colorMode } = useColorMode();
  const [search, setSearch] = useState('');
  const [selectedArtist, setSelectedArtist] = useState('');

  const artists = useMemo(() => {
    if (!Array.isArray(albums) || !albums.length) return [];
    const map = new Map();

    albums.forEach((album) => {
      const artistName = normalizeName(album.artist || album.artiste);
      if (!map.has(artistName)) {
        map.set(artistName, {
          name: artistName,
          total: 0,
          owned: [],
          missing: [],
          cdCount: 0,
          vinylCount: 0,
        });
      }
      const entry = map.get(artistName);
      entry.total += 1;
      const hasCd = Boolean(album?.collection?.cd);
      const hasVinyl = Boolean(album?.collection?.vinyl);
      const albumInfo = {
        id: album.id,
        title: album.title || 'Sans titre',
        year: album.year,
        hasCd,
        hasVinyl,
      };
      if (hasCd) entry.cdCount += 1;
      if (hasVinyl) entry.vinylCount += 1;
      if (hasCd || hasVinyl) {
        entry.owned.push(albumInfo);
      } else {
        entry.missing.push(albumInfo);
      }
    });

    return Array.from(map.values()).map((entry) => {
      const ownedCount = entry.owned.length;
      const percentOwned = entry.total ? Math.round((ownedCount / entry.total) * 100) : 0;
      const dominantFormat = entry.cdCount === entry.vinylCount
        ? 'Équilibré'
        : entry.cdCount > entry.vinylCount
        ? 'CD'
        : 'Vinyle';
      const owned = [...entry.owned].sort(sortAlbums);
      const missing = [...entry.missing].sort(sortAlbums);
      return {
        ...entry,
        owned,
        missing,
        ownedCount,
        percentOwned,
        dominantFormat,
      };
    }).filter((entry) => entry.ownedCount > 0)
      .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
  }, [albums]);

  useEffect(() => {
    if (!selectedArtist && artists.length) {
      setSelectedArtist(artists[0].name);
    }
  }, [artists, selectedArtist]);

  const filteredArtists = useMemo(() => {
    if (!search.trim()) return artists;
    const lowered = search.toLowerCase();
    return artists.filter((artist) => artist.name.toLowerCase().includes(lowered));
  }, [artists, search]);

  useEffect(() => {
    if (!filteredArtists.length) return;
    const stillVisible = filteredArtists.some((artist) => artist.name === selectedArtist);
    if (!stillVisible) {
      setSelectedArtist(filteredArtists[0].name);
    }
  }, [filteredArtists, selectedArtist]);

  const activeArtist = useMemo(() => {
    if (!selectedArtist) return null;
    return artists.find((artist) => artist.name === selectedArtist) || null;
  }, [artists, selectedArtist]);

  const containerBg = colorMode === 'dark' ? 'rgba(35, 37, 38, 0.92)' : 'white';
  const cardBg = colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.50';

  if (!isUser) {
    return (
      <Box
        w="100%"
        maxW="1100px"
        mx="auto"
        mt={10}
        p={{ base: 4, md: 6 }}
        borderRadius="2xl"
        boxShadow="xl"
        bg={containerBg}
        textAlign="center"
      >
        <Heading size="md" color={colorMode === 'dark' ? 'purple.200' : 'purple.700'}>
          Fonctionnalité réservée aux utilisateurs connectés
        </Heading>
        <Text mt={3} color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>
          Connecte-toi pour explorer ta collection artiste par artiste.
        </Text>
      </Box>
    );
  }

  return (
    <Box
      minH="100vh"
      pb={{ base: 24, md: 12 }}
      bg={colorMode === 'dark' ? 'brand.900' : '#f7f7fa'}
    >
      <Box
        w="100%"
        maxW="1200px"
        mx="auto"
        pt={6}
        pb={6}
        px={{ base: 4, md: 6 }}
        borderRadius="2xl"
        boxShadow="xl"
        bg={containerBg}
        textAlign="left"
        borderWidth={colorMode === 'dark' ? 1 : 0}
        borderColor={colorMode === 'dark' ? 'whiteAlpha.200' : 'gray.100'}
      >
      <Stack spacing={6}>
        <Flex align={{ base: 'flex-start', md: 'center' }} justify="space-between" gap={4} wrap="wrap">
          <Box>
            <Heading as="h2" size="lg" color={colorMode === 'dark' ? 'purple.200' : 'purple.700'}>
              Ma collection par artiste
            </Heading>
            <Text mt={1} color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>
              Choisis un artiste pour comparer les disques que tu possèdes avec ceux qui manquent.
            </Text>
          </Box>
          <Button
            leftIcon={<RepeatIcon />}
            onClick={() => onRefresh?.()}
            size="sm"
            variant="outline"
            colorScheme="purple"
            isDisabled={loading}
          >
            Rafraîchir
          </Button>
        </Flex>

        {loading ? (
          <Flex justify="center" py={10}>
            <Spinner size="lg" />
          </Flex>
        ) : error ? (
          <Text color="red.400">{error}</Text>
        ) : artists.length === 0 ? (
          <Text color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>
            Aucun album trouvé. Ajoute des disques pour commencer à analyser ta collection.
          </Text>
        ) : (
          <Flex direction={{ base: 'column', lg: 'row' }} gap={8} align="flex-start">
            <Box w={{ base: '100%', lg: '320px' }}>
              <InputGroup size="sm">
                <Input
                  placeholder="Rechercher un artiste"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  bg={colorMode === 'dark' ? 'brand.800' : 'white'}
                  color={colorMode === 'dark' ? 'white' : 'brand.900'}
                  borderColor={colorMode === 'dark' ? 'brand.700' : 'brand.900'}
                  _hover={{ borderColor: 'accent.500' }}
                  pr={search ? '2.5rem' : undefined}
                />
                {search && (
                  <InputRightElement height="100%" pr={1}>
                    <CloseButton size="sm" onClick={() => setSearch('')} aria-label="Effacer la recherche" />
                  </InputRightElement>
                )}
              </InputGroup>
              <Text mt={2} fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                {filteredArtists.length} artiste{filteredArtists.length > 1 ? 's' : ''}
              </Text>
              <Box
                mt={2}
                borderWidth={1}
                borderColor={colorMode === 'dark' ? 'brand.700' : 'gray.200'}
                borderRadius="md"
                maxH="320px"
                overflowY="auto"
                bg={colorMode === 'dark' ? 'brand.800' : 'white'}
                boxShadow="sm"
              >
                {filteredArtists.map((artist) => {
                  const isActive = artist.name === selectedArtist;
                  return (
                    <Button
                      key={artist.name}
                      justifyContent="flex-start"
                      variant={isActive ? 'solid' : 'ghost'}
                      colorScheme={isActive ? 'purple' : undefined}
                      onClick={() => setSelectedArtist(artist.name)}
                      w="100%"
                      borderRadius={0}
                      size="sm"
                      fontWeight={isActive ? 'bold' : 'normal'}
                      bg={isActive ? (colorMode === 'dark' ? 'purple.500' : 'purple.100') : 'transparent'}
                      color={isActive ? (colorMode === 'dark' ? 'white' : 'purple.700') : (colorMode === 'dark' ? 'gray.100' : 'brand.900')}
                      _hover={{ bg: isActive ? (colorMode === 'dark' ? 'purple.600' : 'purple.200') : (colorMode === 'dark' ? 'brand.700' : 'gray.100') }}
                      textAlign="left"
                    >
                      {artist.name}
                    </Button>
                  );
                })}
              </Box>
            </Box>

            <Box flex="1" w="100%">
              {activeArtist ? (
                <Stack spacing={6}>
                  <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={6}>
                    <Stat p={6} borderRadius="xl" boxShadow="md" bg={cardBg} backdropFilter="blur(8px)">
                      <StatLabel fontSize="lg">Albums recensés</StatLabel>
                      <StatNumber fontSize="3xl">
                        {activeArtist.total}
                      </StatNumber>
                      <StatHelpText>Total général pour cet artiste</StatHelpText>
                    </Stat>

                    <Stat p={6} borderRadius="xl" boxShadow="md" bg={cardBg} backdropFilter="blur(8px)">
                      <StatLabel fontSize="lg">Albums dans ta collection</StatLabel>
                      <StatNumber fontSize="3xl">
                        {activeArtist.ownedCount}
                      </StatNumber>
                      <StatHelpText>
                        {activeArtist.percentOwned}% de la discographie disponible
                      </StatHelpText>
                      <Progress value={activeArtist.percentOwned} colorScheme="purple" size="sm" borderRadius="full" mt={4} />
                    </Stat>

                    <Stat p={6} borderRadius="xl" boxShadow="md" bg={cardBg} backdropFilter="blur(8px)">
                      <StatLabel fontSize="lg">Format dominant</StatLabel>
                      <StatNumber fontSize="2xl">
                        {activeArtist.ownedCount ? activeArtist.dominantFormat : 'Aucun disque'}
                      </StatNumber>
                      <StatHelpText>
                        {activeArtist.ownedCount ? `${activeArtist.cdCount} CD • ${activeArtist.vinylCount} vinyles` : 'Ajoute un album pour commencer'}
                      </StatHelpText>
                    </Stat>
                  </SimpleGrid>

                  <Flex direction={{ base: 'column', md: 'row' }} gap={6} align="stretch">
                    <Box flex="1" p={6} borderRadius="xl" boxShadow="md" bg={cardBg} backdropFilter="blur(8px)">
                      <Heading as="h3" size="md" mb={3} color={colorMode === 'dark' ? 'purple.200' : 'purple.700'}>
                        Disques dans ta collection
                      </Heading>
                      {activeArtist.owned.length === 0 ? (
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>
                          Tu n'as encore aucun disque de cet artiste.
                        </Text>
                      ) : (
                        <List spacing={2}>
                          {activeArtist.owned.map((album) => (
                            <ListItem key={album.id || `${album.title}-${album.year}`}>
                              <Flex align="center" justify="space-between" gap={3}>
                                <Text noOfLines={2}>
                                  {album.year ? `${album.year} · ` : ''}{album.title}
                                </Text>
                                <Badge colorScheme="purple">{formatLabel(album.hasCd, album.hasVinyl)}</Badge>
                              </Flex>
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Box>

                    <Box flex="1" p={6} borderRadius="xl" boxShadow="md" bg={cardBg} backdropFilter="blur(8px)">
                      <Heading as="h3" size="md" mb={3} color={colorMode === 'dark' ? 'pink.200' : 'pink.600'}>
                        Disques manquants
                      </Heading>
                      {activeArtist.missing.length === 0 ? (
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>
                          Tu possèdes tous les disques recensés pour cet artiste. Bravo !
                        </Text>
                      ) : (
                        <List spacing={2}>
                          {activeArtist.missing.map((album) => (
                            <ListItem key={album.id || `${album.title}-${album.year}`}>
                              <Text noOfLines={2}>
                                {album.year ? `${album.year} · ` : ''}{album.title}
                              </Text>
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Box>
                  </Flex>
                </Stack>
              ) : (
                <Text color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>
                  Sélectionne un artiste pour afficher les détails de ta collection.
                </Text>
              )}
            </Box>
          </Flex>
        )}
      </Stack>
      </Box>
    </Box>
  );
}
