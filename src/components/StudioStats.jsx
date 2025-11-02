import { useEffect, useState, useMemo } from 'react';
import { decodeJwt } from '../utils/jwt';
import { getCookie } from '../utils/cookie';
import {
  Box,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorMode,
  Spinner,
  Text,
  Flex,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stack,
  SimpleGrid,
  Progress,
} from '@chakra-ui/react';
import CollectionStats from './CollectionStats';
import AlbumsPerYearChart from './AlbumsPerYearChart';

export default function StudioStats() {
  const jwt = getCookie('jwt');
  const jwtPayload = decodeJwt(jwt);
  const isUser = jwtPayload && Array.isArray(jwtPayload.roles) && jwtPayload.roles.includes('utilisateur');
  const [albums, setAlbums] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { colorMode } = useColorMode();
  const containerBg = colorMode === 'dark' ? 'rgba(35, 37, 38, 0.92)' : 'white';
  const cardBg = colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.50';
  const highlightGradient = colorMode === 'dark'
    ? 'linear(to-r, purple.500, cyan.400)'
    : 'linear(to-r, purple.400, pink.300)';

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL;
    const apiKey = import.meta.env.VITE_API_KEY;
    fetch(`${apiBase}/api/albums`, {
      headers: {
        'X-API-KEY': apiKey
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Erreur API');
        return res.json();
      })
      .then(data => {
        const albumsArray = Array.isArray(data) ? data : [];
        setAlbums(albumsArray);
        const artistSet = new Set();
        const yearCount = {};
        const artistCount = {};
        const decadeCount = {};
        let minYear = Infinity;
        let maxYear = -Infinity;

        albumsArray.forEach(album => {
          const artist = album.artist || album.artiste;
          if (artist) {
            artistCount[artist] = (artistCount[artist] || 0) + 1;
            artistSet.add(artist);
          }
          const parsedYear = Number.parseInt(album.year, 10);
          if (!Number.isFinite(parsedYear)) return;
          yearCount[parsedYear] = (yearCount[parsedYear] || 0) + 1;
          minYear = Math.min(minYear, parsedYear);
          maxYear = Math.max(maxYear, parsedYear);
          const decade = `${Math.floor(parsedYear / 10) * 10}s`;
          decadeCount[decade] = (decadeCount[decade] || 0) + 1;
        });

        const [topYearEntryYear, topYearEntryCount] = Object.entries(yearCount)
          .sort((a, b) => b[1] - a[1])
          .at(0) || [null, 0];

        const [topArtistEntryArtist, topArtistEntryCount] = Object.entries(artistCount)
          .sort((a, b) => b[1] - a[1])
          .at(0) || [null, 0];

        const decadeBreakdown = Object.entries(decadeCount)
          .map(([decade, countValue]) => ({ decade, count: countValue }))
          .sort((a, b) => b.count - a.count);

        setStats({
          totalAlbums: albumsArray.length,
          uniqueArtists: artistSet.size,
          topYear: topYearEntryYear,
          topYearCount: topYearEntryCount,
          topArtist: topArtistEntryArtist,
          topArtistCount: topArtistEntryCount,
          yearRange: {
            min: Number.isFinite(minYear) ? minYear : null,
            max: Number.isFinite(maxYear) ? maxYear : null,
          },
          decadeBreakdown,
        });
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const decadeDistribution = useMemo(() => {
    if (!stats?.decadeBreakdown?.length) return [];
    const total = stats.decadeBreakdown.reduce((sum, entry) => sum + entry.count, 0) || 1;
    return stats.decadeBreakdown
      .slice(0, 5)
      .map((entry, index) => ({
        ...entry,
        percent: Math.round((entry.count / total) * 100),
        colorScheme: index === 0 ? 'purple' : index === 1 ? 'pink' : 'gray',
      }));
  }, [stats]);

  const yearSpan = useMemo(() => {
    const minYear = stats?.yearRange?.min;
    const maxYear = stats?.yearRange?.max;
    if (!minYear || !maxYear) return null;
    return maxYear - minYear + 1;
  }, [stats]);

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
      textAlign="left"
      borderWidth={colorMode === 'dark' ? 1 : 0}
      borderColor={colorMode === 'dark' ? 'whiteAlpha.200' : 'gray.100'}
    >
      <Tabs variant="enclosed" colorScheme="purple" isFitted>
        <TabList mb={4}>
          <Tab>Statistiques générales</Tab>
          {isUser && <Tab>Ma collection</Tab>}
        </TabList>
        <TabPanels>
          <TabPanel px={{ base: 0, md: 1 }}>
            <Stack spacing={6}>
              <Box>
                <Heading as="h2" size="lg" color={colorMode === 'dark' ? 'purple.200' : 'purple.700'}>
                  Statistiques générales
                </Heading>
                <Text mt={2} color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>
                  Vue d'ensemble du catalogue : densité, artistes et période couverte par les albums disponibles.
                </Text>
              </Box>

              {loading ? (
                <Flex justify="center" py={10}>
                  <Spinner size="lg" />
                </Flex>
              ) : error ? (
                <Text color="red.400">{error}</Text>
              ) : stats ? (
                <Stack spacing={8}>
                  <Box
                    bgGradient={highlightGradient}
                    color="white"
                    borderRadius="2xl"
                    p={{ base: 6, md: 8 }}
                    boxShadow="lg"
                  >
                    <Text fontSize="sm" textTransform="uppercase" letterSpacing="widest" opacity={0.8} mb={3}>
                      Panorama global
                    </Text>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} alignItems="flex-start">
                      <Stat>
                        <StatLabel fontSize="lg" color="whiteAlpha.900">
                          Nombre total d'albums
                        </StatLabel>
                        <StatNumber fontSize={{ base: '4xl', md: '5xl' }} fontWeight="extrabold">
                          {stats.totalAlbums}
                        </StatNumber>
                        <StatHelpText color="whiteAlpha.900">
                          {stats.uniqueArtists} artiste{stats.uniqueArtists > 1 ? 's' : ''} recensé{stats.uniqueArtists > 1 ? 's' : ''}
                        </StatHelpText>
                      </Stat>
                      <Box>
                        <Text fontWeight="semibold" mb={1}>
                          Période couverte
                        </Text>
                        <Heading size="lg" mb={2}>
                          {stats.yearRange?.min ?? '—'} – {stats.yearRange?.max ?? '—'}
                        </Heading>
                        {yearSpan && (
                          <Text color="whiteAlpha.900" mb={2}>
                            {yearSpan} année{yearSpan > 1 ? 's' : ''} d'archives musicales
                          </Text>
                        )}
                        {stats.decadeBreakdown?.length ? (
                          <Text color="whiteAlpha.900">
                            Décennie phare : <strong>{stats.decadeBreakdown[0].decade}</strong> ({stats.decadeBreakdown[0].count} album{stats.decadeBreakdown[0].count > 1 ? 's' : ''})
                          </Text>
                        ) : (
                          <Text color="whiteAlpha.900">
                            Ajoute plus d'albums pour enrichir la chronologie.
                          </Text>
                        )}
                      </Box>
                    </SimpleGrid>
                  </Box>

                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
                    <Stat p={6} borderRadius="xl" boxShadow="md" bg={cardBg} backdropFilter="blur(8px)">
                      <StatLabel fontSize="lg">Année la plus représentée</StatLabel>
                      <StatNumber fontSize="3xl" color={colorMode === 'dark' ? 'teal.200' : 'teal.600'}>
                        {stats.topYear ?? 'N/A'}
                      </StatNumber>
                      {stats.topYearCount ? (
                        <StatHelpText color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>
                          {stats.topYearCount} album{stats.topYearCount > 1 ? 's' : ''} publié{stats.topYearCount > 1 ? 's' : ''}
                        </StatHelpText>
                      ) : null}
                    </Stat>

                    <Stat p={6} borderRadius="xl" boxShadow="md" bg={cardBg} backdropFilter="blur(8px)">
                      <StatLabel fontSize="lg">Artiste le plus représenté</StatLabel>
                      <StatNumber fontSize="2xl" color={colorMode === 'dark' ? 'cyan.200' : 'purple.700'}>
                        {stats.topArtist ?? 'N/A'}
                      </StatNumber>
                      {stats.topArtistCount ? (
                        <StatHelpText color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>
                          {stats.topArtistCount} album{stats.topArtistCount > 1 ? 's' : ''}
                        </StatHelpText>
                      ) : null}
                    </Stat>

                    <Stat p={6} borderRadius="xl" boxShadow="md" bg={cardBg} backdropFilter="blur(8px)">
                      <StatLabel fontSize="lg">Richesse temporelle</StatLabel>
                      <StatNumber fontSize="2xl" color={colorMode === 'dark' ? 'pink.200' : 'pink.500'}>
                        {stats.decadeBreakdown?.length ? `${stats.decadeBreakdown.length} décennie${stats.decadeBreakdown.length > 1 ? 's' : ''}` : 'N/A'}
                      </StatNumber>
                      {stats.decadeBreakdown?.length ? (
                        <StatHelpText color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>
                          Top : {stats.decadeBreakdown[0].decade}
                        </StatHelpText>
                      ) : (
                        <StatHelpText color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>
                          Ajoute des albums pour varier les périodes
                        </StatHelpText>
                      )}
                    </Stat>
                  </SimpleGrid>

                  {decadeDistribution.length > 0 && (
                    <Box p={{ base: 6, md: 6 }} borderRadius="xl" boxShadow="md" bg={cardBg} backdropFilter="blur(8px)">
                      <Heading as="h3" size="md" mb={1} color={colorMode === 'dark' ? 'purple.200' : 'purple.700'}>
                        Répartition par décennie
                      </Heading>
                      <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} mb={4}>
                        Les périodes qui dominent actuellement le catalogue.
                      </Text>
                      <Stack spacing={3}>
                        {decadeDistribution.map(({ decade, count, percent, colorScheme }) => (
                          <Box key={decade}>
                            <Flex justify="space-between" mb={1} fontSize="sm">
                              <Text>{decade}</Text>
                              <Text fontWeight="semibold">{count} ({percent}%)</Text>
                            </Flex>
                            <Progress value={percent} colorScheme={colorScheme} size="sm" borderRadius="full" />
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  <Box p={{ base: 0, md: 0 }}>
                    <AlbumsPerYearChart albums={albums} />
                  </Box>
                </Stack>
              ) : (
                <Text color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>
                  Aucune donnée statistique disponible pour le moment.
                </Text>
              )}
            </Stack>
          </TabPanel>
          {isUser && (
            <TabPanel>
              <CollectionStats />
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
    </Box>
  );
}
