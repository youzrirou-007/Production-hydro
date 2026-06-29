import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { 
  Mail, 
  Send, 
  Inbox, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  ChevronRight, 
  Search, 
  RefreshCw, 
  EyeOff, 
  Eye,
  MessageSquare,
  Shield,
  MousePointer,
  Sparkles,
  Zap,
  MapPin,
  TrendingUp,
  AlertTriangle,
  Layers,
  ArrowRight,
  Filter,
  Check,
  FileText,
  Wrench,
  Users,
  Archive,
  Fuel,
  Star,
  Trash2,
  Paperclip,
  Maximize2,
  Cpu,
  Minimize2,
  X,
  ChevronLeft,
  CornerUpLeft,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import logoImg from '../assets/images/hydromines_logo_1781337889277.jpg';

interface ReadReceipt {
  userEmail: string;
  userName: string;
  userRole: string;
  readAt: string;
  delaySeconds: number;
  response?: string;
  deletedDrafts?: string[];
  totalKeystrokes?: number;
  lastActiveDraft?: string;
  telemetryUpdates?: number;
  finalizedAt?: string;
}

interface SystemMessage {
  id: string;
  title: string;
  body: string;
  senderEmail: string;
  senderName: string;
  createdAt: any; // Firestore Timestamp or string
  targetRole: string; // 'all' | 'chief' | 'responsible' | 'operator' | 'direction' | 'secretary'
  targetUserEmail?: string;
  targetChantier?: string; // 'SMI'
  category?: string; // 'exploitation' | 'urgence' | 'logistique' | 'maintenance' | 'securite' | 'rh' | 'magasin' | 'carburant'
  urgency: 'low' | 'medium' | 'critical';
  reads?: { [email: string]: ReadReceipt };
  archivedBy?: string[];
}

// Extended high-fidelity preset templates for HydroMines SMI
const DIRECTIVE_PRESETS = [
  {
    id: 'arr_urg_travaux',
    title: "🚨 ECO-REAL : Écarts critiques Planifié vs Réalisé (Action d'Urgence)",
    body: "Les écarts récents constatés entre le planifié et le réalisé sur le chantier de SMI Imiter ne témoignent pas d'un engagement de votre part sur l'avancement des travaux. Veuillez soumettre immédiatement un plan d'action d'urgence pour rattraper ce retard de production, et consigner les explications techniques requises.",
    urgency: 'critical' as const,
    category: 'exploitation',
    targetRole: 'responsible',
    label: "🚨 Écarts Planifié / Réalisé"
  },
  {
    id: 'cons_expl',
    title: "📋 Consigne d'Exploitation : Objectifs du Poste",
    body: "Pour le poste en cours à SMI Imiter, l'objectif de traitement est fixé à 850 tonnes. Veuillez ajuster le débit d'injection des réactifs chimiques et veiller au maintien des pressions hydrauliques nominales sur les broyeurs secondaires.",
    urgency: 'medium' as const,
    category: 'exploitation',
    targetRole: 'responsible',
    label: "📋 Objectifs du Poste"
  },
  {
    id: 'maint_prev',
    title: "🔧 Maintenance Préventive : Filtre-Presse & Tambours",
    body: "Intervention programmée sur le filtre-presse de la laverie à SMI Imiter aujourd'hui. Les responsables de chantiers doivent coordonner l'arrêt temporaire de l'alimentation avec l'équipe technique pour éviter tout engorgement des circuits.",
    urgency: 'medium' as const,
    category: 'maintenance',
    targetRole: 'responsible',
    label: "🔧 Maintenance Filtre-Presse"
  },
  {
    id: 'alerte_meteo',
    title: "⚠️ Alerte Sécurité HSE : Risque d'Inondation / Orages violents",
    body: "Bulletins météo reçus. Risques d'orages violents sur le secteur SMI Imiter. Consignes : évacuation préventive des galeries basses, sécurisation des pompes de drainage de fond et contrôle immédiat des raccordements électriques extérieurs.",
    urgency: 'critical' as const,
    category: 'securite',
    targetRole: 'responsible',
    label: "⚠️ Sécurité Météo & HSE"
  },
  {
    id: 'coordination_rh',
    title: "👥 Coordination RH : Validation d'Effectif & Pompistes",
    body: "Il a été constaté un manque d'équipiers qualifiés sur certains postes de nuit. Les responsables de chantier doivent valider l'appel de renforts RH avant le début du poste et s'assurer de la présence systématique des pompistes de garde.",
    urgency: 'medium' as const,
    category: 'rh',
    targetRole: 'responsible',
    label: "👥 Présence Équipes RH"
  },
  {
    id: 'magasin_stock',
    title: "📦 Espace Magasinier : Alerte Stock Critique Pièces d'usure",
    body: "Alerte de l'espace magasinier concernant des pièces d'usure critiques pour les treuils d'extraction. Veuillez coordonner avec l'équipe de maintenance pour optimiser l'utilisation des stocks restants et éviter tout arrêt intempestif.",
    urgency: 'medium' as const,
    category: 'magasin',
    targetRole: 'responsible',
    label: "📦 Stock Pièces Magasin"
  },
  {
    id: 'carburant_cons',
    title: "⛽ Carburants & Lubrifiants : Écarts de Consommation Chargeuses",
    body: "Des anomalies notables de consommation de gasoil ont été détectées sur les chargeuses LHD du chantier SMI. Merci de vérifier immédiatement la conformité des jauges de ravitaillement et de consigner les volumes précis dans le registre.",
    urgency: 'low' as const,
    category: 'carburant',
    targetRole: 'responsible',
    label: "⛽ Consommation Gasoil"
  }
];

export const Messages: React.FC = () => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<SystemMessage[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation states (Gmail-style folders and labels)
  const [activeFolder, setActiveFolder] = useState<'inbox' | 'sent' | 'archive'>('inbox');
  const [activeLabelFilter, setActiveLabelFilter] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<SystemMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Gmail Compose window state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isComposeMaximized, setIsComposeMaximized] = useState(false);
  
  // Form fields for composing
  const [composeTitle, setComposeTitle] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeTargetRole, setComposeTargetRole] = useState('responsible');
  const [composeTargetEmail, setComposeTargetEmail] = useState('');
  const [composeUrgency, setComposeUrgency] = useState<'low' | 'medium' | 'critical'>('medium');
  const [composeCategory, setComposeCategory] = useState('exploitation');
  const [composeChantier, setComposeChantier] = useState('SMI');
  const [sending, setSending] = useState(false);
  const [composeSuccess, setComposeSuccess] = useState(false);

  // Reply states
  const [replyText, setReplyText] = useState('');
  const prevReplyTextRef = useRef('');
  const [deletedDrafts, setDeletedDrafts] = useState<string[]>([]);
  const [keystrokeCount, setKeystrokeCount] = useState(0);
  const [replying, setReplying] = useState(false);
  const [refreshSpin, setRefreshSpin] = useState(false);

  // Perfectly intelligent recipient detection
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [personnelList, setPersonnelList] = useState<any[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');

  const isAdminOrDirection = profile?.role === 'admin' || profile?.role === 'direction';

  // Load messages in real-time
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'system_messages'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: SystemMessage[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as SystemMessage);
      });
      setMessages(msgs);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'system_messages');
    });

    return () => unsubscribe();
  }, [user]);

  // Load registered users and personnel in real-time
  useEffect(() => {
    if (!user) return;
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const list: any[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setRegisteredUsers(list);
    }, (err) => {
      console.warn("Error fetching registered users in real-time:", err);
    });

    const unsubPersonnel = onSnapshot(collection(db, 'personnel'), (snap) => {
      const list: any[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setPersonnelList(list);
    }, (err) => {
      console.warn("Error fetching personnel list in real-time:", err);
    });

    return () => {
      unsubUsers();
      unsubPersonnel();
    };
  }, [user]);

  const findRegisteredUserForPersonnel = (p: any) => {
    if (!p) return null;
    const pFullName = `${p.prenom || ''} ${p.nom || ''}`.toLowerCase().trim();
    const pFullNameReverse = `${p.nom || ''} ${p.prenom || ''}`.toLowerCase().trim();
    
    return registeredUsers.find((u: any) => {
      if (p.email && u.email && p.email.toLowerCase().trim() === u.email.toLowerCase().trim()) {
        return true;
      }
      const uName = (u.name || '').toLowerCase().trim();
      return uName.includes(pFullName) || 
             uName.includes(pFullNameReverse) || 
             pFullName.includes(uName) || 
             pFullNameReverse.includes(uName);
    });
  };

  const getSelectableRecipients = () => {
    const targetFn = composeTargetRole === 'responsible' ? 'RESPONSABLE_CHANTIER' : 'SECRETAIRE_CHANTIER';
    const targetRole = composeTargetRole === 'responsible' ? 'responsible' : 'secretary';

    // 1. Get all employees from the personnel collection with the matching function
    const matchingPersonnel = personnelList.filter(p => p.fonction === targetFn);

    // 2. Map personnel to registered accounts
    const list = matchingPersonnel.map(p => {
      const regUser = findRegisteredUserForPersonnel(p);
      return {
        id: p.id,
        name: `${p.prenom} ${p.nom}`,
        email: regUser?.email || p.email || '',
        isRegistered: !!regUser,
        source: 'personnel'
      };
    });

    // 3. Add registered users who match the role but might not be in the personnel list
    registeredUsers.forEach(u => {
      if (u.role === targetRole) {
        const alreadyIncluded = list.some(item => {
          if (item.email && u.email && item.email.toLowerCase().trim() === u.email.toLowerCase().trim()) return true;
          const uName = (u.name || '').toLowerCase().trim();
          return item.name.toLowerCase().trim().includes(uName) || uName.includes(item.name.toLowerCase().trim());
        });
        if (!alreadyIncluded) {
          list.push({
            id: u.id,
            name: u.name || 'Utilisateur sans nom',
            email: u.email || '',
            isRegistered: true,
            source: 'users'
          });
        }
      }
    });

    return list;
  };

  const handleRecipientSelect = (recipientId: string) => {
    setSelectedRecipientId(recipientId);
    const recipients = getSelectableRecipients();
    const selected = recipients.find(r => r.id === recipientId);
    if (selected) {
      setComposeTargetEmail(selected.email || '');
    } else {
      setComposeTargetEmail('');
    }
  };

  const handleToggleArchive = async (msg: SystemMessage) => {
    if (!user) return;
    try {
      const msgRef = doc(db, 'system_messages', msg.id);
      const currentArchived = msg.archivedBy || [];
      const email = user.email || '';
      
      let updatedArchived = [];
      if (currentArchived.includes(email)) {
        updatedArchived = currentArchived.filter(e => e !== email);
      } else {
        updatedArchived = [...currentArchived, email];
      }

      await updateDoc(msgRef, {
        archivedBy: updatedArchived
      });

      setSelectedMessage((prev) => {
        if (!prev) return null;
        return { ...prev, archivedBy: updatedArchived };
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `system_messages/${msg.id}`);
    }
  };

  // Filter messages based on active folders, search query, labels, and user roles
  const filteredMessages = messages.filter((msg) => {
    // 1. Folder filter
    if (activeFolder === 'sent') {
      if (msg.senderEmail !== user?.email) return false;
    } else {
      // For Inbox & Archive: must be a target of the message
      const isTargetEmail = msg.targetUserEmail && msg.targetUserEmail.toLowerCase().trim() === user?.email?.toLowerCase().trim();
      const isTargetRole = msg.targetRole === 'all' || msg.targetRole === profile?.role || profile?.role === 'admin' || profile?.role === 'direction';
      
      const isTarget = isTargetEmail || (!msg.targetUserEmail && isTargetRole);
      if (!isTarget) return false;

      const archivedList = msg.archivedBy || [];
      const isArchivedByUser = archivedList.includes(user?.email || '');

      if (activeFolder === 'archive') {
        if (!isArchivedByUser) return false;
      } else { // activeFolder === 'inbox'
        if (isArchivedByUser) return false;
      }
    }

    // 2. Label filter
    if (activeLabelFilter) {
      if (msg.category !== activeLabelFilter) return false;
    }

    // 3. Search query filter
    if (searchQuery.trim()) {
      const queryLower = searchQuery.toLowerCase();
      return (
        msg.title.toLowerCase().includes(queryLower) ||
        msg.body.toLowerCase().includes(queryLower) ||
        msg.senderName.toLowerCase().includes(queryLower)
      );
    }

    return true;
  });

  // Calculate stats for folders & labels
  const archiveMessagesCount = messages.filter((msg) => {
    const isTargetEmail = msg.targetUserEmail && msg.targetUserEmail.toLowerCase().trim() === user?.email?.toLowerCase().trim();
    const isTargetRole = msg.targetRole === 'all' || msg.targetRole === profile?.role || profile?.role === 'admin' || profile?.role === 'direction';
    const isTarget = isTargetEmail || (!msg.targetUserEmail && isTargetRole);
    if (!isTarget) return false;

    const archivedList = msg.archivedBy || [];
    return archivedList.includes(user?.email || '');
  }).length;

  const inboxMessagesCount = messages.filter((msg) => {
    const isTargetEmail = msg.targetUserEmail && msg.targetUserEmail.toLowerCase().trim() === user?.email?.toLowerCase().trim();
    const isTargetRole = msg.targetRole === 'all' || msg.targetRole === profile?.role || profile?.role === 'admin' || profile?.role === 'direction';
    const isTarget = isTargetEmail || (!msg.targetUserEmail && isTargetRole);
    if (!isTarget) return false;

    const archivedList = msg.archivedBy || [];
    return !archivedList.includes(user?.email || '');
  }).length;

  const sentMessagesCount = messages.filter((msg) => msg.senderEmail === user?.email).length;

  const unreadCount = messages.filter((msg) => {
    // Inbox targeting
    const isTargetEmail = msg.targetUserEmail && msg.targetUserEmail.toLowerCase().trim() === user?.email?.toLowerCase().trim();
    const isTargetRole = msg.targetRole === 'all' || msg.targetRole === profile?.role || profile?.role === 'admin' || profile?.role === 'direction';
    const isTarget = isTargetEmail || (!msg.targetUserEmail && isTargetRole);
    if (!isTarget) return false;

    const archivedList = msg.archivedBy || [];
    if (archivedList.includes(user?.email || '')) return false;

    const emailKey = user?.email?.replace(/\./g, '_') || '';
    const isRead = msg.reads && msg.reads[emailKey];
    return !isRead;
  }).length;

  const getLabelCount = (labelKey: string) => {
    return messages.filter((msg) => {
      if (msg.category !== labelKey) return false;
      if (activeFolder === 'sent') {
        return msg.senderEmail === user?.email;
      } else {
        const isTargetEmail = msg.targetUserEmail && msg.targetUserEmail.toLowerCase().trim() === user?.email?.toLowerCase().trim();
        const isTargetRole = msg.targetRole === 'all' || msg.targetRole === profile?.role || profile?.role === 'admin' || profile?.role === 'direction';
        const isTarget = isTargetEmail || (!msg.targetUserEmail && isTargetRole);
        if (!isTarget) return false;

        const archivedList = msg.archivedBy || [];
        const isArchivedByUser = archivedList.includes(user?.email || '');

        if (activeFolder === 'archive') {
          return isArchivedByUser;
        } else {
          return !isArchivedByUser;
        }
      }
    }).length;
  };

  // Track draft keystrokes & detect deleted draft parts
  useEffect(() => {
    if (!selectedMessage) return;
    
    const prev = prevReplyTextRef.current;
    if (replyText === prev) return;

    setKeystrokeCount((c) => c + 1);

    if (prev.length > replyText.length) {
      const diffLength = prev.length - replyText.length;
      let deletedPart = '';
      if (prev.startsWith(replyText)) {
        deletedPart = prev.substring(replyText.length);
      } else if (prev.endsWith(replyText)) {
        deletedPart = prev.substring(0, diffLength);
      } else {
        let firstDiff = 0;
        while (firstDiff < replyText.length && prev[firstDiff] === replyText[firstDiff]) {
          firstDiff++;
        }
        deletedPart = prev.substring(firstDiff, firstDiff + diffLength);
      }

      const trimmed = deletedPart.trim();
      if (trimmed.length > 2) {
        setDeletedDrafts((prevList) => {
          if (!prevList.includes(trimmed)) {
            return [...prevList, trimmed];
          }
          return prevList;
        });
      }
    }

    prevReplyTextRef.current = replyText;

    const emailKey = user?.email?.replace(/\./g, '_') || '';
    const delayTimer = setTimeout(() => {
      const hasResponseSaved = selectedMessage.reads?.[emailKey]?.response;
      if (!hasResponseSaved) {
        const msgRef = doc(db, 'system_messages', selectedMessage.id);
        const readAt = selectedMessage.reads?.[emailKey]?.readAt || new Date().toISOString();
        const delaySeconds = selectedMessage.reads?.[emailKey]?.delaySeconds || 0;

        updateDoc(msgRef, {
          [`reads.${emailKey}`]: {
            userEmail: user?.email || '',
            userName: profile?.nom ? `${profile.prenom} ${profile.nom}` : user?.displayName || 'Utilisateur',
            userRole: profile?.role || 'operator',
            readAt,
            delaySeconds,
            lastActiveDraft: replyText,
            deletedDrafts: deletedDrafts,
            totalKeystrokes: keystrokeCount + 1,
            telemetryUpdates: (selectedMessage.reads?.[emailKey]?.telemetryUpdates || 0) + 1
          }
        }).catch((err) => console.warn("Live telemetry sync ignored: ", err));
      }
    }, 1500);

    return () => clearTimeout(delayTimer);
  }, [replyText, selectedMessage]);

  const handleSelectMessage = async (msg: SystemMessage) => {
    setSelectedMessage(msg);
    setReplyText('');
    prevReplyTextRef.current = '';
    setDeletedDrafts([]);
    setKeystrokeCount(0);

    const emailKey = user?.email?.replace(/\./g, '_') || '';
    const alreadyRead = msg.reads && msg.reads[emailKey];

    if (!alreadyRead) {
      try {
        const msgRef = doc(db, 'system_messages', msg.id);
        const now = new Date();
        
        let delaySecs = 0;
        if (msg.createdAt) {
          const createdTime = msg.createdAt.seconds 
            ? new Date(msg.createdAt.seconds * 1000) 
            : new Date(msg.createdAt);
          delaySecs = Math.max(0, Math.floor((now.getTime() - createdTime.getTime()) / 1000));
        }

        const readRecord: ReadReceipt = {
          userEmail: user?.email || '',
          userName: profile?.nom ? `${profile.prenom} ${profile.nom}` : user?.displayName || 'Utilisateur',
          userRole: profile?.role || 'operator',
          readAt: now.toISOString(),
          delaySeconds: delaySecs,
          deletedDrafts: [],
          totalKeystrokes: 0,
          lastActiveDraft: ''
        };

        await updateDoc(msgRef, {
          [`reads.${emailKey}`]: readRecord
        });
      } catch (err) {
        console.error("Error setting read status:", err);
      }
    }
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;
    setReplying(true);

    try {
      const emailKey = user?.email?.replace(/\./g, '_') || '';
      const msgRef = doc(db, 'system_messages', selectedMessage.id);

      await updateDoc(msgRef, {
        [`reads.${emailKey}.response`]: replyText.trim(),
        [`reads.${emailKey}.deletedDrafts`]: deletedDrafts,
        [`reads.${emailKey}.totalKeystrokes`]: keystrokeCount,
        [`reads.${emailKey}.finalizedAt`]: new Date().toISOString()
      });

      setReplyText('');
      setReplying(false);
      
      setSelectedMessage((prev) => {
        if (!prev) return null;
        const updatedReads = { ...prev.reads };
        if (updatedReads[emailKey]) {
          updatedReads[emailKey] = {
            ...updatedReads[emailKey],
            response: replyText.trim(),
            deletedDrafts,
            totalKeystrokes: keystrokeCount,
            finalizedAt: new Date().toISOString()
          };
        }
        return { ...prev, reads: updatedReads };
      });
    } catch (err) {
      setReplying(false);
      handleFirestoreError(err, OperationType.UPDATE, `system_messages/${selectedMessage.id}`);
    }
  };

  const applyPreset = (preset: typeof DIRECTIVE_PRESETS[0]) => {
    setComposeTitle(preset.title);
    setComposeBody(preset.body);
    setComposeUrgency(preset.urgency);
    setComposeCategory(preset.category);
    setComposeTargetRole(preset.targetRole);
  };

  const handleComposeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTitle.trim() || !composeBody.trim()) return;

    setSending(true);
    setComposeSuccess(false);

    try {
      const newMessage = {
        title: composeTitle.trim(),
        body: composeBody.trim(),
        senderEmail: user?.email || '',
        senderName: profile?.nom ? `${profile.prenom} ${profile.nom}` : user?.displayName || 'Directeur Technique',
        createdAt: new Date().toISOString(),
        targetRole: composeTargetRole,
        targetUserEmail: composeTargetEmail.trim() || null,
        targetChantier: composeChantier,
        category: composeCategory,
        urgency: composeUrgency,
        reads: {}
      };

      await addDoc(collection(db, 'system_messages'), newMessage);
      
      setComposeTitle('');
      setComposeBody('');
      setComposeTargetRole('all');
      setComposeTargetEmail('');
      setComposeUrgency('medium');
      setComposeCategory('exploitation');
      setSending(false);
      setComposeSuccess(true);
      setIsComposeOpen(false);
      
      setActiveFolder('sent');
      setSelectedMessage(null);
      
      setTimeout(() => setComposeSuccess(false), 4000);
    } catch (err) {
      setSending(false);
      handleFirestoreError(err, OperationType.CREATE, 'system_messages');
    }
  };

  const handleRefresh = () => {
    setRefreshSpin(true);
    setTimeout(() => setRefreshSpin(false), 1000);
  };

  const getUrgencyBadge = (urgency: 'low' | 'medium' | 'critical') => {
    switch (urgency) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-100 text-[#8B0000] border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8B0000] animate-ping" />
            CRITIQUE
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-700 border border-amber-200">
            IMPORTANT
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-100 text-[#00BFFF] border border-sky-200">
            INFO
          </span>
        );
    }
  };

  const getCategoryDetails = (cat?: string) => {
    switch (cat) {
      case 'exploitation':
        return { label: 'Exploitation', bg: 'bg-blue-50 text-blue-700 border-blue-100', icon: <Cpu className="w-3.5 h-3.5 text-blue-600" /> };
      case 'urgence':
        return { label: 'Arrêt Urgence', bg: 'bg-red-50 text-red-700 border-red-100', icon: <AlertCircle className="w-3.5 h-3.5 text-red-600" /> };
      case 'maintenance':
        return { label: 'Maintenance', bg: 'bg-amber-50 text-amber-700 border-amber-100', icon: <Wrench className="w-3.5 h-3.5 text-amber-600" /> };
      case 'securite':
        return { label: 'Sécurité / HSE', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: <Shield className="w-3.5 h-3.5 text-emerald-600" /> };
      case 'rh':
        return { label: 'Ressources Humaines', bg: 'bg-purple-50 text-purple-700 border-purple-100', icon: <Users className="w-3.5 h-3.5 text-purple-600" /> };
      case 'magasin':
        return { label: 'Espace Magasin', bg: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: <Archive className="w-3.5 h-3.5 text-indigo-600" /> };
      case 'carburant':
        return { label: 'Carburant', bg: 'bg-orange-50 text-orange-700 border-orange-100', icon: <Fuel className="w-3.5 h-3.5 text-orange-600" /> };
      default:
        return { label: 'Note Générale', bg: 'bg-gray-50 text-gray-700 border-gray-100', icon: <FileText className="w-3.5 h-3.5 text-gray-600" /> };
    }
  };

  const formatDelay = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return `${mins}m ${secs}s`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const getTelemetryStats = (msg: SystemMessage) => {
    const readsVal = msg.reads ? Object.values(msg.reads) : [];
    const totalSent = readsVal.length || 0;
    const totalReads = readsVal.filter(r => !!r.readAt).length;
    const totalReplies = readsVal.filter(r => !!r.response).length;
    
    let sumDelay = 0;
    let countsWithDelay = 0;
    readsVal.forEach(r => {
      if (r.delaySeconds !== undefined) {
        sumDelay += r.delaySeconds;
        countsWithDelay++;
      }
    });
    
    const avgDelay = countsWithDelay > 0 ? Math.round(sumDelay / countsWithDelay) : 0;
    const readRate = totalSent > 0 ? Math.round((totalReads / totalSent) * 100) : 0;
    const replyRate = totalReads > 0 ? Math.round((totalReplies / totalReads) * 100) : 0;

    return {
      totalReads,
      totalReplies,
      avgDelay,
      readRate,
      replyRate
    };
  };

  return (
    <div className="space-y-6 font-sans select-none" id="messages_page_wrapper">
      
      {/* 1. CORPORATE TITLE BANNER (Identical to ExplicationNonRealise & Admin pages) */}
      <div 
        className="bg-white p-6 md:p-8 border border-[#e2e8f0] rounded-[16px] w-full shadow-sm"
        style={{ boxShadow: '0 4px 20px -2px rgba(184, 134, 11, 0.04), 0 1px 3px rgba(0,0,0,0.05)' }}
        id="messages-header-banner"
      >
        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6">
          
          {/* Left Column: Logo */}
          <div className="flex-shrink-0 flex items-center justify-center self-center lg:self-stretch">
            <img 
              src={logoImg} 
              alt="HydroMines Logo" 
              className="h-28 w-28 sm:h-32 sm:w-32 md:h-36 md:w-36 object-contain hover:scale-105 transition-transform duration-300 ease-out select-none" 
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Centered Column: Header Title with Premium Gold Shimmer */}
          <div className="flex-1 flex flex-col justify-center items-center text-center space-y-3.5 max-w-2xl px-2">
            {/* Upper Decorative Gold Line */}
            <div className="subtle-glow-line w-full opacity-80" />
            
            {/* Premium Gold Shimmer Title */}
            <h1 className="gold-title my-1 select-none text-[15px] sm:text-lg md:text-[20px] lg:text-[22px] tracking-[0.06em] whitespace-normal sm:whitespace-nowrap leading-none flex items-center gap-3">
              Directives & Communication Tactique
            </h1>
            
            {/* Lower Decorative Gold Line */}
            <div className="subtle-glow-line w-full opacity-80" />

            {/* Elegant Subtitle */}
            <p 
              className="uppercase tracking-[0.2em] my-1.5 block text-[9px] md:text-[10px] font-extrabold text-slate-500"
              style={{ letterSpacing: '0.2em' }}
            >
              SOCIÉTÉ METALLURGIQUE D'IMITER • Portail Haute Fidélité & Télémétrie SMI
            </p>

            {unreadCount > 0 && (
              <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-xl shadow-xs animate-bounce mt-1">
                🚨 {unreadCount} Directive(s) non lue(s)
              </span>
            )}
          </div>

          {/* Right Column: Compose Button in Harmonized Gold/Gradient */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-3 self-center lg:self-stretch min-h-[100px]">
            {isAdminOrDirection && (
              <button
                onClick={() => {
                  setIsComposeOpen(true);
                  setIsComposeMaximized(false);
                }}
                className="px-5 py-3.5 rounded-xl text-slate-950 font-black text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-1.5 border border-[#b8860b]/30 shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-[#b8860b] to-[#ffd700] hover:from-[#a07409] hover:to-[#e5bf4e]"
                id="btn_compose_directive_shimmer"
              >
                <Zap className="w-4 h-4 text-slate-950 animate-pulse" />
                Diffuser une directive
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. GMAIL-STYLE GALAXY ENGINE (GOD LEVEL INTERFACE) */}
      <div className="bg-[#f6f8fc] rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[720px] grid grid-cols-1 lg:grid-cols-12 items-stretch" id="gmail_style_desktop">
        
        {/* SIDEBAR COL (Span 3) - Folder & Label Nav */}
        <div className="lg:col-span-3 bg-white p-5 border-r border-slate-200 flex flex-col gap-6" id="gmail_sidebar">
          
          {/* Main Compose Button */}
          {isAdminOrDirection && (
            <button
              onClick={() => {
                setIsComposeOpen(true);
                setIsComposeMaximized(false);
              }}
              className="w-full py-4 px-6 bg-[#c2e7ff] hover:bg-[#b3dcfa] text-[#001d35] font-black uppercase text-xs tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3 shadow-sm"
            >
              <Send className="w-4.5 h-4.5 text-[#004a77]" />
              Rédiger une directive
            </button>
          )}

          {/* System Folders */}
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-3 block mb-2">Boîte SMI</span>
            
            <button
              onClick={() => {
                setActiveFolder('inbox');
                setActiveLabelFilter(null);
                setSelectedMessage(null);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-full text-xs font-bold transition-all ${
                activeFolder === 'inbox' && !activeLabelFilter
                  ? 'bg-[#d3e3fd] text-[#041e49] font-black'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Inbox className="w-4.5 h-4.5" />
                <span className="uppercase">📥 Directives Reçues</span>
              </div>
              {unreadCount > 0 && (
                <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-[9px] font-black">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveFolder('sent');
                setActiveLabelFilter(null);
                setSelectedMessage(null);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-full text-xs font-bold transition-all ${
                activeFolder === 'sent' && !activeLabelFilter
                  ? 'bg-[#d3e3fd] text-[#041e49] font-black'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Send className="w-4.5 h-4.5" />
                <span className="uppercase">📤 Envoyées / Registre</span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">
                {sentMessagesCount}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveFolder('archive');
                setActiveLabelFilter(null);
                setSelectedMessage(null);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-full text-xs font-bold transition-all ${
                activeFolder === 'archive' && !activeLabelFilter
                  ? 'bg-[#d3e3fd] text-[#041e49] font-black'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Archive className="w-4.5 h-4.5" />
                <span className="uppercase">📦 Directives Archivées</span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold">
                {archiveMessagesCount}
              </span>
            </button>
          </div>

          <hr className="border-slate-200" />

          {/* Active Yard Indicator */}
          <div className="p-4 bg-gradient-to-br from-[#111111] to-[#222222] text-white rounded-2xl flex flex-col gap-2 shadow-sm border border-slate-800">
            <span className="text-[9px] font-black uppercase text-[#00BFFF] tracking-widest flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Mine Principale SMI
            </span>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Secteur SMI Imiter</h4>
            <p className="text-[10px] text-slate-400">Télémétrie active sur tous les terminaux de SMI.</p>
          </div>
        </div>

        {/* WORKSPACE CONTENT AREA (Span 9) */}
        <div className="lg:col-span-9 flex flex-col bg-[#f6f8fc]" id="gmail_workspace">
          
          {/* Top Gmail Action Toolbar */}
          <div className="px-6 py-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4" id="gmail_toolbar">
            
            {/* Search Input bar */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher des consignes ou messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2 bg-[#f1f3f4] hover:bg-[#e8eaed] focus:bg-white border border-transparent focus:border-[#b8860b] rounded-full text-xs font-bold uppercase placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b8860b]/40 transition-all"
              />
            </div>

            {/* General Actions */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              <button
                onClick={handleRefresh}
                title="Rafraîchir"
                className="p-2.5 text-slate-500 hover:bg-slate-100 rounded-full transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${refreshSpin ? 'animate-spin text-sky-500' : ''}`} />
              </button>

              {activeLabelFilter && (
                <button
                  onClick={() => {
                    setActiveLabelFilter(null);
                    setSelectedMessage(null);
                  }}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 hover:bg-slate-200 uppercase"
                >
                  Effacer filtre : {activeLabelFilter}
                </button>
              )}

              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200">
                SMI Imiter
              </span>
            </div>
          </div>

          {/* MAIN COMMUNICATIONS MULTIPLEXER */}
          <div className="flex-1 p-6" id="gmail_multiplexer">
            
            {/* 1. GMAIL MESSAGE DETAIL VIEW */}
            {selectedMessage ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden animate-fade-in" id="detailed_msg_workspace">
                
                {/* Back bar */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-xs font-black uppercase text-slate-700 rounded-lg transition-all flex items-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" /> Retour
                    </button>
                    {user?.email && (
                      <button
                        onClick={() => handleToggleArchive(selectedMessage)}
                        className={`px-4 py-2 border text-xs font-black uppercase rounded-lg transition-all flex items-center gap-2 ${
                          (selectedMessage.archivedBy || []).includes(user.email)
                            ? 'bg-sky-50 text-[#00BFFF] border-sky-200 hover:bg-sky-100'
                            : 'bg-white text-amber-700 border-slate-200 hover:bg-amber-50 hover:text-amber-800'
                        }`}
                        title={(selectedMessage.archivedBy || []).includes(user.email) ? "Désarchiver" : "Archiver"}
                      >
                        <Archive className="w-4 h-4" />
                        {(selectedMessage.archivedBy || []).includes(user.email) ? 'Désarchiver' : 'Archiver'}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getUrgencyBadge(selectedMessage.urgency)}
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                      Chantier Actif: SMI
                    </span>
                  </div>
                </div>

                {/* Email headers area */}
                <div className="p-6 border-b border-slate-200 flex flex-col gap-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-base uppercase border-2 border-[#00BFFF]">
                        {selectedMessage.senderName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase text-slate-800 flex items-center gap-1.5">
                          {selectedMessage.senderName}
                          <span className="text-[9px] bg-red-800 text-white px-2 py-0.5 rounded font-black tracking-wider uppercase">
                            Direction
                          </span>
                        </h4>
                        <p className="text-[11px] font-bold text-slate-400">{selectedMessage.senderEmail}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-semibold block">
                        Diffusé le {format(selectedMessage.createdAt?.seconds 
                          ? new Date(selectedMessage.createdAt.seconds * 1000) 
                          : new Date(selectedMessage.createdAt), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                      </span>
                    </div>
                  </div>

                  {/* Title & target block */}
                  <div className="p-5 bg-slate-50 border-l-4 border-[#00BFFF] rounded-r-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-sky-100 text-[#00BFFF] border border-sky-200 px-2 py-0.5 rounded">
                        SOCIÉTÉ METALLURGIQUE D'IMITER
                      </span>
                      {selectedMessage.category && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-700 px-2 py-0.5 rounded flex items-center gap-1">
                          {getCategoryDetails(selectedMessage.category).icon}
                          {getCategoryDetails(selectedMessage.category).label}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-extrabold uppercase tracking-tight text-slate-800 mt-2">
                      {selectedMessage.title}
                    </h2>
                    <p className="text-[10px] font-bold uppercase text-slate-400 mt-1">
                      Destinataires : {selectedMessage.targetRole === 'all' ? 'Tous les Responsables' : `Rôle ${selectedMessage.targetRole}`}
                      {selectedMessage.targetUserEmail && ` • Email spécifique : ${selectedMessage.targetUserEmail}`}
                    </p>
                  </div>

                  {/* Body Content */}
                  <div className="leading-relaxed bg-slate-50/50 p-6 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-700 font-semibold whitespace-pre-wrap leading-loose">
                      {selectedMessage.body}
                    </p>
                  </div>
                </div>

                {/* HIGH FIDELITY TELEMETRY REGISTER (ACCUSÉS DE LECTURE & TELEMETRY) */}
                {selectedMessage && (
                  <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col gap-6">
                    
                    {/* Live Telemetry KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="sent_telemetry_kpi">
                      {(() => {
                        const stats = getTelemetryStats(selectedMessage);
                        return (
                          <>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
                              <div>
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Taux d'ouverture</p>
                                <h4 className="text-lg font-black text-[#00BFFF] mt-1">{stats.readRate}%</h4>
                              </div>
                              <TrendingUp className="w-7 h-7 text-[#00BFFF]/20" />
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
                              <div>
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Retours Soumis</p>
                                <h4 className="text-lg font-black text-[#8B0000] mt-1">{stats.totalReplies} / {stats.totalReads}</h4>
                              </div>
                              <CheckCircle2 className="w-7 h-7 text-[#8B0000]/20" />
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
                              <div>
                                <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Temps Réaction Moyen</p>
                                <h4 className="text-lg font-black text-slate-700 mt-1">
                                  {stats.avgDelay > 0 ? formatDelay(stats.avgDelay) : "Immédiat"}
                                </h4>
                              </div>
                              <Clock className="w-7 h-7 text-slate-300" />
                            </div>

                            <div className="bg-[#111111] p-4 rounded-xl flex items-center justify-between text-white shadow-xs">
                              <div>
                                <p className="text-[9px] font-black uppercase text-white/50 tracking-wider">Moteur Télémétrique</p>
                                <h4 className="text-[11px] font-bold uppercase mt-1 flex items-center gap-1.5 text-[#00BFFF]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                  Traceur Actif
                                </h4>
                              </div>
                              <Sparkles className="w-5 h-5 text-[#00BFFF]" />
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                      <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-[#00BFFF]" /> Registre de traçabilité des Responsables de Chantiers
                      </h4>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5">
                        Suivi détaillé en direct des temps de réaction, brouillons annulés et réponses finales soumises par chaque responsable
                      </p>
                    </div>

                    {!selectedMessage.reads || Object.keys(selectedMessage.reads).length === 0 ? (
                      <div className="p-12 text-center bg-white border border-slate-200 rounded-xl">
                        <EyeOff className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold uppercase text-slate-400">Aucun signal ou lecture pour le moment</p>
                        <p className="text-[10px] text-slate-300 mt-1">Les responsables de chantiers n'ont pas encore ouvert ce message sur leur tableau de bord.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.values(selectedMessage.reads).map((receipt: any) => {
                          const hasResponse = !!receipt.response;
                          const hasDeletedDrafts = receipt.deletedDrafts && receipt.deletedDrafts.length > 0;
                          const hasLiveDraft = receipt.lastActiveDraft && receipt.lastActiveDraft.length > 0 && !hasResponse;

                          return (
                            <div key={receipt.userEmail} className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col gap-4 shadow-xs relative overflow-hidden">
                              <div className={`absolute top-0 left-0 w-1.5 h-full ${hasResponse ? 'bg-emerald-500' : 'bg-amber-500'}`} />

                              <div className="flex items-start justify-between gap-2 pl-2">
                                <div>
                                  <h5 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                                    {receipt.userName}
                                    <span className="text-[8px] bg-sky-50 text-[#00BFFF] border border-sky-100 font-bold px-1.5 py-0.5 rounded uppercase">
                                      {receipt.userRole === 'responsible' ? 'Responsable' : receipt.userRole === 'chief' ? 'Chef de Secteur' : 'Encadrant'}
                                    </span>
                                  </h5>
                                  <p className="text-[10px] font-bold uppercase text-slate-400">{receipt.userEmail}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-[9px] font-bold text-slate-400 block uppercase">
                                    Réaction :
                                  </span>
                                  <span className="inline-block px-2 py-0.5 bg-[#00BFFF]/10 text-[#00BFFF] border border-[#00BFFF]/20 font-black rounded text-[9px] uppercase mt-1">
                                    {formatDelay(receipt.delaySeconds)}
                                  </span>
                                </div>
                              </div>

                              {/* Response */}
                              {hasResponse ? (
                                <div className="pl-2 border-l-2 border-emerald-500 bg-emerald-50/40 p-3 rounded-lg">
                                  <p className="text-[10px] font-black uppercase text-emerald-700 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Réponse Technique Soumise :
                                  </p>
                                  <p className="text-xs font-bold text-slate-800 mt-1.5 italic bg-white p-2.5 rounded border border-emerald-100 shadow-xs leading-relaxed">
                                    "{receipt.response}"
                                  </p>
                                </div>
                              ) : hasLiveDraft ? (
                                <div className="pl-2 border-l-2 border-[#00BFFF] bg-[#00BFFF]/5 p-3 rounded-lg animate-pulse">
                                  <p className="text-[10px] font-black uppercase text-[#00BFFF] flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" /> Saisie active (Télémétrie Live) :
                                  </p>
                                  <p className="text-xs font-bold text-slate-700 mt-1.5 italic">
                                    "{receipt.lastActiveDraft}"
                                  </p>
                                </div>
                              ) : (
                                <div className="pl-2 text-xs font-bold uppercase text-amber-600 bg-amber-50/20 p-3 rounded-lg border-l-2 border-amber-400">
                                  Directive lue, sans réponse rédigée pour l'instant
                                </div>
                              )}

                              {/* Metrics */}
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 pl-4 flex flex-col gap-2">
                                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                  <MousePointer className="w-3 h-3 text-[#00BFFF]" /> Télémétrie Clavier & Analyse Éthique
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase text-slate-500">
                                  <div>Frappes clavier : <span className="text-slate-800 font-black">{receipt.totalKeystrokes || 0}</span></div>
                                  <div>Réécritures : <span className="text-slate-800 font-black">{receipt.telemetryUpdates || 0}</span></div>
                                </div>

                                {hasDeletedDrafts && (
                                  <div className="mt-2 pt-2 border-t border-slate-100">
                                    <p className="text-[9px] font-black uppercase tracking-wider text-red-600 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3 animate-bounce" /> Brouillons supprimés du terminal (Mots clés effacés) :
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {receipt.deletedDrafts?.map((d: string, idx: number) => (
                                        <span key={idx} className="bg-red-50 text-[#8B0000] border border-red-100 text-[9px] font-semibold px-2 py-0.5 rounded italic">
                                          "{d}"
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* RECIPIENT VIEW - REPLY FORM (WITH LIVE KEYSTROKE LOGGING) */}
                {activeFolder === 'inbox' && (
                  <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col gap-4">
                    {selectedMessage.reads?.[user?.email?.replace(/\./g, '_') || '']?.response ? (
                      <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-3 shadow-inner">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 animate-bounce" />
                          <h4 className="text-xs font-black uppercase text-emerald-800 tracking-wider">
                            Accusé de réception et réponse technique transmis avec succès à la Direction
                          </h4>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 bg-white p-4 rounded-xl shadow-xs italic border border-emerald-100 leading-relaxed">
                          "{selectedMessage.reads?.[user?.email?.replace(/\./g, '_') || '']?.response}"
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="p-4 bg-sky-50/50 border border-sky-100 rounded-xl flex items-start gap-3">
                          <Shield className="w-5 h-5 text-[#00BFFF] shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-black uppercase text-[#00BFFF] tracking-wider">
                              Protocole de traçabilité SMI actif
                            </h4>
                            <p className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5 leading-relaxed">
                              Votre vitesse d'écriture et vos corrections clavier font l'objet d'un suivi de conformité technique en temps réel par la direction.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 relative">
                          <textarea
                            rows={4}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Saisir votre retour technique ou consignes complémentaires pour le directeur..."
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#b8860b] focus:border-[#b8860b] leading-relaxed shadow-inner"
                          />
                          <div className="absolute bottom-3 right-4 flex items-center gap-1.5 text-[9px] font-black text-red-600 uppercase tracking-widest bg-red-50 border border-red-100 px-2 py-0.5 rounded-md shadow-xs animate-pulse">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                            Saisie active ({keystrokeCount} frappes)
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button
                            onClick={handleSendReply}
                            disabled={replying || !replyText.trim()}
                            className="px-6 py-3.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-md disabled:opacity-40"
                          >
                            {replying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Transmettre la réponse
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              
              /* 2. GMAIL INBOX / SENT LIST VIEW (GRID LIST) */
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" id="gmail_messages_list">
                
                {/* List filters header */}
                <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Affichage de {filteredMessages.length} message(s) technique(s)
                  </span>
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Filter className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase">SMI Imiter</span>
                  </div>
                </div>

                {loading ? (
                  <div className="p-24 flex flex-col items-center justify-center gap-4">
                    <RefreshCw className="w-8 h-8 text-[#b8860b] animate-spin" />
                    <p className="text-xs font-semibold text-slate-500">Chargement des directives en cours...</p>
                  </div>
                ) : filteredMessages.length === 0 ? (
                  <div className="p-24 text-center flex flex-col items-center justify-center gap-4">
                    <Inbox className="w-12 h-12 text-[#b8860b]/40" />
                    <div className="max-w-md mx-auto space-y-1">
                      <p className="text-sm font-bold text-slate-700">Aucune directive ou consigne pour le moment</p>
                      <p className="text-xs text-slate-400">
                        Vous recevrez une notification ici dès qu'un message officiel ou une consigne technique sera diffusé par la direction.
                      </p>
                    </div>
                  </div>
                ) : (
                  
                  /* Gmail List Table style list */
                  <div className="divide-y divide-slate-100">
                    {filteredMessages.map((msg) => {
                      const emailKey = user?.email?.replace(/\./g, '_') || '';
                      const isRead = msg.reads && msg.reads[emailKey];
                      const stats = getTelemetryStats(msg);
                      const catDetails = getCategoryDetails(msg.category);

                      const createdDate = msg.createdAt?.seconds 
                        ? new Date(msg.createdAt.seconds * 1000) 
                        : new Date(msg.createdAt);

                      return (
                        <div
                          key={msg.id}
                          onClick={() => handleSelectMessage(msg)}
                          className={`px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-all ${
                            activeFolder === 'inbox' && !isRead 
                              ? 'bg-[#d3e3fd]/20 border-l-4 border-[#00BFFF]' 
                              : 'border-l-4 border-transparent'
                          }`}
                        >
                          {/* Left: Star / Urgency indicator and Sender */}
                          <div className="flex items-center gap-4 min-w-[200px] max-w-full sm:max-w-[240px] truncate">
                            <div className="shrink-0">
                              {msg.urgency === 'critical' ? (
                                <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
                              ) : (
                                <Star className={`w-4 h-4 ${activeFolder === 'sent' ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
                              )}
                            </div>
                            
                            <span className={`text-xs uppercase truncate ${activeFolder === 'inbox' && !isRead ? 'font-black text-slate-900' : 'font-bold text-slate-600'}`}>
                              {msg.senderName}
                            </span>
                          </div>

                          {/* Middle: Subject with category badges and text excerpt */}
                          <div className="flex-1 min-w-0 flex items-center gap-3">
                            {/* Category Badge */}
                            <span className={`shrink-0 inline-flex items-center gap-1 text-[9px] font-black uppercase border rounded px-1.5 py-0.5 ${catDetails.bg}`}>
                              {catDetails.icon}
                              {catDetails.label}
                            </span>

                            {/* Subject & snippet on one line */}
                            <div className="truncate text-xs">
                              <span className={`uppercase ${activeFolder === 'inbox' && !isRead ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                                {msg.title}
                              </span>
                              <span className="text-slate-400 mx-2">—</span>
                              <span className="text-slate-500 font-semibold italic">{msg.body}</span>
                            </div>
                          </div>

                          {/* Right: Date / Reading telemetry */}
                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto text-right">
                            {getUrgencyBadge(msg.urgency)}

                            <span className="text-[9px] bg-red-800 text-white font-black px-2 py-0.5 rounded flex items-center gap-1">
                              <Eye className="w-3 h-3 text-[#ffd700]" /> {stats.totalReads} Lu(s)
                            </span>

                            {activeFolder === 'inbox' && isRead && (
                              <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-black px-1.5 py-0.5 rounded">
                                LU
                              </span>
                            )}

                            <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap uppercase">
                              {formatDistanceToNow(createdDate, { addSuffix: true, locale: fr })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. GMAIL FLOATING COMPOSE WINDOW (GOD LEVEL POPUP CARD - Bottom Right) */}
      <AnimatePresence>
        {isComposeOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className={`fixed bottom-0 right-4 bg-white border border-slate-300 rounded-t-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 ${
              isComposeMaximized 
                ? 'w-[90vw] md:w-[70vw] h-[85vh]' 
                : 'w-[95vw] sm:w-[500px] h-[600px]'
            }`}
            id="gmail_floating_composer"
          >
            {/* Window header */}
            <div className="px-4 py-3 bg-[#111111] text-white flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-[#00BFFF] flex items-center gap-1.5">
                <Send className="w-4 h-4 animate-bounce" />
                Diffuser une directive SMI
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsComposeMaximized(!isComposeMaximized)}
                  className="p-1 hover:bg-white/10 rounded transition-all text-slate-300 hover:text-white"
                >
                  {isComposeMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsComposeOpen(false)}
                  className="p-1 hover:bg-white/10 rounded transition-all text-slate-300 hover:text-[#EF4444]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Compose content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* Presets Grid */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Modèles de consignes rapides (Cliquez pour remplir) :
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {DIRECTIVE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="px-2 py-1 bg-white hover:bg-sky-50 border border-slate-200 rounded-md text-[9px] font-bold text-slate-600 transition-all flex items-center gap-1"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compose fields Form */}
              <form onSubmit={handleComposeSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Urgence</label>
                    <select
                      value={composeUrgency}
                      onChange={(e: any) => setComposeUrgency(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold uppercase focus:outline-none focus:ring-1 focus:ring-[#b8860b] focus:border-[#b8860b]"
                    >
                      <option value="low">Faible / simple note</option>
                      <option value="medium">Moyenne / Important</option>
                      <option value="critical">Critique / Alerte</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Catégorie</label>
                    <select
                      value={composeCategory}
                      onChange={(e) => setComposeCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold uppercase focus:outline-none focus:ring-1 focus:ring-[#b8860b] focus:border-[#b8860b]"
                    >
                      <option value="exploitation">Exploitation / Travaux</option>
                      <option value="urgence">Arrêt d'Urgence</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="securite">Sécurité / HSE</option>
                      <option value="rh">Ressources Humaines (RH)</option>
                      <option value="magasin">Magasin / Stock</option>
                      <option value="carburant">Carburants & Lubrifiants</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Rôle des Destinataires</label>
                    <select
                      value={composeTargetRole}
                      onChange={(e) => {
                        const newRole = e.target.value;
                        setComposeTargetRole(newRole);
                        setSelectedRecipientId('');
                        setComposeTargetEmail('');
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold uppercase focus:outline-none focus:ring-1 focus:ring-[#b8860b] focus:border-[#b8860b]"
                    >
                      <option value="responsible">Responsable du chantier</option>
                      <option value="secretary">Secrétaire du chantier</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Destinataire Spécifique (Effectif / Inscrit)</label>
                    <select
                      value={selectedRecipientId}
                      onChange={(e) => handleRecipientSelect(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold uppercase focus:outline-none focus:ring-1 focus:ring-[#b8860b] focus:border-[#b8860b]"
                    >
                      <option value="">-- Choisir un destinataire --</option>
                      {getSelectableRecipients().map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} {r.email ? `(${r.email})` : '(Pas d\'email enregistré)'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Email Spécifique (Optionnel / Rempli automatiquement)</label>
                  <input
                    type="email"
                    value={composeTargetEmail}
                    onChange={(e) => setComposeTargetEmail(e.target.value)}
                    placeholder="Ex: responsable.smi@hydromines.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-semibold focus:outline-none focus:ring-1 focus:ring-[#b8860b] focus:border-[#b8860b]"
                  />
                  <p className="text-[9px] text-slate-400 font-semibold italic">
                    Note : Le message sera stocké et consultable sur la plateforme de destination par le rôle sélectionné.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Objet de la directive</label>
                  <input
                    type="text"
                    required
                    value={composeTitle}
                    onChange={(e) => setComposeTitle(e.target.value)}
                    placeholder="Objet de la consigne..."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold uppercase focus:outline-none focus:ring-1 focus:ring-[#b8860b] focus:border-[#b8860b]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Contenu écrit (Strictement textuel)</label>
                  <textarea
                    required
                    rows={isComposeMaximized ? 15 : 8}
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    placeholder="Saisir la consigne détaillée..."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#b8860b] focus:border-[#b8860b] leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsComposeOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase rounded-lg transition-all"
                  >
                    Fermer
                  </button>
                  <button
                    type="submit"
                    disabled={sending}
                    className="px-6 py-2 bg-gradient-to-r from-red-800 to-[#8B0000] text-white text-[10px] font-black uppercase rounded-lg transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {sending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Diffuser
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
