import { useState } from 'react';
import { Button } from '@shadcn/ui';

export default function Home() {
  const [mode, setMode] = useState<'login'|'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`${mode} with ${username}`);
  };
  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Welcome back</h2>
      <div className="flex mb-6">
        <button
          className={`flex-1 py-2 ${mode==='login'?'border-b-2 border-black':''}`}
          onClick={()=>setMode('login')}
        >
          Login
        </button>
        <button
          className={`flex-1 py-2 ${mode==='register'?'border-b-2 border-black':''}`}
          onClick={()=>setMode('register')}
        >
          Register
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Username</label>
          <input
            type="text"
            value={username}
            onChange={e=>setUsername(e.target.value)}
            className="mt-1 block w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            className="mt-1 block w-full border px-3 py-2 rounded"
          />
        </div>
        <Button type="submit" className="w-full">Sign In</Button>
      </form>
      <p className="mt-4 text-center text-sm">
        Don’t have an account? <a href="/register" className="underline">Sign up</a>
      </p>
    </div>
  );
}