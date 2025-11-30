import { memo } from 'react';
import { Box, Image, Heading, Badge, Text, Tooltip, IconButton, Link } from '@chakra-ui/react';

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

const AlbumCard = memo(({ album, index, colorMode, isUser, onClick }) => {
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
        </Box>
      )}
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
        justifyContent="space-between"
        transition="opacity 0.3s"
        p={3}
      >
        {/* Barre supérieure: année discrète */}
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

        {/* Barre inférieure: action Apple Music éloignée du nom d'artiste */}
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
    JSON.stringify(prevProps.album.collection) === JSON.stringify(nextProps.album.collection)
  );
});

AlbumCard.displayName = 'AlbumCard';

export default AlbumCard;

