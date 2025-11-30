import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  styles: {
    global: (props) => ({
      body: {
        // Fond gris foncé en mode sombre pour meilleure lisibilité
        bg: props.colorMode === 'dark' ? '#0f172a' : '#f8fafc',
        color: props.colorMode === 'dark' ? '#e5e9f2' : '#0f172a',
        fontFamily: "'Inter', 'SF Pro Text', 'Segoe UI', Arial, sans-serif",
        letterSpacing: '-0.01em',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      },
    }),
  },
  colors: {
    // Palette brand plus bleu-vert (cyan/teal) pour un rendu plus frais
    brand: {
      50: '#ecfeff',
      100: '#cffafe',
      200: '#a5f3fc',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#06b6d4', // bleu-vert (cyan/teal)
      600: '#0ea5e9', // léger shift vers bleu pour hover
      700: '#0284c7',
      800: '#0369a1',
      900: '#0b4f79',
    },
    slate: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    accent: {
      400: '#93c5fd',
      500: '#60a5fa', // bleu léger en accent secondaire
      600: '#3b82f6',
    },
    // Surcharge de "purple" pour que les composants existants utilisent la nouvelle teinte
    purple: {
      50: '#eafaf8',
      100: '#d9f7f2',
      200: '#c2efe7',
      300: '#9fe3d6',
      400: '#77d6c4',
      500: '#4ccab1', // indigo supprimé au profit d’un teal doux pour héritage "purple"
      600: '#35b09a',
      700: '#298d7c',
      800: '#226f63',
      900: '#1c5a51',
    },
  },
  fonts: {
    heading: "'Inter', 'SF Pro Display', 'Segoe UI', Arial, sans-serif",
    body: "'Inter', 'SF Pro Text', 'Segoe UI', Arial, sans-serif",
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '0.95rem', // plus compact que 1rem
    lg: '1.05rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.75rem',
  },
  radii: {
    sm: '10px',
    md: '14px',
    lg: '18px',
    xl: '22px',
  },
  components: {
    Heading: {
      baseStyle: (props) => ({
        color: props.colorMode === 'dark' ? 'brand.200' : 'brand.700',
        letterSpacing: '-0.02em',
        fontWeight: 700,
      }),
    },
    Text: {
      baseStyle: (props) => ({
        color: props.colorMode === 'dark' ? 'slate.300' : 'slate.800',
      }),
    },
    Card: {
      baseStyle: (props) => ({
        bg: props.colorMode === 'dark' ? 'rgba(16, 19, 29, 0.92)' : 'white',
        boxShadow: props.colorMode === 'dark' ? '0 6px 24px rgba(0,0,0,0.30)' : '0 8px 24px rgba(24,24,27,0.08)',
        borderRadius: 'xl',
      }),
    },
    Badge: {
      baseStyle: (props) => ({
        bg: props.colorMode === 'dark' ? 'rgba(37, 99, 235, 0.2)' : 'brand.100',
        color: props.colorMode === 'dark' ? 'brand.200' : 'brand.700',
        borderRadius: 'md',
        fontWeight: 500,
      }),
    },
    Button: {
      baseStyle: {
        borderRadius: 'lg',
        fontWeight: 600,
      },
      variants: {
        solid: (props) => ({
          bg: props.colorMode === 'dark' ? 'brand.600' : 'brand.600',
          color: 'white',
          _hover: { bg: 'brand.700' },
          _active: { bg: 'brand.800' },
        }),
        outline: (props) => ({
          borderColor: props.colorMode === 'dark' ? 'brand.600' : 'brand.500',
          color: props.colorMode === 'dark' ? 'brand.200' : 'brand.700',
          _hover: { bg: props.colorMode === 'dark' ? 'brand.900' : 'brand.50' },
        }),
        ghost: (props) => ({
          color: props.colorMode === 'dark' ? 'brand.200' : 'brand.700',
          _hover: { bg: props.colorMode === 'dark' ? 'rgba(6, 182, 212, 0.14)' : 'brand.50' },
        }),
      },
    },
    Input: {
      baseStyle: {
        borderRadius: 'lg',
      },
      sizes: {
        sm: { field: { fontSize: 'sm', py: 2 } },
        md: { field: { fontSize: 'md', py: 2 } },
      },
      variants: {
        outline: (props) => ({
          field: {
            bg: props.colorMode === 'dark' ? 'rgba(21, 25, 38, 0.92)' : 'white',
            borderColor: props.colorMode === 'dark' ? 'slate.700' : 'slate.300',
            _hover: { borderColor: 'brand.500' },
            _focus: { borderColor: 'brand.600', boxShadow: '0 0 0 1px var(--chakra-colors-brand-600)' },
          },
        }),
      },
    },
    Modal: {
      baseStyle: (props) => ({
        dialog: {
          bg: props.colorMode === 'dark' ? 'rgba(14, 18, 30, 0.95)' : 'white',
          borderRadius: 'xl',
          boxShadow: props.colorMode === 'dark' ? '0 10px 36px rgba(0,0,0,0.40)' : '0 12px 36px rgba(24,24,27,0.12)',
        },
      }),
    },
  },
});

export default theme;
