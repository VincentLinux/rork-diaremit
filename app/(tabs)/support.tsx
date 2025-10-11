import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Linking, ActivityIndicator } from "react-native";
import { HelpCircle, Mail, Bot, Send } from "lucide-react-native";
import { useTheme } from "@/providers/ThemeProvider";
import { useLanguage } from "@/providers/LanguageProvider";



interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function SupportScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  
  const faqs = [
    { q: t('faqTransferTime'), a: t('faqTransferTimeAnswer') },
    { q: t('faqCountries'), a: t('faqCountriesAnswer') },
    { q: t('faqPaymentMethods'), a: t('faqPaymentMethodsAnswer') },
    { q: t('faqCurrencies'), a: t('faqCurrenciesAnswer') },
    { q: t('faqLimits'), a: t('faqLimitsAnswer') },
  ];
  const [topic, setTopic] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [showFAQ, setShowFAQ] = useState<boolean>(false);
  const [aiMessage, setAiMessage] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  const openEmail = () => {
    const subject = encodeURIComponent(`[DiaRemit] ${topic || "Customer Support"}`);
    const body = encodeURIComponent(message || "Hello support team,");
    const mailto = `mailto:support@ubunturemit.africa?subject=${subject}&body=${body}`;
    Linking.openURL(mailto);
  };

  const sendAiMessage = async () => {
    if (!aiMessage.trim()) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: aiMessage.trim(),
      isUser: true,
      timestamp: new Date(),
    };
    
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setAiMessage("");
    setIsAiThinking(true);
    
    try {
      // Build conversation history for AI context
      const conversationMessages = [
        {
          role: 'system' as const,
          content: `You are a helpful AI assistant for DiaRemit, a money transfer app that helps people send money to Africa. You specialize in:
          
          - Money transfers to Ghana, Kenya, Senegal, and Uganda
          - Exchange rates and fees
          - Payment methods (bank transfer, cards, Apple Pay, PayPal)
          - Transfer times and delivery options
          - Account setup and verification
          - Troubleshooting transfer issues
          - App features and navigation
          
          Keep responses helpful, concise, and friendly. If you don't know something specific about DiaRemit, suggest contacting customer support. Remember the conversation context and refer to previous messages when relevant.`
        },
        // Add all previous conversation messages for context
        ...updatedMessages.map(msg => ({
          role: msg.isUser ? 'user' as const : 'assistant' as const,
          content: msg.text
        }))
      ];
      
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversationMessages
        })
      });
      
      const data = await response.json();
      
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.completion || "I'm sorry, I couldn't process your request. Please try again or contact our support team.",
        isUser: false,
        timestamp: new Date(),
      };
      
      setChatMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.log('AI request error:', error);
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting right now. Please try again later or contact our support team directly.",
        isUser: false,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsAiThinking(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundTertiary }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} testID="supportScreen">
        <Text style={[styles.title, { color: colors.text }]}>{t('customerSupport')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('supportSubtitle')}</Text>

        {/* FAQ Section */}
        <TouchableOpacity 
          style={[styles.faqToggle, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowFAQ(!showFAQ)}
        >
          <View style={styles.faqToggleLeft}>
            <View style={[styles.faqIcon, { backgroundColor: colors.primary + '20' }]}>
              <HelpCircle size={20} color={colors.primary} />
            </View>
            <Text style={[styles.faqToggleText, { color: colors.text }]}>{t('frequentlyAskedQuestions')}</Text>
          </View>
          <Text style={[styles.faqToggleArrow, { color: colors.textSecondary }]}>
            {showFAQ ? '−' : '+'}
          </Text>
        </TouchableOpacity>

        {showFAQ && (
          <View style={[styles.faqSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {faqs.map((faq, faqIndex) => (
              <View key={`faq-${faqIndex}-${faq.q.slice(0, 10)}`} style={[styles.faqItem, { borderBottomColor: colors.borderLight }]}>
                <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.q}</Text>
                <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{faq.a}</Text>
              </View>
            ))}
          </View>
        )}

        {/* AI Assistant Section */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.aiHeader}>
            <View style={styles.aiHeaderLeft}>
              <View style={[styles.aiIcon, { backgroundColor: colors.primary + '20' }]}>
                <Bot size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>{t('aiAssistant')}</Text>
                <Text style={[styles.aiSubtitle, { color: colors.textSecondary }]}>{t('aiAssistantSubtitle')}</Text>
              </View>
            </View>
          </View>
          
          {/* Chat Messages */}
          {chatMessages.length > 0 && (
            <View style={[styles.chatContainer, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <ScrollView style={styles.chatMessages} showsVerticalScrollIndicator={false}>
                {chatMessages.map((msg) => (
                  <View key={msg.id} style={[styles.messageContainer, msg.isUser ? styles.userMessage : styles.aiMessage]}>
                    <View style={[styles.messageBubble, { 
                      backgroundColor: msg.isUser ? colors.primary : colors.card,
                      borderColor: colors.border 
                    }]}>
                      <Text style={[styles.messageText, { color: msg.isUser ? '#fff' : colors.text }]}>
                        {msg.text}
                      </Text>
                    </View>
                  </View>
                ))}
                {isAiThinking && (
                  <View style={[styles.messageContainer, styles.aiMessage]}>
                    <View style={[styles.messageBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={styles.thinkingContainer}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={[styles.thinkingText, { color: colors.textSecondary }]}>{t('aiThinking')}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
          
          {/* AI Input */}
          <View style={styles.aiInputContainer}>
            <TextInput
              value={aiMessage}
              onChangeText={setAiMessage}
              placeholder={t('aiPlaceholder')}
              style={[styles.aiInput, { 
                backgroundColor: colors.backgroundSecondary, 
                borderColor: colors.border, 
                color: colors.text 
              }]}
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={500}
              testID="aiInput"
            />
            <TouchableOpacity 
              onPress={sendAiMessage}
              disabled={!aiMessage.trim() || isAiThinking}
              style={[styles.aiSendButton, { 
                backgroundColor: aiMessage.trim() && !isAiThinking ? colors.primary : colors.border 
              }]}
              testID="aiSendButton"
            >
              <Send size={16} color={aiMessage.trim() && !isAiThinking ? '#fff' : colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact Form */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('contactUs')}</Text>
          
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('topic')}</Text>
          <TextInput 
            value={topic} 
            onChangeText={setTopic} 
            placeholder={t('topicPlaceholder')} 
            style={[styles.input, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text }]} 
            placeholderTextColor={colors.textSecondary} 
            testID="supportTopic" 
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('message')}</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
            style={[styles.input, styles.textarea, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text }]}
            placeholder={t('messagePlaceholder')}
            placeholderTextColor={colors.textSecondary}
            testID="supportMessage"
          />

          <TouchableOpacity onPress={openEmail} style={[styles.btn, { backgroundColor: colors.primary }]} testID="supportEmail">
            <Mail size={16} color="#fff" />
            <Text style={styles.btnText}>{t('sendEmail')}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.meta, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>{t('supportHours')}</Text>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>{t('averageResponseTime')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 20 },
  faqToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  faqToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  faqIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  faqToggleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  faqToggleArrow: {
    fontSize: 20,
    fontWeight: '600',
  },
  faqSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  faqItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 18,
  },
  card: { 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  label: { fontSize: 12, marginTop: 8, marginBottom: 6, fontWeight: '500' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
  textarea: { minHeight: 120, textAlignVertical: "top" },
  btn: { 
    marginTop: 12, 
    alignItems: "center", 
    paddingVertical: 12, 
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  btnAlt: { marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  meta: { 
    marginTop: 8, 
    alignItems: "center", 
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  metaText: { fontSize: 12, marginBottom: 4 },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  aiHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  aiIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  chatContainer: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    maxHeight: 300,
  },
  chatMessages: {
    padding: 12,
  },
  messageContainer: {
    marginBottom: 8,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thinkingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  aiInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  aiInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 14,
  },
  aiSendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});