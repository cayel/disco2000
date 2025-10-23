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
