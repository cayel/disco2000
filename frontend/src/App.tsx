import { Container, Heading, Text, VStack, Button, Spinner, HStack, Input } from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchRecords, createRecord, Record } from './services/api';
import { useState } from 'react';

export default function App() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ['records'], queryFn: fetchRecords });
  const [titre, setTitre] = useState('');
  const [discogsId, setDiscogsId] = useState('');
  const mutation = useMutation({
    mutationFn: () => createRecord({
      discogs_id: discogsId || Math.random().toString(36).slice(2),
      titre: titre || 'Titre démo',
      artistes: ['Artiste démo'],
      annee: 1999,
      genres: ['Rock'],
      cover_url: null
    }),
    onSuccess: () => {
      setTitre('');
      setDiscogsId('');
      queryClient.invalidateQueries({ queryKey: ['records'] });
    }
  });

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading as="h1" size="xl">Disco2000</Heading>
        <Text>Connexion front-back démontrée. Ajoute un record ci-dessous.</Text>
        <HStack>
          <Input placeholder="Titre" value={titre} onChange={(e) => setTitre(e.target.value)} />
          <Input placeholder="Discogs ID" value={discogsId} onChange={(e) => setDiscogsId(e.target.value)} />
          <Button onClick={() => mutation.mutate()} isLoading={mutation.isPending} colorScheme="teal">Ajouter</Button>
        </HStack>
        {isLoading && <Spinner />}
        {isError && <Text color="red.500">Erreur de chargement.</Text>}
        {data && data.length === 0 && <Text>Aucun record pour le moment.</Text>}
        {data && data.map((r: Record) => (
          <HStack key={r.id} borderWidth="1px" borderRadius="md" p={3} justify="space-between">
            <VStack align="start" spacing={0}>
              <Text fontWeight="bold">{r.titre}</Text>
              <Text fontSize="sm" color="gray.600">ID Discogs: {r.discogs_id}</Text>
            </VStack>
            <Text fontSize="sm">Année: {r.annee}</Text>
          </HStack>
        ))}
      </VStack>
    </Container>
  );
}
