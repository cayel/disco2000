import { Badge, Tooltip } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { getCookie } from '../utils/cookie';

function decodeExp(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const payload = JSON.parse(jsonPayload);
    return payload?.exp ? payload.exp * 1000 : null;
  } catch { return null; }
}

export default function SessionStatusBadge() {
  const [remainingMs, setRemainingMs] = useState(null);

  useEffect(() => {
    let raf = null;
    function tick() {
      const jwt = getCookie('jwt');
      if (!jwt) {
        setRemainingMs(null);
      } else {
        const expMs = decodeExp(jwt);
        if (!expMs) {
          setRemainingMs(null);
        } else {
          setRemainingMs(expMs - Date.now());
        }
      }
      raf = setTimeout(tick, 1000);
    }
    tick();
    return () => { if (raf) clearTimeout(raf); };
  }, []);

  if (remainingMs == null) return null;
  const minutes = Math.max(0, Math.floor(remainingMs / 60000));
  const seconds = Math.max(0, Math.floor((remainingMs % 60000) / 1000));
  const soon = remainingMs < 5 * 60 * 1000 && remainingMs > 0;
  const expired = remainingMs <= 0;
  const color = expired ? 'red' : soon ? 'orange' : 'green';

  return (
    <Tooltip label={expired ? 'Session expirée' : soon ? 'Session bientôt expirée' : 'Session active'}>
      <Badge colorScheme={color} borderRadius="full" px={2} py={1}>
        {expired ? 'Expirée' : `Session: ${minutes}m ${seconds}s`}
      </Badge>
    </Tooltip>
  );
}
