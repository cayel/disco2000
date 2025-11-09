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
import authFetch from '../utils/authFetch';

export default function StudioStats() {
  const jwt = getCookie('jwt');
  const jwtPayload = decodeJwt(jwt);
  const isUser = jwtPayload && Array.isArray(jwtPayload.roles) && jwtPayload.roles.includes('utilisateur');
  // Suppression de l'ancien chargement complet des albums : on ne conserve que les stats agrégées.
  const [publicStats, setPublicStats] = useState(null);
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
    const url = `${apiBase}/api/albums/stats`;
    authFetch(url, { method: 'GET' }, { label: 'public-stats' })
      .then(res => {
        if (!res.ok) throw new Error(`Erreur API (${res.status})`);
        return res.json();
      })
      .then(data => {
        setPublicStats(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Erreur de récupération des statistiques publiques');
        setLoading(false);
      });
  }, []);

  const yearDistribution = useMemo(() => {
    if (!publicStats?.albums_per_year?.length) return [];
    const sorted = [...publicStats.albums_per_year].sort((a, b) => a.year - b.year);
    return sorted;
  }, [publicStats]);

  const minYear = useMemo(() => {
    if (!yearDistribution.length) return null;
    return yearDistribution[0].year;
  }, [yearDistribution]);
  const maxYear = useMemo(() => {
    if (!yearDistribution.length) return null;
    return yearDistribution[yearDistribution.length - 1].year;
  }, [yearDistribution]);
  const yearSpan = useMemo(() => {
    if (!minYear || !maxYear) return null;
    return maxYear - minYear + 1;
  }, [minYear, maxYear]);

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
        px={{ base: 4, md: 6 }}
        pb={6}
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
              ) : publicStats ? (
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
                          {publicStats.total_albums ?? '—'}
                        </StatNumber>
                        <StatHelpText color="whiteAlpha.900">
                          {publicStats.total_artists ?? 0} artiste{publicStats.total_artists > 1 ? 's' : ''} recensé{publicStats.total_artists > 1 ? 's' : ''}
                        </StatHelpText>
                      </Stat>
                      <Box>
                        <Text fontWeight="semibold" mb={1}>
                          Période couverte
                        </Text>
                        <Heading size="lg" mb={2}>
                          {minYear ?? '—'} – {maxYear ?? '—'}
                        </Heading>
                        {yearSpan && (
                          <Text color="whiteAlpha.900" mb={2}>
                            {yearSpan} année{yearSpan > 1 ? 's' : ''} d'archives musicales
                          </Text>
                        )}
                        <Text color="whiteAlpha.900">
                          Meilleure année : <strong>{publicStats.top_year ?? '—'}</strong> ({publicStats.top_year_count ?? 0} album{(publicStats.top_year_count ?? 0) > 1 ? 's' : ''})
                        </Text>
                      </Box>
                    </SimpleGrid>
                  </Box>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
                    <Stat p={6} borderRadius="xl" boxShadow="md" bg={cardBg} backdropFilter="blur(8px)">
                      <StatLabel fontSize="lg">Année la plus représentée</StatLabel>
                      <StatNumber fontSize="3xl" color={colorMode === 'dark' ? 'teal.200' : 'teal.600'}>
                        {publicStats.top_year ?? 'N/A'}
                      </StatNumber>
                      {publicStats.top_year_count ? (
                        <StatHelpText color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>
                          {publicStats.top_year_count} album{publicStats.top_year_count > 1 ? 's' : ''} publié{publicStats.top_year_count > 1 ? 's' : ''}
                        </StatHelpText>
                      ) : null}
                    </Stat>

                    <Stat p={6} borderRadius="xl" boxShadow="md" bg={cardBg} backdropFilter="blur(8px)">
                      <StatLabel fontSize="lg">Artiste le plus représenté</StatLabel>
                      <StatNumber fontSize="2xl" color={colorMode === 'dark' ? 'cyan.200' : 'purple.700'}>
                        {publicStats.top_artist ?? 'N/A'}
                      </StatNumber>
                      {publicStats.top_artist_count ? (
                        <StatHelpText color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>
                          {publicStats.top_artist_count} album{publicStats.top_artist_count > 1 ? 's' : ''}
                        </StatHelpText>
                      ) : null}
                    </Stat>

                    <Stat p={6} borderRadius="xl" boxShadow="md" bg={cardBg} backdropFilter="blur(8px)">
                      <StatLabel fontSize="lg">Totaux</StatLabel>
                      <StatNumber fontSize="2xl" color={colorMode === 'dark' ? 'pink.200' : 'pink.500'}>
                        {publicStats.total_albums ?? 0} / {publicStats.total_artists ?? 0}
                      </StatNumber>
                      <StatHelpText color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>
                        Albums / Artistes distincts
                      </StatHelpText>
                    </Stat>
                  </SimpleGrid>
                  <Box p={{ base: 0, md: 0 }}>
                    <AlbumsPerYearChart yearData={publicStats.albums_per_year || []} />
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
    </Box>
  );
}
