import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, Calculator, Calendar, Save, User, Users, Search, ShoppingBag, CreditCard, Wallet, DollarSign, PieChart, UserCheck, UserPlus, CalendarCheck, BookOpen, CheckSquare, Edit, X, Upload } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area
} from 'recharts';

const App = () => {
  // --- 既有功能：每日營收預測 ---
  const defaultData = [
    { id: 1, date: '2023-11-01', income: 6000, consumption: 4000, person: '查' },
    { id: 2, date: '2023-11-01', income: 6000, consumption: 4000, person: '歐' },
  ];

  // --- 1. 每日營收資料 (含防彈存檔機制 _v2) ---
  const [entries, setEntries] = useState(() => {
    try {
      const saved = localStorage.getItem('gym_crm_entries_v2');
      if (saved) {
        let parsedData = JSON.parse(saved);
        return parsedData.map(item => {
          if (!item.person) return { ...item, person: '查' };
          // 將舊資料中的姜佩均更新為安
          if (item.person === '姜佩均') return { ...item, person: '安' };
          return item;
        });
      }
    } catch (error) {
      console.error("讀取營收資料失敗:", error);
    }
    return defaultData;
  });

  const [viewMode, setViewMode] = useState('all');
  const [inputDate, setInputDate] = useState(new Date().toISOString().split('T')[0]);
  const [inputIncome, setInputIncome] = useState('');
  const [inputConsumption, setInputConsumption] = useState('');
  const [inputPerson, setInputPerson] = useState('查');

  // --- 2. 客戶消費紀錄 (含防彈存檔機制 _v2) ---
  const [customerEntries, setCustomerEntries] = useState(() => {
    try {
      const saved = localStorage.getItem('gym_crm_customers_v2');
      if (saved) {
        let parsedData = JSON.parse(saved);
        return parsedData.map(item => {
          if (item.source === '姜佩均') return { ...item, source: '安' };
          return item;
        });
      }
      return [];
    } catch (error) {
      console.error("讀取客戶資料失敗:", error);
      return [];
    }
  });

  // 客戶輸入狀態
  const [clientDate, setClientDate] = useState(new Date().toISOString().split('T')[0]);
  const [clientName, setClientName] = useState('');
  const [clientSource, setClientSource] = useState('查');
  const [clientPaymentMethod, setClientPaymentMethod] = useState('現金');
  const [clientDeposit, setClientDeposit] = useState('');
  const [clientProduct, setClientProduct] = useState('');
  const [clientBurn, setClientBurn] = useState('');
  const [clientSearch, setClientSearch] = useState('');

  const [isNewMemberBuy, setIsNewMemberBuy] = useState(false);
  const [isNewMemberReserve, setIsNewMemberReserve] = useState(false);
  const [isOldMemberRenew, setIsOldMemberRenew] = useState(false);
  const [isOldMemberReserve, setIsOldMemberReserve] = useState(false);

  const [editingId, setEditingId] = useState(null);

  // --- 強制自動存檔 Effect ---
  useEffect(() => {
    localStorage.setItem('gym_crm_entries_v2', JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('gym_crm_customers_v2', JSON.stringify(customerEntries));
  }, [customerEntries]);

  const handleDelete = (id) => {
    setEntries(entries.filter(entry => entry.id !== id));
  };

  const handleEditCustomer = (entry) => {
    setEditingId(entry.id);
    setClientDate(entry.date);
    setClientName(entry.name);
    setClientSource(entry.source);
    setClientPaymentMethod(entry.paymentMethod || '現金');
    setClientDeposit(entry.deposit > 0 ? entry.deposit.toString() : '');
    setClientProduct(entry.product);
    setClientBurn(entry.burn > 0 ? entry.burn.toString() : '');
    setIsNewMemberBuy(entry.isNewMemberBuy || false);
    setIsNewMemberReserve(entry.isNewMemberReserve || false);
    setIsOldMemberRenew(entry.isOldMemberRenew || false);
    setIsOldMemberReserve(entry.isOldMemberReserve || false);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setClientName('');
    setClientDeposit('');
    setClientProduct('');
    setClientBurn('');
    setClientPaymentMethod('現金');
    setIsNewMemberBuy(false);
    setIsNewMemberReserve(false);
    setIsOldMemberRenew(false);
    setIsOldMemberReserve(false);
    setClientDate(new Date().toISOString().split('T')[0]);
  };

  const handleAddCustomer = (e) => {
    e.preventDefault();
    if (!clientName) return; 

    const depositAmount = Number(clientDeposit) || 0;
    const burnAmount = Number(clientBurn) || 0;
    const targetPerson = clientSource;

    if (editingId) {
      const oldEntry = customerEntries.find(e => e.id === editingId);
      if (!oldEntry) return;

      const updatedEntry = {
        ...oldEntry,
        date: clientDate,
        name: clientName,
        source: targetPerson,
        paymentMethod: clientPaymentMethod,
        deposit: depositAmount,
        product: clientProduct,
        burn: burnAmount,
        isNewMemberBuy,
        isNewMemberReserve,
        isOldMemberRenew,
        isOldMemberReserve
      };

      setCustomerEntries(prev => prev.map(item => item.id === editingId ? updatedEntry : item));

      setEntries(prevEntries => {
        let nextDailyEntries = [...prevEntries];
        const oldDailyIndex = nextDailyEntries.findIndex(d => d.date === oldEntry.date && d.person === oldEntry.source);
        if (oldDailyIndex >= 0) {
          const oldDaily = nextDailyEntries[oldDailyIndex];
          nextDailyEntries[oldDailyIndex] = {
            ...oldDaily,
            income: Math.max(0, oldDaily.income - (oldEntry.deposit || 0)),
            consumption: Math.max(0, oldDaily.consumption - (oldEntry.burn || 0))
          };
        }
        const newDailyIndex = nextDailyEntries.findIndex(d => d.date === clientDate && d.person === targetPerson);
        if (newDailyIndex >= 0) {
           nextDailyEntries[newDailyIndex] = {
             ...nextDailyEntries[newDailyIndex],
             income: nextDailyEntries[newDailyIndex].income + depositAmount,
             consumption: nextDailyEntries[newDailyIndex].consumption + burnAmount
           };
        } else {
           nextDailyEntries.push({
             id: Date.now(),
             date: clientDate,
             person: targetPerson,
             income: depositAmount,
             consumption: burnAmount
           });
        }
        return nextDailyEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
      });
      handleCancelEdit();
    } else {
      const newCustomerEntry = {
        id: Date.now(),
        date: clientDate,
        name: clientName,
        source: targetPerson,
        paymentMethod: clientPaymentMethod,
        deposit: depositAmount,
        product: clientProduct,
        burn: burnAmount,
        isNewMemberBuy,
        isNewMemberReserve,
        isOldMemberRenew,
        isOldMemberReserve
      };

      setCustomerEntries([newCustomerEntry, ...customerEntries].sort((a, b) => new Date(b.date) - new Date(a.date)));
      
      setEntries(prevEntries => {
        const existingIndex = prevEntries.findIndex(entry => entry.date === clientDate && entry.person === targetPerson);
        let nextDailyEntries;
        if (existingIndex >= 0) {
          nextDailyEntries = [...prevEntries];
          const target = nextDailyEntries[existingIndex];
          nextDailyEntries[existingIndex] = {
            ...target,
            income: target.income + depositAmount,
            consumption: target.consumption + burnAmount
          };
        } else {
          nextDailyEntries = [...prevEntries, {
            id: Date.now() + 1,
            date: clientDate,
            person: targetPerson,
            income: depositAmount,
            consumption: burnAmount
          }];
        }
        return nextDailyEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
      });

      setClientName('');
      setClientDeposit('');
      setClientProduct('');
      setClientBurn('');
      setClientPaymentMethod('現金');
      setIsNewMemberBuy(false);
      setIsNewMemberReserve(false);
      setIsOldMemberRenew(false);
      setIsOldMemberReserve(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split(/\r?\n/);
      const parseCSVLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') inQuotes = !inQuotes;
          else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
          else current += char;
        }
        result.push(current.trim());
        return result;
      };

      const newEntries = [];
      const dailyUpdates = {};
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = parseCSVLine(line);
        if (cols.length < 7) continue;
        const rawDate = cols[0].replace(/"/g, '');
        const dateStr = `${rawDate.substring(0, 4)}-${rawDate.substring(4, 6)}-${rawDate.substring(6, 8)}`;
        const name = cols[1].replace(/"/g, '');
        let source = cols[2].replace(/"/g, '');
        if (source === '姜佩均') source = '安'; // 匯入時也自動轉換
        const paymentMethod = cols[3].replace(/"/g, '');
        const product = cols[4].replace(/"/g, '');
        const price = Number(cols[5].replace(/"/g, '').replace(/,/g, '')) || 0;
        const burnMethod = cols[6].replace(/"/g, '');
        const deposit = paymentMethod !== '點數' ? price : 0;
        const burn = burnMethod !== '購課' ? price : 0;

        newEntries.push({
          id: Date.now() + i,
          date: dateStr,
          name: name,
          source: source,
          paymentMethod: paymentMethod,
          deposit: deposit,
          product: product,
          burn: burn,
          isNewMemberBuy: cols[7]?.toUpperCase().includes('TRUE'),
          isNewMemberReserve: cols[8]?.toUpperCase().includes('TRUE'),
          isOldMemberRenew: cols[9]?.toUpperCase().includes('TRUE'),
          isOldMemberReserve: cols[10]?.toUpperCase().includes('TRUE')
        });

        const key = `${dateStr}_${source}`;
        if (!dailyUpdates[key]) dailyUpdates[key] = { income: 0, consumption: 0, date: dateStr, person: source };
        dailyUpdates[key].income += deposit;
        dailyUpdates[key].consumption += burn;
      }
      setCustomerEntries(prev => [...newEntries, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)));
      setEntries(prev => {
        let nextEntries = [...prev];
        Object.values(dailyUpdates).forEach(update => {
          const idx = nextEntries.findIndex(e => e.date === update.date && e.person === update.person);
          if (idx >= 0) {
            nextEntries[idx] = { ...nextEntries[idx], income: nextEntries[idx].income + update.income, consumption: nextEntries[idx].consumption + update.consumption };
          } else {
            nextEntries.push({ id: Date.now() + Math.random(), ...update });
          }
        });
        return nextEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
      });
      alert(`匯入成功！`);
    };
    reader.readAsText(file);
  };

  const handleExportCSV = () => {
    let csvContent = "\uFEFF日期,客戶,訂單來源,入金方式,品名,金額,消化方式,新客購課,新客預約,舊客續課,舊客預約\n";
    customerEntries.forEach(e => {
      const row = [`"${e.date.replace(/-/g, '')}"`, `"${e.name}"`, `"${e.source}"`, `"${e.paymentMethod}"`, `"${e.product}"`, `"${Math.max(e.deposit, e.burn)}"`, `"${e.burn > 0 ? '使用扣點' : '購課'}"`, e.isNewMemberBuy, e.isNewMemberReserve, e.isOldMemberRenew, e.isOldMemberReserve];
      csvContent += row.join(",") + "\n";
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `備份_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleDeleteCustomer = (id) => setCustomerEntries(customerEntries.filter(e => e.id !== id));

  const filteredCustomers = useMemo(() => {
    if (!clientSearch) return customerEntries;
    const lowerSearch = clientSearch.toLowerCase();
    return customerEntries.filter(e => e.name.toLowerCase().includes(lowerSearch) || e.product.toLowerCase().includes(lowerSearch) || e.source.toLowerCase().includes(lowerSearch));
  }, [customerEntries, clientSearch]);

  const visitStats = useMemo(() => {
    let stats = { newCount: 0, oldCount: 0, total: 0, newMemberBuy: 0, newMemberReserve: 0, oldMemberRenew: 0, oldMemberReserve: 0 };
    filteredCustomers.forEach(e => {
      if (e.product.includes('體驗')) stats.newCount++;
      else stats.oldCount++;
      if (e.isNewMemberBuy) stats.newMemberBuy++;
      if (e.isNewMemberReserve) stats.newMemberReserve++;
      if (e.isOldMemberRenew) stats.oldMemberRenew++;
      if (e.isOldMemberReserve) stats.oldMemberReserve++;
    });
    stats.total = stats.newCount + stats.oldCount;
    return stats;
  }, [filteredCustomers]);

  const paymentStats = useMemo(() => {
    const stats = { '點數': 0, '現金': 0, '街口': 0, 'Line Pay': 0, '轉帳': 0, '刷卡': 0, 'KLook': 0 };
    filteredCustomers.forEach(e => { if (stats.hasOwnProperty(e.paymentMethod)) stats[e.paymentMethod] += (e.deposit || e.burn || 0); });
    return stats;
  }, [filteredCustomers]);

  const filteredEntries = useMemo(() => viewMode === 'all' ? entries : entries.filter(e => e.person === viewMode), [entries, viewMode]);

  const cumulativeData = useMemo(() => {
    let accIncome = 0, accConsumption = 0;
    return filteredEntries.map(e => ({ ...e, accIncome: (accIncome += e.income), accConsumption: (accConsumption += e.consumption), dayOfMonth: new Date(e.date).getDate() }));
  }, [filteredEntries]);

  const projectionData = useMemo(() => {
    if (filteredEntries.length === 0) return { fullMonthData: [] };
    const lastDate = new Date(filteredEntries[filteredEntries.length - 1].date);
    const daysInMonth = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0).getDate();
    
    // 簡單迴歸邏輯
    const calculateRegression = (pts) => {
        if (pts.length < 2) return null;
        const n = pts.length;
        let sX=0, sY=0, sXY=0, sXX=0;
        pts.forEach(p => { sX+=p.x; sY+=p.y; sXY+=p.x*p.y; sXX+=p.x*p.x; });
        const slope = (n*sXY - sX*sY) / (n*sXX - sX*sX);
        const intercept = (sY - slope*sX) / n;
        return { slope, intercept };
    };

    const incReg = calculateRegression(cumulativeData.map(d => ({ x: d.dayOfMonth, y: d.accIncome })));
    const conReg = calculateRegression(cumulativeData.map(d => ({ x: d.dayOfMonth, y: d.accConsumption })));
    
    const fullMonthData = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayData = cumulativeData.find(d => d.dayOfMonth === day);
      fullMonthData.push({
        dateLabel: `${day}號`,
        actualIncome: dayData ? dayData.accIncome : null,
        actualConsumption: dayData ? dayData.accConsumption : null,
        predIncome: incReg ? Math.round(incReg.slope * day + incReg.intercept) : 0,
        predConsumption: conReg ? Math.round(conReg.slope * day + conReg.intercept) : 0,
        dailyIncome: dayData ? dayData.income : 0,
        dailyConsumption: dayData ? dayData.consumption : 0,
      });
    }
    return { fullMonthData };
  }, [cumulativeData, filteredEntries]);

  const stats = useMemo(() => {
    const current = cumulativeData[cumulativeData.length - 1] || { accIncome: 0, accConsumption: 0 };
    const projected = projectionData.fullMonthData[projectionData.fullMonthData.length - 1] || { predIncome: 0, predConsumption: 0 };
    return { currentTotalIncome: current.accIncome, currentTotalConsumption: current.accConsumption, projectedTotalIncome: projected.predIncome, projectedTotalConsumption: projected.predConsumption };
  }, [cumulativeData, projectionData]);

  const getPersonBadgeStyle = (p) => {
    if (p === '查') return 'bg-blue-50 text-blue-700';
    if (p === '歐') return 'bg-purple-50 text-purple-700';
    if (p === '安') return 'bg-orange-50 text-orange-700'; // 安的專屬顏色
    return 'bg-slate-100 text-slate-600';
  };

  const formatYAxis = (v) => (v / 10000).toFixed(1) + '萬';

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Calculator className="text-blue-600" /> 伸動保健室｜營收管理系統</h1>
            <p className="text-slate-500 text-sm">數據驅動經營，歡迎新夥伴：安！</p>
          </div>
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
            {['all', '查', '歐', '安'].map(m => (
              <button key={m} onClick={() => setViewMode(m)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === m ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {m === 'all' ? '總覽' : m}
              </button>
            ))}
          </div>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="目前累積入金" value={stats.currentTotalIncome} color="text-emerald-600" icon={<TrendingUp size={20}/>} />
          <StatCard title="月底預測入金" value={stats.projectedTotalIncome} color="text-emerald-700" bgColor="bg-emerald-50" isProjection />
          <StatCard title="目前累積消化" value={stats.currentTotalConsumption} color="text-amber-600" icon={<TrendingDown size={20}/>} />
          <StatCard title="月底預測消化" value={stats.projectedTotalConsumption} color="text-amber-700" bgColor="bg-amber-50" isProjection />
        </div>

        {/* 圖表 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-lg mb-6">累積趨勢與預測 ({viewMode === 'all' ? '全公司' : viewMode})</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={projectionData.fullMonthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="dateLabel" tick={{fontSize: 12}} axisLine={false} interval={2} />
                <YAxis tick={{fontSize: 12}} axisLine={false} tickFormatter={formatYAxis} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="actualIncome" stroke="#059669" fill="#059669" fillOpacity={0.1} strokeWidth={3} />
                <Area type="monotone" dataKey="actualConsumption" stroke="#d97706" fill="#d97706" fillOpacity={0.1} strokeWidth={3} />
                <Line type="monotone" dataKey="predIncome" stroke="#10b981" strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="predConsumption" stroke="#f59e0b" strokeDasharray="5 5" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 消費輸入表單 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingBag className="text-purple-600" /> 消費明細錄入</h2>
                <div className="flex gap-2">
                    <button onClick={handleExportCSV} className="text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg text-sm font-medium border border-emerald-100 flex items-center gap-1"><Save size={14}/> 備份</button>
                    <label className="text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg text-sm font-medium border border-purple-100 cursor-pointer flex items-center gap-1"><Upload size={14}/> 匯入<input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} /></label>
                </div>
            </div>
            
            <form onSubmit={handleAddCustomer} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 items-end">
                <div><label className="text-xs text-slate-500">日期</label><input type="date" value={clientDate} onChange={e=>setClientDate(e.target.value)} className="w-full border p-2 rounded-lg text-sm"/></div>
                <div><label className="text-xs text-slate-500">客戶</label><input type="text" value={clientName} onChange={e=>setClientName(e.target.value)} className="w-full border p-2 rounded-lg text-sm" placeholder="姓名"/></div>
                <div>
                    <label className="text-xs text-slate-500">訓練師</label>
                    <select value={clientSource} onChange={e=>setClientSource(e.target.value)} className="w-full border p-2 rounded-lg text-sm bg-white">
                        <option value="查">查</option><option value="歐">歐</option><option value="安">安</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs text-slate-500">支付</label>
                    <select value={clientPaymentMethod} onChange={e=>setClientPaymentMethod(e.target.value)} className="w-full border p-2 rounded-lg text-sm bg-white">
                        <option value="點數">點數</option><option value="現金">現金</option><option value="街口">街口</option><option value="Line Pay">Line Pay</option><option value="轉帳">轉帳</option><option value="刷卡">刷卡</option>
                    </select>
                </div>
                <div><label className="text-xs text-slate-500">金額</label><input type="number" value={clientDeposit} onChange={e=>setClientDeposit(e.target.value)} className="w-full border p-2 rounded-lg text-sm" placeholder="入金"/></div>
                <div><label className="text-xs text-slate-500">品名</label><input type="text" value={clientProduct} onChange={e=>setClientProduct(e.target.value)} className="w-full border p-2 rounded-lg text-sm" placeholder="項目"/></div>
                <button type="submit" className="bg-purple-600 text-white p-2 rounded-lg font-bold hover:bg-purple-700 transition-colors">{editingId ? '更新' : '新增'}</button>
            </form>
        </div>

        {/* 列表 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                    <tr>
                        <th className="px-6 py-4">日期</th><th className="px-6 py-4">客戶</th><th className="px-6 py-4">訓練師</th><th className="px-6 py-4">金額</th><th className="px-6 py-4">品名</th><th className="px-6 py-4 text-center">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredCustomers.map(e => (
                        <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50">
                            <td className="px-6 py-4">{e.date}</td>
                            <td className="px-6 py-4 font-bold">{e.name}</td>
                            <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-medium ${getPersonBadgeStyle(e.source)}`}>{e.source}</span></td>
                            <td className="px-6 py-4 font-medium text-emerald-600">${(e.deposit || e.burn).toLocaleString()}</td>
                            <td className="px-6 py-4 text-slate-500">{e.product}</td>
                            <td className="px-6 py-4 text-center">
                                <button onClick={()=>handleEditCustomer(e)} className="text-blue-500 mr-3"><Edit size={16}/></button>
                                <button onClick={()=>handleDeleteCustomer(e.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color, bgColor = "bg-white", icon, isProjection }) => (
  <div className={`${bgColor} p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-32`}>
    <div className="flex justify-between items-start"><span className="text-sm font-semibold text-slate-500">{title}</span>{icon}</div>
    <div className={`text-2xl font-bold ${color}`}>${(value || 0).toLocaleString()}</div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-white p-3 border rounded-xl shadow-lg text-xs">
        <p className="font-bold mb-2">{label}</p>
        <div className="text-emerald-600">累積入金: ${d.actualIncome?.toLocaleString() || d.predIncome?.toLocaleString()}</div>
        <div className="text-amber-600">累積消化: ${d.actualConsumption?.toLocaleString() || d.predConsumption?.toLocaleString()}</div>
      </div>
    );
  }
  return null;
};

export default App;
