import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react';
import React, { useState, useEffect, useRef } from 'react';
import { Zap, Pickaxe, CheckSquare, Gift, Users, Copy, Check, Share2 } from 'lucide-react';

const BottomNavigationBar = () => {
const [activeTab, setActiveTab] = useState('mine');

const [coins, setCoins] = useState(() => {
  const saved = localStorage.getItem('coins');
  return saved ? parseInt(saved) : 0;
});

const [energy, setEnergy] = useState(() => {
  const saved = localStorage.getItem('energy');
  return saved ? parseInt(saved) : 500;
});

const [leagueName, setLeagueName] = useState(() => {
  const saved = localStorage.getItem('leagueName');
  return saved || 'Bronze';
});

// eslint-disable-next-line no-unused-vars
const [animations, setAnimations] = useState([]);

const [isRegenerating, setIsRegenerating] = useState(false);

// New upgrade states
const [tapPowerLevel, setTapPowerLevel] = useState(() => {
  const saved = localStorage.getItem('tapPowerLevel');
  return saved ? parseInt(saved) : 0;
});

const [energyCapacityLevel, setEnergyCapacityLevel] = useState(() => {
  const saved = localStorage.getItem('energyCapacityLevel');
  return saved ? parseInt(saved) : 0;
});

const [rechargingSpeedLevel, setRechargingSpeedLevel] = useState(() => {
  const saved = localStorage.getItem('rechargingSpeedLevel');
  return saved ? parseInt(saved) : 0;
});

// Daily Booster States
const [tappingGuruUses, setTappingGuruUses] = useState(() => {
  const saved = localStorage.getItem('tappingGuruUses');
  return saved ? parseInt(saved) : 3;
});

const [fullTankUses, setFullTankUses] = useState(() => {
  const saved = localStorage.getItem('fullTankUses');
  return saved ? parseInt(saved) : 3;
});

const [isTappingGuruActive, setIsTappingGuruActive] = useState(false); // Tracks if Tapping Guru is active
const [tappingGuruTimer, setTappingGuruTimer] = useState(null); // Timer for Tapping Guru

const maxEnergy = 500 + (energyCapacityLevel * 500);
const coinsPerTap = 1 + tapPowerLevel;
const energyPerClick = 1;

const [adsWatched, setAdsWatched] = useState(0);
// We'll read lastAdTime from localStorage when needed, no need for state

const [taskStatus, setTaskStatus] = useState({
  followX: 'idle',
  joinTelegram: 'idle',
  subscribeYouTube: 'idle',
  retweet: 'idle'
});

const [isVibrating, setIsVibrating] = useState(false);

// ✅ FIX: Add refs to track task timers
const taskTimersRef = useRef({
  followX: null,
  joinTelegram: null,
  subscribeYouTube: null,
  retweet: null
});

const [copied, setCopied] = useState(false);

const [isLoadingFriends, setIsLoadingFriends] = useState(false);

// Links for Task Section Change Later
const JOIN_CHANNEL_LINK = "https://t.me/moopanda1m"; // Replace with your link
const FOLLOW_X_LINK = "https://x.com/FlipgameTon"; // Replace with your X profile
const YOUTUBE_CHANNEL_LINK = "https://youtube.com/@YourChannelName";
const RETWEET_POST_LINK = "https://x.com/FlipgameTon/status/123456789";

// Calculate upgrade costs - Updated pricing
const getTapPowerCost = (level) => {
if (level === 0) return 1000;
return 1000 * Math.pow(10, level);
};

const getEnergyCapacityCost = (level) => {
if (level === 0) return 500;
return 500 * Math.pow(10, level);
};

const getRechargingSpeedCost = (level) => {
if (level === 0) return 2000;
return 2000 * Math.pow(10, level);
};

const formatCoins = (coins) => {
if (coins >= 1000000000) {
return (coins / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
}
if (coins >= 1000000) {
return (coins / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
}
if (coins >= 100000) {
return (coins / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
}
return coins.toLocaleString();
};

useEffect(() => {
  const localLeagues = [
    { name: 'Bronze', min: 0 },
    { name: 'Silver', min: 500 },
    { name: 'Gold', min: 1000 },
    { name: 'Platinum', min: 2000 },
    { name: 'Diamond', min: 3500 },
    { name: 'Master', min: 5000 },
    { name: 'Elite', min: 7500 },
    { name: 'Legend', min: 10000 },
    { name: 'Mythic', min: 15000 },
    { name: 'Immortal', min: 20000 },
  ];

  const currentLeague = localLeagues.slice().reverse().find(league => coins >= league.min);
  if (currentLeague && currentLeague.name !== leagueName) {
    setLeagueName(currentLeague.name);
  }
}, [coins, leagueName]);

const [friends, setFriends] = useState(() => {
  const saved = localStorage.getItem('friends');
  return saved ? JSON.parse(saved) : [];
});

const [friendsLoaded, setFriendsLoaded] = useState(() => {
  const saved = localStorage.getItem('friendsLoaded');
  return saved === 'true';
});

// Energy regeneration - Fixed for offline calculation
useEffect(() => {
  // First, check for offline regeneration
  const lastEnergyTime = localStorage.getItem('lastEnergyTime');
  if (lastEnergyTime && energy < maxEnergy) {
    const now = Date.now();
    const timeDiff = now - parseInt(lastEnergyTime);
    const secondsOffline = timeDiff / 1000;
    
    if (secondsOffline > 0) {
      const energyPerSecond = 0.0463 + (rechargingSpeedLevel * 0.00926);
      const energyToAdd = secondsOffline * energyPerSecond;
      
      setEnergy(prev => {
        const newEnergy = Math.min(prev + energyToAdd, maxEnergy);
        return newEnergy;
      });
    }
  }

  // Then start the normal interval for when app is open
  let interval;

  if (energy < maxEnergy) {
    setIsRegenerating(true);

    interval = setInterval(() => {
      const energyPerSecond = 0.0463 + (rechargingSpeedLevel * 0.00926);

      setEnergy(prev => {
        const newEnergy = Math.min(prev + energyPerSecond, maxEnergy);
        if (newEnergy === maxEnergy) {
          setIsRegenerating(false);
        }
        return newEnergy;
      });
    }, 1000);
  } else {
    setIsRegenerating(false);
  }

  return () => clearInterval(interval);
}, [energy, maxEnergy, rechargingSpeedLevel]);


useEffect(() => {
  const storedTime = localStorage.getItem('lastAdTime');
  const storedAds = localStorage.getItem('adsWatched');
  const storedTappingGuru = localStorage.getItem('tappingGuruUses');
  const storedFullTank = localStorage.getItem('fullTankUses');

  const now = Date.now();

  if (storedTime && storedAds) {
    const diff = now - parseInt(storedTime);

    if (diff >= 24 * 60 * 60 * 1000) {
      // 24 hours passed → Reset everything
      localStorage.setItem('adsWatched', '0');
      localStorage.setItem('tappingGuruUses', '3');
      localStorage.setItem('fullTankUses', '3');
      localStorage.setItem('lastAdTime', now.toString());

      setAdsWatched(0);
      setTappingGuruUses(3);
      setFullTankUses(3);
    } else {
      // Less than 24h → load saved values
      setAdsWatched(parseInt(storedAds));
      setTappingGuruUses(storedTappingGuru ? parseInt(storedTappingGuru) : 3);
      setFullTankUses(storedFullTank ? parseInt(storedFullTank) : 3);
    }
  } else {
    // First time → initialize
    localStorage.setItem('lastAdTime', now.toString());
    localStorage.setItem('adsWatched', '0');
    localStorage.setItem('tappingGuruUses', '3');
    localStorage.setItem('fullTankUses', '3');

    setAdsWatched(0);
    setTappingGuruUses(3);
    setFullTankUses(3);
  }

  // ✅ Load task status from localStorage
  const savedTaskStatus = localStorage.getItem('taskStatus');
  if (savedTaskStatus) {
    setTaskStatus(JSON.parse(savedTaskStatus));
  }
}, []);

useEffect(() => {
  localStorage.setItem('coins', coins);
}, [coins]);

useEffect(() => {
  localStorage.setItem('energy', energy);
}, [energy]);

useEffect(() => {
  localStorage.setItem('leagueName', leagueName);
}, [leagueName]);

useEffect(() => {
  localStorage.setItem('energyCapacityLevel', energyCapacityLevel);
}, [energyCapacityLevel]);

useEffect(() => {
  localStorage.setItem('tapPowerLevel', tapPowerLevel);
}, [tapPowerLevel]);

useEffect(() => {
  localStorage.setItem('rechargingSpeedLevel', rechargingSpeedLevel);
}, [rechargingSpeedLevel]);

useEffect(() => {
  localStorage.setItem('tappingGuruUses', tappingGuruUses);
}, [tappingGuruUses]);

useEffect(() => {
  localStorage.setItem('fullTankUses', fullTankUses);
}, [fullTankUses]);

useEffect(() => {
  localStorage.setItem('lastEnergyTime', Date.now().toString());
}, [energy])

useEffect(() => {
  localStorage.setItem('friends', JSON.stringify(friends));
}, [friends]);

useEffect(() => {
  localStorage.setItem('friendsLoaded', friendsLoaded.toString());
}, [friendsLoaded]);

// ✅ Cleanup timers on unmount
useEffect(() => {
  // Capture the ref at effect setup time
  const timersRef = taskTimersRef;
  
  return () => {
    // Use the captured ref in cleanup
    const timers = timersRef.current;
    if (timers) {
      Object.values(timers).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    }
  };
}, []);

// Get Telegram user at startup
const [userId, setUserId] = useState(null);
const [userName, setUserName] = useState('User');

// Get Telegram user at startup - IMPROVED VERSION
useEffect(() => {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    try {
      tg.ready();
    } catch (e) {
      console.warn('TG ready error', e);
    }

    const user = tg.initDataUnsafe?.user;
    let startParam = tg.initDataUnsafe?.start_param || null;

    if (!startParam) {
      const urlParams = new URLSearchParams(window.location.search);
      startParam =
        urlParams.get('startapp') ||
        urlParams.get('tgWebAppStartParam') ||
        urlParams.get('start') ||
        null;
    }

    if (user) {
      const tgId = user.id.toString();
      const username =
        user.username ||
        user.first_name ||
        (user.last_name ? `${user.first_name || ''} ${user.last_name}`.trim() : null) ||
        `user_${tgId.slice(-6)}`;

      setUserId(tgId);
      
      // 🔥 KEY FIX: Only update username if we don't have one stored or if this is a better one
      const storedUsername = localStorage.getItem('userName');
      if (!storedUsername || storedUsername.startsWith('user_') || storedUsername === 'Friend') {
        setUserName(username);
        localStorage.setItem('userName', username);
      } else {
        setUserName(storedUsername); // Keep the existing good username
      }

      localStorage.setItem('userId', tgId);

      if (startParam) {
        localStorage.setItem('referrerId', startParam);
      }
    }
  } else {
    // Fallback if Telegram WebApp context not present
    const fallbackId =
      localStorage.getItem('userId') ||
      Math.random().toString(36).substr(2, 9);
    const storedUsername = localStorage.getItem('userName');
    
    setUserId(fallbackId);
    setUserName(storedUsername || 'Friend'); // Use stored username if available
    
    if (!localStorage.getItem('userId')) {
      localStorage.setItem('userId', fallbackId);
    }
  }
}, []);

// Handle referral on load
useEffect(() => {
  if (!userId) return;

  const tg = window.Telegram?.WebApp;
  let referrerId = null;

  // 1. Telegram-provided start_param (best case)
  if (tg && tg.initDataUnsafe?.start_param) {
    referrerId = tg.initDataUnsafe.start_param;
  }

  // 2. URL fallback (some clients append ?startapp= or ?tgWebAppStartParam=)
  if (!referrerId) {
    const urlParams = new URLSearchParams(window.location.search);
    referrerId =
      urlParams.get('startapp') ||
      urlParams.get('tgWebAppStartParam') ||
      urlParams.get('start') ||
      null;
  }

  // 3. LocalStorage fallback (set earlier in the first useEffect)
  if (!referrerId) {
    referrerId = localStorage.getItem('referrerId');
  }

  // Don’t allow self-referral
  if (!referrerId || referrerId === userId) return;

  // Prevent duplicate processing
  const processedKey = `referral_processed_${userId}`;
  if (localStorage.getItem(processedKey)) return;
  localStorage.setItem(processedKey, 'true');

  // Call backend to handle referral
  fetch('/api/handleReferral', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      referrerId,
      refereeId: userId,
      refereeUsername: userName
    })
  })
    .then(res => res.json())
    .then(async data => {
  if (data.success) {
    // Refresh profile + friends to reflect DB changes
    // Skip coin sync since referral already handled server coins
    await fetchProfileAndFriends(userId, true);
    
    // Optional: show a small notice to user
    alert('Referral recorded — thanks for joining!');
  } else {
    console.warn('Referral API:', data);
  }
})
    .catch(err => {
      console.error('Referral failed:', err);
    });

}, [userId, userName]);

// Sync coins to server periodically
useEffect(() => {
  if (!userId) return;

  const syncInterval = setInterval(() => {
    const localCoins = parseInt(localStorage.getItem('coins') || '0');
    if (localCoins > 0) {
      console.log('Auto-syncing coins:', localCoins);
      
      fetch('/api/syncCoins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          localCoins
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCoins(data.newTotalCoins);
          localStorage.setItem('coins', '0');
          console.log('Auto-sync successful:', data);
        }
      })
      .catch(err => console.error('Auto-sync failed:', err));
    }
  }, 30000); // Sync every 30 seconds

  return () => clearInterval(syncInterval);
}, [userId]);

const handleCoinClick = (e) => {
// Only vibrate if not already vibrating
  if (navigator.vibrate && !isVibrating) {
    navigator.vibrate(5);
    setIsVibrating(true);
    // Reset after 100ms to allow next vibration
    setTimeout(() => setIsVibrating(false), 100);
  }
if (energy >= energyPerClick || isTappingGuruActive) {
const baseCoins = isTappingGuruActive ? 10 : coinsPerTap;
setCoins(prev => prev + baseCoins);
if (!isTappingGuruActive) {
setEnergy(prev => prev - energyPerClick);
}
const clickX = e.clientX;
const clickY = e.clientY;
const newAnimation = {
id: Date.now() + Math.random(),
x: clickX,
y: clickY,
show: true,
amount: baseCoins
};
setAnimations(prev => [...prev, newAnimation]);
setTimeout(() => {
setAnimations(prev => prev.filter(anim => anim.id !== newAnimation.id));
}, 1000);
}
};

const handleTapPowerUpgrade = () => {
const cost = getTapPowerCost(tapPowerLevel);
if (coins >= cost) {
setCoins(prev => prev - cost);
setTapPowerLevel(prev => prev + 1);
}
};

const handleEnergyCapacityUpgrade = () => {
const cost = getEnergyCapacityCost(energyCapacityLevel);
if (coins >= cost) {
setCoins(prev => prev - cost);
setEnergyCapacityLevel(prev => prev + 1);
setEnergy(prev => prev + 500); // Add the new energy immediately
}
};

const handleRechargingSpeedUpgrade = () => {
const cost = getRechargingSpeedCost(rechargingSpeedLevel);
if (coins >= cost) {
setCoins(prev => prev - cost);
setRechargingSpeedLevel(prev => prev + 1);
}
};

const handleTappingGuru = () => {
  if (tappingGuruUses > 0) {
    setTappingGuruUses(prev => prev - 1);
    setIsTappingGuruActive(true);

    // ✅ Clear old timer if it exists
    if (tappingGuruTimer) {
      clearTimeout(tappingGuruTimer);
    }

    const timer = setTimeout(() => {
      setIsTappingGuruActive(false);
    }, 15000); // 15 seconds

    setTappingGuruTimer(timer); // Now we use the timer
  }
};

const handleFullTank = () => {
if (fullTankUses > 0) {
setFullTankUses(prev => prev - 1);
setEnergy(maxEnergy);
}
};

const handleWatchAd = () => {
  if (adsWatched >= 5) {
    alert("You've already watched 5 ads in the last 24 hours.");
    return;
  }

// eslint-disable-next-line no-undef
if (typeof show_9659061 === 'function') {
  // eslint-disable-next-line no-undef
  show_9659061().then(() => {
    alert('You earned 1000 coins!');
    setCoins(prev => prev + 1000);
    const newCount = adsWatched + 1;
    setAdsWatched(newCount);
    localStorage.setItem('adsWatched', newCount.toString());
    localStorage.setItem('lastAdTime', Date.now().toString());
  }).catch(err => {
    alert('Ad failed to load. Please try again later.');
    console.error(err);
  });
} else {
  alert('Ad is not ready yet. Try again in a few seconds.');
}

};

const startJoinTelegramTask = () => {
  // Clear existing timer if any
  if (taskTimersRef.current.joinTelegram) {
    clearTimeout(taskTimersRef.current.joinTelegram);
  }
  
  // Only start if task is in idle state
  if (taskStatus.joinTelegram !== 'idle') {
    return;
  }

  setTaskStatus(prev => ({ ...prev, joinTelegram: 'loading' }));
  window.open(JOIN_CHANNEL_LINK, '_blank');
  
  taskTimersRef.current.joinTelegram = setTimeout(() => {
    setTaskStatus(prev => {
      if (prev.joinTelegram === 'loading') {
        return { ...prev, joinTelegram: 'canClaim' };
      }
      return prev;
    });
    taskTimersRef.current.joinTelegram = null;
  }, 10000);
};

const startFollowXTask = () => {
  if (taskTimersRef.current.followX) {
    clearTimeout(taskTimersRef.current.followX);
  }
  
  if (taskStatus.followX !== 'idle') {
    return;
  }

  setTaskStatus(prev => ({ ...prev, followX: 'loading' }));
  window.open(FOLLOW_X_LINK, '_blank');
  
  taskTimersRef.current.followX = setTimeout(() => {
    setTaskStatus(prev => {
      if (prev.followX === 'loading') {
        return { ...prev, followX: 'canClaim' };
      }
      return prev;
    });
    taskTimersRef.current.followX = null;
  }, 10000);
};

const startSubscribeYouTubeTask = () => {
  if (taskTimersRef.current.subscribeYouTube) {
    clearTimeout(taskTimersRef.current.subscribeYouTube);
  }
  
  if (taskStatus.subscribeYouTube !== 'idle') {
    return;
  }

  setTaskStatus(prev => ({ ...prev, subscribeYouTube: 'loading' }));
  window.open(YOUTUBE_CHANNEL_LINK, '_blank');
  
  taskTimersRef.current.subscribeYouTube = setTimeout(() => {
    setTaskStatus(prev => {
      if (prev.subscribeYouTube === 'loading') {
        return { ...prev, subscribeYouTube: 'canClaim' };
      }
      return prev;
    });
    taskTimersRef.current.subscribeYouTube = null;
  }, 10000);
};

const startRetweetTask = () => {
  if (taskTimersRef.current.retweet) {
    clearTimeout(taskTimersRef.current.retweet);
  }
  
  if (taskStatus.retweet !== 'idle') {
    return;
  }

  setTaskStatus(prev => ({ ...prev, retweet: 'loading' }));
  window.open(RETWEET_POST_LINK, '_blank');
  
  taskTimersRef.current.retweet = setTimeout(() => {
    setTaskStatus(prev => {
      if (prev.retweet === 'loading') {
        return { ...prev, retweet: 'canClaim' };
      }
      return prev;
    });
    taskTimersRef.current.retweet = null;
  }, 10000);
};

const fetchProfileAndFriends = async (uid = userId, skipCoinSync = false) => {
  if (!uid) {
    console.warn('No userId provided to fetchProfileAndFriends');
    return;
  }
  
  setIsLoadingFriends(true);
  
  try {
    console.log('Fetching profile and friends for user:', uid);
    
    // First, sync local coins to server (unless we're skipping)
    if (!skipCoinSync) {
      const localCoins = parseInt(localStorage.getItem('coins') || '0');
      if (localCoins > 0) {
        console.log('Syncing local coins to server:', localCoins);
        
        const syncRes = await fetch('/api/syncCoins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: uid,
            localCoins: localCoins
          })
        });

        if (syncRes.ok) {
          const syncData = await syncRes.json();
          console.log('Coins synced successfully:', syncData);
          
          setCoins(syncData.newTotalCoins);
          localStorage.setItem('coins', '0');
        } else {
          console.warn('Failed to sync coins:', await syncRes.text());
        }
      }
    }
    
    // Then fetch updated profile
    const pRes = await fetch(`/api/getProfile?userId=${encodeURIComponent(uid)}`);
    if (pRes.ok) {
      const { profile } = await pRes.json();
      console.log('Profile fetched:', profile);
      if (profile) {
        setCoins(Number(profile.coins || 0));
        
        // 🔥 KEY FIX: Only update username if we get a better one
        if (profile.username && 
            profile.username !== 'Friend' && 
            !profile.username.startsWith('user_')) {
          setUserName(profile.username);
          localStorage.setItem('userName', profile.username);
        }
      }
    } else {
      const errorText = await pRes.text();
      console.warn('getProfile failed:', pRes.status, errorText);
    }

    const fRes = await fetch(`/api/getFriends?userId=${encodeURIComponent(uid)}`);
    if (fRes.ok) {
      const { friends: serverFriends } = await fRes.json();
      console.log('Friends fetched:', serverFriends);
      setFriends(serverFriends || []);
      setFriendsLoaded(true);
    } else {
      const errorText = await fRes.text();
      console.warn('getFriends failed:', fRes.status, errorText);
    }
  } catch (err) {
    console.error('fetchProfileAndFriends error:', err);
  } finally {
    setIsLoadingFriends(false);
  }
};


const handleCopyLink = async () => {
  const link = `https://t.me/Zapcoinnbot?startapp=${encodeURIComponent(userId)}`;
  try {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch (err) {
    alert('Link copied!');
  }
};

const handleRefreshFriends = () => {
  if (userId && !isLoadingFriends) {
    console.log('Manual refresh triggered');
    fetchProfileAndFriends(userId);
  }
};

const handleShareInvite = () => {
  const link = `https://t.me/Zapcoinnbot?startapp=${encodeURIComponent(userId)}`;
  const text = `Hey! Join me in Zapcoin and earn TON! ${link}`;
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
  window.open(shareUrl, '_blank');
};

const tabs = [
{ id: 'upgrades', label: 'Upgrades', icon: Zap },
{ id: 'friends', label: 'Friends', icon: Users },
{ id: 'mine', label: 'Mine', icon: Pickaxe },
{ id: 'task', label: 'Task', icon: CheckSquare },
{ id: 'airdrop', label: 'Airdrop', icon: Gift }
];

// Get connected wallet
const wallet = useTonWallet();

return (
    <div className="min-h-screen bg-gray-900 flex flex-col overflow-hidden">
{/* Prevent scrolling */}
<style dangerouslySetInnerHTML={{
  __html: `
    * {
      touch-action: manipulation;
      -webkit-user-select: none;
      -webkit-tap-highlight-color: transparent;
    }

    input, button, select, textarea {
      font-size: 16px;
    }

    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      overflow: hidden;  /* 🔒 Lock scroll */
      position: fixed;
      width: 100%;
      background: #000;
    }

    @keyframes fadeUp {
      0% { opacity: 1; transform: translateY(0px) translateX(-50%); }
      100% { opacity: 0; transform: translateY(-50px) translateX(-50%); }
    }
  `
}}></style>
{/* Main Content with proper spacing for navigation */}
<div className="flex-1 flex items-center justify-center p-4 pt-8 pb-40">

{activeTab === 'upgrades' ? (
<div className="w-full max-w-md mx-auto">
{/* Header */}
<div className="text-center mb-6">
<h2 className="text-white text-2xl font-bold mb-2">Upgrades</h2>
<div className="flex items-center justify-center gap-3">
<div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center text-yellow-900 font-bold text-sm border-2 border-yellow-400">
₿
</div>
<span className="text-white text-xl font-bold">
{formatCoins(coins)}
</span>
</div>
</div>
{/* Daily Boosters Section */}
<div className="mb-6">
<h3 className="text-white text-xl font-bold mb-4">Your daily boosters:</h3>
<div className="grid grid-cols-2 gap-4">
{/* Tapping */}
<button
onClick={handleTappingGuru}
disabled={tappingGuruUses <= 0}
className={`
bg-gray-800 border border-gray-700 rounded-2xl p-4 shadow-lg
transition-all duration-200 hover:bg-gray-750
${tappingGuruUses > 0 ? 'cursor-pointer hover:border-gray-600' : 'cursor-not-allowed opacity-50'}
`}
>
<div className="flex items-center gap-3">
<div className="text-4xl">🔥</div>
<div className="text-left">
<p className="text-white text-lg font-bold">Tapping</p>
<p className="text-gray-400 text-sm">{tappingGuruUses}/3</p>
</div>
</div>
</button>
{/* Full Tank */}
<button
onClick={handleFullTank}
disabled={fullTankUses <= 0}
className={`
bg-gray-800 border border-gray-700 rounded-2xl p-4 shadow-lg
transition-all duration-200 hover:bg-gray-750
${fullTankUses > 0 ? 'cursor-pointer hover:border-gray-600' : 'cursor-not-allowed opacity-50'}
`}
>
<div className="flex items-center gap-3">
<div className="text-4xl">⚡</div>
<div className="text-left">
<p className="text-white text-lg font-bold">Full Tank</p>
<p className="text-gray-400 text-sm">{fullTankUses}/3</p>
</div>
</div>
</button>
</div>
</div>
{/* Boosters Section */}
<div>
<h3 className="text-white text-xl font-bold mb-4">Boosters:</h3>
<div className="space-y-4">
{/* Multitap Upgrade */}
<button
onClick={handleTapPowerUpgrade}
disabled={coins < getTapPowerCost(tapPowerLevel)}
className={`
w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 shadow-lg
transition-all duration-200 hover:bg-gray-750
${coins >= getTapPowerCost(tapPowerLevel) ? 'cursor-pointer hover:border-gray-600' : 'cursor-not-allowed opacity-50'}
`}
>
<div className="flex items-center justify-between">
<div className="flex items-center gap-4">
<div className="text-4xl">✋</div>
<div className="text-left">
<h3 className="text-white text-lg font-bold">Multitap</h3>
<div className="flex items-center gap-2">
<div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center text-yellow-900 font-bold text-xs border border-yellow-400">
₿
</div>
<span className="text-white text-sm font-bold">
{formatCoins(getTapPowerCost(tapPowerLevel))}
</span>
<span className="text-gray-400 text-sm">| {tapPowerLevel + 1} level</span>
</div>
</div>
</div>
<div className="text-gray-400 text-2xl">
❯
</div>
</div>
</button>

{/* Energy Limit Upgrade */}
<button
onClick={handleEnergyCapacityUpgrade}
disabled={coins < getEnergyCapacityCost(energyCapacityLevel)}
className={`
w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 shadow-lg
transition-all duration-200 hover:bg-gray-750
${coins >= getEnergyCapacityCost(energyCapacityLevel) ? 'cursor-pointer hover:border-gray-600' : 'cursor-not-allowed opacity-50'}
`}
>
<div className="flex items-center justify-between">
<div className="flex items-center gap-4">
<div className="text-4xl">🔋</div>
<div>
<h3 className="text-white text-lg font-bold">Energy Limit</h3>
<div className="flex items-center gap-2">
<div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center text-yellow-900 font-bold text-xs border border-yellow-400">
₿
</div>
<span className="text-white text-sm font-bold">
{formatCoins(getEnergyCapacityCost(energyCapacityLevel))}
</span>
<span className="text-gray-400 text-sm">| {energyCapacityLevel + 1} level</span>
</div>
</div>
</div>
<div className="text-gray-400 text-2xl">
❯
</div>
</div>
</button>

{/* Recharging Speed Upgrade */}
<button
onClick={handleRechargingSpeedUpgrade}
disabled={coins < getRechargingSpeedCost(rechargingSpeedLevel)}
className={`
w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 shadow-lg
transition-all duration-200 hover:bg-gray-750
${coins >= getRechargingSpeedCost(rechargingSpeedLevel) ? 'cursor-pointer hover:border-gray-600' : 'cursor-not-allowed opacity-50'}
`}
>
<div className="flex items-center justify-between">
<div className="flex items-center gap-4">
<div className="text-4xl">⚡</div>
<div>
<h3 className="text-white text-lg font-bold">Recharging Speed</h3>
<div className="flex items-center gap-2">
<div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center text-yellow-900 font-bold text-xs border border-yellow-400">
₿
</div>
<span className="text-white text-sm font-bold">
{formatCoins(getRechargingSpeedCost(rechargingSpeedLevel))}
</span>
<span className="text-gray-400 text-sm">| {rechargingSpeedLevel + 1} level</span>
</div>
</div>
</div>
<div className="text-gray-400 text-2xl">
❯
</div>
</div>
</button>
</div>
</div>
</div>
) : activeTab === 'mine' ? (
<>
  {/* Top Section: League Badge*/}
  <div className="fixed top-4 left-0 right-0 z-40 px-4">
    {/* League Badge */}
    <div className="flex justify-center mb-4">
      <div className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 text-white text-sm font-semibold shadow-md border border-purple-400">
        League: {leagueName}
      </div>
    </div>
     
    {/* Coin Counter directly below badge */}
<div className="flex items-center justify-center gap-1">
  <img src="/icons/coin2.png" alt="Coin" className="w-14 h-14" />
  <h2 className="text-white text-5xl font-black leading-none">
    {formatCoins(coins)}
  </h2>
</div>
  </div>

  {/* Middle: Big Tap Coin (Centered) */}
<div className="flex-1 flex items-center justify-center mt-14">
  <button
    onClick={handleCoinClick}
    disabled={energy < energyPerClick && !isTappingGuruActive}
    style={{ touchAction: 'manipulation' }}
    className={`
      w-80 h-80 relative flex items-center justify-center
      transition-all duration-200 active:scale-95 
      ${energy >= energyPerClick || isTappingGuruActive
        ? 'cursor-pointer hover:scale-105'
        : 'opacity-50 cursor-not-allowed'
      }
    `}
  >
    <img
      src="/icons/coin.png"
      alt="Tap Coin"
      className="w-full h-full object-contain"
    />
  </button>
  
  {/* Animation Effects */}
  {animations.map((animation) => (
    <div
      key={animation.id}
      className="fixed pointer-events-none z-50 text-white font-bold text-3xl"
      style={{
        left: animation.x,
        top: animation.y,
        transform: 'translateX(-50%)',
        animation: 'fadeUp 1s ease-out forwards'
      }}
    >
      +{animation.amount}
    </div>
  ))}
</div>

  {/* Bottom: Energy Bar - FIXED POSITION */}
  <div className="fixed bottom-20 left-0 right-0 px-4 z-40">
    <div className="w-full max-w-md mx-auto">
      {/* Energy text ABOVE the bar */}
      <div className="flex justify-between items-center text-base text-gray-400 mb-3"> {/* Changed text-xs to text-sm, moved above */}
        <span>⚡ Energy</span>
        <span>{Math.floor(energy)}/{maxEnergy}</span>
      </div>
      {/* Energy bar */}
      <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner">
        <div
          className={`
            h-full transition-all duration-300 rounded-full
            ${isRegenerating
              ? 'bg-gradient-to-r from-blue-500 to-cyan-400 shadow-lg'
              : 'bg-gradient-to-r from-gray-500 to-gray-400'
            }
          `}
          style={{ width: `${(energy / maxEnergy) * 100}%` }}
        />
      </div>
    </div>
  </div>
</>
) : activeTab === 'task' ? (
<div className="w-full max-w-md mx-auto text-center">
  {/* Header */}
    <h2 className="text-white text-2xl font-bold mb-6">More Tasks, More Rewards</h2>
{/* Watch Ad Section */}
<div
  className={`bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-6 shadow-lg cursor-pointer transition ${
    adsWatched >= 5 ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-700'
  }`}
  onClick={adsWatched >= 5 ? undefined : handleWatchAd}
>
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 bg-gray-700 rounded-2xl flex items-center justify-center">
        <span className="text-white text-xl font-bold">AD</span>
      </div>
      <div className="text-left">
        <h3 className="text-white text-lg font-semibold mb-1">Watch ad to earn</h3>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center text-yellow-900 font-bold text-xs border border-yellow-400">
            ₿
          </div>
          <span className="text-white text-xl font-bold">1,000</span>
        </div>
      </div>
    </div>
  </div>

  {/* Dynamic Progress Bar */}
  <div className="w-full bg-gray-700 rounded-full h-2 mb-3 overflow-hidden">
    <div
      className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-full rounded-full transition-all duration-500"
      style={{ width: `${(adsWatched / 5) * 100}%` }}
    ></div>
  </div>

  {/* Status Text */}
  <p className="text-gray-400 text-sm">
    {adsWatched >= 5
      ? 'Daily limit reached. Reset in 24h.'
      : `${adsWatched}/5 ads watched today`}
  </p>
</div>

{/* Tasks Section */}
<div className="text-left">
  <h2 className="text-white text-2xl font-bold mb-6">Tasks</h2>

  {/* ✅ Scrollable Container */}
  <div className="overflow-y-auto max-h-[55vh] pr-2 space-y-4 pb-28" style={{ WebkitOverflowScrolling: 'touch' }}>

    {/* Join Channel Task */}
<div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 shadow-lg">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <img src="/icons/telegram.png" alt="Telegram" className="w-12 h-12 rounded-2xl" />
      <div>
        <h3 className="text-white text-lg font-semibold">Join channel</h3>
        <p className="text-yellow-400 font-bold text-sm">+5,000 coins</p>
      </div>
    </div>

    {taskStatus.joinTelegram === 'idle' && (
      <button
        onClick={startJoinTelegramTask}
        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-semibold transition"
      >
        START
      </button>
    )}

    {taskStatus.joinTelegram === 'loading' && (
      <div className="flex items-center gap-2 px-6 py-2 bg-gray-700 rounded-xl">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-300 text-sm">Verifying...</span>
      </div>
    )}

    {taskStatus.joinTelegram === 'canClaim' && (
      <button
        onClick={() => {
  if (taskStatus.joinTelegram === 'canClaim') {
    setCoins(prev => prev + 5000);
    const newStatus = { ...taskStatus, joinTelegram: 'claimed' };
    setTaskStatus(newStatus);
    localStorage.setItem('taskStatus', JSON.stringify(newStatus));
    if (taskTimersRef.current.joinTelegram) {
      clearTimeout(taskTimersRef.current.joinTelegram);
      taskTimersRef.current.joinTelegram = null;
    }
  }
}}
        className="bg-yellow-500 hover:bg-yellow-400 text-white px-6 py-2 rounded-xl font-semibold transition"
      >
        CLAIM
      </button>
    )}

    {taskStatus.joinTelegram === 'claimed' && (
      <div className="bg-gray-700 text-white px-6 py-2 rounded-xl font-semibold">
        Claimed
      </div>
    )}
  </div>
</div>

    {/* Follow X Task */}
<div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 shadow-lg">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <img src="/icons/x.png" alt="X" className="w-12 h-12 rounded-2xl" />
      <div>
        <h3 className="text-white text-lg font-semibold">Follow on X</h3>
        <p className="text-yellow-400 font-bold text-sm">+5,000 coins</p>
      </div>
    </div>

    {/* Show START Button */}
    {taskStatus.followX === 'idle' && (
      <button
        onClick={startFollowXTask}
        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-semibold transition"
      >
        START
      </button>
    )}

    {/* Show Loading Spinner */}
    {taskStatus.followX === 'loading' && (
      <div className="flex items-center gap-2 px-6 py-2 bg-gray-700 rounded-xl">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-300 text-sm">Verifying...</span>
      </div>
    )}

    {/* Show CLAIM Button */}
    {taskStatus.followX === 'canClaim' && (
      <button
        onClick={() => {
  if (taskStatus.followX === 'canClaim') {
    setCoins(prev => prev + 5000);
    const newStatus = { ...taskStatus, followX: 'claimed' };
    setTaskStatus(newStatus);
    localStorage.setItem('taskStatus', JSON.stringify(newStatus));
    if (taskTimersRef.current.followX) {
      clearTimeout(taskTimersRef.current.followX);
      taskTimersRef.current.followX = null;
    }
  }
}}
        className="bg-yellow-500 hover:bg-yellow-400 text-white px-6 py-2 rounded-xl font-semibold transition"
      >
        CLAIM
      </button>
    )}

    {/* Show Claimed */}
    {taskStatus.followX === 'claimed' && (
      <div className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-xl font-semibold transition-colors">
        Claimed
      </div>
    )}
  </div>
</div>

    {/* YouTube Task */}
<div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 shadow-lg">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <img src="/icons/youtube.png" alt="YouTube" className="w-12 h-12 rounded-2xl" />
      <div>
        <h3 className="text-white text-lg font-semibold">Subscribe to YouTube</h3>
        <p className="text-yellow-400 font-bold text-sm">+5,000 coins</p>
      </div>
    </div>

    {taskStatus.subscribeYouTube === 'idle' && (
      <button
        onClick={startSubscribeYouTubeTask}
        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-semibold transition"
      >
        START
      </button>
    )}

    {taskStatus.subscribeYouTube === 'loading' && (
      <div className="flex items-center gap-2 px-6 py-2 bg-gray-700 rounded-xl">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-300 text-sm">Verifying...</span>
      </div>
    )}

    {taskStatus.subscribeYouTube === 'canClaim' && (
      <button
        onClick={() => {
  if (taskStatus.subscribeYouTube === 'canClaim') {
    setCoins(prev => prev + 5000);
    const newStatus = { ...taskStatus, subscribeYouTube: 'claimed' };
    setTaskStatus(newStatus);
    localStorage.setItem('taskStatus', JSON.stringify(newStatus));
    if (taskTimersRef.current.subscribeYouTube) {
      clearTimeout(taskTimersRef.current.subscribeYouTube);
      taskTimersRef.current.subscribeYouTube = null;
    }
  }
}}
        className="bg-yellow-500 hover:bg-yellow-400 text-white px-6 py-2 rounded-xl font-semibold transition"
      >
        CLAIM
      </button>
    )}

    {taskStatus.subscribeYouTube === 'claimed' && (
      <div className="bg-gray-700 text-white px-6 py-2 rounded-xl font-semibold">
        Claimed
      </div>
    )}
  </div>
</div>

    {/* Retweet Post Task */}
<div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 shadow-lg">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <img src="/icons/x.png" alt="X" className="w-12 h-12 rounded-2xl" />
      <div>
        <h3 className="text-white text-lg font-semibold">Retweet Our Post</h3>
        <p className="text-yellow-400 font-bold text-sm">+3,000 coins</p>
      </div>
    </div>

    {taskStatus.retweet === 'idle' && (
      <button
        onClick={startRetweetTask}
        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-semibold transition"
      >
        START
      </button>
    )}

    {taskStatus.retweet === 'loading' && (
      <div className="flex items-center gap-2 px-6 py-2 bg-gray-700 rounded-xl">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-gray-300 text-sm">Verifying...</span>
      </div>
    )}

    {taskStatus.retweet === 'canClaim' && (
      <button
        onClick={() => {
  if (taskStatus.retweet === 'canClaim') {
    setCoins(prev => prev + 5000);
    const newStatus = { ...taskStatus, retweet: 'claimed' };
    setTaskStatus(newStatus);
    localStorage.setItem('taskStatus', JSON.stringify(newStatus));
    if (taskTimersRef.current.retweet) {
      clearTimeout(taskTimersRef.current.retweet);
      taskTimersRef.current.retweet = null;
    }
  }
}}
        className="bg-yellow-500 hover:bg-yellow-400 text-white px-6 py-2 rounded-xl font-semibold transition"
      >
        CLAIM
      </button>
    )}

    {taskStatus.retweet === 'claimed' && (
      <div className="bg-gray-700 text-white px-6 py-2 rounded-xl font-semibold">
        Claimed
      </div>
    )}
  </div>
</div>

</div>
</div>
</div>
) : activeTab === 'airdrop' ? (
  <div className="w-full max-w-md mx-auto text-center px-4">
    {/* Main Airdrop Heading */}
    <h2 className="text-white text-4xl font-bold mb-8 mt-4">Airdrop 🎁</h2>

    {/* Real TON Connect Button */}
<div className="flex justify-center mb-6">
  <TonConnectButton>
  {wallet ? 'Disconnect' : 'Connect Wallet'}
</TonConnectButton>
</div>
    {/* Roadmap Title - Left Aligned */}
    <h2 className="text-white text-2xl font-bold mb-4 text-left pl-1">
      Roadmap
    </h2>

    {/* Phase Cards */}
    <div className="space-y-4">
      {/* Phase 1: Beta Test */}
      <div className="bg-gray-800 border border-green-500 rounded-xl p-5 text-left shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              1
            </div>
            <div>
              <h3 className="text-white font-bold">Phase #1: Beta Test</h3>
              <p className="text-gray-400 text-sm">Tap-to-Earn app published</p>
            </div>
          </div>
          {/* No status badge - empty div for alignment */}
          <div className="w-16"></div>
        </div>
      </div>

      {/* Phase 2: Mining */}
      <div className="bg-gray-800 border border-yellow-500 rounded-xl p-5 text-left shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              2
            </div>
            <div>
              <h3 className="text-white font-bold">Phase #2: Mining</h3>
              <p className="text-gray-400 text-sm">Earn as much as possible</p>
            </div>
          </div>
          <div className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">Active</div>
        </div>
      </div>

      {/* Phase 3: Listing Day */}
      <div className="bg-gray-800 border border-gray-600 rounded-xl p-5 text-left shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              3
            </div>
            <div>
              <h3 className="text-white font-bold">Phase #3: Community</h3>
              <p className="text-gray-400 text-sm">1 million active members</p>
            </div>
          </div>
          {/* No status - just empty space for alignment */}
          <div className="w-16"></div>
        </div>
      </div>

      {/* Phase 4: New Era */}
      <div className="bg-gray-800 border border-gray-600 rounded-xl p-5 text-left shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              4
            </div>
            <div>
              <h3 className="text-white font-bold">Phase #4: Airdrop</h3>
              <p className="text-gray-400 text-sm">Tokens Distribution</p>
            </div>
          </div>
          {/* No status - just empty space */}
          <div className="w-16"></div>
        </div>
      </div>
    </div>
  </div>
) : activeTab === 'friends' ? (
  <div className="w-full max-w-md mx-auto px-4 pt-6 pb-28">
    {/* Invite Friends Title */}
    <div className="text-center mb-8">
      <h2 className="text-white text-3xl font-bold mb-2">
        Invite Friends 
        <span className="ml-2 text-2xl">🤝</span>
      </h2>
      <p className="text-gray-400 text-sm">
        Share your referral link and earn rewards together
      </p>
    </div>

    {/* Referral Link Section */}
    <div className="mb-8">
      <label className="text-white text-sm font-medium mb-3 block">
        Your Referral Link
      </label>
      <div className="flex items-center gap-3">
        <div className="flex-1 border border-gray-700 rounded-lg p-4 bg-gray-900/50">
          <code className="text-sm text-gray-300 break-all block font-mono">
            https://t.me/Zapcoinnbot?startapp={userId}
          </code>
        </div>
        
        <button
          onClick={handleCopyLink}
          className={`flex items-center justify-center w-12 h-12 rounded-lg font-medium transition-all duration-200 ${
            copied 
              ? 'bg-green-600 text-white' 
              : 'bg-blue-600 hover:bg-blue-500 text-white hover:scale-105'
          }`}
          disabled={copied}
        >
          {copied ? <Check size={20} /> : <Copy size={20} />}
        </button>
      </div>
      {copied && (
        <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
          <Check size={14} />
          Link copied to clipboard!
        </p>
      )}
    </div>

    {/* Your Friends List */}
    <div className="mb-8">
      <div className="flex items-center justify-center mb-4">
  <div className="flex items-center gap-2">
    <Users className="text-white" size={20} />
    <h3 className="text-white text-xl font-bold">Your Friends</h3>
    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
      {friends.length}
    </span>
  </div>
</div>
      <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
  {friends.length === 0 ? (
    <div className="text-center py-8">
      <Users className="mx-auto mb-3 text-gray-600" size={48} />
      <p className="text-gray-500 text-sm">No friends joined yet</p>
      <p className="text-gray-600 text-xs mt-1">
        Share your link to get started!
      </p>
    </div>
  ) : (
    friends.map((friend, index) => (
      <div 
        key={friend.id || index} 
        className="flex items-center gap-3 bg-gray-800/60 hover:bg-gray-800/80 p-3 rounded-lg transition-colors duration-200 border border-gray-700/50"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
          {friend.username.charAt(0).toUpperCase()}
        </div>
        <span className="text-white font-medium flex-1">
          @{friend.username}
        </span>
        <div className="text-right">
          <span className="text-yellow-400 font-bold text-sm">+10,000</span>
          <p className="text-gray-500 text-xs">coins</p>
        </div>
      </div>
    ))
  )}
</div>
    </div>

    {/* Share Button */}
    <div className="fixed bottom-20 left-0 right-0 flex justify-center z-40 px-4">
      <button
        onClick={handleShareInvite}
        className="w-full max-w-md bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-4 rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl flex items-center justify-center gap-2"
      >
        <Share2 size={20} />
        Share Invite Link
      </button>
    </div>
  </div>
)
: (
<div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
<h2 className="text-white text-2xl font-semibold mb-4">
{tabs.find(tab => tab.id === activeTab)?.label} Section
</h2>
<p className="text-gray-400 text-lg">
Coming Soon...
</p>
</div>
)}
{/* Bottom Navigation */}
<div className="fixed bottom-0 left-0 right-0 flex justify-center pt-2 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent z-50">
<div className="bg-black border border-gray-700 rounded-2xl shadow-2xl backdrop-blur-sm">
<nav className="flex items-center justify-center px-6 py-2 w-[400px]">
{tabs.map((tab) => {
const Icon = tab.icon;
const isActive = activeTab === tab.id;
return (
<button
key={tab.id}
onClick={() => setActiveTab(tab.id)}
className={`
flex flex-col items-center justify-center space-y-1 rounded-xl
transition-all duration-300 ease-in-out
w-20 h-12 mx-1
${isActive
? 'bg-gray-800 text-white shadow-lg'
: 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
}
`}
>
<Icon
size={18}
className={`transition-all duration-300 ${isActive ? 'text-white' : 'text-gray-400'}`}
/>
<span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}>
{tab.label}
</span>
</button>
);
})}
</nav>
</div>
</div>
</div>
</div>
);
};

export default BottomNavigationBar;