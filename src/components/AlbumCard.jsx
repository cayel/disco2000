import { memo } from 'react';
import { Box, Image, Heading, Badge, Text, Tooltip } from '@chakra-ui/react';

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
      bg={colorMode === 'dark' ? 'brand.800' : 'white'}
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
        alignItems="center"
        justifyContent="center"
        transition="opacity 0.3s"
        p={4}
        textAlign="center"
      >
        <Heading as="h2" size="sm" mb={2} color="brand.700" fontWeight="bold" noOfLines={2}>
          {album.title}
        </Heading>
        <Badge bg="accent.500" color="brand.900" fontSize="0.9em" px={2} py={1} borderRadius="md" boxShadow="md" mb={2}>
          {album.year}
        </Badge>
        <Text fontWeight="bold" color="accent.600" fontSize="md" noOfLines={1}>
          {album.artist}
        </Text>
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

