import { Box, useColorMode } from '@chakra-ui/react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Label } from 'recharts';

export default function AlbumsPerYearChart({ albums }) {
  const { colorMode } = useColorMode();
  // Comptage par année
  const yearCount = {};
  albums.forEach(album => {
    const year = album.year;
    if (year) yearCount[year] = (yearCount[year] || 0) + 1;
  });
  // Tri par année croissante
  const years = Object.keys(yearCount).sort((a, b) => a - b);
  const data = years.map(year => ({ year, count: yearCount[year] }));

  const isDark = colorMode === 'dark';
  const chartBg = isDark ? '#23213a' : '#fff';
  const chartFg = isDark ? '#e9d8fd' : '#2d3748';
  const gridColor = isDark ? '#4b436a' : '#e2e8f0';

  return (
    <Box w="100%" h="340px" maxW="1100px" mx="auto" my={8} bg={isDark ? 'brand.900' : 'white'} p={0} borderRadius="lg" boxShadow="md">
      <ResponsiveContainer width="100%" height="100%">
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
    </Box>
  );
}
