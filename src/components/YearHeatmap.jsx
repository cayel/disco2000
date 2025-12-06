import React, { useMemo } from 'react';
import { Box, Heading, Text, SimpleGrid, Tooltip, useColorMode, Stack } from '@chakra-ui/react';

/**
 * Props:
 * - yearData: Array<{ year: number, count: number }>
 */
export default function YearHeatmap({ yearData = [] }) {
  const { colorMode } = useColorMode();
  const cardBg = colorMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'gray.50';
  const borderColor = colorMode === 'dark' ? 'whiteAlpha.200' : 'gray.200';

  const { years, minYear, maxYear, buckets, decades } = useMemo(() => normalize(yearData), [yearData]);

  return (
    <Box borderRadius="xl" p={{ base: 4, md: 6 }} boxShadow="md" bg={cardBg} borderWidth={colorMode==='dark'?1:0} borderColor={borderColor}>
      <Heading as="h3" size="md" mb={2} color={colorMode==='dark' ? 'slate.200' : 'slate.800'}>
        Heatmap par décennie et année
      </Heading>
      <Text fontSize="sm" color={colorMode==='dark' ? 'gray.400' : 'gray.600'} mb={4}>
        Intensité proportionnelle au nombre d'albums par année ({minYear ?? '—'} – {maxYear ?? '—'})
      </Text>

      {years.length === 0 ? (
        <Text fontSize="sm" color={colorMode==='dark' ? 'gray.400' : 'gray.600'}>Aucune donnée</Text>
      ) : (
        <Stack spacing={5}>
          {decades.map(({ label, years: decYears }) => (
            <Box key={label}>
              <Text fontSize="sm" mb={2} color={colorMode==='dark' ? 'slate.300' : 'slate.700'}>
                {label}
              </Text>
              <Box overflowX="auto">
                <SimpleGrid columns={decYears.length} spacing={1}>
                  {decYears.map(y => {
                    const count = buckets.get(y) || 0;
                    const level = getLevel(count);
                    const bg = getHeatColor(level, colorMode);
                    return (
                      <Tooltip key={y} label={`${y} • ${count} album${count > 1 ? 's' : ''}`} hasArrow>
                        <Box
                          w="20px"
                          h="20px"
                          borderRadius="sm"
                          bg={bg}
                          borderWidth={colorMode==='dark'?0:1}
                          borderColor={colorMode==='dark'?'transparent':'gray.200'}
                          title={String(y)}
                        />
                      </Tooltip>
                    );
                  })}
                </SimpleGrid>
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}

function normalize(yearData) {
  const arr = Array.isArray(yearData) ? yearData : [];
  const buckets = new Map();
  let minYear = Infinity;
  let maxYear = -Infinity;
  for (const item of arr) {
    const y = Number(item.year);
    const c = Number(item.count ?? item.total ?? item.value ?? item.albums ?? item.nb) || 0;
    if (!Number.isFinite(y)) continue;
    buckets.set(y, (buckets.get(y) || 0) + c);
    if (y < minYear) minYear = y;
    if (y > maxYear) maxYear = y;
  }
  if (!Number.isFinite(minYear) || !Number.isFinite(maxYear)) {
    return { years: [], minYear: null, maxYear: null, buckets, decades: [] };
  }
  const years = [];
  for (let y = minYear; y <= maxYear; y++) {
    years.push(y);
    if (!buckets.has(y)) buckets.set(y, 0);
  }
  const decades = groupByDecade(years);
  return { years, minYear, maxYear, buckets, decades };
}

function getLevel(count) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 7) return 3;
  if (count <= 15) return 4;
  return 5;
}

function getHeatColor(level, mode) {
  const brand = {
    light: ['gray.100', 'brand.100', 'brand.200', 'brand.300', 'brand.400', 'brand.500'],
    dark: ['whiteAlpha.100', 'whiteAlpha.200', 'brand.200', 'brand.300', 'brand.400', 'brand.500'],
  };
  const palette = brand[mode === 'dark' ? 'dark' : 'light'];
  return palette[Math.max(0, Math.min(level, palette.length - 1))];
}

function groupByDecade(years) {
  if (!Array.isArray(years) || years.length === 0) return [];
  const first = years[0];
  const last = years[years.length - 1];
  const startDecade = Math.floor(first / 10) * 10;
  const endDecade = Math.floor(last / 10) * 10;
  const result = [];
  for (let d = startDecade; d <= endDecade; d += 10) {
    const decYears = years.filter(y => Math.floor(y / 10) * 10 === d);
    if (decYears.length === 0) continue;
    result.push({ label: `${d}s`, years: decYears });
  }
  return result;
}
