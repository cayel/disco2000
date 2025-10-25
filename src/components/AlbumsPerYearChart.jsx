import { Box, useColorMode } from '@chakra-ui/react';
import { Bar } from 'react-chartjs-2';
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

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
  const counts = years.map(year => yearCount[year]);

  const isDark = colorMode === 'dark';
  const chartBg = isDark ? '#23213a' : '#fff';
  const chartFg = isDark ? '#e9d8fd' : '#2d3748';
  const gridColor = isDark ? '#4b436a' : '#e2e8f0';

  const data = {
    labels: years,
    datasets: [
      {
        label: 'Nombre de disques',
        data: counts,
        backgroundColor: 'rgba(128, 90, 213, 0.7)',
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        title: { display: true, text: 'Année', color: chartFg },
        ticks: { color: chartFg },
        grid: { color: gridColor },
      },
      y: {
        title: { display: true, text: 'Nombre de disques', color: chartFg },
        ticks: { color: chartFg },
        grid: { color: gridColor },
        beginAtZero: true,
      },
    },
    backgroundColor: chartBg,
  };

  return (
    <Box w="100%" maxW="700px" mx="auto" my={8} bg={isDark ? 'brand.900' : 'white'} p={4} borderRadius="lg" boxShadow="md">
      <Bar data={data} options={options} style={{ background: chartBg, borderRadius: 12 }} />
    </Box>
  );
}
