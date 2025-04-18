import { useState } from 'react';
import { useSigner, useContractWrite, useContractRead } from 'wagmi';
import { ethers } from 'ethers';
import SmartWalletAbi from '../config/abi/SmartWallet.json';

export default function WalletPage() {
  const { data: signer } = useSigner();
  const [to, setTo] = useState('');
  const [value, setValue] = useState('0');
  const contractAddress = '<DEPLOYED_WALLET_ADDRESS>';

  const { data: owner } = useContractRead({
    address: contractAddress,
    abi: SmartWalletAbi,
    functionName: 'owner'
  });

  const execute = useContractWrite({
    address: contractAddress,
    abi: SmartWalletAbi,
    functionName: 'execute',
    signerOrProvider: signer,
  });

  const handleExecute = async () => {
    const ethValue = ethers.utils.parseEther(value);
    await execute.write({
      args: [to, ethValue, '0x', [], [], []]
    });
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-xl font-bold mb-4">SmartWallet Dashboard</h1>
      <p>Owner: {owner}</p>
      <div className="mt-4 space-y-3">
        <input
          className="w-full border px-3 py-2 rounded"
          placeholder="Recipient"
          value={to}
          onChange={e => setTo(e.target.value)}  
        />
        <input
          className="w-full border px-3 py-2 rounded"
          placeholder="Amount (ETH)"  
          value={value}
          onChange={e => setValue(e.target.value)}  
        />
        <button
          onClick={handleExecute}
          className="w-full py-2 bg-blue-600 text-white rounded"  
        >
          Execute Tx
        </button>
      </div>
    </div>
  );
}