import { Box, useColorMode, Text, Flex } from '@chakra-ui/react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

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
  const chartFg = isDark ? '#cbd5e0' : '#4a5568';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  return (
    <Box w="100%" h="280px" position="relative">
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis 
              dataKey="year" 
              stroke={chartFg} 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              dy={5}
            />
            <YAxis 
              stroke={chartFg} 
              fontSize={12} 
              tickLine={false} 
              axisLine={false}
              dx={-5}
            />
            <Tooltip 
              contentStyle={{ 
                background: isDark ? 'rgba(30, 30, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)', 
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                padding: '8px 12px'
              }}
              labelStyle={{ color: chartFg, fontWeight: 'bold', marginBottom: '4px' }}
              itemStyle={{ color: '#8b5cf6' }}
              cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorCount)"
              name="Albums"
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <Flex w="100%" h="100%" align="center" justify="center" direction="column" gap={2}>
          <Text fontSize="sm" color={chartFg} opacity={0.7}>Pas encore de distribution annuelle.</Text>
        </Flex>
      )}
    </Box>
  );
}
