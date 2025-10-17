import { extendTheme, ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'system',
  useSystemColorMode: true,
};

const theme = extendTheme({
  config,
  colors: {
    brand: {
      50: '#e3f9ff',
      100: '#c5eefd',
      200: '#a5e3fa',
      300: '#84d8f7',
      400: '#62cdf4',
      500: '#48b3da',
      600: '#388ba9',
      700: '#286278',
      800: '#173a47',
      900: '#071217'
    }
  },
  components: {
    Button: {
      variants: {
        primary: {
          bg: 'brand.500',
          color: 'white',
          _hover: { bg: 'brand.600' },
          _active: { bg: 'brand.700' }
        }
      }
    }
  }
});

export default theme;
export { config };
