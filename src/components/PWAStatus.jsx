import { Box, Flex, Text, Badge, useColorMode, Tooltip, IconButton, useToast } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { DownloadIcon, RepeatIcon } from '@chakra-ui/icons';

/**
 * Composant affichant le statut de connexion et les contrôles PWA
 */
const PWAStatus = ({ showInstallButton = true }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const { colorMode } = useColorMode();
  const toast = useToast();

  // Détecter le mode standalone
  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      window.navigator.standalone === true ||
                      document.referrer.includes('android-app://');
    setIsStandalone(standalone);
  }, []);

  // Écouter les changements de connexion
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'Connexion rétablie',
        description: 'Vous êtes de nouveau en ligne',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'bottom-right',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: 'Mode hors ligne',
        description: 'Vous pouvez continuer à consulter vos données en cache',
        status: 'warning',
        duration: 5000,
        isClosable: true,
        position: 'bottom-right',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Gérer le prompt d'installation PWA
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Détection de l'installation réussie
    window.addEventListener('appinstalled', () => {
      toast({
        title: 'Application installée',
        description: 'Disco2000 a été ajouté à votre écran d\'accueil',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setCanInstall(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [toast]);

  // Gérer l'installation
  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('[PWA] Installation acceptée');
    } else {
      console.log('[PWA] Installation refusée');
    }

    setDeferredPrompt(null);
    setCanInstall(false);
  };

  // Forcer le rechargement pour obtenir les dernières données
  const handleRefresh = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
      
      toast({
        title: 'Actualisation en cours',
        description: 'Rechargement des données...',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      window.location.reload();
    }
  };

  return (
    <Flex
      align="center"
      gap={{ base: 2, md: 3 }}
      fontSize={{ base: "2xs", md: "xs" }}
    >
      {/* Indicateur de connexion */}
      <Tooltip 
        label={isOnline ? 'En ligne' : 'Hors ligne - Mode cache'}
        placement="bottom"
      >
        <Badge
          colorScheme={isOnline ? 'green' : 'orange'}
          variant="subtle"
          borderRadius="full"
          px={{ base: 2, md: 2.5 }}
          py={0.5}
          fontSize={{ base: "2xs", md: "xs" }}
          display="flex"
          alignItems="center"
          gap={1.5}
        >
          <Box
            as="span"
            display="inline-block"
            w={2}
            h={2}
            borderRadius="full"
            bg={isOnline ? 'green.400' : 'orange.400'}
            animation={isOnline ? 'none' : 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'}
          />
          {isOnline ? 'En ligne' : 'Hors ligne'}
        </Badge>
      </Tooltip>

      {/* Bouton d'installation (uniquement si disponible et pas en standalone) */}
      {showInstallButton && canInstall && !isStandalone && (
        <Tooltip label="Installer l'application" placement="bottom">
          <IconButton
            icon={<DownloadIcon />}
            size="sm"
            variant="ghost"
            colorScheme="purple"
            onClick={handleInstall}
            aria-label="Installer l'application"
            _hover={{
              bg: colorMode === 'dark' ? 'whiteAlpha.200' : 'purple.50'
            }}
          />
        </Tooltip>
      )}

      {/* Bouton de rafraîchissement */}
      <Tooltip label="Actualiser les données" placement="bottom">
        <IconButton
          icon={<RepeatIcon />}
          size="sm"
          variant="ghost"
          colorScheme="gray"
          onClick={handleRefresh}
          aria-label="Actualiser"
          _hover={{
            bg: colorMode === 'dark' ? 'whiteAlpha.200' : 'gray.100'
          }}
        />
      </Tooltip>

      {/* Badge PWA si installé */}
      {isStandalone && (
        <Badge
          colorScheme="purple"
          variant="subtle"
          borderRadius="full"
          px={2}
          py={0.5}
          fontSize="2xs"
        >
          PWA
        </Badge>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </Flex>
  );
};

export default PWAStatus;
