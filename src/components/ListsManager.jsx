import { Box, Heading, Text, useColorMode, Flex, Button, IconButton, Spinner, SimpleGrid, Badge, Stack, useDisclosure, Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton, AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter, useToast, AspectRatio, Image, Input, Select } from '@chakra-ui/react';
import { DndContext, closestCenter, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DeleteIcon } from '@chakra-ui/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getCookie } from '../utils/cookie';
import CreateList from './CreateList';
import authFetch from '../utils/authFetch';
// Affichage inline des albums (mosaïque) sur la même page

export default function ListsManager() {
  const { colorMode } = useColorMode();
  const [jwt, setJwt] = useState(() => getCookie('jwt'));
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('recent'); // 'recent' | 'title' | 'ranked'
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: openDelete, onClose: closeDelete } = useDisclosure();
  const [pendingDelete, setPendingDelete] = useState(null); // { id, title }
  const [isDeleting, setIsDeleting] = useState(false);
  const cancelRef = useRef();
  const toast = useToast();
  const [selectedList, setSelectedList] = useState(null); // { id, title, is_ranked }
  const [selectedAlbums, setSelectedAlbums] = useState([]);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [selectedError, setSelectedError] = useState(null);
  const { isOpen: isRemoveOpen, onOpen: openRemove, onClose: closeRemove } = useDisclosure();
  const [pendingRemove, setPendingRemove] = useState(null); // { album_id, title }
  const [isRemoving, setIsRemoving] = useState(false);
  const removeCancelRef = useRef();
  const [updatingAlbumId, setUpdatingAlbumId] = useState(null);
  // DnD Kit sensors
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [activeId, setActiveId] = useState(null);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!active || !over || !selectedList) return;
    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;
    const ordered = [...selectedAlbums].sort((x, y) => (Number(x.position) || 0) - (Number(y.position) || 0));
    const fromIdx = ordered.findIndex(x => x.album_id === activeId);
    const toIdx = ordered.findIndex(x => x.album_id === overId);
    if (fromIdx < 0 || toIdx < 0) return;
    const moved = ordered.splice(fromIdx, 1)[0];
    ordered.splice(toIdx, 0, moved);
    const reindexed = ordered.map((x, i) => ({ ...x, position: i + 1 }));
    setSelectedAlbums(reindexed);
    setUpdatingAlbumId(activeId);
    try {
      const apiBase = import.meta.env.VITE_API_URL;
      const updates = reindexed
        .filter((x) => Number(x.position) !== Number(selectedAlbums.find(a => a.album_id === x.album_id)?.position))
        .map(x => authFetch(`${apiBase}/api/lists/${selectedList.id}/albums/${x.album_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ album_id: x.album_id, position: Number(x.position) })
        }, { label: 'dndkit-reindex' }));
      const results = await Promise.allSettled(updates);
      const anyRejected = results.some(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value && !r.value.ok));
      if (anyRejected) throw new Error('Erreur lors de la mise à jour du classement');
    } catch (err) {
      toast({ title: err.message || 'Erreur réseau', status: 'error', duration: 3000, position: 'top-right' });
      fetchSelectedAlbums(selectedList.id);
    } finally {
      setUpdatingAlbumId(null);
    }
  };

  // Helper: persist a fully reindexed order (PUT only for changed positions)
  const persistReindexed = async (reindexed, label = 'reindex') => {
    const apiBase = import.meta.env.VITE_API_URL;
    const updates = reindexed
      .filter((x) => Number(x.position) !== Number(selectedAlbums.find(a => a.album_id === x.album_id)?.position))
      .map(x => authFetch(`${apiBase}/api/lists/${selectedList.id}/albums/${x.album_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ album_id: x.album_id, position: Number(x.position) })
      }, { label }));
    const results = await Promise.allSettled(updates);
    const anyRejected = results.some(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value && !r.value.ok));
    if (anyRejected) throw new Error('Erreur lors de la mise à jour des positions');
  };

  const moveItem = async (albumId, direction) => {
    if (!selectedList) return;
    // Order and compute indices
    const ordered = [...selectedAlbums].sort((x, y) => (Number(x.position) || 0) - (Number(y.position) || 0));
    const idx = ordered.findIndex(x => x.album_id === albumId);
    if (idx < 0) return;
    let targetIdx = idx + (direction === 'up' ? -1 : 1);
    if (targetIdx < 0) targetIdx = 0;
    if (targetIdx >= ordered.length) targetIdx = ordered.length - 1;
    if (targetIdx === idx) return; // no change
    const [moved] = ordered.splice(idx, 1);
    ordered.splice(targetIdx, 0, moved);
    const reindexed = ordered.map((x, i) => ({ ...x, position: i + 1 }));
    // Optimistic UI
    setSelectedAlbums(reindexed);
    setUpdatingAlbumId(albumId);
    try {
      await persistReindexed(reindexed, direction === 'up' ? 'move-up-reindex' : 'move-down-reindex');
    } catch (err) {
      toast({ title: err.message || 'Erreur réseau', status: 'error', duration: 3000, position: 'top-right' });
      fetchSelectedAlbums(selectedList.id);
    } finally {
      setUpdatingAlbumId(null);
    }
  };

  useEffect(() => {
    const handler = (e) => setJwt(e.detail);
    window.addEventListener('jwt-updated', handler);
    return () => window.removeEventListener('jwt-updated', handler);
  }, []);

  const fetchLists = useCallback(async () => {
    if (!jwt) return;
    const apiBase = import.meta.env.VITE_API_URL;
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${apiBase}/api/lists`, { method: 'GET' }, { label: 'fetch-lists' });
      if (!res.ok) {
        const txt = await res.text().catch(() => 'Erreur lors du chargement des listes');
        throw new Error(txt || `Erreur ${res.status}`);
      }
      const data = await res.json().catch(() => []);
      setLists(Array.isArray(data) ? data : []);
    } catch (err) {
      setLists([]);
      setError(err.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  const fetchSelectedAlbums = useCallback(async (listId) => {
    if (!listId || !jwt) return;
    setSelectedLoading(true);
    setSelectedError(null);
    setSelectedAlbums([]);
    try {
      const res = await authFetch(`${import.meta.env.VITE_API_URL}/api/lists/${listId}/albums`, { method: 'GET' }, { label: 'inline-list-albums' });
      if (!res.ok) {
        const txt = await res.text().catch(() => 'Erreur lors du chargement des albums');
        throw new Error(txt || `Erreur ${res.status}`);
      }
      const data = await res.json().catch(() => []);
      const arr = Array.isArray(data) ? data : [];
      arr.sort((a, b) => {
        const pa = Number(a.position);
        const pb = Number(b.position);
        if (Number.isFinite(pa) && Number.isFinite(pb)) return pa - pb;
        return 0;
      });
      setSelectedAlbums(arr);
    } catch (err) {
      setSelectedError(err.message || 'Erreur réseau');
      setSelectedAlbums([]);
    } finally {
      setSelectedLoading(false);
    }
  }, [jwt]);

  const confirmRemoveAlbum = useCallback(async () => {
    if (!selectedList || !pendingRemove) return;
    setIsRemoving(true);
    try {
      const res = await authFetch(`${import.meta.env.VITE_API_URL}/api/lists/${selectedList.id}/albums/${pendingRemove.album_id}`, { method: 'DELETE' }, { label: 'remove-album-from-list' });
      if (res.status === 204) {
        setSelectedAlbums(prev => prev.filter(a => a.album_id !== pendingRemove.album_id));
        toast({ title: 'Album retiré de la liste', status: 'success', duration: 2500, position: 'top-right' });
        closeRemove();
        setPendingRemove(null);
      } else if (res.status === 403) {
        toast({ title: 'Suppression refusée', description: "Accès non autorisé à cette liste.", status: 'error', duration: 4000, position: 'top-right' });
      } else if (res.status === 404) {
        toast({ title: 'Introuvable', description: "Liste ou album non trouvé dans cette liste.", status: 'warning', duration: 4000, position: 'top-right' });
        // Nettoyer localement si besoin
        setSelectedAlbums(prev => prev.filter(a => a.album_id !== pendingRemove.album_id));
      } else {
        const txt = await res.text().catch(() => null);
        toast({ title: 'Erreur de suppression', description: txt || `Erreur ${res.status}` , status: 'error', duration: 5000, position: 'top-right' });
      }
    } catch (err) {
      toast({ title: 'Erreur réseau', description: err.message || 'Suppression impossible', status: 'error', duration: 5000, position: 'top-right' });
    } finally {
      setIsRemoving(false);
    }
  }, [selectedList, pendingRemove, toast]);

  const handleAskDelete = (list) => {
    setPendingDelete({ id: list.id, title: list.title });
    openDelete();
  };

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    const apiBase = import.meta.env.VITE_API_URL;
    setIsDeleting(true);
    try {
      const res = await authFetch(`${apiBase}/api/lists/${pendingDelete.id}`, { method: 'DELETE' }, { label: 'delete-list' });
      if (res.status === 204) {
        setLists(prev => prev.filter(l => l.id !== pendingDelete.id));
        toast({ title: 'Liste supprimée', status: 'success', duration: 2500, position: 'top-right' });
        closeDelete();
        setPendingDelete(null);
        return;
      }
      if (res.status === 403) {
        toast({ title: 'Suppression refusée', description: "Vous n'êtes pas autorisé à supprimer cette liste.", status: 'error', duration: 4000, position: 'top-right' });
      } else if (res.status === 404) {
        toast({ title: 'Liste introuvable', description: 'La liste demandée est introuvable.', status: 'warning', duration: 4000, position: 'top-right' });
        // Retirer localement si elle n’existe plus côté serveur
        setLists(prev => prev.filter(l => l.id !== pendingDelete.id));
      } else {
        const txt = await res.text().catch(() => null);
        toast({ title: 'Erreur de suppression', description: txt || `Erreur ${res.status}`, status: 'error', duration: 5000, position: 'top-right' });
      }
    } catch (err) {
      toast({ title: 'Erreur réseau', description: err.message || 'Suppression impossible', status: 'error', duration: 5000, position: 'top-right' });
    } finally {
      setIsDeleting(false);
    }
  }, [pendingDelete, toast]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  if (!jwt) {
    return (
      <Box
        minH="100vh"
        pb={{ base: 24, md: 12 }}
        bg={colorMode === 'dark' ? 'slate.900' : '#f7f7fa'}
      >
        <Box maxW="900px" mx="auto" px={{ base: 3, md: 4 }} pt={6}>
          <Heading size="md" color={colorMode === 'dark' ? 'gray.100' : 'brand.800'}>
            Listes
          </Heading>
          <Text mt={2} color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
            Connecte-toi pour créer et gérer tes listes.
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      minH="100vh"
      pb={{ base: 24, md: 12 }}
      bg={colorMode === 'dark' ? 'slate.900' : '#f7f7fa'}
    >
      <Box maxW="1100px" mx="auto" px={{ base: 3, md: 4 }} pt={6}>
        <Flex align="center" justify="space-between" mb={4} wrap="wrap" gap={3}>
          <Heading size="lg" color={colorMode === 'dark' ? 'gray.100' : 'brand.800'}>
            Mes listes
          </Heading>
          <Flex gap={2} align="center">
            <Box display="flex" gap={2} alignItems="center">
              <Input
                size="sm"
                placeholder="Rechercher une liste…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                maxW="220px"
                bg={colorMode === 'dark' ? 'slate.800' : 'white'}
              />
              <Select size="sm" value={sortKey} onChange={(e) => setSortKey(e.target.value)} maxW="180px">
                <option value="recent">Récents</option>
                <option value="title">Titre (A→Z)</option>
                <option value="ranked">Classées d’abord</option>
              </Select>
            </Box>
            <Button size="sm" onClick={onOpen} colorScheme="brand">
              Créer une liste
            </Button>
          </Flex>
        </Flex>

        {/* Modale de création */}
        <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalCloseButton />
            <ModalBody p={0}>
              <CreateList onCreated={() => { fetchLists(); onClose(); }} />
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* État de chargement / erreur */}
        {loading && (
          <Flex align="center" justify="center" py={12}>
            <Spinner size="lg" thickness="4px" color="purple.400" />
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

        {/* Liste des listes */}
        {!loading && !error && (
          lists.length === 0 ? (
            <Box
              borderWidth={1}
              borderColor={colorMode === 'dark' ? 'slate.700' : 'gray.200'}
              bg={colorMode === 'dark' ? 'slate.800' : 'white'}
              borderRadius="lg"
              p={6}
              textAlign="center"
            >
              <Text color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>
                Aucune liste pour l’instant. Crée ta première liste ci-dessus.
              </Text>
              <Button mt={3} size="sm" colorScheme="brand" onClick={onOpen}>Créer une liste</Button>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
              {lists
                .filter(l => String(l.title || '').toLowerCase().includes(query.trim().toLowerCase()))
                .sort((a,b) => {
                  if (sortKey === 'title') return String(a.title||'').localeCompare(String(b.title||''));
                  if (sortKey === 'ranked') return Number(b.is_ranked||0) - Number(a.is_ranked||0);
                  // Tri "Récents" par created_at décroissant si disponible
                  const ad = a.created_at ? new Date(a.created_at).getTime() : 0;
                  const bd = b.created_at ? new Date(b.created_at).getTime() : 0;
                  return bd - ad;
                })
                .map((l) => (
                <Box
                  key={l.id}
                  borderWidth={1}
                  borderColor={colorMode === 'dark' ? 'slate.700' : 'gray.200'}
                  bg={colorMode === 'dark' ? 'slate.800' : 'white'}
                  borderRadius="lg"
                  p={4}
                  boxShadow="sm"
                >
                  <Stack spacing={2}>
                    <Flex align="center" justify="space-between" gap={2}>
                      <Heading as="h3" size="sm" noOfLines={2} color={colorMode === 'dark' ? 'gray.100' : 'brand.800'}>
                        {l.title}
                      </Heading>
                      <Flex align="center" gap={2}>
                        <Badge colorScheme={l.is_ranked ? 'purple' : 'gray'} variant="subtle">
                          {l.is_ranked ? 'Classée' : 'Non classée'}
                        </Badge>
                        <IconButton
                          aria-label="Supprimer la liste"
                          icon={<DeleteIcon />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleAskDelete(l)}
                        />
                      </Flex>
                    </Flex>
                    <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.700'} noOfLines={3}>
                      {l.description || 'Aucune description'}
                    </Text>
                    {/* Date de création */}
                    {l.created_at && (
                      <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>
                        Créée le {new Date(l.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: '2-digit' })}
                      </Text>
                    )}
                    <Flex justify="flex-end">
                      <Button size="sm" variant="outline" colorScheme="brand" onClick={() => { setSelectedList({ id: l.id, title: l.title, is_ranked: !!l.is_ranked }); fetchSelectedAlbums(l.id); }}>
                        Voir
                      </Button>
                    </Flex>
                  </Stack>
                </Box>
              ))}
            </SimpleGrid>
          )
        )}
      </Box>

      {/* Confirmation suppression */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => { if (!isDeleting) { closeDelete(); setPendingDelete(null); } }}
        isCentered
      >
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Supprimer la liste
          </AlertDialogHeader>
          <AlertDialogBody>
            Es-tu sûr de vouloir supprimer la liste {pendingDelete?.title ? `“${pendingDelete.title}”` : ''} ? Cette action est irréversible.
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={() => { if (!isDeleting) { closeDelete(); setPendingDelete(null); } }}>
              Annuler
            </Button>
            <Button colorScheme="red" onClick={confirmDelete} ml={3} isLoading={isDeleting}>
              Supprimer
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Affichage inline de la mosaïque des albums de la liste sélectionnée */}
      {selectedList && (
        <Box maxW="1100px" mx="auto" px={{ base: 3, md: 4 }} pt={6}>
          <Flex align="center" justify="space-between" mb={3} wrap="wrap" gap={2}>
            <Heading as="h2" size="md" color={colorMode === 'dark' ? 'gray.100' : 'brand.800'}>
              Albums de la liste : {selectedList.title}
            </Heading>
            <Flex gap={2}></Flex>
          </Flex>
          {selectedLoading && (
            <Flex align="center" justify="center" py={8}>
              <Spinner size="lg" />
            </Flex>
          )}
          {selectedError && (
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
              {selectedError}
            </Box>
          )}
          {!selectedLoading && !selectedError && (
            selectedAlbums.length === 0 ? (
              <Text color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>Aucun album dans cette liste.</Text>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <SortableContext items={selectedAlbums.map(a => a.album_id)} strategy={rectSortingStrategy}>
                  <SimpleGrid columns={{ base: 3, sm: 4, md: 6 }} spacing={3}>
                    {selectedAlbums.map((item) => (
                      <SortableAlbumTile key={item.album_id} item={item} colorMode={colorMode} isUpdating={updatingAlbumId === item.album_id} onRemove={() => { setPendingRemove({ album_id: item.album_id, title: item.title }); openRemove(); }} />
                    ))}
                  </SimpleGrid>
                </SortableContext>
                <DragOverlay dropAnimation={null}>
                  {activeId ? (
                    <Box borderRadius="md" boxShadow="lg" overflow="hidden">
                      <AspectRatio ratio={1}>
                        <Image src={selectedAlbums.find(a => a.album_id === activeId)?.cover_url || ''} alt={selectedAlbums.find(a => a.album_id === activeId)?.title || ''} objectFit="cover" />
                      </AspectRatio>
                    </Box>
                  ) : null}
                </DragOverlay>
              </DndContext>
              
            )
          )}
        </Box>
      )}

      {/* Confirmation suppression d'un album de la liste */}
      <AlertDialog
        isOpen={isRemoveOpen}
        leastDestructiveRef={removeCancelRef}
        onClose={() => { if (!isRemoving) { closeRemove(); setPendingRemove(null); } }}
        isCentered
      >
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Retirer l'album de la liste
          </AlertDialogHeader>
          <AlertDialogBody>
            Confirmer la suppression de {pendingRemove?.title ? `“${pendingRemove.title}”` : 'cet album'} de la liste {selectedList?.title ? `“${selectedList.title}”` : ''} ?
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={removeCancelRef} onClick={() => { if (!isRemoving) { closeRemove(); setPendingRemove(null); } }}>
              Annuler
            </Button>
            <Button colorScheme="red" onClick={confirmRemoveAlbum} ml={3} isLoading={isRemoving}>
              Retirer
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Box>
  );
}

function SortableAlbumTile({ item, colorMode, isUpdating, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.album_id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto'
  };
  return (
    <Box ref={setNodeRef} style={style} position="relative" borderRadius="md" overflow="hidden" boxShadow="sm" bg={colorMode === 'dark' ? 'slate.800' : 'white'} {...attributes} {...listeners}>
      <AspectRatio ratio={1}>
        {item.cover_url ? (
          <Image src={item.cover_url} alt={item.title} objectFit="cover" />
        ) : (
          <Flex align="center" justify="center" bg={colorMode === 'dark' ? 'slate.700' : 'gray.100'}>
            <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>Sans pochette</Text>
          </Flex>
        )}
      </AspectRatio>
      {Number.isFinite(Number(item.position)) && (
        <Badge position="absolute" top={2} left={2} colorScheme="brand" borderRadius="md">#{item.position}</Badge>
      )}
      <IconButton aria-label="Retirer l'album de la liste" icon={<DeleteIcon />} size="xs" variant="ghost" colorScheme="red" position="absolute" top={2} right={2} onClick={onRemove} isLoading={isUpdating} />
      <Box position="absolute" bottom={0} left={0} right={0} bg={colorMode === 'dark' ? 'rgba(15,16,30,0.65)' : 'rgba(255,255,255,0.85)'} px={2} py={1}>
        <Text fontSize="xs" fontWeight="semibold" noOfLines={1}>{item.title}</Text>
        {item.artist?.name && (
          <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} noOfLines={1}>{item.artist.name}</Text>
        )}
        {item.year && (
          <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'} noOfLines={1}>{item.year}</Text>
        )}
      </Box>
    </Box>
  );
}
