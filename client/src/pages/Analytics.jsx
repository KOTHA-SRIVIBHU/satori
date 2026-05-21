import { useState, useEffect } from 'react';
import { getAnalytics } from '../services/api';
import { 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, PieChart as PieIcon, Loader2 } from 'lucide-react';

const COLORS = ['#2193b0', '#6dd5ed', '#00d2ff', '#3a7bd5', '#004e92', '#11998e', '#38ef7d', '#ff4b2b', '#ff416c', '#a445b2'];

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await getAnalytics();
        if (response.success) {
          setData(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <Loader2 className="animate-spin text-satori-accent" size={48} />
        <p className="text-sm font-black uppercase tracking-widest text-white/40 animate-pulse">Aggregating Global Trends...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 border-b border-white/[0.05] pb-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="text-satori-accent" size={28} />
            <h1 className="text-4xl font-black tracking-tighter">Global <span className="text-satori-accent">Analytics</span></h1>
          </div>
          <p className="text-satori-muted text-lg max-w-2xl font-medium leading-relaxed">
            Macro-intelligence report based on current Satori Knowledge Base.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Chart 1: Genre Distribution */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-satori-accent/10 rounded-lg text-satori-accent">
                <PieIcon size={20} />
              </div>
              <h2 className="text-xl font-bold tracking-tight">Genre Distribution</h2>
            </div>
            
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.genrePopularity}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="_id"
                  >
                    {data?.genrePopularity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0d0d12', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Chart 2: Score Trends over Decades */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                <TrendingUp size={20} />
              </div>
              <h2 className="text-xl font-bold tracking-tight">Average Score Trends</h2>
            </div>
            
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.scoreTrends}>
                  <defs>
                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2193b0" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2193b0" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="decade" 
                    stroke="rgba(255,255,255,0.4)" 
                    fontSize={10} 
                    fontWeight="bold" 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    stroke="rgba(255,255,255,0.4)" 
                    fontSize={10} 
                    fontWeight="bold" 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0d0d12', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="avgScore" 
                    stroke="#2193b0" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorAvg)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-6 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] text-center">
              Historical Score Evolution (Decade Average)
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
