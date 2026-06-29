import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, enableIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

// Enable Firestore offline persistence for subterranean operations (SMI Imiter isolated network)
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore offline persistence failed: Multiple tabs open.');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore offline persistence is not supported by this browser.');
  } else {
    console.warn('Firestore offline persistence error:', err);
  }
});

// Connectivity check
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.warn("Firestore is offline or config is missing.");
    }
  }
}
testConnection();

// Centralized error handling as mandated by Firebase Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export enum NonRealisationCause {
  BARRE_CONIQUE_CASSEE = 'barre_conique_cassee',
  CHANTIER_DANGER = 'chantier_danger',
  TAILLANT_MAUVAIS_ETAT = 'taillant_mauvais_etat',
  ROCHES_DURES = 'roches_dures',
  MANQUE_PERSONNEL = 'manque_personnel',
  PANNE_ENGIN = 'panne_engin',
  CHANTIER_NON_DEBLAYE = 'chantier_non_deblaye',
  PANNE_CHARGEUSE_LHD = 'panne_chargeuse_lhd',
  MANQUE_CONDUCTEUR = 'manque_conducteur',
  VOIE_ENCOMBREE = 'voie_encombree',
  PROBLEME_VENTILATION = 'probleme_ventilation',
  ARRET_CONSIGNATION = 'arret_consignation',
  MANQUE_GASOIL = 'manque_gasoil',
  PANNE_TREUIL = 'panne_treuil',
  PROBLEME_VOIE = 'probleme_voie',
  MANQUE_WAGONS = 'manque_wagons',
  ARRET_ELECTRIQUE = 'arret_electrique',
  MANQUE_EQUIPIERS = 'manque_equipiers',
  BOURRAGE_BURE = 'bourrage_bure',
  PIECE_INDISPONIBLE = 'piece_indisponible',
  DIAGNOSTIC_COMPLEXE = 'diagnostic_complexe',
  ARRET_SECURITE = 'arret_securite',
  MANQUE_PERSONNEL_TECHNIQUE = 'manque_personnel_technique',
  PRIORITE_CHANGEE = 'priorite_changee',
  AUTRE = 'autre'
}
