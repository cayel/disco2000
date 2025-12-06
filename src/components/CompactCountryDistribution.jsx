import React, { useMemo, useState } from 'react';
import { Box, Heading, Text, Stack, HStack, Tag, Progress, useColorMode, Button } from '@chakra-ui/react';

/**
 * Props:
 * - artists: Array<{ country?: string | { code?: string } }>
 * - maxItems?: number (default 8)
 */
export default function CompactCountryDistribution({ artists = [], maxItems = 8, initialLimit = 5 }) {
  const { colorMode } = useColorMode();
  const cardBg = colorMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'gray.50';
  const borderColor = colorMode === 'dark' ? 'whiteAlpha.200' : 'gray.200';

  const { topCountries, total } = useMemo(() => aggregate(artists, maxItems), [artists, maxItems]);
  const [expanded, setExpanded] = useState(false);
  const visible = useMemo(
    () => (expanded ? topCountries : topCountries.slice(0, Math.max(1, Number(initialLimit) || 5))),
    [expanded, topCountries, initialLimit]
  );

  return (
    <Box borderRadius="xl" p={{ base: 4, md: 5 }} boxShadow="md" bg={cardBg} borderWidth={colorMode==='dark'?1:0} borderColor={borderColor}>
      <Heading as="h3" size="sm" mb={2} color={colorMode==='dark' ? 'slate.200' : 'slate.800'}>
        Répartition par pays (compact)
      </Heading>
      {topCountries.length === 0 ? (
        <Text fontSize="sm" color={colorMode==='dark' ? 'gray.400' : 'gray.600'}>Aucune donnée</Text>
      ) : (
        <Stack spacing={2}>
          {visible.map(({ code, count }) => {
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <Box key={code}>
                <HStack justify="space-between" mb={1}>
                  <HStack spacing={2}>
                    <Box as="span" fontSize="sm" aria-label={`Drapeau ${code}`} title={code}>
                      {countryCodeToFlagEmoji(code)}
                    </Box>
                    <Tag size="sm" variant="subtle" colorScheme="gray">
                      {code}
                    </Tag>
                  </HStack>
                  <Text fontSize="xs" color={colorMode==='dark' ? 'gray.300' : 'gray.600'}>
                    {count} • {percent}%
                  </Text>
                </HStack>
                <Progress value={percent} colorScheme="brand" size="xs" borderRadius="full" />
              </Box>
            );
          })}
          {topCountries.length > visible.length && (
            <Button
              onClick={() => setExpanded(true)}
              size="xs"
              variant="link"
              colorScheme="brand"
              alignSelf="flex-start"
            >
              Voir le détail
            </Button>
          )}
          {expanded && topCountries.length > Math.max(1, Number(initialLimit) || 5) && (
            <Button
              onClick={() => setExpanded(false)}
              size="xs"
              variant="link"
              colorScheme="gray"
              alignSelf="flex-start"
            >
              Réduire
            </Button>
          )}
        </Stack>
      )}
    </Box>
  );
}

function aggregate(artists, maxItems) {
  const map = new Map();
  const arr = Array.isArray(artists) ? artists : [];
  for (const a of arr) {
    const c = resolveCountryCode(a);
    if (!c) continue;
    map.set(c, (map.get(c) || 0) + 1);
  }
  const all = Array.from(map.entries()).map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count);
  const topCountries = all.slice(0, Math.max(1, Number(maxItems) || 8));
  const total = all.reduce((acc, cur) => acc + cur.count, 0);
  return { topCountries, total };
}

function resolveCountryCode(a) {
  // Support a.country string or a.country.code
  const raw = a?.country;
  if (!raw) return null;
  if (typeof raw === 'string') return raw.trim().toUpperCase();
  const code = raw.code || raw.iso || raw.id || raw.alpha2;
  return code ? String(code).trim().toUpperCase() : null;
}

function countryCodeToFlagEmoji(code) {
  const cc = String(code || '').trim().toUpperCase();
  if (!cc || cc.length !== 2) return '🏳️';
  // Convert ISO 3166-1 alpha-2 to regional indicator symbols
  const A = 0x41; // 'A'
  const base = 0x1F1E6; // regional indicator for 'A'
  const chars = cc.split('').map(c => String.fromCodePoint(base + (c.charCodeAt(0) - A)));
  return chars.join('');
}
