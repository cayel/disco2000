import { useState } from 'react';
import {
  Box,
  Button,
  Input,
  Textarea,
  FormControl,
  FormLabel,
  Switch,
  useToast,
  useColorMode,
  Flex,
  Text,
  Icon
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import authFetch from '../utils/authFetch';

export default function CreateList({ onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isRanked, setIsRanked] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { colorMode } = useColorMode();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: 'Titre requis', status: 'error', duration: 3000, position: 'top-right' });
      return;
    }
    setLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL;
      const res = await authFetch(
        `${apiBase}/api/lists`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            is_ranked: !!isRanked
          })
        },
        { label: 'create-list' }
      );

      const payload = await res.json().catch(() => null);
      if (res.status !== 201) {
        const message = payload?.message || `Erreur ${res.status}: ${res.statusText}`;
        throw new Error(message);
      }

      toast({
        title: 'Liste créée',
        description: payload?.title ? `"${payload.title}" a été créée` : 'La liste a été créée',
        status: 'success',
        duration: 4000,
        isClosable: true,
        position: 'top-right'
      });
      // Reset du formulaire
      setTitle('');
      setDescription('');
      setIsRanked(false);
      if (onCreated) onCreated(payload);
    } catch (err) {
      toast({
        title: 'Erreur lors de la création',
        description: err.message || 'Impossible de créer la liste',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit} w="100%" p={6} borderRadius="2xl" bg={colorMode === 'dark' ? 'rgba(35, 37, 38, 0.92)' : 'white'} boxShadow="lg" borderWidth={colorMode === 'dark' ? 1 : 0} borderColor={colorMode === 'dark' ? 'whiteAlpha.200' : 'gray.100'}>
      <Flex align="center" mb={4} gap={2} justify="center" mt={1}>
        <Icon as={AddIcon} color="purple.400" boxSize={5} />
        <Text fontWeight="bold" fontSize="lg" color={colorMode === 'dark' ? 'purple.200' : 'purple.700'}>
          Créer une liste
        </Text>
      </Flex>

      <FormControl mb={4} isRequired>
        <FormLabel fontWeight="semibold">Titre</FormLabel>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Mes albums préférés"
          bg={colorMode === 'dark' ? 'slate.900' : 'white'}
          borderColor={colorMode === 'dark' ? 'purple.900' : 'purple.200'}
          _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px #9f7aea' }}
        />
      </FormControl>

      <FormControl mb={4}>
        <FormLabel fontWeight="semibold">Description</FormLabel>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Une liste de mes albums favoris de tous les temps"
          rows={4}
          bg={colorMode === 'dark' ? 'slate.900' : 'white'}
          borderColor={colorMode === 'dark' ? 'purple.900' : 'purple.200'}
          _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px #9f7aea' }}
        />
      </FormControl>

      <FormControl display="flex" alignItems="center" mb={6}>
        <Switch
          id="is-ranked-switch"
          isChecked={isRanked}
          onChange={() => setIsRanked((v) => !v)}
          colorScheme="purple"
          mr={2}
        />
        <FormLabel htmlFor="is-ranked-switch" mb={0} fontWeight="semibold" cursor="pointer">
          Classée (oui/non)
        </FormLabel>
      </FormControl>

      <Button
        type="submit"
        colorScheme="purple"
        isLoading={loading}
        isDisabled={!title.trim()}
        w="100%"
        leftIcon={<AddIcon />}
        size="lg"
        fontWeight="bold"
        borderRadius="full"
        boxShadow="md"
      >
        Créer la liste
      </Button>
    </Box>
  );
}
