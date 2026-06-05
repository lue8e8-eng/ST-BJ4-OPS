import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, Calculator, Calendar, Save, User, Users, Search, ShoppingBag, CreditCard, Wallet, DollarSign, PieChart, UserCheck, UserPlus, CalendarCheck, BookOpen, CheckSquare, Edit, X, Upload, AlertTriangle, Clock } from 'lucide-react';
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
    { id: 3, date: '2023-11-02', income: 15000, consumption: 9500, person: '查' },
    { id: 4, date: '2023-11-03', income: 5000, consumption: 5000, person: '歐' },
    { id: 5, date: '2023-11-04', income: 18000, consumption: 10500, person: '查' },
    { id: 6, date: '2023-11-05', income: 10000, consumption: 6000, person: '歐' },
  ];

  // --- 1. 每日營收資料 (含防彈存檔機制 _v2) ---
  const [entries, setEntries] = useState(() => {
    try {
      const saved = localStorage.getItem('gym_crm_entries_v2');
      if (saved) {
        let parsedData = JSON.parse(saved);
        return parsedData.map(item => {
          if (!item.person) return { ...item, person: '查' };
          if (item.person === '夥伴 A') return { ...item, person: '查' };
          if (item.person === '夥伴 B') return { ...item, person: '歐' };
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
  const [clientDate, setClientDate] = useState(new Date().toISOString().split('T')[0]);
  const [clientName, setClientName] = useState('');
  const [clientSource, setClientSource] = useState('查');
  const [clientPaymentMethod, setClientPaymentMethod] = useState('現金');
  const [clientDeposit, setClientDeposit] = useState('');
  const [clientProduct, setClientProduct] = useState('');
  const [clientBurn, setClientBurn] = useState('');
  const [clientSearch, setClientSearch] = useState('');

  // 統計選項的狀態
  const [isNewMemberBuy, setIsNewMemberBuy] = useState(false);
  const [isNewMemberReserve, setIsNewMemberReserve] = useState(false);
  const [isOldMemberRenew, setIsOldMemberRenew] = useState(false);
  const [isOldMemberReserve, setIsOldMemberReserve] = useState(false);

  // 編輯模式與彈跳視窗狀態
  const [editingId, setEditingId] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // --- 強制自動存檔 Effect ---
  useEffect(() => {
    try {
      localStorage.setItem('gym_crm_entries_v2', JSON.stringify(entries));
    } catch (error) {
      console.error("寫入營收資料失敗:", error);
    }
  }, [entries]);

  useEffect(() => {
    try {
      localStorage.setItem('gym_crm_customers_v2', JSON.stringify(customerEntries));
    } catch (error) {
      console.error("寫入客戶資料失敗:", error);
    }
  }, [customerEntries]);

  // 客戶消費紀錄
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

  // 啟動編輯模式
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

  // 取消編輯
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

  // 一鍵清除所有資料
  const handleConfirmClearAll = () => {
    setEntries([]);
    setCustomerEntries([]);
    setShowClearConfirm(false);
    showToast('已成功清空所有資料');
  };

  // 顯示提示訊息
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  // 客戶紀錄處理函數
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
          
          if (nextDailyEntries[oldDailyIndex].income === 0 && nextDailyEntries[oldDailyIndex].consumption === 0) {
              nextDailyEntries.splice(oldDailyIndex, 1);
          }
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

      const newEntries = [newCustomerEntry, ...customerEntries].sort((a, b) => new Date(b.date) - new Date(a.date));
      setCustomerEntries(newEntries);
      
      setEntries(prevEntries => {
        const existingIndex = prevEntries.findIndex(
          entry => entry.date === clientDate && entry.person === targetPerson
        );

        let nextDailyEntries = [...prevEntries];
        if (existingIndex >= 0) {
          const target = nextDailyEntries[existingIndex];
          nextDailyEntries[existingIndex] = {
            ...target,
            income: target.income + depositAmount,
            consumption: target.consumption + burnAmount
          };
        } else {
          const newDailyEntry = {
            id: Date.now() + 1,
            date: clientDate,
            person: targetPerson,
            income: depositAmount,
            consumption: burnAmount
          };
          nextDailyEntries.push(newDailyEntry);
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
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
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
        const source = cols[2].replace(/"/g, '');
        const paymentMethod = cols[3].replace(/"/g, '');
        const product = cols[4].replace(/"/g, '');
        
        const priceStr = cols[5].replace(/"/g, '').replace(/,/g, '');
        const price = Number(priceStr) || 0;
        
        const burnMethod = cols[6].replace(/"/g, '');
        
        const isNewBuy = cols[7]?.toUpperCase().includes('TRUE');
        const isNewReserve = cols[8]?.toUpperCase().includes('TRUE');
        const isOldRenew = cols[9]?.toUpperCase().includes('TRUE');
        const isOldReserve = cols[10]?.toUpperCase().includes('TRUE');

        const deposit = paymentMethod !== '點數' ? price : 0;
        const burn = burnMethod !== '購課' ? price : 0;

        const newEntry = {
          id: Date.now() + i,
          date: dateStr,
          name: name,
          source: source,
          paymentMethod: paymentMethod,
          deposit: deposit,
          product: product,
          burn: burn,
          isNewMemberBuy: isNewBuy,
          isNewMemberReserve: isNewReserve,
          isOldMemberRenew: isOldRenew,
          isOldMemberReserve: isOldReserve
        };
        newEntries.push(newEntry);

        const key = `${dateStr}_${source}`;
        if (!dailyUpdates[key]) {
            dailyUpdates[key] = { income: 0, consumption: 0, date: dateStr, person: source };
        }
        dailyUpdates[key].income += deposit;
        dailyUpdates[key].consumption += burn;
      }

      if (newEntries.length > 0) {
        setCustomerEntries(prev => [...newEntries, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)));
        
        setEntries(prev => {
            let nextEntries = [...prev];
            Object.values(dailyUpdates).forEach(update => {
                const idx = nextEntries.findIndex(e => e.date === update.date && e.person === update.person);
                if (idx >= 0) {
                    nextEntries[idx] = {
                        ...nextEntries[idx],
                        income: nextEntries[idx].income + update.income,
                        consumption: nextEntries[idx].consumption + update.consumption
                    };
                } else {
                    nextEntries.push({
                        id: Date.now() + Math.random(),
                        date: update.date,
                        person: update.person,
                        income: update.income,
                        consumption: update.consumption
                    });
                }
            });
            return nextEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
        });
        showToast(`成功匯入 ${newEntries.length} 筆資料！`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleExportCSV = () => {
    let csvContent = "\uFEFF"; 
    csvContent += "日期,客戶,訂單來源,入金方式,品名,金額,消化方式,新客購課,新客預約,舊客續課,舊客預約\n";

    customerEntries.forEach(e => {
      const dateStr = e.date.replace(/-/g, '');
      const price = Math.max(e.deposit, e.burn);
      const burnMethod = e.burn > 0 ? '使用扣點' : '購課';

      const row = [
        `"${dateStr}"`,
        `"${e.name}"`,
        `"${e.source}"`,
        `"${e.paymentMethod}"`,
        `"${e.product}"`,
        `"${price}"`,
        `"${burnMethod}"`,
        e.isNewMemberBuy ? "TRUE" : "FALSE",
        e.isNewMemberReserve ? "TRUE" : "FALSE",
        e.isOldMemberRenew ? "TRUE" : "FALSE",
        e.isOldMemberReserve ? "TRUE" : "FALSE"
      ];
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `客戶消費紀錄備份_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteCustomer = (id) => {
    const deletedEntry = customerEntries.find(entry => entry.id === id);
    if (!deletedEntry) return;

    setCustomerEntries(customerEntries.filter(entry => entry.id !== id));

    setEntries(prevEntries => {
      let nextDailyEntries = [...prevEntries];
      const dailyIndex = nextDailyEntries.findIndex(d => d.date === deletedEntry.date && d.person === deletedEntry.source);

      if (dailyIndex >= 0) {
        const daily = nextDailyEntries[dailyIndex];
        const newIncome = Math.max(0, daily.income - (deletedEntry.deposit || 0));
        const newConsumption = Math.max(0, daily.consumption - (deletedEntry.burn || 0));

        if (newIncome === 0 && newConsumption === 0) {
          nextDailyEntries.splice(dailyIndex, 1);
        } else {
          nextDailyEntries[dailyIndex] = {
            ...daily,
            income: newIncome,
            consumption: newConsumption
          };
        }
      }
      return nextDailyEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
    });
  };

  const handleDeleteDailyEntry = (id) => {
    setEntries(entries.filter(entry => entry.id !== id));
  }

  const filteredCustomers = useMemo(() => {
    if (!clientSearch) return customerEntries;
    const lowerSearch = clientSearch.toLowerCase();
    return customerEntries.filter(entry => 
      entry.name.toLowerCase().includes(lowerSearch) || 
      entry.product.toLowerCase().includes(lowerSearch) ||
      entry.source.toLowerCase().includes(lowerSearch) ||
      (entry.paymentMethod && entry.paymentMethod.toLowerCase().includes(lowerSearch)) ||
      (entry.date && entry.date.toLowerCase().includes(lowerSearch))
    );
  }, [customerEntries, clientSearch]);

  const visitStats = useMemo(() => {
    let newCount = 0; 
    let oldCount = 0; 
    let newMemberBuy = 0;     
    let newMemberReserve = 0; 
    let oldMemberRenew = 0;   
    let oldMemberReserve = 0; 
    
    filteredCustomers.forEach(entry => {
      const product = entry.product || '';
      
      if (product.includes('訓練課程-新客初次９折優惠')) {
        newCount++;
      } else if (product.includes('使用扣點') || product.includes('訓練課程－單次')) {
        oldCount++;
      }

      if (entry.isNewMemberBuy) newMemberBuy++;
      if (entry.isNewMemberReserve) newMemberReserve++;
      if (entry.isOldMemberRenew) oldMemberRenew++;
      if (entry.isOldMemberReserve) oldMemberReserve++;
    });
    
    return {
      newCount,
      oldCount,
      total: newCount + oldCount,
      newMemberBuy,
      newMemberReserve,
      oldMemberRenew,
      oldMemberReserve
    };
  }, [filteredCustomers]);

  const paymentStats = useMemo(() => {
    const stats = {
      '點數': 0,
      '現金': 0,
      '街口': 0,
      'Line Pay': 0,
      '轉帳': 0,
      '刷卡': 0,
      'KLook': 0
    };
    
    filteredCustomers.forEach(entry => {
      const method = entry.paymentMethod;
      if (stats.hasOwnProperty(method)) {
        stats[method] += (entry.deposit || entry.burn || 0);
      }
    });
    
    return stats;
  }, [filteredCustomers]);

  const filteredEntries = useMemo(() => {
    if (viewMode === 'all') return entries;
    return entries.filter(entry => entry.person === viewMode);
  }, [entries, viewMode]);

  const cumulativeData = useMemo(() => {
    let accIncome = 0;
    let accConsumption = 0;
    return filteredEntries.map(entry => {
      accIncome += entry.income;
      accConsumption += entry.consumption;
      return {
        ...entry,
        accIncome,
        accConsumption,
        dayOfMonth: new Date(entry.date).getDate()
      };
    });
  }, [filteredEntries]);

  const projectionData = useMemo(() => {
    if (filteredEntries.length === 0) return { fullMonthData: [], incomeReg: null, consumReg: null, daysInMonth: 30 };
    
    const calculateRegression = (dataPoints) => {
      if (dataPoints.length < 2) return null;
      const n = dataPoints.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      dataPoints.forEach(p => {
        sumX += p.x;
        sumY += p.y;
        sumXY += p.x * p.y;
        sumXX += p.x * p.x;
      });
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      return { slope, intercept };
    };

    const currentMonth = new Date(filteredEntries[filteredEntries.length - 1].date);
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const incomePoints = cumulativeData.map(d => ({ x: d.dayOfMonth, y: d.accIncome }));
    const consumPoints = cumulativeData.map(d => ({ x: d.dayOfMonth, y: d.accConsumption }));
    const incomeReg = calculateRegression(incomePoints);
    const consumReg = calculateRegression(consumPoints);
    const fullMonthData = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEntries = cumulativeData.filter(d => d.dayOfMonth === day);
      const lastEntryOfDay = dayEntries.length > 0 ? dayEntries[dayEntries.length - 1] : null;
      let predictedIncome = 0;
      let predictedConsumption = 0;
      if (incomeReg) {
        predictedIncome = incomeReg.slope * day + incomeReg.intercept;
      }
      if (consumReg) {
        predictedConsumption = consumReg.slope * day + consumReg.intercept;
      }
      fullMonthData.push({
        day: day,
        dateLabel: `${day}號`,
        actualIncome: lastEntryOfDay ? lastEntryOfDay.accIncome : null,
        actualConsumption: lastEntryOfDay ? lastEntryOfDay.accConsumption : null,
        predIncome: predictedIncome > 0 ? Math.round(predictedIncome) : 0,
        predConsumption: predictedConsumption > 0 ? Math.round(predictedConsumption) : 0,
        dailyIncome: lastEntryOfDay ? lastEntryOfDay.income : 0,
        dailyConsumption: lastEntryOfDay ? lastEntryOfDay.consumption : 0,
      });
    }
    return { fullMonthData, incomeReg, consumReg, daysInMonth };
  }, [cumulativeData, filteredEntries]);

  const stats = useMemo(() => {
    const currentTotalIncome = cumulativeData.length > 0 ? cumulativeData[cumulativeData.length - 1].accIncome : 0;
    const currentTotalConsumption = cumulativeData.length > 0 ? cumulativeData[cumulativeData.length - 1].accConsumption : 0;
    const lastDayData = projectionData.fullMonthData[projectionData.fullMonthData.length - 1];
    const projectedTotalIncome = lastDayData ? lastDayData.predIncome : 0;
    const projectedTotalConsumption = lastDayData ? lastDayData.predConsumption : 0;
    return {
      currentTotalIncome,
      currentTotalConsumption,
      projectedTotalIncome,
      projectedTotalConsumption,
      count: filteredEntries.length
    };
  }, [cumulativeData, projectionData, filteredEntries]);

  const getPersonBadgeStyle = (personName) => {
    switch (personName) {
      case '查': return 'bg-blue-50 text-blue-700';
      case '歐': return 'bg-purple-50 text-purple-700';
      case '安': return 'bg-orange-50 text-orange-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getPaymentMethodStyle = (method) => {
    switch (method) {
      case '現金': return 'bg-green-50 text-green-700 border-green-200';
      case '刷卡': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case '轉帳': return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'Line Pay': return 'bg-green-50 text-[#00C300] border-green-200';
      case '街口': return 'bg-red-50 text-red-600 border-red-200';
      case 'KLook': return 'bg-orange-50 text-orange-600 border-orange-200';
      case '點數': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const formatYAxis = (value) => {
    return (value / 10000).toFixed(1) + '萬';
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800 tracking-tight">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* SECTION 1: 每日營收預測儀表板 */}
        <div className="space-y-6">
          {/* Header & Filter */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Clock className="text-blue-600" />
                店面營收與消化預測系統
              </h1>
              <p className="text-slate-500 text-sm mt-1">團隊業績追蹤與線性迴歸分析</p>
            </div>
            <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setViewMode('all')} className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <Users size={16} /> 總覽
              </button>
              <button onClick={() => setViewMode('查')} className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${viewMode === '查' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <User size={16} /> 查
              </button>
              <button onClick={() => setViewMode('歐')} className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${viewMode === '歐' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <User size={16} /> 歐
              </button>
              <button onClick={() => setViewMode('安')} className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${viewMode === '安' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <User size={16} /> 安
              </button>
            </div>
          </div>

          {/* 統計卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title={`目前累積入金 (${viewMode === 'all' ? '總計' : viewMode})`} value={stats.currentTotalIncome} color="text-emerald-600" icon={<TrendingUp size={20} />} />
            <StatCard title={`月底預測入金 (${viewMode === 'all' ? '總計' : viewMode})`} value={stats.projectedTotalIncome} subValue={`較目前增加 ${Math.round(stats.projectedTotalIncome - stats.currentTotalIncome).toLocaleString()}`} color="text-emerald-700" bgColor="bg-emerald-50" isProjection />
            <StatCard title={`目前累積消化 (${viewMode === 'all' ? '總計' : viewMode})`} value={stats.currentTotalConsumption} color="text-amber-600" icon={<TrendingDown size={20} />} />
            <StatCard title={`月底預測消化 (${viewMode === 'all' ? '總計' : viewMode})`} value={stats.projectedTotalConsumption} subValue={`較目前增加 ${Math.round(stats.projectedTotalConsumption - stats.currentTotalConsumption).toLocaleString()}`} color="text-amber-700" bgColor="bg-amber-50" isProjection />
          </div>

          {/* 主要內容區 */}
          <div className="space-y-6">
            {/* 累積趨勢預測圖 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                <h3 className="font-bold text-lg text-slate-700 flex items-center gap-2">{viewMode === 'all' ? '全公司' : viewMode} 累積趨勢與預測</h3>
                <div className="flex flex-wrap gap-4 text-xs font-bold">
                  <span className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div> 實際入金</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 border-2 border-emerald-400 border-dashed rounded-full"></div> 預測入金</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-500 rounded-full"></div> 實際消化</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 border-2 border-amber-500 border-dashed rounded-full"></div> 預測消化</span>
                </div>
              </div>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={projectionData.fullMonthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="dateLabel" tick={{fontSize: 12, fill: '#64748b', fontWeight: 'bold'}} axisLine={false} tickLine={false} interval={2} />
                    <YAxis tick={{fontSize: 12, fill: '#64748b', fontWeight: 'bold'}} axisLine={false} tickLine={false} tickFormatter={formatYAxis} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="predIncome" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={false} name="預測入金" />
                    <Line type="monotone" dataKey="predConsumption" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={false} name="預測消化" />
                    <Area type="monotone" dataKey="actualIncome" stroke="#059669" fill="#059669" fillOpacity={0.1} strokeWidth={3} name="實際入金" />
                    <Area type="monotone" dataKey="actualConsumption" stroke="#d97706" fill="#d97706" fillOpacity={0.1} strokeWidth={3} name="實際消化" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 客戶消費明細管理 (滿版) */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <ShoppingBag className="text-purple-600" />
                    客戶消費明細管理
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">記錄每一位客人的訂單來源、品項與金額細節</p>
                </div>
                
                <div className="flex flex-wrap gap-2 w-full xl:w-auto items-center">
                  <button 
                    onClick={handleExportCSV}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                  >
                    <Save size={16} />
                    下載備份
                  </button>

                  <label className="cursor-pointer bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors m-0">
                      <Upload size={16} />
                      匯入 CSV
                      <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                  </label>

                  <button 
                    onClick={() => setShowClearConfirm(true)}
                    className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                  >
                    <Trash2 size={16} />
                    清空本月資料
                  </button>

                  <div className="relative w-full sm:w-64 mt-2 sm:mt-0">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="搜尋日期、客戶、品項、來源..." 
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* 客戶資料輸入表單 */}
              <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-200 transition-all duration-300 ${editingId ? 'ring-2 ring-blue-400' : ''}`}>
                 <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2 justify-between">
                   <span className="flex items-center gap-2">
                      {editingId ? <Edit className="w-4 h-4 text-blue-600"/> : <Plus className="w-4 h-4 text-purple-600"/>}
                      {editingId ? '編輯消費紀錄' : '新增消費紀錄 (自動同步至上方總帳)'}
                   </span>
                   {editingId && (
                     <button 
                       onClick={handleCancelEdit}
                       className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200"
                     >
                       <X size={12}/> 取消編輯
                     </button>
                   )}
                 </h3>
                 <form onSubmit={handleAddCustomer}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 items-end mb-4">
                      <div className="lg:col-span-1">
                        <label className="block text-xs font-medium text-slate-500 mb-1">日期</label>
                        <input 
                          type="date" 
                          required
                          value={clientDate}
                          onChange={(e) => setClientDate(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-purple-500 outline-none text-sm font-bold text-center"
                        />
                      </div>
                      <div className="lg:col-span-1">
                        <label className="block text-xs font-medium text-slate-500 mb-1">客戶名稱</label>
                        <input 
                          type="text" 
                          required
                          placeholder="姓名"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-purple-500 outline-none text-sm text-center font-bold"
                        />
                      </div>
                      <div className="lg:col-span-1">
                         <label className="block text-xs font-medium text-slate-500 mb-1">教練</label>
                         <select 
                          value={clientSource}
                          onChange={(e) => setClientSource(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-purple-500 outline-none text-sm bg-white text-center font-bold"
                         >
                           <option value="查">查</option>
                           <option value="歐">歐</option>
                           <option value="安">安</option>
                         </select>
                      </div>
                      <div className="lg:col-span-1">
                         <label className="block text-xs font-medium text-slate-500 mb-1">來源</label>
                         <select 
                          value={clientPaymentMethod}
                          onChange={(e) => setClientPaymentMethod(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-purple-500 outline-none text-sm bg-white text-center font-bold"
                         >
                           <option value="點數">點數</option>
                           <option value="現金">現金</option>
                           <option value="街口">街口</option>
                           <option value="Line Pay">Line Pay</option>
                           <option value="轉帳">轉帳</option>
                           <option value="刷卡">刷卡</option>
                           <option value="KLook">KLook</option>
                         </select>
                      </div>
                      <div className="lg:col-span-1">
                        <label className="block text-xs font-medium text-slate-500 mb-1">入金金額</label>
                        <input 
                          type="number" 
                          placeholder="0"
                          value={clientDeposit}
                          onChange={(e) => setClientDeposit(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-emerald-500 outline-none text-sm text-center font-bold"
                        />
                      </div>
                      <div className="lg:col-span-1">
                        <label className="block text-xs font-medium text-slate-500 mb-1">品名</label>
                        <input 
                          type="text" 
                          list="product-options"
                          placeholder="購買項目"
                          value={clientProduct}
                          onChange={(e) => setClientProduct(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-purple-500 outline-none text-sm text-center font-bold"
                        />
                        <datalist id="product-options">
                          <option value="使用扣點" />
                          <option value="訓練課程－單次" />
                          <option value="訓練課程-新客初次傾折優惠" />
                          <option value="訓練課程-軟QQ方案-５堂" />
                          <option value="訓練課程-軟QQ方案-２５堂" />
                          <option value="訓練課程-軟QQ方案" />
                          <option value="訓練課程-優惠方案" />
                        </datalist>
                      </div>
                      <div className="lg:col-span-1">
                        <label className="block text-xs font-medium text-slate-500 mb-1">消化金額</label>
                        <div className="flex gap-2">
                           <input 
                             type="number" 
                             placeholder="0"
                             value={clientBurn}
                             onChange={(e) => setClientBurn(e.target.value)}
                             className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-amber-500 outline-none text-sm text-center font-bold"
                           />
                           <button 
                             type="submit"
                             className={`${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'} text-white rounded-lg px-3 py-2 transition-colors flex items-center gap-1 shrink-0 font-bold`}
                           >
                             <Save size={16}/>
                             {editingId ? '更新' : ''}
                           </button>
                        </div>
                      </div>
                    </div>

                    {/* 勾選項目 (語法修復處) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                       <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${isNewMemberBuy ? 'bg-pink-50 border-pink-200 ring-1 ring-pink-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                          <input 
                             type="checkbox" 
                             checked={isNewMemberBuy}
                             onChange={(e) => setIsNewMemberBuy(e.target.checked)}
                             className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                           />
                          <span className={`text-sm font-bold ${isNewMemberBuy ? 'text-pink-700' : 'text-slate-600'}`}>新客購課</span>
                       </label>

                       <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${isNewMemberReserve ? 'bg-purple-50 border-purple-200 ring-1 ring-purple-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                          <input 
                             type="checkbox" 
                             checked={isNewMemberReserve}
                             onChange={(e) => setIsNewMemberReserve(e.target.checked)}
                             className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                           />
                          <span className={`text-sm font-bold ${isNewMemberReserve ? 'text-purple-700' : 'text-slate-600'}`}>新客預約</span>
                       </label>

                       <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${isOldMemberRenew ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                          <input 
                             type="checkbox" 
                             checked={isOldMemberRenew}
                             onChange={(e) => setIsOldMemberRenew(e.target.checked)}
                             className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                           />
                          <span className={`text-sm font-bold ${isOldMemberRenew ? 'text-indigo-700' : 'text-slate-600'}`}>舊客續課</span>
                       </label>

                       <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${isOldMemberReserve ? 'bg-cyan-50 border-cyan-200 ring-1 ring-cyan-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                          <input 
                             type="checkbox" 
                             checked={isOldMemberReserve}
                             onChange={(e) => setIsOldMemberReserve(e.target.checked)}
                             className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                           />
                          <span className={`text-sm font-bold ${isOldMemberReserve ? 'text-cyan-700' : 'text-slate-600'}`}>舊客預約</span>
                       </label>
                    </div>
                 </form>

                 {/* 來店人次統計 */}
                 <div className="mt-6 border-t border-slate-100 pt-5">
                    <div className="flex items-center gap-2 mb-3">
                       <Users size={16} className="text-slate-400"/>
                       <h4 className="text-sm font-bold text-slate-700">來店人次統計</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                       <div className="p-4 rounded-xl border border-blue-100 bg-blue-50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm">
                              <UserCheck size={18}/>
                            </div>
                            <div>
                              <div className="text-xs text-blue-600 font-bold opacity-80">舊客人次</div>
                              <div className="text-xs text-slate-400 scale-90 origin-left">使用扣點 / 單次</div>
                            </div>
                          </div>
                          <div className="text-xl font-bold text-blue-700" style={{ fontVariantNumeric: 'tabular-nums' }}>{visitStats.oldCount}</div>
                       </div>
                       
                       <div className="p-4 rounded-xl border border-rose-100 bg-rose-50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg text-rose-600 shadow-sm">
                              <UserPlus size={18}/>
                            </div>
                            <div>
                              <div className="text-xs text-rose-600 font-bold opacity-80">新客人次</div>
                              <div className="text-xs text-slate-400 scale-90 origin-left">初次體驗 (9折)</div>
                            </div>
                          </div>
                          <div className="text-xl font-bold text-rose-700" style={{ fontVariantNumeric: 'tabular-nums' }}>{visitStats.newCount}</div>
                       </div>

                       <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg text-slate-600 shadow-sm">
                              <Users size={18}/>
                            </div>
                            <div className="text-xs text-slate-600 font-bold">來店總人次</div>
                          </div>
                          <div className="text-xl font-bold text-slate-700" style={{ fontVariantNumeric: 'tabular-nums' }}>{visitStats.total}</div>
                       </div>
                    </div>

                    {/* 購課與預約詳情統計 */}
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                         <div className="p-3 rounded-xl border border-pink-100 bg-pink-50 flex flex-col items-center justify-center text-center">
                            <div className="text-xs text-pink-600 mb-1 font-bold flex items-center gap-1"><CreditCard size={12}/> 新客購課</div>
                            <div className="text-lg font-bold text-pink-700" style={{ fontVariantNumeric: 'tabular-nums' }}>{visitStats.newMemberBuy}</div>
                         </div>
                         <div className="p-3 rounded-xl border border-purple-100 bg-purple-50 flex flex-col items-center justify-center text-center">
                            <div className="text-xs text-purple-600 mb-1 font-bold flex items-center gap-1"><CalendarCheck size={12}/> 新客預約</div>
                            <div className="text-lg font-bold text-purple-700" style={{ fontVariantNumeric: 'tabular-nums' }}>{visitStats.newMemberReserve}</div>
                         </div>
                         <div className="p-3 rounded-xl border border-indigo-100 bg-indigo-50 flex flex-col items-center justify-center text-center">
                             <div className="text-xs text-indigo-600 mb-1 font-bold flex items-center gap-1"><BookOpen size={12}/> 舊客續課</div>
                             <div className="text-lg font-bold text-indigo-700" style={{ fontVariantNumeric: 'tabular-nums' }}>{visitStats.oldMemberRenew}</div>
                         </div>
                         <div className="p-3 rounded-xl border border-cyan-100 bg-cyan-50 flex flex-col items-center justify-center text-center">
                             <div className="text-xs text-cyan-600 mb-1 font-bold flex items-center gap-1"><CalendarCheck size={12}/> 舊客預約</div>
                             <div className="text-lg font-bold text-cyan-700" style={{ fontVariantNumeric: 'tabular-nums' }}>{visitStats.oldMemberReserve}</div>
                         </div>
                    </div>
                 </div>

                 {/* 付款方式統計儀表板 */}
                 <div className="mt-6 border-t border-slate-100 pt-5">
                    <div className="flex items-center gap-2 mb-3">
                       <PieChart size={16} className="text-slate-400"/>
                       <h4 className="text-sm font-bold text-slate-700">來源管道統計</h4>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                      {Object.entries(paymentStats).map(([method, amount]) => {
                          const baseStyle = getPaymentMethodStyle(method);
                          const cardStyle = baseStyle.replace('text-', 'border-').replace('bg-', 'bg-opacity-20 ');
                          return (
                              <div key={method} className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center ${cardStyle}`}>
                                 <div className="text-xs text-slate-500 mb-1 font-bold opacity-80">{method}</div>
                                 <div className="text-sm font-black text-slate-700" style={{ fontVariantNumeric: 'tabular-nums' }}>${amount.toLocaleString()}</div>
                              </div>
                          );
                      })}
                    </div>
                 </div>
              </div>

              {/* 客戶資料列表 */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-center border-collapse">
                      <thead className="text-sm text-slate-600 uppercase bg-purple-50 border-b border-purple-100 font-bold">
                        <tr>
                          <th className="p-4 w-8 whitespace-nowrap">#</th>
                          <th className="p-4 whitespace-nowrap">日期</th>
                          <th className="p-4 whitespace-nowrap">客戶名稱</th>
                          <th className="p-4 whitespace-nowrap">教練</th>
                          <th className="p-4 whitespace-nowrap">來源</th>
                          <th className="p-4 whitespace-nowrap">入金金額</th>
                          <th className="p-4 whitespace-nowrap">品名</th>
                          <th className="p-4 whitespace-nowrap">消化金額</th>
                          <th className="p-4 whitespace-nowrap">預約 / 購課</th>
                          <th className="p-4 whitespace-nowrap">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map((entry, index) => {
                             const paymentStyle = entry.paymentMethod ? getPaymentMethodStyle(entry.paymentMethod) : '';
                             return (
                               <tr key={entry.id} className={`hover:bg-slate-50 transition-colors ${editingId === entry.id ? 'bg-blue-50' : 'bg-white'}`}>
                                 <td className="p-4 text-slate-400 font-bold text-sm whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                   {filteredCustomers.length - index}
                                 </td>
                                 <td className="p-4 text-slate-500 text-sm whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{entry.date}</td>
                                 <td className="p-4 font-bold text-slate-800 text-sm whitespace-nowrap">{entry.name}</td>
                                 <td className="p-4 text-sm whitespace-nowrap">
                                   <span className={`px-2 py-1 rounded text-sm font-black border ${getPersonBadgeStyle(entry.source)}`}>
                                     {entry.source}
                                   </span>
                                 </td>
                                 <td className="p-4 text-sm whitespace-nowrap flex justify-center items-center">
                                   {entry.paymentMethod && (
                                     <span className={`px-2 py-1 rounded border text-sm font-bold flex items-center gap-1 ${paymentStyle}`}>
                                       <Wallet size={12}/>
                                       {entry.paymentMethod}
                                     </span>
                                   )}
                                 </td>
                                 <td className="p-4 font-bold text-emerald-600 text-sm whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                   {entry.deposit > 0 ? `$${entry.deposit.toLocaleString()}` : '-'}
                                 </td>
                                 <td className="p-4 text-slate-700 text-sm whitespace-nowrap font-bold">{entry.product}</td>
                                 <td className="p-4 font-bold text-amber-600 text-sm whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                   {entry.burn > 0 ? `$${entry.burn.toLocaleString()}` : '-'}
                                 </td>
                                 <td className="p-4 text-sm whitespace-nowrap">
                                    <div className="flex justify-center gap-1">
                                       {entry.isNewMemberBuy && <span className="px-2 py-0.5 rounded text-xs font-bold bg-pink-100 text-pink-700 border border-pink-200">新購</span>}
                                       {entry.isNewMemberReserve && <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">新約</span>}
                                       {entry.isOldMemberRenew && <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">舊續</span>}
                                       {entry.isOldMemberReserve && <span className="px-2 py-0.5 rounded text-xs font-bold bg-cyan-100 text-cyan-700 border border-cyan-200">舊約</span>}
                                    </div>
                                 </td>
                                 <td className="p-4 text-center whitespace-nowrap">
                                   <div className="flex items-center justify-center gap-2">
                                     <button 
                                       onClick={() => handleEditCustomer(entry)}
                                       className="text-blue-500 hover:text-blue-700 transition-colors p-1 rounded-full hover:bg-blue-50"
                                       title="編輯"
                                     >
                                       <Edit size={16} />
                                     </button>
                                     <button 
                                       onClick={() => handleDeleteCustomer(entry.id)}
                                       className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                                       title="刪除"
                                     >
                                       <Trash2 size={16} />
                                     </button>
                                   </div>
                                 </td>
                               </tr>
                             );
                          })
                        ) : (
                          <tr>
                            <td colSpan="10" className="p-12 text-slate-400">
                              <div className="flex flex-col items-center justify-center gap-2">
                                <ShoppingBag className="w-8 h-8 text-slate-200"/>
                                <p className="italic">尚無客戶記錄，請在上方新增</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                 </div>
              </div>
            </div>

          </div>
        </div>

        <div className="border-t border-slate-200 my-8"></div>

        {/* SECTION 2: 詳細記錄 */}
        <div className="space-y-6">
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-700">詳細記錄 ({viewMode === 'all' ? '全部' : viewMode}) - 每日總帳</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse">
                <thead className="text-sm text-slate-600 uppercase bg-slate-50 border-b border-slate-100 font-bold">
                  <tr>
                    <th className="p-4 whitespace-nowrap">日期</th>
                    <th className="p-4 whitespace-nowrap">教練</th>
                    <th className="p-4 whitespace-nowrap">入金金額</th>
                    <th className="p-4 whitespace-nowrap">消化金額</th>
                    <th className="p-4 whitespace-nowrap">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredEntries.length > 0 ? (
                    filteredEntries.map((entry) => (
                      <tr key={entry.id} className="bg-white hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-600 text-sm whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{entry.date}</td>
                        <td className="p-4 text-sm whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-sm font-black border ${getPersonBadgeStyle(entry.person)}`}>
                            {entry.person}
                          </span>
                        </td>
                        <td className="p-4 text-emerald-600 font-bold text-sm whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>${entry.income.toLocaleString()}</td>
                        <td className="p-4 text-amber-600 font-bold text-sm whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>${entry.consumption.toLocaleString()}</td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <button onClick={() => handleDeleteDailyEntry(entry.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50" title="刪除資料">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-8 text-gray-400 italic">尚無符合的資料，請新增</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* --- 自訂的確認清空彈跳視窗 --- */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
               <AlertTriangle size={24} />
               <h3 className="text-xl font-bold">確定要清空本月資料嗎？</h3>
            </div>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              這個操作將會永久刪除<strong>所有的「客戶消費明細」</strong>以及對應的<strong>「每日營收總帳」</strong>。<br/><br/>
              建議您在清空前，先點擊「下載備份」將資料存回您的電腦。此操作一旦執行將無法復原。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmClearAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-red-200"
              >
                確定清空
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Toast 提示訊息 --- */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in duration-300 z-50">
          <CheckSquare size={18} className="text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

    </div>
  );
};

// 輔助元件：統計卡片
const StatCard = ({ title, value, subValue, color, bgColor = "bg-white", icon, isProjection = false }) => (
  <div className={`${bgColor} p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between h-32 transition-transform hover:-translate-y-1 duration-300`}>
    <div className="flex justify-between items-start">
      <span className={`text-sm font-bold ${isProjection ? 'text-slate-600' : 'text-slate-500'}`}>{title}</span>
      {icon && <div className={`p-2 rounded-lg bg-slate-100 ${color}`}>{icon}</div>}
    </div>
    <div>
      <div className={`text-2xl font-black ${color} tracking-tight`} style={{ fontVariantNumeric: 'tabular-nums' }}>
        ${typeof value === 'number' ? value.toLocaleString() : '0'}
      </div>
      {subValue && (
        <div className="text-xs text-slate-400 mt-1 font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {subValue}
        </div>
      )}
    </div>
  </div>
);

// 輔助元件：自訂 Tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 border border-slate-100 shadow-xl rounded-xl text-sm font-bold">
        <p className="font-black text-slate-700 mb-2">{label}</p>
        {data.actualIncome !== null ? (
          <>
            <div className="flex items-center gap-2 text-emerald-600 mb-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
              <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
              <span>實際累積入金: ${data.actualIncome.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-amber-600" style={{ fontVariantNumeric: 'tabular-nums' }}>
              <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
              <span>實際累積消化: ${data.actualConsumption.toLocaleString()}</span>
            </div>
             <div className="border-t border-slate-100 my-2 pt-2 text-xs text-slate-400" style={{ fontVariantNumeric: 'tabular-nums' }}>
              本日: +${data.dailyIncome} / -${data.dailyConsumption}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-emerald-400 mb-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
              <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
              <span>預測累積入金: ${data.predIncome.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-amber-400" style={{ fontVariantNumeric: 'tabular-nums' }}>
              <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
              <span>預測累積消化: ${data.predConsumption.toLocaleString()}</span>
            </div>
            <div className="text-xs text-slate-400 mt-2 italic">AI 預測數值</div>
          </>
        )}
      </div>
    );
  }
  return null;
};

export default App;
