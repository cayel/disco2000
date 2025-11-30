import { useState, useEffect, useMemo } from 'react';
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
  Stack,
  SimpleGrid,
  Progress,
} from '@chakra-ui/react';
import { getCookie } from '../utils/cookie';
import authFetch from '../utils/authFetch';

export default function CollectionStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { colorMode } = useColorMode();
  const containerBg = colorMode === 'dark' ? 'slate.900' : 'white';
  const cardBg = colorMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'gray.50';
  const accentColor = colorMode === 'dark' ? 'brand.200' : 'brand.700';

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL;
    const jwt = getCookie('jwt');
    if (!jwt) {
      setError('Non authentifié');
      setLoading(false);
      return;
    }
    authFetch(`${apiBase}/api/collection/stats`, { method: 'GET' }, { label: 'collection-stats' })
      .then(res => {
        if (!res.ok) throw new Error('Erreur API');
        return res.json();
      })
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const totalDiscs = useMemo(() => Number(stats?.total_discs) || 0, [stats]);
  const totalCd = useMemo(() => Number(stats?.total_cd) || 0, [stats]);
  const totalVinyl = useMemo(() => Number(stats?.total_vinyl) || 0, [stats]);

  const distribution = useMemo(() => {
    if (!totalDiscs) return [];
    const cdPercent = Math.min(100, Math.round((totalCd / totalDiscs) * 100));
    const vinylPercent = Math.min(100, Math.round((totalVinyl / totalDiscs) * 100));
    const otherPercent = Math.max(0, 100 - cdPercent - vinylPercent);
    return [
      { label: 'CD', value: totalCd, percent: cdPercent, color: 'purple' },
      { label: 'Vinyles', value: totalVinyl, percent: vinylPercent, color: 'pink' },
      { label: 'Autres formats', value: Math.max(0, totalDiscs - totalCd - totalVinyl), percent: otherPercent, color: 'gray' },
    ].filter(item => item.value > 0 || item.percent > 0);
  }, [totalDiscs, totalCd, totalVinyl]);

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
      <Stack spacing={6}>
        <Box>
          <Heading as="h2" size="lg" color={colorMode === 'dark' ? 'brand.300' : 'brand.600'}>
            Statistiques de ma collection
          </Heading>
          <Text mt={2} color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>
            Un aperçu rapide de la taille de ta collection et des formats que tu possèdes.
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
            <Box borderRadius="2xl" p={{ base: 6, md: 8 }} boxShadow="md" bg={cardBg} borderWidth={colorMode==='dark'?1:0} borderColor={colorMode==='dark'?'whiteAlpha.200':'gray.200'}>
              <Text fontSize="sm" textTransform="uppercase" letterSpacing="widest" color={colorMode==='dark'?'gray.400':'gray.600'} mb={3}>
                Capacité totale
              </Text>
              <Flex align={{ base: 'flex-start', md: 'center' }} justify="space-between" gap={6} wrap="wrap">
                <Stat minW={0}>
                  <StatLabel fontSize="lg" color={colorMode==='dark'?'slate.300':'slate.700'}>
                    Nombre total de disques
                  </StatLabel>
                  <StatNumber fontSize={{ base: '4xl', md: '5xl' }} fontWeight="extrabold" color={accentColor}>
                    {totalDiscs || 'N/A'}
                  </StatNumber>
                  <StatHelpText color={colorMode==='dark'?'gray.300':'gray.500'}>
                    {totalCd} CD • {totalVinyl} vinyles
                  </StatHelpText>
                </Stat>
                {totalDiscs > 0 && (
                  <Box flex="1" minW="240px">
                    <Text fontWeight="semibold" mb={2} color={colorMode==='dark'?'slate.200':'slate.800'}>
                      Répartition des formats
                    </Text>
                    <Stack spacing={3}>
                      {distribution.map(({ label, value, percent }) => (
                        <Box key={label}>
                          <Flex justify="space-between" fontSize="sm" mb={1}>
                            <Text color={colorMode==='dark'?'slate.300':'slate.700'}>{label}</Text>
                            <Text fontWeight="semibold" color={accentColor}>{value} • {percent}%</Text>
                          </Flex>
                          <Progress value={percent} colorScheme="brand" size="sm" borderRadius="full" />
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Flex>
            </Box>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
              <Stat p={6} borderRadius="xl" boxShadow="md" bg={cardBg} borderWidth={colorMode==='dark'?1:0} borderColor={colorMode==='dark'?'whiteAlpha.200':'gray.200'}>
                <StatLabel fontSize="lg" color={colorMode==='dark'?'slate.300':'slate.700'}>Nombre de CD</StatLabel>
                <StatNumber fontSize="3xl" color={accentColor}>
                  {totalCd || 'N/A'}
                </StatNumber>
              </Stat>

              <Stat p={6} borderRadius="xl" boxShadow="md" bg={cardBg} borderWidth={colorMode==='dark'?1:0} borderColor={colorMode==='dark'?'whiteAlpha.200':'gray.200'}>
                <StatLabel fontSize="lg" color={colorMode==='dark'?'slate.300':'slate.700'}>Nombre de vinyles</StatLabel>
                <StatNumber fontSize="3xl" color={accentColor}>
                  {totalVinyl || 'N/A'}
                </StatNumber>
              </Stat>

              <Stat p={6} borderRadius="xl" boxShadow="md" bg={cardBg} borderWidth={colorMode==='dark'?1:0} borderColor={colorMode==='dark'?'whiteAlpha.200':'gray.200'}>
                <StatLabel fontSize="lg" color={colorMode==='dark'?'slate.300':'slate.700'}>Artiste le plus représenté</StatLabel>
                <StatNumber fontSize="2xl" color={accentColor}>
                  {stats.top_artist ?? 'N/A'}
                </StatNumber>
                {stats.top_artist_count && (
                  <StatHelpText color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>
                    {stats.top_artist_count} disque(s)
                  </StatHelpText>
                )}
              </Stat>

              <Stat p={6} borderRadius="xl" boxShadow="md" bg={cardBg} borderWidth={colorMode==='dark'?1:0} borderColor={colorMode==='dark'?'whiteAlpha.200':'gray.200'}>
                <StatLabel fontSize="lg" color={colorMode==='dark'?'slate.300':'slate.700'}>Année la plus représentée</StatLabel>
                <StatNumber fontSize="2xl" color={accentColor}>
                  {stats.top_year ?? 'N/A'}
                </StatNumber>
                {stats.top_year_count && (
                  <StatHelpText color={colorMode === 'dark' ? 'gray.300' : 'gray.500'}>
                    {stats.top_year_count} disque(s)
                  </StatHelpText>
                )}
              </Stat>

              {stats.most_recent_added && (
                <Stat p={6} borderRadius="xl" boxShadow="md" bg={cardBg} borderWidth={colorMode==='dark'?1:0} borderColor={colorMode==='dark'?'whiteAlpha.200':'gray.200'}>
                  <StatLabel fontSize="lg">Dernier ajout</StatLabel>
                  <StatNumber fontSize="lg" noOfLines={2} color={accentColor}>
                    {stats.most_recent_added}
                  </StatNumber>
                </Stat>
              )}

              {stats.collection_value && (
                <Stat p={6} borderRadius="xl" boxShadow="md" bg={cardBg} borderWidth={colorMode==='dark'?1:0} borderColor={colorMode==='dark'?'whiteAlpha.200':'gray.200'}>
                  <StatLabel fontSize="lg">Valeur estimée</StatLabel>
                  <StatNumber fontSize="2xl" color={accentColor}>
                    {stats.collection_value}
                  </StatNumber>
                </Stat>
              )}
            </SimpleGrid>
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}

