export interface Investor {
  id: number;
  name: string;
  fund: string;
  city: string;
  area: string;
  focus: string[];
  email: string;
  initials: string;
  color: string;
  lat: number;
  lng: number;
  distance: string;
  uri?: string;
  officeAddress: string;
  availableDays: string[];
  availableTime: string;
  prefersMeetingType: 'online' | 'offline';
  calendlyUrl: string;
  prefersOnline?: boolean;
  phone?: string;
}

export interface Meeting {
  id: string;
  investorId: number;
  founderId: string;
  meetingType: 'online' | 'offline';
  date: string;
  time: string;
  duration: string;
  agenda: string;
  platform?: string;
  founderName: string;
  founderEmail: string;
  founderPhone: string;
  startupName: string;
  meetLink?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: any;
}

export interface AIResult {
  id?: string;
  marketSize: string;
  marketAnalysisDetails: string;
  competitors: { name: string; strength: string; weakness: string }[];
  opportunityScore: number;
  targetCustomer: string;
  revenueModel: string;
  pitchSlides: { slideNumber: number; title: string; content: string }[];
  investorEmail: {
    subject: string;
    body: string;
  };
  city?: string;
  thinkingAnalysis?: string;
  groundingSources?: { title: string; uri: string }[];
  localInvestors?: Investor[];
  fullMarketResearch?: string;
  startupName?: string;
  marketGrowth?: string;
  marketTrends?: string[];
  riskLevel?: "Low" | "Medium" | "High";
}

export interface PPTSlide {
  slideNumber: number;
  slideType: string;
  title: string;
  subtitle?: string;
  content: string;
  bulletPoints?: string[];
  stats?: { value: string; label: string }[];
  speakerNotes: string;
  emoji: string;
  layoutType: 'title' | 'bullets' | 'stats' | 'split' | 'quote' | 'team' | 'timeline' | 'thankyou';
}

export interface PPTData {
  presentationTitle: string;
  subtitle: string;
  theme: {
    bgColor: string;
    titleColor: string;
    textColor: string;
    accentColor: string;
    cardBg: string;
  };
  slides: PPTSlide[];
}

export const investors: Investor[] = [
  // DELHI NCR (10)
  { id: 1, name: "Anupam Mittal", fund: "People Group", city: "Delhi NCR", area: "South Delhi", focus: ["Consumer", "D2C"], email: "connect@peoplegroup.in", initials: "AM", color: "#3B82F6", lat: 28.5494, lng: 77.2001, distance: "3.2 km", uri: "https://peoplegroup.in", officeAddress: "3rd Floor, DLF Cyber City, Gurugram", availableDays: ["Monday", "Wednesday", "Friday"], availableTime: "10:00 AM - 5:00 PM", prefersMeetingType: "online", calendlyUrl: "" },
  { id: 2, name: "Ritesh Malik", fund: "Innov8 Cowork", city: "Delhi NCR", area: "Hauz Khas", focus: ["EdTech", "SaaS"], email: "ritesh@innov8.in", initials: "RM", color: "#8B5CF6", lat: 28.5535, lng: 77.1910, distance: "5.1 km", uri: "https://innov8.org.in", officeAddress: "Innov8, Old Fort Saket, New Delhi", availableDays: ["Tuesday", "Thursday"], availableTime: "11:00 AM - 4:00 PM", prefersMeetingType: "offline", calendlyUrl: "" },
  { id: 3, name: "Rajan Anandan", fund: "Peak XV Partners", city: "Delhi NCR", area: "Connaught Place", focus: ["Fintech", "AI"], email: "rajan@peakxv.com", initials: "RA", color: "#10B981", lat: 28.6315, lng: 77.2167, distance: "8.4 km", uri: "https://www.peakxv.com", officeAddress: "Peak XV, Connaught Place, New Delhi", availableDays: ["Monday", "Tuesday", "Wednesday"], availableTime: "9:00 AM - 6:00 PM", prefersMeetingType: "online", calendlyUrl: "" },
  { id: 4, name: "Sandeep Murthy", fund: "Lightbox VC", city: "Delhi NCR", area: "Aerocity", focus: ["Retail", "Consumer"], email: "sandeep@lightbox.vc", initials: "SM", color: "#F59E0B", lat: 28.5562, lng: 77.0890, distance: "12.3 km", uri: "https://lightbox.vc", officeAddress: "Lightbox, Aerocity, New Delhi", availableDays: ["Wednesday", "Thursday", "Friday"], availableTime: "10:00 AM - 5:00 PM", prefersMeetingType: "online", calendlyUrl: "" },
  { id: 5, name: "Deepak Gupta", fund: "Orios VP", city: "Delhi NCR", area: "Gurugram", focus: ["B2B", "Logistics"], email: "deepak@oriosvp.com", initials: "DG", color: "#EF4444", lat: 28.4595, lng: 77.0266, distance: "15.7 km", uri: "https://www.oriosvp.com", officeAddress: "Orios, Sector 44, Gurugram", availableDays: ["Monday", "Friday"], availableTime: "12:00 PM - 5:00 PM", prefersMeetingType: "offline", calendlyUrl: "" },
  { id: 6, name: "Vani Kola", fund: "Kalaari Capital", city: "Delhi NCR", area: "Noida", focus: ["E-commerce", "SaaS"], email: "vani@kalaari.com", initials: "VK", color: "#3B82F6", lat: 28.5355, lng: 77.3910, distance: "18.2 km", uri: "https://www.kalaari.com", officeAddress: "Kalaari, Sector 62, Noida", availableDays: ["Tuesday", "Wednesday"], availableTime: "10:00 AM - 4:00 PM", prefersMeetingType: "online", calendlyUrl: "" },
  { id: 7, name: "Kunal Bahl", fund: "Titan Capital", city: "Delhi NCR", area: "Gurugram", focus: ["Consumer", "Fintech"], email: "kunal@titancapital.vc", initials: "KB", color: "#8B5CF6", lat: 28.4495, lng: 77.0666, distance: "14.5 km", uri: "https://www.titancapital.vc", officeAddress: "Titan Capital, Sector 32, Gurugram", availableDays: ["Monday", "Wednesday"], availableTime: "11:00 AM - 6:00 PM", prefersMeetingType: "offline", calendlyUrl: "" },
  { id: 8, name: "Alok Mittal", fund: "Indifi", city: "Delhi NCR", area: "South Delhi", focus: ["Fintech", "SME"], email: "alok@indifi.com", initials: "AM", color: "#10B981", lat: 28.5294, lng: 77.2101, distance: "4.1 km", uri: "https://www.indifi.com", officeAddress: "Indifi, Okhla Phase 3, New Delhi", availableDays: ["Thursday", "Friday"], availableTime: "10:00 AM - 5:00 PM", prefersMeetingType: "online", calendlyUrl: "" },
  { id: 9, name: "Saurabh Srivastava", fund: "Indian Angel Network", city: "Delhi NCR", area: "Noida", focus: ["Healthcare", "CleanTech"], email: "saurabh@indianangelnetwork.com", initials: "SS", color: "#F59E0B", lat: 28.5455, lng: 77.3810, distance: "17.8 km", uri: "https://www.indianangelnetwork.com", officeAddress: "IAN, Sector 16, Noida", availableDays: ["Monday", "Wednesday", "Friday"], availableTime: "9:00 AM - 5:00 PM", prefersMeetingType: "offline", calendlyUrl: "" },
  { id: 10, name: "Padmaja Ruparel", fund: "IAN Fund", city: "Delhi NCR", area: "Connaught Place", focus: ["AgriTech", "SaaS"], email: "padmaja@ianfund.com", initials: "PR", color: "#EF4444", lat: 28.6215, lng: 77.2267, distance: "7.9 km", uri: "https://ianfund.com", officeAddress: "IAN Fund, CP, New Delhi", availableDays: ["Tuesday", "Thursday"], availableTime: "10:00 AM - 4:00 PM", prefersMeetingType: "online", calendlyUrl: "" },

  // MUMBAI (6)
  { id: 11, name: "Anirudh Damani", fund: "Artha Venture", city: "Mumbai", area: "Bandra", focus: ["D2C", "SaaS"], email: "anirudh@artha.vc", initials: "AD", color: "#3B82F6", lat: 19.0596, lng: 72.8295, distance: "2.5 km", uri: "https://www.artha.vc", officeAddress: "Artha, Bandra West, Mumbai", availableDays: ["Monday", "Wednesday"], availableTime: "10:00 AM - 6:00 PM", prefersMeetingType: "online", calendlyUrl: "" },
  { id: 12, name: "Sanjay Mehta", fund: "100X.VC", city: "Mumbai", area: "BKC", focus: ["DeepTech", "SaaS"], email: "sanjay@100x.vc", initials: "SM", color: "#8B5CF6", lat: 19.0607, lng: 72.8633, distance: "4.2 km", uri: "https://www.100x.vc", officeAddress: "100X.VC, BKC, Mumbai", availableDays: ["Tuesday", "Thursday"], availableTime: "11:00 AM - 5:00 PM", prefersMeetingType: "offline", calendlyUrl: "" },
  { id: 13, name: "Apoorva Ranjan Sharma", fund: "Venture Catalysts", city: "Mumbai", area: "Andheri", focus: ["Fintech", "HealthTech"], email: "apoorva@vencats.in", initials: "AS", color: "#10B981", lat: 19.1136, lng: 72.8697, distance: "6.8 km", uri: "https://venturecatalysts.in", officeAddress: "Vencats, Andheri East, Mumbai", availableDays: ["Wednesday", "Friday"], availableTime: "10:00 AM - 4:00 PM", prefersMeetingType: "online", calendlyUrl: "" },
  { id: 14, name: "Vikram Gupta", fund: "IvyCap Ventures", city: "Mumbai", area: "Powai", focus: ["AgriTech", "Consumer"], email: "vikram@ivycapventures.com", initials: "VG", color: "#F59E0B", lat: 19.1176, lng: 72.9060, distance: "9.1 km", uri: "https://www.ivycapventures.com", officeAddress: "IvyCap, Powai, Mumbai", availableDays: ["Monday", "Tuesday"], availableTime: "9:00 AM - 5:00 PM", prefersMeetingType: "offline", calendlyUrl: "" },
  { id: 15, name: "Sudhir Sethi", fund: "Chiratae Ventures", city: "Mumbai", area: "BKC", focus: ["Fintech", "SaaS"], email: "sudhir@chiratae.com", initials: "SS", color: "#EF4444", lat: 19.0657, lng: 72.8533, distance: "3.9 km", uri: "https://www.chiratae.com", officeAddress: "Chiratae, BKC, Mumbai", availableDays: ["Thursday", "Friday"], availableTime: "10:00 AM - 6:00 PM", prefersMeetingType: "online", calendlyUrl: "" },
  { id: 16, name: "Karthik Reddy", fund: "Blume Ventures", city: "Mumbai", area: "Bandra", focus: ["EdTech", "Logistics"], email: "karthik@blume.vc", initials: "KR", color: "#3B82F6", lat: 19.0546, lng: 72.8395, distance: "2.1 km", uri: "https://blume.vc", officeAddress: "Blume, Bandra West, Mumbai", availableDays: ["Monday", "Wednesday", "Friday"], availableTime: "10:00 AM - 5:00 PM", prefersMeetingType: "offline", calendlyUrl: "" },

  // BANGALORE (5)
  { id: 17, name: "Nithin Kamath", fund: "Rainmatter", city: "Bangalore", area: "Koramangala", focus: ["Fintech", "Health"], email: "nithin@zerodha.com", initials: "NK", color: "#3B82F6", lat: 12.9352, lng: 77.6245, distance: "3.5 km", uri: "https://rainmatter.com", officeAddress: "Rainmatter, Koramangala, Bangalore", availableDays: ["Monday", "Wednesday"], availableTime: "10:00 AM - 4:00 PM", prefersMeetingType: "online", calendlyUrl: "" },
  { id: 18, name: "Kunal Shah", fund: "QED Innovation", city: "Bangalore", area: "Indiranagar", focus: ["Fintech", "Consumer"], email: "kunal@cred.club", initials: "KS", color: "#8B5CF6", lat: 12.9784, lng: 77.6408, distance: "5.2 km", uri: "https://cred.club", officeAddress: "CRED, Indiranagar, Bangalore", availableDays: ["Tuesday", "Thursday"], availableTime: "11:00 AM - 6:00 PM", prefersMeetingType: "offline", calendlyUrl: "" },
  { id: 19, name: "Bhavish Aggarwal", fund: "Ola Foundation", city: "Bangalore", area: "Koramangala", focus: ["Mobility", "AI"], email: "bhavish@ola.com", initials: "BA", color: "#10B981", lat: 12.9252, lng: 77.6345, distance: "4.1 km", uri: "https://www.olafoundation.in", officeAddress: "Ola, Koramangala, Bangalore", availableDays: ["Wednesday", "Friday"], availableTime: "10:00 AM - 5:00 PM", prefersMeetingType: "online", calendlyUrl: "" },
  { id: 20, name: "Sujeet Kumar", fund: "Udaan", city: "Bangalore", area: "Whitefield", focus: ["B2B", "Logistics"], email: "sujeet@udaan.com", initials: "SK", color: "#F59E0B", lat: 12.9698, lng: 77.7500, distance: "12.8 km", uri: "https://udaan.com", officeAddress: "Udaan, Whitefield, Bangalore", availableDays: ["Monday", "Tuesday"], availableTime: "9:00 AM - 5:00 PM", prefersMeetingType: "offline", calendlyUrl: "" },
  { id: 21, name: "Anand Daniel", fund: "Accel India", city: "Bangalore", area: "Indiranagar", focus: ["SaaS", "Marketplace"], email: "anand@accel.com", initials: "AD", color: "#EF4444", lat: 12.9684, lng: 77.6508, distance: "4.9 km", uri: "https://www.accel.com", officeAddress: "Accel, Indiranagar, Bangalore", availableDays: ["Thursday", "Friday"], availableTime: "10:00 AM - 6:00 PM", prefersMeetingType: "online", calendlyUrl: "" },

  // HYDERABAD (4)
  { id: 22, name: "Sridhar Pinnapureddy", fund: "CtrlS", city: "Hyderabad", area: "Hitech City", focus: ["Cloud", "SaaS"], email: "sridhar@ctrls.com", initials: "SP", color: "#3B82F6", lat: 17.4435, lng: 78.3772, distance: "2.8 km", uri: "https://www.ctrls.com", officeAddress: "CtrlS, Hitech City, Hyderabad", availableDays: ["Monday", "Wednesday"], availableTime: "10:00 AM - 5:00 PM", prefersMeetingType: "online", calendlyUrl: "" },
  { id: 23, name: "Srini Raju", fund: "Peepul Capital", city: "Hyderabad", area: "Banjara Hills", focus: ["Healthcare", "Consumer"], email: "srini@peepul.com", initials: "SR", color: "#8B5CF6", lat: 17.4156, lng: 78.4347, distance: "4.5 km", uri: "https://www.peepulcapital.com", officeAddress: "Peepul, Banjara Hills, Hyderabad", availableDays: ["Tuesday", "Thursday"], availableTime: "11:00 AM - 4:00 PM", prefersMeetingType: "offline", calendlyUrl: "" },
  { id: 24, name: "Phani Kishan", fund: "Swiggy", city: "Hyderabad", area: "Hitech City", focus: ["FoodTech", "Logistics"], email: "phani@swiggy.com", initials: "PK", color: "#10B981", lat: 17.4535, lng: 78.3872, distance: "3.1 km", uri: "https://www.swiggy.com", officeAddress: "Swiggy, Hitech City, Hyderabad", availableDays: ["Wednesday", "Friday"], availableTime: "10:00 AM - 5:00 PM", prefersMeetingType: "online", calendlyUrl: "" },
  { id: 25, name: "Ramesh Loganathan", fund: "IIIT Hyderabad", city: "Hyderabad", area: "Gachibowli", focus: ["DeepTech", "AI"], email: "ramesh@iiit.ac.in", initials: "RL", color: "#F59E0B", lat: 17.4450, lng: 78.3489, distance: "5.4 km", uri: "https://www.iiit.ac.in", officeAddress: "IIIT, Gachibowli, Hyderabad", availableDays: ["Monday", "Friday"], availableTime: "9:00 AM - 5:00 PM", prefersMeetingType: "offline", calendlyUrl: "" }
];
