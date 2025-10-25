import { useState } from 'react';
import { Box, Button, Input, FormControl, FormLabel, useToast, useColorMode, Flex, Icon, Text } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { getCookie } from '../utils/cookie';

export default function AddStudioAlbum({ onAlbumAdded }) {
  const [masterId, setMasterId] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { colorMode } = useColorMode();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!masterId || isNaN(Number(masterId))) {
      toast({ title: 'Master ID invalide', status: 'error', duration: 3000 });
      return;
    }
    setLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL;
      const apiKey = import.meta.env.VITE_API_KEY;
      const jwt = getCookie('jwt');
      const res = await fetch(`${apiBase}/api/albums/studio?master_id=${masterId}`, {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Authorization': jwt ? `Bearer ${jwt}` : ''
        }
      });
      if (!res.ok) throw new Error('Erreur API');
  toast({ title: 'Album studio ajouté !', status: 'success', duration: 3000 });
  setMasterId('');
  if (onAlbumAdded) onAlbumAdded();
    } catch (err) {
      toast({ title: err.message || 'Erreur', status: 'error', duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit} w="100%" p={6} borderRadius="2xl" bg="none" boxShadow="none" border="none">
      <Flex align="center" mb={2} gap={2} justify="center" mt={1}>
        <Icon as={AddIcon} color="purple.400" boxSize={6} />
        <Text fontWeight="bold" fontSize="lg" color={colorMode === 'dark' ? 'purple.200' : 'purple.700'}>
          Ajouter un album studio
        </Text>
      </Flex>
      <FormControl mb={5} isRequired>
        <FormLabel fontWeight="semibold">Identifiant Discogs (master_id)</FormLabel>
        <Input
          type="number"
          value={masterId}
          onChange={e => setMasterId(e.target.value)}
          placeholder="ex : 123456"
          min={1}
          bg={colorMode === 'dark' ? 'brand.900' : 'white'}
          borderColor={colorMode === 'dark' ? 'purple.900' : 'purple.200'}
          _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px #9f7aea' }}
          fontWeight="medium"
          fontSize="md"
        />
      </FormControl>
      <Button
        type="submit"
        colorScheme="purple"
        isLoading={loading}
        w="100%"
        leftIcon={<AddIcon />}
        size="lg"
        fontWeight="bold"
        borderRadius="full"
        boxShadow="md"
      >
        Ajouter
      </Button>
    </Box>
  );
}
