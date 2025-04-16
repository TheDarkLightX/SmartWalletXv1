import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Fingerprint, Key, Loader2, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

import {
  isWebAuthnSupported,
  hasPlatformAuthenticator,
  AuthenticatorType,
  registerPasswordlessCredential,
  authenticateWithPasswordless,
  hasRegisteredCredentials,
  markUserAsRegistered,
  AuthResult
} from '@/lib/passwordless-auth';

type PasswordlessAuthFormProps = {
  username: string;
  userId: string;
  onAuthSuccess: (result: AuthResult) => void;
  mode: 'register' | 'login';
};

export function PasswordlessAuthForm({ 
  username, 
  userId, 
  onAuthSuccess,
  mode 
}: PasswordlessAuthFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [webAuthnSupported, setWebAuthnSupported] = useState<boolean>(false);
  const [hasBiometrics, setHasBiometrics] = useState<boolean>(false);
  const [hasRegistered, setHasRegistered] = useState<boolean>(false);

  useEffect(() => {
    // Check for WebAuthn support
    const waSupported = isWebAuthnSupported();
    setWebAuthnSupported(waSupported);
    
    // Check for platform authenticator (biometrics)
    if (waSupported) {
      hasPlatformAuthenticator().then(setHasBiometrics);
    }
    
    // Check if the user has already registered a credential
    if (username) {
      hasRegisteredCredentials(username).then(setHasRegistered);
    }
  }, [username]);

  const handleRegister = async (authenticatorType: AuthenticatorType) => {
    if (!username || !userId) {
      setError('Username and user ID are required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await registerPasswordlessCredential(username, userId, authenticatorType);
      
      if (result.success) {
        markUserAsRegistered(username);
        setHasRegistered(true);
        
        toast({
          title: "Registration Successful",
          description: "Your device has been registered for passwordless authentication",
        });
        
        onAuthSuccess(result);
      } else {
        setError(result.error || 'Registration failed');
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: result.error || 'Failed to register device',
        });
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'An error occurred during registration',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticate = async () => {
    if (!username) {
      setError('Username is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await authenticateWithPasswordless(username);
      
      if (result.success) {
        toast({
          title: "Authentication Successful",
          description: "You have been authenticated using passwordless credentials",
        });
        
        onAuthSuccess(result);
      } else {
        setError(result.error || 'Authentication failed');
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: result.error || 'Failed to authenticate',
        });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'An error occurred during authentication',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!webAuthnSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShieldAlert className="mr-2 h-5 w-5" />
            Passwordless Authentication Not Supported
          </CardTitle>
          <CardDescription>
            Your browser does not support WebAuthn required for passwordless authentication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please use a modern browser like Chrome, Firefox, Safari, or Edge that supports WebAuthn.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          {hasBiometrics ? (
            <>
              <Fingerprint className="mr-2 h-5 w-5" />
              {mode === 'register' ? 'Register Biometric Authentication' : 'Authenticate with Biometrics'}
            </>
          ) : (
            <>
              <Key className="mr-2 h-5 w-5" />
              {mode === 'register' ? 'Register Security Key' : 'Authenticate with Security Key'}
            </>
          )}
        </CardTitle>
        <CardDescription>
          {mode === 'register' 
            ? 'Register your device for passwordless authentication' 
            : 'Use your registered device to log in'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {mode === 'register' && !hasRegistered && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username} disabled />
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>Choose how you want to authenticate:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                {hasBiometrics && (
                  <li>Use your device's biometric sensor (fingerprint, face recognition)</li>
                )}
                <li>Use an external security key (YubiKey, etc.)</li>
                <li>Some browsers may ask you to set a PIN for additional security</li>
              </ul>
            </div>
          </div>
        )}
        
        {mode === 'register' && hasRegistered && (
          <div className="text-center py-2">
            <p className="text-green-600 font-medium">
              Your device has already been registered!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              You can now use passwordless authentication to log in.
            </p>
          </div>
        )}
        
        {mode === 'login' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-username">Username</Label>
              <Input id="login-username" value={username} disabled />
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>Click the button below to authenticate:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>You may be prompted to use your biometric sensor or security key</li>
                <li>Follow the on-screen instructions from your browser</li>
                <li>Keep your security key nearby if you registered one</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-2">
        {mode === 'register' && !hasRegistered && (
          <>
            {hasBiometrics && (
              <Button 
                className="w-full"
                onClick={() => handleRegister(AuthenticatorType.PLATFORM)}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>Register with Biometrics</>
                )}
              </Button>
            )}
            
            <Button 
              variant={hasBiometrics ? "outline" : "default"}
              className="w-full"
              onClick={() => handleRegister(AuthenticatorType.CROSS_PLATFORM)}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>Register Security Key</>
              )}
            </Button>
          </>
        )}
        
        {mode === 'register' && hasRegistered && (
          <Button 
            variant="outline"
            className="w-full"
            onClick={() => handleAuthenticate()}
          >
            Continue to Login
          </Button>
        )}
        
        {mode === 'login' && (
          <Button 
            className="w-full"
            onClick={() => handleAuthenticate()}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>Authenticate Now</>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}