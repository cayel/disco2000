import { useEffect, useState, useMemo } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Box,
  Text,
  Image,
  Spinner,
  Badge,
  SimpleGrid,
  Flex,
  Button,
  useColorMode,
  AspectRatio
} from '@chakra-ui/react';
import authFetch from '../utils/authFetch';

export default function ListAlbumsModal({ listId, listTitle, isOpen, onClose }) {
  const { colorMode } = useColorMode();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAlbums = async () => {
    if (!listId) return;
    setLoading(true);
    setError(null);
    setAlbums([]);
    try {
      const res = await authFetch(`${import.meta.env.VITE_API_URL}/api/lists/${listId}/albums`, { method: 'GET' }, { label: 'list-albums' });
      if (!res.ok) {
        const txt = await res.text().catch(() => 'Erreur lors du chargement des albums');
        throw new Error(txt || `Erreur ${res.status}`);
      }
      const data = await res.json().catch(() => []);
      const arr = Array.isArray(data) ? data : [];
      // Trier par position si disponible
      arr.sort((a, b) => {
        const pa = Number(a.position);
        const pb = Number(b.position);
        if (Number.isFinite(pa) && Number.isFinite(pb)) return pa - pb;
        return 0;
      });
      setAlbums(arr);
    } catch (err) {
      setError(err.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && listId) {
      fetchAlbums();
    }
  }, [isOpen, listId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Albums de la liste{listTitle ? ` : ${listTitle}` : ''}
          <Button ml={3} size="sm" variant="outline" colorScheme="brand" onClick={fetchAlbums} isLoading={loading}>
            Rafraîchir
          </Button>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {loading && (
            <Flex align="center" justify="center" py={8}>
              <Spinner size="lg" />
            </Flex>
          )}
          {error && (
            <Box
              borderWidth={1}
              borderColor={colorMode === 'dark' ? 'red.700' : 'red.200'}
              bg={colorMode === 'dark' ? 'red.900' : 'red.50'}
              color={colorMode === 'dark' ? 'red.100' : 'red.700'}
              borderRadius="md"
              px={4}
              py={3}
              mb={4}
            >
              {error}
            </Box>
          )}
          {!loading && !error && (
            albums.length === 0 ? (
              <Text color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>Aucun album dans cette liste.</Text>
            ) : (
              <SimpleGrid columns={{ base: 3, sm: 4, md: 6 }} spacing={3}>
                {albums.map((item) => (
                  <Box key={item.list_album_id || `${item.album_id}-${item.position}`}
                       position="relative"
                       borderRadius="md"
                       overflow="hidden"
                       boxShadow="sm"
                       bg={colorMode === 'dark' ? 'slate.800' : 'white'}>
                    <AspectRatio ratio={1}>
                      {item.cover_url ? (
                        <Image src={item.cover_url}
                               alt={item.title}
                               objectFit="cover" />
                      ) : (
                        <Flex align="center" justify="center" bg={colorMode === 'dark' ? 'slate.700' : 'gray.100'}>
                          <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>Sans pochette</Text>
                        </Flex>
                      )}
                    </AspectRatio>
                    {/* Badge position */}
                    {Number.isFinite(Number(item.position)) && (
                      <Badge position="absolute" top={2} left={2} colorScheme="brand" borderRadius="md">#{item.position}</Badge>
                    )}
                    {/* Overlay titre/artiste */}
                    <Box position="absolute" bottom={0} left={0} right={0}
                         bg={colorMode === 'dark' ? 'rgba(15,16,30,0.65)' : 'rgba(255,255,255,0.85)'}
                         px={2} py={1}>
                      <Text fontSize="xs" fontWeight="semibold" noOfLines={1}>
                        {item.title}
                      </Text>
                      {item.artist?.name && (
                        <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} noOfLines={1}>
                          {item.artist.name}
                        </Text>
                      )}
                    </Box>
                  </Box>
                ))}
              </SimpleGrid>
            )
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
