'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Home() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [trades, setTrades] = useState([]);
  const [form, setForm] = useState({ symbol: '', type: 'BUY', entry: '', exit: '', qty: '1', notes: '' });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchTrades(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchTrades(session.user.id);
      else setTrades([]);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchTrades = async () => {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setTrades(data);
  };

  const handleAuth = async (type) => {
    setLoading(true);
    const { error } = type === 'LOGIN' 
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) alert(error.message);
    else if (type === 'SIGNUP') alert('Check your email for confirmation!');
    setLoading(false);
  };

  const handleLogout = () => supabase.auth.signOut();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.symbol || !form.entry || !form.exit) return;

    const entry = parseFloat(form.entry);
    const exit = parseFloat(form.exit);
    const qty = parseFloat(form.qty) || 1;
    const pnl = form.type === 'BUY' ? (exit - entry) * qty : (entry - exit) * qty;

    const { error } = await supabase.from('trades').insert([
      {
        user_id: session.user.id,
        symbol: form.symbol.toUpperCase(),
        type: form.type,
        entry,
        exit,
        pnl,
        notes: form.notes
      }
    ]);

    if (error) alert(error.message);
    else {
      setForm({ symbol: '', type: 'BUY', entry: '', exit: '', qty: '1', notes: '' });
      fetchTrades();
    }
  };

  const deleteTrade = async (id) => {
    const { error } = await supabase.from('trades').delete().eq('id', id);
    if (!error) fetchTrades();
  };

  const totalPnL = trades.reduce((acc, t) => acc + Number(t.pnl), 0);
  const winTrades = trades.filter(t => Number(t.pnl) > 0).length;
  const winRate = trades.length > 0 ? ((winTrades / trades.length) * 100).toFixed(1) : 0;

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white p-4">
        <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-blue-400">Trading Journal Login</h2>
          <input 
            type="email" placeholder="Email" value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full bg-slate-700 p-3 rounded mb-4 border border-slate-600 focus:outline-none text-white"
          />
          <input 
            type="password" placeholder="Password" value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full bg-slate-700 p-3 rounded mb-6 border border-slate-600 focus:outline-none text-white"
          />
          <div className="flex gap-4">
            <button 
              onClick={() => handleAuth('LOGIN')} disabled={loading}
              className="w-1/2 bg-blue-600 hover:bg-blue-500 py-2 rounded font-bold transition"
            >
              Login
            </button>
            <button 
              onClick={() => handleAuth('SIGNUP')} disabled={loading}
              className="w-1/2 bg-slate-700 hover:bg-slate-600 py-2 rounded font-bold transition border border-slate-500"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto bg-slate-900 text-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-400">Trading Journal</h1>
        <button onClick={handleLogout} className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-sm font-bold">
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-gray-400 text-sm">Total P&L</p>
          <h2 className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${totalPnL.toFixed(2)}
          </h2>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-gray-400 text-sm">Win Rate</p>
          <h2 className="text-2xl font-bold text-yellow-400">{winRate}%</h2>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-gray-400 text-sm">Total Trades</p>
          <h2 className="text-2xl font-bold text-blue-400">{trades.length}</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-xl mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input 
          placeholder="Symbol (e.g. BTCUSDT)" value={form.symbol} 
          onChange={e => setForm({...form, symbol: e.target.value})}
          className="bg-slate-700 p-2 rounded text-white border border-slate-600" 
        />
        <select 
          value={form.type} onChange={e => setForm({...form, type: e.target.value})}
          className="bg-slate-700 p-2 rounded text-white border border-slate-600"
        >
          <option value="BUY">BUY (Long)</option>
          <option value="SELL">SELL (Short)</option>
        </select>
        <input 
          type="number" step="any" placeholder="Entry Price" value={form.entry} 
          onChange={e => setForm({...form, entry: e.target.value})}
          className="bg-slate-700 p-2 rounded text-white border border-slate-600" 
        />
        <input 
          type="number" step="any" placeholder="Exit Price" value={form.exit} 
          onChange={e => setForm({...form, exit: e.target.value})}
          className="bg-slate-700 p-2 rounded text-white border border-slate-600" 
        />
        <input 
          type="number" step="any" placeholder="Quantity" value={form.qty} 
          onChange={e => setForm({...form, qty: e.target.value})}
          className="bg-slate-700 p-2 rounded text-white border border-slate-600" 
        />
        <input 
          placeholder="Notes / Strategy" value={form.notes} 
          onChange={e => setForm({...form, notes: e.target.value})}
          className="bg-slate-700 p-2 rounded text-white border border-slate-600" 
        />
        <button type="submit" className="md:col-span-3 bg-blue-600 hover:bg-blue-500 py-2 rounded font-bold transition">
          Add Trade Log
        </button>
      </form>

      <div className="bg-slate-800 rounded-xl overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-700 text-gray-300">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Symbol</th>
              <th className="p-3">Type</th>
              <th className="p-3">Entry</th>
              <th className="p-3">Exit</th>
              <th className="p-3">P&L</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {trades.map(t => (
              <tr key={t.id} className="border-t border-slate-700">
                <td className="p-3 text-sm">{new Date(t.created_at).toLocaleDateString()}</td>
                <td className="p-3 font-bold">{t.symbol}</td>
                <td className={`p-3 font-bold ${t.type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{t.type}</td>
                <td className="p-3">${t.entry}</td>
                <td className="p-3">${t.exit}</td>
                <td className={`p-3 font-bold ${Number(t.pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${Number(t.pnl).toFixed(2)}
                </td>
                <td className="p-3">
                  <button onClick={() => deleteTrade(t.id)} className="text-red-400 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
