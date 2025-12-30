import { memo, useState } from 'react';
import { Box, Image, Heading, Badge, Text, Tooltip, IconButton, Link, Popover, PopoverTrigger, PopoverContent, PopoverArrow, PopoverBody, Input, Stack, Flex, useToast, Portal } from '@chakra-ui/react';
import authFetch from '../utils/authFetch';
import { getCookie } from '../utils/cookie';

// Icônes pour CD et vinyle
const CdIcon = (props) => (
  <svg viewBox="0 0 32 32" width="22" height="22" {...props}>
    <defs>
      <radialGradient id="cd-rainbow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff" />
        <stop offset="60%" stopColor="#b3e0ff" />
        <stop offset="80%" stopColor="#f0c" />
        <stop offset="100%" stopColor="#aaf" />
      </radialGradient>
    </defs>
    <circle cx="16" cy="16" r="14" fill="url(#cd-rainbow)" stroke="#bbb" strokeWidth="2" />
    <circle cx="16" cy="16" r="4" fill="#222" stroke="#fff" strokeWidth="1.5" />
  </svg>
);

const VinylIcon = (props) => (
  <svg viewBox="0 0 32 32" width="22" height="22" {...props}>
    <circle cx="16" cy="16" r="14" fill="#222" stroke="#111" strokeWidth="2" />
    <circle cx="16" cy="16" r="4.5" fill="#e53e3e" stroke="#fff" strokeWidth="1.5" />
    <circle cx="16" cy="16" r="1.5" fill="#fff" />
    <path d="M16 2a14 14 0 0 1 0 28" stroke="#444" strokeWidth="1" fill="none" />
    <path d="M16 30a14 14 0 0 1 0-28" stroke="#444" strokeWidth="1" fill="none" />
  </svg>
);

const BothIcon = (props) => (
  <svg viewBox="0 0 32 32" width="22" height="22" {...props}>
    <circle cx="16" cy="16" r="14" fill="#222" stroke="#111" strokeWidth="2" />
    <circle cx="16" cy="16" r="4.5" fill="#e53e3e" stroke="#fff" strokeWidth="1.5" />
    <circle cx="16" cy="16" r="1.5" fill="#fff" />
    <path d="M16 2a14 14 0 0 1 0 28" stroke="#444" strokeWidth="1" fill="none" />
    <path d="M16 30a14 14 0 0 1 0-28" stroke="#444" strokeWidth="1" fill="none" />
    <circle cx="22" cy="10" r="7" fill="url(#cd-rainbow)" stroke="#bbb" strokeWidth="1.5" />
    <circle cx="22" cy="10" r="2" fill="#222" stroke="#fff" strokeWidth="1" />
    <defs>
      <radialGradient id="cd-rainbow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff" />
        <stop offset="60%" stopColor="#b3e0ff" />
        <stop offset="80%" stopColor="#f0c" />
        <stop offset="100%" stopColor="#aaf" />
      </radialGradient>
    </defs>
  </svg>
);

const AlbumCard = memo(({ album, index, colorMode, isUser, onClick, viewMode = 'grid' }) => {
  const hasCollection = isUser && 
    typeof album.collection !== 'undefined' && 
    album.collection && 
    typeof album.collection === 'object' && 
    (album.collection.cd || album.collection.vinyl);

  const collectionIcon = hasCollection ? (
    album.collection.cd && album.collection.vinyl ? (
      <BothIcon />
    ) : album.collection.cd ? (
      <CdIcon />
    ) : (
      <VinylIcon />
    )
  ) : null;

  const collectionLabel = hasCollection ? (
    album.collection.cd && album.collection.vinyl
      ? 'Dans ta collection (CD & Vinyle)'
      : album.collection.cd
      ? 'Dans ta collection (CD)'
      : 'Dans ta collection (Vinyle)'
  ) : '';

  // Mode compact : overlay minimal
  const isCompactMode = viewMode === 'compact';

  const toast = useToast();
  const [listsOpen, setListsOpen] = useState(false);
  const [lists, setLists] = useState([]);
  const [listsLoading, setListsLoading] = useState(false);
  const [listsError, setListsError] = useState(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [addingListId, setAddingListId] = useState(null);
  const [presentMap, setPresentMap] = useState({}); // { [listId]: boolean }
  const [hydratingPresence, setHydratingPresence] = useState(false);

  const loadLists = async () => {
    const jwt = getCookie('jwt');
    if (!jwt || !isUser) return;
    setListsLoading(true);
    setListsError(null);
    try {
      const res = await authFetch(`${import.meta.env.VITE_API_URL}/api/lists`, { method: 'GET' }, { label: 'albumcard-lists' });
      if (!res.ok) throw new Error('Erreur lors du chargement des listes');
      const data = await res.json().catch(() => []);
      setLists(Array.isArray(data) ? data : []);
      // Hydrater la présence pour les premières listes visibles (évite de marquer manuellement)
      const albumId = album?.id ?? album?.album_id;
      if (albumId && Array.isArray(data) && data.length > 0) {
        setHydratingPresence(true);
        const pageSize = 30;
        const pageItems = data.slice(0, pageSize);
        const checks = pageItems.map(async (l) => {
          try {
            const r = await authFetch(`${import.meta.env.VITE_API_URL}/api/lists/${l.id}/albums`, { method: 'GET' }, { label: 'albumcard-membership' });
            if (!r.ok) return { id: l.id, present: false };
            const albums = await r.json().catch(() => []);
            const present = Array.isArray(albums) && albums.some(a => String(a.album_id) === String(albumId));
            return { id: l.id, present };
          } catch {
            return { id: l.id, present: false };
          }
        });
        const results = await Promise.allSettled(checks);
        const map = {};
        results.forEach(res => {
          if (res.status === 'fulfilled' && res.value) {
            map[res.value.id] = res.value.present;
          }
        });
        setPresentMap(prev => ({ ...prev, ...map }));
        setHydratingPresence(false);
      }
    } catch (err) {
      setListsError(err.message || 'Erreur réseau');
    } finally {
      setListsLoading(false);
    }
  };

  const addToList = async (listId, listTitle) => {
    try {
      const albumId = album?.id ?? album?.album_id;
      if (!albumId) throw new Error("Identifiant d'album manquant");
      setAddingListId(listId);
      const res = await authFetch(`${import.meta.env.VITE_API_URL}/api/lists/${listId}/albums`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ album_id: albumId })
      }, { label: `albumcard-add-${listId}` });
      if (!res.ok) {
        // Essayer de lire un message JSON propre si disponible
        let msg = 'Erreur lors de l\'ajout';
        if (res.status === 409) {
          // Conflit: probablement déjà présent
          setPresentMap(prev => ({ ...prev, [listId]: true }));
          toast({ title: 'Déjà dans la liste', description: listTitle ? `“${album.title}” est déjà présent dans ${listTitle}` : undefined, status: 'info', duration: 2500, position: 'top-right' });
          return;
        }
        try {
          const data = await res.json();
          if (data && (data.message || data.error)) msg = data.message || data.error;
          else {
            const txt = await res.text();
            if (txt) msg = txt;
          }
        } catch (_) {
          const txt = await res.text().catch(() => '');
          if (txt) msg = txt;
        }
        throw new Error(msg || `Erreur ${res.status}`);
      }
      toast({ title: 'Ajouté à la liste', description: listTitle ? `“${album.title}” → ${listTitle}` : undefined, status: 'success', duration: 2500, position: 'top-right' });
      setPresentMap(prev => ({ ...prev, [listId]: true }));
      setListsOpen(false);
    } catch (err) {
      toast({ title: 'Ajout impossible', description: err.message || 'Erreur réseau', status: 'error', duration: 3500, position: 'top-right' });
    }
    finally {
      setAddingListId(null);
    }
  };

  const removeFromList = async (listId, listTitle) => {
    try {
      const albumId = album?.id ?? album?.album_id;
      if (!albumId) throw new Error("Identifiant d'album manquant");
      setAddingListId(listId);
      const res = await authFetch(`${import.meta.env.VITE_API_URL}/api/lists/${listId}/albums/${albumId}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      }, { label: `albumcard-remove-${listId}` });
      if (res.status === 204) {
        toast({ title: 'Retiré de la liste', description: listTitle ? `“${album.title}” ← ${listTitle}` : undefined, status: 'success', duration: 2500, position: 'top-right' });
        setPresentMap(prev => ({ ...prev, [listId]: false }));
        return;
      }
      let msg = 'Erreur lors du retrait';
      try {
        const data = await res.json();
        if (data && (data.message || data.error)) msg = data.message || data.error;
        else {
          const txt = await res.text();
          if (txt) msg = txt;
        }
      } catch (_) {
        const txt = await res.text().catch(() => '');
        if (txt) msg = txt;
      }
      throw new Error(msg || `Erreur ${res.status}`);
    } catch (err) {
      toast({ title: 'Retrait impossible', description: err.message || 'Erreur réseau', status: 'error', duration: 3500, position: 'top-right' });
    } finally {
      setAddingListId(null);
    }
  };

  return (
    <Box
      key={album.id ? album.id : `${album.title}-${album.year}-${index}`}
      position="relative"
      borderRadius="xl"
      overflow="hidden"
      boxShadow="xl"
  bg={colorMode === 'dark' ? 'slate.800' : 'white'}
      _hover={{ boxShadow: '2xl', transform: 'scale(1.04)' }}
      aspectRatio={1}
      cursor="pointer"
      transition="all 0.3s"
      onClick={onClick}
      role="group"
    >
      {album.cover_url && (
        <Box position="relative" w="100%" h="100%">
          <Image
            src={album.cover_url}
            alt={album.title}
            objectFit="cover"
            w="100%"
            h="100%"
            transition="all 0.3s"
            loading="lazy"
            decoding="async"
          />
          
          {/* Informations visibles en permanence selon le mode */}
          {!isCompactMode && (
            <Box
              position="absolute"
              bottom={0}
              left={0}
              right={0}
              bg={colorMode === 'dark' ? 'rgba(10,10,25,0.90)' : 'rgba(255,255,255,0.90)'}
              backdropFilter="blur(4px)"
              p={{ base: 2, md: 2 }}
              borderBottomRadius="xl"
            >
              <Text
                fontSize={{ base: "2xs", sm: "xs" }}
                fontWeight="bold"
                noOfLines={1}
                color={colorMode === 'dark' ? 'brand.300' : 'brand.600'}
              >
                {album.title}
              </Text>
              <Flex justify="space-between" align="center" mt={{ base: 0.5, md: 0.5 }}>
                <Text
                  fontSize={{ base: "3xs", sm: "2xs" }}
                  color={colorMode === 'dark' ? 'slate.300' : 'slate.600'}
                  noOfLines={1}
                  flex={1}
                >
                  {album.artist}
                </Text>
                <Badge fontSize={{ base: "3xs", sm: "2xs" }} colorScheme="purple" ml={1}>
                  {album.year}
                </Badge>
              </Flex>
            </Box>
          )}
          
          {hasCollection && (
            <Tooltip
              label={collectionLabel}
              placement="top"
              hasArrow
            >
              <Box 
                position="absolute" 
                top={1} 
                right={1} 
                zIndex={2} 
                bg="whiteAlpha.900" 
                borderRadius="full" 
                p={0.5} 
                boxShadow="lg" 
                border="2px solid #805ad5" 
                display="flex" 
                alignItems="center" 
                justifyContent="center" 
                minW="28px" 
                minH="28px"
              >
                {collectionIcon}
              </Box>
            </Tooltip>
          )}
          {/* Bouton discret d'ajout à une liste - placé au-dessus de l'image pour être toujours visible */}
          {isUser && (
            <Box
              position="absolute"
              top={2}
              left={2}
              zIndex={3}
              onClick={(e) => e.stopPropagation()}
              opacity={0}
              transition="opacity 0.2s"
              _groupHover={{ opacity: 1 }}
            >
              <Popover isOpen={listsOpen} onClose={() => setListsOpen(false)} placement="right-start" closeOnBlur={true} closeOnEsc={true}>
                <PopoverTrigger>
                  <Tooltip label="Ajouter à une liste" hasArrow>
                    <IconButton
                      aria-label="Ajouter à une liste"
                      size="xs"
                      variant="solid"
                      colorScheme="brand"
                      icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4h4a2 2 0 0 1 2 2v3h3a2 2 0 1 1 0 4h-3v3a2 2 0 1 1-4 0v-3H9a2 2 0 1 1 0-4h3V6a2 2 0 0 1-2-2z"/></svg>}
                      onClick={(e) => { e.stopPropagation(); setFilterQuery(''); setListsOpen(true); loadLists(); }}
                    />
                  </Tooltip>
                </PopoverTrigger>
                <Portal>
                  <PopoverContent w="260px" zIndex={1500}>
                    <PopoverArrow />
                    <PopoverBody>
                    {listsLoading ? (
                      <Flex align="center" gap={2}><Badge>Chargement…</Badge></Flex>
                    ) : listsError ? (
                      <Text fontSize="xs" color="red.500">{listsError}</Text>
                    ) : (
                      <Box>
                        <Input size="xs" placeholder="Rechercher une liste…" value={filterQuery} onChange={(e) => setFilterQuery(e.target.value)} mb={2} />
                        <Box maxH="200px" overflowY="auto">
                          <Stack spacing={1}>
                            {(() => {
                              const q = filterQuery.trim().toLowerCase();
                              const filtered = q ? lists.filter(l => String(l.title || '').toLowerCase().includes(q)) : lists;
                              const pageSize = 30;
                              const pageItems = filtered.slice(0, pageSize);
                              return (
                                <>
                                  {pageItems.map(l => (
                                    <Flex
                                      key={l.id}
                                      align="center"
                                      justify="space-between"
                                      px={2}
                                      py={1}
                                      borderRadius="md"
                                      _hover={{ bg: 'gray.50' }}
                                      cursor="pointer"
                                      role="button"
                                      tabIndex={0}
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToList(l.id, l.title); }}
                                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); addToList(l.id, l.title); } }}
                                    >
                                      <Flex align="center" gap={2}>
                                        {presentMap[l.id] === true && (
                                          <Badge colorScheme="green" variant="solid" fontSize="0.6rem">✓</Badge>
                                        )}
                                        {hydratingPresence && typeof presentMap[l.id] === 'undefined' && (
                                          <Badge colorScheme="gray" variant="subtle" fontSize="0.6rem">…</Badge>
                                        )}
                                        <Text fontSize="xs" noOfLines={1}>{l.title}</Text>
                                      </Flex>
                                      {presentMap[l.id] === true ? (
                                        <IconButton aria-label="Retirer" size="xs" variant="ghost" colorScheme="red" onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFromList(l.id, l.title); }} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12M9 9v9m6-9v9"/></svg>} isLoading={addingListId === l.id} />
                                      ) : (
                                        <IconButton aria-label="Ajouter" size="xs" variant="ghost" onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToList(l.id, l.title); }} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5v14m-7-7h14"/></svg>} isLoading={addingListId === l.id} />
                                      )}
                                    </Flex>
                                  ))}
                                </>
                              );
                            })()}
                          </Stack>
                        </Box>
                      </Box>
                    )}
                    </PopoverBody>
                  </PopoverContent>
                </Portal>
              </Popover>
            </Box>
          )}
        </Box>
      )}
      {/* Overlay d'info au survol */}
      <Box
        position="absolute"
        top={0}
        left={0}
        w="100%"
        h="100%"
        bg="rgba(35,37,38,0.92)"
        color="#f5f6fa"
        opacity={0}
        _hover={{ opacity: 1 }}
        display="flex"
        flexDirection="column"
        justifyContent={isCompactMode ? "center" : "space-between"}
        transition="opacity 0.3s"
        p={isCompactMode ? 2 : 3}
      >
        {/* Mode compact : juste titre et artiste au centre */}
        {isCompactMode ? (
          <Box textAlign="center" px={1}>
            <Text fontWeight="bold" fontSize="xs" noOfLines={2} color="brand.300">
              {album.title}
            </Text>
            <Text fontSize="2xs" color="slate.300" noOfLines={1} mt={0.5}>
              {album.artist}
            </Text>
          </Box>
        ) : (
          <>
            {/* Mode normal ou détaillé : barre supérieure avec année */}
            <Box display="flex" alignItems="center" justifyContent="space-between" px={1}>
              <Badge
                variant="subtle"
                colorScheme="gray"
                fontSize="0.7em"
                px={2}
                py={0.5}
                borderRadius="md"
                bg="rgba(255,255,255,0.15)"
              >
                {album.year}
              </Badge>
            </Box>

            {/* Contenu centré: titre + artiste */}
            <Box textAlign="center" px={2}>
              <Heading as="h2" size="sm" mb={2} color="brand.300" fontWeight="bold" noOfLines={2}>
                {album.title}
              </Heading>
              <Text fontWeight="semibold" color="slate.200" fontSize="sm" noOfLines={1}>
                {album.artist}
              </Text>
            </Box>

            {/* Barre inférieure: action Apple Music */}
            <Box display="flex" alignItems="center" justifyContent="flex-end" px={1}>
              <Tooltip label="Écouter sur Apple Music" placement="top" hasArrow>
                <Link
                  href={`https://music.apple.com/fr/search?term=${encodeURIComponent(`${album.artist} ${album.title}`)}`}
                  isExternal
                  onClick={(e) => e.stopPropagation()}
                  _hover={{ textDecoration: 'none' }}
                >
                  <IconButton
                    icon={
                      <svg width="20" height="20" viewBox="0 0 814 1000" fill="currentColor">
                        <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
                      </svg>
                    }
                    aria-label="Apple Music"
                    size="sm"
                    variant="solid"
                    bg="linear-gradient(135deg, #FA233B 0%, #FB5C74 100%)"
                    color="white"
                    borderRadius="full"
                    _hover={{
                      transform: 'scale(1.15)',
                      boxShadow: '0 0 20px rgba(250, 35, 59, 0.6)'
                    }}
                    _active={{
                      transform: 'scale(1.05)'
                    }}
                    transition="all 0.2s"
                  />
                </Link>
              </Tooltip>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}, (prevProps, nextProps) => {
  // Comparaison personnalisée pour éviter les re-renders inutiles
  return (
    prevProps.album.id === nextProps.album.id &&
    prevProps.album.title === nextProps.album.title &&
    prevProps.album.artist === nextProps.album.artist &&
    prevProps.album.year === nextProps.album.year &&
    prevProps.album.cover_url === nextProps.album.cover_url &&
    prevProps.colorMode === nextProps.colorMode &&
    prevProps.isUser === nextProps.isUser &&
    prevProps.viewMode === nextProps.viewMode &&
    JSON.stringify(prevProps.album.collection) === JSON.stringify(nextProps.album.collection)
  );
});

AlbumCard.displayName = 'AlbumCard';

export default AlbumCard;

