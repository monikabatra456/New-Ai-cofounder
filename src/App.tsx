import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home as HomeIcon, 
  BarChart3, 
  Map as MapIcon, 
  Mail, 
  Settings, 
  Plus,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Send,
  X,
  Copy,
  Download,
  LogIn,
  LogOut,
  User as UserIcon,
  History,
  ExternalLink,
  AlertTriangle,
  Globe,
  Target,
  Calendar,
  Video,
  MapPin,
  Clock,
  Phone,
  Building2,
  ChevronRight,
  ChevronLeft,
  Info,
  Trash2,
  AlertCircle,
  Check,
  Navigation,
  Presentation,
  Layout,
  FileText,
  ChevronUp,
  ChevronDown,
  Monitor,
  Users,
  Quote,
  TrendingUp,
  Award
} from 'lucide-react';
import { cn } from './lib/utils';
import PptxGenJS from 'pptxgenjs';
import { investors, type Investor, type AIResult, type Meeting, type PPTData, type PPTSlide } from './types';
import confetti from 'canvas-confetti';
import { 
  auth, 
  db, 
  loginWithGoogle, 
  logout, 
  doc, 
  setDoc, 
  getDoc,
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDocFromServer,
  updateDoc,
  deleteDoc
} from './firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { GoogleGenAI, Type } from "@google/genai";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// --- Mock AI Engine for PPT ---
function detectTopic(prompt: string) {
  const p = prompt.toLowerCase();
  const map: Record<string, string[]> = {
    food: ['food','tiffin','restaurant','delivery','kitchen','cook','meal','snack','cloud kitchen'],
    edtech: ['education','student','learn','teach','school','college','course','tutor','jee','neet'],
    health: ['health','doctor','medicine','hospital','fitness','medical','patient','clinic','pharma'],
    fintech: ['money','payment','loan','invest','finance','bank','insurance','credit','upi'],
    agri: ['farmer','farm','crop','agriculture','kisan','harvest','vegetable','grain'],
    saas: ['software','tool','platform','dashboard','automation','crm','erp','management','workflow']
  };
  for(const [topic, words] of Object.entries(map)){
    if(words.some(w => p.includes(w))) return topic;
  }
  return 'tech';
}

function extractOrGenerateName(prompt: string, topic: string) {
  const words = prompt.split(' ');
  const caps = words.find(w => w.length > 3 && w[0] === w[0].toUpperCase() && w[0] !== w[0].toLowerCase());
  if(caps && caps.length > 3) return caps;
  
  const names: Record<string, string[]> = {
    food:['TiffinHub','FreshBox','GharKhana','MealMate','YumGo'],
    edtech:['LearnFast','VidyaAI','SmartGuru','StudyPro','GyanBox'],
    health:['DocNear','CareAI','SwasthApp','MedEasy','HealHub'],
    fintech:['PayFast','DhanAI','MoneyMate','FinEasy','ArthPro'],
    agri:['KisanHub','FarmDirect','FasalAI','GreenMart','AgroConnect'],
    saas:['FlowAI','DashPro','StackUp','AutoMate','ScaleHub'],
    tech:['TechHub','AppPro','DigiSolve','SmartApp','InnovatePro']
  };
  const list = names[topic] || names.tech;
  return list[Math.floor(Math.random() * list.length)];
}

function extractCity(prompt: string) {
  const cities = ['Delhi','Mumbai','Bangalore','Hyderabad','Pune','Chennai','Kolkata','Ahmedabad','Jaipur','Lucknow'];
  const p = prompt.toLowerCase();
  return cities.find(c => p.includes(c.toLowerCase())) || 'Delhi NCR';
}

function extractFunding(prompt: string) {
  const match = prompt.match(/₹\s*\d+\s*(lakh|crore|L|Cr)/i);
  return match ? match[0] : null;
}

function getTitleEmoji(topic: string) {
  const emojis: Record<string, string> = {
    food:'🍕', edtech:'📚', health:'🏥', fintech:'💳', agri:'🌾', saas:'⚡', tech:'🚀'
  };
  return emojis[topic] || '🚀';
}

function selectSlides(templates: any[], count: number, type: string) {
  const essential = [0,1,2,3,4,5,6,7];
  const optional = [8,9,10,11,12,13,14,15,16,17];
  
  let selectedIndices = essential.slice(0, Math.min(count - 1, essential.length));
  let selected = selectedIndices.map(i => templates[i]);
  
  const remaining = count - selected.length - 1;
  for(let i = 0; i < remaining && i < optional.length; i++){
    selected.push(templates[optional[i]]);
  }
  
  selected.push(templates[templates.length - 1]);
  return selected.slice(0, count);
}

function generatePresentationContent(prompt: string, slideCount: string, theme: string, language: string, type: string) {
  const p = prompt.toLowerCase();
  const topic = detectTopic(p);
  const startupName = extractOrGenerateName(p, topic);
  const targetCity = extractCity(p);
  const fundingAsk = extractFunding(p);
  
  const themeColors: Record<string, any> = {
    '🌑 Dark': { bg:'#0A0F2C', title:'#FFFFFF', text:'#E5E7EB', accent:'#3B82F6', card:'#111827', subtitle:'#93C5FD' },
    '🚀 Startup': { bg:'#0F172A', title:'#FFFFFF', text:'#E2E8F0', accent:'#6366F1', card:'#1E1B4B', subtitle:'#C4B5FD' },
    '💼 Corporate': { bg:'#1E293B', title:'#FFFFFF', text:'#CBD5E1', accent:'#0EA5E9', card:'#0F172A', subtitle:'#7DD3FC' },
    '☀️ Light': { bg:'#FFFFFF', title:'#111827', text:'#374151', accent:'#3B82F6', card:'#F8FAFC', subtitle:'#6B7280' },
    '🎨 Colorful': { bg:'#1A0A2E', title:'#FFFFFF', text:'#E9D5FF', accent:'#A855F7', card:'#2D1B69', subtitle:'#C084FC' },
    '💜 Purple': { bg:'#1E1B4B', title:'#FFFFFF', text:'#E0E7FF', accent:'#818CF8', card:'#312E81', subtitle:'#A5B4FC' }
  };
  
  const t = themeColors[theme] || themeColors['🚀 Startup'];
  
  const topicData: Record<string, any> = {
    food: {
      market:'$8.4B', growth:'28% YoY', ask: fundingAsk || '₹50 Lakhs',
      pain:'Healthy affordable food unavailable', solution:'Cloud kitchen network',
      revenue:'15% commission + delivery fee', traction:'500+ orders/day in beta',
      competitor1:'Zomato', c1w:'25-30% commission', competitor2:'Swiggy', c2w:'Not profitable',
      competitor3:'EatSure', c3w:'Metro cities only',
      stat1:{v:'28%',l:'Market Growth'}, stat2:{v:'₹350',l:'Avg Order Value'},
      stat3:{v:'4.2x',l:'LTV:CAC Ratio'}, stat4:{v:'68%',l:'Repeat Order Rate'}
    },
    edtech: {
      market:'$4.2B', growth:'39% YoY', ask: fundingAsk || '₹75 Lakhs',
      pain:'Quality education too expensive', solution:'AI-powered personalized learning',
      revenue:'₹499/month subscription', traction:'2000+ active learners',
      competitor1:"Byju's", c1w:'Too expensive', competitor2:'Unacademy', c2w:'Low completion',
      competitor3:'Vedantu', c3w:'High teacher cost',
      stat1:{v:'39%',l:'Sector Growth'}, stat2:{v:'₹499',l:'Monthly Price'},
      stat3:{v:'85%',l:'Completion Rate'}, stat4:{v:'4.8★',l:'User Rating'}
    },
    health: {
      market:'$6.1B', growth:'32% YoY', ask: fundingAsk || '₹1 Crore',
      pain:'Good doctors inaccessible in tier 2', solution:'Instant doctor booking platform',
      revenue:'₹50 per booking + medicine margin', traction:'1000+ patients served',
      competitor1:'Practo', c1w:'Poor tier 2 coverage', competitor2:'PharmEasy', c2w:'Delivery slow',
      competitor3:'1mg', c3w:'Trust issues',
      stat1:{v:'50Cr+',l:'Potential Patients'}, stat2:{v:'32%',l:'Annual Growth'},
      stat3:{v:'₹50',l:'Per Booking Revenue'}, stat4:{v:'90%',l:'Patient Satisfaction'}
    },
    fintech: {
      market:'$31B', growth:'22% YoY', ask: fundingAsk || '₹2 Crore',
      pain:'Small businesses lack financial tools', solution:'All-in-one financial platform',
      revenue:'0.5% transaction fee + subscription', traction:'200+ SMEs onboarded',
      competitor1:'Razorpay', c1w:'Complex for SMEs', competitor2:'PhonePe Biz', c2w:'Limited features',
      competitor3:'Paytm', c3w:'Too cluttered',
      stat1:{v:'3Cr+',l:'Target SMEs'}, stat2:{v:'$31B',l:'Market Size'},
      stat3:{v:'22%',l:'YoY Growth'}, stat4:{v:'200+',l:'Beta Customers'}
    },
    agri: {
      market:'$2.3B', growth:'41% YoY', ask: fundingAsk || '₹50 Lakhs',
      pain:'Farmers get 30% of actual value', solution:'Farm to consumer direct platform',
      revenue:'8% commission both sides', traction:'50 farmers, 200 buyers active',
      competitor1:'DeHaat', c1w:'Limited states', competitor2:'AgroStar', c2w:'Maharashtra only',
      competitor3:'Ninjacart', c3w:'B2B only',
      stat1:{v:'12Cr+',l:'Farmers in India'}, stat2:{v:'40%',l:'Extra Income for Farmers'},
      stat3:{v:'30%',l:'Savings for Buyers'}, stat4:{v:'41%',l:'Sector Growth'}
    },
    saas: {
      market:'$3.8B', growth:'35% YoY', ask: fundingAsk || '₹1.5 Crore',
      pain:'SMEs waste time on manual tasks', solution:'AI automation platform',
      revenue:'₹2999/month per company', traction:'50 paying companies',
      competitor1:'Zoho', c1w:'Too complex', competitor2:'Freshworks', c2w:'Too expensive',
      competitor3:'Spreadsheets', c3w:'Error-prone',
      stat1:{v:'6Cr+',l:'Target SMEs'}, stat2:{v:'₹2999',l:'Monthly Price'},
      stat3:{v:'35%',l:'Market Growth'}, stat4:{v:'50',l:'Paying Customers'}
    },
    tech: {
      market:'$5.5B', growth:'31% YoY', ask: fundingAsk || '₹75 Lakhs',
      pain:'Problem not solved efficiently today', solution:'Technology-first modern solution',
      revenue:'Freemium + Premium subscription', traction:'1000+ signups in beta',
      competitor1:'Player 1', c1w:'Poor UX', competitor2:'Player 2', c2w:'Too expensive',
      competitor3:'Player 3', c3w:'Outdated tech',
      stat1:{v:'$5.5B',l:'Market Size'}, stat2:{v:'31%',l:'Annual Growth'},
      stat3:{v:'1000+',l:'Beta Signups'}, stat4:{v:'8/10',l:'User Score'}
    }
  };
  
  const d = topicData[topic] || topicData.tech;
  
  const allSlideTemplates = [
    {
      layoutType: 'title',
      emoji: getTitleEmoji(topic),
      title: startupName,
      subtitle: d.solution + ' for India',
      content: 'Seed Round | ' + d.ask,
      speakerNotes: 'Start with energy! Introduce yourself and the company in 30 seconds. Make them curious.',
      stats: [],
      bulletPoints: []
    },
    {
      layoutType: 'bullets',
      emoji: '😤',
      title: 'The Problem',
      subtitle: 'A massive pain point ignored',
      content: d.pain + ' across India',
      bulletPoints: [
        'Crores of Indians face this daily',
        'Current solutions are expensive and poor',
        'No India-first solution exists today',
        'Market ready for disruption right now'
      ],
      speakerNotes: 'Tell a real story of someone facing this problem. Make the investors feel the pain personally.',
      stats: []
    },
    {
      layoutType: 'split',
      emoji: '💡',
      title: 'Our Solution',
      subtitle: startupName + ' — built for Bharat',
      content: d.solution,
      bulletPoints: [
        'Simple enough for non-tech users',
        'Works in Hindi and English',
        'Mobile-first, offline-capable',
        'Solves problem in under 2 minutes'
      ],
      speakerNotes: 'Demo the product here if possible. Show a screenshot or short video. Keep it visual.',
      stats: []
    },
    {
      layoutType: 'stats',
      emoji: '📊',
      title: 'Market Opportunity',
      subtitle: 'Massive TAM in India',
      content: 'Total addressable market analysis',
      bulletPoints: [],
      stats: [
        {value: d.market, label: 'Total Market (TAM)'},
        {value: d.growth, label: 'Annual Growth'},
        {value: '10Cr+', label: 'Target Users'},
        {value: targetCity, label: 'Launch City'}
      ],
      speakerNotes: 'Show bottom-up market calculation. TAM → SAM → SOM. Be conservative and credible.'
    },
    {
      layoutType: 'bullets',
      emoji: '⚡',
      title: 'How It Works',
      subtitle: '3 simple steps',
      content: 'Frictionless user journey',
      bulletPoints: [
        '1. User signs up in 30 seconds',
        '2. Core feature used instantly',
        '3. Value delivered in minutes',
        '4. Refer friends — viral growth'
      ],
      speakerNotes: 'Walk through the actual product flow. Show the app screens. Focus on simplicity.',
      stats: []
    },
    {
      layoutType: 'bullets',
      emoji: '💰',
      title: 'Business Model',
      subtitle: 'Multiple revenue streams',
      content: d.revenue,
      bulletPoints: [
        'Primary: ' + d.revenue,
        'Month 1-6: Free tier to build users',
        'Month 7+: Monetization begins',
        'Target: ₹10L MRR by Month 12'
      ],
      speakerNotes: 'Show unit economics clearly. LTV, CAC, payback period. Investors love specific numbers.',
      stats: []
    },
    {
      layoutType: 'stats',
      emoji: '🚀',
      title: 'Traction',
      subtitle: 'Early momentum is strong',
      content: 'Proof that market wants this',
      bulletPoints: [],
      stats: [
        {value: '1000+', label: 'Waitlist Users'},
        {value: d.traction.split(' ')[0], label: 'Active Users'},
        {value: '4.8★', label: 'Beta Rating'},
        {value: '₹2L', label: 'LOIs Signed'}
      ],
      speakerNotes: 'Show growth chart if possible. Even small numbers with strong growth rate is powerful.'
    },
    {
      layoutType: 'bullets',
      emoji: '🏆',
      title: 'Why We Win',
      subtitle: 'Unfair competitive advantage',
      content: 'We beat competition on every dimension',
      bulletPoints: [
        d.competitor1 + ': ' + d.c1w,
        d.competitor2 + ': ' + d.c2w,
        d.competitor3 + ': ' + d.c3w,
        startupName + ': India-first, affordable'
      ],
      speakerNotes: 'Never say no competition exists. Show you understand the landscape deeply.',
      stats: []
    }
  ];
  
  const slideSelection = selectSlides(allSlideTemplates, parseInt(slideCount), type);
  
  return {
    presentationTitle: startupName,
    subtitle: d.solution,
    fundingAsk: d.ask,
    presenter: 'Founder & CEO',
    theme: t,
    themeName: theme,
    slideCount: slideSelection.length,
    slides: slideSelection.map((s, i) => ({
      ...s,
      slideNumber: i + 1,
      content: s.content || 'Key insights about ' + s.title
    }))
  };
}

const API_URL = import.meta.env.VITE_API_BASE_URL || "";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// --- Meeting Scheduler Component ---
const MeetingScheduler = ({ 
  user,
  onBack,
  investor,
  onSchedule,
  isScheduling: isSchedulingProp,
  success: successProp
}: { 
  user: FirebaseUser | null;
  onBack: () => void;
  investor?: Investor;
  onSchedule?: (data: any) => void;
  isScheduling?: boolean;
  success?: boolean;
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'book' | 'calendar' | 'meetings'>('book');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedInvestor, setSelectedInvestor] = useState<any>(investor || null);
  const [meetingType, setMeetingType] = useState<'online' | 'offline'>('online');
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [startupName, setStartupName] = useState("");
  const [agenda, setAgenda] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [success, setSuccess] = useState(false);

  // Sync with props if provided
  useEffect(() => {
    if (investor) setSelectedInvestor(investor);
  }, [investor]);

  const finalIsScheduling = isSchedulingProp !== undefined ? isSchedulingProp : isScheduling;
  const finalSuccess = successProp !== undefined ? successProp : success;

  const filteredInvestors = investors.filter(inv => {
    const matchesSearch = inv.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         inv.fund.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         inv.focus.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCity = selectedCity === "All" || inv.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvestor || !selectedDate || !selectedTime) return;
    
    if (onSchedule) {
      onSchedule({
        investorId: selectedInvestor.id || 0,
        meetingType,
        date: selectedDate,
        time: selectedTime,
        duration: "30 mins",
        agenda,
        platform: meetingType === 'online' ? 'Google Meet' : undefined,
        founderName: user?.displayName || "Founder",
        founderEmail: user?.email || "",
        founderPhone: "",
        startupName,
      });
      return;
    }

    setIsScheduling(true);
    // Mock scheduling delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newMeeting = {
      id: Math.random().toString(36).substr(2, 9),
      investorName: selectedInvestor.name,
      investorFund: selectedInvestor.fund,
      date: selectedDate,
      time: selectedTime,
      type: meetingType,
      startupName,
      agenda,
      status: 'confirmed'
    };

    // Save to local storage for persistence in this session
    const existingMeetings = JSON.parse(localStorage.getItem('founder_meetings') || '[]');
    localStorage.setItem('founder_meetings', JSON.stringify([...existingMeetings, newMeeting]));

    setIsScheduling(false);
    setSuccess(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  if (finalSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[#111827] border border-gray-800 rounded-[24px] p-12 max-w-[420px] w-full"
        >
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Meeting Scheduled!</h2>
          <p className="text-gray-400 mb-8">
            Your meeting with {selectedInvestor.name} has been confirmed. Check your email for the calendar invite.
          </p>
          <button
            onClick={() => {
              setSuccess(false);
              setActiveSubTab('meetings');
            }}
            className="w-full py-4 bg-accent hover:bg-blue-600 text-white font-bold rounded-xl transition-all"
          >
            View My Meetings
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Meeting Scheduler</h1>
        <div className="flex bg-[#1F2937] p-1 rounded-xl">
          {[
            { id: 'book', label: "Book Meeting" },
            { id: 'calendar', label: "My Calendar" },
            { id: 'meetings', label: "My Meetings" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={cn(
                "px-6 py-2 rounded-lg text-sm font-medium transition-all",
                activeSubTab === tab.id ? "bg-[#111827] text-white shadow-lg" : "text-gray-400 hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === 'book' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Investor Selection */}
          <div className="space-y-6">
            <div className="bg-[#111827] border border-[#1F2937] rounded-[16px] p-6">
              <label className="block text-white text-base font-bold mb-4">Select Investor 👤</label>
              <input 
                type="text"
                placeholder="Search by name, fund, or focus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1F2937] text-white border border-[#374151] rounded-xl px-4 py-3 text-sm outline-none focus:border-accent transition-all mb-4"
              />
              
              <div className="flex flex-wrap gap-2 mb-6">
                {["All", "Delhi NCR", "Mumbai", "Bangalore", "Hyderabad"].map(city => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-medium border transition-all",
                      selectedCity === city ? "bg-accent border-accent text-white" : "bg-[#1F2937] border-[#374151] text-gray-400"
                    )}
                  >
                    {city}
                  </button>
                ))}
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredInvestors.map(inv => (
                  <div 
                    key={inv.id}
                    onClick={() => setSelectedInvestor(inv)}
                    className={cn(
                      "bg-[#1F2937] border-2 rounded-xl p-4 cursor-pointer transition-all",
                      selectedInvestor?.id === inv.id ? "border-accent bg-accent/5" : "border-transparent hover:border-[#374151]"
                    )}
                  >
                    <div className="flex gap-4 items-center">
                      <div 
                        className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ backgroundColor: inv.color }}
                      >
                        {inv.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-bold">{inv.name}</p>
                        <p className="text-gray-500 text-xs">{inv.fund}</p>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        {inv.prefersOnline && (
                          <span className="bg-[#1E3A5F] text-[#60A5FA] text-[10px] px-2 py-0.5 rounded-full">📹 Online</span>
                        )}
                        <span className="bg-[#064E3B] text-[#6EE7B7] text-[10px] px-2 py-0.5 rounded-full">🤝 Office</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      {inv.focus.map(f => (
                        <span key={f} className="bg-gray-800 text-gray-400 text-[10px] px-2 py-0.5 rounded-md">{f}</span>
                      ))}
                    </div>

                    {selectedInvestor?.id === inv.id && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-4 pt-4 border-t border-[#374151] space-y-2"
                      >
                        <div className="flex gap-2 items-start text-xs text-gray-400">
                          <span>📍</span>
                          <span>{inv.officeAddress}</span>
                        </div>
                        <div className="flex gap-2 items-center text-xs text-accent">
                          <span>✉️</span>
                          <span>{inv.email}</span>
                        </div>
                        <div className="flex gap-2 items-center text-xs text-gray-400">
                          <span>📱</span>
                          <span>{inv.phone}</span>
                        </div>
                        <div className="flex gap-2 items-center mt-3">
                          <span className="text-[11px] text-gray-500">Available:</span>
                          {inv.availableDays.map(d => (
                            <span key={d} className="bg-green-500/10 text-green-400 text-[10px] px-2 py-0.5 rounded-full">{d}</span>
                          ))}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">🕐 {inv.availableTime}</p>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Booking Form */}
          <div className="space-y-6">
            <div className="bg-[#111827] border border-[#1F2937] rounded-[16px] p-6">
              <label className="block text-white text-base font-bold mb-4">Meeting Details 📅</label>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setMeetingType('online')}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all",
                    meetingType === 'online' ? "border-accent bg-accent/5" : "border-[#374151] bg-[#1F2937]"
                  )}
                >
                  <Video className="w-5 h-5 text-accent mb-2" />
                  <p className="text-white text-sm font-bold">Virtual</p>
                  <p className="text-gray-500 text-[10px]">Google Meet / Zoom</p>
                </button>
                <button
                  onClick={() => setMeetingType('offline')}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all",
                    meetingType === 'offline' ? "border-accent bg-accent/5" : "border-[#374151] bg-[#1F2937]"
                  )}
                >
                  <Building2 className="w-5 h-5 text-accent mb-2" />
                  <p className="text-white text-sm font-bold">In-Person</p>
                  <p className="text-gray-500 text-[10px]">At Investor's Office</p>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-500 text-xs font-medium mb-2 uppercase tracking-wider">Select Date</label>
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {[0, 1, 2, 3, 4, 5, 6].map(i => {
                      const date = new Date();
                      date.setDate(date.getDate() + i);
                      const dateStr = date.toISOString().split('T')[0];
                      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                      const dayNum = date.getDate();
                      
                      return (
                        <button
                          key={dateStr}
                          onClick={() => setSelectedDate(dateStr)}
                          className={cn(
                            "flex flex-col items-center justify-center min-w-[60px] h-16 rounded-xl border-2 transition-all",
                            selectedDate === dateStr ? "border-accent bg-accent/5 text-white" : "border-[#374151] bg-[#1F2937] text-gray-400"
                          )}
                        >
                          <span className="text-[10px] uppercase">{dayName}</span>
                          <span className="text-lg font-bold">{dayNum}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-500 text-xs font-medium mb-2 uppercase tracking-wider">Select Time</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["10:00 AM", "11:30 AM", "2:00 PM", "3:30 PM", "4:00 PM", "5:30 PM"].map(time => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={cn(
                          "py-2 rounded-lg border-2 text-xs font-bold transition-all",
                          selectedTime === time ? "border-accent bg-accent/5 text-white" : "border-[#374151] bg-[#1F2937] text-gray-400"
                        )}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSchedule} className="space-y-4 pt-4">
                  <div>
                    <label className="block text-gray-500 text-xs font-medium mb-2 uppercase tracking-wider">Startup Name</label>
                    <input 
                      type="text"
                      required
                      value={startupName}
                      onChange={(e) => setStartupName(e.target.value)}
                      placeholder="Enter your startup name"
                      className="w-full bg-[#1F2937] text-white border border-[#374151] rounded-xl px-4 py-3 text-sm outline-none focus:border-accent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 text-xs font-medium mb-2 uppercase tracking-wider">Meeting Agenda</label>
                    <textarea 
                      required
                      value={agenda}
                      onChange={(e) => setAgenda(e.target.value)}
                      placeholder="What do you want to discuss?"
                      rows={3}
                      className="w-full bg-[#1F2937] text-white border border-[#374151] rounded-xl px-4 py-3 text-sm outline-none focus:border-accent transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isScheduling || !selectedInvestor || !selectedDate || !selectedTime}
                    className="w-full h-14 bg-accent hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    {isScheduling ? <Loader2 className="animate-spin" /> : "Confirm Meeting 🚀"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'calendar' && (
        <div className="bg-[#111827] border border-[#1F2937] rounded-[24px] p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white">April 2026</h2>
            <div className="flex gap-2">
              <button className="p-2 bg-[#1F2937] rounded-lg text-white hover:bg-gray-700 transition-all"><ChevronLeft size={20} /></button>
              <button className="p-2 bg-[#1F2937] rounded-lg text-white hover:bg-gray-700 transition-all"><ChevronRight size={20} /></button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="text-center text-gray-500 text-xs font-bold uppercase tracking-widest">{day}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => {
              const day = i - 2; // Offset for April 2026 starting on Wednesday
              const isCurrentMonth = day >= 1 && day <= 30;
              const isToday = day === 1;
              
              return (
                <div 
                  key={i} 
                  className={cn(
                    "aspect-square rounded-xl border border-[#1F2937] p-2 flex flex-col transition-all",
                    isCurrentMonth ? "bg-[#1F2937]/30" : "opacity-20",
                    isToday && "border-accent bg-accent/5"
                  )}
                >
                  <span className={cn("text-xs font-bold", isToday ? "text-accent" : "text-gray-400")}>
                    {isCurrentMonth ? day : ""}
                  </span>
                  {day === 5 && isCurrentMonth && (
                    <div className="mt-auto bg-blue-500/20 text-blue-400 text-[8px] p-1 rounded border border-blue-500/30 truncate">
                      Meeting: Sandeep
                    </div>
                  )}
                  {day === 12 && isCurrentMonth && (
                    <div className="mt-auto bg-green-500/20 text-green-400 text-[8px] p-1 rounded border border-green-500/30 truncate">
                      Meeting: Anjali
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSubTab === 'meetings' && (
        <div className="space-y-4">
          {JSON.parse(localStorage.getItem('founder_meetings') || '[]').length === 0 ? (
            <div className="bg-[#111827] border border-[#1F2937] rounded-[24px] p-20 text-center">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Meetings Scheduled</h3>
              <p className="text-gray-500 mb-8">You haven't booked any meetings yet. Start by exploring investors.</p>
              <button 
                onClick={() => setActiveSubTab('book')}
                className="px-8 py-3 bg-accent text-white font-bold rounded-xl hover:bg-blue-600 transition-all"
              >
                Book Your First Meeting
              </button>
            </div>
          ) : (
            JSON.parse(localStorage.getItem('founder_meetings') || '[]').map((m: any) => (
              <div key={m.id} className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center">
                <div className="w-16 h-16 bg-accent/10 rounded-2xl flex flex-col items-center justify-center shrink-0 border border-accent/20">
                  <span className="text-accent font-bold text-xl">{m.date.split('-')[2]}</span>
                  <span className="text-accent text-[10px] uppercase font-bold">{new Date(m.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-white font-bold text-lg">{m.investorName}</h3>
                  <p className="text-gray-500 text-sm">{m.investorFund}</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3">
                    <span className="flex items-center gap-2 text-xs text-gray-400"><Clock size={14} /> {m.time}</span>
                    <span className="flex items-center gap-2 text-xs text-gray-400"><Video size={14} /> {m.type === 'online' ? 'Virtual' : 'In-Person'}</span>
                    <span className="flex items-center gap-2 text-xs text-gray-400"><Building2 size={14} /> {m.startupName}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-[#1F2937] text-white text-xs font-bold rounded-lg hover:bg-gray-700 transition-all">Reschedule</button>
                  <button className="px-4 py-2 bg-red-500/10 text-red-500 text-xs font-bold rounded-lg hover:bg-red-500/20 transition-all">Cancel</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// --- Mock Dashboard Generation ---
function generateMockDashboard(idea: string, city: string) {
  const topic = detectTopic(idea);
  const startupName = extractOrGenerateName(idea, topic);
  
  const stats = {
    food: { tam: "$8.4B", growth: "28%", users: "1.2M", competitors: ["Zomato", "Swiggy", "EatFit"] },
    edtech: { tam: "$4.2B", growth: "39%", users: "2.5M", competitors: ["Byju's", "Unacademy", "PhysicsWallah"] },
    health: { tam: "$6.1B", growth: "32%", users: "800K", competitors: ["Practo", "PharmEasy", "HealthifyMe"] },
    fintech: { tam: "$31B", growth: "22%", users: "5M", competitors: ["Razorpay", "PhonePe", "BharatPe"] },
    agri: { tam: "$2.3B", growth: "41%", users: "300K", competitors: ["DeHaat", "Ninjacart", "AgroStar"] },
    saas: { tam: "$3.8B", growth: "35%", users: "100K", competitors: ["Zoho", "Freshworks", "Postman"] },
    tech: { tam: "$5.5B", growth: "31%", users: "1M", competitors: ["Player 1", "Player 2", "Player 3"] }
  };
  
  const s = stats[topic as keyof typeof stats] || stats.tech;
  
  return {
    startupName,
    marketSize: s.tam,
    marketAnalysisDetails: `The ${topic} market in ${city} is experiencing a massive shift towards digital-first solutions. With a projected growth rate of ${s.growth}, there is a significant opportunity for ${startupName} to capture a large share of the ${s.users} active users.`,
    opportunityScore: 9.2,
    competitors: s.competitors.map(name => ({ name, strength: "High", weakness: "Legacy Systems" })),
    pitchSlides: [
      { slideNumber: 1, title: "The Problem", content: `Current solutions in ${topic} are slow and inefficient for users in ${city}.` },
      { slideNumber: 2, title: "Our Solution", content: `${startupName} provides a seamless, AI-powered experience.` },
      { slideNumber: 3, title: "Market Size", content: `TAM: ${s.tam} with ${s.growth} YoY growth.` }
    ],
    investorEmail: {
      subject: `Investment Opportunity: ${startupName} - Disrupting ${topic} in ${city}`,
      body: `Hi,\n\nI'm building ${startupName}, a ${topic} startup focused on ${city}. We are seeing massive growth in this sector and would love to discuss a potential investment.\n\nBest,\nFounder`
    },
    targetCustomer: "Millennials and Gen Z",
    revenueModel: "Subscription and Transaction fees",
    localInvestors: investors.filter(inv => inv.city === city || city === "All")
  };
}

// --- Map Helper ---
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// --- My Meetings Component ---
const MyMeetings = ({ 
  meetings, 
  onCancel 
}: { 
  meetings: Meeting[]; 
  onCancel: (id: string) => void;
}) => {
  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-6">
          <Calendar className="w-10 h-10 text-muted-text" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Meetings Scheduled</h3>
        <p className="text-muted-text max-w-xs">
          Aapne abhi tak koi meeting schedule nahi ki hai. Investors se connect karne ke liye "Book Meeting" par click karein.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">My Meetings</h2>
          <p className="text-sm text-muted-text">Track your upcoming and past investor sessions</p>
        </div>
        <div className="px-4 py-2 bg-accent/10 border border-accent/20 rounded-lg text-accent text-xs font-medium">
          {meetings.length} Total Sessions
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {meetings.map((meeting) => {
          const investor = investors.find(i => i.id === meeting.investorId);
          const isCancelled = meeting.status === 'cancelled';

          return (
            <motion.div
              key={meeting.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "bg-gray-900/50 border rounded-2xl overflow-hidden flex flex-col",
                isCancelled ? "border-gray-800 opacity-60" : "border-gray-800"
              )}
            >
              {/* Top Bar */}
              <div className={cn(
                "h-1.5 w-full",
                meeting.meetingType === 'online' ? "bg-blue-500" : "bg-green-500"
              )} />

              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: investor?.color || '#333' }}>
                      {investor?.initials || '??'}
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{investor?.name || 'Unknown Investor'}</h4>
                      <p className="text-[10px] text-muted-text">{investor?.fund || 'Venture Capital'}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                    isCancelled ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
                  )}>
                    {meeting.status}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-text uppercase font-medium">Date & Time</div>
                    <div className="flex items-center gap-2 text-xs text-white">
                      <Calendar className="w-3 h-3 text-accent" />
                      {new Date(meeting.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {meeting.time}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-text uppercase font-medium">Type</div>
                    <div className="flex items-center gap-2 text-xs text-white">
                      {meeting.meetingType === 'online' ? (
                        <Video className="w-3 h-3 text-blue-400" />
                      ) : (
                        <MapPin className="w-3 h-3 text-green-400" />
                      )}
                      {meeting.meetingType === 'online' ? 'Virtual' : 'In-Person'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="text-[10px] text-muted-text uppercase font-medium">Agenda</div>
                  <p className="text-[11px] text-gray-300 line-clamp-2 italic">
                    "{meeting.agenda}"
                  </p>
                </div>

                {meeting.meetLink && !isCancelled && (
                  <div className="bg-blue-500/5 border border-blue-500/20 p-3 rounded-xl flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-blue-400" />
                      <span className="text-[10px] text-blue-300 font-medium">Google Meet Link Ready</span>
                    </div>
                    <a 
                      href={meeting.meetLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg transition-colors"
                    >
                      Join Now
                    </a>
                  </div>
                )}

                {meeting.meetingType === 'offline' && !isCancelled && (
                  <div className="bg-green-500/5 border border-green-500/20 p-3 rounded-xl flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-400" />
                      <span className="text-[10px] text-green-300 font-medium">Office Location</span>
                    </div>
                    <button 
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(investor?.officeAddress || '')}`, '_blank')}
                      className="text-[10px] bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg transition-colors"
                    >
                      Directions
                    </button>
                  </div>
                )}
              </div>

              {!isCancelled && (
                <div className="px-6 py-4 bg-black/20 border-t border-gray-800 flex justify-end">
                  <button
                    onClick={() => onCancel(meeting.id)}
                    className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Cancel Meeting
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};


interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-primary-bg flex items-center justify-center p-6 text-center">
          <div className="max-w-md bg-gray-900 border border-red-900/50 rounded-2xl p-8 shadow-2xl">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Oops! Kuch galat ho gaya</h1>
            <p className="text-muted-text mb-6 text-sm">
              Application mein ek error aaya hai. Please page refresh karein.
            </p>
            <pre className="bg-black/50 p-4 rounded-lg text-left text-[10px] text-red-400 overflow-auto mb-6 max-h-40">
              {this.state.error?.message || JSON.stringify(this.state.error)}
            </pre>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-accent text-white py-3 rounded-xl font-bold hover:bg-blue-500 transition-all"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- PPT Maker Component ---
const PPTMaker = ({ 
  pptData, 
  onGenerate, 
  isGenerating, 
  loadingStep, 
  progress,
  prompt,
  setPrompt,
  slidesCount,
  setSlidesCount,
  theme,
  setTheme,
  language,
  setLanguage,
  currentSlideIndex,
  setCurrentSlideIndex,
  showSpeakerNotes,
  setShowSpeakerNotes,
  onDownload,
  onRegenerate,
  onEditPrompt,
  transition,
  setTransition
}: { 
  pptData: PPTData | null;
  onGenerate: () => void;
  isGenerating: boolean;
  loadingStep: number;
  progress: number;
  prompt: string;
  setPrompt: (s: string) => void;
  slidesCount: number;
  setSlidesCount: (n: number) => void;
  theme: string;
  setTheme: (s: string) => void;
  language: string;
  setLanguage: (s: string) => void;
  currentSlideIndex: number;
  setCurrentSlideIndex: (n: any) => void;
  showSpeakerNotes: boolean;
  setShowSpeakerNotes: (b: boolean) => void;
  onDownload: () => void;
  onRegenerate: () => void;
  onEditPrompt: () => void;
  transition: 'fade' | 'slide' | 'zoom';
  setTransition: (t: 'fade' | 'slide' | 'zoom') => void;
}) => {
  const loadingSteps = [
    "Prompt samajh raha hoon...",
    "Content generate kar raha hoon...",
    "10 slides design kar raha hoon...",
    "Animations add kar raha hoon...",
    "PPT file taiyaar ho rahi hai..."
  ];

  const examples = [
    {
      title: "🎓 EdTech Startup",
      prompt: "10 slide pitch deck for online tutoring app for Class 10-12 students in India, dark theme, include market size and competitor analysis"
    },
    {
      title: "🍕 Food Business",
      prompt: "Investor pitch for homemade tiffin delivery service targeting IT offices in Bangalore, professional theme, include financial projections"
    },
    {
      title: "💊 HealthTech",
      prompt: "10 slides for AI-powered doctor consultation app for tier 2 cities, startup theme, include TAM SAM SOM"
    }
  ];

  if (isGenerating) {
    return (
      <div className="fixed inset-0 bg-black/92 z-[999] flex items-center justify-center p-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[#111827] border border-gray-800 rounded-[24px] p-12 max-w-[420px] w-full text-center"
        >
          <div className="relative w-20 h-20 mx-auto mb-8">
            <div className="absolute inset-0 border-3 border-gray-800 rounded-full" />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-3 border-transparent border-t-accent border-r-indigo-500 rounded-full"
            />
            <div className="absolute inset-0 flex items-center justify-center text-3xl">📑</div>
          </div>

          <h3 className="text-white text-xl font-bold mb-6">Creating Your Presentation</h3>

          <div className="space-y-3 mb-8 text-left">
            {[
              "📝 Reading your prompt...",
              "🧠 Understanding the topic...",
              "📊 Generating slide content...",
              "🎨 Applying beautiful design...",
              "✨ Adding animations...",
              "📥 Preparing download..."
            ].map((step, i) => (
              <div key={i} className={cn(
                "flex items-center gap-3 text-sm transition-all duration-500",
                i < loadingStep ? "text-green-400" : i === loadingStep ? "text-white" : "text-gray-600"
              )}>
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center border text-[10px]",
                  i < loadingStep ? "bg-green-500/20 border-green-500 text-green-400" : i === loadingStep ? "border-accent animate-pulse" : "border-gray-700"
                )}>
                  {i < loadingStep ? "✓" : "○"}
                </div>
                <span className={cn(i === loadingStep && "font-medium")}>{step}</span>
              </div>
            ))}
          </div>

          <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden mb-3">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent via-indigo-500 to-purple-500 transition-all duration-300"
            />
          </div>
          <p className="text-accent text-2xl font-bold">{progress}%</p>
        </motion.div>
      </div>
    );
  }

  if (!pptData) {
    return (
      <div className="max-w-[760px] mx-auto pt-[60px] pb-20 px-6">
        <div className="text-center mb-12">
          <span className="inline-block bg-[#1E3A5F] text-[#60A5FA] border border-[#3B82F6] rounded-full px-6 py-2 text-sm font-medium mb-5">
            ✦ AI Presentation Generator — Like Gamma
          </span>
          <h1 className="text-[44px] font-bold text-white mb-3 leading-tight">Ek Prompt — Poori PPT Taiyaar</h1>
          <p className="text-lg text-[#9CA3AF]">10 seconds mein beautiful pitch deck</p>
        </div>

        <div className="bg-[#111827] border border-[#1F2937] rounded-[20px] p-10 shadow-2xl">
          <div className="relative">
            <textarea 
              id="pptPrompt"
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your presentation...&#10;&#10;Example: Make a 10 slide investor pitch deck for a food delivery app targeting college students in Delhi. Include market size, competitors, funding ask ₹50 lakhs."
              className="w-full bg-[#1F2937] text-white border border-[#374151] rounded-[14px] p-5 text-base outline-none resize-none transition-all focus:border-[#3B82F6] focus:ring-4 focus:ring-[#3B82F6]/10 leading-relaxed"
            />
            <div className="absolute bottom-4 right-4 text-[12px] text-gray-500">
              {prompt.length} / 500 characters
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="space-y-2">
              <label className="text-[12px] text-gray-500 font-medium uppercase tracking-wider">📊 Slides</label>
              <div className="flex flex-wrap gap-2">
                {[5, 8, 10, 12, 15, 20].map(n => (
                  <button
                    key={n}
                    onClick={() => setSlidesCount(n)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-[13px] font-medium border transition-all",
                      slidesCount === n 
                        ? "bg-[#3B82F6] text-white border-[#3B82F6]" 
                        : "bg-[#1F2937] text-[#9CA3AF] border-[#374151] hover:border-gray-500"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[12px] text-gray-500 font-medium uppercase tracking-wider">🎨 Theme</label>
              <div className="flex flex-wrap gap-2">
                {["🌑 Dark", "🚀 Startup", "💼 Corporate", "☀️ Light", "🎨 Colorful", "💜 Purple"].map(t => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-[13px] font-medium border transition-all",
                      theme === t 
                        ? "bg-[#3B82F6] text-white border-[#3B82F6]" 
                        : "bg-[#1F2937] text-[#9CA3AF] border-[#374151] hover:border-gray-500"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[12px] text-gray-500 font-medium uppercase tracking-wider">🌐 Language</label>
              <div className="flex flex-wrap gap-2">
                {["English", "Hindi", "Hinglish"].map(l => (
                  <button
                    key={l}
                    onClick={() => setLanguage(l)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-[13px] font-medium border transition-all",
                      language === l 
                        ? "bg-[#3B82F6] text-white border-[#3B82F6]" 
                        : "bg-[#1F2937] text-[#9CA3AF] border-[#374151] hover:border-gray-500"
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <label className="text-[12px] text-gray-500 font-medium block mb-3 uppercase tracking-wider">📋 Presentation Type</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'pitch', label: "💰 Investor Pitch", desc: "For raising funding" },
                { id: 'proposal', label: "📈 Business Proposal", desc: "For clients/partners" },
                { id: 'edu', label: "🎓 Educational", desc: "For school/college" },
                { id: 'launch', label: "📣 Product Launch", desc: "For new product reveal" }
              ].map((type) => (
                <button
                  key={type.id}
                  className="bg-[#1F2937] border border-[#374151] rounded-xl p-4 text-left transition-all hover:border-[#3B82F6] flex items-center gap-3 group"
                >
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white group-hover:text-accent">{type.label}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{type.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <label className="text-[13px] text-gray-500 font-medium block mb-3">⚡ Quick Start — Click to use:</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { title: "🍕 Food Delivery Startup", prompt: "Create a 10 slide investor pitch deck for FoodieExpress — a cloud kitchen startup targeting working professionals in Delhi NCR. Market size $8B, competitors Zomato and Swiggy, raising ₹50L seed funding. Dark theme." },
                { title: "📚 EdTech Platform", prompt: "Make a 12 slide pitch deck for LearnFast — AI tutoring app for Class 10-12 students preparing for JEE and NEET. Market 2 crore students, subscription ₹499/month, startup theme." },
                { title: "🏥 HealthTech App", prompt: "Build 10 slides for DoctorNear — instant doctor booking app for tier 2 cities in India. Target market $6B, 50 crore underserved patients, raising ₹75L pre-seed. Corporate theme." },
                { title: "🌾 AgriTech Solution", prompt: "Create 8 slides for KisanConnect — marketplace connecting farmers to buyers directly. Removes middlemen, 12 crore farmers in India, commission model, colorful theme." }
              ].map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(ex.prompt)}
                  className="bg-[#1F2937] border border-[#374151] rounded-xl p-4 text-left transition-all hover:border-[#3B82F6] group"
                >
                  <p className="text-[13px] font-bold text-white mb-1 group-hover:text-accent">{ex.title}</p>
                  <p className="text-[11px] text-gray-500 line-clamp-1">{ex.prompt}</p>
                </button>
              ))}
            </div>
          </div>

          <button 
            id="pptGenerateBtn"
            onClick={onGenerate}
            disabled={!prompt.trim()}
            className="w-full h-[60px] bg-gradient-to-r from-[#3B82F6] to-[#6366F1] hover:opacity-90 disabled:opacity-50 text-white text-lg font-bold rounded-[14px] mt-8 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl shadow-blue-500/10 tracking-wide"
          >
            ✨ Generate My Presentation
          </button>

          <div className="flex justify-between items-center mt-6 px-2">
            <span className="text-[12px] text-[#6B7280]">⚡ Generates in 3-5 seconds</span>
            <span className="text-[12px] text-[#6B7280]">📥 Downloads as real .pptx file</span>
          </div>
        </div>
      </div>
    );
  }

  const currentSlide = pptData.slides[currentSlideIndex];

  const transitionVariants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.5 }
    },
    slide: {
      initial: { opacity: 0, x: 50 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: 0.5, type: "spring" as any, damping: 20, stiffness: 100 }
    },
    zoom: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#0D1117]">
      {/* Top Action Bar */}
      <div className="sticky top-0 bg-[#0A0F2C] border-b border-[#1F2937] px-6 py-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-4">
          <button onClick={onRegenerate} className="text-white hover:text-accent transition-colors flex items-center gap-2">
            <ChevronLeft size={20} />
            <span className="font-medium">Regenerate</span>
          </button>
          <div className="h-4 w-px bg-gray-700 mx-2" />
          <h2 className="text-white font-bold truncate max-w-[300px]">{pptData.presentationTitle}</h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-900 border border-gray-800 rounded-lg p-1 mr-2">
            {(['fade', 'slide', 'zoom'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTransition(t)}
                className={cn(
                  "px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                  transition === t ? "bg-accent text-white shadow-lg" : "text-gray-500 hover:text-gray-300"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <button 
            onClick={onEditPrompt}
            className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-white/5 transition-all"
          >
            Edit Prompt ✏️
          </button>
          <button 
            onClick={onDownload}
            className="px-6 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
          >
            Download PPTX ⬇
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Slide Navigator */}
        <div className="w-[200px] bg-[#0D1117] border-r border-[#1F2937] overflow-y-auto p-4 custom-scrollbar">
          <div className="flex flex-col gap-3">
            {pptData.slides.map((slide, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlideIndex(i)}
                className={cn(
                  "w-full aspect-video rounded-lg border-2 transition-all relative overflow-hidden group",
                  currentSlideIndex === i ? "border-[#3B82F6]" : "border-transparent hover:border-gray-700"
                )}
                style={{ backgroundColor: pptData.theme.bgColor }}
              >
                <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
                  {slide.slideNumber}
                </div>
                <div className="h-full flex flex-col items-center justify-center p-2">
                  <span className="text-lg mb-1">{slide.emoji}</span>
                  <p className="text-[9px] text-white font-medium text-center line-clamp-2 leading-tight">
                    {slide.title}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main View */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex items-center justify-center p-10 relative">
            <p className="absolute top-4 left-1/2 -translate-x-1/2 text-gray-500 text-sm">
              Slide {currentSlideIndex + 1} of {pptData.slides.length}
            </p>

            <button 
              onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
              disabled={currentSlideIndex === 0}
              className="absolute left-6 w-12 h-12 bg-[#111827] border border-[#1F2937] text-white rounded-full flex items-center justify-center hover:bg-[#1F2937] disabled:opacity-30 transition-all z-10"
            >
              <ChevronLeft size={24} />
            </button>

            <motion.div 
              key={currentSlideIndex}
              initial={transitionVariants[transition].initial}
              animate={transitionVariants[transition].animate}
              transition={transitionVariants[transition].transition}
              className="w-full max-w-[800px] aspect-video rounded-xl overflow-hidden shadow-2xl relative"
              style={{ backgroundColor: pptData.theme.bgColor }}
            >
              {/* Slide Content Rendering */}
              {currentSlide.layoutType === 'title' && (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center relative">
                  <div className="text-[64px] mb-5">{currentSlide.emoji}</div>
                  <h1 className="text-[48px] font-bold leading-tight mb-3" style={{ color: pptData.theme.titleColor }}>
                    {pptData.presentationTitle}
                  </h1>
                  <p className="text-[22px]" style={{ color: pptData.theme.accentColor }}>
                    {pptData.subtitle}
                  </p>
                  <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: pptData.theme.accentColor }} />
                </div>
              )}

              {currentSlide.layoutType === 'bullets' && (
                <div className="h-full p-12 relative flex flex-col">
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: pptData.theme.accentColor }} />
                  <div className="absolute top-4 right-6 text-gray-500 text-xs">{currentSlide.slideNumber}</div>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-4xl">{currentSlide.emoji}</span>
                    <h2 className="text-[32px] font-bold" style={{ color: pptData.theme.titleColor }}>{currentSlide.title}</h2>
                  </div>
                  
                  <p className="text-base mb-8 leading-relaxed" style={{ color: pptData.theme.textColor }}>{currentSlide.content}</p>
                  
                  <div className="space-y-4">
                    {currentSlide.bulletPoints?.map((bullet, i) => (
                      <div key={i} className="flex items-start gap-4">
                        <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ backgroundColor: pptData.theme.accentColor }} />
                        <p className="text-base leading-relaxed" style={{ color: pptData.theme.textColor }}>{bullet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentSlide.layoutType === 'stats' && (
                <div className="h-full p-12 relative flex flex-col">
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: pptData.theme.accentColor }} />
                  
                  <div className="flex items-center gap-4 mb-8">
                    <span className="text-4xl">{currentSlide.emoji}</span>
                    <h2 className="text-[32px] font-bold" style={{ color: pptData.theme.titleColor }}>{currentSlide.title}</h2>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-4">
                    {currentSlide.stats?.map((stat, i) => (
                      <div key={i} className="rounded-xl p-6 text-center border border-white/10" style={{ backgroundColor: pptData.theme.cardBg }}>
                        <div className="text-3xl font-bold mb-2" style={{ color: pptData.theme.accentColor }}>{stat.value}</div>
                        <div className="text-[12px] uppercase tracking-wider opacity-60" style={{ color: pptData.theme.textColor }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentSlide.layoutType === 'split' && (
                <div className="h-full p-12 flex gap-10 relative">
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: pptData.theme.accentColor }} />
                  
                  <div className="flex-1">
                    <div className="text-[80px] mb-6">{currentSlide.emoji}</div>
                    <h2 className="text-[32px] font-bold mb-4" style={{ color: pptData.theme.titleColor }}>{currentSlide.title}</h2>
                    <p className="text-base leading-relaxed" style={{ color: pptData.theme.textColor }}>{currentSlide.content}</p>
                  </div>

                  <div className="flex-1 space-y-3">
                    {currentSlide.bulletPoints?.map((bullet, i) => (
                      <div key={i} className="p-4 rounded-lg border-l-4" style={{ backgroundColor: pptData.theme.cardBg, borderLeftColor: pptData.theme.accentColor }}>
                        <p className="text-sm leading-relaxed" style={{ color: pptData.theme.textColor }}>{bullet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentSlide.layoutType === 'quote' && (
                <div className="h-full flex flex-col items-center justify-center p-16 text-center relative">
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: pptData.theme.accentColor }} />
                  <Quote size={80} className="mb-6 opacity-20" style={{ color: pptData.theme.accentColor }} />
                  <p className="text-2xl italic font-serif leading-relaxed max-w-[600px]" style={{ color: pptData.theme.titleColor }}>
                    "{currentSlide.content}"
                  </p>
                  <p className="mt-6 text-sm opacity-60" style={{ color: pptData.theme.textColor }}>
                    — {currentSlide.title}
                  </p>
                </div>
              )}

              {currentSlide.layoutType === 'team' && (
                <div className="h-full p-12 relative flex flex-col">
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: pptData.theme.accentColor }} />
                  
                  <div className="flex items-center gap-4 mb-8">
                    <span className="text-4xl">{currentSlide.emoji}</span>
                    <h2 className="text-[32px] font-bold" style={{ color: pptData.theme.titleColor }}>{currentSlide.title}</h2>
                  </div>

                  <div className="grid grid-cols-3 gap-6 mt-4">
                    {currentSlide.bulletPoints?.map((member, i) => {
                      const [name, role] = member.split(':');
                      return (
                        <div key={i} className="rounded-xl p-6 text-center" style={{ backgroundColor: pptData.theme.cardBg }}>
                          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl" style={{ backgroundColor: pptData.theme.accentColor }}>
                            {name.substring(0, 1)}
                          </div>
                          <div className="font-bold text-white mb-1">{name}</div>
                          <div className="text-xs opacity-60" style={{ color: pptData.theme.textColor }}>{role || 'Co-Founder'}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentSlide.layoutType === 'thankyou' && (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center relative">
                  <div className="text-[72px] mb-6">🙏</div>
                  <h1 className="text-[52px] font-bold leading-tight mb-3" style={{ color: pptData.theme.titleColor }}>
                    Thank You
                  </h1>
                  <p className="text-[22px] mb-8" style={{ color: pptData.theme.accentColor }}>
                    {currentSlide.subtitle || "Let's build something amazing together"}
                  </p>
                  <p className="text-base max-w-[500px]" style={{ color: pptData.theme.textColor }}>
                    {currentSlide.content}
                  </p>
                  <div className="absolute bottom-6 left-0 right-0 text-[13px] opacity-40" style={{ color: pptData.theme.textColor }}>
                    Made with FounderAI
                  </div>
                </div>
              )}
            </motion.div>

            <button 
              onClick={() => setCurrentSlideIndex(prev => Math.min(pptData.slides.length - 1, prev + 1))}
              disabled={currentSlideIndex === pptData.slides.length - 1}
              className="absolute right-6 w-12 h-12 bg-[#111827] border border-[#1F2937] text-white rounded-full flex items-center justify-center hover:bg-[#1F2937] disabled:opacity-30 transition-all z-10"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Speaker Notes */}
          <div className="bg-[#0D1117] border-t border-[#1F2937] p-4 px-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-[12px] font-bold text-gray-500 uppercase tracking-wider">
                <Mail size={14} />
                🎤 Speaker Notes:
              </div>
              <button 
                onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
                className="text-[10px] text-accent hover:underline"
              >
                {showSpeakerNotes ? 'Hide Notes' : 'Show Notes'}
              </button>
            </div>
            {showSpeakerNotes && (
              <motion.p 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white text-sm leading-relaxed"
              >
                {currentSlide.speakerNotes}
              </motion.p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ activeTab, setActiveTab, user }: { activeTab: string, setActiveTab: (t: any) => void, user: FirebaseUser | null }) => {
  const menuItems = [
    { id: 'home', icon: HomeIcon, label: 'Home' },
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
    { id: 'ppt-maker', icon: Presentation, label: 'PPT Maker', badge: 'New' },
    { id: 'map', icon: MapIcon, label: 'Investor Map' },
    { id: 'meetings', icon: Calendar, label: 'Meeting Scheduler' },
    { id: 'history', icon: History, label: 'My Kits' },
    { id: 'email', icon: Mail, label: 'Email Sender' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-16 xl:w-64 bg-sidebar-bg border-r border-border flex flex-col items-center xl:items-stretch py-6 z-50 transition-all">
      <div className="px-4 mb-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-white font-bold text-xl">F</div>
        <span className="hidden xl:block font-bold text-xl tracking-tight">FounderAI</span>
      </div>

      <nav className="flex-1 w-full px-2 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all group relative",
              activeTab === item.id ? "bg-accent/10 text-accent" : "text-muted-text hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon size={24} />
            <span className="hidden xl:block font-medium">{item.label}</span>
            {item.badge && (
              <span className="hidden xl:block absolute right-4 px-1.5 py-0.5 bg-accent text-white text-[10px] font-bold rounded uppercase tracking-wider">
                {item.badge}
              </span>
            )}
            {activeTab === item.id && (
              <motion.div 
                layoutId="active-pill"
                className="absolute left-0 w-1 h-6 bg-accent rounded-r-full"
              />
            )}
            <div className="xl:hidden absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              {item.label}
            </div>
          </button>
        ))}
      </nav>

      <div className="px-2 w-full space-y-2">
        {user ? (
          <div className="p-2 bg-gray-800/50 rounded-xl border border-gray-700/50 flex items-center gap-3 overflow-hidden">
            <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full shrink-0" />
            <div className="hidden xl:block overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user.displayName}</p>
              <button onClick={() => logout()} className="text-[10px] text-accent hover:underline">Logout</button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => loginWithGoogle()}
            className="w-full flex items-center gap-4 px-3 py-3 rounded-xl text-accent hover:bg-accent/10 transition-all"
          >
            <LogIn size={24} />
            <span className="hidden xl:block font-medium">Login</span>
          </button>
        )}
        <button className="w-full flex items-center gap-4 px-3 py-3 rounded-xl text-muted-text hover:bg-white/5 hover:text-white transition-all">
          <Settings size={24} />
          <span className="hidden xl:block font-medium">Settings</span>
        </button>
      </div>
    </aside>
  );
};

const LoadingOverlay = ({ step }: { step: number }) => {
  const steps = [
    "🔍 Idea analyze ho rahi hai...",
    "📈 Market research chal rahi hai...",
    "🎨 Pitch deck ban rahi hai...",
    "📍 Investors dhundh rahe hain..."
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 border border-border rounded-2xl p-8 max-w-sm w-full text-center"
      >
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-accent/20 rounded-full" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-4 border-t-accent rounded-full"
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.p 
            key={step}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            className="text-lg font-medium text-white mb-4"
          >
            {steps[step]}
          </motion.p>
        </AnimatePresence>

        <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden mb-2">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(step + 1) * 25}%` }}
            className="h-full bg-accent"
          />
        </div>
        <p className="text-xs text-muted-text">Please wait, yeh 6-8 seconds leta hai</p>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard' | 'map' | 'email' | 'meetings' | 'scheduler' | 'history' | 'ppt-maker'>('home');
  const [idea, setIdea] = useState('');
  const [selectedCity, setSelectedCity] = useState('Delhi NCR');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<AIResult | null>(null);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isGeneratingSlides, setIsGeneratingSlides] = useState(false);
  const [additionalSlidesCount, setAdditionalSlidesCount] = useState(3);
  const [history, setHistory] = useState<any[]>([]);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [selectedInvestorForModal, setSelectedInvestorForModal] = useState<any | null>(null);
  const [infoWindowData, setInfoWindowData] = useState<any | null>(null);

  // Meeting State
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedInvestorForMeeting, setSelectedInvestorForMeeting] = useState<Investor | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [schedulingSuccess, setSchedulingSuccess] = useState(false);

  // PPT Maker State
  const [pptData, setPptData] = useState<PPTData | null>(null);
  const [isGeneratingPPT, setIsGeneratingPPT] = useState(false);
  const [pptPrompt, setPptPrompt] = useState('');
  const [pptSlidesCount, setPptSlidesCount] = useState(10);
  const [pptTheme, setPptTheme] = useState('🚀 Startup');
  const [pptLanguage, setPptLanguage] = useState('English');
  const [pptLoadingStep, setPptLoadingStep] = useState(0);
  const [pptProgress, setPptProgress] = useState(0);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(true);
  const [pptTransition, setPptTransition] = useState<'fade' | 'slide' | 'zoom'>('fade');

  const cities = ["Delhi NCR", "Mumbai", "Bangalore", "Hyderabad", "Pune", "Chennai"];

  const cityCoords: Record<string, [number, number]> = {
    "Delhi NCR": [28.6139, 77.2090],
    "Mumbai": [19.0760, 72.8777],
    "Bangalore": [12.9716, 77.5946],
    "Hyderabad": [17.3850, 78.4867],
    "Pune": [18.5204, 73.8567],
    "Chennai": [13.0827, 80.2707]
  };

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);
      if (firebaseUser) {
        // Create user profile if doesn't exist
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            createdAt: serverTimestamp()
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore History Listener
  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }

    const q = query(
      collection(db, `users/${user.uid}/kits`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const kits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(kits);
    }, (error) => {
      console.error("Firestore Error: ", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Test Connection
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();
  }, []);

  // Meetings Listener
  useEffect(() => {
    if (!user) {
      setMeetings([]);
      return;
    }

    const q = query(
      collection(db, 'meetings'),
      where('founderId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const meetingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Meeting[];
      setMeetings(meetingsData);
    }, (error) => {
      console.error("Firestore Error (meetings):", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleScheduleMeeting = async (meetingData: any) => {
    if (!user) return;
    setIsScheduling(true);
    try {
      // 1. Generate meeting link if online
      let meetLink = "";
      if (meetingData.meetingType === 'online') {
        const response = await fetch('/api/meetings/generate-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        meetLink = data.link;
      }

      // 2. Save to Firestore
      const meetingDoc = {
        ...meetingData,
        founderId: user.uid,
        meetLink,
        status: 'confirmed',
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'meetings'), meetingDoc);

      // 3. Send confirmation email
      const investor = investors.find(i => i.id === meetingData.investorId);
      if (investor) {
        // To Founder
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: meetingData.founderEmail,
            subject: `Meeting Confirmed: ${investor.name} x ${meetingData.startupName}`,
            body: `Hi ${meetingData.founderName},\n\nYour meeting with ${investor.name} from ${investor.fund} has been confirmed.\n\nType: ${meetingData.meetingType}\nDate: ${meetingData.date}\nTime: ${meetingData.time}\n${meetLink ? `Link: ${meetLink}` : `Location: ${investor.officeAddress}`}\n\nGood luck!\nFounderAI Team`
          })
        });

        // To Investor
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: investor.email,
            subject: `New Meeting Request: ${meetingData.startupName}`,
            body: `Hi ${investor.name},\n\nA new meeting has been scheduled with ${meetingData.founderName} from ${meetingData.startupName}.\n\nType: ${meetingData.meetingType}\nDate: ${meetingData.date}\nTime: ${meetingData.time}\nAgenda: ${meetingData.agenda}\n\nFounderAI Team`
          })
        });
      }

      setSchedulingSuccess(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3B82F6', '#10B981', '#F59E0B']
      });
    } catch (error) {
      console.error("Scheduling Error:", error);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCancelMeeting = async (meetingId: string) => {
    try {
      await updateDoc(doc(db, 'meetings', meetingId), {
        status: 'cancelled'
      });
    } catch (error) {
      console.error("Cancel Error:", error);
    }
  };

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 1500);
      return () => clearInterval(interval);
    } else {
      setLoadingStep(0);
    }
  }, [isLoading]);

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    setIsLoading(true);
    try {
      // Mock Dashboard Generation (Zero API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      const data = generateMockDashboard(idea, selectedCity);
      
      const finalResult = { ...data, groundingSources: [], city: selectedCity };
      setResult(finalResult);
      
      setActiveTab('dashboard');
    } catch (error) {
      console.error("Generation failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedInvestor) {
      setEmailTo(selectedInvestor.email || "connect@peoplegroup.in");
    }
  }, [selectedInvestor]);

  useEffect(() => {
    if (result) {
      setEmailSubject(result.investorEmail.subject || "Investment Opportunity");
      setEmailBody(result.investorEmail.body || "");
    }
  }, [result]);

  const handleSendEmail = async () => {
    if (!emailTo || !emailSubject || !emailBody) {
      return;
    }

    // Zero API Rule: Use mailto link
    const mailtoLink = `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoLink;
    
    setEmailSent(true);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3B82F6', '#10B981', '#FFFFFF']
    });
  };

  const handleGeneratePPT = async () => {
    if (!pptPrompt.trim()) return;
    setIsGeneratingPPT(true);
    setPptLoadingStep(0);
    setPptProgress(0);

    const stepInterval = setInterval(() => {
      setPptLoadingStep(prev => Math.min(prev + 1, 5));
    }, 800);

    const progressInterval = setInterval(() => {
      setPptProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    try {
      // Offline Mock Generation
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      const data = generatePresentationContent(
        pptPrompt, 
        pptSlidesCount.toString(), 
        pptTheme, 
        pptLanguage, 
        "Investor Pitch"
      );
      
      setPptData(data);
      setPptProgress(100);
      setPptLoadingStep(5);
      setCurrentSlideIndex(0);
    } catch (error) {
      console.error("PPT Generation failed", error);
      alert("Something went wrong while generating the PPT. Please try again.");
    } finally {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      setTimeout(() => setIsGeneratingPPT(false), 1000);
    }
  };

  const handleDownloadPPTX = () => {
    if (!pptData) return;
    
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';
    pptx.title = pptData.presentationTitle;
    
    const theme = pptData.theme;
    
    pptData.slides.forEach((slideData) => {
      const slide = pptx.addSlide();
      
      // Background
      slide.background = { color: theme.bgColor.replace('#','') };
      
      // Top accent bar
      if (slideData.layoutType !== 'title') {
        slide.addShape(pptx.ShapeType.rect, {
          x: 0, y: 0, w: '100%', h: 0.08,
          fill: { color: theme.accentColor.replace('#','') }
        });
      }

      // Title
      slide.addText(slideData.title, {
        x: 0.5, y: 0.5, w: '90%', h: 0.8,
        fontSize: 32, color: theme.titleColor.replace('#',''),
        bold: true, align: pptx.AlignH.left,
        fontFace: 'Inter'
      });

      // Content
      if (slideData.content) {
        slide.addText(slideData.content, {
          x: 0.5, y: 1.4, w: '90%', h: 1,
          fontSize: 18, color: theme.textColor.replace('#',''),
          align: pptx.AlignH.left,
          fontFace: 'Inter'
        });
      }

      // Bullet Points
      if (slideData.bulletPoints && slideData.bulletPoints.length > 0) {
        slide.addText(
          slideData.bulletPoints.map(p => `• ${p}`).join('\n'), 
          {
            x: 0.5, y: 2.5, w: '90%', h: 3,
            fontSize: 16, color: theme.textColor.replace('#',''),
            align: pptx.AlignH.left,
            fontFace: 'Inter',
            lineSpacing: 24
          }
        );
      }

      // Stats
      if (slideData.stats && slideData.stats.length > 0) {
        slideData.stats.forEach((stat, idx) => {
          const xPos = 0.5 + (idx * 2.5);
          slide.addText(stat.value, {
            x: xPos, y: 4.5, w: 2, h: 0.5,
            fontSize: 28, color: theme.accentColor.replace('#',''),
            bold: true, align: pptx.AlignH.left,
            fontFace: 'Inter'
          });
          slide.addText(stat.label, {
            x: xPos, y: 5.0, w: 2, h: 0.3,
            fontSize: 12, color: theme.textColor.replace('#',''),
            align: pptx.AlignH.left,
            fontFace: 'Inter'
          });
        });
      }

      // Speaker Notes
      if (slideData.speakerNotes) {
        slide.addNotes(slideData.speakerNotes);
      }
    });
    
    pptx.writeFile({ fileName: `${pptData.presentationTitle.replace(/\s+/g, '_')}.pptx` });
  };

  const handleGenerateMoreSlides = async () => {
    if (!result || isGeneratingSlides) return;
    setIsGeneratingSlides(true);
    try {
      // Mocking additional slides for Zero API
      await new Promise(resolve => setTimeout(resolve, 2000));
      const newSlides = [
        { slideNumber: result.pitchSlides.length + 1, title: "Future Roadmap", content: "Our vision for the next 24 months." },
        { slideNumber: result.pitchSlides.length + 2, title: "Financial Projections", content: "Projected revenue growth and profitability." }
      ];
      
      const updatedResult = {
        ...result,
        pitchSlides: [...result.pitchSlides, ...newSlides]
      };
      setResult(updatedResult);

      if (user && result.id) {
        await setDoc(doc(db, `users/${user.uid}/kits`, result.id), {
          result: updatedResult
        }, { merge: true });
      }
    } catch (error) {
      console.error("Slide generation failed", error);
    } finally {
      setIsGeneratingSlides(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-primary-bg flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
        
        <main className="flex-1 ml-16 xl:ml-64 p-4 md:p-8 overflow-x-hidden">
          <AnimatePresence mode="wait">
            {!isAuthReady && (
              <div className="fixed inset-0 bg-primary-bg z-[200] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-accent animate-spin" />
              </div>
            )}

            {isLoading && <LoadingOverlay step={loadingStep} />}

            {activeTab === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto pt-20 pb-20"
            >
              <div className="text-center mb-12">
                <span className="inline-flex items-center px-4 py-1 rounded-full bg-[#1E3A5F] text-[#60A5FA] border border-accent text-sm font-medium mb-6">
                  ✦ Powered by Groq AI
                </span>
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">Your AI Co-Founder</h1>
                <p className="text-xl text-muted-text">Idea se funding tak — seconds mein</p>
              </div>

              <div className="bg-card-bg border border-border rounded-2xl p-8 shadow-2xl">
                <label className="block text-sm text-muted-text mb-2">Apna startup idea batao</label>
                <textarea 
                  rows={6}
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Example: Main ek app banana chahta hoon jisse college students apne notes sell kar sakein..."
                  className="w-full bg-gray-800/50 text-white border border-gray-700 rounded-xl p-4 text-sm focus:border-accent focus:ring-1 focus:ring-accent outline-none resize-none transition-all"
                />

                <div className="flex items-center gap-4 my-8">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-gray-600 font-bold uppercase tracking-widest">Aur</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <label className="block text-sm text-muted-text mb-3">Apna shehar chuno</label>
                <div className="flex gap-3 flex-wrap">
                  {cities.map(city => (
                    <button
                      key={city}
                      onClick={() => setSelectedCity(city)}
                      className={cn(
                        "px-4 py-2 rounded-full border text-sm transition-all",
                        selectedCity === city 
                          ? "bg-accent text-white border-accent" 
                          : "bg-gray-800 text-muted-text border-gray-700 hover:border-gray-500"
                      )}
                    >
                      {city}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={handleGenerate}
                  disabled={!idea.trim() || isLoading}
                  className="mt-8 w-full h-14 bg-accent hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Generate My Co-Founder Kit 🚀
                </button>

                <button 
                  onClick={async () => {
                    const res = await fetch('/api/debug-env');
                    const data = await res.json();
                    console.log("Available Secret Names: " + data.keys.join(", "));
                  }}
                  className="mt-4 w-full text-[10px] text-gray-600 hover:text-gray-400 underline"
                >
                  Debug: Check Secret Names
                </button>

                <div className="mt-6 flex justify-center gap-3 flex-wrap">
                  {["📊 Market Research", "📑 Pitch Deck", "📍 Investor Map", "✉️ Email Draft"].map(f => (
                    <span key={f} className="text-[10px] md:text-xs text-gray-500 bg-gray-800/30 px-3 py-1 rounded-full border border-gray-800/50">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white">Your Co-Founder Kit</h2>
                  <p className="text-sm text-muted-text mt-1">Generated for: {idea.substring(0, 60)}...</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-green-900/30 text-success border border-green-900/50 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    <CheckCircle2 size={14} /> Analysis Complete
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CARD 1: Market Analysis */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gray-900 rounded-2xl p-6 border border-border relative overflow-hidden group"
                >
                  <div className="absolute left-0 top-6 bottom-6 w-1 bg-accent rounded-r-full" />
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center text-accent">
                      <BarChart3 size={24} />
                    </div>
                    <h3 className="text-lg font-bold">Market Analysis</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-800">
                      <span className="text-muted-text">Market Size</span>
                      <span className="text-accent font-bold text-xl">{result?.marketSize || "$2.4B"}</span>
                    </div>
                    <div className="py-3 border-b border-gray-800">
                      <p className="text-xs text-muted-text mb-2 uppercase font-bold tracking-wider">Analysis Details</p>
                      <p className="text-sm text-gray-300 leading-relaxed">{result?.marketAnalysisDetails}</p>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-800">
                      <span className="text-muted-text">Competitors Found</span>
                      <span className="text-white font-medium">{result?.competitors.length || 3} companies</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-muted-text">Opportunity Score</span>
                      <div className="flex items-center gap-1">
                        <span className="text-amber-500 font-bold">{(result?.opportunityScore || 8.5) / 2}</span>
                        <div className="flex text-amber-500">
                          {[1, 2, 3, 4, 5].map(s => <span key={s}>★</span>)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs text-muted-text mb-2 uppercase font-bold tracking-wider">Top Competitors</p>
                    <div className="flex flex-wrap gap-2">
                      {result?.competitors.map(c => (
                        <span key={c.name} className="bg-gray-800 text-gray-400 text-xs px-3 py-1 rounded-full border border-gray-700">
                          {c.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {result?.groundingSources && result.groundingSources.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-800">
                      <p className="text-xs text-muted-text mb-3 uppercase font-bold tracking-wider">Sources (Google Search)</p>
                      <div className="space-y-2">
                        {result.groundingSources.map((source, i) => (
                          <a 
                            key={i} 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-[10px] text-accent hover:underline truncate"
                          >
                            <ExternalLink size={10} /> {source.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <button className="mt-6 text-accent text-sm font-medium hover:underline flex items-center gap-1">
                    View Full Analysis <ArrowRight size={14} />
                  </button>
                </motion.div>

                {/* CARD 2: Pitch Deck */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gray-900 rounded-2xl p-6 border border-border"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-400">
                      <Plus size={24} />
                    </div>
                    <h3 className="text-lg font-bold">Pitch Deck Ready</h3>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto mb-4 custom-scrollbar pr-2">
                    {result?.pitchSlides.map((slide, i) => (
                      <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-all">
                        <div className="shrink-0 w-6 h-6 bg-gray-800 text-gray-400 rounded text-[10px] flex items-center justify-center font-bold mt-0.5">
                          {slide.slideNumber}
                        </div>
                        <div>
                          <p className="text-sm text-white font-medium">{slide.title}</p>
                          <p className="text-[10px] text-muted-text line-clamp-1">{slide.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-gray-800">
                    <div>
                      <p className="text-[10px] text-muted-text uppercase font-bold mb-1 tracking-wider">Target Customer</p>
                      <p className="text-xs text-white font-medium">{result?.targetCustomer || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-text uppercase font-bold mb-1 tracking-wider">Revenue Model</p>
                      <p className="text-xs text-white font-medium">{result?.revenueModel || "Not specified"}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-800">
                    <p className="text-[10px] text-muted-text uppercase font-bold mb-3 tracking-wider">Generate More Slides</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center bg-gray-800 rounded-xl px-3 border border-gray-700">
                        <span className="text-xs text-gray-500 mr-2">Count:</span>
                        <input 
                          type="number" 
                          min="1" 
                          max="10"
                          value={additionalSlidesCount}
                          onChange={(e) => setAdditionalSlidesCount(parseInt(e.target.value) || 1)}
                          className="w-full bg-transparent text-white py-2 text-sm outline-none"
                        />
                      </div>
                      <button 
                        onClick={handleGenerateMoreSlides}
                        disabled={isGeneratingSlides}
                        className="bg-accent hover:bg-blue-500 disabled:opacity-50 px-4 py-2 rounded-xl text-white text-xs font-bold transition-all flex items-center gap-2"
                      >
                        {isGeneratingSlides ? "Generating..." : "Add Slides"} <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={handleDownloadPPTX}
                    className="mt-6 w-full border border-gray-700 text-gray-400 hover:text-accent hover:border-accent hover:bg-accent/10 rounded-xl py-3 text-sm font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={16} /> Download PPT
                  </button>
                </motion.div>

                {/* CARD 3: Investors */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gray-900 rounded-2xl p-6 border border-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-green-400">
                        <MapIcon size={24} />
                      </div>
                      <h3 className="text-lg font-bold">Investors Near You</h3>
                    </div>
                    <span className="bg-gray-800 text-gray-400 text-[10px] px-2 py-0.5 rounded-full">
                      {result?.localInvestors?.length || investors.length} found
                    </span>
                  </div>
                  <p className="text-muted-text text-sm mb-6 flex items-center gap-1">
                    📍 {selectedCity} • Local network matches
                  </p>

                  <div className="space-y-3">
                    {(result?.localInvestors || investors.slice(0, 3)).map((inv: any, idx: number) => (
                      <div 
                        key={inv.id || idx} 
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-all cursor-pointer"
                        onClick={() => {
                          if (inv.uri) window.open(inv.uri, '_blank');
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white bg-accent">
                            {inv.name?.substring(0, 2).toUpperCase() || inv.initials}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{inv.name}</p>
                            <p className="text-[10px] text-muted-text truncate max-w-[150px]">{inv.address || inv.fund}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInvestorForMeeting(inv);
                              setActiveTab('scheduler');
                            }}
                            className="text-[10px] bg-accent/10 text-accent hover:bg-accent hover:text-white px-2 py-1 rounded transition-all font-bold"
                          >
                            Book
                          </button>
                          {inv.uri && (
                            <ExternalLink size={12} className="text-accent" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => setActiveTab('map')}
                    className="mt-6 w-full bg-green-900/20 text-success border border-green-900/50 rounded-xl py-3 text-sm font-medium hover:bg-green-900/40 transition-all flex items-center justify-center gap-2"
                  >
                    View All on Map <ArrowRight size={16} />
                  </button>
                </motion.div>

                {/* CARD 4: Email */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gray-900 rounded-2xl p-6 border border-border"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400">
                      <Mail size={24} />
                    </div>
                    <h3 className="text-lg font-bold">Email Draft Ready</h3>
                  </div>

                  <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-gray-500 text-[10px] uppercase font-bold">Subject:</span>
                      <span className="text-white text-xs truncate">{result?.investorEmail.subject || "Investment Opportunity"}</span>
                    </div>
                    <div className="h-px bg-gray-700 my-2" />
                    <p className="text-muted-text text-[10px] leading-relaxed line-clamp-4">
                      {result?.investorEmail.body || "Dear Investor, I hope this email finds you well..."}
                    </p>
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-800 to-transparent" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <button 
                      onClick={() => {
                        setSelectedInvestor(investors[0]);
                        setActiveTab('email');
                      }}
                      className="border border-gray-700 text-gray-300 hover:bg-white/5 rounded-xl py-3 text-sm font-medium transition-all"
                    >
                      Edit Draft
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedInvestor(investors[0]);
                        setActiveTab('email');
                      }}
                      className="bg-accent text-white hover:bg-blue-500 rounded-xl py-3 text-sm font-medium transition-all flex items-center justify-center gap-2"
                    >
                      Send Email <Send size={14} />
                    </button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-5xl mx-auto"
            >
              <h2 className="text-2xl font-bold text-white mb-8">My Saved Kits</h2>
              
              {!user ? (
                <div className="bg-gray-900 border border-border rounded-2xl p-12 text-center">
                  <UserIcon className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Login to see your history</h3>
                  <p className="text-muted-text mb-6">Apne generated kits ko save karne ke liye login karein.</p>
                  <button 
                    onClick={() => loginWithGoogle()}
                    className="bg-accent text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-500 transition-all flex items-center gap-2 mx-auto"
                  >
                    <LogIn size={20} /> Login with Google
                  </button>
                </div>
              ) : history.length === 0 ? (
                <div className="bg-gray-900 border border-border rounded-2xl p-12 text-center">
                  <Plus className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">No kits found</h3>
                  <p className="text-muted-text mb-6">Abhi tak koi startup kit generate nahi kiya gaya.</p>
                  <button 
                    onClick={() => setActiveTab('home')}
                    className="bg-accent text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-500 transition-all flex items-center gap-2 mx-auto"
                  >
                    Start Building 🚀
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {history.map((kit) => (
                    <motion.div 
                      key={kit.id}
                      whileHover={{ y: -5 }}
                      className="bg-gray-900 border border-border rounded-2xl p-6 hover:border-accent/50 transition-all cursor-pointer group"
                      onClick={() => {
                        setResult(kit.result);
                        setIdea(kit.idea);
                        setSelectedCity(kit.city);
                        setActiveTab('dashboard');
                      }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full border border-accent/20">
                          {kit.city}
                        </span>
                        <span className="text-[10px] text-gray-600">
                          {new Date(kit.createdAt?.seconds * 1000).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-white font-bold mb-2 line-clamp-2 group-hover:text-accent transition-colors">{kit.idea}</h4>
                      <p className="text-muted-text text-xs line-clamp-3 mb-6">
                        Market Size: {kit.result.marketSize} • {kit.result.pitchSlides.length} Slides
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                        <span className="text-xs text-accent font-medium">View Kit →</span>
                        <div className="flex -space-x-2">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="w-6 h-6 rounded-full border-2 border-gray-900 bg-gray-800" />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'map' && (
            <motion.div 
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-5xl mx-auto"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h2 className="text-2xl font-bold text-white">Investors Near You</h2>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {cities.map(c => (
                    <button 
                      key={c} 
                      onClick={() => setSelectedCity(c)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs border whitespace-nowrap transition-all", 
                        c === selectedCity ? "bg-accent border-accent text-white" : "bg-gray-800 border-gray-700 text-muted-text hover:border-gray-500"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#0D1B2A] h-[400px] md:h-[500px] rounded-2xl border border-border relative overflow-hidden mb-8">
                {/* Map Controls */}
                <div className="absolute top-4 right-4 flex gap-2 z-10">
                  <button 
                    onClick={() => setMapType('roadmap')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1.5 backdrop-blur-md",
                      mapType === 'roadmap' ? "bg-accent text-white border-accent shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "bg-black/50 text-gray-400 border-white/10 hover:bg-black/70"
                    )}
                  >
                    <MapIcon size={12} /> Roadmap
                  </button>
                  <button 
                    onClick={() => setMapType('satellite')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1.5 backdrop-blur-md",
                      mapType === 'satellite' ? "bg-accent text-white border-accent shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "bg-black/50 text-gray-400 border-white/10 hover:bg-black/70"
                    )}
                  >
                    <Globe size={12} /> Satellite
                  </button>
                </div>

                {/* Leaflet Map Component */}
                <MapContainer
                  center={cityCoords[selectedCity]}
                  zoom={12}
                  className="w-full h-full z-0"
                  scrollWheelZoom={true}
                >
                  <ChangeView center={cityCoords[selectedCity]} zoom={12} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url={mapType === 'satellite' ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" : "https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.react"}
                  />
                  {(result && result.city === selectedCity && result.localInvestors ? result.localInvestors : investors.filter(inv => inv.city.toLowerCase() === selectedCity.toLowerCase())).map((inv: any, idx: number) => {
                    const position: [number, number] | null = inv.lat && inv.lng ? [inv.lat, inv.lng] : null;
                    if (!position) return null;
                    
                    return (
                      <Marker
                        key={inv.id || idx}
                        position={position}
                        eventHandlers={{
                          click: () => setInfoWindowData(inv),
                        }}
                      >
                        <Popup>
                          <div className="p-2 min-w-[150px]">
                            <p className="text-sm font-bold text-gray-900 mb-1">{inv.name}</p>
                            <p className="text-[10px] text-gray-600 mb-2 truncate">{inv.officeAddress || inv.fund}</p>
                            <button 
                              onClick={() => {
                                setSelectedInvestorForModal(inv);
                                setSelectedInvestor(inv);
                                setInfoWindowData(null);
                              }}
                              className="w-full bg-accent text-white text-[10px] font-bold py-1 rounded hover:bg-blue-600 transition-all"
                            >
                              View Details
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
                
                <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-xs text-white flex items-center gap-2 z-10">
                  <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  📍 {selectedCity} — Showing real-time results from OpenStreetMap
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(result && result.city === selectedCity && result.localInvestors ? result.localInvestors : investors.filter(inv => inv.city.toLowerCase() === selectedCity.toLowerCase())).map((inv: any, idx: number) => (
                  <div 
                    key={inv.id || idx}
                    onClick={() => {
                      setSelectedInvestorForModal(inv);
                      setSelectedInvestor(inv);
                    }}
                    className={cn(
                      "bg-gray-900 rounded-2xl p-4 border transition-all cursor-pointer flex items-center gap-4 group",
                      selectedInvestor?.id === inv.id ? "border-accent bg-accent/5" : "border-border hover:border-gray-700"
                    )}
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white bg-accent group-hover:scale-110 transition-transform">
                      {inv.name?.substring(0, 2).toUpperCase() || inv.initials}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-white font-semibold">{inv.name}</h4>
                        {inv.distance && <span className="text-[10px] bg-green-900/30 text-success px-2 py-0.5 rounded-full">{inv.distance}</span>}
                      </div>
                      <p className="text-muted-text text-xs line-clamp-1">{inv.officeAddress || inv.fund}</p>
                      <div className="flex gap-2 mt-2">
                        {(inv.focus || ['Venture Capital', 'Startup']).map((f: string) => (
                          <span key={f} className="text-[9px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full border border-gray-700">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInvestorForMeeting(inv);
                          setActiveTab('scheduler');
                        }}
                        className="bg-accent/10 text-accent hover:bg-accent hover:text-white px-3 py-1 rounded-lg text-[10px] font-bold transition-all"
                      >
                        Book Meeting
                      </button>
                      <button 
                        className="text-accent text-xs font-bold group-hover:translate-x-1 transition-transform"
                      >
                        Details →
                      </button>
                      {inv.uri && (
                        <a 
                          href={inv.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] text-muted-text hover:text-white transition-colors flex items-center gap-1"
                        >
                          <ExternalLink size={10} /> Website
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Investor Details Modal */}
              <AnimatePresence>
                {selectedInvestorForModal && (
                  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setSelectedInvestorForModal(null)}
                      className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0, y: 20 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.9, opacity: 0, y: 20 }}
                      className="relative bg-gray-900 border border-border rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
                    >
                      <div className="h-32 bg-gradient-to-br from-accent/20 to-purple-500/20 relative">
                        <button 
                          onClick={() => setSelectedInvestorForModal(null)}
                          className="absolute top-4 right-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all"
                        >
                          <X size={16} />
                        </button>
                        <div className="absolute -bottom-10 left-8">
                          <div className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center text-2xl font-bold text-white shadow-xl border-4 border-gray-900">
                            {selectedInvestorForModal.name?.substring(0, 2).toUpperCase() || selectedInvestorForModal.initials}
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-14 p-8">
                        <div className="mb-6">
                          <h3 className="text-2xl font-bold text-white mb-1">{selectedInvestorForModal.name}</h3>
                          <p className="text-accent font-medium">{selectedInvestorForModal.fund || "Venture Capitalist"}</p>
                        </div>

                        <div className="space-y-4 mb-8">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 shrink-0">
                              <MapIcon size={16} />
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-text uppercase font-bold tracking-wider">Location</p>
                              <p className="text-sm text-gray-300">{selectedInvestorForModal.address || selectedInvestorForModal.city || selectedCity}</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 shrink-0">
                              <Target size={16} />
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-text uppercase font-bold tracking-wider">Investment Focus</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {(selectedInvestorForModal.focus || ['Seed', 'Series A', 'Consumer Tech']).map((f: string) => (
                                  <span key={f} className="text-[10px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded-md border border-gray-700">{f}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <button 
                            onClick={() => {
                              if (selectedInvestorForModal.uri) window.open(selectedInvestorForModal.uri, '_blank');
                            }}
                            className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                          >
                            <ExternalLink size={16} /> Website
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedInvestor(selectedInvestorForModal);
                              setActiveTab('email');
                              setSelectedInvestorForModal(null);
                            }}
                            className="flex-1 bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                          >
                            <Mail size={16} /> Contact
                          </button>
                        </div>

                        <button 
                          onClick={() => {
                            setSelectedInvestorForMeeting(selectedInvestorForModal);
                            setActiveTab('scheduler');
                            setSelectedInvestorForModal(null);
                          }}
                          className="w-full bg-accent text-white py-4 rounded-2xl font-bold hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                        >
                          <Calendar size={20} /> Book Meeting with {selectedInvestorForModal.name?.split(' ')[0]}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

            {activeTab === 'email' && (
              <motion.div 
                key="email"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-3xl mx-auto"
              >
                <h2 className="text-2xl font-bold text-white mb-8">✉️ Send Investor Email</h2>

                {emailSent ? (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-gray-900 border border-border rounded-2xl p-12 text-center"
                  >
                    <div className="w-20 h-20 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 size={48} />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">Email bhej diya! ✅</h3>
                    <p className="text-muted-text mb-8">{selectedInvestor?.name || "Investor"} ko email send ho gaya</p>
                    <button 
                      onClick={() => {
                        setEmailSent(false);
                        setActiveTab('dashboard');
                      }}
                      className="bg-accent text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-500 transition-all"
                    >
                      Back to Dashboard
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-8 relative">
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-800 z-0" />
                      {[
                        { step: 1, label: 'Choose Investor', status: 'completed' },
                        { step: 2, label: 'Edit Email', status: 'active' },
                        { step: 3, label: 'Send', status: 'upcoming' }
                      ].map((s, i) => (
                        <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                            s.status === 'completed' ? "bg-accent text-white" : 
                            s.status === 'active' ? "bg-accent text-white ring-4 ring-accent/20" : "bg-gray-800 text-gray-500"
                          )}>
                            {s.status === 'completed' ? <CheckCircle2 size={16} /> : s.step}
                          </div>
                          <span className={cn("text-[10px] font-medium", s.status === 'upcoming' ? "text-gray-500" : "text-white")}>
                            {s.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-gray-900 rounded-2xl border border-border overflow-hidden">
                      <div className="p-4 bg-gray-800/30 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-muted-text text-xs">Sending to:</span>
                          <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: selectedInvestor?.color || '#3B82F6' }}>
                              {selectedInvestor?.initials || 'AM'}
                            </div>
                            <span className="text-xs text-white font-medium">{selectedInvestor?.name || "Anupam Mittal"}</span>
                            <button className="text-gray-500 hover:text-white"><X size={12} /></button>
                          </div>
                        </div>
                        <button onClick={() => setActiveTab('map')} className="text-accent text-xs font-medium hover:underline">Change Investor</button>
                      </div>

                      <div className="p-0">
                        <div className="flex items-center gap-4 p-4 border-b border-border">
                          <span className="text-gray-500 text-xs w-16">Subject</span>
                          <input 
                            type="text" 
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            className="bg-transparent text-white text-sm flex-1 outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-4 p-4 border-b border-border">
                          <span className="text-gray-500 text-xs w-16">To</span>
                          <input 
                            type="text" 
                            value={emailTo}
                            onChange={(e) => setEmailTo(e.target.value)}
                            className="bg-transparent text-white text-sm flex-1 outline-none"
                          />
                        </div>
                        <div className="p-4">
                          <textarea 
                            rows={12}
                            value={emailBody}
                            onChange={(e) => setEmailBody(e.target.value)}
                            className="w-full bg-transparent text-gray-300 text-sm outline-none resize-none leading-relaxed"
                          />
                        </div>
                        <div className="p-3 border-t border-border bg-gray-800/20 flex items-center justify-between">
                          <span className="text-gray-600 text-[10px] italic">— Sent via FounderAI</span>
                          <span className="text-gray-600 text-[10px]">{emailBody.split(/\s+/).filter(Boolean).length} words</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                      <button className="flex-1 border border-gray-700 text-gray-300 hover:bg-white/5 rounded-xl py-4 font-medium transition-all flex items-center justify-center gap-2">
                        <Copy size={18} /> Save Draft
                      </button>
                      <button 
                        onClick={handleSendEmail}
                        disabled={isSendingEmail}
                        className="flex-[2] bg-accent text-white hover:bg-blue-500 rounded-xl py-4 font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20 disabled:opacity-50"
                      >
                        {isSendingEmail ? "Sending..." : "Send Now 🚀"}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {activeTab === 'scheduler' && (
              <motion.div 
                key="scheduler"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-6xl mx-auto"
              >
                <MeetingScheduler 
                  investor={selectedInvestorForMeeting || investors[0]} 
                  user={user}
                  onSchedule={handleScheduleMeeting}
                  isScheduling={isScheduling}
                  success={schedulingSuccess}
                  onBack={() => {
                    setActiveTab('dashboard');
                    setSelectedInvestorForMeeting(null);
                    setSchedulingSuccess(false);
                  }}
                />
              </motion.div>
            )}

            {activeTab === 'meetings' && (
              <motion.div 
                key="meetings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <MeetingScheduler 
                  user={user}
                  onBack={() => setActiveTab('dashboard')}
                />
              </motion.div>
            )}

            {activeTab === 'ppt-maker' && (
              <PPTMaker 
                pptData={pptData}
                onGenerate={handleGeneratePPT}
                isGenerating={isGeneratingPPT}
                loadingStep={pptLoadingStep}
                progress={pptProgress}
                prompt={pptPrompt}
                setPrompt={setPptPrompt}
                slidesCount={pptSlidesCount}
                setSlidesCount={setPptSlidesCount}
                theme={pptTheme}
                setTheme={setPptTheme}
                language={pptLanguage}
                setLanguage={setPptLanguage}
                currentSlideIndex={currentSlideIndex}
                setCurrentSlideIndex={setCurrentSlideIndex}
                showSpeakerNotes={showSpeakerNotes}
                setShowSpeakerNotes={setShowSpeakerNotes}
                onDownload={handleDownloadPPTX}
                onRegenerate={() => {
                  setPptData(null);
                  setCurrentSlideIndex(0);
                }}
                onEditPrompt={() => {
                  setPptData(null);
                }}
                transition={pptTransition}
                setTransition={setPptTransition}
              />
            )}
        </AnimatePresence>
      </main>
    </div>
    </ErrorBoundary>
  );
}
