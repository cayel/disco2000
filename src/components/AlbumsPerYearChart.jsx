import { Box, useColorMode, Text } from '@chakra-ui/react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Label } from 'recharts';

// Permet désormais de recevoir soit une liste d'albums (legacy) soit un tableau agrégé yearData [{year, count}].
export default function AlbumsPerYearChart({ albums = [], yearData = [] }) {
  const { colorMode } = useColorMode();

  let data = [];
  if (Array.isArray(yearData) && yearData.length) {
    // Utilisation directe des comptes fournis par l'API
    data = [...yearData]
      .filter(entry => Number.isFinite(entry.year) && Number.isFinite(entry.count))
      .sort((a, b) => a.year - b.year);
  } else {
    // Fallback legacy : reconstruire depuis la liste d'albums
    const yearCount = {};
    albums.forEach(album => {
      const year = Number(album.year);
      if (Number.isFinite(year)) {
        yearCount[year] = (yearCount[year] || 0) + 1;
      }
    });
    const years = Object.keys(yearCount).map(y => Number(y)).sort((a, b) => a - b);
    data = years.map(year => ({ year, count: yearCount[year] }));
  }

  const hasData = data.length > 0;

  const isDark = colorMode === 'dark';
  const chartBg = isDark ? '#23213a' : '#fff';
  const chartFg = isDark ? '#e9d8fd' : '#2d3748';
  const gridColor = isDark ? '#4b436a' : '#e2e8f0';

  return (
    <Box w="100%" minW="320px" h="340px" minH="240px" maxW="1100px" mx="auto" my={8} bg={isDark ? 'brand.900' : 'white'} p={0} borderRadius="lg" boxShadow="md" position="relative">
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={320} minHeight={240} aspect={2.8}>
          <BarChart data={data} margin={{ top: 24, right: 24, left: 24, bottom: 24 }}>
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
            <XAxis dataKey="year" stroke={chartFg} fontSize={14} tickLine={false} axisLine={{ stroke: gridColor }}>
              <Label value="Année" offset={-8} position="insideBottom" fill={chartFg} />
            </XAxis>
            <YAxis stroke={chartFg} fontSize={14} tickLine={false} axisLine={{ stroke: gridColor }}>
              <Label value="Nombre de disques" angle={-90} position="insideLeft" fill={chartFg} />
            </YAxis>
            <Tooltip contentStyle={{ background: chartBg, color: chartFg, borderRadius: 8, border: 'none' }} cursor={{ fill: isDark ? '#322659' : '#e9d8fd', opacity: 0.2 }} />
            <Bar dataKey="count" fill="#805ad5" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Flex w="100%" h="100%" align="center" justify="center" direction="column" gap={2}>
          <Text fontSize="sm" color={chartFg} opacity={0.7}>Pas encore de distribution annuelle.</Text>
        </Flex>
      )}
    </Box>
  );
}
