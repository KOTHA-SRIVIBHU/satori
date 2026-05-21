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
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, PieChart as PieIcon, Loader2, Award, Sparkles, Building2, Calendar } from 'lucide-react';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#6366f1'];

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
        <div className="relative">
          <Loader2 className="animate-spin text-satori-accent" size={64} />
          <div className="absolute inset-0 bg-satori-accent/20 blur-2xl rounded-full" />
        </div>
        <p className="text-sm font-black uppercase tracking-widest text-white/40 animate-pulse">Running Neural Aggregations...</p>
      </div>
    );
  }

  // Pick top 5 genres for the historical chart to avoid clutter
  const topGenres = data?.genrePopularity?.slice(0, 5).map(g => g.genre) || [];

  return (
    <div className="min-h-screen pt-24 pb-20 px-8 bg-[#050507]">
      <div className="max-w-7xl mx-auto">
        <header className="mb-16 border-b border-white/[0.05] pb-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-satori-accent/20 rounded-xl">
                <BarChart3 className="text-satori-accent" size={24} />
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-white">Neural <span className="text-satori-accent">Insights</span></h1>
            </div>
            <p className="text-satori-muted text-lg max-w-2xl font-medium leading-relaxed">
              Macro-level intelligence derived from 1,000 top-tier anime and 71 ML dimensions.
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white/[0.03] border border-white/10 rounded-[1.5rem] p-6 min-w-[160px] backdrop-blur-xl shadow-2xl">
              <p className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] mb-2">Knowledge Base</p>
              <p className="text-3xl font-black text-white">1,000</p>
            </div>
            <div className="bg-satori-accent/5 border border-satori-accent/20 rounded-[1.5rem] p-6 min-w-[160px] backdrop-blur-xl shadow-2xl">
              <p className="text-[10px] font-black uppercase text-satori-accent/50 tracking-[0.2em] mb-2">ML Vectors</p>
              <p className="text-3xl font-black text-satori-accent">71D</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Quality Leaders (Studios) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-8 bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
              <Building2 size={120} />
            </div>
            
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                  <Award size={20} />
                </div>
                <h2 className="text-xl font-black tracking-tight uppercase">Studio Quality Leaders</h2>
              </div>
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Avg. Score (Min. 10 Works)</span>
            </div>

            <div className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.studioQuality} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" domain={[7, 9.5]} hide />
                  <YAxis dataKey="studio" type="category" width={140} stroke="rgba(255,255,255,0.5)" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{ backgroundColor: '#0d0d12', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '12px' }}
                    itemStyle={{ color: '#8b5cf6', fontSize: '12px', fontWeight: 'bold' }}
                    formatter={(value) => [`${value}/10`, 'Avg Score']}
                  />
                  <Bar dataKey="avgScore" fill="#8b5cf6" radius={[0, 12, 12, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Genre Quality Spectrum (Radar) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-4 bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-10">
              <div className="p-2 bg-satori-accent/10 rounded-lg text-satori-accent">
                <Sparkles size={20} />
              </div>
              <h2 className="text-xl font-black tracking-tight uppercase">Genre Quality</h2>
            </div>
            <div className="h-[500px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={120} data={data?.genreQuality}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="genre" stroke="rgba(255,255,255,0.4)" fontSize={9} fontWeight="bold" />
                  <Radar name="Avg Score" dataKey="avgScore" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0d0d12', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    formatter={(value) => [`${value}/10`, 'Avg Score']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Historical Genre Trends (Multi-Line Chart) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-12 bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                  <Calendar size={20} />
                </div>
                <h2 className="text-xl font-black tracking-tight uppercase">Yearly Genre Evolution</h2>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Year-by-Year Average Scores</span>
                <span className="text-[9px] font-medium text-satori-accent uppercase tracking-tighter">Top 5 Dominant Genres</span>
              </div>
            </div>
            
            <div className="h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.historicalTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="year" stroke="rgba(255,255,255,0.4)" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} />
                  <YAxis domain={[6, 9]} stroke="rgba(255,255,255,0.4)" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0d0d12', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                    itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                    formatter={(value, name) => {
                       if (name.includes('_count')) return [value, 'Anime Count'];
                       return [`${value}/10`, name];
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }} />
                  {topGenres.map((genre, idx) => (
                    <Line 
                      key={genre} 
                      type="monotone" 
                      dataKey={genre} 
                      stroke={COLORS[idx % COLORS.length]} 
                      strokeWidth={3} 
                      dot={{ r: 4, strokeWidth: 2, fill: '#0d0d12' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default Analytics;
