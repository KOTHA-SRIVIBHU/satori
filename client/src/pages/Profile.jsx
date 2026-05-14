import { useState, useContext } from 'react';
import api from '../services/api';
import { RefreshCw, CheckCircle2, AlertCircle, User as UserIcon } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [anilistUser, setAnilistUser] = useState("");
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [message, setMessage] = useState("");

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-white p-8">
        <p className="text-xl mb-6">Please login to access your profile.</p>
        <button 
          onClick={() => navigate('/login')}
          className="px-6 py-3 bg-satori-accent text-white rounded-xl font-bold hover:bg-purple-600 transition-all"
        >
          Go to Login
        </button>
      </div>
    );
  }

  const handleSync = async (e) => {
    e.preventDefault();
    if (!anilistUser) return;

    setStatus("loading");
    try {
      const { data } = await api.post('/user/sync-anilist', {
        anilistUsername: anilistUser
      });

      setStatus("success");
      setMessage(`Successfully synced ${data.count} anime from your AniList!`);
    } catch (err) {
      setStatus("error");
      setMessage(err.response?.data?.message || "Sync failed. Make sure your AniList profile is public.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 mt-10">
      <div className="bg-satori-card rounded-3xl border border-white/5 p-10 text-center">
        <div className="inline-block p-4 bg-satori-accent/10 rounded-full text-satori-accent mb-6">
          <UserIcon size={48} />
        </div>
        <h1 className="text-4xl font-bold mb-2">{user.username}</h1>
        <p className="text-satori-muted mb-10">{user.email}</p>

        <div className="max-w-md mx-auto bg-satori-dark/50 p-8 rounded-2xl border border-white/5 text-left">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <RefreshCw size={20} className="text-satori-accent" /> AniList Sync
          </h2>
          <p className="text-sm text-satori-muted mb-6">
            Enter your AniList username to import your watched history, scores, and status.
          </p>

          <form onSubmit={handleSync} className="space-y-4">
            <input
              type="text"
              placeholder="AniList Username"
              className="w-full bg-satori-card border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-satori-accent transition-all text-white"
              value={anilistUser}
              onChange={(e) => setAnilistUser(e.target.value)}
            />
            <button
              disabled={status === "loading"}
              className="w-full bg-satori-accent hover:bg-satori-accent/80 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {status === "loading" ? <RefreshCw className="animate-spin" size={20} /> : "Start Intelligence Sync"}
            </button>
          </form>

          {status === "success" && (
            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl flex items-center gap-3">
              <CheckCircle2 size={20} /> <span className="text-sm font-medium">{message}</span>
            </div>
          )}

          {status === "error" && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3">
              <AlertCircle size={20} /> <span className="text-sm font-medium">{message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
