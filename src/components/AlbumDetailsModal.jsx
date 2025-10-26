import { useEffect, useState } from 'react';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Box, Text, Image, Spinner, Badge, Stack, Tag, TagLabel, Wrap, WrapItem } from '@chakra-ui/react';

export default function AlbumDetailsModal({ albumId, isOpen, onClose, debugAlbums }) {
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rawResponse, setRawResponse] = useState("");

  useEffect(() => {
    if (!albumId || !isOpen) return;
    setLoading(true);
    setError(null);
    setRawResponse(`DEBUG: albumId=${albumId}, timestamp=${Date.now()}`);
    fetch(`${import.meta.env.VITE_API_URL}/api/albums/${albumId}`, {
      headers: {
        'X-API-KEY': import.meta.env.VITE_API_KEY
      }
    })
      .then(async res => {
        let text = await res.text();
        setRawResponse(text);
        let data = null;
        try {
          data = JSON.parse(text);
        } catch (e) {
          // not JSON
        }
        if (!res.ok) {
          setError(`Erreur API: ${res.status} ${res.statusText}`);
          setAlbum(null);
        } else if (!data) {
          setError(`Réponse vide ou non JSON`);
          setAlbum(null);
        } else {
          setAlbum(data);
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Erreur lors du chargement des détails.');
        setRawResponse("");
        setLoading(false);
      });
  }, [albumId, isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Détails de l'album</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {/* Debug info supprimée car l'id est maintenant présent */}
          {loading && <Spinner />}
          {error && <Text color="red.500">{error}</Text>}
          {album && (
            <Stack direction={{ base: 'column', md: 'row' }} spacing={6} align="center" py={2}>
              {album.cover_url && (
                <Image src={album.cover_url} alt={album.title} boxSize="160px" objectFit="cover" borderRadius="lg" />
              )}
              <Box flex={1} minW={0}>
                <Text fontWeight="bold" fontSize="xl" mb={0}>{album.title}</Text>
                {album.artist && (
                  <Text fontSize="sm" color="gray.600" mt={0.5} mb={0}>
                    {typeof album.artist === 'object' ? (album.artist.name || album.artist.id || JSON.stringify(album.artist)) : album.artist}
                  </Text>
                )}
                {album.label && (
                  <Text fontSize="xs" color="gray.400" mb={2} mt={0.5}>
                    {typeof album.label === 'object' ? (album.label.name || album.label.id || JSON.stringify(album.label)) : album.label}
                  </Text>
                )}
                <Badge colorScheme="purple" mb={2}>{album.year}</Badge>


                {/* Genres sous forme de tags */}
                {album.genre && (
                  <Wrap mb={2}>
                    {(Array.isArray(album.genre) ? album.genre : [album.genre]).map((g, i) => (
                      <WrapItem key={i}>
                        <Tag colorScheme="purple" variant="subtle">
                          <TagLabel>{typeof g === 'object' ? (g.name || g.id || JSON.stringify(g)) : g}</TagLabel>
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                )}
                {/* Styles sous forme de tags */}
                {album.style && (
                  <Wrap mb={2}>
                    {(Array.isArray(album.style) ? album.style : [album.style]).map((s, i) => (
                      <WrapItem key={i}>
                        <Tag colorScheme="blue" variant="subtle">
                          <TagLabel>{typeof s === 'object' ? (s.name || s.id || JSON.stringify(s)) : s}</TagLabel>
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                )}
                {album.country && <Text mb={1}>{album.country}</Text>}
                {album.description && <Text mt={2} fontSize="sm">{album.description}</Text>}
              </Box>
            </Stack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
