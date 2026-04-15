import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Phone, PhoneOff, PhoneCall, PhoneMissed, Clock,
  User, Search, X, ChevronDown, CheckCircle, Mic,
} from 'lucide-react';
import axios from 'axios';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const DISPOSITION_OPTIONS = [
  { value: 'answered',   label: 'Answered',   color: 'text-green-400' },
  { value: 'no-answer',  label: 'No Answer',  color: 'text-yellow-400' },
  { value: 'voicemail',  label: 'Voicemail',  color: 'text-blue-400' },
  { value: 'busy',       label: 'Busy',       color: 'text-red-400' },
];

function dispositionIcon(d) {
  if (d === 'answered')  return <CheckCircle size={13} className="text-green-400" />;
  if (d === 'voicemail') return <Mic         size={13} className="text-blue-400" />;
  if (d === 'busy')      return <PhoneOff    size={13} className="text-red-400" />;
  return <PhoneMissed size={13} className="text-yellow-400" />;
}

// ─── Keypad Button ─────────────────────────────────────────────────────────────
function KeypadBtn({ digit, sub, onClick }) {
  return (
    <button
      onClick={() => onClick(digit)}
      className="
        flex flex-col items-center justify-center
        w-16 h-16 rounded-full
        bg-[#1A1A1A] hover:bg-[#242424] active:bg-[#2A2A2A]
        border border-[#2A2A2A] hover:border-[#C9A84C]/30
        text-white transition-all duration-100
        select-none
      "
    >
      <span className="text-lg font-semibold leading-none">{digit}</span>
      {sub && <span className="text-[9px] text-gray-500 leading-none mt-0.5 tracking-widest">{sub}</span>}
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function DialerPage() {
  const [phoneInput, setPhoneInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  // Call state
  const [callStatus, setCallStatus] = useState('idle'); // idle | calling | connected | ended
  const [currentCallLogId, setCurrentCallLogId] = useState(null);
  const [callSid, setCallSid] = useState(null);
  const [callSeconds, setCallSeconds] = useState(0);
  const timerRef = useRef(null);

  // After-call form
  const [showLogForm, setShowLogForm] = useState(false);
  const [disposition, setDisposition] = useState('');
  const [callNotes, setCallNotes] = useState('');
  const [logSaving, setLogSaving] = useState(false);
  const [logSuccess, setLogSuccess] = useState(false);

  // Recent calls
  const [recentCalls, setRecentCalls] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);

  const searchTimeoutRef = useRef(null);

  // ── Load recent calls ───────────────────────────────────────────────────────
  const fetchRecentCalls = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('/api/dialer/recent', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecentCalls(data.call_logs || []);
    } catch {
      // ignore
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecentCalls(); }, [fetchRecentCalls]);

  // ── Timer ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => setCallSeconds(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      if (callStatus !== 'connected') setCallSeconds(0);
    }
    return () => clearInterval(timerRef.current);
  }, [callStatus]);

  // ── Lead search ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`/api/dialer/search-leads?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSearchResults(data.leads || []);
      } catch {
        setSearchResults([]);
      }
    }, 300);
  }, [searchQuery]);

  // ── Keypad input ────────────────────────────────────────────────────────────
  const handleKeypadPress = (digit) => {
    setPhoneInput(prev => prev + digit);
    setSelectedLead(null);
  };

  const handleBackspace = () => {
    setPhoneInput(prev => prev.slice(0, -1));
  };

  // ── Select lead from search ─────────────────────────────────────────────────
  const handleSelectLead = (lead) => {
    setSelectedLead(lead);
    setPhoneInput(lead.phone || '');
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
  };

  // ── Initiate call ───────────────────────────────────────────────────────────
  const handleCall = async () => {
    if (!phoneInput.trim()) return;
    setCallStatus('calling');
    setCallSid(null);
    setCurrentCallLogId(null);

    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post('/api/dialer/call', {
        phone_number: phoneInput.trim(),
        lead_id:      selectedLead?.id || null,
        notes:        null,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCallSid(data.call_sid);
      setCurrentCallLogId(data.call_log_id);
      setCallStatus('connected');
    } catch (err) {
      console.error('Call error:', err);
      setCallStatus('idle');
      alert(err?.response?.data?.error || 'Failed to initiate call. Check Twilio credentials.');
    }
  };

  // ── End / hang up ──────────────────────────────────────────────────────────
  const handleHangUp = () => {
    setCallStatus('ended');
    clearInterval(timerRef.current);
    setShowLogForm(true);
  };

  // ── Log call outcome ────────────────────────────────────────────────────────
  const handleLogCall = async () => {
    if (!disposition) {
      alert('Please select a call disposition first.');
      return;
    }
    setLogSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/dialer/log', {
        call_log_id:      currentCallLogId,
        lead_id:          selectedLead?.id || null,
        phone_number:     phoneInput.trim(),
        duration_seconds: callSeconds,
        disposition,
        notes:            callNotes,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLogSuccess(true);
      await fetchRecentCalls();

      setTimeout(() => {
        setShowLogForm(false);
        setCallStatus('idle');
        setDisposition('');
        setCallNotes('');
        setLogSuccess(false);
        setCallSeconds(0);
        setCurrentCallLogId(null);
      }, 1500);
    } catch (err) {
      console.error('Log error:', err);
      alert(err?.response?.data?.error || 'Failed to save call log.');
    } finally {
      setLogSaving(false);
    }
  };

  const handleCancelLog = () => {
    setShowLogForm(false);
    setCallStatus('idle');
    setDisposition('');
    setCallNotes('');
    setCallSeconds(0);
    setCurrentCallLogId(null);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6">
      <div className="max-w-5xl mx-auto">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Phone size={22} className="text-[#C9A84C]" />
            Dialer
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Click-to-call your leads directly. Twilio bridges the call to your phone.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── LEFT: Dialpad ───────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Lead search */}
            <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                  <User size={14} className="text-[#C9A84C]" />
                  Search Lead
                </span>
                {selectedLead && (
                  <button
                    onClick={() => { setSelectedLead(null); setPhoneInput(''); }}
                    className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1"
                  >
                    <X size={12} /> Clear
                  </button>
                )}
              </div>

              {selectedLead ? (
                <div className="flex items-center gap-3 px-3 py-2 bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#C9A84C] text-sm font-bold">
                      {selectedLead.first_name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {selectedLead.first_name} {selectedLead.last_name}
                    </p>
                    <p className="text-gray-400 text-xs">{selectedLead.phone || 'No phone'} · {selectedLead.stage}</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by name or phone…"
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setShowSearch(true); }}
                    onFocus={() => setShowSearch(true)}
                    className="
                      w-full pl-9 pr-3 py-2 text-sm
                      bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg
                      text-white placeholder-gray-600
                      focus:outline-none focus:border-[#C9A84C]/50
                      transition-colors
                    "
                  />
                  {showSearch && searchResults.length > 0 && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg overflow-hidden shadow-xl">
                      {searchResults.map(lead => (
                        <button
                          key={lead.id}
                          onClick={() => handleSelectLead(lead)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#242424] transition-colors text-left"
                        >
                          <div className="w-7 h-7 rounded-full bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-[#C9A84C] text-xs font-bold">
                              {lead.first_name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{lead.first_name} {lead.last_name}</p>
                            <p className="text-gray-500 text-xs">{lead.phone || 'No phone'}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Phone display + keypad */}
            <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl p-5">

              {/* Number display */}
              <div className="relative flex items-center justify-center mb-6 h-12">
                <span className={`text-2xl font-mono tracking-widest ${phoneInput ? 'text-white' : 'text-gray-600'}`}>
                  {phoneInput || '_ _ _'}
                </span>
                {phoneInput && (
                  <button
                    onClick={handleBackspace}
                    className="absolute right-0 p-2 text-gray-500 hover:text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Keypad grid */}
              <div className="grid grid-cols-3 gap-3 justify-items-center mb-6">
                {[
                  ['1', ''],   ['2', 'ABC'],  ['3', 'DEF'],
                  ['4', 'GHI'], ['5', 'JKL'],  ['6', 'MNO'],
                  ['7', 'PQRS'],['8', 'TUV'],  ['9', 'WXYZ'],
                  ['*', ''],   ['0', '+'],    ['#', ''],
                ].map(([digit, sub]) => (
                  <KeypadBtn key={digit} digit={digit} sub={sub} onClick={handleKeypadPress} />
                ))}
              </div>

              {/* Call / Hang-up button */}
              {callStatus === 'idle' && (
                <button
                  onClick={handleCall}
                  disabled={!phoneInput.trim()}
                  className="
                    w-full flex items-center justify-center gap-2 py-3.5 rounded-full
                    bg-[#C9A84C] hover:bg-[#d4b057] disabled:bg-[#C9A84C]/30
                    text-black font-semibold text-sm
                    transition-all duration-150 disabled:cursor-not-allowed
                  "
                >
                  <Phone size={18} />
                  Call
                </button>
              )}

              {callStatus === 'calling' && (
                <div className="w-full flex flex-col items-center gap-2 py-3">
                  <div className="flex items-center gap-2 text-[#C9A84C]">
                    <div className="w-5 h-5 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium">Calling… your Twilio phone will ring first</span>
                  </div>
                  <p className="text-xs text-gray-500">Answer your phone, then Karl bridges to the lead</p>
                </div>
              )}

              {callStatus === 'connected' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-3 py-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-green-400 text-sm font-medium">Connected</span>
                    <span className="text-gray-400 text-sm font-mono">{formatDuration(callSeconds)}</span>
                  </div>
                  <button
                    onClick={handleHangUp}
                    className="
                      w-full flex items-center justify-center gap-2 py-3.5 rounded-full
                      bg-red-600 hover:bg-red-500
                      text-white font-semibold text-sm
                      transition-all duration-150
                    "
                  >
                    <PhoneOff size={18} />
                    End Call
                  </button>
                </div>
              )}

              {callStatus === 'ended' && !showLogForm && (
                <div className="text-center py-3 text-gray-400 text-sm">
                  <PhoneOff size={20} className="mx-auto mb-1 text-red-400" />
                  Call ended
                </div>
              )}
            </div>

            {/* After-call log form */}
            {showLogForm && (
              <div className="bg-[#111111] border border-[#C9A84C]/20 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-[#C9A84C] flex items-center gap-2">
                  <PhoneCall size={15} />
                  Log Call Outcome
                  <span className="ml-auto text-gray-500 font-mono text-xs">{formatDuration(callSeconds)}</span>
                </h3>

                {/* Disposition */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">Disposition</p>
                  <div className="grid grid-cols-2 gap-2">
                    {DISPOSITION_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setDisposition(opt.value)}
                        className={`
                          flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                          border transition-all duration-100
                          ${disposition === opt.value
                            ? 'border-[#C9A84C]/60 bg-[#C9A84C]/10 text-white'
                            : 'border-[#2A2A2A] bg-[#1A1A1A] text-gray-400 hover:border-[#3A3A3A]'
                          }
                        `}
                      >
                        {dispositionIcon(opt.value)}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <p className="text-xs text-gray-400 mb-2">Notes</p>
                  <textarea
                    rows={3}
                    placeholder="Add call notes…"
                    value={callNotes}
                    onChange={e => setCallNotes(e.target.value)}
                    className="
                      w-full px-3 py-2 text-sm rounded-lg resize-none
                      bg-[#1A1A1A] border border-[#2A2A2A]
                      text-white placeholder-gray-600
                      focus:outline-none focus:border-[#C9A84C]/50
                      transition-colors
                    "
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleLogCall}
                    disabled={logSaving || logSuccess}
                    className="
                      flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg
                      bg-[#C9A84C] hover:bg-[#d4b057] disabled:bg-[#C9A84C]/30
                      text-black font-semibold text-sm
                      transition-all disabled:cursor-not-allowed
                    "
                  >
                    {logSuccess ? (
                      <><CheckCircle size={15} /> Saved!</>
                    ) : logSaving ? (
                      <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> Saving…</>
                    ) : (
                      <><CheckCircle size={15} /> Log Call</>
                    )}
                  </button>
                  <button
                    onClick={handleCancelLog}
                    className="px-4 py-2.5 rounded-lg border border-[#2A2A2A] text-gray-400 hover:text-white hover:border-[#3A3A3A] text-sm transition-colors"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Recent calls ─────────────────────────────────────────── */}
          <div className="bg-[#111111] border border-[#1E1E1E] rounded-xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E1E]">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock size={15} className="text-[#C9A84C]" />
                Recent Calls
              </h2>
              <button
                onClick={fetchRecentCalls}
                className="text-xs text-gray-500 hover:text-[#C9A84C] transition-colors"
              >
                Refresh
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#1A1A1A]">
              {recentLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : recentCalls.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                  <Phone size={32} className="mb-3 opacity-30" />
                  <p className="text-sm">No calls yet</p>
                  <p className="text-xs mt-1">Your call history will appear here</p>
                </div>
              ) : (
                recentCalls.map(call => (
                  <div key={call.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-[#161616] transition-colors">

                    {/* Icon */}
                    <div className={`
                      mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                      ${call.disposition === 'answered'
                        ? 'bg-green-500/15'
                        : call.disposition === 'voicemail'
                        ? 'bg-blue-500/15'
                        : call.disposition === 'busy'
                        ? 'bg-red-500/15'
                        : 'bg-yellow-500/15'
                      }
                    `}>
                      {dispositionIcon(call.disposition || 'no-answer')}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-sm font-medium text-white truncate">
                          {call.lead_name?.trim() || call.phone_number || 'Unknown'}
                        </p>
                        <span className="text-xs text-gray-600 flex-shrink-0">
                          {formatRelativeTime(call.called_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-500">{call.phone_number}</span>
                        {call.duration_seconds > 0 && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock size={10} />
                            {formatDuration(call.duration_seconds)}
                          </span>
                        )}
                        {call.disposition && (
                          <span className={`text-xs capitalize ${
                            DISPOSITION_OPTIONS.find(d => d.value === call.disposition)?.color || 'text-gray-500'
                          }`}>
                            {call.disposition}
                          </span>
                        )}
                      </div>
                      {call.notes && (
                        <p className="text-xs text-gray-600 mt-1 truncate italic">"{call.notes}"</p>
                      )}
                    </div>

                    {/* Quick dial back */}
                    {call.phone_number && (
                      <button
                        onClick={() => {
                          setPhoneInput(call.phone_number);
                          if (call.lead_name) {
                            setSelectedLead({
                              id:         call.lead_id,
                              first_name: call.lead_name.split(' ')[0],
                              last_name:  call.lead_name.split(' ').slice(1).join(' '),
                              phone:      call.phone_number,
                              stage:      '',
                            });
                          }
                        }}
                        className="mt-0.5 p-1.5 rounded-lg text-gray-600 hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-all flex-shrink-0"
                        title="Dial again"
                      >
                        <PhoneCall size={14} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Info callout */}
        <div className="mt-4 px-4 py-3 bg-[#C9A84C]/5 border border-[#C9A84C]/15 rounded-lg flex items-start gap-3">
          <Phone size={14} className="text-[#C9A84C] mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-500 leading-relaxed">
            <span className="text-gray-400 font-medium">How it works: </span>
            When you click Call, Twilio rings your registered Twilio number first. Once you answer,
            Twilio dials the lead and bridges the call. Both sides use your Twilio number as caller ID.
            Make sure your Twilio phone number is set in <span className="text-[#C9A84C]">TWILIO_PHONE_NUMBER</span> env variable.
          </div>
        </div>

      </div>
    </div>
  );
}
