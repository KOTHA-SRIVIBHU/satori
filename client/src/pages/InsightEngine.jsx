import { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Loader2, MessageSquare, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const QUICK_ACTIONS = [
  { label: '🎯 What should I watch next?', message: 'What should I watch next based on my taste?' },
  { label: '🌑 Something dark & psychological', message: 'Recommend something dark and psychological' },
  { label: '🔍 Analyze my taste', message: 'Analyze my anime taste and tell me what patterns you see' },
  { label: '💎 Find me a hidden gem', message: 'Find me a hidden gem anime that most people haven\'t seen' },
  { label: '⚔️ Something like Attack on Titan', message: 'Recommend something similar to Attack on Titan' },
  { label: '🎭 Best of this season', message: 'What are the best anime airing this season that match my taste?' },
];

const TypingIndicator = () => (
  <div className="flex gap-4">
    <div className="w-10 h-10 rounded-xl bg-[#0a0a0c] border border-white/10 text-satori-accent flex items-center justify-center shrink-0 shadow-lg">
      <Bot size={20} />
    </div>
    <div className="bg-[#0a0a0c]/80 border border-white/10 rounded-2xl rounded-tl-sm px-6 py-4 flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block w-2 h-2 rounded-full bg-satori-accent"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <span className="text-xs font-bold text-satori-muted uppercase tracking-widest ml-1">
        Satori is thinking
      </span>
    </div>
  </div>
);

const MARKDOWN_COMPONENTS = {
  p: ({ node, ...props }) => <p className="mb-4 last:mb-0 leading-relaxed" {...props} />,
  ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-1.5" {...props} />,
  ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-1.5" {...props} />,
  li: ({ node, ...props }) => <li className="text-gray-300 leading-relaxed" {...props} />,
  h1: ({ node, ...props }) => <h1 className="text-2xl font-black text-white mb-4 mt-6 first:mt-0" {...props} />,
  h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-white mb-3 mt-5 first:mt-0" {...props} />,
  h3: ({ node, ...props }) => <h3 className="text-lg font-bold text-white mb-2 mt-4 first:mt-0" {...props} />,
  a: ({ node, ...props }) => <a className="text-satori-accent hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
  strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
  em: ({ node, ...props }) => <em className="text-satori-accent/80 italic" {...props} />,
  blockquote: ({ node, ...props }) => (
    <blockquote
      className="border-l-2 border-satori-accent/40 pl-4 py-1 my-4 text-gray-400 italic bg-white/[0.02] rounded-r-lg"
      {...props}
    />
  ),
  code: ({ node, inline, className, children, ...props }) => {
    if (inline) {
      return (
        <code
          className="bg-white/10 text-satori-accent px-1.5 py-0.5 rounded text-[0.85em] font-mono"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <div className="my-4 rounded-xl overflow-hidden border border-white/10 bg-[#0d0d10]">
        <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/5">
          <span className="text-[10px] font-bold text-satori-muted uppercase tracking-widest">Code</span>
        </div>
        <pre className="p-4 overflow-x-auto">
          <code className="text-sm font-mono text-gray-300 leading-relaxed" {...props}>
            {children}
          </code>
        </pre>
      </div>
    );
  },
  hr: ({ node, ...props }) => <hr className="border-white/10 my-6" {...props} />,
};

const WELCOME_MESSAGE = `Welcome to the **Satori Insight Engine** — your personal AI anime analyst.

I have access to your complete watch history, taste DNA, score patterns, and curated collections. I don't just recommend anime — I understand *why* you love what you love.

Ask me anything — from personalized recommendations to deep taste analysis.`;

const InsightEngine = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: WELCOME_MESSAGE }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const MAX_CHARS = 500;

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessage = async (messageText) => {
    if (!messageText.trim() || isLoading) return;

    setHasInteracted(true);
    const userQuery = messageText.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', content: userQuery }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Send only the most recent conversation history to save API tokens and avoid context limits
      // We will keep the last 6 messages (3 user turns, 3 assistant turns)
      let chatHistory = newMessages.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        content: m.content
      }));

      if (chatHistory.length > 6) {
        chatHistory = chatHistory.slice(-6);
      }

      const response = await api.post('/rag/chat', { messages: chatHistory });
      if (response.data && response.data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: response.data.answer }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Connection to Satori Core failed. Please try again.' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'I encountered an anomaly in the data stream. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickAction = (message) => {
    sendMessage(message);
  };

  const charCount = input.length;
  const isNearLimit = charCount > MAX_CHARS * 0.85;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pt-24 pb-12 px-4 max-w-4xl mx-auto flex flex-col"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl font-black tracking-tighter uppercase flex items-center justify-center gap-3"
        >
          <Sparkles className="text-satori-accent" size={32} />
          GenAI Insight Engine
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-satori-muted text-sm mt-2 font-bold tracking-widest uppercase"
        >
          Powered by Llama 3.3 (70B) & Neural RAG
        </motion.p>
      </div>

      {/* Chat Container */}
      <div className="flex-1 bg-white/[0.02] border border-white/10 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-b from-satori-accent/5 to-transparent pointer-events-none" />

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar relative z-10">
          {messages.map((msg, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              key={idx}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                msg.role === 'user'
                  ? 'bg-satori-accent text-white'
                  : 'bg-[#0a0a0c] border border-white/10 text-satori-accent'
              }`}>
                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={`max-w-[80%] rounded-2xl p-5 ${
                msg.role === 'user'
                  ? 'bg-satori-accent/10 border border-satori-accent/20 text-white rounded-tr-sm'
                  : 'bg-[#0a0a0c]/80 border border-white/10 text-gray-300 rounded-tl-sm'
              }`}>
                <div className="text-sm leading-relaxed">
                  <ReactMarkdown components={MARKDOWN_COMPONENTS}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Quick Action Chips — show only before first user interaction */}
          <AnimatePresence>
            {!hasInteracted && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="flex flex-wrap gap-2 justify-center pt-2 pb-4"
              >
                {QUICK_ACTIONS.map((action, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.07 }}
                    onClick={() => handleQuickAction(action.message)}
                    className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-white/[0.04] border border-white/10 text-gray-300 hover:bg-satori-accent/10 hover:border-satori-accent/30 hover:text-white transition-all duration-200 cursor-pointer whitespace-nowrap"
                  >
                    {action.label}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Typing Indicator */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <TypingIndicator />
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#050507] border-t border-white/10 relative z-10">
          <form onSubmit={handleSend} className="relative group">
            <input
              ref={inputRef}
              type="text"
              value={input}
              maxLength={MAX_CHARS}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Satori for a recommendation..."
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-4 pl-6 pr-24 focus:outline-none focus:border-satori-accent/50 focus:shadow-[0_0_20px_rgba(var(--accent-rgb,139,92,246),0.08)] transition-all duration-300 placeholder:text-white/20"
            />
            {/* Character count */}
            <span className={`absolute right-16 top-1/2 -translate-y-1/2 text-[10px] font-mono tracking-wide transition-colors ${
              isNearLimit ? 'text-amber-400/70' : 'text-white/15'
            }`}>
              {charCount > 0 ? `${charCount}/${MAX_CHARS}` : ''}
            </span>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-2 bottom-2 aspect-square bg-satori-accent text-white rounded-lg flex items-center justify-center hover:bg-satori-accent/80 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </form>
          <div className="flex items-center justify-center gap-2 mt-2.5">
            <Zap size={10} className="text-satori-muted" />
            <span className="text-[10px] text-satori-muted font-medium tracking-wider uppercase">
              Llama 3.3 70B · RAG-Augmented · DNA-Personalized
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InsightEngine;
