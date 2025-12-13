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
import CountryDistribution from './CountryDistribution';
import authFetch from '../utils/authFetch';
import GenresDistribution from './GenresDistribution';
// import YearHeatmap from './YearHeatmap';
import CompactCountryDistribution from './CompactCountryDistribution';

export default function StudioStats() {
  const jwt = getCookie('jwt');
  const jwtPayload = decodeJwt(jwt);
  const isUser = jwtPayload && Array.isArray(jwtPayload.roles) && jwtPayload.roles.includes('utilisateur');
  const [publicStats, setPublicStats] = useState(null);
  const [allAlbums, setAllAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  const [genresStats, setGenresStats] = useState({ genres: [], styles: [] });
  const [error, setError] = useState(null);
  const { colorMode } = useColorMode();
  const containerBg = colorMode === 'dark' ? 'rgba(24, 28, 36, 0.92)' : 'white';
  const cardBg = colorMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'gray.50';

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
        // Essayer d'extraire des stats de genres/styles si déjà présentes
        const genres = data.genres || data.genres_stats || [];
        const styles = data.styles || data.styles_stats || [];
        setGenresStats({ genres, styles });
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Erreur de récupération des statistiques publiques');
        setLoading(false);
      });
  }, []);

  // Récupérer tous les artistes pour la répartition par pays
  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL;
    const fetchAllArtists = async () => {
      try {
        setLoadingAlbums(true);
        const allArtistsData = [];
        let page = 1;
        let hasMore = true;

        // Pagination pour récupérer tous les artistes
        while (hasMore) {
          const params = new URLSearchParams({ page, page_size: 100 });
          const res = await authFetch(`${apiBase}/api/artists?${params.toString()}`, { method: 'GET' }, { label: 'fetch-all-artists-stats' });
          if (!res.ok) throw new Error(`Erreur API (${res.status})`);
          const data = await res.json();
          
          console.log('Structure de la réponse API:', data);
          console.log('Clés disponibles:', Object.keys(data));
          
          // La réponse peut avoir différentes structures
          const artistsList = data.artists || data.items || data.data || data;
          
          if (Array.isArray(artistsList) && artistsList.length > 0) {
            allArtistsData.push(...artistsList);
            page++;
            // Continuer si on a reçu une page complète
            hasMore = artistsList.length === 100;
          } else {
            hasMore = false;
          }
        }
        
        console.log('CountryDistribution: Artistes récupérés:', allArtistsData.length);
        setAllAlbums(allArtistsData);
      } catch (err) {
        console.error('Erreur lors de la récupération des artistes:', err);
      } finally {
        setLoadingAlbums(false);
      }
    };
    fetchAllArtists();
  }, []);

  // Récupération dédiée des stats genres/styles si non fournies par /albums/stats
  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL;
    const fetchGenres = async () => {
      try {
        const res = await authFetch(`${apiBase}/api/statistics/genres-styles`, { method: 'GET' }, { label: 'genres-stats' });
        if (!res.ok) return; // rester discret si non disponible
        const data = await res.json().catch(() => ({}));
        const genres = Array.isArray(data.genres) ? data.genres : [];
        const styles = Array.isArray(data.styles) ? data.styles : [];
        setGenresStats(prev => ({
          genres: Array.isArray(genres) && genres.length ? genres : prev.genres,
          styles: Array.isArray(styles) && styles.length ? styles : prev.styles,
        }));
      } catch {/* noop */}
    };
    const fetchGenresFromAlbums = async () => {
      // Fallback: agréger genres/styles en parcourant les albums si l'endpoint dédié n'existe pas
      try {
        const pageSize = 100;
        let page = 1;
        let totalPages = 1;
        const genresMap = new Map();
        const stylesMap = new Map();
        do {
          const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
          const res = await authFetch(`${apiBase}/api/albums?${params.toString()}`, { method: 'GET' }, { label: `albums-page-${page}` });
          if (!res.ok) break;
          const data = await res.json().catch(() => ({}));
          const pageAlbums = Array.isArray(data.albums) ? data.albums : [];
          const serverTotal = Number.isFinite(data.total) ? data.total : pageAlbums.length;
          const serverPageSize = Number.isFinite(data.page_size) ? data.page_size : pageSize;
          totalPages = Math.max(1, Math.ceil(serverTotal / serverPageSize));
          // Agrégation
          for (const alb of pageAlbums) {
            const genres = Array.isArray(alb.genres) ? alb.genres : (alb.genre ? [alb.genre] : []);
            const styles = Array.isArray(alb.styles) ? alb.styles : (alb.style ? [alb.style] : []);
            for (const g of genres) {
              const key = String(g || '').trim();
              if (!key) continue;
              genresMap.set(key, (genresMap.get(key) || 0) + 1);
            }
            for (const s of styles) {
              const key = String(s || '').trim();
              if (!key) continue;
              stylesMap.set(key, (stylesMap.get(key) || 0) + 1);
            }
          }
          page += 1;
        } while (page <= totalPages);

        const aggregatedGenres = Array.from(genresMap.entries()).map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count).slice(0, 10);
        const aggregatedStyles = Array.from(stylesMap.entries()).map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count).slice(0, 10);
        if (aggregatedGenres.length || aggregatedStyles.length) {
          setGenresStats({ genres: aggregatedGenres, styles: aggregatedStyles });
        }
      } catch {/* noop */}
    };
    // Ne requêter que si on n'a rien
    if ((!genresStats.genres || genresStats.genres.length === 0) || (!genresStats.styles || genresStats.styles.length === 0)) {
      fetchGenres();
      // Et fallback si toujours vide après un court délai
      setTimeout(() => {
        const stillEmpty = (!genresStats.genres || genresStats.genres.length === 0) || (!genresStats.styles || genresStats.styles.length === 0);
        if (stillEmpty) {
          fetchGenresFromAlbums();
        }
      }, 300);
    }
  }, [genresStats.genres, genresStats.styles]);
 

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
  bg={colorMode === 'dark' ? 'slate.900' : '#f7f7fa'}
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
  <Tabs isFitted>
        <TabList mb={5} p={1} borderRadius="full"
          bg={colorMode==='dark' ? 'whiteAlpha.100' : 'gray.100'}
          borderWidth={colorMode==='dark'?1:0}
          borderColor={colorMode==='dark' ? 'whiteAlpha.200' : 'gray.200'}
        >
          <Tab
            _selected={{
              color: colorMode==='dark' ? 'brand.200' : 'brand.700',
              bg: colorMode==='dark' ? 'whiteAlpha.200' : 'white',
              boxShadow: 'sm',
            }}
            borderRadius="full"
            px={{ base: 3, md: 4 }}
            py={{ base: 2, md: 2 }}
            fontWeight="semibold"
          >
            Statistiques générales
          </Tab>
          {isUser && (
            <Tab
              _selected={{
                color: colorMode==='dark' ? 'brand.200' : 'brand.700',
                bg: colorMode==='dark' ? 'whiteAlpha.200' : 'white',
                boxShadow: 'sm',
              }}
              borderRadius="full"
              px={{ base: 3, md: 4 }}
              py={{ base: 2, md: 2 }}
              fontWeight="semibold"
            >
              Ma collection
            </Tab>
          )}
        </TabList>
        <TabPanels>
          <TabPanel px={{ base: 0, md: 1 }}>
            <Stack spacing={6}>
              <Box>
                <Heading as="h2" size="md" color={colorMode === 'dark' ? 'brand.300' : 'brand.600'}>
                  Statistiques générales
                </Heading>
                <Text mt={2} color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
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
                  <Box borderRadius="2xl" p={{ base: 5, md: 6 }} boxShadow="md" bg={cardBg} borderWidth={colorMode==='dark'?1:0} borderColor={colorMode==='dark'?'whiteAlpha.200':'gray.200'}>
                    <Text fontSize="xs" textTransform="uppercase" letterSpacing="wider" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'} mb={2}>
                      Panorama
                    </Text>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} alignItems="flex-start">
                      <Stat>
                        <StatLabel fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.700'}>
                          Total albums
                        </StatLabel>
                        <StatNumber fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold" color={colorMode === 'dark' ? 'brand.200' : 'brand.700'}>
                          {publicStats.total_albums ?? '—'}
                        </StatNumber>
                        <StatHelpText color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>
                          {publicStats.total_artists ?? 0} artiste{publicStats.total_artists > 1 ? 's' : ''}
                        </StatHelpText>
                      </Stat>
                      <Stat>
                        <StatLabel fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.700'}>
                          Période couverte
                        </StatLabel>
                        <StatNumber fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold" color={colorMode === 'dark' ? 'brand.200' : 'brand.700'}>
                          {minYear ?? '—'} – {maxYear ?? '—'}
                        </StatNumber>
                        {yearSpan && (
                          <StatHelpText color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>
                            {yearSpan} année{yearSpan > 1 ? 's' : ''}
                          </StatHelpText>
                        )}
                      </Stat>
                      <Stat>
                        <StatLabel fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.700'}>
                          Meilleure année
                        </StatLabel>
                        <StatNumber fontSize={{ base: '2xl', md: '3xl' }} fontWeight="bold" color={colorMode === 'dark' ? 'brand.200' : 'brand.700'}>
                          {publicStats.top_year ?? '—'}
                        </StatNumber>
                        <StatHelpText color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>
                          {publicStats.top_year_count ?? 0} album{(publicStats.top_year_count ?? 0) > 1 ? 's' : ''}
                        </StatHelpText>
                      </Stat>
                    </SimpleGrid>
                  </Box>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
                    <Stat p={6} borderRadius="xl" boxShadow="md" bg={cardBg}>
                      <StatLabel fontSize="lg" color={colorMode==='dark'?'slate.300':'slate.700'}>Année la plus représentée</StatLabel>
                      <StatNumber fontSize="2xl" color={colorMode === 'dark' ? 'brand.200' : 'brand.700'}>
                        {publicStats.top_year ?? 'N/A'}
                      </StatNumber>
                      {publicStats.top_year_count ? (
                        <StatHelpText color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>
                          {publicStats.top_year_count} album{publicStats.top_year_count > 1 ? 's' : ''} publié{publicStats.top_year_count > 1 ? 's' : ''}
                        </StatHelpText>
                      ) : null}
                    </Stat>

                    <Stat p={6} borderRadius="xl" boxShadow="md" bg={cardBg}>
                      <StatLabel fontSize="lg" color={colorMode==='dark'?'slate.300':'slate.700'}>Artiste le plus représenté</StatLabel>
                      <StatNumber fontSize="2xl" color={colorMode === 'dark' ? 'brand.200' : 'brand.700'}>
                        {publicStats.top_artist ?? 'N/A'}
                      </StatNumber>
                      {publicStats.top_artist_count ? (
                        <StatHelpText color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>
                          {publicStats.top_artist_count} album{publicStats.top_artist_count > 1 ? 's' : ''}
                        </StatHelpText>
                      ) : null}
                    </Stat>

                    <Stat p={6} borderRadius="xl" boxShadow="md" bg={cardBg}>
                      <StatLabel fontSize="lg" color={colorMode==='dark'?'slate.300':'slate.700'}>Totaux</StatLabel>
                      <StatNumber fontSize="2xl" color={colorMode === 'dark' ? 'brand.200' : 'brand.700'}>
                        {publicStats.total_albums ?? 0} / {publicStats.total_artists ?? 0}
                      </StatNumber>
                      <StatHelpText color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>
                        Albums / Artistes distincts
                      </StatHelpText>
                    </Stat>
                  </SimpleGrid>
                  
                  <Box borderRadius="xl" p={{ base: 3, md: 4 }} boxShadow="md" bg={cardBg} borderWidth={colorMode==='dark'?1:0} borderColor={colorMode==='dark'?'whiteAlpha.200':'gray.200'}>
                    <Text fontSize="sm" mb={2} color={colorMode==='dark' ? 'gray.400' : 'gray.600'}>
                      Albums par année
                    </Text>
                    <AlbumsPerYearChart yearData={publicStats.albums_per_year || []} />
                  </Box>
                  
                  <Box p={{ base: 3, md: 4 }} borderRadius="xl" boxShadow="md" bg={cardBg}>
                    {loadingAlbums ? (
                      <Flex justify="center" align="center" minH="120px">
                        <Spinner size="sm" color="brand.500" />
                      </Flex>
                    ) : (
                      <CompactCountryDistribution artists={allAlbums} maxItems={12} initialLimit={5} />
                    )}
                  </Box>

                  <GenresDistribution genres={genresStats.genres} styles={genresStats.styles} />
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
