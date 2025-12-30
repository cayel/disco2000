import { Box, HStack, VStack, Text, useColorMode, Flex } from '@chakra-ui/react';

/**
 * Composant de contrôles de vue pour la grille d'albums
 * Permet de changer la taille des pochettes et le mode d'affichage
 */
export default function ViewControls({ viewMode, onViewModeChange, gridSize, onGridSizeChange }) {
  const { colorMode } = useColorMode();

  const viewModes = [
    { value: 'grid', label: 'Grille', icon: '▦' },
    { value: 'compact', label: 'Compact', icon: '▪' },
  ];

  const gridSizes = [
    { value: 2, dots: 2 },
    { value: 3, dots: 3 },
    { value: 4, dots: 4 },
    { value: 5, dots: 5 },
    { value: 6, dots: 6 },
    { value: 8, dots: 8 },
  ];

  return (
    <VStack align="stretch" spacing={4}>
      {/* Mode d'affichage */}
      <Box>
        <Text fontSize="xs" fontWeight="semibold" mb={2} color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
          Mode
        </Text>
        <HStack spacing={2}>
          {viewModes.map(mode => (
            <Box
              key={mode.value}
              flex={1}
              px={3}
              py={2}
              borderRadius="lg"
              cursor="pointer"
              textAlign="center"
              transition="all 0.2s"
              bg={viewMode === mode.value 
                ? (colorMode === 'dark' ? 'purple.600' : 'purple.500')
                : (colorMode === 'dark' ? 'slate.700' : 'gray.100')
              }
              color={viewMode === mode.value ? 'white' : (colorMode === 'dark' ? 'gray.300' : 'gray.700')}
              _hover={{
                bg: viewMode === mode.value 
                  ? (colorMode === 'dark' ? 'purple.500' : 'purple.600')
                  : (colorMode === 'dark' ? 'slate.600' : 'gray.200'),
                transform: 'translateY(-2px)',
                boxShadow: 'md',
              }}
              onClick={() => onViewModeChange(mode.value)}
              fontWeight={viewMode === mode.value ? 'bold' : 'medium'}
              fontSize="sm"
            >
              <Text fontSize="lg" mb={1}>{mode.icon}</Text>
              <Text fontSize="xs">{mode.label}</Text>
            </Box>
          ))}
        </HStack>
      </Box>

      {/* Taille des pochettes */}
      <Box>
        <Text fontSize="xs" fontWeight="semibold" mb={2} color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
          Taille
        </Text>
        <HStack spacing={2} justify="space-between">
          {gridSizes.map(size => (
            <Box
              key={size.value}
              w="40px"
              h="40px"
              borderRadius="md"
              cursor="pointer"
              display="flex"
              alignItems="center"
              justifyContent="center"
              transition="all 0.2s"
              bg={gridSize === size.value 
                ? (colorMode === 'dark' ? 'purple.600' : 'purple.500')
                : (colorMode === 'dark' ? 'slate.700' : 'gray.100')
              }
              borderWidth={gridSize === size.value ? '2px' : '1px'}
              borderColor={gridSize === size.value 
                ? (colorMode === 'dark' ? 'purple.400' : 'purple.600')
                : 'transparent'
              }
              _hover={{
                transform: 'scale(1.1)',
                boxShadow: 'lg',
                bg: gridSize === size.value 
                  ? (colorMode === 'dark' ? 'purple.500' : 'purple.600')
                  : (colorMode === 'dark' ? 'slate.600' : 'gray.200'),
              }}
              onClick={() => onGridSizeChange(size.value)}
            >
              <Flex flexWrap="wrap" gap="2px" maxW="20px" justify="center">
                {Array.from({ length: Math.min(size.dots, 9) }).map((_, i) => (
                  <Box
                    key={i}
                    w={size.dots <= 4 ? '4px' : '3px'}
                    h={size.dots <= 4 ? '4px' : '3px'}
                    borderRadius="full"
                    bg={gridSize === size.value ? 'white' : (colorMode === 'dark' ? 'gray.400' : 'gray.600')}
                  />
                ))}
              </Flex>
            </Box>
          ))}
        </HStack>
      </Box>
    </VStack>
  );
}
