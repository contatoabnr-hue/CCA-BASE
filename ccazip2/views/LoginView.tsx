import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  UserCredential
} from 'firebase/auth';
import { auth } from '../firebase-config';
import { Button } from '../components/Button';

export const LoginView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (authAction: (auth: any, email: string, password: string) => Promise<UserCredential>) => {
    setLoading(true);
    setError(null);
    try {
      await authAction(auth, email, password);
      // O App.tsx irá lidar com o redirecionamento quando o estado de autenticação mudar.
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      backgroundColor: '#f0f2f5'
    }}>
      <div style={{
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        backgroundColor: 'white',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <h1 style={{ marginBottom: '24px', color: '#333' }}>Crônicas de Atlas</h1>
        <div style={{ marginBottom: '16px' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '4px', 
              border: '1px solid #ccc',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <div style={{ marginBottom: '24px' }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '4px', 
              border: '1px solid #ccc',
              boxSizing: 'border-box'
            }}
          />
        </div>
        {error && <p style={{ color: 'red', marginBottom: '16px' }}>{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
          <Button 
            onClick={() => handleAuth(signInWithEmailAndPassword)}
            disabled={loading || !email || !password}
            label={loading ? 'Entrando...' : 'Entrar'}
          />
          <Button 
            onClick={() => handleAuth(createUserWithEmailAndPassword)}
            disabled={loading || !email || !password}
            label={loading ? 'Registrando...' : 'Registrar'}
            variant="secondary"
          />
        </div>
      </div>
    </div>
  );
};
