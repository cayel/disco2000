import { useEffect, useState } from 'react';
import { getCookie } from '../utils/cookie';
import { Box, Heading, Stat, StatLabel, StatNumber, useColorMode, Spinner, Text, Button, Flex } from '@chakra-ui/react';
import AlbumsPerYearChart from './AlbumsPerYearChart';

export default function StudioStats({ onBack }) {
  const [count, setCount] = useState(null);
  const [topYear, setTopYear] = useState(null);
  const [topArtist, setTopArtist] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { colorMode } = useColorMode();

  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL;
    const apiKey = import.meta.env.VITE_API_KEY;
    const jwt = getCookie('jwt');
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
        setAlbums(Array.isArray(data) ? data : []);
        // Nombre total d'albums
        const totalCount = Array.isArray(data) ? data.length : 0;
        setCount(totalCount);
        // Calcul de l'année la plus représentée
        let maxYear = null;
        let maxYearCount = 0;
        let yearCount = {};
        // Calcul de l'artiste le plus représenté
        let maxArtist = null;
        let maxArtistCount = 0;
        let artistCount = {};
        if (Array.isArray(data) && data.length > 0) {
          data.forEach(album => {
            // Année
            const year = album.year;
            if (year) yearCount[year] = (yearCount[year] || 0) + 1;
            // Artiste
            const artist = album.artist || album.artiste;
            if (artist) artistCount[artist] = (artistCount[artist] || 0) + 1;
          });
          Object.entries(yearCount).forEach(([year, count]) => {
            if (count > maxYearCount) {
              maxYear = year;
              maxYearCount = count;
            }
          });
          Object.entries(artistCount).forEach(([artist, count]) => {
            if (count > maxArtistCount) {
              maxArtist = artist;
              maxArtistCount = count;
            }
          });
          setTopYear(maxYear);
          setTopArtist(maxArtist);
        } else {
          setTopYear(null);
          setTopArtist(null);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
  <Box w="100%" maxW="1100px" mx="auto" mt={10} p={0} borderRadius="xl" boxShadow="lg" bg={colorMode === 'dark' ? 'brand.900' : 'white'} textAlign="center">
      <Heading as="h2" size="lg" mb={6} color={colorMode === 'dark' ? 'purple.200' : 'purple.700'}>
        Statistiques
      </Heading>
      {loading ? (
        <Spinner size="lg" />
      ) : error ? (
        <Text color="red.400">{error}</Text>
      ) : (
        <>
          <Flex direction={{ base: 'column', md: 'row' }} gap={8} mb={8} w="100%" maxW="1100px" mx="auto" px={8} justify="center" align="stretch">
            <Stat flex={1} minW="0" p={6} borderRadius="lg" boxShadow="sm" bg={colorMode === 'dark' ? 'brand.800' : 'gray.50'}>
              <StatLabel fontSize="lg">Nombre total d'albums</StatLabel>
              <StatNumber fontSize="4xl" color="purple.400">{count}</StatNumber>
            </Stat>
            <Stat flex={1} minW="0" p={6} borderRadius="lg" boxShadow="sm" bg={colorMode === 'dark' ? 'brand.800' : 'gray.50'}>
              <StatLabel fontSize="lg">Année la plus représentée</StatLabel>
              <StatNumber fontSize="3xl" color="purple.600">{topYear ? topYear : 'N/A'}</StatNumber>
            </Stat>
            <Stat flex={1} minW="0" p={6} borderRadius="lg" boxShadow="sm" bg={colorMode === 'dark' ? 'brand.800' : 'gray.50'}>
              <StatLabel fontSize="lg">Artiste le plus représenté</StatLabel>
              <StatNumber fontSize="2xl" color="purple.700">{topArtist ? topArtist : 'N/A'}</StatNumber>
            </Stat>
          </Flex>
          <Box w="100%" maxW="1100px" mx="auto" px={8}>
            <AlbumsPerYearChart albums={albums} />
          </Box>
        </>
      )}
    </Box>
  );
}
