import { Box, Heading, Text, Avatar, Button, Stack, useColorMode } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export default function ProfilePage({ onLogout, onBack }) {
  const [user, setUser] = useState(null);
  const { colorMode } = useColorMode();

  useEffect(() => {
    setUser(auth.currentUser);
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  if (!user) return null;

  return (
    <Box maxW="400px" mx="auto" mt={10} p={6} bg={colorMode === 'dark' ? 'brand.900' : 'white'} borderRadius="xl" boxShadow="lg" textAlign="center">
      <Avatar size="2xl" name={user.displayName || user.email} src={user.photoURL || undefined} mb={4} />
      <Heading as="h2" size="lg" mb={2}>{user.displayName || 'Utilisateur'}</Heading>
      <Text color="gray.600" mb={2}>{user.email}</Text>
      <Text fontSize="sm" color="gray.400" mb={4}>ID : {user.uid}</Text>
      <Stack direction="row" spacing={4} justify="center" mb={2}>
        <Button
          bg={colorMode === 'dark' ? 'accent.500' : 'purple.500'}
          color={colorMode === 'dark' ? 'brand.900' : 'white'}
          _hover={{ bg: colorMode === 'dark' ? 'accent.600' : 'purple.600' }}
          variant="solid"
          onClick={onBack}
        >
          Retour aux albums
        </Button>
        <Button colorScheme="red" onClick={() => { signOut(auth); onLogout && onLogout(); }}>Se déconnecter</Button>
      </Stack>
    </Box>
  );
}
