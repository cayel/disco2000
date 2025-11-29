import { Box, Spinner } from '@chakra-ui/react';

/**
 * Composant de chargement pour les lazy-loaded components
 */
export const LoadingFallback = ({ fullHeight = true, size = 'xl' }) => {
  return (
    <Box
      minH={fullHeight ? '100vh' : '200px'}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Spinner size={size} color="purple.500" thickness="4px" />
    </Box>
  );
};

export default LoadingFallback;
