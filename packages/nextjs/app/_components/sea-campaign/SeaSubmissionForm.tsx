"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";
import { SEA_COUNTRIES } from "~~/utils/sea-challenges";

interface SeaSubmissionFormProps {
  weekNumber: number;
  challengeId: string;
  onSuccess?: () => void;
}

export function SeaSubmissionForm({ weekNumber, challengeId, onSuccess }: SeaSubmissionFormProps) {
  const { address } = useAccount();
  const [formData, setFormData] = useState({
    githubUrl: "",
    contractAddress: "",
    txHash: "", 
    demoUrl: "",
    socialPostUrl: "",
    country: "",
    telegramHandle: "",
    payoutWallet: address || ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.githubUrl.trim()) {
      newErrors.githubUrl = "GitHub URL is required";
    } else if (!formData.githubUrl.includes("github.com")) {
      newErrors.githubUrl = "Please provide a valid GitHub URL";
    }
    
    if (!formData.socialPostUrl.trim()) {
      newErrors.socialPostUrl = "Social media post URL is required";
    } else if (!isValidSocialUrl(formData.socialPostUrl)) {
      newErrors.socialPostUrl = "Please provide a valid social media post URL (Twitter, LinkedIn, etc.)";
    }
    
    if (formData.contractAddress && !isValidEthereumAddress(formData.contractAddress)) {
      newErrors.contractAddress = "Please provide a valid contract address";
    }
    
    if (formData.txHash && !isValidTxHash(formData.txHash)) {
      newErrors.txHash = "Please provide a valid transaction hash";
    }
    
    if (formData.payoutWallet && !isValidEthereumAddress(formData.payoutWallet)) {
      newErrors.payoutWallet = "Please provide a valid wallet address";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEthereumAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const isValidTxHash = (hash: string): boolean => {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
  };

  const isValidSocialUrl = (url: string): boolean => {
    const socialDomains = ['twitter.com', 'x.com', 'linkedin.com', 'facebook.com', 'instagram.com'];
    return socialDomains.some(domain => url.includes(domain));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/sea-campaign/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekNumber,
          challengeId,
          userAddress: address,
          ...formData
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Submission successful! 🎉");
        
        // Reset form
        setFormData({
          githubUrl: "",
          contractAddress: "",
          txHash: "",
          demoUrl: "", 
          socialPostUrl: "",
          country: "",
          telegramHandle: "",
          payoutWallet: address
        });
        
        // Show progress update
        if (data.progress) {
          toast.success(`Progress: ${data.progress.totalWeeksCompleted}/6 weeks completed!`, {
            duration: 4000,
          });
        }
        
        // Call success callback
        onSuccess?.();
      } else {
        toast.error(data.error || "Submission failed");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-2">
          📝 Submit Your Week {weekNumber} Challenge
        </h2>
        <p className="text-base-content/70 mb-6">
          Complete all required fields to submit your challenge. Make sure to test your application 
          and verify your smart contracts before submitting.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Required Fields */}
          <div className="border-2 border-primary/20 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-4 text-primary">Required Fields</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">GitHub Repository URL *</span>
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/username/repository"
                  className={`input input-bordered ${errors.githubUrl ? 'input-error' : ''}`}
                  value={formData.githubUrl}
                  onChange={(e) => setFormData({...formData, githubUrl: e.target.value})}
                  required
                />
                {errors.githubUrl && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.githubUrl}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Social Media Post URL *</span>
                  <span className="label-text-alt">Twitter, LinkedIn, etc.</span>
                </label>
                <input
                  type="url"
                  placeholder="https://twitter.com/username/status/... or LinkedIn post"
                  className={`input input-bordered ${errors.socialPostUrl ? 'input-error' : ''}`}
                  value={formData.socialPostUrl}
                  onChange={(e) => setFormData({...formData, socialPostUrl: e.target.value})}
                  required
                />
                {errors.socialPostUrl && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.socialPostUrl}</span>
                  </label>
                )}
                <label className="label">
                  <span className="label-text-alt">
                    Remember to include hashtags: #SpeedrunLiskSEA #W{weekNumber} @LiskSEA
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Smart Contract Fields */}
          <div className="border-2 border-secondary/20 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-4 text-secondary">Smart Contract Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Contract Address</span>
                  <span className="label-text-alt">If applicable</span>
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  className={`input input-bordered ${errors.contractAddress ? 'input-error' : ''}`}
                  value={formData.contractAddress}
                  onChange={(e) => setFormData({...formData, contractAddress: e.target.value})}
                />
                {errors.contractAddress && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.contractAddress}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Deploy Transaction Hash</span>
                  <span className="label-text-alt">If applicable</span>
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  className={`input input-bordered ${errors.txHash ? 'input-error' : ''}`}
                  value={formData.txHash}
                  onChange={(e) => setFormData({...formData, txHash: e.target.value})}
                />
                {errors.txHash && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.txHash}</span>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Demo and Profile */}
          <div className="border-2 border-accent/20 rounded-lg p-6">
            <h3 className="font-bold text-lg mb-4 text-accent">Demo & Profile</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Demo URL</span>
                  <span className="label-text-alt">Deployed application URL</span>
                </label>
                <input
                  type="url"
                  placeholder="https://your-app.vercel.app"
                  className="input input-bordered"
                  value={formData.demoUrl}
                  onChange={(e) => setFormData({...formData, demoUrl: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Country</span>
                  </label>
                  <select 
                    className="select select-bordered"
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                  >
                    <option value="">Select your country</option>
                    {SEA_COUNTRIES.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Telegram Handle</span>
                  </label>
                  <input
                    type="text"
                    placeholder="@username"
                    className="input input-bordered"
                    value={formData.telegramHandle}
                    onChange={(e) => setFormData({...formData, telegramHandle: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Payout Wallet Address</span>
                  <span className="label-text-alt">For completion bonuses</span>
                </label>
                <input
                  type="text"
                  placeholder="0x... (defaults to connected wallet)"
                  className={`input input-bordered ${errors.payoutWallet ? 'input-error' : ''}`}
                  value={formData.payoutWallet}
                  onChange={(e) => setFormData({...formData, payoutWallet: e.target.value})}
                />
                {errors.payoutWallet && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.payoutWallet}</span>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Submission Guidelines */}
          <div className="alert alert-info">
            <div className="flex-col items-start">
              <h4 className="font-bold mb-2">📋 Submission Guidelines</h4>
              <ul className="text-sm space-y-1">
                <li>• Ensure your GitHub repository is public and contains a README</li>
                <li>• Test your application thoroughly before submitting</li>
                <li>• Include screenshots or demo videos in your social media post</li>
                <li>• Double-check all URLs are accessible and working</li>
                <li>• You can only submit once per week</li>
              </ul>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-control">
            <button 
              type="submit" 
              className={`btn btn-primary btn-lg ${isSubmitting ? 'loading' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : `Submit Week ${weekNumber} Challenge`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}