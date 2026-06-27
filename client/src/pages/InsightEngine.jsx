import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../services/api';

const InsightEngine = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'I am Satori, your personal Anime Intelligence Engine. I have access to your complete watch history and your DNA markers. Ask me for a highly personalized recommendation, or inquire about anything in the anime universe.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuery = input.trim();
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
        setMessages(prev => [...prev, { role: 'assistant', content: 'Connection to Satori Core failed.' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'I encountered an anomaly in the data stream. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pt-24 pb-12 px-4 max-w-4xl mx-auto flex flex-col"
    >
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black tracking-tighter uppercase flex items-center justify-center gap-3">
          <Sparkles className="text-satori-accent" size={32} />
          GenAI Insight Engine
        </h1>
        <p className="text-satori-muted text-sm mt-2 font-bold tracking-widest uppercase">
          Powered by Gemini 1.5 & Neural RAG
        </p>
      </div>

      <div className="flex-1 bg-white/[0.02] border border-white/10 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-b from-satori-accent/5 to-transparent pointer-events-none" />
        
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar relative z-10">
          {messages.map((msg, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
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
                  <ReactMarkdown
                    components={{
                      p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="text-gray-300" {...props} />,
                      h1: ({node, ...props}) => <h1 className="text-2xl font-black text-white mb-4 mt-6" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-xl font-bold text-white mb-3 mt-5" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-lg font-bold text-white mb-2 mt-4" {...props} />,
                      a: ({node, ...props}) => <a className="text-satori-accent hover:underline" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#0a0a0c] border border-white/10 text-satori-accent flex items-center justify-center shrink-0">
                <Bot size={20} />
              </div>
              <div className="bg-[#0a0a0c]/80 border border-white/10 rounded-2xl rounded-tl-sm p-5 flex items-center gap-3">
                <Loader2 className="animate-spin text-satori-accent" size={16} />
                <span className="text-xs font-bold text-satori-muted uppercase tracking-widest">Satori is analyzing your DNA...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[#050507] border-t border-white/10 relative z-10">
          <form onSubmit={handleSend} className="relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Satori for a recommendation..."
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl py-4 pl-6 pr-16 focus:outline-none focus:border-satori-accent/50 transition-colors placeholder:text-white/20"
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-2 bottom-2 aspect-square bg-satori-accent text-white rounded-lg flex items-center justify-center hover:bg-satori-accent/80 transition-colors disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default InsightEngine;
