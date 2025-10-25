
import { Button, Icon } from '@chakra-ui/react';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useState, useEffect } from 'react';


export default function GoogleAuthButton() {
  const [user, setUser] = useState(() => auth.currentUser);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);

      // Vérification et création utilisateur côté API
      const apiKey = import.meta.env.VITE_API_KEY;
      const apiBase = import.meta.env.VITE_API_URL;
      const email = result.user.email;
      // Vérifier si l'utilisateur existe
      const existsRes = await fetch(`${apiBase}/api/users/exists?email=${encodeURIComponent(email)}`, {
        headers: { 'X-API-KEY': apiKey }
      });
      const existsData = await existsRes.json();
      // Test robuste sur la valeur de exists
      const exists = existsData.exists === true || existsData.exists === 1 || existsData.exists === 'true';
      if (!exists) {
        // Construction du payload selon le schéma API
        const displayName = result.user.displayName || '';
        let first_name = '', last_name = '';
        if (displayName.includes(' ')) {
          [first_name, ...last_name] = displayName.split(' ');
          last_name = last_name.join(' ');
        } else {
          first_name = displayName;
          last_name = '';
        }
        const payload = {
          first_name,
          last_name,
          email: result.user.email,
          identifier: result.user.uid,
          roles: ['utilisateur']
        };
        await fetch(`${apiBase}/api/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': apiKey
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Pour debug : log la valeur reçue
        if (typeof existsData.exists !== 'boolean') {
          console.log('Réponse API /exists inattendue:', existsData);
        }
      }
    } catch (err) {
      alert('Erreur de connexion : ' + err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
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
