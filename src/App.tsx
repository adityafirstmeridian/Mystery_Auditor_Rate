import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

type FormState = 'aadhar' | 'details';

function formatRatingTimestamp(d: Date = new Date()) {
  const day = d.getDate().toString().padStart(2, '0');
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  return `${day} ${month} ${year}, ${hours}:${mins} ${ampm}`;
}

const defaultPreExistingRatings = [
  { id: "r1", score: 5, reviewerName: "Raj", timestamp: "11 Nov 2026, 2:39 pm" },
  { id: "r2", score: 5, reviewerName: "adnan mohammad", timestamp: "12 Nov, 2026" },
  { id: "r3", score: 5, reviewerName: "Raj", timestamp: "11 Nov 2026, 2:39 pm" },
  { id: "r4", score: 5, reviewerName: "adnan mohammad", timestamp: "12 Nov, 2026" },
  { id: "r5", score: 4, reviewerName: "Ibrahim abiodun Lawal", timestamp: "10 Nov, 2026" }
];

function getCandidateRatingList(c: any): any[] {
  const raw = c?.ratings;
  if (!raw || !Array.isArray(raw) || raw.length === 0) {
    return [...defaultPreExistingRatings];
  }
  return raw.map((r: any, idx: number) => {
    if (typeof r === 'number') {
      return {
        id: `r_${idx}`,
        score: r,
        reviewerName: idx % 2 === 0 ? 'adnan mohammad' : 'Raj',
        timestamp: '11 Nov 2026, 2:39 pm'
      };
    }
    return r;
  });
}

function getCandidateRatingInfo(c: any) {
  const list = getCandidateRatingList(c);
  if (!list || list.length === 0) {
    return { avg: "5", count: 0, rawAvg: 5, list: [] };
  }
  const sum = list.reduce((acc: number, r: any) => acc + (Number(r.score) || 0), 0);
  const avgNum = sum / list.length;
  const avgStr = (Math.round(avgNum * 10) / 10).toFixed(avgNum % 1 === 0 ? 0 : 1);
  return { avg: avgStr, count: list.length, rawAvg: avgNum, list };
}

function CandidateOnboarding() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "Aarav Sharma", dob: "15-05-1994", address: "42, Residency Road", city: "Bangalore", state: "Karnataka", pin: "560025",
    houseName: "", area: "", skills: "", preferredLocationList: [] as string[],
    phone: "", email: "", pan: "", qualification: "", experience: "", preferredLocation: "", 
    accountNumber: "", reconfirmAccountNumber: "", ifsc: "", resume: ""
  });

  const [panVerified, setPanVerified] = useState<boolean | null>(null);
  const [bankVerified, setBankVerified] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState({ pan: false, bank: false });
  
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailOtpValue, setEmailOtpValue] = useState('');
  const [emailTimer, setEmailTimer] = useState(0);
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [onboardingSubStep, setOnboardingSubStep] = useState(0); // 0: Input, 1: Verification

  const handlePhoneEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
        setPhoneError('Invalid phone number format');
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setEmailError('Invalid email format');
        return;
    }
    setPhoneError('');
    setEmailError('');
    setEmailTimer(45); // Start timer
    setOnboardingSubStep(1); // Go to Verification
  };

  const handleEmailOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailOtpValue !== '1234') {
        setEmailError('Wrong OTP');
        return;
    }
    setEmailError('');
    setStep(2); // Go to next main step
  };

  useEffect(() => {
    let eInt: any;
    if (emailTimer > 0) eInt = setInterval(() => setEmailTimer(t => t - 1), 1000);
    return () => { clearInterval(eInt); };
  }, [emailTimer]);

  const resendEmailOtp = () => { setEmailTimer(45); alert('OTP resent to phone and email!'); };

  const verifyPan = async () => {
    setVerifying(v => ({...v, pan: true}));
    await new Promise(resolve => setTimeout(resolve, 1000));
    setPanVerified(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan));
    setVerifying(v => ({...v, pan: false}));
  };

  const verifyBank = async () => {
    setVerifying(v => ({...v, bank: true}));
    await new Promise(resolve => setTimeout(resolve, 1500));
    setBankVerified(formData.accountNumber.length > 8 && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifsc));
    setVerifying(v => ({...v, bank: false}));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({...formData, resume: e.target.files[0].name});
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!panVerified) { alert("Please verify PAN first."); return; }
    if (!bankVerified) { alert("Please verify Bank Account first."); return; }
    if (formData.accountNumber !== formData.reconfirmAccountNumber) {
        alert("Account numbers do not match.");
        return;
    }
    localStorage.setItem(`candidate_${formData.phone}`, JSON.stringify(formData));
    alert('Information Saved Successfully!');
  };

  return (
    <>
      <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-between bg-gray-50">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">You are a minute away from your dream job!</h1>
          <p className="text-gray-600">Join our network and find your next opportunity.</p>
        </div>
      </div>
      <div className="w-full md:w-1/2 p-8 md:p-16">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Candidate Onboarding</h2>
          <div className="flex gap-2 items-center">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-2 flex-grow rounded ${s <= step ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2 font-medium">Step {step} of 3</p>
        </div>
        
        {step === 1 && (
          <form onSubmit={onboardingSubStep === 0 ? handlePhoneEmailSubmit : handleEmailOtpSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number*</label>
              <input type="tel" value={formData.phone} disabled={onboardingSubStep === 1} maxLength={10} onChange={e => { setFormData({...formData, phone: e.target.value}); setPhoneError(''); }} className="w-full border p-2 rounded" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email*</label>
              <input type="email" value={formData.email} disabled={onboardingSubStep === 1} onChange={e => { setFormData({...formData, email: e.target.value}); setEmailError(''); }} className="w-full border p-2 rounded" required />
            </div>

            {onboardingSubStep === 0 && (
                <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-md font-semibold mt-4">Send OTP</button>
            )}

            {onboardingSubStep === 1 && (
              <>
                <h3 className="text-lg font-semibold mt-4">Verify OTP</h3>
                <p className="text-sm text-gray-600">OTP sent to {formData.phone} and {formData.email}</p>
                <input type="text" onChange={(e) => { setEmailOtpValue(e.target.value); setEmailError(''); }} placeholder="Enter OTP (1234)" className="w-full border p-2 rounded" required />
                {(phoneError || emailError) && <p className="text-red-600 text-sm">{phoneError || emailError}</p>}
                <button type="button" onClick={resendEmailOtp} disabled={emailTimer > 0} className="text-sm text-blue-600 underline">{emailTimer > 0 ? `Resend OTP in ${emailTimer}s` : 'Resend OTP'}</button>
                <div className="flex gap-2 mt-4">
                    <button type="button" onClick={() => setOnboardingSubStep(0)} className="w-1/2 bg-gray-300 p-2 rounded">Edit</button>
                    <button type="submit" className="w-1/2 bg-blue-600 text-white p-2 rounded">Verify</button>
                </div>
              </>
            )}
          </form>
        )}

        {step === 2 && (
          <form onSubmit={(e) => { 
            e.preventDefault(); 
            if ((formData.preferredLocationList || []).length === 0) {
                alert("Please add at least one preferred location.");
                return;
            }
            setStep(3); 
          }} className="space-y-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            <div><label className="block text-sm font-medium text-gray-700">Full Name*</label><input placeholder="Full Name" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full border p-2 rounded" required /></div>
            <div><label className="block text-sm font-medium text-gray-700">Date of Birth*</label><input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full border p-2 rounded" required /></div>
            <div><label className="block text-sm font-medium text-gray-700">Flat/House/Building Name*</label><input placeholder="Flat/House/Building Name" value={formData.houseName || ''} onChange={e => setFormData({...formData, houseName: e.target.value})} className="w-full border p-2 rounded" required /></div>
            <div><label className="block text-sm font-medium text-gray-700">Area/Sector/Locality*</label><input placeholder="Area/Sector/Locality" value={formData.area || ''} onChange={e => setFormData({...formData, area: e.target.value})} className="w-full border p-2 rounded" required /></div>
            <div><label className="block text-sm font-medium text-gray-700">PIN*</label><input placeholder="PIN" value={formData.pin} onChange={e => setFormData({...formData, pin: e.target.value})} className="w-full border p-2 rounded" required /></div>
            <div><label className="block text-sm font-medium text-gray-700">City*</label><input placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full border p-2 rounded" required /></div>
            <div><label className="block text-sm font-medium text-gray-700">State*</label><input placeholder="State" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} className="w-full border p-2 rounded" required /></div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Preferred Locations (up to 10)*</label>
              <div className="w-full border p-2 rounded flex flex-wrap gap-2">
                {(formData.preferredLocationList || []).map((loc, i) => (
                  <span key={i} className="bg-gray-100 text-gray-800 px-2 py-1 rounded flex items-center text-sm border border-gray-300">
                    <button type="button" onClick={() => setFormData({...formData, preferredLocationList: formData.preferredLocationList.filter((_, idx) => idx !== i)})} className="mr-1 text-gray-600 font-bold">×</button>
                    {loc}
                  </span>
                ))}
                {(formData.preferredLocationList || []).length < 10 && (
                  <input
                    placeholder="Type and press Enter"
                    className="flex-grow outline-none text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim();
                        if (val && !(formData.preferredLocationList || []).includes(val)) {
                          setFormData({...formData, preferredLocationList: [...(formData.preferredLocationList || []), val]});
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                )}
              </div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700">Skills</label><input placeholder="Skills (Optional)" value={formData.skills || ''} onChange={e => setFormData({...formData, skills: e.target.value})} className="w-full border p-2 rounded" /></div>
            <div><label className="block text-sm font-medium text-gray-700">Highest Qualification*</label><select value={formData.qualification} onChange={e => setFormData({...formData, qualification: e.target.value})} className="w-full border p-2 rounded" required>
              <option value="">Select Qualification</option><option value="12th">12th</option><option value="UG">UG</option><option value="PG">PG</option>
            </select></div>
            <div><label className="block text-sm font-medium text-gray-700">Total Years of Audit Experience*</label><input type="number" placeholder="Total Years of Experience" value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} className="w-full border p-2 rounded" required /></div>
            <div><label className="block text-sm font-medium text-gray-700">Resume</label><input type="file" onChange={handleFileChange} className="w-full border p-2 rounded" /></div>
            <div className="flex gap-2">
                <button type="button" onClick={() => setStep(1)} className="w-1/2 bg-gray-300 p-2 rounded">Back</button>
                <button type="submit" className="w-1/2 bg-blue-600 text-white p-2 rounded">Next</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold">Documents & Bank Details</h3>
            <input placeholder="Aadhar" className="w-full border p-2 rounded" required />
            <input placeholder="PAN" value={formData.pan} onChange={e => setFormData({...formData, pan: e.target.value})} className="w-full border p-2 rounded" required />
            <button type="button" onClick={verifyPan} className="w-full bg-gray-600 text-white p-2 rounded">Verify PAN {verifying.pan ? '(Checking...)' : panVerified === true ? '✅' : panVerified === false ? '❌' : ''}</button>
            
            <input placeholder="Account Number" value={formData.accountNumber} onChange={e => setFormData({...formData, accountNumber: e.target.value})} className="w-full border p-2 rounded" required />
            <input placeholder="Reconfirm Account Number" value={formData.reconfirmAccountNumber} onChange={e => setFormData({...formData, reconfirmAccountNumber: e.target.value})} className="w-full border p-2 rounded" required />
            <input placeholder="IFSC" value={formData.ifsc} onChange={e => setFormData({...formData, ifsc: e.target.value})} className="w-full border p-2 rounded" required />
            <button type="button" onClick={verifyBank} className="w-full bg-gray-600 text-white p-2 rounded">Verify Bank {verifying.bank ? '(Checking...)' : bankVerified === true ? '✅' : bankVerified === false ? '❌' : ''}</button>
            
            <div className="flex gap-2">
                <button type="button" onClick={() => setStep(2)} className="w-1/2 bg-gray-300 p-2 rounded">Back</button>
                <button type="submit" disabled={!panVerified || !bankVerified} className={`w-1/2 p-2 rounded ${panVerified && bankVerified ? 'bg-blue-600 text-white' : 'bg-gray-400 text-gray-200'}`}>Submit</button>
            </div>
            {(!panVerified || !bankVerified) && <p className="text-red-500 text-sm">Please verify both PAN and Bank details to submit.</p>}
          </form>
        )}
      </div>
    </>
  );
}

function RequirementView({
  candidates,
  onSelectCandidate,
  onOpenRatingModal
}: {
  candidates: any[];
  onSelectCandidate: (c: any) => void;
  onOpenRatingModal: (c: any) => void;
}) {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = candidates.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.fullName || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  });

  const toggleSelectAll = () => {
    if (selectedRows.length === filtered.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filtered.map((c, idx) => c.phone || c.email || c.fullName || `row_${idx}`));
    }
  };

  const toggleSelectRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(x => x !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header bar */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Requirement Matching</h2>
          <p className="text-sm text-gray-500 mt-1">Review candidates matching job requirements, statuses, and profiles.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search candidate in requirement..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-300 bg-white px-3 py-1.5 rounded-lg text-sm w-64 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Requirement Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-gray-200 text-xs font-semibold text-gray-700">
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedRows.length === filtered.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 cursor-pointer"
                  />
                </th>
                <th className="p-4">Name</th>
                <th className="p-4">Status</th>
                <th className="p-4">Matching Criteria</th>
                <th className="p-4">Candidate Details</th>
                <th className="p-4">Comments</th>
                <th className="p-4 text-center">SMS</th>
                <th className="p-4 text-center">Email</th>
                <th className="p-4 text-center">WhatsApp</th>
                <th className="p-4 text-center">New Tab</th>
                <th className="p-4 text-center">Expand</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filtered.map((c, idx) => {
                const rowId = c.phone || c.email || c.fullName || `row_${idx}`;
                const isSelected = selectedRows.includes(rowId);
                const isExpanded = expandedRow === rowId;
                const matchPct = c.matchingCriteria || `${(85.5 + (idx % 5) * 1.5).toFixed(1)}%`;
                const status = c.status || (idx % 2 === 0 ? 'Applied' : 'Shortlisted');
                const comments = c.comment || (idx % 2 === 0 ? 'Applied via WHATSAPP' : 'Shortlisted for Round 1');
                const { avg } = getCandidateRatingInfo(c);

                return (
                  <React.Fragment key={rowId}>
                    <tr className="hover:bg-slate-50/80 transition">
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(rowId)}
                          className="rounded border-gray-300 cursor-pointer"
                        />
                      </td>
                      <td className="p-4 font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {c.fullName ? c.fullName.split(' ').map((n: string) => n[0]).join('') : '?'}
                          </div>
                          <span
                            onClick={() => onSelectCandidate(c)}
                            className="text-gray-900 font-semibold hover:text-blue-600 hover:underline cursor-pointer"
                          >
                            {c.fullName}
                          </span>
                          
                          {/* Rating Star / Average Badge beside name */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenRatingModal(c);
                            }}
                            className="cursor-pointer transition inline-flex items-center gap-1 shrink-0 ml-1 focus:outline-none"
                            title={avg ? `Average Rating: ${avg}` : "Click to rate candidate"}
                          >
                            <span className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/90 rounded-full px-2.5 py-0.5 text-xs font-bold inline-flex items-center gap-1 shadow-2xs">
                              <span className="text-amber-500">★</span>
                              <span>{avg}</span>
                            </span>
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-700 font-medium px-3 py-1 rounded-full text-xs inline-block border border-slate-200/60">
                          {status}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-teal-700 text-base">
                        {matchPct}
                      </td>
                      <td className="p-4 text-xs text-gray-600 leading-relaxed">
                        <p>{c.email}</p>
                        <p className="font-medium text-gray-800 mt-0.5">{c.phone}</p>
                      </td>
                      <td className="p-4 text-xs text-gray-600">
                        {comments}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => alert(`SMS initiated for ${c.phone}`)}
                          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition cursor-pointer"
                          title="Send SMS"
                        >
                          💬
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <a
                          href={`mailto:${c.email}`}
                          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition inline-block"
                          title="Send Email"
                        >
                          ✉️
                        </a>
                      </td>
                      <td className="p-4 text-center">
                        <a
                          href={`https://wa.me/${(c.phone || '').replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-full hover:bg-gray-100 text-green-600 transition inline-block"
                          title="WhatsApp"
                        >
                          💬
                        </a>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => onSelectCandidate(c)}
                          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition cursor-pointer"
                          title="Open in detail view"
                        >
                          ↗️
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setExpandedRow(isExpanded ? null : rowId)}
                          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition cursor-pointer"
                          title="Expand candidate details"
                        >
                          {isExpanded ? '▲' : '▼'}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Drawer Row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/90 border-b border-gray-200">
                        <td colSpan={11} className="p-4 pl-14 text-xs text-gray-700">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                            <div><p className="font-semibold text-gray-500">Highest Qualification:</p><p className="font-medium text-gray-900 mt-0.5">{c.qualification || 'N/A'}</p></div>
                            <div><p className="font-semibold text-gray-500">Total Experience:</p><p className="font-medium text-gray-900 mt-0.5">{c.experience ? `${c.experience} Years` : 'N/A'}</p></div>
                            <div><p className="font-semibold text-gray-500">Location:</p><p className="font-medium text-gray-900 mt-0.5">{c.city ? `${c.city}, ${c.state}` : 'N/A'}</p></div>
                            <div><p className="font-semibold text-gray-500">Preferred Locations:</p><p className="font-medium text-gray-900 mt-0.5">{(c.preferredLocationList || [c.preferredLocation]).filter(Boolean).join(', ') || 'N/A'}</p></div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-gray-500">
                    No candidate records found in requirement.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="bg-white border-t border-gray-200 p-3 px-6 flex items-center justify-between text-xs text-gray-600 flex-wrap gap-4">
          <div>
            Showing <span className="font-semibold">{filtered.length}</span> candidates
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 bg-white font-medium"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <span>1 - {filtered.length} of {filtered.length}</span>
            <div className="flex items-center gap-1 text-gray-400">
              <button disabled className="p-1 rounded hover:bg-gray-100 disabled:opacity-40">❮</button>
              <button disabled className="p-1 rounded hover:bg-gray-100 disabled:opacity-40">❯</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'candidate' | 'recruiter' | 'requirement'>('candidate');
  const [candidates, setCandidates] = useState<any[]>([]);

  useEffect(() => {
    let hasCandidates = false;
    for (let i = 0; i < localStorage.length; i++) {
      if (localStorage.key(i)?.startsWith('candidate_')) {
        hasCandidates = true;
        break;
      }
    }
    if (!hasCandidates) {
      const mockCandidates = [
        { 
          fullName: "Aarav Sharma", 
          dob: "01-01-1990", 
          address: "100 Tech Park", 
          city: "Bangalore", 
          state: "Karnataka", 
          pin: "560100", 
          phone: "+91 9900112233", 
          email: "aarav.sharma@email.com", 
          pan: "AARAV1234E", 
          qualification: "B.E", 
          experience: "5.0", 
          preferredLocation: "Bangalore", 
          accountNumber: "1234123412", 
          reconfirmAccountNumber: "1234123412", 
          ifsc: "IFSC0099", 
          resume: "aarav_resume.pdf",
          ratings: [
            { id: "r1", score: 5, reviewerName: "Raj", timestamp: "11 Nov 2026, 2:39 pm" },
            { id: "r2", score: 5, reviewerName: "adnan mohammad", timestamp: "12 Nov, 2026" },
            { id: "r3", score: 5, reviewerName: "Raj", timestamp: "11 Nov 2026, 2:39 pm" },
            { id: "r4", score: 5, reviewerName: "adnan mohammad", timestamp: "12 Nov, 2026" },
            { id: "r5", score: 5, reviewerName: "Ibrahim abiodun Lawal", timestamp: "10 Nov, 2026" }
          ]
        },
        { 
          fullName: "Aditya Raj", 
          dob: "15-05-1994", 
          address: "42, Residency Road", 
          city: "Bangalore", 
          state: "Karnataka", 
          pin: "560025", 
          phone: "+91 7397386463", 
          email: "aditya.raj@email.com", 
          pan: "ABCDE1234F", 
          qualification: "B.Tech", 
          experience: "5.5", 
          preferredLocation: "Chennai", 
          accountNumber: "1234567890", 
          reconfirmAccountNumber: "1234567890", 
          ifsc: "IFSC0001", 
          resume: "resume1.pdf",
          ratings: [
            { id: "r1", score: 5, reviewerName: "adnan mohammad", timestamp: "04 Nov, 2026" },
            { id: "r2", score: 5, reviewerName: "Ibrahim abiodun Lawal", timestamp: "04 Nov, 2026" },
            { id: "r3", score: 5, reviewerName: "Raj", timestamp: "11 Nov 2026, 2:39 pm" },
            { id: "r4", score: 4, reviewerName: "Kebba Dem", timestamp: "05 Nov, 2026" },
            { id: "r5", score: 5, reviewerName: "Priya Sharma", timestamp: "07 Nov, 2026" }
          ]
        },
        { 
          fullName: "Saurav Sinha", 
          dob: "05-05-1992", 
          address: "456 Avenue", 
          city: "Hyderabad", 
          state: "Telangana", 
          pin: "500001", 
          phone: "+91 9133262129", 
          email: "saurav.sinha@email.com", 
          pan: "FGHIJ5678K", 
          qualification: "MBA", 
          experience: "8.5", 
          preferredLocation: "Hyderabad", 
          accountNumber: "9876543210", 
          reconfirmAccountNumber: "9876543210", 
          ifsc: "IFSC0002", 
          resume: "resume2.pdf",
          ratings: [
            { id: "r1", score: 5, reviewerName: "Raj", timestamp: "11 Nov 2026, 2:39 pm" },
            { id: "r2", score: 4, reviewerName: "adnan mohammad", timestamp: "12 Nov, 2026" },
            { id: "r3", score: 5, reviewerName: "Vikram Mehta", timestamp: "08 Nov, 2026" },
            { id: "r4", score: 5, reviewerName: "Kebba Dem", timestamp: "05 Nov, 2026" },
            { id: "r5", score: 4, reviewerName: "Ibrahim abiodun Lawal", timestamp: "10 Nov, 2026" }
          ]
        },
        { 
          fullName: "Ritik Dhiman", 
          dob: "10-10-1993", 
          address: "789 Lane", 
          city: "Bangalore", 
          state: "Karnataka", 
          pin: "560001", 
          phone: "+91 9876543210", 
          email: "ritik.dhiman@email.com", 
          pan: "KLMNO9012P", 
          qualification: "MCA", 
          experience: "4.0", 
          preferredLocation: "Bangalore", 
          accountNumber: "1122334455", 
          reconfirmAccountNumber: "1122334455", 
          ifsc: "IFSC0003", 
          resume: "resume3.pdf",
          ratings: [
            { id: "r1", score: 4, reviewerName: "Raj", timestamp: "11 Nov 2026, 2:39 pm" },
            { id: "r2", score: 5, reviewerName: "adnan mohammad", timestamp: "12 Nov, 2026" },
            { id: "r3", score: 4, reviewerName: "Rajesh Kumar", timestamp: "06 Nov, 2026" },
            { id: "r4", score: 5, reviewerName: "Ibrahim abiodun Lawal", timestamp: "10 Nov, 2026" },
            { id: "r5", score: 4, reviewerName: "Kebba Dem", timestamp: "05 Nov, 2026" }
          ]
        },
        { 
          fullName: "Raj Kamal Jaiswal", 
          dob: "15-02-1991", 
          address: "321 Road", 
          city: "Mumbai", 
          state: "Maharashtra", 
          pin: "400001", 
          phone: "+91 8765432109", 
          email: "raj.jaiswal@email.com", 
          pan: "QRSTU3456V", 
          qualification: "B.Com", 
          experience: "6.0", 
          preferredLocation: "Mumbai", 
          accountNumber: "5544332211", 
          reconfirmAccountNumber: "5544332211", 
          ifsc: "IFSC0004", 
          resume: "resume4.pdf",
          ratings: [
            { id: "r1", score: 5, reviewerName: "Raj", timestamp: "11 Nov 2026, 2:39 pm" },
            { id: "r2", score: 5, reviewerName: "adnan mohammad", timestamp: "12 Nov, 2026" },
            { id: "r3", score: 5, reviewerName: "Raj", timestamp: "11 Nov 2026, 2:39 pm" },
            { id: "r4", score: 5, reviewerName: "adnan mohammad", timestamp: "12 Nov, 2026" },
            { id: "r5", score: 4, reviewerName: "Ibrahim abiodun Lawal", timestamp: "10 Nov, 2026" }
          ]
        },
        { 
          fullName: "Ankit Srivastava", 
          dob: "20-08-1996", 
          address: "654 Place", 
          city: "Pune", 
          state: "Maharashtra", 
          pin: "411001", 
          phone: "+91 7654321098", 
          email: "ankit.srivastava@email.com", 
          pan: "VWXYZ7890A", 
          qualification: "M.Tech", 
          experience: "2.5", 
          preferredLocation: "Pune", 
          accountNumber: "6677889900", 
          reconfirmAccountNumber: "6677889900", 
          ifsc: "IFSC0005", 
          resume: "resume5.pdf",
          ratings: [
            { id: "r1", score: 5, reviewerName: "Raj", timestamp: "11 Nov 2026, 2:39 pm" },
            { id: "r2", score: 4, reviewerName: "adnan mohammad", timestamp: "12 Nov, 2026" },
            { id: "r3", score: 5, reviewerName: "Kebba Dem", timestamp: "05 Nov, 2026" },
            { id: "r4", score: 4, reviewerName: "Ibrahim abiodun Lawal", timestamp: "10 Nov, 2026" },
            { id: "r5", score: 5, reviewerName: "Aditya Raj", timestamp: "07 Nov, 2026" }
          ]
        },
        { 
          fullName: "Mayank Dubey", 
          dob: "12-09-1995", 
          address: "101 Street", 
          city: "Delhi", 
          state: "Delhi", 
          pin: "110001", 
          phone: "+91 9988776655", 
          email: "mayank.dubey@email.com", 
          pan: "ABCDE5678G", 
          qualification: "UG", 
          experience: "3.0", 
          preferredLocation: "Delhi", 
          accountNumber: "1020304050", 
          reconfirmAccountNumber: "1020304050", 
          ifsc: "IFSC0006", 
          resume: "resume6.pdf",
          ratings: [
            { id: "r1", score: 5, reviewerName: "adnan mohammad", timestamp: "12 Nov, 2026" },
            { id: "r2", score: 5, reviewerName: "Raj", timestamp: "11 Nov 2026, 2:39 pm" },
            { id: "r3", score: 4, reviewerName: "Ibrahim abiodun Lawal", timestamp: "10 Nov, 2026" },
            { id: "r4", score: 5, reviewerName: "Kebba Dem", timestamp: "05 Nov, 2026" },
            { id: "r5", score: 5, reviewerName: "Raj", timestamp: "11 Nov 2026, 2:39 pm" }
          ]
        }
      ];
      mockCandidates.forEach((c, index) => localStorage.setItem(`candidate_mock${index}`, JSON.stringify(c)));
    }
  }, []);

  const loadCandidates = () => {
    const allCandidates = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('candidate_')) {
        allCandidates.push(JSON.parse(localStorage.getItem(key) || '{}'));
      }
    }
    setCandidates(allCandidates);
  };

  const [filters, setFilters] = useState({ 
    keyword: '', 
    minExp: '', 
    maxExp: '', 
    location: '', 
    qualification: '', 
    name: '', 
    skills: ''
  });
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [ratingModalCandidate, setRatingModalCandidate] = useState<any>(null);
  const [isEditingRating, setIsEditingRating] = useState<boolean>(false);
  const [editScore, setEditScore] = useState<number>(2);

  const handleSaveRating = (targetCand: any, score: number, reviewer: string = 'Raj') => {
    if (!targetCand) return;
    let updatedCand: any = null;

    const newRatingObj = {
      id: `r_${Date.now()}`,
      score: score,
      reviewerName: reviewer.trim() || 'Raj',
      timestamp: formatRatingTimestamp()
    };

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('candidate_')) {
        const item = JSON.parse(localStorage.getItem(key) || '{}');
        if (item.phone === targetCand.phone || item.email === targetCand.email || item.fullName === targetCand.fullName) {
          const currentList = getCandidateRatingList(item);
          const updatedRatings = [newRatingObj, ...currentList];

          updatedCand = {
            ...item,
            ratings: updatedRatings
          };
          localStorage.setItem(key, JSON.stringify(updatedCand));
          break;
        }
      }
    }

    if (updatedCand) {
      setCandidates(prev => prev.map(c => (c.phone === updatedCand.phone || c.email === updatedCand.email || c.fullName === updatedCand.fullName) ? updatedCand : c));
      if (selectedCandidate && (selectedCandidate.phone === updatedCand.phone || selectedCandidate.email === updatedCand.email)) {
        setSelectedCandidate(updatedCand);
      }
      setRatingModalCandidate(updatedCand);
    }
  };

  const filteredCandidates = candidates.filter(c => {
    const fullName = c.fullName || '';
    const skills = c.skills || '';
    const qualification = c.qualification || '';
    const preferredLocation = c.preferredLocation || '';
    
    const searchString = `${fullName} ${skills} ${qualification} ${preferredLocation}`.toLowerCase();
    
    return (
      (filters.name === '' || fullName.toLowerCase().includes(filters.name.toLowerCase())) &&
      (filters.skills === '' || skills.toLowerCase().includes(filters.skills.toLowerCase())) &&
      (filters.keyword === '' || searchString.includes(filters.keyword.toLowerCase())) &&
      (filters.qualification === '' || qualification.toLowerCase().includes(filters.qualification.toLowerCase())) &&
      (filters.location === '' || (preferredLocation && preferredLocation.toLowerCase().includes(filters.location.toLowerCase()))) &&
      (filters.minExp === '' || parseFloat(c.experience || 0) >= parseFloat(filters.minExp)) &&
      (filters.maxExp === '' || parseFloat(c.experience || 0) <= parseFloat(filters.maxExp))
    );
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="flex border-b bg-white">
        <button className={`p-4 cursor-pointer font-medium ${activeTab === 'candidate' ? 'border-b-2 border-blue-600 font-semibold text-blue-600' : 'text-gray-600 hover:text-gray-900'}`} onClick={() => setActiveTab('candidate')}>Candidate</button>
        <button className={`p-4 cursor-pointer font-medium ${activeTab === 'recruiter' ? 'border-b-2 border-blue-600 font-semibold text-blue-600' : 'text-gray-600 hover:text-gray-900'}`} onClick={() => { setActiveTab('recruiter'); loadCandidates(); }}>Recruiter</button>
        <button className={`p-4 cursor-pointer font-medium ${activeTab === 'requirement' ? 'border-b-2 border-blue-600 font-semibold text-blue-600' : 'text-gray-600 hover:text-gray-900'}`} onClick={() => { setActiveTab('requirement'); loadCandidates(); }}>Requirement</button>
      </div>

      {activeTab === 'candidate' ? (
        <div className="flex flex-col md:flex-row">
          <CandidateOnboarding />
        </div>
      ) : activeTab === 'requirement' && !selectedCandidate ? (
        <RequirementView
          candidates={filteredCandidates}
          onSelectCandidate={(c) => setSelectedCandidate(c)}
          onOpenRatingModal={(c) => { setIsEditingRating(false); setRatingModalCandidate(c); }}
        />
      ) : selectedCandidate ? (
        <div className="p-8 bg-gray-50 min-h-screen">
          <button onClick={() => setSelectedCandidate(null)} className="mb-4 text-blue-600 underline cursor-pointer font-medium">← Back to List</button>
          <div className="bg-white border rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold text-gray-500">
                    {selectedCandidate.fullName ? selectedCandidate.fullName.split(' ').map((n: string) => n[0]).join('') : '?'}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold">{selectedCandidate.fullName}</h2>
                        {/* Rating Star / Average Badge beside name */}
                        {(() => {
                          const { avg } = getCandidateRatingInfo(selectedCandidate);
                          return (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsEditingRating(false);
                                setRatingModalCandidate(selectedCandidate);
                              }}
                              className="cursor-pointer transition inline-flex items-center gap-1 shrink-0 ml-1 focus:outline-none"
                              title={`Average Rating: ${avg} (Click to open rating details)`}
                            >
                              <span className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/90 rounded-full px-2.5 py-0.5 text-xs font-bold inline-flex items-center gap-1 shadow-2xs">
                                <span className="text-amber-500">★</span>
                                <span>{avg}</span>
                              </span>
                            </button>
                          );
                        })()}
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600 mt-1">
                        <span>📍 {selectedCandidate.city || 'N/A'}</span>
                        <span>✉️ {selectedCandidate.email} ✅</span>
                        <span>📞 {selectedCandidate.phone} ✅</span>
                    </div>
                </div>
            </div>
            <div className="flex gap-6 border-b border-gray-200">
                <button className="border-b-2 border-teal-700 pb-2 font-semibold text-teal-700">Info</button>
                <button className="pb-2 text-gray-600">Resume</button>
            </div>
          </div>

          <div className="bg-white border rounded-lg shadow-sm p-6">
            <div className="mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-4">👤 About</h3>
                <p className="text-sm text-gray-500 mb-2">No Data Available</p>
                <p className="text-sm mb-4">Date of Birth: {selectedCandidate.dob || 'N/A'}</p>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs text-gray-500">Flat/House/Building Name*</label><p className="p-2 border rounded bg-gray-50">{selectedCandidate.houseName || 'N/A'}</p></div>
                    <div><label className="block text-xs text-gray-500">Area/Sector/Locality*</label><p className="p-2 border rounded bg-gray-50">{selectedCandidate.area || 'N/A'}</p></div>
                    <div><label className="block text-xs text-gray-500">PIN*</label><p className="p-2 border rounded bg-gray-50">{selectedCandidate.pin || 'N/A'}</p></div>
                    <div><label className="block text-xs text-gray-500">City*</label><p className="p-2 border rounded bg-gray-50">{selectedCandidate.city || 'N/A'}</p></div>
                    <div className="col-span-2"><label className="block text-xs text-gray-500">State*</label><p className="p-2 border rounded bg-gray-50">{selectedCandidate.state || 'N/A'}</p></div>
                </div>
            </div>
            
            <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">💼 Experience</h3>
                <p className="text-sm text-gray-600 mt-2">{selectedCandidate.experience} Years</p>
            </div>
            <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">🎓 Education</h3>
                <p className="text-sm text-gray-500 mt-2">No Data Available</p>
            </div>
            <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">🔑 Key Skills</h3>
                <div className="flex gap-2 mt-2">
                    {(selectedCandidate.skills || '').split(',').map((s: string) => s.trim()).filter(Boolean).map((s: string, i: number) => <span key={i} className="bg-gray-100 px-3 py-1 rounded-full text-xs">{s}</span>)}
                </div>
            </div>
            <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">📂 Job Preferences</h3>
                <p className="text-sm mt-2 font-semibold">Preferred Location</p>
                <div className="flex gap-2 mt-2">
                    {(selectedCandidate.preferredLocationList || []).map((loc: string, i: number) => <span key={i} className="bg-gray-100 px-3 py-1 rounded-full text-xs">{loc}</span>)}
                </div>
            </div>
            <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">💰 CTC</h3>
                <div className="flex gap-8 mt-2 text-sm">
                    <p>Current: No Data Available</p>
                    <p>Expected: No Data Available</p>
                </div>
            </div>
            <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">📋 Projects</h3>
                <p className="text-sm text-gray-500 mt-2">No Data Available</p>
            </div>
            <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">🏆 Achievements</h3>
                <p className="text-sm text-gray-500 mt-2">No Data Available</p>
            </div>
            <div className="border-t pt-6 mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">📜 Certification</h3>
                <p className="text-sm text-gray-500 mt-2">No Data Available</p>
            </div>
            <div className="border-t pt-6">
                <h3 className="text-lg font-bold flex items-center gap-2">🆔 Aadhaar & PAN</h3>
                <div className="flex gap-2 mt-2">
                    <button className="bg-teal-800 text-white px-4 py-2 rounded text-sm">View Aadhaar</button>
                    <button className="bg-teal-800 text-white px-4 py-2 rounded text-sm">View PAN</button>
                    <button className="bg-teal-800 text-white px-4 py-2 rounded text-sm">Bank Details</button>
                </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-gray-50 min-h-screen flex gap-8">
          <div className="w-64 bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit space-y-4">
            <h3 className="font-bold text-lg mb-4">Filters</h3>
            <input placeholder="Search by Name" value={filters.name} className="w-full border p-2 rounded text-sm" onChange={e => setFilters({...filters, name: e.target.value})} />
            <input placeholder="Search by Skills" value={filters.skills} className="w-full border p-2 rounded text-sm" onChange={e => setFilters({...filters, skills: e.target.value})} />
            <input placeholder="Search by Keyword" value={filters.keyword} className="w-full border p-2 rounded text-sm" onChange={e => setFilters({...filters, keyword: e.target.value})} />
            <input placeholder="Qualification" value={filters.qualification} className="w-full border p-2 rounded text-sm" onChange={e => setFilters({...filters, qualification: e.target.value})} />
            <input placeholder="Location" value={filters.location} className="w-full border p-2 rounded text-sm" onChange={e => setFilters({...filters, location: e.target.value})} />
            <div className="flex gap-2">
                <input placeholder="Min Exp" value={filters.minExp} className="w-1/2 border p-2 rounded text-sm" onChange={e => setFilters({...filters, minExp: e.target.value})} />
                <input placeholder="Max Exp" value={filters.maxExp} className="w-1/2 border p-2 rounded text-sm" onChange={e => setFilters({...filters, maxExp: e.target.value})} />
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-bold text-lg mb-2">Bulk Add</h3>
              <button onClick={() => {
                const headers = [["fullName", "dob", "address", "city", "state", "pin", "phone", "email", "pan", "qualification", "experience", "preferredLocation", "accountNumber", "reconfirmAccountNumber", "ifsc", "resume"]];
                const ws = XLSX.utils.aoa_to_sheet(headers);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Template");
                XLSX.writeFile(wb, "CandidateTemplate.xlsx");
              }} className="w-full bg-gray-600 text-white p-2 rounded mb-2">Download Template</button>
              <input type="file" onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    const bstr = evt.target?.result;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data: any[] = XLSX.utils.sheet_to_json(ws);
                    data.forEach((c, index) => {
                      localStorage.setItem(`candidate_excel_${index}_${Date.now()}`, JSON.stringify(c));
                    });
                    loadCandidates();
                    alert('Candidates uploaded successfully!');
                  };
                  reader.readAsBinaryString(e.target.files[0]);
                }
              }} className="w-full text-sm" accept=".xlsx, .xls" />
            </div>
          </div>
          <div className="flex-grow">
            <h2 className="text-2xl font-bold mb-6">Candidate List ({filteredCandidates.length})</h2>
            <div className="space-y-4">
              {filteredCandidates.map((c, i) => {
                const { avg } = getCandidateRatingInfo(c);
                return (
                  <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex cursor-pointer hover:shadow-md transition" onClick={() => setSelectedCandidate(c)}>
                    <div className="flex-shrink-0 mr-6">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold text-gray-500">
                        {c.fullName ? c.fullName.split(' ').map((n: string) => n[0]).join('') : '?'}
                      </div>
                    </div>
                    <div className="flex-grow grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900">{c.fullName}</h3>
                          {/* Average Rating Badge beside candidate name */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsEditingRating(false);
                              setRatingModalCandidate(c);
                            }}
                            className="cursor-pointer transition inline-flex items-center gap-1 shrink-0 ml-1 focus:outline-none"
                            title={`Average Rating: ${avg} (Click to open rating details)`}
                          >
                            <span className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/90 rounded-full px-2.5 py-0.5 text-xs font-bold inline-flex items-center gap-1 shadow-2xs">
                              <span className="text-amber-500">★</span>
                              <span>{avg}</span>
                            </span>
                          </button>
                        </div>
                        <p className="text-gray-600 flex items-center mt-1">📧 {c.email}</p>
                        <p className="text-gray-600 flex items-center mt-1">📞 {c.phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-600"><span className="font-semibold">Qualification:</span> {c.qualification}</p>
                        <p className="text-gray-600"><span className="font-semibold">Experience:</span> {c.experience} Years</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal Page / Overlay matching image_669a2b21.png */}
      {ratingModalCandidate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative border border-gray-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setRatingModalCandidate(null); setIsEditingRating(false); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition cursor-pointer"
            >
              ×
            </button>
            
            {/* Top Header & Average Rating Card matching image_669a2b21.png */}
            {(() => {
              const { avg, list } = getCandidateRatingInfo(ratingModalCandidate);
              return (
                <div className="text-center space-y-4 mb-6">
                  {/* Candidate Name - Bold & Clear */}
                  <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">{ratingModalCandidate.fullName}</h3>

                  {/* Big Blue Average Rating Card - Highlighted & Bolded */}
                  <div className="bg-blue-50/90 border border-blue-200/90 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm mx-auto w-52 transform transition hover:scale-[1.01]">
                    <span className="text-5xl font-black text-blue-600 mb-1 tracking-tight drop-shadow-2xs">
                      {avg}
                    </span>
                    <span className="text-sm font-bold text-gray-700 tracking-wide">Average Rating</span>
                  </div>

                  {/* Screen 1: Stars Row with Edit link vs Screen 2: Score picker with Save button */}
                  {!isEditingRating ? (
                    <div className="flex items-center justify-center gap-3 pt-1">
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-3xl font-bold transition-all ${star <= Math.round(Number(avg) || 5) ? 'text-amber-500 drop-shadow-2xs' : 'text-amber-400/40 font-light'}`}
                          >
                            {star <= Math.round(Number(avg) || 5) ? '★' : '☆'}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => { setIsEditingRating(true); setEditScore(2); }}
                        className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full transition cursor-pointer ml-1 inline-flex items-center gap-1 shadow-2xs"
                      >
                        Edit
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3 pt-2 bg-slate-50 border border-slate-200 p-3.5 rounded-xl max-w-sm mx-auto shadow-2xs">
                      <span className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">Score:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setEditScore(star)}
                            className={`text-2xl focus:outline-none transition-transform hover:scale-125 cursor-pointer ${star <= editScore ? 'text-amber-400 font-bold' : 'text-gray-300'}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <span className="text-xs font-black text-gray-900 bg-white border px-2 py-0.5 rounded shadow-2xs">{editScore}/5</span>
                      <button
                        type="button"
                        onClick={() => {
                          handleSaveRating(ratingModalCandidate, editScore, 'Raj');
                          setIsEditingRating(false);
                        }}
                        className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold text-xs px-4 py-1.5 rounded-md transition shadow-sm cursor-pointer ml-1"
                      >
                        Save
                      </button>
                    </div>
                  )}

                  {/* Total Ratings (N) List Section */}
                  <div className="border-t border-gray-200 pt-5 text-left">
                    <h4 className="font-extrabold text-gray-900 mb-3 text-base">
                      Total Ratings ({list.length})
                    </h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {list.map((r: any, idx: number) => (
                        <div key={r.id || idx} className="bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-2xs transition">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-0.5 text-amber-400">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} className={`text-base ${star <= Math.round(r.score || 5) ? 'text-amber-400' : 'text-gray-300'}`}>
                                  ★
                                </span>
                              ))}
                            </div>
                            <span className="font-bold text-gray-900 text-sm ml-1">
                              {r.reviewerName || 'Raj'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1.5 font-medium">
                            {r.timestamp || '11 Nov 2026, 2:39 pm'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
