
import { Button, Icon } from '@chakra-ui/react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';
import { useState, useEffect } from 'react';
import { setCookie } from '../utils/cookie';


export default function GoogleAuthButton({ onLoginSuccess }) {
  const [user, setUser] = useState(() => auth.currentUser);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    const apiKey = import.meta.env.VITE_API_KEY;
    const apiBase = import.meta.env.VITE_API_URL;
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);

      // Envoi du id_token Google au backend pour JWT
      const idToken = await result.user.getIdToken();
      if (import.meta.env.DEV) {
        console.log('[DEBUG] id_token Google envoyé au backend');
      }
      const jwtRes = await fetch(`${apiBase}/api/users/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey
        },
        body: JSON.stringify({ id_token: idToken })
      });
      const jwtData = await jwtRes.json();
      if (import.meta.env.DEV) {
        console.log('[DEBUG] Réponse backend /api/users/token');
      }
      if (jwtData.access_token) {
        setCookie('jwt', jwtData.access_token, 7, true);
        window.dispatchEvent(new CustomEvent('jwt-updated', { detail: jwtData.access_token }));
        if (onLoginSuccess) onLoginSuccess();
      }
    } catch (err) {
      alert('Erreur de connexion : ' + err.message);
    }
  };

  return !user ? (
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
