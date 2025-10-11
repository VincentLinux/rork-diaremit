import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

export type Language = 'en' | 'sv' | 'fr' | 'no' | 'dk';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
  isLoaded: boolean;
}

const translations = {
  en: {
    // Navigation
    home: 'Home',
    historyTab: 'History',
    recipients: 'Recipients',
    market: 'Market',
    support: 'Support',
    profile: 'Profile',
    
    // Welcome Screen
    welcome: 'Welcome to DiaRemit',
    welcomeSubtitle: 'Send money to Africa with the best rates and fastest delivery',
    getStarted: 'Get Started',
    takeTour: 'Take a Tour',
    
    // Language Selection
    selectLanguage: 'Select Language',
    chooseLanguage: 'Choose your preferred language',
    continue: 'Continue',
    
    // Home Screen
    sendMoney: 'Send Money',
    sendMoneyNow: 'Send Money Now',
    addRecipient: 'Add Recipient',
    todaysRates: 'Today\'s Rates',
    aiPoweredRates: 'AI-Powered Rates',
    compare: 'Compare',
    quickActions: 'Quick Actions',
    send: 'Send',
    history: 'History',
    scheduled: 'Scheduled',
    recentTransfers: 'Recent Transfers',
    seeAll: 'See all',
    aiMarketInsight: 'AI Market Insight',
    viewDetails: 'View Details',
    
    // Send Money Screen
    selectRecipient: 'Select Recipient',
    chooseRecipientDesc: 'Choose who you want to send money to',
    enterAmount: 'Enter Amount',
    howMuchSend: 'How much do you want to send?',
    youSend: 'You send',
    theyReceive: 'They receive',
    exchangeRate: 'Exchange rate',
    transferFee: 'Transfer fee',
    totalToPay: 'Total to pay',
    choosePaymentMethod: 'Choose Payment Method',
    howToSendMoney: 'How would you like to send money?',
    bankTransfer: 'Bank Transfer',
    applePay: 'Apple Pay',
    paypal: 'PayPal',
    debitCard: 'Debit Card',
    directToBank: 'Direct to bank account',
    quickSecurePayments: 'Quick & secure payments',
    paypalAccountTransfer: 'PayPal account transfer',
    instantTransferCard: 'Instant transfer to card',
    withinMinutes: 'Within minutes',
    businessDays: '1-2 business days',
    schedulePayment: 'Schedule this payment',
    selectTransferDate: 'Select transfer date:',
    reviewConfirm: 'Review & Confirm',
    reviewTransferDetails: 'Please review your transfer details',
    recipient: 'Recipient',
    country: 'Country',
    amountToSend: 'Amount to send',
    paymentMethod: 'Payment method',
    scheduledDate: 'Scheduled date',
    total: 'Total',
    confirmTransfer: 'Confirm Transfer',
    back: 'Back',
    
    // Add Recipient Screen
    personalInformation: 'Personal Information',
    fullName: 'Full Name',
    enterFullName: 'Enter recipient\'s full name',
    phoneNumber: 'Phone Number',
    enterPhoneNumber: 'Enter phone number',
    emailAddress: 'Email Address',
    enterEmailOptional: 'Enter email address (optional)',
    bankInformation: 'Bank Information (Optional)',
    bankName: 'Bank Name',
    enterBankName: 'Enter bank name',
    accountNumber: 'Account Number',
    enterAccountNumber: 'Enter account number',
    cancel: 'Cancel',
    saveRecipient: 'Save Recipient',
    
    faq: 'FAQ',
    contactSupport: 'Contact Support',
    
    // Profile
    account: 'Account',
    personalInfo: 'Personal Information',
    paymentMethods: 'Payment Methods',
    languageRegion: 'Language & Region',
    securitySettings: 'Security Settings',
    pushNotifications: 'Push Notifications',
    biometricLogin: 'Biometric Login',
    darkMode: 'Dark Mode',
    legal: 'Legal',
    termsConditions: 'Terms & Conditions',
    privacyPolicy: 'Privacy Policy',
    logOut: 'Log Out',
    transfers: 'Transfers',
    rating: 'Rating',
    version: 'Version',
    
    // FAQ
    faqTransferTime: 'How long do transfers take?',
    faqTransferTimeAnswer: 'Most bank transfers arrive within 1-2 business days. Mobile wallet payouts are often instant.',
    faqCountries: 'What countries can I send to?',
    faqCountriesAnswer: 'Ghana, Kenya, Senegal, Uganda with more coming soon.',
    faqPaymentMethods: 'What payment methods are supported?',
    faqPaymentMethodsAnswer: 'Cards and bank transfer. Mobile money payout is supported where available.',
    faqCurrencies: 'What currencies can I send from?',
    faqCurrenciesAnswer: 'USD, EUR and Nordic currencies (SEK, NOK, DKK) plus GBP.',
    faqLimits: 'Are there transfer limits?',
    faqLimitsAnswer: 'Yes. Limits vary by region and verification level.',
    
    // Market Screen
    exchangeRates: 'Exchange Rates',
    liveRatesUpdated: 'Live rates updated every minute',
    betterRates: 'Better rates',
    aiPowered: 'AI Powered',
    sendFrom: 'Send from',
    aiMarketAnalysis: 'AI Market Analysis',
    bestRate: 'Best Rate',
    confidence: 'Confidence',
    sources: 'Sources',
    whenYouSend: 'When you send',
    vs: 'VS',
    competitors: 'Competitors',
    comparedWith: 'Compared with',
    ratesIndicative: 'Rates are indicative and may vary. Competitor rates are estimates based on publicly available information.',
    scheduleTransfer: 'Schedule Transfer',
    scheduleTransferConfirm: 'Schedule a transfer using the rate',
    transferScheduledSuccess: 'Transfer scheduled successfully!',
    
    // History Screen
    all: 'All',
    sent: 'Sent',
    received: 'Received',
    fee: 'Fee',
    
    // Recipients Screen
    searchRecipients: 'Search recipients...',
    addNewRecipient: 'Add New Recipient',
    noRecipientsFound: 'No recipients found',
    addFirstRecipient: 'Add your first recipient',
    
    // Support Screen
    customerSupport: 'Customer Support',
    supportSubtitle: 'We\'re here to help. Reach out anytime.',
    frequentlyAskedQuestions: 'Frequently Asked Questions',
    aiAssistant: 'AI Assistant',
    aiAssistantSubtitle: 'Get instant help with your DiaRemit questions',
    askAiAssistant: 'Ask AI Assistant',
    aiPlaceholder: 'Ask me anything about DiaRemit...',
    sendMessage: 'Send Message',
    aiThinking: 'AI is thinking...',
    contactUs: 'Contact Us',
    topic: 'Topic',
    topicPlaceholder: 'e.g., Payment issue',
    message: 'Message',
    messagePlaceholder: 'Describe your issue...',
    sendEmail: 'Send Email',
    supportHours: 'Support hours: 08:00 - 20:00 UTC',
    averageResponseTime: 'Average response time: under 2 hours',
    
    // Common
    error: 'Error',
    success: 'Success',
    ok: 'OK',
    yes: 'Yes',
    no: 'No',
    loading: 'Loading...',
    completed: 'Completed',
    pending: 'Pending',
    failed: 'Failed',
    delete: 'Delete',
    deleteAccount: 'Delete Account',
    deleteAccountConfirm: 'Are you sure you want to permanently delete your account? This action cannot be undone and will remove all your data.',
    deleteAccountWarning: 'This will permanently delete your account and all associated data. This action cannot be undone.',
    deleting: 'Deleting...',
    security: 'Security',
  },
  sv: {
    // Navigation
    home: 'Hem',
    historyTab: 'Historik',
    recipients: 'Mottagare',
    market: 'Marknad',
    support: 'Support',
    profile: 'Profil',
    
    // Welcome Screen
    welcome: 'Välkommen till DiaRemit',
    welcomeSubtitle: 'Skicka pengar till Afrika med bäst kurser och snabbaste leverans',
    getStarted: 'Kom igång',
    takeTour: 'Ta en rundtur',
    
    // Language Selection
    selectLanguage: 'Välj språk',
    chooseLanguage: 'Välj ditt föredragna språk',
    continue: 'Fortsätt',
    
    // Home Screen
    sendMoney: 'Skicka pengar',
    sendMoneyNow: 'Skicka pengar nu',
    addRecipient: 'Lägg till mottagare',
    todaysRates: 'Dagens kurser',
    aiPoweredRates: 'AI-drivna kurser',
    compare: 'Jämför',
    quickActions: 'Snabbåtgärder',
    send: 'Skicka',
    history: 'Historik',
    scheduled: 'Schemalagd',
    recentTransfers: 'Senaste överföringar',
    seeAll: 'Se alla',
    aiMarketInsight: 'AI-marknadsinsikt',
    viewDetails: 'Visa detaljer',
    
    // Send Money Screen
    selectRecipient: 'Välj mottagare',
    chooseRecipientDesc: 'Välj vem du vill skicka pengar till',
    enterAmount: 'Ange belopp',
    howMuchSend: 'Hur mycket vill du skicka?',
    youSend: 'Du skickar',
    theyReceive: 'De får',
    exchangeRate: 'Växelkurs',
    transferFee: 'Överföringsavgift',
    totalToPay: 'Totalt att betala',
    choosePaymentMethod: 'Välj betalningsmetod',
    howToSendMoney: 'Hur vill du skicka pengar?',
    bankTransfer: 'Banköverföring',
    applePay: 'Apple Pay',
    paypal: 'PayPal',
    debitCard: 'Betalkort',
    directToBank: 'Direkt till bankkonto',
    quickSecurePayments: 'Snabba och säkra betalningar',
    paypalAccountTransfer: 'PayPal-kontoöverföring',
    instantTransferCard: 'Omedelbar överföring till kort',
    withinMinutes: 'Inom minuter',
    businessDays: '1-2 arbetsdagar',
    schedulePayment: 'Schemalägg denna betalning',
    selectTransferDate: 'Välj överföringsdatum:',
    reviewConfirm: 'Granska och bekräfta',
    reviewTransferDetails: 'Vänligen granska dina överföringsdetaljer',
    recipient: 'Mottagare',
    country: 'Land',
    amountToSend: 'Belopp att skicka',
    paymentMethod: 'Betalningsmetod',
    scheduledDate: 'Schemalagt datum',
    total: 'Totalt',
    confirmTransfer: 'Bekräfta överföring',
    back: 'Tillbaka',
    
    // Add Recipient Screen
    personalInformation: 'Personlig information',
    fullName: 'Fullständigt namn',
    enterFullName: 'Ange mottagarens fullständiga namn',
    phoneNumber: 'Telefonnummer',
    enterPhoneNumber: 'Ange telefonnummer',
    emailAddress: 'E-postadress',
    enterEmailOptional: 'Ange e-postadress (valfritt)',
    bankInformation: 'Bankinformation (valfritt)',
    bankName: 'Banknamn',
    enterBankName: 'Ange banknamn',
    accountNumber: 'Kontonummer',
    enterAccountNumber: 'Ange kontonummer',
    cancel: 'Avbryt',
    saveRecipient: 'Spara mottagare',
    
    faq: 'FAQ',
    contactSupport: 'Kontakta support',
    
    // Profile
    account: 'Konto',
    personalInfo: 'Personlig information',
    paymentMethods: 'Betalningsmetoder',
    languageRegion: 'Språk och region',
    securitySettings: 'Säkerhetsinställningar',
    pushNotifications: 'Push-notifikationer',
    biometricLogin: 'Biometrisk inloggning',
    darkMode: 'Mörkt läge',
    legal: 'Juridiskt',
    termsConditions: 'Villkor',
    privacyPolicy: 'Integritetspolicy',
    logOut: 'Logga ut',
    transfers: 'Överföringar',
    rating: 'Betyg',
    version: 'Version',
    
    // FAQ
    faqTransferTime: 'Hur lång tid tar överföringar?',
    faqTransferTimeAnswer: 'De flesta banköverföringar anländer inom 1-2 arbetsdagar. Mobilplånboksutbetalningar är ofta omedelbara.',
    faqCountries: 'Vilka länder kan jag skicka till?',
    faqCountriesAnswer: 'Ghana, Kenya, Senegal, Uganda med fler som kommer snart.',
    faqPaymentMethods: 'Vilka betalningsmetoder stöds?',
    faqPaymentMethodsAnswer: 'Kort och banköverföring. Mobile money-utbetalning stöds där det finns tillgängligt.',
    faqCurrencies: 'Vilka valutor kan jag skicka från?',
    faqCurrenciesAnswer: 'USD, EUR och nordiska valutor (SEK, NOK, DKK) plus GBP.',
    faqLimits: 'Finns det överföringsgränser?',
    faqLimitsAnswer: 'Ja. Gränserna varierar beroende på region och verifieringsnivå.',
    
    // Market Screen
    exchangeRates: 'Växelkurser',
    liveRatesUpdated: 'Livekurser uppdateras varje minut',
    betterRates: 'Bättre kurser',
    aiPowered: 'AI-driven',
    sendFrom: 'Skicka från',
    aiMarketAnalysis: 'AI-marknadsanalys',
    bestRate: 'Bästa kurs',
    confidence: 'Förtroende',
    sources: 'Källor',
    whenYouSend: 'När du skickar',
    vs: 'VS',
    competitors: 'Konkurrenter',
    comparedWith: 'Jämfört med',
    ratesIndicative: 'Kurserna är vägledande och kan variera. Konkurrentkurser är uppskattningar baserade på offentligt tillgänglig information.',
    scheduleTransfer: 'Schemalägg överföring',
    scheduleTransferConfirm: 'Schemalägg en överföring med kursen',
    transferScheduledSuccess: 'Överföring schemalagd framgångsrikt!',
    
    // History Screen
    all: 'Alla',
    sent: 'Skickade',
    received: 'Mottagna',
    fee: 'Avgift',
    
    // Recipients Screen
    searchRecipients: 'Sök mottagare...',
    addNewRecipient: 'Lägg till ny mottagare',
    noRecipientsFound: 'Inga mottagare hittades',
    addFirstRecipient: 'Lägg till din första mottagare',
    
    // Support Screen
    customerSupport: 'Kundsupport',
    supportSubtitle: 'Vi är här för att hjälpa. Kontakta oss när som helst.',
    frequentlyAskedQuestions: 'Vanliga frågor',
    aiAssistant: 'AI-assistent',
    aiAssistantSubtitle: 'Få omedelbar hjälp med dina DiaRemit-frågor',
    askAiAssistant: 'Fråga AI-assistenten',
    aiPlaceholder: 'Fråga mig vad som helst om DiaRemit...',
    sendMessage: 'Skicka meddelande',
    aiThinking: 'AI tänker...',
    contactUs: 'Kontakta oss',
    topic: 'Ämne',
    topicPlaceholder: 't.ex., Betalningsproblem',
    message: 'Meddelande',
    messagePlaceholder: 'Beskriv ditt problem...',
    sendEmail: 'Skicka e-post',
    supportHours: 'Supporttider: 08:00 - 20:00 UTC',
    averageResponseTime: 'Genomsnittlig svarstid: under 2 timmar',
    
    // Common
    error: 'Fel',
    success: 'Framgång',
    ok: 'OK',
    yes: 'Ja',
    no: 'Nej',
    loading: 'Laddar...',
    completed: 'Slutförd',
    pending: 'Väntande',
    failed: 'Misslyckades',
    delete: 'Ta bort',
    deleteAccount: 'Ta bort konto',
    deleteAccountConfirm: 'Är du säker på att du vill ta bort ditt konto permanent? Denna åtgärd kan inte ångras och kommer att ta bort all din data.',
    deleteAccountWarning: 'Detta kommer permanent ta bort ditt konto och all associerad data. Denna åtgärd kan inte ångras.',
    deleting: 'Tar bort...',
    security: 'Säkerhet',
  },
  fr: {
    // Navigation
    home: 'Accueil',
    historyTab: 'Historique',
    recipients: 'Destinataires',
    market: 'Marché',
    support: 'Support',
    profile: 'Profil',
    
    // Welcome Screen
    welcome: 'Bienvenue chez DiaRemit',
    welcomeSubtitle: 'Envoyez de l\'argent en Afrique avec les meilleurs taux et la livraison la plus rapide',
    getStarted: 'Commencer',
    takeTour: 'Faire le tour',
    
    // Language Selection
    selectLanguage: 'Sélectionner la langue',
    chooseLanguage: 'Choisissez votre langue préférée',
    continue: 'Continuer',
    
    // Home Screen
    sendMoney: 'Envoyer de l\'argent',
    sendMoneyNow: 'Envoyer de l\'argent maintenant',
    addRecipient: 'Ajouter un destinataire',
    todaysRates: 'Taux d\'aujourd\'hui',
    aiPoweredRates: 'Taux alimentés par IA',
    compare: 'Comparer',
    quickActions: 'Actions rapides',
    send: 'Envoyer',
    history: 'Historique',
    scheduled: 'Programmé',
    recentTransfers: 'Transferts récents',
    seeAll: 'Voir tout',
    aiMarketInsight: 'Aperçu du marché IA',
    viewDetails: 'Voir les détails',
    
    // Send Money Screen
    selectRecipient: 'Sélectionner le destinataire',
    chooseRecipientDesc: 'Choisissez à qui vous voulez envoyer de l\'argent',
    enterAmount: 'Entrer le montant',
    howMuchSend: 'Combien voulez-vous envoyer?',
    youSend: 'Vous envoyez',
    theyReceive: 'Ils reçoivent',
    exchangeRate: 'Taux de change',
    transferFee: 'Frais de transfert',
    totalToPay: 'Total à payer',
    choosePaymentMethod: 'Choisir la méthode de paiement',
    howToSendMoney: 'Comment voulez-vous envoyer de l\'argent?',
    bankTransfer: 'Virement bancaire',
    applePay: 'Apple Pay',
    paypal: 'PayPal',
    debitCard: 'Carte de débit',
    directToBank: 'Direct vers le compte bancaire',
    quickSecurePayments: 'Paiements rapides et sécurisés',
    paypalAccountTransfer: 'Transfert de compte PayPal',
    instantTransferCard: 'Transfert instantané vers la carte',
    withinMinutes: 'En quelques minutes',
    businessDays: '1-2 jours ouvrables',
    schedulePayment: 'Programmer ce paiement',
    selectTransferDate: 'Sélectionner la date de transfert:',
    reviewConfirm: 'Réviser et confirmer',
    reviewTransferDetails: 'Veuillez réviser les détails de votre transfert',
    recipient: 'Destinataire',
    country: 'Pays',
    amountToSend: 'Montant à envoyer',
    paymentMethod: 'Méthode de paiement',
    scheduledDate: 'Date programmée',
    total: 'Total',
    confirmTransfer: 'Confirmer le transfert',
    back: 'Retour',
    
    // Add Recipient Screen
    personalInformation: 'Informations personnelles',
    fullName: 'Nom complet',
    enterFullName: 'Entrez le nom complet du destinataire',
    phoneNumber: 'Numéro de téléphone',
    enterPhoneNumber: 'Entrez le numéro de téléphone',
    emailAddress: 'Adresse e-mail',
    enterEmailOptional: 'Entrez l\'adresse e-mail (optionnel)',
    bankInformation: 'Informations bancaires (optionnel)',
    bankName: 'Nom de la banque',
    enterBankName: 'Entrez le nom de la banque',
    accountNumber: 'Numéro de compte',
    enterAccountNumber: 'Entrez le numéro de compte',
    cancel: 'Annuler',
    saveRecipient: 'Enregistrer le destinataire',
    
    faq: 'FAQ',
    contactSupport: 'Contacter le support',
    
    // Profile
    account: 'Compte',
    personalInfo: 'Informations personnelles',
    paymentMethods: 'Méthodes de paiement',
    languageRegion: 'Langue et région',
    securitySettings: 'Paramètres de sécurité',
    pushNotifications: 'Notifications push',
    biometricLogin: 'Connexion biométrique',
    darkMode: 'Mode sombre',
    legal: 'Légal',
    termsConditions: 'Termes et conditions',
    privacyPolicy: 'Politique de confidentialité',
    logOut: 'Se déconnecter',
    transfers: 'Transferts',
    rating: 'Évaluation',
    version: 'Version',
    
    // FAQ
    faqTransferTime: 'Combien de temps prennent les transferts?',
    faqTransferTimeAnswer: 'La plupart des virements bancaires arrivent dans les 1-2 jours ouvrables. Les paiements de portefeuille mobile sont souvent instantanés.',
    faqCountries: 'Dans quels pays puis-je envoyer?',
    faqCountriesAnswer: 'Ghana, Kenya, Sénégal, Ouganda avec plus à venir bientôt.',
    faqPaymentMethods: 'Quels modes de paiement sont supportés?',
    faqPaymentMethodsAnswer: 'Cartes et virement bancaire. Le paiement mobile money est supporté là où disponible.',
    faqCurrencies: 'De quelles devises puis-je envoyer?',
    faqCurrenciesAnswer: 'USD, EUR et devises nordiques (SEK, NOK, DKK) plus GBP.',
    faqLimits: 'Y a-t-il des limites de transfert?',
    faqLimitsAnswer: 'Oui. Les limites varient selon la région et le niveau de vérification.',
    
    // Market Screen
    exchangeRates: 'Taux de change',
    liveRatesUpdated: 'Taux en direct mis à jour chaque minute',
    betterRates: 'Meilleurs taux',
    aiPowered: 'Alimenté par IA',
    sendFrom: 'Envoyer de',
    aiMarketAnalysis: 'Analyse de marché IA',
    bestRate: 'Meilleur taux',
    confidence: 'Confiance',
    sources: 'Sources',
    whenYouSend: 'Quand vous envoyez',
    vs: 'VS',
    competitors: 'Concurrents',
    comparedWith: 'Comparé avec',
    ratesIndicative: 'Les taux sont indicatifs et peuvent varier. Les taux des concurrents sont des estimations basées sur des informations publiquement disponibles.',
    scheduleTransfer: 'Programmer le transfert',
    scheduleTransferConfirm: 'Programmer un transfert en utilisant le taux',
    transferScheduledSuccess: 'Transfert programmé avec succès!',
    
    // History Screen
    all: 'Tous',
    sent: 'Envoyés',
    received: 'Reçus',
    fee: 'Frais',
    
    // Recipients Screen
    searchRecipients: 'Rechercher des destinataires...',
    addNewRecipient: 'Ajouter un nouveau destinataire',
    noRecipientsFound: 'Aucun destinataire trouvé',
    addFirstRecipient: 'Ajoutez votre premier destinataire',
    
    // Support Screen
    customerSupport: 'Support client',
    supportSubtitle: 'Nous sommes là pour vous aider. Contactez-nous à tout moment.',
    frequentlyAskedQuestions: 'Questions fréquemment posées',
    aiAssistant: 'Assistant IA',
    aiAssistantSubtitle: 'Obtenez une aide instantanée avec vos questions DiaRemit',
    askAiAssistant: 'Demander à l\'assistant IA',
    aiPlaceholder: 'Demandez-moi tout sur DiaRemit...',
    sendMessage: 'Envoyer le message',
    aiThinking: 'L\'IA réfléchit...',
    contactUs: 'Nous contacter',
    topic: 'Sujet',
    topicPlaceholder: 'par ex., Problème de paiement',
    message: 'Message',
    messagePlaceholder: 'Décrivez votre problème...',
    sendEmail: 'Envoyer un e-mail',
    supportHours: 'Heures de support: 08:00 - 20:00 UTC',
    averageResponseTime: 'Temps de réponse moyen: moins de 2 heures',
    
    // Common
    error: 'Erreur',
    success: 'Succès',
    ok: 'OK',
    yes: 'Oui',
    no: 'Non',
    loading: 'Chargement...',
    completed: 'Terminé',
    pending: 'En attente',
    failed: 'Échoué',
    delete: 'Supprimer',
    deleteAccount: 'Supprimer le compte',
    deleteAccountConfirm: 'Êtes-vous sûr de vouloir supprimer définitivement votre compte? Cette action ne peut pas être annulée et supprimera toutes vos données.',
    deleteAccountWarning: 'Cela supprimera définitivement votre compte et toutes les données associées. Cette action ne peut pas être annulée.',
    deleting: 'Suppression...',
    security: 'Sécurité',
  },
  no: {
    // Navigation
    home: 'Hjem',
    historyTab: 'Historikk',
    recipients: 'Mottakere',
    market: 'Marked',
    support: 'Støtte',
    profile: 'Profil',
    
    // Welcome Screen
    welcome: 'Velkommen til DiaRemit',
    welcomeSubtitle: 'Send penger til Afrika med beste kurser og raskeste levering',
    getStarted: 'Kom i gang',
    takeTour: 'Ta en omvisning',
    
    // Language Selection
    selectLanguage: 'Velg språk',
    chooseLanguage: 'Velg ditt foretrukne språk',
    continue: 'Fortsett',
    
    // Home Screen
    sendMoney: 'Send penger',
    sendMoneyNow: 'Send penger nå',
    addRecipient: 'Legg til mottaker',
    todaysRates: 'Dagens kurser',
    aiPoweredRates: 'AI-drevne kurser',
    compare: 'Sammenlign',
    quickActions: 'Hurtighandlinger',
    send: 'Send',
    history: 'Historikk',
    scheduled: 'Planlagt',
    recentTransfers: 'Nylige overføringer',
    seeAll: 'Se alle',
    aiMarketInsight: 'AI-markedsinnsikt',
    viewDetails: 'Vis detaljer',
    
    // Send Money Screen
    selectRecipient: 'Velg mottaker',
    chooseRecipientDesc: 'Velg hvem du vil sende penger til',
    enterAmount: 'Angi beløp',
    howMuchSend: 'Hvor mye vil du sende?',
    youSend: 'Du sender',
    theyReceive: 'De mottar',
    exchangeRate: 'Vekslingskurs',
    transferFee: 'Overføringsgebyr',
    totalToPay: 'Totalt å betale',
    choosePaymentMethod: 'Velg betalingsmetode',
    howToSendMoney: 'Hvordan vil du sende penger?',
    bankTransfer: 'Bankoverføring',
    applePay: 'Apple Pay',
    paypal: 'PayPal',
    debitCard: 'Debetkort',
    directToBank: 'Direkte til bankkonto',
    quickSecurePayments: 'Raske og sikre betalinger',
    paypalAccountTransfer: 'PayPal-kontooverføring',
    instantTransferCard: 'Øyeblikkelig overføring til kort',
    withinMinutes: 'Innen minutter',
    businessDays: '1-2 virkedager',
    schedulePayment: 'Planlegg denne betalingen',
    selectTransferDate: 'Velg overføringsdato:',
    reviewConfirm: 'Gjennomgå og bekreft',
    reviewTransferDetails: 'Vennligst gjennomgå overføringsdetaljene dine',
    recipient: 'Mottaker',
    country: 'Land',
    amountToSend: 'Beløp å sende',
    paymentMethod: 'Betalingsmetode',
    scheduledDate: 'Planlagt dato',
    total: 'Totalt',
    confirmTransfer: 'Bekreft overføring',
    back: 'Tilbake',
    
    // Add Recipient Screen
    personalInformation: 'Personlig informasjon',
    fullName: 'Fullt navn',
    enterFullName: 'Angi mottakerens fulle navn',
    phoneNumber: 'Telefonnummer',
    enterPhoneNumber: 'Angi telefonnummer',
    emailAddress: 'E-postadresse',
    enterEmailOptional: 'Angi e-postadresse (valgfritt)',
    bankInformation: 'Bankinformasjon (valgfritt)',
    bankName: 'Banknavn',
    enterBankName: 'Angi banknavn',
    accountNumber: 'Kontonummer',
    enterAccountNumber: 'Angi kontonummer',
    cancel: 'Avbryt',
    saveRecipient: 'Lagre mottaker',
    
    faq: 'FAQ',
    contactSupport: 'Kontakt støtte',
    
    // Profile
    account: 'Konto',
    personalInfo: 'Personlig informasjon',
    paymentMethods: 'Betalingsmetoder',
    languageRegion: 'Språk og region',
    securitySettings: 'Sikkerhetsinnstillinger',
    pushNotifications: 'Push-varsler',
    biometricLogin: 'Biometrisk pålogging',
    darkMode: 'Mørk modus',
    legal: 'Juridisk',
    termsConditions: 'Vilkår og betingelser',
    privacyPolicy: 'Personvernpolicy',
    logOut: 'Logg ut',
    transfers: 'Overføringer',
    rating: 'Vurdering',
    version: 'Versjon',
    
    // FAQ
    faqTransferTime: 'Hvor lang tid tar overføringer?',
    faqTransferTimeAnswer: 'De fleste bankoverføringer ankommer innen 1-2 virkedager. Mobilplånbokutbetalinger er ofte øyeblikkelige.',
    faqCountries: 'Hvilke land kan jeg sende til?',
    faqCountriesAnswer: 'Ghana, Kenya, Senegal, Uganda med flere som kommer snart.',
    faqPaymentMethods: 'Hvilke betalingsmetoder støttes?',
    faqPaymentMethodsAnswer: 'Kort og bankoverføring. Mobile money-utbetaling støttes der det er tilgjengelig.',
    faqCurrencies: 'Hvilke valutaer kan jeg sende fra?',
    faqCurrenciesAnswer: 'USD, EUR og nordiske valutaer (SEK, NOK, DKK) pluss GBP.',
    faqLimits: 'Er det overføringsgrenser?',
    faqLimitsAnswer: 'Ja. Grensene varierer etter region og verifiseringsnivå.',
    
    // Market Screen
    exchangeRates: 'Vekslingskurser',
    liveRatesUpdated: 'Live kurser oppdatert hvert minutt',
    betterRates: 'Bedre kurser',
    aiPowered: 'AI-drevet',
    sendFrom: 'Send fra',
    aiMarketAnalysis: 'AI-markedsanalyse',
    bestRate: 'Beste kurs',
    confidence: 'Tillit',
    sources: 'Kilder',
    whenYouSend: 'Når du sender',
    vs: 'VS',
    competitors: 'Konkurrenter',
    comparedWith: 'Sammenlignet med',
    ratesIndicative: 'Kursene er veiledende og kan variere. Konkurrentkurser er estimater basert på offentlig tilgjengelig informasjon.',
    scheduleTransfer: 'Planlegg overføring',
    scheduleTransferConfirm: 'Planlegg en overføring med kursen',
    transferScheduledSuccess: 'Overføring planlagt vellykket!',
    
    // History Screen
    all: 'Alle',
    sent: 'Sendt',
    received: 'Mottatt',
    fee: 'Gebyr',
    
    // Recipients Screen
    searchRecipients: 'Søk mottakere...',
    addNewRecipient: 'Legg til ny mottaker',
    noRecipientsFound: 'Ingen mottakere funnet',
    addFirstRecipient: 'Legg til din første mottaker',
    
    // Support Screen
    customerSupport: 'Kundestøtte',
    supportSubtitle: 'Vi er her for å hjelpe. Ta kontakt når som helst.',
    frequentlyAskedQuestions: 'Ofte stilte spørsmål',
    aiAssistant: 'AI-assistent',
    aiAssistantSubtitle: 'Få øyeblikkelig hjelp med dine DiaRemit-spørsmål',
    askAiAssistant: 'Spør AI-assistenten',
    aiPlaceholder: 'Spør meg hva som helst om DiaRemit...',
    sendMessage: 'Send melding',
    aiThinking: 'AI tenker...',
    contactUs: 'Kontakt oss',
    topic: 'Emne',
    topicPlaceholder: 'f.eks., Betalingsproblem',
    message: 'Melding',
    messagePlaceholder: 'Beskriv problemet ditt...',
    sendEmail: 'Send e-post',
    supportHours: 'Støttetider: 08:00 - 20:00 UTC',
    averageResponseTime: 'Gjennomsnittlig responstid: under 2 timer',
    
    // Common
    error: 'Feil',
    success: 'Suksess',
    ok: 'OK',
    yes: 'Ja',
    no: 'Nei',
    loading: 'Laster...',
    completed: 'Fullført',
    pending: 'Venter',
    failed: 'Mislyktes',
    delete: 'Slett',
    deleteAccount: 'Slett konto',
    deleteAccountConfirm: 'Er du sikker på at du vil slette kontoen din permanent? Denne handlingen kan ikke angres og vil fjerne all din data.',
    deleteAccountWarning: 'Dette vil permanent slette kontoen din og all tilknyttet data. Denne handlingen kan ikke angres.',
    deleting: 'Sletter...',
    security: 'Sikkerhet',
  },
  dk: {
    // Navigation
    home: 'Hjem',
    historyTab: 'Historik',
    recipients: 'Modtagere',
    market: 'Marked',
    support: 'Support',
    profile: 'Profil',
    
    // Welcome Screen
    welcome: 'Velkommen til DiaRemit',
    welcomeSubtitle: 'Send penge til Afrika med de bedste kurser og hurtigste levering',
    getStarted: 'Kom i gang',
    takeTour: 'Tag en rundtur',
    
    // Language Selection
    selectLanguage: 'Vælg sprog',
    chooseLanguage: 'Vælg dit foretrukne sprog',
    continue: 'Fortsæt',
    
    // Home Screen
    sendMoney: 'Send penge',
    sendMoneyNow: 'Send penge nu',
    addRecipient: 'Tilføj modtager',
    todaysRates: 'Dagens kurser',
    aiPoweredRates: 'AI-drevne kurser',
    compare: 'Sammenlign',
    quickActions: 'Hurtige handlinger',
    send: 'Send',
    history: 'Historik',
    scheduled: 'Planlagt',
    recentTransfers: 'Seneste overførsler',
    seeAll: 'Se alle',
    aiMarketInsight: 'AI-markedsindsigt',
    viewDetails: 'Vis detaljer',
    
    // Send Money Screen
    selectRecipient: 'Vælg modtager',
    chooseRecipientDesc: 'Vælg hvem du vil sende penge til',
    enterAmount: 'Indtast beløb',
    howMuchSend: 'Hvor meget vil du sende?',
    youSend: 'Du sender',
    theyReceive: 'De modtager',
    exchangeRate: 'Vekselkurs',
    transferFee: 'Overførselsgebyr',
    totalToPay: 'I alt at betale',
    choosePaymentMethod: 'Vælg betalingsmetode',
    howToSendMoney: 'Hvordan vil du sende penge?',
    bankTransfer: 'Bankoverførsel',
    applePay: 'Apple Pay',
    paypal: 'PayPal',
    debitCard: 'Debetkort',
    directToBank: 'Direkte til bankkonto',
    quickSecurePayments: 'Hurtige og sikre betalinger',
    paypalAccountTransfer: 'PayPal-kontooverførsel',
    instantTransferCard: 'Øjeblikkelig overførsel til kort',
    withinMinutes: 'Inden for minutter',
    businessDays: '1-2 arbejdsdage',
    schedulePayment: 'Planlæg denne betaling',
    selectTransferDate: 'Vælg overførselsdato:',
    reviewConfirm: 'Gennemgå og bekræft',
    reviewTransferDetails: 'Gennemgå venligst dine overførselsdetaljer',
    recipient: 'Modtager',
    country: 'Land',
    amountToSend: 'Beløb at sende',
    paymentMethod: 'Betalingsmetode',
    scheduledDate: 'Planlagt dato',
    total: 'I alt',
    confirmTransfer: 'Bekræft overførsel',
    back: 'Tilbage',
    
    // Add Recipient Screen
    personalInformation: 'Personlige oplysninger',
    fullName: 'Fulde navn',
    enterFullName: 'Indtast modtagerens fulde navn',
    phoneNumber: 'Telefonnummer',
    enterPhoneNumber: 'Indtast telefonnummer',
    emailAddress: 'E-mailadresse',
    enterEmailOptional: 'Indtast e-mailadresse (valgfrit)',
    bankInformation: 'Bankoplysninger (valgfrit)',
    bankName: 'Banknavn',
    enterBankName: 'Indtast banknavn',
    accountNumber: 'Kontonummer',
    enterAccountNumber: 'Indtast kontonummer',
    cancel: 'Annuller',
    saveRecipient: 'Gem modtager',
    
    faq: 'FAQ',
    contactSupport: 'Kontakt support',
    
    // Profile
    account: 'Konto',
    personalInfo: 'Personlige oplysninger',
    paymentMethods: 'Betalingsmetoder',
    languageRegion: 'Sprog og region',
    securitySettings: 'Sikkerhedsindstillinger',
    pushNotifications: 'Push-notifikationer',
    biometricLogin: 'Biometrisk login',
    darkMode: 'Mørk tilstand',
    legal: 'Juridisk',
    termsConditions: 'Vilkår og betingelser',
    privacyPolicy: 'Privatlivspolitik',
    logOut: 'Log ud',
    transfers: 'Overførsler',
    rating: 'Vurdering',
    version: 'Version',
    
    // FAQ
    faqTransferTime: 'Hvor lang tid tager overførsler?',
    faqTransferTimeAnswer: 'De fleste bankoverførsler ankommer inden for 1-2 arbejdsdage. Mobilpungeudbetalinger er ofte øjeblikkelige.',
    faqCountries: 'Hvilke lande kan jeg sende til?',
    faqCountriesAnswer: 'Ghana, Kenya, Senegal, Uganda med flere kommer snart.',
    faqPaymentMethods: 'Hvilke betalingsmetoder understøttes?',
    faqPaymentMethodsAnswer: 'Kort og bankoverførsel. Mobile money-udbetaling understøttes hvor tilgængeligt.',
    faqCurrencies: 'Hvilke valutaer kan jeg sende fra?',
    faqCurrenciesAnswer: 'USD, EUR og nordiske valutaer (SEK, NOK, DKK) plus GBP.',
    faqLimits: 'Er der overførselsgrænser?',
    faqLimitsAnswer: 'Ja. Grænserne varierer efter region og verifikationsniveau.',
    
    // Market Screen
    exchangeRates: 'Vekselkurser',
    liveRatesUpdated: 'Live kurser opdateret hvert minut',
    betterRates: 'Bedre kurser',
    aiPowered: 'AI-drevet',
    sendFrom: 'Send fra',
    aiMarketAnalysis: 'AI-markedsanalyse',
    bestRate: 'Bedste kurs',
    confidence: 'Tillid',
    sources: 'Kilder',
    whenYouSend: 'Når du sender',
    vs: 'VS',
    competitors: 'Konkurrenter',
    comparedWith: 'Sammenlignet med',
    ratesIndicative: 'Kurserne er vejledende og kan variere. Konkurrentkurser er estimater baseret på offentligt tilgængelig information.',
    scheduleTransfer: 'Planlæg overførsel',
    scheduleTransferConfirm: 'Planlæg en overførsel med kursen',
    transferScheduledSuccess: 'Overførsel planlagt med succes!',
    
    // History Screen
    all: 'Alle',
    sent: 'Sendt',
    received: 'Modtaget',
    fee: 'Gebyr',
    
    // Recipients Screen
    searchRecipients: 'Søg modtagere...',
    addNewRecipient: 'Tilføj ny modtager',
    noRecipientsFound: 'Ingen modtagere fundet',
    addFirstRecipient: 'Tilføj din første modtager',
    
    // Support Screen
    customerSupport: 'Kundesupport',
    supportSubtitle: 'Vi er her for at hjælpe. Kontakt os når som helst.',
    frequentlyAskedQuestions: 'Ofte stillede spørgsmål',
    aiAssistant: 'AI-assistent',
    aiAssistantSubtitle: 'Få øjeblikkelig hjælp med dine DiaRemit-spørgsmål',
    askAiAssistant: 'Spørg AI-assistenten',
    aiPlaceholder: 'Spørg mig om hvad som helst om DiaRemit...',
    sendMessage: 'Send besked',
    aiThinking: 'AI tænker...',
    contactUs: 'Kontakt os',
    topic: 'Emne',
    topicPlaceholder: 'f.eks., Betalingsproblem',
    message: 'Besked',
    messagePlaceholder: 'Beskriv dit problem...',
    sendEmail: 'Send e-mail',
    supportHours: 'Supporttider: 08:00 - 20:00 UTC',
    averageResponseTime: 'Gennemsnitlig svartid: under 2 timer',
    
    // Common
    error: 'Fejl',
    success: 'Succes',
    ok: 'OK',
    yes: 'Ja',
    no: 'Nej',
    loading: 'Indlæser...',
    completed: 'Fuldført',
    pending: 'Afventer',
    failed: 'Mislykkedes',
    delete: 'Slet',
    deleteAccount: 'Slet konto',
    deleteAccountConfirm: 'Er du sikker på, at du vil slette din konto permanent? Denne handling kan ikke fortrydes og vil fjerne alle dine data.',
    deleteAccountWarning: 'Dette vil permanent slette din konto og alle tilknyttede data. Denne handling kan ikke fortrydes.',
    deleting: 'Sletter...',
    security: 'Sikkerhed',
  },

};

export const [LanguageProvider, useLanguage] = createContextHook<LanguageContextType>(() => {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  const setLanguage = useCallback(async (newLanguage: Language) => {
    if (!newLanguage || !['en', 'sv', 'fr', 'no', 'dk'].includes(newLanguage)) {
      console.log('Invalid language provided:', newLanguage);
      return;
    }
    setLanguageState(newLanguage);
    try {
      await AsyncStorage.setItem('language', newLanguage);
    } catch (error) {
      console.log('Error saving language:', error);
    }
  }, []);

  const t = useCallback((key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  }, [language]);

  // Delay mounting to avoid useInsertionEffect warnings
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('language');
        if (savedLanguage && ['en', 'sv', 'fr', 'no', 'dk'].includes(savedLanguage)) {
          setLanguageState(savedLanguage as Language);
        }
      } catch (error) {
        console.log('Error loading language:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadLanguage();
  }, [mounted]);

  return {
    language,
    setLanguage,
    t,
    isLoaded,
  };
});