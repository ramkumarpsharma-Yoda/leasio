import ListForm from './ListForm.jsx';
import React, { useState, useEffect } from "react";
import { supabase, fetchListings, fetchMyBookings } from './supabase.js';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const PLATFORM_FEE = 0.01;
const PRE_BOOKING_DEPOSIT_PCT = 0.20;
const CANCEL_FREE_HOURS = 2;       // free cancel window before booking start
const CANCEL_PENALTY_PCT = 0.50;   // 50% deducted if cancelled within window

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const SLOTS = ["Custom Hours","Morning (6am–12pm)","Afternoon (12pm–5pm)","Evening (5pm–10pm)","Full Day","Half Day (4hrs)"];

// slot → start hour (24h) for cancellation policy
const SLOT_START_HOUR = {
  "Morning (6am–12pm)": 6,
  "Afternoon (12pm–5pm)": 12,
  "Evening (5pm–10pm)": 17,
  "Full Day": 8,
  "Half Day (4hrs)": 8,
  "Custom Hours": 8,
};

const CATS_ITEM    = ["Furniture","Tools","Electronics","Outdoor","Event","Vehicles","Other"];
const CATS_VENUE   = ["Marriage Hall","Party Hall","Playground","Sports Court","Conference Room","Farmhouse","Other"];
const CATS_SERVICE = ["Sports Coach","Music Teacher","Yoga Instructor","Personal Trainer","Tutor","Chef","Photographer","Other"];

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const SEED = [
  { id:1,  listingType:"item",    title:"Canon DSLR Camera + Lens Kit",        category:"Electronics",  subtype:"both",  owner:"Priya Menon",         ownerId:"u4",  ownerType:"individual", ownerTrust:4.8, rentPrice:1200, deposit:15000, buyPrice:52000,  locality:"HSR Layout",         city:"Bengaluru", rating:4.8, reviews:23,  emoji:"📷", description:"Canon 90D with 18-135mm lens.", minDays:2, verified:true, listingTrust:4.7, totalQty:1,   availableQty:1,   bookedDates:[], available:true },
  { id:2,  listingType:"item",    title:"Industrial Folding Chairs",            category:"Event",        subtype:"rent",  owner:"Krishna Caterers",    ownerId:"u2",  ownerType:"commercial", ownerTrust:4.9, rentPrice:25,   deposit:2000,  buyPrice:null,   locality:"Indiranagar",        city:"Bengaluru", rating:4.9, reviews:87,  emoji:"🪑", description:"Heavy duty folding chairs. Min 20 pcs.", minDays:1, verified:true, listingTrust:4.9, totalQty:200, availableQty:200, bookedDates:[], available:true },
  { id:3,  listingType:"item",    title:"Teak Dining Set (6 Seater)",           category:"Furniture",    subtype:"both",  owner:"Ramesh Sharma",       ownerId:"u1",  ownerType:"individual", ownerTrust:4.8, rentPrice:800,  deposit:5000,  buyPrice:45000,  locality:"Koramangala",        city:"Bengaluru", rating:4.7, reviews:12,  emoji:"🪑", description:"Beautiful teak dining set, barely used.", minDays:3, verified:true, listingTrust:4.6, totalQty:1,   availableQty:1,   bookedDates:[], available:true },
  { id:4,  listingType:"item",    title:"Power Drill + 40 Bit Set",             category:"Tools",        subtype:"both",  owner:"Mahindra Hardware",   ownerId:"u3",  ownerType:"commercial", ownerTrust:4.5, rentPrice:200,  deposit:1500,  buyPrice:3500,   locality:"JP Nagar",           city:"Bengaluru", rating:4.5, reviews:34,  emoji:"🔧", description:"Bosch professional drill set.", minDays:1, verified:true, listingTrust:4.3, totalQty:5,   availableQty:5,   bookedDates:[], available:true },
  { id:11, listingType:"item",    title:"Sony 65\" 4K Smart TV",                category:"Electronics",  subtype:"buy",   owner:"Suresh Nambiar",      ownerId:"u13", ownerType:"individual", ownerTrust:4.6, rentPrice:null, deposit:0,     buyPrice:42000,  locality:"Banashankari",       city:"Bengaluru", rating:4.5, reviews:3,   emoji:"📺", description:"Selling Sony Bravia 65\" 4K TV. 2 years old.", minDays:null, verified:true, listingTrust:4.4, totalQty:1, availableQty:1, bookedDates:[], available:true },
  { id:12, listingType:"item",    title:"Royal Enfield Bullet 350 (2019)",      category:"Vehicles",     subtype:"both",  owner:"Vikram Anand",        ownerId:"u14", ownerType:"individual", ownerTrust:4.7, rentPrice:800,  deposit:10000, buyPrice:85000,  locality:"Malleswaram",        city:"Bengaluru", rating:4.6, reviews:7,   emoji:"🏍", description:"2019 RE Bullet 350, 22,000 km.", minDays:1, verified:true, listingTrust:4.5, totalQty:1, availableQty:1, bookedDates:[], available:true },
  { id:5,  listingType:"venue",   title:"Shree Mahal Marriage Hall",            category:"Marriage Hall", owner:"Shree Events Pvt Ltd", ownerId:"u7", ownerType:"commercial", ownerTrust:4.7, priceHour:2000, priceHalfDay:7000, priceFullDay:12000, deposit:20000, locality:"Basaveshwara Nagar", city:"Bengaluru", rating:4.8, reviews:156, emoji:"💒", description:"AC hall, capacity 500.", verified:true, listingTrust:4.8, capacity:500, amenities:["AC","Kitchen","Parking","Stage","Sound System"], bookedSlots:{"2026-03-01":["Full Day"]}, available:true },
  { id:6,  listingType:"venue",   title:"Green Valley Playground",              category:"Playground",   owner:"BBMP Sports",         ownerId:"u8",  ownerType:"commercial", ownerTrust:4.5, priceHour:500,  priceHalfDay:1800, priceFullDay:3000, deposit:5000, locality:"Hebbal",              city:"Bengaluru", rating:4.3, reviews:41,  emoji:"⚽", description:"Full-size football ground, floodlights.", verified:true, listingTrust:4.4, capacity:100, amenities:["Floodlights","Dressing Rooms","Parking"], bookedSlots:{}, available:true },
  { id:7,  listingType:"venue",   title:"The Loft Party Hall",                  category:"Party Hall",   owner:"Urban Spaces",        ownerId:"u9",  ownerType:"commercial", ownerTrust:4.6, priceHour:1500, priceHalfDay:5000, priceFullDay:8500, deposit:10000, locality:"Whitefield",          city:"Bengaluru", rating:4.6, reviews:67,  emoji:"🎉", description:"Rooftop party hall, capacity 150.", verified:true, listingTrust:4.7, capacity:150, amenities:["AC","DJ Setup","Parking"], bookedSlots:{}, available:true },
  { id:8,  listingType:"service", title:"Football Coaching — AIFF Certified",  category:"Sports Coach", owner:"Arjun Nair",           ownerId:"u10", ownerType:"individual", ownerTrust:4.9, priceHour:800,  minHours:2, daysAvailable:["Mon","Wed","Fri","Sat","Sun"], travelRadius:10, locality:"Indiranagar", city:"Bengaluru", rating:4.9, reviews:44, emoji:"⚽", description:"AIFF certified coach. 12 years experience.", verified:true, listingTrust:4.8, deposit:0, available:true },
  { id:9,  listingType:"service", title:"Yoga & Meditation Sessions",           category:"Yoga Instructor", owner:"Deepa Krishnan",    ownerId:"u11", ownerType:"individual", ownerTrust:4.7, priceHour:600,  minHours:1, daysAvailable:["Mon","Tue","Wed","Thu","Fri","Sat"], travelRadius:5, locality:"Jayanagar", city:"Bengaluru", rating:4.7, reviews:88, emoji:"🧘", description:"RYT 500 certified. Morning sessions preferred.", verified:true, listingTrust:4.7, deposit:0, available:true },
  { id:10, listingType:"service", title:"Professional Wedding Photography",     category:"Photographer", owner:"Studio Lens",          ownerId:"u12", ownerType:"commercial", ownerTrust:4.8, priceHour:3500, minHours:4, daysAvailable:["Sat","Sun"], travelRadius:50, locality:"Koramangala", city:"Bengaluru", rating:4.8, reviews:120, emoji:"📸", description:"10 years experience. Full wedding coverage.", verified:true, listingTrust:4.9, deposit:10000, available:true },
];

// ─── UTILS ────────────────────────────────────────────────────────────────────
const fmt = n => n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "";
const platformFee = r => Math.round(r * PLATFORM_FEE);
const preBookDep = dep => Math.round(dep * PRE_BOOKING_DEPOSIT_PCT);
const trustColor = t => t >= 4.5 ? "#10B981" : t >= 4.0 ? "#F59E0B" : "#EF4444";

// ─── CANCELLATION POLICY HELPER ───────────────────────────────────────────────
// Returns { canCancelFree, penalty, refund, bookingStartMs }
const getCancelPolicy = (order) => {
  const dateStr = order.date || order.start_date;
  if (!dateStr) return { canCancelFree: true, penalty: 0, refund: order.dep || order.total || 0 };
  const slotHour = SLOT_START_HOUR[order.slot] ?? 8;
  const bookingStart = new Date(dateStr);
  bookingStart.setHours(slotHour, 0, 0, 0);
  const now = new Date();
  const hoursUntil = (bookingStart - now) / 3600000;
  const canCancelFree = hoursUntil > CANCEL_FREE_HOURS;
  const bookingAmount = order.dep || order.total || 0;
  const penalty = canCancelFree ? 0 : Math.round(bookingAmount * CANCEL_PENALTY_PCT);
  const refund = bookingAmount - penalty;
  return { canCancelFree, penalty, refund, hoursUntil: Math.max(0, hoursUntil).toFixed(1) };
};

// ─── MICRO UI ─────────────────────────────────────────────────────────────────
const Tag = ({ c = "#10B981", children, small }) => (
  <span style={{ background: c+"18", color: c, border: `1px solid ${c}30`, borderRadius: 20, padding: small ? "1px 7px" : "2px 9px", fontSize: small ? 9 : 10, fontWeight: 800, letterSpacing: .5, whiteSpace: "nowrap" }}>{children}</span>
);

const Btn = ({ variant = "primary", children, style: s = {}, ...p }) => {
  const m = { primary:{bg:"#F59E0B",c:"#0C0E14"}, success:{bg:"#10B981",c:"#fff"}, danger:{bg:"#EF4444",c:"#fff"}, ghost:{bg:"#1C1F27",c:"#C0C8D8"}, outline:{bg:"transparent",c:"#F59E0B"}, blue:{bg:"#2563EB",c:"#fff"}, purple:{bg:"#7C3AED",c:"#fff"} }[variant] || {bg:"#F59E0B",c:"#0C0E14"};
  return <button style={{ background:m.bg, color:m.c, border: variant==="outline"?"1px solid #F59E0B":"none", borderRadius:9, padding:"9px 18px", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"'DM Sans',sans-serif", ...s }} {...p}>{children}</button>;
};

const Inp = ({ label, error, ...p }) => (
  <label style={{ display:"flex", flexDirection:"column", gap:5 }}>
    {label && <span style={{ fontSize:11, fontWeight:700, color: error ? "#EF4444" : "#9CA3AF", letterSpacing:.7, textTransform:"uppercase" }}>{label}{error ? ` — ${error}` : ""}</span>}
    <input style={{ background:"#111318", border:`1px solid ${error ? "#EF4444" : "#252830"}`, borderRadius:9, padding:"10px 13px", color:"#F0EEE8", fontSize:13, outline:"none", fontFamily:"'DM Sans',sans-serif", width:"100%", boxSizing:"border-box" }} {...p} />
  </label>
);

const Textarea = ({ label, ...p }) => (
  <label style={{ display:"flex", flexDirection:"column", gap:5 }}>
    {label && <span style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, textTransform:"uppercase" }}>{label}</span>}
    <textarea style={{ background:"#111318", border:"1px solid #252830", borderRadius:9, padding:"10px 13px", color:"#F0EEE8", fontSize:13, outline:"none", fontFamily:"'DM Sans',sans-serif", resize:"none", height:80, width:"100%", boxSizing:"border-box" }} {...p} />
  </label>
);

const Modal = ({ onClose, children, maxW = 540 }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.88)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={e => e.target===e.currentTarget && onClose?.()}>
    <div style={{ background:"#13151C", border:"1px solid #252830", borderRadius:18, padding:24, width:"100%", maxWidth:maxW, maxHeight:"90vh", overflowY:"auto" }}>{children}</div>
  </div>
);

const MHead = ({ title, onClose }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
    <div style={{ fontWeight:800, fontSize:17 }}>{title}</div>
    <button onClick={onClose} style={{ background:"none", border:"none", color:"#6B7280", fontSize:20, cursor:"pointer" }}>✕</button>
  </div>
);

const InfoBox = ({ color="#10B981", icon, label, sub, children }) => (
  <div style={{ background:color+"12", border:`1.5px solid ${color}35`, borderRadius:12, padding:14, marginBottom:12 }}>
    {label && <div style={{ fontSize:11, fontWeight:800, color, marginBottom:3, letterSpacing:.6 }}>{icon} {label}</div>}
    {sub && <div style={{ fontSize:12, color:"#9CA3AF", marginBottom:8, lineHeight:1.5 }}>{sub}</div>}
    {children}
  </div>
);

const Divider = () => <div style={{ height:1, background:"#1E2130", margin:"14px 0" }} />;

const Row = ({ l, r, color }) => (
  <div style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid #1A1D25" }}>
    <span style={{ color:"#6B7280", fontSize:12 }}>{l}</span>
    <span style={{ fontWeight:700, fontSize:13, color: color||"#F0EEE8" }}>{r}</span>
  </div>
);

const Stars = ({ val, count }) => (
  <span style={{ display:"inline-flex", alignItems:"center", gap:2 }}>
    {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize:12, color: val>=s ? "#F59E0B" : "#374151" }}>★</span>)}
    {count != null && <span style={{ color:"#6B7280", fontSize:11, marginLeft:3 }}>({count})</span>}
  </span>
);

const TrustBadge = ({ score }) => (
  <span style={{ background:trustColor(score)+"20", color:trustColor(score), border:`1px solid ${trustColor(score)}40`, borderRadius:8, padding:"2px 8px", fontSize:11, fontWeight:800 }}>🛡 {score?.toFixed(1)}</span>
);

const AvailBadge = ({ qty, listingType }) => {
  if (listingType === "service") return <Tag c="#10B981">Available</Tag>;
  if (qty === 0) return <Tag c="#EF4444">Unavailable</Tag>;
  if (qty <= 2) return <Tag c="#F97316">{qty} left</Tag>;
  return <Tag c="#10B981">{qty > 50 ? "In Stock" : `${qty} available`}</Tag>;
};

const typeStyle = { item:{color:"#F59E0B",label:"Item"}, venue:{color:"#6366F1",label:"Venue"}, service:{color:"#10B981",label:"Service"} };

// ─── CANCEL / EDIT MODAL ─────────────────────────────────────────────────────
const CancelEditModal = ({ order, onClose, onCancelled, onRescheduled }) => {
  const [mode, setMode] = useState("menu"); // menu | cancel | reschedule
  const [newDate, setNewDate] = useState(order.date || "");
  const [newSlot, setNewSlot] = useState(order.slot || "");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const policy = getCancelPolicy(order);
  const lt = order.listing?.listingType;
  const isPurchase = order.type === "purchase" || order.status === "purchased";

  if (isPurchase) return (
    <Modal onClose={onClose} maxW={440}>
      <MHead title="Manage Order" onClose={onClose} />
      <InfoBox color="#EF4444" icon="⚠️" label="PURCHASES CANNOT BE CANCELLED"
        sub="Once a purchase is confirmed and seller address is unlocked, cancellation is not available. Please contact support if there is an issue with the item." />
      <Btn variant="ghost" style={{ width:"100%" }} onClick={onClose}>Close</Btn>
    </Modal>
  );

  return (
    <Modal onClose={onClose} maxW={480}>
      <MHead title="Manage Booking" onClose={onClose} />

      {/* ── MENU ── */}
      {mode === "menu" && <>
        <div style={{ background:"#0E1016", borderRadius:12, padding:14, marginBottom:16 }}>
          <div style={{ fontWeight:800, marginBottom:4 }}>{order.listing?.title}</div>
          <div style={{ fontSize:12, color:"#9CA3AF" }}>
            {order.date && <span>📅 {order.date}</span>}
            {order.slot && <span> · ⏰ {order.slot}</span>}
            {order.hours && <span> · ⏱ {order.hours} hrs</span>}
          </div>
          <div style={{ fontSize:13, fontWeight:800, color:"#10B981", marginTop:8 }}>{fmt(order.dep || order.total)}</div>
        </div>

        {/* Cancellation policy info */}
        <InfoBox color={policy.canCancelFree ? "#10B981" : "#EF4444"}
          icon={policy.canCancelFree ? "✅" : "⚠️"}
          label={policy.canCancelFree ? "FREE CANCELLATION AVAILABLE" : "CANCELLATION FEE APPLIES"}
          sub={policy.canCancelFree
            ? `You can cancel for free — booking starts in ${policy.hoursUntil} hours (more than 2 hours away).`
            : `Booking starts in ${policy.hoursUntil} hours. Cancelling now will deduct 50% (${fmt(policy.penalty)}) and refund ${fmt(policy.refund)}.`
          } />

        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {lt !== "item" && (
            <Btn variant="blue" style={{ width:"100%" }} onClick={() => setMode("reschedule")}>
              📅 Reschedule Booking
            </Btn>
          )}
          {lt === "item" && (
            <Btn variant="blue" style={{ width:"100%" }} onClick={() => setMode("reschedule")}>
              📅 Change Dates
            </Btn>
          )}
          <Btn variant="danger" style={{ width:"100%" }} onClick={() => setMode("cancel")}>
            ✕ Cancel Booking
          </Btn>
          <Btn variant="ghost" style={{ width:"100%" }} onClick={onClose}>Keep Booking</Btn>
        </div>
      </>}

      {/* ── RESCHEDULE ── */}
      {mode === "reschedule" && <>
        <InfoBox color="#2563EB" icon="📅" label="RESCHEDULE BOOKING"
          sub="Select a new date and time slot. This is free to change." />
        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:16 }}>
          <Inp label="New Date" type="date" value={newDate} min={new Date().toISOString().split("T")[0]}
            onChange={e => setNewDate(e.target.value)} />
          {(lt === "venue") && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, marginBottom:8, textTransform:"uppercase" }}>New Slot</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {SLOTS.filter(s => s !== "Custom Hours").map(slot => (
                  <button key={slot} onClick={() => setNewSlot(slot)}
                    style={{ background: newSlot===slot ? "#2563EB18" : "#111318", border:`1.5px solid ${newSlot===slot ? "#2563EB" : "#252830"}`, borderRadius:8, padding:"9px 14px", color:"#F0EEE8", cursor:"pointer", textAlign:"left", fontFamily:"'DM Sans',sans-serif", fontWeight: newSlot===slot ? 700 : 400, fontSize:13 }}>
                    {newSlot===slot ? "✓ " : "○ "}{slot}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <Btn variant="ghost" onClick={() => setMode("menu")}>← Back</Btn>
          <Btn variant="success" style={{ flex:1 }}
            disabled={!newDate || (lt === "venue" && !newSlot)}
            onClick={() => { onRescheduled(order, newDate, newSlot || order.slot); onClose(); }}>
            ✓ Confirm Reschedule
          </Btn>
        </div>
      </>}

      {/* ── CANCEL CONFIRM ── */}
      {mode === "cancel" && <>
        <InfoBox color="#EF4444" icon="⚠️" label="CONFIRM CANCELLATION">
          <div style={{ fontSize:13, color:"#F0EEE8", lineHeight:1.8 }}>
            <Row l="Booking amount" r={fmt(order.dep || order.total)} />
            {policy.penalty > 0 && <Row l="Cancellation fee (50%)" r={fmt(policy.penalty)} color="#EF4444" />}
            <Row l="You will receive" r={fmt(policy.refund)} color="#10B981" />
          </div>
        </InfoBox>
        {!policy.canCancelFree && (
          <InfoBox color="#F59E0B" icon="💡" label="WHY A FEE?"
            sub={`Your booking was within ${CANCEL_FREE_HOURS} hours of the scheduled start time. The owner has reserved this slot for you and may not be able to rebook it.`} />
        )}
        <div style={{ display:"flex", gap:6, alignItems:"flex-start", marginBottom:16, background:"#111318", border:"1px solid #252830", borderRadius:9, padding:12 }}>
          <input type="checkbox" id="confirmCancelChk" checked={confirmCancel} onChange={e => setConfirmCancel(e.target.checked)} style={{ marginTop:2, accentColor:"#EF4444" }} />
          <label htmlFor="confirmCancelChk" style={{ fontSize:12, color:"#9CA3AF", cursor:"pointer", lineHeight:1.5 }}>
            I understand and agree to the cancellation policy. Refund of {fmt(policy.refund)} will be processed within 5-7 business days.
          </label>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <Btn variant="ghost" onClick={() => setMode("menu")}>← Back</Btn>
          <Btn variant="danger" style={{ flex:1 }} disabled={!confirmCancel}
            onClick={() => { onCancelled(order, policy); onClose(); }}>
            Confirm Cancellation
          </Btn>
        </div>
      </>}
    </Modal>
  );
};

// ─── BOOKING MODAL ────────────────────────────────────────────────────────────
const BookingModal = ({ listing, onClose, onBooked }) => {
  const [step, setStep] = useState(1);
  const [bookForm, setBookForm] = useState({
    date:"", slot:"", customHours:2, hours:2, qty:1, days:1,
    mode:"self", deliverySlot:"",
    renterName:"", renterPhone:"", renterAddress:""
  });
  const [errors, setErrors] = useState({});
  const [preDepPaid, setPreDepPaid] = useState(false);

  if (!listing) return null;
  const lt = listing.listingType;

  const calcTotal = () => {
    if (lt === "item") return bookForm.days * (listing.rentPrice || 0) * bookForm.qty;
    if (lt === "venue") {
      if (bookForm.slot === "Full Day") return listing.priceFullDay || 0;
      if (bookForm.slot === "Half Day (4hrs)") return listing.priceHalfDay || 0;
      if (bookForm.slot === "Custom Hours") return (listing.priceHour || 0) * bookForm.customHours;
      if (bookForm.slot.includes("Morning") || bookForm.slot.includes("Evening")) return (listing.priceHour || 0) * 6;
      return (listing.priceHour || 0) * 5;
    }
    if (lt === "service") return (listing.priceHour || 0) * bookForm.hours;
    return 0;
  };

  const total = calcTotal();
  const fee   = platformFee(total);
  const dep   = lt === "item" ? (listing.deposit || 0) : total;
  const preDep   = lt === "item" ? preBookDep(dep) : dep;
  const remainDep = dep - preDep;
  const isSlotBooked = (date, slot) => listing.bookedSlots?.[date]?.includes(slot) || false;

  // ── step 1 validation ──
  const validateStep1 = () => {
    const e = {};
    if (!bookForm.date) e.date = "Date is required";
    if (lt === "venue" && !bookForm.slot) e.slot = "Please select a booking type";
    if (lt === "item" && !bookForm.endDate) e.endDate = "End date is required";
    if (lt === "item" && bookForm.date && bookForm.endDate && new Date(bookForm.endDate) <= new Date(bookForm.date)) e.endDate = "End date must be after start date";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e = {};
    if (!bookForm.renterName.trim()) e.renterName = "Your name is required";
    if (bookForm.renterPhone.length !== 10) e.renterPhone = "Enter valid 10-digit number";
    if (!bookForm.renterAddress.trim()) e.renterAddress = "Your address is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 3 && !validateStep3()) return;
    setErrors({});
    setStep(s => s + 1);
  };

  const payDeposit = () => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(script);
    script.onload = () => {
      const options = {
        key: 'rzp_test_SHwlf6Ln7T1FjV',
        amount: Math.max(preDep, 1) * 100,
        currency: 'INR',
        name: 'Leasio',
        description: lt === "item" ? 'Pre-booking deposit' : `Booking — ${listing.title}`,
        theme: { color:'#F59E0B' },
        prefill: { name: bookForm.renterName, contact: bookForm.renterPhone },
        handler: function() {
          const order = {
            id: "ord" + Date.now(), listing, total, fee, dep,
            mode: bookForm.mode, status: "pending_handover", depositStatus: "held",
            ownerAddress: listing.full_address || listing.locality + ", " + (listing.city || "Bengaluru"),
            ownerPhone: listing.contact_phone || "+91 98765 43210",
            ownerName: listing.owner || "Owner",
            ...bookForm
          };
          onBooked?.(order);
          onClose?.();
        },
      };
      new window.Razorpay(options).open();
    };
  };

  return (
    <Modal onClose={onClose} maxW={520}>
      <MHead title={`Book — ${listing.title.slice(0,30)}${listing.title.length>30?"…":""}`} onClose={onClose} />

      {/* Progress bar */}
      <div style={{ display:"flex", gap:4, marginBottom:18 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex:1, height:3, borderRadius:2, background: step>=i ? "#F59E0B" : "#252830", transition:"background .3s" }} />
        ))}
      </div>

      {/* Owner info banner */}
      <div style={{ display:"flex", gap:10, alignItems:"center", background:"#0E1016", borderRadius:10, padding:"10px 14px", marginBottom:16 }}>
        <span style={{ fontSize:28 }}>{listing.emoji}</span>
        <div>
          <div style={{ fontWeight:800, fontSize:13 }}>{listing.title}</div>
          <div style={{ fontSize:11, color:"#9CA3AF" }}>Owner: <span style={{ color:"#F0EEE8", fontWeight:700 }}>{listing.owner}</span> · 📍 {listing.locality}</div>
        </div>
      </div>

      {/* ── STEP 1: Date / Slot ── */}
      {step === 1 && <>
        {lt === "item" && <>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:4 }}>
            <Inp label="Start Date *" type="date" value={bookForm.date} error={errors.date}
              min={new Date().toISOString().split("T")[0]}
              onChange={e => { setBookForm(f => ({...f, date:e.target.value})); setErrors(er => ({...er, date:null})); }} />
            <Inp label="End Date *" type="date" error={errors.endDate}
              min={bookForm.date || new Date().toISOString().split("T")[0]}
              onChange={e => {
                const d = Math.max(1, Math.ceil((new Date(e.target.value)-new Date(bookForm.date))/86400000));
                setBookForm(f => ({...f, endDate:e.target.value, days:d}));
                setErrors(er => ({...er, endDate:null}));
              }} />
          </div>
          {bookForm.date && bookForm.endDate && <div style={{ fontSize:12, color:"#10B981", marginBottom:12 }}>✓ {bookForm.days} day{bookForm.days>1?"s":""} selected</div>}
          {listing.totalQty > 1 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, marginBottom:6, textTransform:"uppercase" }}>Quantity (Max {listing.availableQty})</div>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <Btn variant="ghost" style={{ padding:"6px 14px" }} onClick={() => setBookForm(f => ({...f, qty:Math.max(1,f.qty-1)}))}>−</Btn>
                <span style={{ fontWeight:900, fontSize:20, minWidth:30, textAlign:"center" }}>{bookForm.qty}</span>
                <Btn variant="ghost" style={{ padding:"6px 14px" }} onClick={() => setBookForm(f => ({...f, qty:Math.min(listing.availableQty,f.qty+1)}))}>+</Btn>
                <span style={{ fontSize:12, color:"#6B7280" }}>{listing.availableQty} available</span>
              </div>
            </div>
          )}
        </>}

        {lt === "venue" && <>
          <Inp label="Date *" type="date" value={bookForm.date} error={errors.date}
            min={new Date().toISOString().split("T")[0]}
            onChange={e => { setBookForm(f => ({...f, date:e.target.value})); setErrors(er => ({...er, date:null})); }} />
          <div style={{ marginTop:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color: errors.slot ? "#EF4444" : "#9CA3AF", letterSpacing:.7, marginBottom:8, textTransform:"uppercase" }}>
              Select Booking Type {errors.slot && <span>— {errors.slot}</span>}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {SLOTS.map(slot => {
                const booked = isSlotBooked(bookForm.date, slot);
                let price = 0;
                if (slot==="Full Day") price = listing.priceFullDay;
                else if (slot==="Half Day (4hrs)") price = listing.priceHalfDay;
                else if (slot==="Custom Hours") price = listing.priceHour * bookForm.customHours;
                else price = listing.priceHour * (slot.includes("Morning")||slot.includes("Evening") ? 6 : 5);
                return (
                  <div key={slot}>
                    <button disabled={booked} onClick={() => { setBookForm(f => ({...f, slot})); setErrors(er => ({...er, slot:null})); }}
                      style={{ width:"100%", background: booked?"#1A1A22": bookForm.slot===slot?"#F59E0B20":"#111318", border:`1.5px solid ${booked?"#252830":bookForm.slot===slot?"#F59E0B":"#252830"}`, borderRadius:9, padding:"10px 14px", color:booked?"#374151":"#F0EEE8", cursor:booked?"not-allowed":"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", fontFamily:"'DM Sans',sans-serif" }}>
                      <span style={{ fontWeight:600, fontSize:13 }}>{booked?"🔴":bookForm.slot===slot?"✓":"○"} {slot==="Custom Hours" ? "⏱ Custom Hours" : slot}</span>
                      <span style={{ fontWeight:700, color:booked?"#374151":"#F59E0B" }}>{booked?"Booked":fmt(price)}</span>
                    </button>
                    {slot==="Custom Hours" && bookForm.slot==="Custom Hours" && (
                      <div style={{ background:"#0E1016", borderRadius:"0 0 9px 9px", padding:"10px 14px", marginTop:-1, border:"1.5px solid #F59E0B", borderTop:"none" }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", marginBottom:8, textTransform:"uppercase" }}>Hours? ({fmt(listing.priceHour)}/hr)</div>
                        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                          <Btn variant="ghost" style={{ padding:"6px 14px" }} onClick={() => setBookForm(f => ({...f, customHours:Math.max(1,f.customHours-1)}))}>−</Btn>
                          <span style={{ fontWeight:900, fontSize:20, minWidth:30, textAlign:"center" }}>{bookForm.customHours}</span>
                          <Btn variant="ghost" style={{ padding:"6px 14px" }} onClick={() => setBookForm(f => ({...f, customHours:Math.min(12,f.customHours+1)}))}>+</Btn>
                          <span style={{ fontSize:12, color:"#F59E0B", fontWeight:700 }}>{fmt(listing.priceHour*bookForm.customHours)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>}

        {lt === "service" && <>
          <Inp label="Date *" type="date" value={bookForm.date} error={errors.date}
            min={new Date().toISOString().split("T")[0]}
            onChange={e => { setBookForm(f => ({...f, date:e.target.value})); setErrors(er => ({...er, date:null})); }} />
          <div style={{ marginTop:12, marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, marginBottom:6, textTransform:"uppercase" }}>Hours Required (Min {listing.minHours})</div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <Btn variant="ghost" style={{ padding:"6px 14px" }} onClick={() => setBookForm(f => ({...f, hours:Math.max(listing.minHours,f.hours-1)}))}>−</Btn>
              <span style={{ fontWeight:900, fontSize:20, minWidth:30, textAlign:"center" }}>{bookForm.hours}</span>
              <Btn variant="ghost" style={{ padding:"6px 14px" }} onClick={() => setBookForm(f => ({...f, hours:f.hours+1}))}>+</Btn>
              <span style={{ fontSize:12, color:"#6B7280" }}>hrs × {fmt(listing.priceHour)} = {fmt(bookForm.hours*listing.priceHour)}</span>
            </div>
          </div>
          <div style={{ background:"#0E1016", borderRadius:10, padding:12 }}>
            <div style={{ fontSize:11, color:"#9CA3AF", marginBottom:6, fontWeight:700 }}>PROVIDER AVAILABLE ON:</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {DAYS.map(d => <span key={d} style={{ background: listing.daysAvailable?.includes(d)?"#10B98120":"#0E1016", color: listing.daysAvailable?.includes(d)?"#10B981":"#374151", border:`1px solid ${listing.daysAvailable?.includes(d)?"#10B98140":"#252830"}`, borderRadius:6, padding:"3px 8px", fontSize:11, fontWeight:700 }}>{d}</span>)}
            </div>
            <div style={{ fontSize:11, color:"#6B7280", marginTop:6 }}>📍 Travels up to {listing.travelRadius}km from {listing.locality}</div>
          </div>
        </>}

        {total > 0 && (
          <div style={{ background:"#0E1016", borderRadius:10, padding:12, marginTop:14 }}>
            <Row l="Subtotal" r={fmt(total)} />
            <Row l="Platform fee (1%)" r={`− ${fmt(fee)}`} color="#EF4444" />
            {lt==="item" && dep>0 && <Row l="Security deposit" r={fmt(dep)} color="#F59E0B" />}
            {(lt==="venue"||lt==="service") && <Row l="Advance deposit (booking amount)" r={fmt(dep)} color="#F59E0B" />}
          </div>
        )}

        {/* Cancellation policy reminder */}
        <div style={{ background:"#1C1F27", borderRadius:9, padding:10, marginTop:12, fontSize:11, color:"#9CA3AF", lineHeight:1.6 }}>
          🔁 <strong style={{ color:"#F0EEE8" }}>Cancellation Policy:</strong> Free cancellation more than 2 hours before booking start. Within 2 hours → 50% fee deducted.
        </div>
      </>}

      {/* ── STEP 2: Delivery (item) or summary (venue/service) ── */}
      {step === 2 && lt === "item" && <>
        <InfoBox color="#2563EB" icon="🚚" label="HOW WILL YOU RECEIVE THE ITEM?" />
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[{mode:"self",icon:"🤝",label:"Self Pickup / Drop",desc:"Arrange directly with owner. Full address revealed after deposit."},{mode:"app",icon:"🚚",label:"App-Managed Delivery",desc:"Leasio arranges courier. OTP handover tracked in-app."}].map(({mode,icon,label,desc}) => (
            <button key={mode} onClick={() => setBookForm(f => ({...f, mode}))}
              style={{ background: bookForm.mode===mode?"#2563EB18":"#111318", border:`1.5px solid ${bookForm.mode===mode?"#2563EB":"#252830"}`, borderRadius:10, padding:14, cursor:"pointer", textAlign:"left", fontFamily:"'DM Sans',sans-serif" }}>
              <div style={{ fontWeight:700, color:"#F0EEE8", marginBottom:4 }}>{icon} {label}</div>
              <div style={{ fontSize:12, color:"#6B7280", lineHeight:1.5 }}>{desc}</div>
            </button>
          ))}
        </div>
        {bookForm.mode === "app" && (
          <div style={{ marginTop:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, marginBottom:8, textTransform:"uppercase" }}>Select Delivery Timeslot</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
              {["Morning (8–12pm)","Afternoon (12–4pm)","Evening (4–8pm)","Night (8–10pm)"].map(ts => (
                <button key={ts} onClick={() => setBookForm(f => ({...f, deliverySlot:ts}))}
                  style={{ background: bookForm.deliverySlot===ts?"#F59E0B20":"#111318", border:`1px solid ${bookForm.deliverySlot===ts?"#F59E0B":"#252830"}`, borderRadius:8, padding:"8px 10px", color:"#F0EEE8", cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>{ts}</button>
              ))}
            </div>
          </div>
        )}
      </>}

      {step === 2 && (lt==="venue"||lt==="service") && <>
        <InfoBox color="#6366F1" icon="📋" label="BOOKING SUMMARY">
          <Row l={lt==="venue" ? "Slot" : "Duration"} r={lt==="venue" ? (bookForm.slot+(bookForm.slot==="Custom Hours"?` (${bookForm.customHours} hrs)`:"")) : `${bookForm.hours} hours`} />
          <Row l="Date" r={bookForm.date} />
          <Row l="Amount" r={fmt(total)} />
          <Row l="Advance deposit (pay now)" r={fmt(dep)} color="#F59E0B" />
        </InfoBox>
        <InfoBox color="#F59E0B" icon="💡" label="DEPOSIT POLICY"
          sub="Deposit equals booking amount, held by Leasio. Full refund if owner cancels. Cancellation within 2 hours of start incurs 50% fee." />
      </>}

      {/* ── STEP 3: Renter Identity ── */}
      {step === 3 && <>
        <InfoBox color="#7C3AED" icon="🪪" label="YOUR DETAILS ARE REQUIRED"
          sub="Required for coordination. Never shown publicly." />
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <Inp label="Your Full Name *" value={bookForm.renterName} error={errors.renterName}
            onChange={e => { setBookForm(f => ({...f, renterName:e.target.value})); setErrors(er => ({...er, renterName:null})); }}
            placeholder="As per Aadhaar" />
          <div>
            <Inp label="Mobile Number * (10 digits)" value={bookForm.renterPhone} error={errors.renterPhone}
              onChange={e => {
                const val = e.target.value.replace(/\D/g,"").slice(0,10);
                setBookForm(f => ({...f, renterPhone:val}));
                setErrors(er => ({...er, renterPhone:null}));
              }}
              placeholder="9876543210" maxLength={10} inputMode="numeric" />
            {bookForm.renterPhone.length > 0 && bookForm.renterPhone.length < 10 && (
              <div style={{ color:"#EF4444", fontSize:11, marginTop:4 }}>⚠ {10 - bookForm.renterPhone.length} more digits needed</div>
            )}
            {bookForm.renterPhone.length === 10 && <div style={{ color:"#10B981", fontSize:11, marginTop:4 }}>✓ Valid</div>}
          </div>
          <Textarea label="Your Full Address *" value={bookForm.renterAddress}
            onChange={e => { setBookForm(f => ({...f, renterAddress:e.target.value})); setErrors(er => ({...er, renterAddress:null})); }}
            placeholder="Flat/House no, Street, Area, City, Pincode"
            style={{ border:`1px solid ${errors.renterAddress ? "#EF4444" : "#252830"}` }} />
          {errors.renterAddress && <div style={{ color:"#EF4444", fontSize:11 }}>⚠ Address is required</div>}
        </div>
      </>}

      {/* ── STEP 4: Pay ── */}
      {step === 4 && <>
        <InfoBox color="#10B981" icon="🔒" label="ALMOST DONE — CONFIRM & PAY" />
        <div style={{ background:"#0E1016", borderRadius:10, padding:14, marginBottom:14 }}>
          <Row l="Your name" r={bookForm.renterName} />
          <Row l="Your phone" r={bookForm.renterPhone} />
          {lt==="item" ? <>
            <Row l="Pre-booking deposit" r={fmt(preDep)} color="#F59E0B" />
            <Row l="Remaining deposit" r={fmt(remainDep)} />
            <Row l="Rent total" r={fmt(total)} />
          </> : <>
            <Row l={lt==="venue" ? "Slot" : "Duration"} r={lt==="venue" ? bookForm.slot+(bookForm.slot==="Custom Hours"?` (${bookForm.customHours} hrs)`:"") : `${bookForm.hours} hours`} />
            <Row l="Date" r={bookForm.date} />
            <Row l="Pay now (advance)" r={fmt(dep)} color="#F59E0B" />
          </>}
          <div style={{ display:"flex", justifyContent:"space-between", paddingTop:8, marginTop:4, borderTop:"1px solid #252830" }}>
            <span style={{ fontWeight:800 }}>You pay now</span>
            <span style={{ fontWeight:900, fontSize:16, color:"#10B981" }}>{fmt(lt==="item" ? preDep : dep)}</span>
          </div>
        </div>
        <InfoBox color="#2563EB" icon="ℹ️" label="WHAT HAPPENS NEXT">
          <div style={{ fontSize:12, color:"#9CA3AF", lineHeight:1.7 }}>
            ✓ Owner's full address & phone revealed immediately<br/>
            ✓ Owner notified with your contact details<br/>
            ✓ {lt==="item" ? "Pre-deposit refunded if owner doesn't confirm in 4 hours" : "Full refund if owner cancels"}<br/>
            ✓ Free cancellation up to 2 hours before booking start
          </div>
        </InfoBox>
        <Btn variant="primary" style={{ width:"100%" }} onClick={payDeposit}>
          Pay {fmt(lt==="item" ? preDep : dep)} & Confirm Booking
        </Btn>
      </>}

      {/* Navigation */}
      {step < 4 && (
        <div style={{ display:"flex", gap:8, marginTop:16 }}>
          {step > 1 && <Btn variant="ghost" onClick={() => setStep(s => s-1)}>← Back</Btn>}
          <Btn variant="primary" style={{ flex:1 }} onClick={handleNext}>Continue →</Btn>
        </div>
      )}
    </Modal>
  );
};

// ─── PURCHASE MODAL ───────────────────────────────────────────────────────────
const PurchaseModal = ({ listing, onClose, onPurchased }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name:"", phone:"", address:"", mode:"pickup" });
  const [errors, setErrors] = useState({});
  const [paid, setPaid] = useState(false);
  if (!listing) return null;
  const price = listing.buyPrice;
  const platformCut = Math.round(price * 0.01);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (form.phone.length !== 10) e.phone = "Enter 10 digits";
    if (!form.address.trim()) e.address = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const confirm = () => {
    if (!validate()) return;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(script);
    script.onload = () => {
      const options = {
        key:'rzp_test_SHwlf6Ln7T1FjV', amount:price*100, currency:'INR',
        name:'Leasio', description:listing.title, theme:{color:'#10B981'},
        prefill:{ name:form.name, contact:form.phone },
        handler: function(response) {
          setPaid(true); setStep(3);
          onPurchased?.({listing, price, platformCut, ...form, type:'purchase', razorpay_payment_id:response.razorpay_payment_id});
        },
      };
      new window.Razorpay(options).open();
    };
  };

  return (
    <Modal onClose={onClose} maxW={500}>
      <MHead title={"Buy — "+listing.title.slice(0,28)} onClose={onClose} />
      <div style={{ display:"flex", gap:4, marginBottom:18 }}>
        {[1,2,3].map(s => <div key={s} style={{ flex:1, height:3, borderRadius:2, background:step>=s?"#10B981":"#252830", transition:"background .3s" }} />)}
      </div>

      {step===1 && <>
        <div style={{ background:"#0E1016", borderRadius:12, padding:16, marginBottom:14, display:"flex", gap:16, alignItems:"center" }}>
          <div style={{ fontSize:52 }}>{listing.emoji}</div>
          <div>
            <div style={{ fontWeight:800, fontSize:15, marginBottom:4 }}>{listing.title}</div>
            <TrustBadge score={listing.ownerTrust} />
            <div style={{ fontSize:11, color:"#9CA3AF", marginTop:4 }}>Seller: <span style={{ color:"#F0EEE8", fontWeight:700 }}>{listing.owner}</span></div>
            <div style={{ fontSize:11, color:"#6B7280", marginTop:2 }}>📍 {listing.locality} (full address after payment)</div>
          </div>
        </div>
        <div style={{ background:"#0E1016", borderRadius:10, padding:14, marginBottom:14 }}>
          <Row l="Item price" r={fmt(price)} />
          <Row l="Platform fee (1%)" r={"- "+fmt(platformCut)} color="#EF4444" />
          <Row l="Seller receives" r={fmt(price-platformCut)} color="#10B981" />
          <div style={{ display:"flex", justifyContent:"space-between", paddingTop:8, marginTop:4, borderTop:"1px solid #252830" }}>
            <span style={{ fontWeight:800 }}>You pay</span>
            <span style={{ fontWeight:900, fontSize:18, color:"#10B981" }}>{fmt(price)}</span>
          </div>
        </div>
        <InfoBox color="#10B981" icon="🛒" label="SECURE PURCHASE"
          sub="Payment held by Leasio. Seller address revealed after payment. Confirm receipt to release funds." />
        <div style={{ display:"flex", gap:8, marginBottom:10 }}>
          {[{v:"pickup",l:"🤝 Pickup"},{v:"delivery",l:"🚚 Delivery"}].map(({v,l}) => (
            <button key={v} onClick={() => setForm(f => ({...f, mode:v}))} style={{ flex:1, background:form.mode===v?"#10B98118":"#111318", border:`1.5px solid ${form.mode===v?"#10B981":"#252830"}`, borderRadius:9, padding:"10px 8px", cursor:"pointer", color:"#F0EEE8", fontFamily:"'DM Sans',sans-serif", fontWeight:form.mode===v?700:400, fontSize:12 }}>{l}</button>
          ))}
        </div>
        <Btn variant="success" style={{ width:"100%" }} onClick={() => setStep(2)}>Continue →</Btn>
      </>}

      {step===2 && <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <InfoBox color="#7C3AED" icon="🪪" label="YOUR DETAILS REQUIRED"
          sub="Shared with seller for coordination. Never publicly shown." />
        <Inp label="Full Name *" value={form.name} error={errors.name}
          onChange={e => { setForm(f => ({...f,name:e.target.value})); setErrors(er=>({...er,name:null})); }}
          placeholder="As per Aadhaar" />
        <div>
          <Inp label="Mobile Number * (10 digits)" value={form.phone} error={errors.phone}
            onChange={e => { const v=e.target.value.replace(/\D/g,"").slice(0,10); setForm(f=>({...f,phone:v})); setErrors(er=>({...er,phone:null})); }}
            placeholder="9876543210" maxLength={10} inputMode="numeric" />
          {form.phone.length>0&&form.phone.length<10&&<div style={{ color:"#EF4444", fontSize:11, marginTop:4 }}>⚠ {10-form.phone.length} more digits needed</div>}
          {form.phone.length===10&&<div style={{ color:"#10B981", fontSize:11, marginTop:4 }}>✓ Valid</div>}
        </div>
        <Textarea label="Your Address *" value={form.address}
          onChange={e => { setForm(f=>({...f,address:e.target.value})); setErrors(er=>({...er,address:null})); }}
          placeholder="Full address"
          style={{ border:`1px solid ${errors.address?"#EF4444":"#252830"}` }} />
        {errors.address&&<div style={{ color:"#EF4444", fontSize:11 }}>⚠ Address required</div>}
        <div style={{ display:"flex", gap:8 }}>
          <Btn variant="ghost" onClick={() => setStep(1)}>← Back</Btn>
          <Btn variant="success" style={{ flex:1 }} onClick={confirm}>Pay {fmt(price)} & Unlock Seller Address</Btn>
        </div>
      </div>}

      {step===3&&paid&&<>
        <InfoBox color="#10B981" icon="✅" label="PAYMENT RECEIVED — SELLER DETAILS UNLOCKED" />
        <div style={{ background:"#0E1016", borderRadius:12, padding:16, marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#10B981", marginBottom:10 }}>📍 SELLER CONTACT (Only visible to you)</div>
          <div style={{ fontWeight:800, fontSize:15, marginBottom:4 }}>{listing.owner}</div>
          <div style={{ fontSize:13, color:"#9CA3AF", marginBottom:2 }}>📱 {listing.contact_phone || "+91 98765 43210"}</div>
          <div style={{ fontSize:13, color:"#9CA3AF" }}>📍 {listing.full_address || listing.locality+", "+(listing.city||"Bengaluru")}</div>
        </div>
        <InfoBox color="#F59E0B" icon="⚡" label="NEXT STEPS">
          <div style={{ fontSize:12, color:"#9CA3AF", lineHeight:1.7 }}>
            1. Contact seller to arrange {form.mode==="pickup"?"pickup":"delivery"}<br/>
            2. Inspect item on receipt<br/>
            3. Confirm receipt in app → payment released to seller<br/>
            4. Raise dispute within 24h if item not as described
          </div>
        </InfoBox>
        <Btn variant="ghost" style={{ width:"100%" }} onClick={onClose}>Done</Btn>
      </>}
    </Modal>
  );
};

// ─── LISTING CARD ─────────────────────────────────────────────────────────────
const ListingCard = ({ item, onClick }) => {
  const lt = item.listingType;
  const ts = typeStyle[lt];
  const canRent = lt==="item" && (item.subtype==="rent"||item.subtype==="both") && item.rentPrice;
  const canBuy  = lt==="item" && (item.subtype==="buy" ||item.subtype==="both") && item.buyPrice;
  const isRentedOut = lt==="item" && item.subtype!=="buy" && item.availableQty===0;
  const isUnavail = isRentedOut && !canBuy;
  const primaryPrice = canRent ? `${fmt(item.rentPrice)}/day` : canBuy ? fmt(item.buyPrice) : `${fmt(item.priceHour)}/hr`;

  return (
    <div onClick={() => !isUnavail && onClick(item)}
      style={{ background:"#13151C", border:"1px solid #1E2130", borderRadius:14, overflow:"hidden", cursor:isUnavail?"not-allowed":"pointer", opacity:isUnavail?0.5:1, transition:"transform .2s, border-color .2s" }}
      onMouseEnter={e => { if(!isUnavail){e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.borderColor=ts.color+"50";} }}
      onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.borderColor="#1E2130"; }}>
      <div style={{ background:"#0E1016", height:100, display:"flex", alignItems:"center", justifyContent:"center", fontSize:50, position:"relative" }}>
        {item.emoji}
        {isRentedOut&&!canBuy&&<div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.65)", display:"flex", alignItems:"center", justifyContent:"center" }}><Tag c="#EF4444">Rented Out</Tag></div>}
      </div>
      <div style={{ padding:13 }}>
        <div style={{ display:"flex", gap:5, marginBottom:7, flexWrap:"wrap", alignItems:"center" }}>
          <Tag c={ts.color}>{ts.label}</Tag>
          {canRent&&canBuy&&<Tag c="#10B981">Rent or Buy</Tag>}
          {canBuy&&!canRent&&<Tag c="#10B981">For Sale</Tag>}
          {canRent&&!canBuy&&<Tag c="#F59E0B">Rent Only</Tag>}
          {item.verified&&<Tag c="#2563EB">🛡</Tag>}
          {lt==="item"&&<AvailBadge qty={item.availableQty} listingType={lt} />}
        </div>
        <div style={{ fontWeight:800, fontSize:13, marginBottom:3, lineHeight:1.3 }}>{item.title}</div>
        <Stars val={item.rating} count={item.reviews} />
        {lt==="venue"&&<div style={{ fontSize:11, color:"#6B7280", marginTop:3 }}>👥 {item.capacity} capacity</div>}
        {lt==="service"&&<div style={{ fontSize:11, color:"#6B7280", marginTop:3 }}>📅 {item.daysAvailable?.join(", ")}</div>}
        <div style={{ fontSize:11, color:"#6B7280", marginTop:3 }}>📍 {item.locality}</div>
        <Divider />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", gap:6 }}>
          <div>
            {canRent&&<div><span style={{ fontWeight:900, fontSize:17, color:"#F59E0B" }}>{fmt(item.rentPrice)}</span><span style={{ color:"#6B7280", fontSize:11 }}>/day</span></div>}
            {canBuy&&<div style={{ fontSize:canRent?11:17, fontWeight:900, color:"#10B981" }}>{canRent?"Buy: ":""}{fmt(item.buyPrice)}</div>}
            {(lt==="venue"||lt==="service")&&<div style={{ fontWeight:900, fontSize:17, color:ts.color }}>{primaryPrice}</div>}
          </div>
          {item.deposit>0&&canRent&&<div style={{ textAlign:"right" }}>
            <div style={{ fontSize:9, color:"#F59E0B" }}>🔒 deposit</div>
            <div style={{ fontSize:11, fontWeight:700, color:"#F59E0B" }}>{fmt(item.deposit)}</div>
          </div>}
        </div>
        {lt==="item"&&item.totalQty>1&&canRent&&<div style={{ fontSize:10, color:"#6B7280", marginTop:4 }}>{item.availableQty}/{item.totalQty} units available</div>}
      </div>
    </div>
  );
};

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
const LoginScreen = ({ onLogin }) => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async () => {
    setLoading(true); setError('');
    try {
      const fn = mode==='login' ? supabase.auth.signInWithPassword : supabase.auth.signUp;
      const { data, error:e } = await fn.call(supabase.auth, { email, password });
      if (e) throw e;
      onLogin(data.user);
    } catch(e) { setError(mode==='login' ? 'Invalid email or password' : 'Signup failed: '+e.message); }
    setLoading(false);
  };

  const inp = { background:"#111318", border:"1px solid #252830", borderRadius:9, padding:"10px 13px", color:"#F0EEE8", fontSize:13, outline:"none", fontFamily:"'DM Sans',sans-serif", width:"100%", boxSizing:"border-box" };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", minHeight:"100vh", background:"#0C0E14", color:"#F0EEE8", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#13151C", border:"1px solid #252830", borderRadius:16, padding:32, width:"100%", maxWidth:380 }}>
        <div style={{ fontSize:32, fontWeight:900, color:"#F59E0B", marginBottom:4 }}>🏪 Leasio</div>
        <div style={{ color:"#6B7280", marginBottom:20, fontSize:13 }}>{mode==='login'?'Sign in to continue':'Create your account'}</div>
        <div style={{ display:"flex", gap:8, marginBottom:20 }}>
          {['login','signup'].map(m => <button key={m} onClick={() => setMode(m)} style={{ flex:1, background:mode===m?"#F59E0B":"#111318", color:mode===m?"#0C0E14":"#9CA3AF", border:"1px solid #252830", borderRadius:8, padding:"8px", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>{m==='login'?'Sign In':'Sign Up'}</button>)}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <label style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <span style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, textTransform:"uppercase" }}>Email</span>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" style={inp} />
          </label>
          <label style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <span style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, textTransform:"uppercase" }}>Password</span>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" style={inp} onKeyDown={e=>e.key==='Enter'&&handle()} />
          </label>
          {error&&<div style={{ color:"#EF4444", fontSize:12 }}>{error}</div>}
          <button onClick={handle} disabled={loading||!email||!password}
            style={{ background:"#F59E0B", color:"#0C0E14", border:"none", borderRadius:9, padding:"11px 18px", cursor:"pointer", fontWeight:700, fontSize:14, fontFamily:"'DM Sans',sans-serif", marginTop:4 }}>
            {loading?'Please wait...':mode==='login'?'Sign In →':'Create Account →'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── ORDERS VIEW ──────────────────────────────────────────────────────────────
const OrdersView = ({ orders, setView, onManageBooking }) => (
  <div style={{ padding:24, maxWidth:780, margin:"0 auto" }}>
    <div style={{ fontWeight:900, fontSize:22, marginBottom:4 }}>My Bookings</div>
    <div style={{ color:"#6B7280", marginBottom:22, fontSize:13 }}>All your rentals, venue bookings and service appointments</div>
    {orders.length === 0 ? (
      <div style={{ textAlign:"center", color:"#6B7280", padding:"60px 0" }}>
        <div style={{ fontSize:40, marginBottom:8 }}>📦</div>
        <div>No bookings yet.</div>
        <Btn variant="primary" style={{ marginTop:16 }} onClick={() => setView("browse")}>Browse Listings</Btn>
      </div>
    ) : orders.map(order => {
      const isPurchase = order.type==="purchase" || order.status==="purchased";
      const isCancelled = order.status === "cancelled";
      const borderColor = isCancelled ? "#6B7280" : isPurchase ? "#10B981" : typeStyle[order.listing?.listingType]?.color || "#F59E0B";
      const policy = !isPurchase && !isCancelled ? getCancelPolicy(order) : null;

      return (
        <div key={order.id} style={{ background:"#13151C", border:`1.5px solid ${borderColor}35`, borderRadius:14, padding:18, marginBottom:12, opacity: isCancelled ? 0.6 : 1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
            <div>
              <div style={{ fontWeight:800 }}>{order.listing?.title || order.itemTitle || "Booking"}</div>
              <div style={{ display:"flex", gap:6, marginTop:6, flexWrap:"wrap" }}>
                {order.listing && <Tag c={typeStyle[order.listing.listingType]?.color||"#F59E0B"}>{typeStyle[order.listing.listingType]?.label||"Item"}</Tag>}
                {isCancelled ? <Tag c="#6B7280">✕ Cancelled</Tag> : isPurchase ? <Tag c="#10B981">🛒 Purchased</Tag> : <Tag c="#2563EB">📋 Booked</Tag>}
                {!isPurchase && !isCancelled && policy && <Tag c={policy.canCancelFree ? "#10B981" : "#EF4444"}>{policy.canCancelFree ? "Free cancel" : "Fee if cancelled"}</Tag>}
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontWeight:900, color: isCancelled ? "#6B7280" : "#10B981" }}>{fmt(isPurchase ? order.price : order.total)}</div>
              {!isPurchase && order.dep>0 && <div style={{ fontSize:11, color:"#F59E0B" }}>Deposit: {fmt(order.dep)}</div>}
            </div>
          </div>

          {/* Booking details */}
          {order.date && <div style={{ marginTop:6, fontSize:12, color:"#9CA3AF" }}>📅 {order.date}{order.slot ? ` · ${order.slot}` : ""}{order.hours ? ` · ${order.hours} hrs` : ""}</div>}
          {order.deliverySlot && <div style={{ marginTop:4, fontSize:12, color:"#2563EB", fontWeight:700 }}>🚚 Delivery: {order.deliverySlot}</div>}

          {/* Owner details — shown after payment */}
          {!isPurchase && !isCancelled && (
            <div style={{ marginTop:12, background:"#0E1016", borderRadius:10, padding:12 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#10B981", marginBottom:6 }}>📍 OWNER DETAILS</div>
              <div style={{ fontSize:13, color:"#F0EEE8", fontWeight:700 }}>{order.ownerName || order.listing?.owner || "Owner"}</div>
              <div style={{ fontSize:12, color:"#9CA3AF", marginTop:2 }}>📱 {order.ownerPhone || "+91 98765 43210"}</div>
              <div style={{ fontSize:12, color:"#9CA3AF", marginTop:2 }}>📍 {order.ownerAddress || order.listing?.full_address || order.listing?.locality || "Address on file"}</div>
            </div>
          )}

          {isPurchase && <div style={{ marginTop:8, fontSize:12, color:"#10B981" }}>✅ Seller address unlocked · Confirm receipt to release payment</div>}

          {/* Cancellation refund info */}
          {isCancelled && order.refundAmount != null && (
            <div style={{ marginTop:8, fontSize:12, color:"#6B7280" }}>Refund processed: {fmt(order.refundAmount)}</div>
          )}

          {/* Manage button */}
          {!isPurchase && !isCancelled && (
            <div style={{ marginTop:12 }}>
              <Btn variant="ghost" style={{ fontSize:12, padding:"6px 14px" }} onClick={() => onManageBooking(order)}>
                ⚙ Manage Booking
              </Btn>
            </div>
          )}
        </div>
      );
    })}
  </div>
);

// ─── ITEM DETAIL ──────────────────────────────────────────────────────────────
const ItemDetail = ({ item, setSelected, setBookingModal, setBuyModal }) => {
  const lt = item.listingType;
  const ts = typeStyle[lt];
  return (
    <div style={{ padding:24, maxWidth:780, margin:"0 auto" }}>
      <Btn variant="ghost" style={{ marginBottom:18 }} onClick={() => setSelected(null)}>← Back</Btn>
      <div style={{ background:"#13151C", border:"1px solid #1E2130", borderRadius:16, padding:24, marginBottom:20 }}>
        <div style={{ display:"flex", gap:18, flexWrap:"wrap" }}>
          <div style={{ fontSize:72, background:"#0E1016", borderRadius:14, padding:"16px 26px" }}>{item.emoji}</div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" }}>
              <Tag c={ts.color}>{ts.label}</Tag>
              {item.verified&&<Tag c="#2563EB">🛡 Verified</Tag>}
              <AvailBadge qty={item.availableQty} listingType={lt} />
            </div>
            <div style={{ fontSize:21, fontWeight:900, marginBottom:6, lineHeight:1.2 }}>{item.title}</div>
            <Stars val={item.rating} count={item.reviews} />
            <div style={{ display:"flex", gap:8, marginTop:6, alignItems:"center" }}>
              <TrustBadge score={item.ownerTrust} />
              <span style={{ fontSize:11, color:"#6B7280" }}>{item.owner}</span>
            </div>
            <div style={{ fontSize:12, color:"#6B7280", marginTop:5 }}>📍 {item.locality}, {item.city} <span style={{ color:"#374151", fontSize:11 }}>(full address after booking)</span></div>
          </div>
        </div>
        <div style={{ color:"#9CA3AF", lineHeight:1.7, marginTop:16, fontSize:13 }}>{item.description}</div>

        {lt==="venue"&&item.amenities&&(
          <div style={{ marginTop:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", marginBottom:8, textTransform:"uppercase", letterSpacing:.6 }}>Amenities</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>{item.amenities.map(a => <Tag key={a} c="#6366F1">{a}</Tag>)}</div>
            <div style={{ fontSize:12, color:"#6B7280", marginTop:6 }}>👥 Capacity: {item.capacity} persons</div>
          </div>
        )}

        {lt==="service"&&(
          <div style={{ marginTop:14, display:"flex", flexDirection:"column", gap:6 }}>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>{DAYS.map(d => <span key={d} style={{ fontSize:11, background: item.daysAvailable?.includes(d)?"#10B98120":"#111318", color: item.daysAvailable?.includes(d)?"#10B981":"#374151", border:`1px solid ${item.daysAvailable?.includes(d)?"#10B98140":"#252830"}`, borderRadius:6, padding:"3px 8px", fontWeight:700 }}>{d}</span>)}</div>
            <div style={{ fontSize:12, color:"#6B7280" }}>📍 Travels up to {item.travelRadius}km · Min {item.minHours} hr(s) per booking</div>
          </div>
        )}

        <Divider />
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))", gap:10, marginBottom:14 }}>
          {lt==="item"&&(item.subtype==="rent"||item.subtype==="both")&&item.rentPrice&&<div style={{ background:"#0E1016", borderRadius:10, padding:12 }}>
            <div style={{ fontSize:10, color:"#9CA3AF", fontWeight:700 }}>RENT/DAY</div>
            <div style={{ fontSize:20, fontWeight:900, color:ts.color }}>{fmt(item.rentPrice)}</div>
          </div>}
          {lt==="venue"&&<>
            <div style={{ background:"#0E1016", borderRadius:10, padding:12 }}><div style={{ fontSize:10, color:"#9CA3AF", fontWeight:700 }}>PER HOUR</div><div style={{ fontSize:18, fontWeight:900, color:ts.color }}>{fmt(item.priceHour)}</div></div>
            <div style={{ background:"#0E1016", borderRadius:10, padding:12 }}><div style={{ fontSize:10, color:"#9CA3AF", fontWeight:700 }}>HALF DAY</div><div style={{ fontSize:18, fontWeight:900, color:ts.color }}>{fmt(item.priceHalfDay)}</div></div>
            <div style={{ background:"#0E1016", borderRadius:10, padding:12 }}><div style={{ fontSize:10, color:"#9CA3AF", fontWeight:700 }}>FULL DAY</div><div style={{ fontSize:18, fontWeight:900, color:ts.color }}>{fmt(item.priceFullDay)}</div></div>
          </>}
          {lt==="service"&&<div style={{ background:"#0E1016", borderRadius:10, padding:12 }}><div style={{ fontSize:10, color:"#9CA3AF", fontWeight:700 }}>PER HOUR</div><div style={{ fontSize:20, fontWeight:900, color:ts.color }}>{fmt(item.priceHour)}</div></div>}
          {lt==="item"&&item.deposit>0&&<div style={{ background:"#F59E0B12", border:"1.5px solid #F59E0B40", borderRadius:10, padding:12 }}>
            <div style={{ fontSize:10, color:"#F59E0B", fontWeight:700 }}>🔒 DEPOSIT</div>
            <div style={{ fontSize:18, fontWeight:900, color:"#F59E0B" }}>{fmt(item.deposit)}</div>
          </div>}
          {item.buyPrice&&<div style={{ background:"#10B98112", border:"1.5px solid #10B98140", borderRadius:10, padding:12 }}>
            <div style={{ fontSize:10, color:"#10B981", fontWeight:700 }}>BUY PRICE</div>
            <div style={{ fontSize:18, fontWeight:900, color:"#10B981" }}>{fmt(item.buyPrice)}</div>
          </div>}
        </div>

        <InfoBox color="#F59E0B" icon="🔒" label="ADDRESS PRIVACY SYSTEM"
          sub={lt==="item" ? `Full address shown only after paying 20% pre-deposit (${fmt(preBookDep(item.deposit||1000))}). Your address is also required.` : "Owner contact revealed after booking payment."} />

        {/* Cancellation policy on listing page */}
        <div style={{ background:"#1C1F27", borderRadius:9, padding:10, marginBottom:14, fontSize:11, color:"#9CA3AF", lineHeight:1.6 }}>
          🔁 <strong style={{ color:"#F0EEE8" }}>Cancellation Policy:</strong> Free cancellation more than 2 hours before your booking starts. Within 2 hours → 50% of booking amount deducted.
        </div>

        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {lt==="item"&&(item.subtype==="rent"||item.subtype==="both")&&item.availableQty>0&&(
            <Btn variant="primary" style={{ flex:1, minWidth:140, padding:"11px 18px" }} onClick={() => setBookingModal(item)}>🔑 Rent Securely</Btn>
          )}
          {lt!=="item"&&item.availableQty!==0&&(
            <Btn variant="primary" style={{ flex:1, minWidth:140, padding:"11px 18px" }} onClick={() => setBookingModal(item)}>
              {lt==="venue" ? "📅 Reserve Venue" : "📋 Book Session"}
            </Btn>
          )}
          {lt==="item"&&item.buyPrice&&(item.subtype==="buy"||item.subtype==="both")&&(
            <Btn variant="success" style={{ flex:1, minWidth:140, padding:"11px 18px" }} onClick={() => setBuyModal(item)}>🛒 Buy Now — {fmt(item.buyPrice)}</Btn>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── BROWSE VIEW ──────────────────────────────────────────────────────────────
const BrowseView = ({ filtered, allCats, search, setSearch, locality, setLocality, filterLT, setFilterLT, filterSale, setFilterSale, filterCat, setFilterCat, setSelected, toast }) => {
  const [localInput, setLocalInput] = useState(locality);
  useEffect(() => { setLocalInput(locality); }, [locality]);

  return (
    <div style={{ padding:24, maxWidth:1160, margin:"0 auto" }}>
      <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
        <input
          style={{ flex:1, minWidth:200, background:"#111318", border:"1px solid #252830", borderRadius:9, padding:"9px 14px", color:"#F0EEE8", fontSize:13, outline:"none", fontFamily:"'DM Sans',sans-serif" }}
          placeholder="🔍 Search items, venues, services..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <div style={{ display:"flex", alignItems:"center", gap:6, background:"#111318", border:"1px solid #252830", borderRadius:9, padding:"0 12px" }}>
          <span>📍</span>
          <input
            style={{ background:"none", border:"none", color:"#F0EEE8", fontSize:13, outline:"none", width:140, fontFamily:"'DM Sans',sans-serif" }}
            placeholder="Search locality..."
            value={localInput}
            onChange={e => { setLocalInput(e.target.value); setLocality(e.target.value); }} />
          <button onClick={() => navigator.geolocation?.getCurrentPosition(p => {
            const loc = `${p.coords.latitude.toFixed(2)}°N`;
            setLocality(loc); setLocalInput(loc); toast("📍 GPS detected!");
          })} style={{ background:"none", border:"none", color:"#F59E0B", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>GPS</button>
        </div>
      </div>
      <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" }}>
        {[{v:"all",l:"All"},{v:"item",l:"📦 Items"},{v:"venue",l:"🏟 Venues"},{v:"service",l:"👤 Services"}].map(({v,l}) => (
          <Btn key={v} variant={filterLT===v?"primary":"ghost"} style={{ fontSize:12, padding:"6px 14px" }} onClick={() => { setFilterLT(v); setFilterSale(false); }}>{l}</Btn>
        ))}
        <Btn variant={filterSale?"success":"ghost"} style={{ fontSize:12, padding:"6px 14px" }} onClick={() => { setFilterSale(s => !s); setFilterLT("all"); }}>🛒 For Sale</Btn>
        <div style={{ flex:1 }} />
        <select style={{ background:"#111318", border:"1px solid #252830", borderRadius:8, padding:"6px 12px", color:"#9CA3AF", fontSize:12, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="All">All Categories</option>
          {allCats.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(262px, 1fr))", gap:14 }}>
        {filtered.map(item => <ListingCard key={item.id} item={item} onClick={it => setSelected(it)} />)}
      </div>
      {filtered.length === 0 && (
        <div style={{ textAlign:"center", color:"#6B7280", padding:"60px 0" }}>
          <div style={{ fontSize:36, marginBottom:8 }}>🔍</div>
          <div>No listings match your search.</div>
        </div>
      )}
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function Leasio() {
  const [listings, setListings]     = useState([]);
  const [view, setView]             = useState("browse");
  const [selected, setSelected]     = useState(null);
  const [search, setSearch]         = useState("");
  const [locality, setLocality]     = useState("");
  const [filterLT, setFilterLT]     = useState("all");
  const [filterSale, setFilterSale] = useState(false);
  const [filterCat, setFilterCat]   = useState("All");
  const [toasts, setToasts]         = useState([]);
  const [bookingModal, setBookingModal] = useState(null);
  const [buyModal, setBuyModal]     = useState(null);
  const [orders, setOrders]         = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [manageOrder, setManageOrder] = useState(null);

  useEffect(() => {
    fetchListings().then(data => setListings(data.length ? data : SEED)).catch(() => setListings(SEED));
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data:{session} }) => setCurrentUser(session?.user ?? null));
    const { data:{subscription} } = supabase.auth.onAuthStateChange((_,session) => setCurrentUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    fetchMyBookings(currentUser.id).then(setOrders).catch(console.error);
  }, [currentUser]);

  useEffect(() => {
    const l = document.createElement("link");
    l.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap";
    l.rel = "stylesheet"; document.head.appendChild(l);
  }, []);

  const toast = msg => { const id=Date.now(); setToasts(t => [...t,{id,msg}]); setTimeout(() => setToasts(t => t.filter(x => x.id!==id)), 4000); };

  const handleBooked = async (order) => {
    if (currentUser && order.listing.id && typeof order.listing.id === 'string') {
      try {
        const { error:e } = await supabase.from('bookings').insert([{
          listing_id: order.listing.id,
          renter_id: currentUser.id,
          booking_type: order.listing.listingType,
          status: 'pending_handover',
          start_date: order.date || null,
          slot: order.slot || null,
          hours: order.hours || null,
          qty: order.qty || 1,
          delivery_mode: order.mode || 'self',
          total_rent: order.total,
          platform_fee: order.fee,
          deposit_amount: order.dep,
          renter_name: order.renterName,
          renter_phone: order.renterPhone,
          renter_address: order.renterAddress,
          owner_address: order.ownerAddress || null,
          owner_phone: order.ownerPhone || null,
        }]);
        if (e) toast('⚠️ Saved locally only: ' + e.message);
      } catch(err) { console.error(err); }
    }
    setOrders(o => [...o, order]);
    setListings(ls => ls.map(l => {
      if (l.id !== order.listing.id) return l;
      const newQty = Math.max(0, l.availableQty-(order.qty||1));
      return {...l, availableQty:newQty, available:newQty>0};
    }));
    toast("✅ Booking confirmed! Owner details unlocked.");
    setView("orders");
  };

  const handleCancelled = async (order, policy) => {
    // Update in Supabase if real booking
    if (typeof order.id === 'string' && !order.id.startsWith('ord')) {
      await supabase.from('bookings').update({ status:'cancelled' }).eq('id', order.id);
    }
    setOrders(os => os.map(o => o.id===order.id ? {...o, status:'cancelled', refundAmount:policy.refund} : o));
    toast(`✅ Booking cancelled. Refund of ${fmt(policy.refund)} will be processed in 5-7 days.`);
  };

  const handleRescheduled = async (order, newDate, newSlot) => {
    if (typeof order.id === 'string' && !order.id.startsWith('ord')) {
      await supabase.from('bookings').update({ start_date:newDate, slot:newSlot }).eq('id', order.id);
    }
    setOrders(os => os.map(o => o.id===order.id ? {...o, date:newDate, slot:newSlot} : o));
    toast("✅ Booking rescheduled successfully!");
  };

  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} />;

  const filtered = listings.filter(l => {
    const ms = !search || l.title.toLowerCase().includes(search.toLowerCase()) || (l.description||"").toLowerCase().includes(search.toLowerCase());
    const mlt = filterLT==="all" || l.listingType===filterLT;
    const ml = !locality || (l.locality||"").toLowerCase().includes(locality.toLowerCase()) || (l.city||"").toLowerCase().includes(locality.toLowerCase());
    const mc = filterCat==="All" || l.category===filterCat;
    const mSale = !filterSale || (l.listingType==="item"&&(l.subtype==="buy"||l.subtype==="both"));
    return ms&&mlt&&ml&&mc&&mSale;
  });
  const allCats = [...new Set(listings.map(l => l.category))];

  const S = {
    app: { fontFamily:"'DM Sans',sans-serif", minHeight:"100vh", background:"#0C0E14", color:"#F0EEE8" },
    bar: { background:"rgba(12,14,20,.97)", backdropFilter:"blur(24px)", borderBottom:"1px solid #1E2130", padding:"0 20px", display:"flex", alignItems:"center", gap:10, height:58, position:"sticky", top:0, zIndex:100 },
    nav: a => ({ background:a?"#F59E0B":"transparent", color:a?"#0C0E14":"#9CA3AF", border:"none", borderRadius:7, padding:"5px 11px", cursor:"pointer", fontWeight:700, fontSize:12, fontFamily:"'DM Sans',sans-serif" }),
  };

  return (
    <div style={S.app}>
      {/* Toasts */}
      <div style={{ position:"fixed", top:66, right:16, zIndex:300, display:"flex", flexDirection:"column", gap:8, pointerEvents:"none" }}>
        {toasts.map(t => <div key={t.id} style={{ background:"#13151C", border:"1px solid #252830", color:"#F0EEE8", padding:"10px 16px", borderRadius:10, fontWeight:600, fontSize:13, boxShadow:"0 8px 30px rgba(0,0,0,.5)", animation:"slideIn .3s ease" }}>{t.msg}</div>)}
      </div>

      {/* Topbar */}
      <div style={S.bar}>
        <div style={{ fontSize:19, fontWeight:900, color:"#F59E0B", letterSpacing:-1, cursor:"pointer", whiteSpace:"nowrap" }} onClick={() => { setView("browse"); setSelected(null); }}>🏪 Leasio</div>
        <div style={{ flex:1 }} />
        {[{id:"browse",l:"Browse"},{id:"list",l:"+ List"},{id:"orders",l:"Orders"}].map(t => (
          <button key={t.id} style={S.nav(view===t.id&&!selected)} onClick={() => { setView(t.id); setSelected(null); }}>{t.l}</button>
        ))}
        <button style={{ background:"none", border:"none", color:"#6B7280", fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}
          onClick={() => { supabase.auth.signOut(); setCurrentUser(null); }}>Sign Out</button>
      </div>

      {/* Hero */}
      {view==="browse"&&!selected&&(
        <div style={{ background:"linear-gradient(155deg,#130A00 0%,#080A14 50%,#0C0E14 100%)", borderBottom:"1px solid #1E2130", padding:"36px 24px 28px", textAlign:"center" }}>
          <div style={{ fontSize:10, fontWeight:800, color:"#F59E0B", letterSpacing:4, marginBottom:10 }}>INDIA'S SAFEST RENTAL MARKETPLACE</div>
          <div style={{ fontSize:34, fontWeight:900, letterSpacing:-1.5, lineHeight:1.1, marginBottom:10 }}>Items. Venues. Services.</div>
          <div style={{ color:"#6B7280", fontSize:13, maxWidth:500, margin:"0 auto 18px" }}>Rent or buy items, book venues, hire services — with escrow, OTP handover, and deposit safety.</div>
          <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
            {["📦 Rent or Buy","🏟 Book Venues","👤 Hire Services","🔒 Escrow","⚡ OTP Handover","🔁 Free Cancellation*"].map(f => (
              <div key={f} style={{ background:"#13151C", border:"1px solid #1E2130", borderRadius:8, padding:"5px 12px", fontSize:11, color:"#9CA3AF", fontWeight:600 }}>{f}</div>
            ))}
          </div>
        </div>
      )}

      {selected
        ? <ItemDetail item={selected} setSelected={setSelected} setBookingModal={setBookingModal} setBuyModal={setBuyModal} />
        : view==="browse"
          ? <BrowseView filtered={filtered} allCats={allCats} search={search} setSearch={setSearch} locality={locality} setLocality={setLocality} filterLT={filterLT} setFilterLT={setFilterLT} filterSale={filterSale} setFilterSale={setFilterSale} filterCat={filterCat} setFilterCat={setFilterCat} setSelected={setSelected} toast={toast} />
          : view==="list"
            ? <ListForm setListings={setListings} setView={setView} toast={toast} />
            : <OrdersView orders={orders} setView={setView} onManageBooking={setManageOrder} />
      }

      {bookingModal && <BookingModal listing={bookingModal} onClose={() => setBookingModal(null)} onBooked={handleBooked} />}
      {buyModal && <PurchaseModal listing={buyModal} onClose={() => setBuyModal(null)} onPurchased={order => {
        setOrders(o => [...o, {...order, id:"pur"+Date.now(), status:"purchased"}]);
        setListings(ls => ls.map(l => l.id===buyModal.id ? {...l, availableQty:Math.max(0,l.availableQty-1)} : l));
        toast("✅ Purchase confirmed! Seller address unlocked.");
        setView("orders"); setBuyModal(null);
      }} />}
      {manageOrder && <CancelEditModal order={manageOrder} onClose={() => setManageOrder(null)} onCancelled={handleCancelled} onRescheduled={handleRescheduled} />}

      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)} }
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#0C0E14}::-webkit-scrollbar-thumb{background:#1E2130;border-radius:3px}
        select option{background:#111318}
      `}</style>
    </div>
  );
}
