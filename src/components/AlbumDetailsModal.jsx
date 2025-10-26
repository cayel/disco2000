import { useEffect, useState } from 'react';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Box, Text, Image, Spinner, Badge, Stack, Tag, TagLabel, Wrap, WrapItem, Button, useToast } from '@chakra-ui/react';

import { getCookie } from '../utils/cookie';

export default function AlbumDetailsModal({ albumId, isOpen, onClose, debugAlbums, isContributor, refreshAlbums }) {
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rawResponse, setRawResponse] = useState("");
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();
  const jwt = getCookie('jwt');

  useEffect(() => {
    if (!isOpen || !albumId) return;
    setLoading(true);
    setError(null);
    setAlbum(null);
    fetch(`${import.meta.env.VITE_API_URL}/api/albums/${albumId}`, {
      headers: {
        'X-API-KEY': import.meta.env.VITE_API_KEY
      }
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Erreur lors du chargement');
        const data = await res.json();
        setAlbum(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isOpen, albumId]);

  const handleDelete = async () => {
    if (!albumId) return;
    setDeleting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/albums/${albumId}`, {
        method: 'DELETE',
        headers: {
          'X-API-KEY': import.meta.env.VITE_API_KEY,
          ...(jwt ? { 'Authorization': `Bearer ${jwt}` } : {})
        }
      });
      if (res.ok) {
        toast({ title: 'Album supprimé', status: 'success', duration: 2000 });
        onClose();
        if (refreshAlbums) refreshAlbums();
      } else {
        toast({ title: 'Erreur lors de la suppression', status: 'error', duration: 3000 });
      }
    } catch (e) {
      toast({ title: 'Erreur réseau', status: 'error', duration: 3000 });
    }
    setDeleting(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Détails de l'album</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
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
                {isContributor && (
                  <Button colorScheme="red" size="sm" mt={4} isLoading={deleting} onClick={handleDelete}>
                    Supprimer l'album
                  </Button>
                )}
              </Box>
            </Stack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
