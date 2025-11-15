import { Box, Heading, Text, useColorMode, Flex, Badge } from '@chakra-ui/react';
import { useMemo } from 'react';

// Convertir un code pays ISO en emoji drapeau
const getCountryFlag = (countryCode) => {
  if (!countryCode || countryCode.length !== 2) return '🏳️';
  
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 0x1F1E6 + char.charCodeAt(0) - 65);
  
  return String.fromCodePoint(...codePoints);
};

export default function CountryDistribution({ artists }) {
  const { colorMode } = useColorMode();
  
  // Calculer la distribution par pays
  const countryStats = useMemo(() => {
    if (!artists || artists.length === 0) {
      console.log('CountryDistribution: Aucun artiste', artists);
      return [];
    }
    
    console.log('CountryDistribution: Premier artiste:', artists[0]);
    console.log('CountryDistribution: Total artistes:', artists.length);
    
    // Compter les artistes par pays
    const countMap = new Map();
    
    artists.forEach(artist => {
      const country = artist.country;
      const countryName = artist.country_name;
      
      if (country) {
        const existing = countMap.get(country);
        if (existing) {
          existing.count++;
        } else {
          countMap.set(country, {
            code: country,
            name: countryName || country,
            count: 1
          });
        }
      }
    });
    
    // Convertir en tableau et trier par nombre d'artistes décroissant
    const result = Array.from(countMap.values())
      .sort((a, b) => b.count - a.count);
    
    console.log('CountryDistribution: Pays trouvés:', result);
    return result;
  }, [artists]);
  
  const totalArtists = artists?.length || 0;
  const maxCount = countryStats[0]?.count || 1;
  
  if (countryStats.length === 0) {
    return (
      <Box p={6} textAlign="center">
        <Text color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
          Aucune donnée de pays disponible
        </Text>
      </Box>
    );
  }
  
  return (
    <Box>
      <Heading as="h3" size="md" mb={4} color={colorMode === 'dark' ? 'purple.200' : 'purple.700'}>
        Répartition par pays
      </Heading>
      <Text mb={4} fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
        {countryStats.length} pays représenté{countryStats.length > 1 ? 's' : ''} • {totalArtists} artiste{totalArtists > 1 ? 's' : ''} total
      </Text>
      
      <Box>
        {countryStats.map((country) => {
          const percentage = ((country.count / totalArtists) * 100).toFixed(1);
          const barWidth = (country.count / maxCount) * 100;
          
          return (
            <Box
              key={country.code}
              mb={3}
              p={3}
              bg={colorMode === 'dark' ? 'whiteAlpha.50' : 'gray.50'}
              borderRadius="md"
              _hover={{
                bg: colorMode === 'dark' ? 'whiteAlpha.100' : 'gray.100',
                transform: 'translateX(4px)',
              }}
              transition="all 0.2s"
            >
              <Flex justify="space-between" align="center" mb={2}>
                <Flex align="center" gap={2} flex={1}>
                  <Text fontSize="xl" lineHeight="1">
                    {getCountryFlag(country.code)}
                  </Text>
                  <Text
                    fontSize="sm"
                    fontWeight="medium"
                    color={colorMode === 'dark' ? 'white' : 'gray.800'}
                  >
                    {country.name}
                  </Text>
                </Flex>
                <Flex align="center" gap={3}>
                  <Badge
                    colorScheme="purple"
                    fontSize="xs"
                    px={2}
                    py={1}
                  >
                    {country.count} artiste{country.count > 1 ? 's' : ''}
                  </Badge>
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    color={colorMode === 'dark' ? 'purple.300' : 'purple.600'}
                    minW="45px"
                    textAlign="right"
                  >
                    {percentage}%
                  </Text>
                </Flex>
              </Flex>
              
              {/* Barre de progression */}
              <Box
                h="6px"
                bg={colorMode === 'dark' ? 'whiteAlpha.200' : 'gray.200'}
                borderRadius="full"
                overflow="hidden"
              >
                <Box
                  h="100%"
                  w={`${barWidth}%`}
                  bgGradient="linear(to-r, purple.400, purple.600)"
                  borderRadius="full"
                  transition="width 0.5s ease-out"
                />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
