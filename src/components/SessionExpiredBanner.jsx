import { Alert, AlertIcon, AlertTitle, AlertDescription, Box, Flex } from '@chakra-ui/react';
import GoogleAuthButton from './GoogleAuthButton';
import { getCookie } from '../utils/cookie';

export default function SessionExpiredBanner({ jwtToken }) {
  const hasJwt = Boolean(jwtToken && !getCookie('jwt') === false);
  if (hasJwt) return null;
  return (
    <Box position="fixed" top={0} left={0} right={0} zIndex={1000}>
      <Alert status="warning" variant="subtle" borderRadius={0}>
        <Flex w="100%" align="center" justify="space-between" gap={4}>
          <Flex align="center" gap={3}>
            <AlertIcon />
            <AlertTitle>Session expirée</AlertTitle>
            <AlertDescription>Veuillez vous reconnecter pour continuer.</AlertDescription>
          </Flex>
          <GoogleAuthButton onLoginSuccess={() => { /* no-op, App.jsx écoutera jwt-updated */ }} jwtToken={jwtToken} />
        </Flex>
      </Alert>
    </Box>
  );
}
