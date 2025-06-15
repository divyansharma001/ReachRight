import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Mail, Sparkles, User, Globe, AtSign, Linkedin, Calendar, Star, Zap, Edit, Github, Twitter, Target, Info } from "lucide-react";
import { useToast } from "@/components/ui/use-toast"; // Corrected hook import path
import axios from 'axios';


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

const Index = () => {
  const { toast } = useToast();
  const [senderProfile, setSenderProfile] = useState<SenderProfile>({
    name: '',
    title: '',
    company: '',
    website: '',
    uvp: '',
    email: '',
    linkedin: '',
    calcom: '',
    aboutYourself: ''
  });
  
  // --- IMPROVED RECIPIENT STATE ---
  const [recipientName, setRecipientName] = useState('');
  const [emailGoal, setEmailGoal] = useState('');
  const [recipientContext, setRecipientContext] = useState('');
 
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProfileSaved, setIsProfileSaved] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [emailCount, setEmailCount] = useState(0);
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);

  // Load saved profile and email count on component mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('coldEmailSenderProfile');
    const savedCount = localStorage.getItem('coldEmailCount');
    
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setSenderProfile(parsed);
        setIsProfileSaved(true);
      } catch (error) {
        console.log('Error loading saved profile:', error);
      }
    } else {
      setShowProfileForm(true);
    }

    if (savedCount) {
      setEmailCount(parseInt(savedCount, 10));
    }
  }, []);

  const handleInputChange = (field: keyof SenderProfile, value: string) => {
    setSenderProfile(prev => ({ ...prev, [field]: value }));
  };

  const saveProfile = () => {
    if (!senderProfile.name || !senderProfile.title || !senderProfile.uvp || !senderProfile.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields to save your profile.",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem('coldEmailSenderProfile', JSON.stringify(senderProfile));
    setIsProfileSaved(true);
    setShowProfileForm(false);
    toast({
      title: "Profile Saved!",
      description: "Your profile has been saved. You can now generate emails quickly.",
    });
  };

  const generateEmail = async () => {
    if (!emailGoal.trim()) {
      toast({ title: "Missing Information", description: "Please describe the goal of your email.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    setGeneratedEmail(null);

    try {
      const API_URL = 'https://reachright.onrender.com/api/generate-email';

      // --- SENDING IMPROVED DATA STRUCTURE ---
      const response = await axios.post(API_URL, {
        senderProfile,
        recipientName,
        emailGoal,
        recipientContext,
      });
      
      setGeneratedEmail(response.data);
      
      const newCount = emailCount + 1;
      setEmailCount(newCount);
      localStorage.setItem('coldEmailCount', newCount.toString());
      
      toast({ title: "Email Generated!", description: "Your AI-powered personalized email is ready." });
    } catch (error: any) {
        console.error("Error calling backend:", error);
        const errorMessage = error.response?.data?.error || "Could not connect to the server. Is it running?";
        toast({ title: "Generation Failed", description: errorMessage, variant: "destructive" });
    } finally {
        setIsGenerating(false);
    }
  };

  const getFullEmailText = () => {
    if (!generatedEmail) return '';
    
    const signature = `
Best regards,

${senderProfile.name}
${senderProfile.title}${senderProfile.company ? `, ${senderProfile.company}` : ''}
${senderProfile.email || ''}${senderProfile.website ? `\n${senderProfile.website}` : ''}${senderProfile.linkedin ? `\n${senderProfile.linkedin}` : ''}${senderProfile.calcom ? `\nBook a meeting: ${senderProfile.calcom}` : ''}
    `;

    return `Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}${signature}`;
  }

  const copyToClipboard = () => {
    if (generatedEmail) {
      navigator.clipboard.writeText(getFullEmailText());
      toast({
        title: "Copied!",
        description: "Full email and subject copied to clipboard.",
      });
    }
  };

  const editProfile = () => {
    setShowProfileForm(true);
  };

  if (showProfileForm || !isProfileSaved) {
    // --- The Profile Form remains the same, no changes needed here ---
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-teal-50">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-4 h-4 bg-orange-400 rounded-full animate-bounce"></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-teal-400 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-5 h-5 bg-yellow-400 rounded-full animate-bounce delay-300"></div>
        
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16 pt-16">
            <div className="flex items-center justify-center gap-4 mb-8">
              <Star className="w-8 h-8 text-orange-500 animate-spin" />
              <h1 className="text-6xl font-bold text-gray-900 leading-tight">
                Setup Your
                <br />
                <span className="text-teal-600">Profile</span>
              </h1>
              <Zap className="w-8 h-8 text-yellow-500 animate-pulse" />
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12 font-light">
              Set up your profile once, then generate personalized cold emails instantly
            </p>
          </div>

          {/* Profile Setup Form */}
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden max-w-2xl mx-auto">
            <CardHeader className="bg-gradient-to-r from-teal-600 to-teal-700 text-white pb-6">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                <User className="w-6 h-6" />
                Your Profile
              </CardTitle>
              <CardDescription className="text-teal-100">
                Fill in your details once to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Name *</Label>
                  <Input
                    id="name"
                    placeholder="Alex Johnson"
                    value={senderProfile.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="border-2 border-gray-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl h-12"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="title" className="text-sm font-semibold text-gray-700">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Head of Growth"
                    value={senderProfile.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="border-2 border-gray-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl h-12"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="company" className="text-sm font-semibold text-gray-700">Company (Optional)</Label>
                <Input
                  id="company"
                  placeholder="InnovateTech Solutions"
                  className="border-2 border-gray-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl h-12"
                  value={senderProfile.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="website" className="text-sm font-semibold text-gray-700">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    <Input
                      id="website"
                      placeholder="company.com"
                      className="pl-12 border-2 border-gray-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl h-12"
                      value={senderProfile.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email *</Label>
                  <div className="relative">
                    <AtSign className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="alex@company.com"
                      className="pl-12 border-2 border-gray-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl h-12"
                      value={senderProfile.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="linkedin" className="text-sm font-semibold text-gray-700">LinkedIn</Label>
                  <div className="relative">
                    <Linkedin className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    <Input
                      id="linkedin"
                      placeholder="linkedin.com/in/alex"
                      className="pl-12 border-2 border-gray-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl h-12"
                      value={senderProfile.linkedin}
                      onChange={(e) => handleInputChange('linkedin', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="calcom" className="text-sm font-semibold text-gray-700">Cal.com Link</Label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    <Input
                      id="calcom"
                      placeholder="cal.com/alex"
                      className="pl-12 border-2 border-gray-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl h-12"
                      value={senderProfile.calcom}
                      onChange={(e) => handleInputChange('calcom', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="uvp" className="text-sm font-semibold text-gray-700">What you do *</Label>
                <Textarea
                  id="uvp"
                  placeholder="Help B2B companies increase sales by 40% using AI."
                  className="min-h-24 border-2 border-gray-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl"
                  value={senderProfile.uvp}
                  onChange={(e) => handleInputChange('uvp', e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="aboutYourself" className="text-sm font-semibold text-gray-700">Tell us about yourself</Label>
                <Textarea
                  id="aboutYourself"
                  placeholder="Share your background, achievements, or anything that would be relevant in a cold email..."
                  className="min-h-32 border-2 border-gray-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl"
                  value={senderProfile.aboutYourself}
                  onChange={(e) => handleInputChange('aboutYourself', e.target.value)}
                />
              </div>

              <Button 
                onClick={saveProfile}
                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white py-6 text-lg font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-2xl border-0"
              >
                <User className="w-6 h-6 mr-3" />
                Save Profile & Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-teal-50">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-4 h-4 bg-orange-400 rounded-full animate-bounce"></div>
      <div className="absolute top-40 right-20 w-6 h-6 bg-teal-400 rounded-full animate-pulse"></div>
      <div className="absolute bottom-20 left-20 w-5 h-5 bg-yellow-400 rounded-full animate-bounce delay-300"></div>
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 pt-16">
          <div className="flex items-center justify-center gap-4 mb-8">
            <Star className="w-8 h-8 text-orange-500 animate-spin" />
            <h1 className="text-6xl font-bold text-gray-900 leading-tight">
              Generate Your
              <br />
              <span className="text-teal-600">Cold Email</span>
            </h1>
            <Zap className="w-8 h-8 text-yellow-500 animate-pulse" />
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8 font-light">
            Just tell us who you're reaching out to, and we'll create the perfect email
          </p>
          
          {emailCount > 0 && (
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-2 rounded-full text-sm font-medium">
                🎉 {emailCount} email{emailCount !== 1 ? 's' : ''} generated!
              </div>
            </div>
          )}
          
          <div className="flex justify-center items-center gap-4 mb-12">
            <div className="bg-teal-600 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              Signed in as {senderProfile.name}
            </div>
            <Button 
              variant="outline" 
              onClick={editProfile}
              className="flex items-center gap-2 rounded-full"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* --- IMPROVED INPUT SECTION --- */}
          <div className="space-y-8">
            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white pb-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                  <Target className="w-6 h-6" />
                  Recipient Details
                </CardTitle>
                <CardDescription className="text-orange-100">
                  The more specific you are, the better the email will be.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="recipientName" className="font-semibold text-gray-700">Recipient's Name (Optional)</Label>
                  <Input
                    id="recipientName"
                    placeholder="e.g., Jane Doe"
                    className="border-2 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl h-12"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emailGoal" className="font-semibold text-gray-700">What is the goal of this email? *</Label>
                  <Textarea
                    id="emailGoal"
                    placeholder="e.g., Get a demo with the CTO of a fintech startup, or start a partnership with a marketing agency."
                    className="border-2 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl min-h-28"
                    value={emailGoal}
                    onChange={(e) => setEmailGoal(e.target.value)}
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="recipientContext" className="font-semibold text-gray-700 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    Add Personal Context (The Secret Sauce!)
                  </Label>
                  <Textarea
                    id="recipientContext"
                    placeholder="e.g., 'They just published a blog post on scaling engineering teams' or 'I saw on their LinkedIn they previously worked at a company I admire.'"
                    className="border-2 border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-xl min-h-36"
                    value={recipientContext}
                    onChange={(e) => setRecipientContext(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={generateEmail} 
              disabled={isGenerating || !emailGoal}
              className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white py-6 text-lg font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-2xl border-0 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-6 h-6 mr-3 animate-spin" />
                  Generating Your Perfect Email...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6 mr-3" />
                  Generate Email
                </>
              )}
            </Button>
          </div>

          {/* --- IMPROVED OUTPUT SECTION --- */}
          <div>
            <Card className="h-fit sticky top-6 border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 text-white pb-6">
                <CardTitle className="flex items-center justify-between text-2xl font-bold">
                  <span className="flex items-center gap-3">
                    <Mail className="w-6 h-6" />
                    Generated Email
                  </span>
                  {generatedEmail && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={copyToClipboard}
                      className="flex items-center gap-2 border-2 border-white text-gray-400 hover:bg-white hover:text-gray-900 rounded-xl"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {generatedEmail ? (
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans">
                      <div className="mb-4">
                        <strong className="font-semibold">Subject: </strong>{generatedEmail.subject}
                      </div>
                      <div>
                        {generatedEmail.body}
                        <br />
                        Best regards,
                        <br /><br />
                        {senderProfile.name}
                        <br />
                        {senderProfile.title}{senderProfile.company ? `, ${senderProfile.company}` : ''}
                        {senderProfile.email && <><br />{senderProfile.email}</>}
                        {senderProfile.website && <><br />{senderProfile.website}</>}
                        {senderProfile.linkedin && <><br />{senderProfile.linkedin}</>}
                        {senderProfile.calcom && <><br />Book a meeting: {senderProfile.calcom}</>}
                      </div>
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-20 text-gray-400">
                    <div className="p-6 bg-gray-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                      <Mail className="w-12 h-12 opacity-50" />
                    </div>
                    <p className="text-xl font-medium">Your email will appear here</p>
                    <p className="text-sm mt-2">Fill in the recipient details and click generate</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* --- Footer remains the same --- */}
      <footer className="mt-20 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-gray-600 font-medium">
                Built with ❤️ by Divyansh Sharma
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Generate personalized cold emails in seconds
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <a
                href="https://x.com/divyansharma001"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors duration-300"
              >
                <Twitter className="w-4 h-4" />
                <span className="text-sm font-medium">Follow on X</span>
              </a>
              
              <a
                href="https://github.com/divyansharma001"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-colors duration-300"
              >
                <Github className="w-4 h-4" />
                <span className="text-sm font-medium">GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;