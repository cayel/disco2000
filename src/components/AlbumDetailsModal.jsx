import { useEffect, useState } from 'react';
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Box, Text, Image, Spinner, Badge, Stack, Tag, TagLabel, Wrap, WrapItem, Button, useToast, Checkbox, Flex, Input } from '@chakra-ui/react';

import { getCookie, deleteCookie } from '../utils/cookie';
import { isJwtExpired } from '../utils/jwt';
import authFetch from '../utils/authFetch';

export default function AlbumDetailsModal({
  albumId,
  isOpen,
  onClose,
  isContributor,
  isUser,
  refreshAlbums,
  onCollectionUpdate,
  onAlbumDelete,
}) {
  const [album, setAlbum] = useState(null);
  // On force isUser à false si le JWT n'est pas présent ou expiré
  let jwt = getCookie('jwt');
  if (jwt && isJwtExpired(jwt)) {
    deleteCookie('jwt');
    jwt = null;
  }
  const isUserConnected = !!jwt && isUser === true;
  const [cd, setCd] = useState(isUserConnected ? false : undefined);
  const [vinyl, setVinyl] = useState(isUserConnected ? false : undefined);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();
  // États pour l'ajout à une liste
  const [lists, setLists] = useState([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [listsError, setListsError] = useState(null);
  const [selectedListId, setSelectedListId] = useState(null); // single list id (string)
  const [filterQuery, setFilterQuery] = useState('');
  const [listsPage, setListsPage] = useState(1); // pagination page for long lists
  // Synchroniser les cases à cocher avec la collection de l'album
  useEffect(() => {
    if (!isUserConnected) return;
    if (isOpen && album && album.collection) {
      setCd(!!album.collection.cd);
      setVinyl(!!album.collection.vinyl);
    } else if (isOpen) {
      setCd(false);
      setVinyl(false);
    }
  }, [isOpen, album, isUserConnected]);
  const handleSaveCollection = async () => {
    if (!albumId) return;
    setAdding(true);
    const payload = {
      album_id: albumId,
      cd: Boolean(cd),
      vinyl: Boolean(vinyl),
    };
    const isRemoving = !payload.cd && !payload.vinyl;
    try {
      const res = await authFetch(`${import.meta.env.VITE_API_URL}/api/collection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }, { label: 'save-collection' });
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(errorText || 'Erreur API');
      }
      const successMessage = isRemoving ? 'Supprimé de ta collection' : 'Collection mise à jour';
      toast({ title: successMessage, status: 'success', duration: 2000 });
      const nextCollection = isRemoving ? null : { cd: payload.cd, vinyl: payload.vinyl };
      setAlbum(prev => (prev ? { ...prev, collection: nextCollection } : prev));
      setCd(payload.cd);
      setVinyl(payload.vinyl);
      if (onCollectionUpdate) {
        onCollectionUpdate(albumId, nextCollection);
      } else if (refreshAlbums) {
        refreshAlbums();
      }
    } catch (err) {
      toast({ title: err?.message || 'Erreur réseau', status: 'error', duration: 3000 });
    } finally {
      setAdding(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !albumId) return;
    setLoading(true);
    setError(null);
    setAlbum(null);
    authFetch(`${import.meta.env.VITE_API_URL}/api/albums/${albumId}`, {
      method: 'GET'
    }, { label: 'album-details' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Erreur lors du chargement');
        const data = await res.json();
        setAlbum(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isOpen, albumId, jwt]);

  // Charger les listes de l'utilisateur pour le sélecteur "Ajouter à une liste"
  useEffect(() => {
    if (!isOpen || !jwt || !isUser) return;
    setListsLoading(true);
    setListsError(null);
    setLists([]);
    authFetch(`${import.meta.env.VITE_API_URL}/api/lists`, { method: 'GET' }, { label: 'lists-for-modal' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Erreur lors du chargement des listes');
        const data = await res.json().catch(() => []);
  setLists(Array.isArray(data) ? data : []);
  // Réinitialiser la sélection
  setSelectedListId(null);
  setFilterQuery('');
  setListsPage(1);
      })
      .catch((err) => setListsError(err.message || 'Erreur réseau'))
      .finally(() => setListsLoading(false));
  }, [isOpen, jwt, isUser]);

  const handleDelete = async () => {
    if (!albumId || !jwt || !isContributor) return;
    setDeleting(true);
    try {
      const res = await authFetch(`${import.meta.env.VITE_API_URL}/api/albums/${albumId}`, {
        method: 'DELETE'
      }, { label: 'delete-album' });
      if (res.ok) {
        toast({ title: 'Album supprimé', status: 'success', duration: 2000 });
        if (onAlbumDelete) {
          onAlbumDelete(albumId);
        } else if (refreshAlbums) {
          refreshAlbums();
        }
        onClose();
      } else {
        toast({ title: 'Erreur lors de la suppression', status: 'error', duration: 3000 });
      }
    } catch {
      toast({ title: 'Erreur réseau', status: 'error', duration: 3000 });
    }
    setDeleting(false);
  };

  // Handler pour la fermeture de la modale
  const handleClose = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
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
                {jwt && isContributor && (
                  <Button colorScheme="red" size="sm" mt={4} isLoading={deleting} onClick={handleDelete}>
                    Supprimer l'album
                  </Button>
                )}
                {/* Bloc collection strictement masqué si non connecté (double vérification JWT et rôle) */}
                {(jwt && isUser === true) ? (
                  <Box mt={6}>
                    <Text fontWeight="semibold" mb={2}>Ajouter à ma collection :</Text>
                    <Flex gap={4} mb={2}>
                      <Checkbox isChecked={cd} onChange={e => setCd(e.target.checked)} colorScheme="purple">CD</Checkbox>
                      <Checkbox isChecked={vinyl} onChange={e => setVinyl(e.target.checked)} colorScheme="purple">Vinyle</Checkbox>
                    </Flex>
                    <Button colorScheme="purple" size="sm" isLoading={adding} onClick={handleSaveCollection}>
                      Mettre à jour ma collection
                    </Button>
                  </Box>
                ) : null}

                {/* Ajout à une liste déplacé sur la carte album (AlbumCard) pour un flux plus discret et direct */}
              </Box>
            </Stack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
