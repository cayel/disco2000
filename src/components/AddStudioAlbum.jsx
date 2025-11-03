import { useState } from 'react';
import { Box, Button, Input, FormControl, FormLabel, useToast, useColorMode, Flex, Icon, Text, Switch } from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { getCookie } from '../utils/cookie';

export default function AddStudioAlbum() {
  const [id, setId] = useState('');
  const [mode, setMode] = useState('master'); // 'master' ou 'release'
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { colorMode } = useColorMode();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!id || isNaN(Number(id))) {
      toast({ title: `${mode === 'master' ? 'Master' : 'Release'} ID invalide`, status: 'error', duration: 3000 });
      return;
    }
    setLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL;
      const apiKey = import.meta.env.VITE_API_KEY;
      const jwt = getCookie('jwt');
      const url = `${apiBase}/api/albums/studio?discogs_id=${id}&discogs_type=${mode}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Authorization': jwt ? `Bearer ${jwt}` : ''
        }
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        const errorMessage = payload?.message || `Erreur ${res.status}: ${res.statusText}`;
        throw new Error(errorMessage);
      }
      toast({
        title: 'Album studio ajouté',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      setId('');
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
      <FormControl display="flex" alignItems="center" mb={2}>
        <Switch
          id="mode-switch"
          isChecked={mode === 'release'}
          onChange={() => setMode(mode === 'master' ? 'release' : 'master')}
          colorScheme="purple"
          mr={2}
        />
        <FormLabel htmlFor="mode-switch" mb={0} fontWeight="semibold" cursor="pointer">
          {mode === 'master' ? 'Mode master (par défaut)' : 'Mode release'}
        </FormLabel>
      </FormControl>
      <FormControl mb={5} isRequired>
        <FormLabel fontWeight="semibold">
          Identifiant Discogs ({mode === 'master' ? 'master_id' : 'release_id'})
        </FormLabel>
        <Input
          type="number"
          value={id}
          onChange={e => setId(e.target.value)}
          placeholder={mode === 'master' ? 'ex : 123456 (master)' : 'ex : 654321 (release)'}
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
