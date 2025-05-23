import React, { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { LockKeyhole, ShieldCheck, User, Mail, Fingerprint } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { PasswordlessAuthForm } from "@/components/PasswordlessAuthForm";
import { isWebAuthnSupported, AuthResult } from "@/lib/passwordless-auth";

// Form validation schemas
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("login");
  const [authMethod, setAuthMethod] = useState<"password" | "passwordless">("password");
  const { user, loginMutation, registerMutation } = useAuth();
  const [webAuthnSupported, setWebAuthnSupported] = useState<boolean>(false);
  
  // Check for WebAuthn support on component mount
  useEffect(() => {
    setWebAuthnSupported(isWebAuthnSupported());
  }, []);
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle login form submission
  const onLoginSubmit = async (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  // Handle register form submission
  const onRegisterSubmit = async (data: RegisterFormData) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Auth forms */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {activeTab === "login" ? "Welcome back" : "Create an account"}
            </CardTitle>
            <CardDescription>
              {activeTab === "login"
                ? "Enter your credentials to access your account"
                : "Fill in the details below to create your secure wallet account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* Login form */}
              <TabsContent value="login">
                <Tabs value={authMethod} onValueChange={(value) => setAuthMethod(value as "password" | "passwordless")}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="password" className="flex items-center gap-2">
                      <LockKeyhole className="h-4 w-4" />
                      Password
                    </TabsTrigger>
                    <TabsTrigger 
                      value="passwordless" 
                      className="flex items-center gap-2"
                      disabled={!webAuthnSupported}
                    >
                      <Fingerprint className="h-4 w-4" />
                      Passwordless
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="password">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input className="pl-10" placeholder="Enter your username" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input 
                                    className="pl-10" 
                                    type="password" 
                                    placeholder="Enter your password" 
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                          {loginMutation.isPending ? "Signing in..." : "Sign In"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                  
                  <TabsContent value="passwordless">
                    {webAuthnSupported ? (
                      <PasswordlessAuthForm
                        username={loginForm.watch('username') || ''}
                        userId="temp-user-id"
                        onAuthSuccess={(result) => {
                          if (result.success) {
                            toast({
                              title: "Authentication Successful",
                              description: "You've successfully logged in with passwordless authentication."
                            });
                            
                            // In a real implementation, this would be handled by the authentication hook
                            // For now, we'll navigate to the home page after a delay
                            setTimeout(() => setLocation('/'), 1000);
                          }
                        }}
                        mode="login"
                      />
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-muted-foreground">
                          Your browser does not support passwordless authentication.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* Register form */}
              <TabsContent value="register">
                <Tabs value={authMethod} onValueChange={(value) => setAuthMethod(value as "password" | "passwordless")}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="password" className="flex items-center gap-2">
                      <LockKeyhole className="h-4 w-4" />
                      Password
                    </TabsTrigger>
                    <TabsTrigger 
                      value="passwordless" 
                      className="flex items-center gap-2"
                      disabled={!webAuthnSupported}
                    >
                      <Fingerprint className="h-4 w-4" />
                      Passwordless
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="password">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input className="pl-10" placeholder="Choose a username" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input className="pl-10" placeholder="Enter your email" type="email" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input 
                                    className="pl-10" 
                                    type="password" 
                                    placeholder="Create a secure password" 
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input 
                                    className="pl-10" 
                                    type="password" 
                                    placeholder="Confirm your password" 
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                          {registerMutation.isPending ? "Creating account..." : "Create Account"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                  
                  <TabsContent value="passwordless">
                    {webAuthnSupported ? (
                      <>
                        <div className="space-y-4 mb-4">
                          <FormField
                            control={registerForm.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input className="pl-10" placeholder="Choose a username" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={registerForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input className="pl-10" placeholder="Enter your email" type="email" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <PasswordlessAuthForm
                          username={registerForm.watch('username') || ''}
                          userId={`user-${Date.now()}`}
                          onAuthSuccess={(result) => {
                            if (result.success) {
                              toast({
                                title: "Registration Successful",
                                description: "You've successfully registered with passwordless authentication."
                              });
                              
                              // In a real implementation, this would submit the user data to the server
                              // and then log the user in automatically
                              // For now, we'll navigate to the home page after a delay
                              setTimeout(() => setLocation('/'), 1000);
                            }
                          }}
                          mode="register"
                        />
                      </>
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-muted-foreground">
                          Your browser does not support passwordless authentication.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-muted-foreground mt-2 text-center">
              {activeTab === "login" ? (
                <p>
                  Don't have an account?{" "}
                  <button
                    className="text-primary font-medium hover:underline"
                    onClick={() => setActiveTab("register")}
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button
                    className="text-primary font-medium hover:underline"
                    onClick={() => setActiveTab("login")}
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Right side - Hero section */}
      <div
        className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary/10 to-primary/30 flex-col justify-center p-12"
      >
        <div className="max-w-lg">
          <h1 className="text-4xl font-bold mb-6">
            <span className="text-primary">Secure</span> Smart Contract Wallet
          </h1>
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Advanced Security Features
              </h3>
              <p className="text-muted-foreground">
                Multi-party computation, zero-knowledge proofs, and AI-driven security protocols to keep your assets safe.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Automated Strategies
              </h3>
              <p className="text-muted-foreground">
                Set up recurring transactions, DCA strategies, and smart contract interactions with ease.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 8C2 6.89543 2.89543 6 4 6H20C21.1046 6 22 6.89543 22 8V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 14.5C6 13.6716 6.67157 13 7.5 13H9.5C10.3284 13 11 13.6716 11 14.5V16H6V14.5Z" fill="currentColor"/>
                  <path d="M15 13.5C15 12.6716 15.6716 12 16.5 12C17.3284 12 18 12.6716 18 13.5C18 14.3284 17.3284 15 16.5 15C15.6716 15 15 14.3284 15 13.5Z" fill="currentColor"/>
                  <path d="M8 6V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 6V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Multi-Chain Support
              </h3>
              <p className="text-muted-foreground">
                Built primarily for PulseChain with seamless Ethereum network support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}