import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Box,
  Input,
  InputGroup,
  InputRightElement,
  List,
  ListItem,
  Text,
  Badge,
  useColorMode,
  IconButton,
} from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import { COUNTRIES, getCountryByCode } from '../utils/countries';

function CountrySelector({ value, onChange, placeholder = 'Rechercher un pays...' }) {
  const { colorMode } = useColorMode();
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Pays sélectionné
  const selectedCountry = useMemo(() => getCountryByCode(value), [value]);

  // Afficher le nom du pays dans l'input quand un pays est sélectionné
  const displayValue = selectedCountry ? `${selectedCountry.name} (${selectedCountry.code})` : searchQuery;

  // Filtrer les pays selon la recherche
  const filteredCountries = useMemo(() => {
    if (!searchQuery) return COUNTRIES;
    const normalized = searchQuery.toLowerCase();
    return COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(normalized) ||
      c.code.toLowerCase().includes(normalized)
    );
  }, [searchQuery]);

  // Sélectionner un pays
  const handleSelectCountry = (country) => {
    onChange(country.code);
    setSearchQuery('');
    setIsOpen(false);
    setHighlightedIndex(0);
  };

  // Effacer la sélection
  const handleClear = () => {
    onChange('');
    setSearchQuery('');
    setHighlightedIndex(0);
    inputRef.current?.focus();
  };

  // Gérer les touches clavier
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredCountries.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCountries[highlightedIndex]) {
          handleSelectCountry(filteredCountries[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchQuery('');
        setHighlightedIndex(0);
        break;
      default:
        break;
    }
  };

  // Scroll automatique vers l'élément surligné
  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex];
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [highlightedIndex, isOpen]);

  return (
    <Box position="relative">
      <InputGroup>
        <Input
          ref={inputRef}
          value={selectedCountry ? displayValue : searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
            if (selectedCountry) {
              onChange(''); // Effacer la sélection si on commence à taper
            }
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            // Délai pour permettre le clic sur la liste
            setTimeout(() => setIsOpen(false), 200);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          bg={colorMode === 'dark' ? 'slate.900' : 'white'}
          borderColor={colorMode === 'dark' ? 'slate.700' : 'gray.200'}
          _focus={{
            borderColor: 'purple.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-purple-500)',
          }}
        />
        {selectedCountry && (
          <InputRightElement>
            <IconButton
              icon={<CloseIcon />}
              size="xs"
              variant="ghost"
              onClick={handleClear}
              aria-label="Effacer"
            />
          </InputRightElement>
        )}
      </InputGroup>

      {/* Liste déroulante */}
      {isOpen && filteredCountries.length > 0 && (
        <List
          ref={listRef}
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={1}
          bg={colorMode === 'dark' ? 'slate.800' : 'white'}
          borderWidth={1}
          borderColor={colorMode === 'dark' ? 'slate.700' : 'gray.200'}
          borderRadius="md"
          boxShadow="lg"
          maxH="300px"
          overflowY="auto"
          zIndex={10}
        >
          {filteredCountries.map((country, index) => (
            <ListItem
              key={country.code}
              px={3}
              py={2}
              cursor="pointer"
              bg={
                index === highlightedIndex
                  ? colorMode === 'dark'
                    ? 'purple.600'
                    : 'purple.50'
                  : 'transparent'
              }
              _hover={{
                bg: colorMode === 'dark' ? 'purple.600' : 'purple.50',
              }}
              onClick={() => handleSelectCountry(country)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <Box display="flex" alignItems="center" gap={2}>
                <Badge
                  colorScheme="purple"
                  fontSize="xs"
                  minW="32px"
                  textAlign="center"
                >
                  {country.code}
                </Badge>
                <Text
                  fontSize="sm"
                  color={colorMode === 'dark' ? 'white' : 'gray.800'}
                >
                  {country.name}
                </Text>
              </Box>
            </ListItem>
          ))}
        </List>
      )}

      {/* Message si aucun pays trouvé */}
      {isOpen && searchQuery && filteredCountries.length === 0 && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={1}
          p={3}
          bg={colorMode === 'dark' ? 'brand.800' : 'white'}
          borderWidth={1}
          borderColor={colorMode === 'dark' ? 'brand.700' : 'gray.200'}
          borderRadius="md"
          boxShadow="lg"
          zIndex={10}
        >
          <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
            Aucun pays trouvé
          </Text>
        </Box>
      )}
    </Box>
  );
}

export default CountrySelector;
