import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

const MyList = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [list, setList] = useState([]);
  const [customLists, setCustomLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  
  // Set initial tab based on URL query (?tab=custom)
  const initialTab = new URLSearchParams(location.search).get('tab') === 'custom' ? 'CUSTOM' : 'SYNC';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newList, setNewList] = useState({ name: '', description: '', isPublic: true });

  const fetchData = async () => {
    try {
      const [syncRes, customRes] = await Promise.all([
        api.get('/user/list'),
        api.get('/lists/my')
      ]);
      setList(syncRes.data.data);
      setCustomLists(customRes.data.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      // Offline mode
      const localData = localStorage.getItem('localSyncList');
      if (localData) {
        // We only have basic IDs and statuses offline, we need to fetch details for them
        // For simplicity in offline mode without a backend proxy, we might just show basic info
        // But to keep UI consistent, let's fetch from AniList API directly for local data
        const parsed = JSON.parse(localData);
        setList(parsed);
      }
      setLoading(false);
    }
  }, [user]);

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!user) return alert("Please login to create custom lists!");
    try {
      await api.post('/lists', newList);
      setShowCreateModal(false);
      setNewList({ name: '', description: '', isPublic: true });
      fetchData(); // Refresh lists
    } catch (err) {
      console.error("Failed to create list", err);
    }
  };

  const statuses = ['ALL', 'CURRENT', 'PLANNING', 'COMPLETED', 'DROPPED', 'PAUSED', 'REPEATING'];

  const filteredList = filter === 'ALL' 
    ? list 
    : list.filter(item => item.status === filter);

  return (
    <div className="py-10 px-8">
      <div className="flex justify-between items-end mb-8">
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Intelligence Center</h1>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => setActiveTab('SYNC')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'SYNC' ? 'bg-satori-accent text-white shadow-lg shadow-satori-accent/20' : 'text-satori-muted hover:text-white'}`}
          >
            ANI-SYNC
          </button>
          <button 
            onClick={() => {
              if(!user) return alert("Please login to use Custom Lists!");
              setActiveTab('CUSTOM');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'CUSTOM' ? 'bg-satori-accent text-white shadow-lg shadow-satori-accent/20' : 'text-satori-muted hover:text-white'}`}
          >
            CUSTOM LISTS
          </button>
        </div>
      </div>


      {activeTab === 'SYNC' ? (
        <>
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {statuses.map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  filter === s 
                    ? 'bg-satori-accent text-white' 
                    : 'bg-white/5 text-satori-muted hover:bg-white/10'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-white">Loading your journey...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredList.map((item, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.02, 0.4) }}
                  key={item.animeId}
                >
                  <Link 
                    to={`/anime/${item.animeId}`}
                    className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex gap-4 p-4 hover:border-satori-accent/50 transition-all h-full group"
                  >
                    <img 
                      src={item.anime?.coverImage || 'https://via.placeholder.com/100x150'} 
                      alt={item.anime?.title?.romaji}
                      className="w-24 h-36 object-cover rounded-lg shadow-lg group-hover:scale-105 transition-transform"
                    />
                    <div className="flex flex-col justify-between py-1">
                      <div>
                        <h3 className="text-white font-bold leading-tight line-clamp-2 group-hover:text-satori-accent transition-colors">
                          {item.anime?.title?.english || item.anime?.title?.romaji}
                        </h3>
                        <span className="text-xs font-bold text-satori-accent uppercase tracking-widest mt-2 block">
                          {item.status}
                        </span>
                      </div>
                      <div className="text-satori-muted text-sm">
                        Score: <span className="text-white font-mono">{item.score || 'N/A'}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => setShowCreateModal(true)}
            className="h-44 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 text-satori-muted hover:text-white hover:border-satori-accent transition-all bg-white/[0.02]"
          >
            <span className="text-2xl">+</span>
            <span className="text-sm font-bold uppercase tracking-widest">Create New List</span>
          </motion.button>
          
          {customLists.map((list) => (
            <Link to={`/lists/${list._id}`} key={list._id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-satori-accent transition-all cursor-pointer block">
              <h3 className="text-xl font-bold text-white mb-2">{list.name}</h3>
              <p className="text-sm text-satori-muted mb-4 line-clamp-2">{list.description || 'No description provided.'}</p>
              <div className="flex justify-between items-center text-xs">
                <span className="px-2 py-1 bg-white/10 rounded text-white">{list.animeIds?.length || 0} Anime</span>
                <span className="text-satori-muted italic">{list.isPublic ? 'Public' : 'Private'}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create List Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#0a0a0c] border border-white/10 rounded-[2rem] p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-black text-white mb-6 tracking-tighter uppercase">New Collection</h2>
              <form onSubmit={handleCreateList} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-satori-muted uppercase tracking-widest mb-2">Collection Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-satori-accent transition-all"
                    placeholder="e.g. Masterpieces"
                    value={newList.name}
                    onChange={(e) => setNewList({ ...newList, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-satori-muted uppercase tracking-widest mb-2">Description</label>
                  <textarea
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-satori-accent transition-all h-24 resize-none"
                    placeholder="Describe this intelligence set..."
                    value={newList.description}
                    onChange={(e) => setNewList({ ...newList, description: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    className="w-5 h-5 rounded accent-satori-accent"
                    checked={newList.isPublic}
                    onChange={(e) => setNewList({ ...newList, isPublic: e.target.checked })}
                  />
                  <label htmlFor="isPublic" className="text-sm font-bold text-white">Make Publicly Sharable</label>
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 text-sm font-bold text-satori-muted hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-satori-accent text-white rounded-xl font-bold hover:bg-purple-600 transition-all shadow-lg shadow-satori-accent/20"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {!loading && filteredList.length === 0 && (
        <div className="text-center py-20 text-satori-muted">
          No anime found in this category.
        </div>
      )}
    </div>
  );
};

export default MyList;
