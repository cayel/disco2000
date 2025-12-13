import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Button,
  useColorMode,
  Spinner,
  Text,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  useDisclosure,
  InputGroup,
  InputLeftElement,
  IconButton,
  Flex,
  Badge,
} from '@chakra-ui/react';
import { SearchIcon, EditIcon } from '@chakra-ui/icons';
import authFetch from '../utils/authFetch';
import CountrySelector from './CountrySelector';

// Convertir un code pays ISO en emoji drapeau
const getCountryFlag = (countryCode) => {
  if (!countryCode || countryCode.length !== 2) return '🏳️';
  
  // Les emojis de drapeaux utilisent les Regional Indicator Symbols
  // A = U+1F1E6, B = U+1F1E7, etc.
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 0x1F1E6 + char.charCodeAt(0) - 65);
  
  return String.fromCodePoint(...codePoints);
};

function ArtistManager() {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [countryInput, setCountryInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [updating, setUpdating] = useState(false);

  // Récupération de la liste des artistes
  useEffect(() => {
    const fetchArtists = async () => {
      try {
        setLoading(true);
        const apiBase = import.meta.env.VITE_API_URL;
        const response = await authFetch(`${apiBase}/api/artists`, { method: 'GET' }, { label: 'fetch-artists' });
        
        // Vérifier si la réponse est OK
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Erreur API:', response.status, errorText);
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        
        // Vérifier que c'est bien du JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Réponse non-JSON reçue:', text.substring(0, 200));
          throw new Error('La réponse n\'est pas au format JSON');
        }
        
        const data = await response.json();
        
        // Vérifier que data est un tableau
        if (!Array.isArray(data)) {
          console.error('Format de données inattendu:', data);
          throw new Error('Format de données invalide');
        }
        
        setArtists(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des artistes:', error);
        toast({
          title: 'Erreur',
          description: error.message || 'Impossible de charger la liste des artistes',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setArtists([]); // Éviter les erreurs de rendering
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, [toast]);

  // Filtrage des artistes selon la recherche
  const filteredArtists = artists.filter(artist =>
    artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (artist.country && artist.country.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (artist.country_name && artist.country_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Ouvrir le modal d'édition
  const handleEditClick = (artist) => {
    setSelectedArtist(artist);
    // Le champ country est maintenant un code ISO 2 lettres
    setCountryInput(artist.country || '');
    setNameInput(artist.name || '');
    onOpen();
  };

  // Mise à jour du pays de l'artiste
  const handleUpdateArtist = async () => {
    if (!selectedArtist) return;

    // Préparer les champs à mettre à jour
    const normalizedCountry = countryInput.trim().toUpperCase();
    const trimmedName = nameInput.trim();
    const payload = {};
    if (normalizedCountry) payload.country = normalizedCountry;
    if (trimmedName && trimmedName !== selectedArtist.name) payload.name = trimmedName;

    if (Object.keys(payload).length === 0) {
      toast({
        title: 'Aucun changement',
        description: 'Modifiez le nom ou le pays avant d’enregistrer',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setUpdating(true);
      const apiBase = import.meta.env.VITE_API_URL;
      const response = await authFetch(
        `${apiBase}/api/artists/${selectedArtist.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
        { label: 'update-artist' }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur API:', response.status, errorText);
        
        // Essayer de parser l'erreur JSON
        let errorMessage = `Erreur ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail || errorJson.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      // Récupérer les données mises à jour depuis la réponse
      const updatedArtist = await response.json();

      // Mise à jour locale avec les données complètes (name, country et country_name)
      setArtists(prev =>
        prev.map(a => (a.id === selectedArtist.id ? { ...a, ...updatedArtist } : a))
      );

      toast({
        title: 'Succès',
        description: (() => {
          const changes = [];
          if (payload.name) {
            changes.push(`Nom mis à jour: “${updatedArtist.name}”`);
          }
          if (payload.country) {
            changes.push(`Pays mis à jour: ${updatedArtist.country_name || payload.country}`);
          }
          return changes.join(' • ');
        })(),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour l\'artiste',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUpdating(false);
    }
  };

  const containerBg = colorMode === 'dark' ? 'slate.800' : 'white';
  const headerBg = colorMode === 'dark' ? 'slate.700' : 'gray.50';

  return (
    <Box
      minH="100vh"
      pb={{ base: 24, md: 12 }}
  bg={colorMode === 'dark' ? 'slate.900' : '#f7f7fa'}
    >
      <Box
        w="100%"
        maxW="1200px"
        mx="auto"
        pt={6}
        pb={6}
        px={{ base: 4, md: 6 }}
      >
        <Heading
          as="h1"
          size="xl"
          mb={6}
          color={colorMode === 'dark' ? 'white' : 'brand.900'}
        >
          Gestion des Artistes
        </Heading>

        {/* Barre de recherche */}
        <Box
          mb={6}
          p={4}
          bg={containerBg}
          borderRadius="lg"
          boxShadow="md"
        >
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Rechercher un artiste ou un pays..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg={colorMode === 'dark' ? 'brand.900' : 'white'}
              borderColor={colorMode === 'dark' ? 'brand.700' : 'gray.200'}
            />
          </InputGroup>
          <Text mt={2} fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
            {filteredArtists.length} artiste{filteredArtists.length > 1 ? 's' : ''} trouvé{filteredArtists.length > 1 ? 's' : ''}
          </Text>
        </Box>

        {/* Table des artistes */}
        <Box
          bg={containerBg}
          borderRadius="lg"
          boxShadow="md"
          overflowX="auto"
        >
          {loading ? (
            <Flex justify="center" align="center" minH="300px">
              <Spinner size="xl" color="purple.500" />
            </Flex>
          ) : filteredArtists.length === 0 ? (
            <Box p={8} textAlign="center">
              <Text color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                Aucun artiste trouvé
              </Text>
            </Box>
          ) : (
            <Table variant="simple">
              <Thead bg={headerBg}>
                <Tr>
                  <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.700'}>Artiste</Th>
                  <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.700'}>Pays</Th>
                  <Th color={colorMode === 'dark' ? 'gray.300' : 'gray.700'}>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredArtists.map((artist) => (
                  <Tr
                    key={artist.id}
                    _hover={{ bg: colorMode === 'dark' ? 'brand.700' : 'gray.50' }}
                  >
                    <Td
                      fontWeight="medium"
                      color={colorMode === 'dark' ? 'white' : 'brand.900'}
                    >
                      {artist.name}
                    </Td>
                    <Td>
                      {artist.country ? (
                        <Flex align="center" gap={2}>
                          <Text fontSize="xl" lineHeight="1">
                            {getCountryFlag(artist.country)}
                          </Text>
                          <Text
                            fontSize="sm"
                            color={colorMode === 'dark' ? 'gray.200' : 'gray.700'}
                            fontWeight="medium"
                          >
                            {artist.country_name || artist.country}
                          </Text>
                        </Flex>
                      ) : (
                        <Text
                          fontSize="sm"
                          color={colorMode === 'dark' ? 'gray.500' : 'gray.400'}
                          fontStyle="italic"
                        >
                          Non défini
                        </Text>
                      )}
                    </Td>
                    <Td>
                      <IconButton
                        icon={<EditIcon />}
                        size="sm"
                        colorScheme="purple"
                        variant="ghost"
                        onClick={() => handleEditClick(artist)}
                        aria-label={`Modifier ${artist.name}`}
                        title="Modifier le pays"
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>
      </Box>

      {/* Modal d'édition */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg={containerBg}>
          <ModalHeader color={colorMode === 'dark' ? 'white' : 'brand.900'}>
            Modifier l'artiste
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedArtist && (
              <>
                <FormControl mb={4}>
                  <FormLabel color={colorMode === 'dark' ? 'gray.300' : 'gray.700'}>
                    Nom de l'artiste
                  </FormLabel>
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Entrez le nom"
                    bg={colorMode === 'dark' ? 'brand.900' : 'white'}
                    borderColor={colorMode === 'dark' ? 'brand.700' : 'gray.200'}
                  />
                </FormControl>
                {selectedArtist.country_name && (
                  <Text mb={3} fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                    Pays actuel : <Badge colorScheme="purple" ml={1}>{selectedArtist.country}</Badge> {selectedArtist.country_name}
                  </Text>
                )}
                <FormControl>
                  <FormLabel color={colorMode === 'dark' ? 'gray.300' : 'gray.700'}>
                    Pays
                  </FormLabel>
                  <CountrySelector
                    value={countryInput}
                    onChange={setCountryInput}
                    placeholder="Rechercher un pays..."
                  />
                  <Text mt={2} fontSize="xs" color={colorMode === 'dark' ? 'gray.500' : 'gray.600'}>
                    Tapez pour rechercher par nom ou code. Utilisez les flèches ↑↓ et Entrée pour naviguer.
                  </Text>
                </FormControl>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Annuler
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleUpdateArtist}
              isLoading={updating}
              loadingText="Mise à jour..."
            >
              Enregistrer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default ArtistManager;
