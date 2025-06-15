// Filename: client/src/pages/Index.tsx

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Mail, Sparkles, User, Globe, AtSign, Linkedin, Calendar, Star, Zap, Edit, Github, Twitter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';


// --- Type Definitions ---
interface SenderProfile {
  name: string;
  title: string;
  company: string;
  website: string;
  uvp: string;
  email: string;
  linkedin: string;
  calcom: string;
  aboutYourself: string;
}

interface GeneratedEmail {
  subject: string;
  body: string;
}

// --- React Component ---
const Index = () => {
  const { toast } = useToast();
  
  // --- State Management ---
  const [senderProfile, setSenderProfile] = useState<SenderProfile>({
    name: '', title: '', company: '', website: '', uvp: '',
    email: '', linkedin: '', calcom: '', aboutYourself: ''
  });
  
  // NEW: State for recipient's name
  const [recipientName, setRecipientName] = useState('');
  const [recipientInfo, setRecipientInfo] = useState('');
  const [recipientContext, setRecipientContext] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProfileSaved, setIsProfileSaved] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [emailCount, setEmailCount] = useState(0);

  // --- Effects ---
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('coldEmailSenderProfile');
      const savedCount = localStorage.getItem('coldEmailCount');
      if (savedProfile) {
        setSenderProfile(JSON.parse(savedProfile));
        setIsProfileSaved(true);
      } else {
        setShowProfileForm(true);
      }
      if (savedCount) {
        setEmailCount(parseInt(savedCount, 10));
      }
    } catch (error) {
      console.error("Failed to parse data from localStorage:", error);
      localStorage.removeItem('coldEmailSenderProfile');
      setShowProfileForm(true);
    }
  }, []);

  // --- Handler Functions ---
  const handleInputChange = (field: keyof SenderProfile, value: string) => {
    setSenderProfile(prev => ({ ...prev, [field]: value }));
  };

  const saveProfile = () => {
    if (!senderProfile.name || !senderProfile.title || !senderProfile.uvp || !senderProfile.email) {
      toast({ title: "Missing Information", description: "Please fill in all required fields marked with *.", variant: "destructive" });
      return;
    }
    localStorage.setItem('coldEmailSenderProfile', JSON.stringify(senderProfile));
    setIsProfileSaved(true);
    setShowProfileForm(false);
    toast({ title: "Profile Saved!", description: "Your profile has been saved." });
  };

  // UPDATED: This now calls the AI backend and replaces all old template logic
  const generateEmail = async () => {
    if (!recipientInfo.trim()) {
      toast({ title: "Missing Information", description: "Please describe who you're sending this email to.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    setGeneratedEmail(null);

    try {
      const API_URL = 'http://localhost:3001/api/generate-email';
      const response = await axios.post<GeneratedEmail>(API_URL, {
        senderProfile,
        recipientInfo,
        recipientContext,
      });
      setGeneratedEmail(response.data);
      const newCount = emailCount + 1;
      setEmailCount(newCount);
      localStorage.setItem('coldEmailCount', newCount.toString());
      toast({ title: "Email Generated!", description: "Your AI-powered personalized email is ready." });
    } catch (error: any) {
        const errorMessage = error.response?.data?.error || "Could not connect to the server. Is it running?";
        toast({ title: "Generation Failed", description: errorMessage, variant: "destructive" });
    } finally {
        setIsGenerating(false);
    }
  };

  const getFullSignature = () => {
    return [
      senderProfile.name, senderProfile.title, senderProfile.company,
      senderProfile.email, senderProfile.website, senderProfile.linkedin,
      senderProfile.calcom
    ].filter(Boolean).join('\n');
  }

  // UPDATED: This now correctly formats the greeting and copies the full email
  const copyToClipboard = () => {
    if (!generatedEmail) return;
    const greeting = recipientName ? `Hi ${recipientName.trim()},\n\n` : `Hi there,\n\n`;
    const signature = getFullSignature();
    const fullEmailText = `Subject: ${generatedEmail.subject}\n\n${greeting}${generatedEmail.body}\n\nBest regards,\n\n${signature}`;
    navigator.clipboard.writeText(fullEmailText);
    toast({ title: "Copied!", description: "Full email with signature copied to clipboard." });
  };

  const editProfile = () => setShowProfileForm(true);

  // --- JSX Rendering ---

  if (showProfileForm || !isProfileSaved) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-teal-50">
        <div className="absolute top-20 left-10 w-4 h-4 bg-orange-400 rounded-full animate-bounce"></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-teal-400 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-5 h-5 bg-yellow-400 rounded-full animate-bounce delay-300"></div>
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-16 pt-16">
            <div className="flex items-center justify-center gap-4 mb-8">
              <Star className="w-8 h-8 text-orange-500 animate-spin" />
              <h1 className="text-6xl font-bold text-gray-900 leading-tight">Setup Your<br /><span className="text-teal-600">Profile</span></h1>
              <Zap className="w-8 h-8 text-yellow-500 animate-pulse" />
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12 font-light">Set up your profile once, then generate personalized cold emails instantly</p>
          </div>
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden max-w-2xl mx-auto">
            <CardHeader className="bg-gradient-to-r from-teal-600 to-teal-700 text-white pb-6">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold"><User className="w-6 h-6" />Your Profile</CardTitle>
              <CardDescription className="text-teal-100">Fill in your details once to get started</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3"><Label htmlFor="name" className="text-sm font-semibold text-gray-700">Name *</Label><Input id="name" placeholder="Alex Johnson" value={senderProfile.name} onChange={(e) => handleInputChange('name', e.target.value)} className="border-2 border-gray-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl h-12"/></div>
                <div className="space-y-3"><Label htmlFor="title" className="text-sm font-semibold text-gray-700">Title *</Label><Input id="title" placeholder="Head of Growth" value={senderProfile.title} onChange={(e) => handleInputChange('title', e.target.value)} className="border-2 border-gray-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl h-12"/></div>
              </div>
              <div className="space-y-3"><Label htmlFor="company" className="text-sm font-semibold text-gray-700">Company (Optional)</Label><Input id="company" placeholder="InnovateTech Solutions" className="border-2 border-gray-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl h-12" value={senderProfile.company} onChange={(e) => handleInputChange('company', e.target.value)}/></div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3"><Label htmlFor="website" className="text-sm font-semibold text-gray-700">Website</Label><div className="relative"><Globe className="absolute left-4 top-4 w-5 h-5 text-gray-400" /><Input id="website" placeholder="company.com" className="pl-12 border-2 border-gray-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl h-12" value={senderProfile.website} onChange={(e) => handleInputChange('website', e.target.value)}/></div></div>
                <div className="space-y-3"><Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email *</Label><div className="relative"><AtSign className="absolute left-4 top-4 w-5 h-5 text-gray-400" /><Input id="email" type="email" placeholder="alex@company.com" className="pl-12 border-2 border-gray-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl h-12" value={senderProfile.email} onChange={(e) => handleInputChange('email', e.target.value)}/></div></div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3"><Label htmlFor="linkedin" className="text-sm font-semibold text-gray-700">LinkedIn</Label><div className="relative"><Linkedin className="absolute left-4 top-4 w-5 h-5 text-gray-400" /><Input id="linkedin" placeholder="linkedin.com/in/alex" className="pl-12 border-2 border-gray-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl h-12" value={senderProfile.linkedin} onChange={(e) => handleInputChange('linkedin', e.target.value)}/></div></div>
                <div className="space-y-3"><Label htmlFor="calcom" className="text-sm font-semibold text-gray-700">Cal.com Link</Label><div className="relative"><Calendar className="absolute left-4 top-4 w-5 h-5 text-gray-400" /><Input id="calcom" placeholder="cal.com/alex" className="pl-12 border-2 border-gray-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl h-12" value={senderProfile.calcom} onChange={(e) => handleInputChange('calcom', e.target.value)}/></div></div>
              </div>
              <div className="space-y-3"><Label htmlFor="uvp" className="text-sm font-semibold text-gray-700">What you do *</Label><Textarea id="uvp" placeholder="Help B2B companies increase sales by 40% using AI." className="min-h-24 border-2 border-gray-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl" value={senderProfile.uvp} onChange={(e) => handleInputChange('uvp', e.target.value)}/></div>
              <div className="space-y-3"><Label htmlFor="aboutYourself" className="text-sm font-semibold text-gray-700">Tell us about yourself</Label><Textarea id="aboutYourself" placeholder="Share your background, achievements, or anything that would be relevant in a cold email..." className="min-h-32 border-2 border-gray-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl" value={senderProfile.aboutYourself} onChange={(e) => handleInputChange('aboutYourself', e.target.value)}/></div>
              <Button onClick={saveProfile} className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white py-6 text-lg font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-2xl border-0"><User className="w-6 h-6 mr-3" />Save Profile & Continue</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-teal-50">
      <div className="absolute top-20 left-10 w-4 h-4 bg-orange-400 rounded-full animate-bounce"></div>
      <div className="absolute top-40 right-20 w-6 h-6 bg-teal-400 rounded-full animate-pulse"></div>
      <div className="absolute bottom-20 left-20 w-5 h-5 bg-yellow-400 rounded-full animate-bounce delay-300"></div>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-16 pt-16">
          <div className="flex items-center justify-center gap-4 mb-8">
            <Star className="w-8 h-8 text-orange-500 animate-spin" /><h1 className="text-6xl font-bold text-gray-900 leading-tight">Generate Your<br /><span className="text-teal-600">Cold Email</span></h1><Zap className="w-8 h-8 text-yellow-500 animate-pulse" />
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8 font-light">Just tell us who you're reaching out to, and we'll create the perfect email</p>
          {emailCount > 0 && (<div className="flex justify-center mb-6"><div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-2 rounded-full text-sm font-medium">🎉 {emailCount} email{emailCount !== 1 ? 's' : ''} generated!</div></div>)}
          <div className="flex justify-center items-center gap-4 mb-12">
            <div className="bg-teal-600 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2"><User className="w-4 h-4" />Signed in as {senderProfile.name}</div>
            <Button variant="outline" onClick={editProfile} className="flex items-center gap-2 rounded-full"><Edit className="w-4 h-4" />Edit Profile</Button>
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <div className="space-y-8">
            {/* INTEGRATED: Recipient Name Input Field */}
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white pb-6">
                    <CardTitle className="flex items-center gap-3 text-2xl font-bold"><User className="w-6 h-6" />Recipient's First Name (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    <Input
                        placeholder="e.g., Zafar"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="border-2 border-gray-200 focus:border-purple-500 focus:ring-purple-500 rounded-xl h-12"
                    />
                </CardContent>
            </Card>

            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold"><Mail className="w-6 h-6" />Email Goal & Context</CardTitle>
                <CardDescription className="text-orange-100">Describe the recipient, your goal, and any context for personalization.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                <div>
                    <Label htmlFor="recipient-goal" className="text-sm font-semibold text-gray-700">Goal*</Label>
                    <Textarea
                    id="recipient-goal"
                    placeholder="e.g., CTO at a fintech startup for a demo of our API security tool."
                    className="border-2 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl min-h-[100px]"
                    value={recipientInfo}
                    onChange={(e) => setRecipientInfo(e.target.value)}
                    />
                </div>
                <div>
                    <Label htmlFor="recipient-context" className="text-sm font-semibold text-gray-700">Context for personalization (Optional)</Label>
                    <Textarea
                    id="recipient-context"
                    placeholder="e.g., Paste their LinkedIn bio, a recent article they wrote, or company news."
                    className="border-2 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl min-h-[100px]"
                    value={recipientContext}
                    onChange={(e) => setRecipientContext(e.target.value)}
                    />
                </div>
              </CardContent>
            </Card>

            <Button onClick={generateEmail} disabled={isGenerating} className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white py-6 text-lg font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-2xl border-0">
              {isGenerating ? (<><Sparkles className="w-6 h-6 mr-3 animate-spin" />Generating...</>) : (<><Sparkles className="w-6 h-6 mr-3" />Generate Email</>)}
            </Button>
          </div>
          <div>
            <Card className="h-fit sticky top-6 border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white pb-6">
                <CardTitle className="flex items-center justify-between text-2xl font-bold">
                  <span className="flex items-center gap-3"><Mail className="w-6 h-6" />Generated Email</span>
                  {generatedEmail && (<Button variant="outline" size="sm" onClick={copyToClipboard} className="flex items-center gap-2 border-2 border-white text-white bg-transparent hover:bg-white hover:text-gray-900 rounded-xl"><Copy className="w-4 h-4" />Copy</Button>)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {isGenerating ? (
                    <div className="text-center py-20 text-gray-400"><Sparkles className="w-12 h-12 opacity-50 mx-auto mb-4 animate-pulse" /><p className="text-xl font-medium">Crafting the perfect email...</p></div>
                ) : generatedEmail ? (
                  <div className="bg-gray-50 p-6 rounded-2xl border-2 border-gray-100 font-mono text-sm text-gray-800 leading-relaxed">
                    <div className="font-bold mb-4">Subject: {generatedEmail.subject}</div>
                    {/* UPDATED: Dynamic greeting rendering */}
                    <div className="whitespace-pre-wrap">
                        {recipientName ? `Hi ${recipientName.trim()},\n\n` : `Hi there,\n\n`}
                        {generatedEmail.body}
                    </div>
                  </div>
                ): (
                  <div className="text-center py-20 text-gray-400">
                    <div className="p-6 bg-gray-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center"><Mail className="w-12 h-12 opacity-50" /></div>
                    <p className="text-xl font-medium">Your email will appear here</p>
                    <p className="text-sm mt-2">Describe who you're reaching out to and click generate</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <footer className="mt-20 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left"><p className="text-gray-600 font-medium">Built with ❤️ by Divyansh Sharma</p><p className="text-sm text-gray-500 mt-1">Generate personalized cold emails in seconds</p></div>
            <div className="flex items-center gap-4">
              <a href="https://x.com/divyansharma001" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors duration-300"><Twitter className="w-4 h-4" /><span className="text-sm font-medium">Follow on X</span></a>
              <a href="https://github.com/divyansharma001" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-colors duration-300"><Github className="w-4 h-4" /><span className="text-sm font-medium">GitHub</span></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;