
import { Button, useToast } from '@chakra-ui/react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';
import { useState, useEffect } from 'react';
import { setCookie } from '../utils/cookie';
import TokenService from '../utils/tokenService';


export default function GoogleAuthButton({ onLoginSuccess, jwtToken }) {
  const toast = useToast();
  const [user, setUser] = useState(() => (jwtToken ? auth.currentUser : null));
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!jwtToken) {
      setUser(null);
    }
  }, [jwtToken]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    const apiKey = import.meta.env.VITE_API_KEY;
    const apiBase = import.meta.env.VITE_API_URL;
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);

      // Envoi du id_token Google au backend pour JWT
      const idToken = await result.user.getIdToken();
      
      // Try modern endpoint first, fallback to legacy
      const tryAuth = async () => {
        const res = await fetch(`${apiBase}/api/users/auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': apiKey,
          },
          credentials: 'include',
          body: JSON.stringify({ id_token: idToken })
        });
        return res.ok ? res : null;
      };
      
      let jwtRes = await tryAuth();
      if (!jwtRes) {
        jwtRes = await fetch(`${apiBase}/api/users/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': apiKey,
          },
          credentials: 'include',
          body: JSON.stringify({ id_token: idToken })
        });
      }
      
      const jwtData = await jwtRes.json();
      
      if (jwtData.access_token) {
        const refreshToken = jwtData.refresh_token || jwtData.refresh || jwtData.refreshToken;
        
        TokenService.setTokens(jwtData.access_token, refreshToken);
        setCookie('jwt', jwtData.access_token, 7, true);
        if (refreshToken) {
          setCookie('refresh_token', refreshToken, 30, true);
        }
        
        window.dispatchEvent(new CustomEvent('jwt-updated', { detail: jwtData.access_token }));
        
        toast({
          title: 'Connexion réussie',
          description: `Bienvenue ${result.user.displayName || result.user.email}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top-right',
        });
        if (!refreshToken) {
          toast({
            title: 'Attention: refresh token manquant',
            description: 'Le serveur n’a pas renvoyé de refresh_token. Le renouvellement automatique expirera à ~1h.',
            status: 'warning',
            duration: 6000,
            isClosable: true,
            position: 'top-right',
          });
        }
        if (onLoginSuccess) onLoginSuccess();
      }
    } catch (err) {
      toast({
        title: 'Erreur de connexion',
        description: err.message || 'Impossible de se connecter avec Google',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
    }
  };

  return !jwtToken ? (
    <Button
      variant="ghost"
      size="sm"
      colorScheme="gray"
      leftIcon={<img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width={18} style={{marginRight: 0}} />}
      onClick={handleLogin}
      title="Connexion Google"
    >
      {/* Icône Google seulement, pas de texte */}
    </Button>
  ) : null;
}
