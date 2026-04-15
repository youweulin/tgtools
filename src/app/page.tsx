'use client';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Settings, Sparkles, Save, History, ChevronRight, X, UserSearch, MapPin, Clock, HeartPulse, Bus, ShoppingBag } from 'lucide-react';

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const [formData, setFormData] = useState({
    locations: '金澤近江町市場、兼六園、東茶屋街',
    daysToShop: '2',
    driveTime: '2小時',
    guestState: '剛走完兼六園，腳很痠但心情還不錯',
    ageGroup: '長青族 55+',
    product: '納豆精與玻尿酸關節保養'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    // Load from local storage on mount
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);

    const savedHistory = localStorage.getItem('pitch_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
    setShowSettings(false);
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      alert("請先點擊上方齒輪設定 Gemini API Key！");
      setShowSettings(true);
      return;
    }
    setLoading(true);
    setResult('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          ...formData
        })
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.result);
      } else {
        alert("錯誤: " + data.error);
      }
    } catch (err) {
      alert("網路連線錯誤，請重試");
    }
    setLoading(false);
  };

  const saveToHistory = () => {
    if (!result) return;
    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      locations: formData.locations,
      content: result
    };
    const newHistory = [newEntry, ...history];
    setHistory(newHistory as any);
    localStorage.setItem('pitch_history', JSON.stringify(newHistory));
    alert("已收藏至話術庫！");
  };

  const handleDeleteHistory = (id: number) => {
    const newHistory = history.filter((h: any) => h.id !== id);
    setHistory(newHistory as any);
    localStorage.setItem('pitch_history', JSON.stringify(newHistory));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-300" />
          <h1 className="text-xl font-bold tracking-wider">王牌導遊備課大腦</h1>
        </div>
        <div className="flex gap-4">
           <button onClick={() => setShowHistory(!showHistory)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
             <History className="w-5 h-5" />
           </button>
           <button onClick={() => setShowSettings(!showSettings)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
             <Settings className="w-5 h-5" />
           </button>
        </div>
      </header>

      {/* Main Form Content */}
      {!showHistory && (
        <main className="p-4 max-w-2xl mx-auto space-y-6 mt-4">
          
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-2">
               <MapPin className="w-5 h-5 text-blue-600" /> 今日行程與狀態分析
            </h2>
            
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">今天跑哪些景點？</label>
              <textarea 
                value={formData.locations}
                onChange={e => setFormData({...formData, locations: e.target.value})}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 h-24"
                placeholder="例如：京都清水寺、伏見稻荷大社..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1 flex items-center gap-1"><ShoppingBag className="w-4 h-4"/> 距進站天數</label>
                <select 
                  value={formData.daysToShop}
                  onChange={e => setFormData({...formData, daysToShop: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-700">
                  <option value="今天下午">今天下午進店</option>
                  <option value="明天">明天進店 (強力鋪墊)</option>
                  <option value="2">還有 2 天</option>
                  <option value="3">還有 3 天以上 (輕度灌輸)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1 flex items-center gap-1"><Clock className="w-4 h-4"/> 本段車程預估</label>
                <input 
                  type="text"
                  value={formData.driveTime}
                  onChange={e => setFormData({...formData, driveTime: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
                  placeholder="例如：1.5小時"
                />
              </div>
            </div>

            <div>
               <label className="block text-sm font-semibold text-slate-600 mb-1 flex items-center gap-1"><Bus className="w-4 h-4"/> 旅客當下狀態預估</label>
                <input 
                  type="text"
                  value={formData.guestState}
                  onChange={e => setFormData({...formData, guestState: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-700"
                  placeholder="例如：剛吃飽很睏、走到虛脫、精神很好..."
                />
            </div>
            
            <hr className="border-slate-100 my-4" />

            <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-2">
               <UserSearch className="w-5 h-5 text-indigo-600" /> 銷售目標設定
            </h2>

             <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">主要客群</label>
                <select 
                  value={formData.ageGroup}
                  onChange={e => setFormData({...formData, ageGroup: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-700">
                  <option>長青族 60+</option>
                  <option>中年 40-55</option>
                  <option>親子團 (帶小孩)</option>
                  <option>年輕人 20-30</option>
                  <option>雜牌軍 (各年齡都有)</option>
                </select>
              </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1 flex items-center gap-1"><HeartPulse className="w-4 h-4"/> 重點推銷藥品/保健品</label>
              <input 
                type="text"
                value={formData.product}
                onChange={e => setFormData({...formData, product: e.target.value})}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 font-bold"
                placeholder="例如：納豆精、痛寶精、深海鮫..."
              />
            </div>

            <button 
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl mt-6 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition disabled:opacity-70 disabled:cursor-wait text-lg"
            >
              {loading ? <span className="animate-pulse">大腦高速運算中...</span> : <><Sparkles className="w-5 h-5"/> 生成戰略與話術</>}
            </button>
          </section>

          {/* Results Section */}
          {result && (
            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-indigo-50 px-5 py-4 border-b border-indigo-100 flex justify-between items-center">
                <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                   今日專屬話術稿
                </h3>
                <button onClick={saveToHistory} className="text-sm font-bold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-1">
                  <Save className="w-4 h-4"/> 收藏
                </button>
              </div>
              <div className="p-5 prose prose-slate prose-h3:text-blue-700 prose-h3:mt-6 prose-strong:text-indigo-700 max-w-none text-slate-700 leading-relaxed">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </section>
          )}

        </main>
      )}

      {/* History View */}
      {showHistory && (
         <main className="p-4 max-w-2xl mx-auto space-y-4 animate-in slide-in-from-right-8">
            <div className="flex items-center justify-between mb-6 mt-2">
               <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                 <History className="text-blue-600" /> 話術收藏庫
               </h2>
               <button onClick={() => setShowHistory(false)} className="text-blue-600 font-bold text-sm bg-blue-50 px-4 py-2 rounded-full">返回首頁</button>
            </div>
            
            {history.length === 0 ? (
               <div className="text-center py-20 text-slate-400">目前還沒有收藏的話術哦！</div>
            ) : (
               history.map((item: any) => (
                 <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4 ">
                   <div className="flex justify-between items-start mb-3">
                     <div>
                       <span className="text-xs font-bold text-slate-400">{item.date}</span>
                       <h3 className="font-bold text-slate-800 text-lg mt-1">{item.locations}</h3>
                     </div>
                     <button onClick={() => handleDeleteHistory(item.id)} className="text-red-400 px-2 py-1 hover:bg-red-50 rounded text-sm">刪除</button>
                   </div>
                   <div className="prose prose-sm prose-slate max-w-none h-40 overflow-hidden relative">
                      <ReactMarkdown>{item.content}</ReactMarkdown>
                      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent"></div>
                   </div>
                   <button 
                     onClick={() => {
                        setResult(item.content);
                        setShowHistory(false);
                     }}
                     className="mt-3 w-full py-3 bg-slate-50 hover:bg-slate-100 text-blue-600 font-bold rounded-xl text-sm flex justify-center items-center gap-1 transition">
                     完整檢視 <ChevronRight className="w-4 h-4"/>
                   </button>
                 </div>
               ))
            )}
         </main>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full">
              <X className="w-5 h-5"/>
            </button>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600"/> 系統設定
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-2">Google Gemini API Key</label>
                <input 
                  type="password"
                  defaultValue={apiKey}
                  id="apiKeyInput"
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                  placeholder="AIzaSy..."
                />
                <p className="text-xs text-slate-500 mt-2">
                  這把鑰匙只會儲存在您的手機或瀏覽器本地端，不會上傳到任何伺服器。
                </p>
              </div>
              <button 
                onClick={() => {
                   const val = (document.getElementById('apiKeyInput') as HTMLInputElement).value;
                   saveApiKey(val);
                }}
                className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition"
              >
                儲存設定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
