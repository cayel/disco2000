import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? '#232526' : '#f7f7fa',
        color: props.colorMode === 'dark' ? '#f5f6fa' : '#232526',
        fontFamily: "'Montserrat', 'Segoe UI', Arial, sans-serif",
      },
    }),
  },
  colors: {
    brand: {
      900: '#232526', // gris anthracite
      800: '#414345', // gris foncé
      700: '#6dd5ed', // bleu clair accent
      600: '#f5f6fa', // blanc cassé
      500: '#c33764', // violet/rose accent
    },
    accent: {
      500: '#6dd5ed', // bleu clair
      600: '#c33764', // violet/rose
    },
  },
  components: {
    Heading: {
      baseStyle: (props) => ({
        color: props.colorMode === 'dark' ? 'brand.700' : 'brand.700',
      }),
    },
    Card: {
      baseStyle: (props) => ({
        bg: props.colorMode === 'dark' ? 'brand.900' : 'white',
        boxShadow: 'xl',
        borderRadius: 'xl',
      }),
    },
    Badge: {
      baseStyle: (props) => ({
        bg: props.colorMode === 'dark' ? 'accent.600' : 'accent.500',
        color: props.colorMode === 'dark' ? 'brand.600' : 'brand.900',
      }),
    },
  },
});

export default theme;
