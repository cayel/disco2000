import { Box, Heading, Text, Avatar, Button, Stack, useColorMode, Tag } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { getCookie, deleteCookie } from '../utils/cookie';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export default function ProfilePage({ onLogout, onBack }) {
  const [user, setUser] = useState(null);
  const { colorMode } = useColorMode();
  const [jwt, setJwt] = useState(null);
  const [jwtPayload, setJwtPayload] = useState(null);
  // Décodage du payload JWT
  useEffect(() => {
    if (jwt) {
      try {
        const base64Url = jwt.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        setJwtPayload(JSON.parse(jsonPayload));
      } catch (e) {
        setJwtPayload(null);
      }
    } else {
      setJwtPayload(null);
    }
  }, [jwt]);

  // Toujours relire le cookie JWT à chaque affichage du profil
  useEffect(() => {
    setJwt(getCookie('jwt'));
    const handler = (e) => setJwt(e.detail);
    window.addEventListener('jwt-updated', handler);
    return () => window.removeEventListener('jwt-updated', handler);
  }, []);

  useEffect(() => {
    setUser(auth.currentUser);
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  if (!user) return null;

  return (
    <Box maxW="400px" mx="auto" mt={10} p={6} bg={colorMode === 'dark' ? 'brand.900' : 'white'} borderRadius="xl" boxShadow="lg" textAlign="center">
      {jwtPayload && (
        <>
          <Avatar size="2xl" name={jwtPayload.first_name + ' ' + jwtPayload.last_name} mb={4} />
          <Heading as="h2" size="lg" mb={2}>{jwtPayload.first_name} {jwtPayload.last_name}</Heading>
          <Text color="gray.600" mb={2}>{jwtPayload.email}</Text>
          <Stack direction="row" spacing={2} justify="center" mb={4}>
            {Array.isArray(jwtPayload.roles) && jwtPayload.roles.map(role => (
              <Tag key={role} colorScheme="purple" borderRadius="full" px={3} py={1} fontWeight="bold">{role}</Tag>
            ))}
          </Stack>
        </>
      )}
      <Stack direction="row" spacing={4} justify="center" mb={2}>
  <Button colorScheme="red" onClick={() => { signOut(auth); deleteCookie('jwt'); window.dispatchEvent(new CustomEvent('jwt-updated', { detail: null })); onLogout && onLogout(); }}>Se déconnecter</Button>
      </Stack>
    </Box>
  );
}
