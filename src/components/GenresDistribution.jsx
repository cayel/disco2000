import React, { useMemo } from 'react';
import { Box, Heading, Text, Stack, Flex, Progress, useColorMode } from '@chakra-ui/react';

/**
 * Props:
 * - genres: Array<{ name: string, count: number }>
 * - styles: Array<{ name: string, count: number }>
 */
export default function GenresDistribution({ genres = [], styles = [] }) {
  const { colorMode } = useColorMode();
  const cardBg = colorMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'gray.50';
  const borderColor = colorMode === 'dark' ? 'whiteAlpha.200' : 'gray.200';

  const topGenres = useMemo(() => normalizeAndTop(genres), [genres]);
  const topStyles = useMemo(() => normalizeAndTop(styles), [styles]);

  const totalGenres = useMemo(() => sumCounts(topGenres), [topGenres]);
  const totalStyles = useMemo(() => sumCounts(topStyles), [topStyles]);

  return (
    <Box borderRadius="xl" p={{ base: 4, md: 6 }} boxShadow="md" bg={cardBg} borderWidth={colorMode==='dark'?1:0} borderColor={borderColor}>
      <Heading as="h3" size="md" mb={2} color={colorMode==='dark' ? 'slate.200' : 'slate.800'}>
        Répartition par genre et style
      </Heading>
      <Text fontSize="sm" color={colorMode==='dark' ? 'gray.400' : 'gray.600'} mb={4}>
        Top catégories par nombre de disques (jusqu'à 10)
      </Text>
      <Stack spacing={6} direction={{ base: 'column', lg: 'row' }}>
        <Box flex={1}>
          <Section title="Genres" items={topGenres} total={totalGenres} />
        </Box>
        <Box flex={1}>
          <Section title="Styles" items={topStyles} total={totalStyles} />
        </Box>
      </Stack>
    </Box>
  );
}

function Section({ title, items, total }) {
  const { colorMode } = useColorMode();
  if (!items.length) {
    return (
      <Box>
        <Heading as="h4" size="sm" mb={3} color={colorMode==='dark' ? 'slate.300' : 'slate.700'}>
          {title}
        </Heading>
        <Text fontSize="sm" color={colorMode==='dark' ? 'gray.400' : 'gray.600'}>Aucune donnée</Text>
      </Box>
    );
  }
  return (
    <Box>
      <Heading as="h4" size="sm" mb={3} color={colorMode==='dark' ? 'slate.300' : 'slate.700'}>
        {title}
      </Heading>
      <Stack spacing={3}>
        {items.map(item => {
          const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <Box key={item.name}>
              <Flex justify="space-between" mb={1} gap={3}>
                <Text fontSize="sm" noOfLines={1} title={item.name}>{item.name}</Text>
                <Text fontSize="sm" fontWeight="semibold">{item.count} • {percent}%</Text>
              </Flex>
              <Progress value={percent} colorScheme="brand" size="sm" borderRadius="full" />
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

function normalizeAndTop(raw = []) {
  // Support shapes: { genre, count }, { style, count }, { name, count }, [name, count]
  const list = (Array.isArray(raw) ? raw : []).map(entry => {
    if (Array.isArray(entry)) {
      const [name, count] = entry;
      return { name: String(name || '').trim(), count: Number(count) || 0 };
    }
    const name = entry.name || entry.genre || entry.style || entry.label || '';
    const count = entry.count ?? entry.total ?? entry.value ?? 0;
    return { name: String(name || '').trim(), count: Number(count) || 0 };
  }).filter(x => x.name);

  // Agréger par nom, trier desc, couper à 10
  const map = new Map();
  for (const { name, count } of list) {
    const key = name.toLowerCase();
    map.set(key, (map.get(key) || { name, count: 0 }));
    map.get(key).count += count;
  }
  const aggregated = Array.from(map.values()).sort((a, b) => b.count - a.count);
  return aggregated.slice(0, 10);
}

function sumCounts(items) {
  return items.reduce((acc, cur) => acc + (cur.count || 0), 0);
}
