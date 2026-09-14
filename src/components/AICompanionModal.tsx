import React, { useState } from 'react';
import { Language, ChatMessage } from '../types';
import { sendMessageToAI } from '../services/aiService';

interface AICompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currentLocation?: string;
  initialPrompt?: string;
  onNavigateTab: (tab: any) => void;
}

export const AICompanionModal: React.FC<AICompanionModalProps> = ({
  isOpen,
  onClose,
  language,
  currentLocation = 'Agrabad, Chattogram',
  initialPrompt,
  onNavigateTab,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text:
        language === 'en'
          ? `Hello Maya! I'm SafeNow AI, your localized Chattogram civic disaster companion. I'm actively analyzing ${currentLocation}. Karnaphuli tidal levels are elevated, but GEC & Khulshi ridges remain dry. How can I assist you right now?`
          : `হ্যালো মায়া! আমি সেফনাউ এআই, আপনার চট্টগ্রামের স্থানীয় দুর্যোগ ও নিরাপত্তা সহায়তাকারী। আমি বর্তমানে ${currentLocation} এলাকা পর্যবেক্ষণ করছি। কর্ণফুলী নদীর জোয়ারের পানি বৃদ্ধি পাচ্ছে। আপনাকে কীভাবে সাহায্য করতে পারি?`,
      timestamp: 'Just now',
      suggestions:
        language === 'en'
          ? ['Am I safe right now?', 'Nearest open shelter', 'Flood precautions']
          : ['আমি কি এখন নিরাপদ?', 'নিকটবর্তী খোলা আশ্রয়কেন্দ্র', 'বন্যার পূর্বপ্রস্তুতি'],
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Set prompt if passed
  React.useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (userText: string) => {
    if (!userText.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const aiResponse = await sendMessageToAI(userText, language, currentLocation, messages);
      const aiReply: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiResponse.text,
        timestamp: aiResponse.timestamp || 'Just now',
        suggestions: aiResponse.suggestions || [
          language === 'en' ? 'View Safety Map' : 'নিরাপত্তা ম্যাপ দেখুন',
          language === 'en' ? 'Emergency numbers' : 'জরুরি নম্বরসমূহ',
        ],
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      console.error('Error in handleSend:', err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-on-surface/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full sm:max-w-md h-[88vh] sm:h-[640px] bg-surface-container-lowest rounded-t-[2rem] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-surface-container-high">
        {/* Header */}
        <div className="p-4 bg-surface-container-low border-b border-surface-container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxeH16MBen-XfsFgjPWeMkZ4it3a2k6BAGVYc6CssEVrcHxYEk4fqUpM-V1_-XIAL9tIzrD4B64xEjiNyMnSbSPxIG73KlRpqvYsFk6P1zpfOCs9_eVuV3PArqMmn305JUQRm1PEOuLMpTd4B589_0NIj8Fr_6gG7lBJuAqOfVYGQqaQJCzFcV-I5JaIeOb3yNKEX5T7-RhdPY-F-R3fQSEwupE-uNVaWyZ-LNR9A7-mlfmfe_-42slw"
                alt="SafeNow AI Companion"
                className="w-10 h-10 rounded-2xl object-cover ring-2 ring-primary/20"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary text-[9px] text-on-primary flex items-center justify-center font-bold">
                ✨
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-headline font-bold text-base text-on-surface">SafeNow AI</h3>
                <span className="px-1.5 py-0.2 rounded-full bg-primary-fixed text-on-primary-fixed font-headline text-[10px] font-bold">
                  {language === 'en' ? 'Online' : 'সক্রিয়'}
                </span>
              </div>
              <p className="font-headline text-[11px] text-on-surface-variant">
                {language === 'en' ? 'Civic Safety Guidance' : 'নাগরিক নিরাপত্তা উপদেষ্টা'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-primary text-on-primary rounded-tr-sm'
                    : 'bg-surface-container text-on-surface rounded-tl-sm shadow-xs'
                }`}
              >
                {msg.text}
              </div>
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {msg.suggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (sug.includes('Map') || sug.includes('ম্যাপ')) {
                          onClose();
                          onNavigateTab('safety-map');
                        } else {
                          handleSend(sug);
                        }
                      }}
                      className="text-xs px-2.5 py-1 rounded-full bg-surface-container-high text-primary font-medium hover:bg-primary-fixed hover:text-on-primary-fixed active:scale-95 transition-all"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-surface-container text-secondary text-xs w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              <span>{language === 'en' ? 'SafeNow AI is thinking...' : 'সেফনাউ এআই ভাবছে...'}</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="p-3 bg-surface-container-low border-t border-surface-container flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              language === 'en' ? 'Ask about safety, shelters, water levels...' : 'নিরাপত্তা, আশ্রয় বা পানির স্তর সম্পর্কে জিজ্ঞাসা করুন...'
            }
            className="flex-1 h-11 px-4 rounded-full bg-surface-container-lowest text-on-surface text-sm border border-surface-container-highest focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center disabled:opacity-40 active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
