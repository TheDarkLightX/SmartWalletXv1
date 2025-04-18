import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  PrivacyLevel,
  privacyLevelConfig
} from '@/lib/zk-proofs';
import {
  SUPPORTED_DENOMINATIONS,
  MixerNote,
  depositToMixer,
  withdrawFromMixer,
  calculatePrivacyScore,
  getRecommendedPrivacySettings,
  estimatePrivacyMixingTime,
  formatPrivacyMixingTime,
  encryptNote,
  decryptNote,
  isNoteSpent
} from '@/lib/privacy-mixer';
import { Download, Eye, EyeOff, Lock, Shield, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PrivacyMixerProps {
  walletAddress?: string;
  privateKey?: string;
  balance?: string;
  network: 'pulsechain' | 'ethereum';
}

const PrivacyMixer: React.FC<PrivacyMixerProps> = ({
  walletAddress = '',
  privateKey = '',
  balance = '0',
  network = 'pulsechain'
}) => {
  // State for deposit tab
  const [depositAmount, setDepositAmount] = useState('1');
  const [selectedDenomination, setSelectedDenomination] = useState<number>(1);
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>(PrivacyLevel.STANDARD);
  const [notePassword, setNotePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [privacyScore, setPrivacyScore] = useState(0);
  const [useAdvancedMode, setUseAdvancedMode] = useState(false);
  const [transactionCount, setTransactionCount] = useState(1);
  const [noteKey, setNoteKey] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // State for withdrawal tab
  const [encryptedNote, setEncryptedNote] = useState('');
  const [withdrawalPassword, setWithdrawalPassword] = useState('');
  const [decryptedNote, setDecryptedNote] = useState<MixerNote | null>(null);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [useRelayer, setUseRelayer] = useState(true);
  const [relayerFee, setRelayerFee] = useState('0.001');
  const [isNoteDecrypted, setIsNoteDecrypted] = useState(false);
  const [isNoteValid, setIsNoteValid] = useState(false);

  // State for deposit/withdrawal processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');

  const { toast } = useToast();

  // Update privacy settings when amount changes
  useEffect(() => {
    if (!useAdvancedMode) {
      // Get recommended settings
      const { 
        privacyLevel: recommendedLevel, 
        denomination: recommendedDenom, 
        count: recommendedCount,
        privacyScore: score
      } = getRecommendedPrivacySettings(depositAmount, network);
      
      setPrivacyLevel(recommendedLevel);
      setSelectedDenomination(recommendedDenom);
      setTransactionCount(recommendedCount);
      setPrivacyScore(score);
    } else {
      // When in advanced mode, manually calculate privacy score
      setPrivacyScore(calculatePrivacyScore(privacyLevel, selectedDenomination, network));
      setTransactionCount(Math.ceil(parseFloat(depositAmount) / selectedDenomination));
    }
    
    // Update estimated time
    setEstimatedTime(estimatePrivacyMixingTime(privacyLevel, transactionCount));
  }, [depositAmount, useAdvancedMode, privacyLevel, selectedDenomination, network]);

  // Handle deposit
  const handleDeposit = async () => {
    if (!privateKey) {
      toast({
        title: "Private Key Required",
        description: "Your private key is required to sign the transaction.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      // Validate amount
      const amountValue = parseFloat(depositAmount);
      if (isNaN(amountValue) || amountValue <= 0) {
        throw new Error("Invalid amount");
      }
      
      // Validate password
      if (!notePassword) {
        throw new Error("Note password is required");
      }
      
      // Create deposit
      const result = await depositToMixer(
        selectedDenomination.toString(), 
        selectedDenomination,
        network,
        privacyLevel,
        privateKey
      );
      
      if (!result.success || !result.note) {
        throw new Error(result.error || "Failed to deposit");
      }
      
      // Encrypt note with password
      const encrypted = encryptNote(result.note, notePassword);
      
      // Generate a random key for the note
      const newNoteKey = `note_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
      setNoteKey(newNoteKey);
      
      // Set transaction hash
      setTransactionHash(result.transactionHash || '');
      
      // Show note saving UI
      setSavingNote(true);
      
      toast({
        title: "Deposit Successful",
        description: "Your funds have been deposited to the mixer.",
        variant: "default"
      });
      
      // Simulate download
      const blob = new Blob([encrypted], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `secure-wallet-note-${newNoteKey}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Deposit Failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle note decryption
  const handleDecryptNote = async () => {
    try {
      if (!encryptedNote) {
        throw new Error("Encrypted note is required");
      }
      
      if (!withdrawalPassword) {
        throw new Error("Password is required");
      }
      
      // Decrypt note
      const note = decryptNote(encryptedNote, withdrawalPassword);
      
      // Check if note is valid
      const isValid = note && note.amount && note.commitment && note.nullifier;
      
      if (!isValid) {
        throw new Error("Invalid note format");
      }
      
      // Check if note has been spent
      const spent = await isNoteSpent(note, network);
      if (spent) {
        throw new Error("This note has already been spent");
      }
      
      // Set decrypted note
      setDecryptedNote(note);
      setIsNoteDecrypted(true);
      setIsNoteValid(true);
      
      toast({
        title: "Note Decrypted",
        description: `Note for ${note.amount} ${network === 'pulsechain' ? 'PLS' : 'ETH'} is valid.`,
      });
    } catch (error) {
      setIsNoteDecrypted(false);
      setIsNoteValid(false);
      
      toast({
        title: "Decryption Failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    }
  };

  // Handle withdrawal
  const handleWithdrawal = async () => {
    try {
      setIsProcessing(true);
      
      if (!decryptedNote) {
        throw new Error("Valid note is required");
      }
      
      if (!recipientAddress) {
        throw new Error("Recipient address is required");
      }
      
      // Validate recipient address
      if (!recipientAddress.startsWith('0x') || recipientAddress.length !== 42) {
        throw new Error("Invalid recipient address");
      }
      
      // Process withdrawal
      const result = await withdrawFromMixer(
        decryptedNote,
        recipientAddress,
        useRelayer ? 'relay.securewallet.com' : undefined, // Mock relayer address
        useRelayer ? relayerFee : undefined,
        undefined, // No refund for now
        useRelayer ? undefined : privateKey // Only use private key if not using relayer
      );
      
      if (!result.success) {
        throw new Error(result.error || "Failed to withdraw");
      }
      
      // Set transaction hash
      setTransactionHash(result.transactionHash || '');
      
      toast({
        title: "Withdrawal Successful",
        description: `Successfully withdrew ${decryptedNote.amount} ${network === 'pulsechain' ? 'PLS' : 'ETH'} to ${recipientAddress.substring(0, 6)}...${recipientAddress.substring(38)}`,
      });
      
      // Reset withdrawal form
      setEncryptedNote('');
      setWithdrawalPassword('');
      setDecryptedNote(null);
      setIsNoteDecrypted(false);
      setIsNoteValid(false);
      setRecipientAddress('');
    } catch (error) {
      toast({
        title: "Withdrawal Failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Render privacy level description
  const renderPrivacyLevelDescription = (level: PrivacyLevel) => {
    const config = privacyLevelConfig[level];
    
    switch (level) {
      case PrivacyLevel.BASIC:
        return `Basic privacy with ${config.mixingRounds} mixing rounds and no time delay.`;
      case PrivacyLevel.STANDARD:
        return `Enhanced privacy with ${config.mixingRounds} mixing rounds and a ${config.timeDelay} minute time delay.`;
      case PrivacyLevel.MAXIMUM:
        return `Maximum privacy with ${config.mixingRounds} mixing rounds and a ${config.timeDelay} minute time delay.`;
      default:
        return '';
    }
  };

  // Note saving UI
  if (savingNote) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Save Your Privacy Note
          </CardTitle>
          <CardDescription>
            This note is essential for withdrawing your funds. Keep it secure!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4 bg-yellow-50 dark:bg-yellow-950 border-yellow-500">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              If you lose this note, your funds will be permanently lost. There is no recovery option.
            </AlertDescription>
          </Alert>
          
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md mb-4 border">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Your note has been downloaded as:</p>
            <p className="font-mono text-sm break-all">secure-wallet-note-{noteKey}.txt</p>
          </div>
          
          <div className="flex flex-col space-y-2 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Amount:</span>
              <span className="font-semibold">{selectedDenomination} {network === 'pulsechain' ? 'PLS' : 'ETH'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Privacy Level:</span>
              <span className="font-semibold capitalize">{privacyLevel}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Transaction:</span>
              <a 
                href={`https://${network === 'pulsechain' ? 'scan.pulsechain.com' : 'etherscan.io'}/tx/${transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {transactionHash.substring(0, 8)}...{transactionHash.substring(58)}
              </a>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400">
            To recover your funds, you'll need both this note file and the password you created.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={() => {
              setSavingNote(false);
              setDepositAmount('');
              setNotePassword('');
            }}
          >
            Continue
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Privacy Mixer
        </CardTitle>
        <CardDescription>
          Enhance your transaction privacy with our secure mixing service
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          </TabsList>
          
          {/* Deposit Tab */}
          <TabsContent value="deposit">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="deposit-amount">Amount to Privatize</Label>
                <div className="relative">
                  <Input
                    id="deposit-amount"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="pr-12"
                    placeholder="Enter amount"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500">
                      {network === 'pulsechain' ? 'PLS' : 'ETH'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Available balance: {balance} {network === 'pulsechain' ? 'PLS' : 'ETH'}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="advanced-mode"
                  checked={useAdvancedMode}
                  onCheckedChange={setUseAdvancedMode}
                />
                <Label htmlFor="advanced-mode">Advanced Mode</Label>
              </div>
              
              {useAdvancedMode && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="denomination">Denomination</Label>
                    <Select
                      value={selectedDenomination.toString()}
                      onValueChange={(value) => setSelectedDenomination(parseFloat(value))}
                    >
                      <SelectTrigger id="denomination">
                        <SelectValue placeholder="Select Denomination" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_DENOMINATIONS.map((denom) => (
                          <SelectItem key={denom} value={denom.toString()}>
                            {denom} {network === 'pulsechain' ? 'PLS' : 'ETH'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Will require {transactionCount} transaction{transactionCount > 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="privacy-level">Privacy Level</Label>
                    <Select
                      value={privacyLevel}
                      onValueChange={(value) => setPrivacyLevel(value as PrivacyLevel)}
                    >
                      <SelectTrigger id="privacy-level">
                        <SelectValue placeholder="Select Privacy Level" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(PrivacyLevel).map((level) => (
                          <SelectItem key={level} value={level}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      {renderPrivacyLevelDescription(privacyLevel)}
                    </p>
                  </div>
                </>
              )}
              
              <div className="grid gap-2">
                <div className="flex justify-between items-center">
                  <Label>Privacy Score</Label>
                  <span className="text-sm font-medium">{privacyScore}%</span>
                </div>
                <Progress value={privacyScore} className="h-2" />
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span>Estimated time: {formatPrivacyMixingTime(estimatedTime)}</span>
              </div>
              
              <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-500">
                <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle>Note Password Required</AlertTitle>
                <AlertDescription>
                  You need to set a strong password to encrypt your withdrawal note.
                </AlertDescription>
              </Alert>
              
              <div className="grid gap-2">
                <Label htmlFor="note-password">Note Password</Label>
                <div className="relative">
                  <Input
                    id="note-password"
                    type={showPassword ? "text" : "password"}
                    value={notePassword}
                    onChange={(e) => setNotePassword(e.target.value)}
                    placeholder="Enter secure password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  This password will be required to withdraw your funds. Make sure you remember it!
                </p>
              </div>
              
              <Button 
                onClick={handleDeposit} 
                disabled={isProcessing || !depositAmount || !notePassword}
              >
                {isProcessing ? "Processing..." : "Deposit to Mixer"}
              </Button>
            </div>
          </TabsContent>
          
          {/* Withdraw Tab */}
          <TabsContent value="withdraw">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="encrypted-note">Encrypted Note</Label>
                <textarea
                  id="encrypted-note"
                  rows={5}
                  className="w-full p-2 border rounded-md dark:bg-gray-900"
                  value={encryptedNote}
                  onChange={(e) => setEncryptedNote(e.target.value)}
                  placeholder="Paste your encrypted note here"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="withdrawal-password">Note Password</Label>
                <div className="relative">
                  <Input
                    id="withdrawal-password"
                    type={showPassword ? "text" : "password"}
                    value={withdrawalPassword}
                    onChange={(e) => setWithdrawalPassword(e.target.value)}
                    placeholder="Enter note password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <Button 
                onClick={handleDecryptNote}
                disabled={!encryptedNote || !withdrawalPassword}
                variant="outline"
              >
                Decrypt Note
              </Button>
              
              {isNoteDecrypted && decryptedNote && (
                <>
                  <Alert className={isNoteValid ? "bg-green-50 dark:bg-green-950 border-green-500" : "bg-red-50 dark:bg-red-950 border-red-500"}>
                    <AlertTitle>
                      {isNoteValid ? "Valid Note" : "Invalid Note"}
                    </AlertTitle>
                    <AlertDescription>
                      {isNoteValid ? 
                        `Found valid note for ${decryptedNote.amount} ${network === 'pulsechain' ? 'PLS' : 'ETH'}.` : 
                        "This note is invalid or has already been spent."}
                    </AlertDescription>
                  </Alert>
                  
                  {isNoteValid && (
                    <>
                      <div className="grid gap-2">
                        <Label htmlFor="recipient-address">Recipient Address</Label>
                        <Input
                          id="recipient-address"
                          value={recipientAddress}
                          onChange={(e) => setRecipientAddress(e.target.value)}
                          placeholder="0x..."
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="use-relayer"
                          checked={useRelayer}
                          onCheckedChange={setUseRelayer}
                        />
                        <Label htmlFor="use-relayer">Use Relayer (Enhanced Privacy)</Label>
                      </div>
                      
                      {useRelayer && (
                        <div className="grid gap-2">
                          <Label htmlFor="relayer-fee">Relayer Fee</Label>
                          <div className="relative">
                            <Input
                              id="relayer-fee"
                              type="number"
                              step="0.0001"
                              min="0.0001"
                              value={relayerFee}
                              onChange={(e) => setRelayerFee(e.target.value)}
                              className="pr-12"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <span className="text-gray-500">
                                {network === 'pulsechain' ? 'PLS' : 'ETH'}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            Using a relayer prevents linking your withdrawal to your identity.
                          </p>
                        </div>
                      )}
                      
                      <Button 
                        onClick={handleWithdrawal}
                        disabled={isProcessing || !recipientAddress || (useRelayer && !relayerFee)}
                      >
                        {isProcessing ? "Processing..." : "Withdraw Funds"}
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PrivacyMixer;