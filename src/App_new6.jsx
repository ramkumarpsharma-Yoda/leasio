import ListForm from './ListForm.jsx';
import React, { useState, useEffect } from "react";
import { supabase, fetchListings, fetchMyBookings } from './supabase.js';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const PLATFORM_FEE = 0.01;
const PRE_BOOKING_DEPOSIT_PCT = 0.20;
const CANCEL_FREE_HOURS = 2;
const CANCEL_PENALTY_PCT = 0.50;

const DAYS  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const SLOTS = ["Custom Hours","Morning (6am–12pm)","Afternoon (12pm–5pm)","Evening (5pm–10pm)","Full Day","Half Day (4hrs)"];
const SLOT_START_HOUR = { "Morning (6am–12pm)":6, "Afternoon (12pm–5pm)":12, "Evening (5pm–10pm)":17, "Full Day":8, "Half Day (4hrs)":8, "Custom Hours":8 };

// ─── SEED DATA ─────────────────────────────────────────────────────────────────
const SEED = [
  { id:1,  listingType:"item",    title:"Canon DSLR Camera + Lens Kit",       category:"Electronics",  subtype:"both",  owner:"Priya Menon",        ownerId:"u4",  ownerType:"individual", ownerTrust:4.8, rentPrice:1200, deposit:15000, buyPrice:52000,  locality:"HSR Layout",        city:"Bengaluru", rating:4.8, reviews:23,  emoji:"📷", description:"Canon 90D with 18-135mm lens. Perfect for events.", minDays:2, verified:true, listingTrust:4.7, totalQty:1,   availableQty:1,   available:true, photoUrl:null },
  { id:2,  listingType:"item",    title:"Industrial Folding Chairs",           category:"Event",        subtype:"rent",  owner:"Krishna Caterers",   ownerId:"u2",  ownerType:"commercial", ownerTrust:4.9, rentPrice:25,   deposit:2000,  buyPrice:null,   locality:"Indiranagar",       city:"Bengaluru", rating:4.9, reviews:87,  emoji:"🪑", description:"Heavy duty folding chairs. Min 20 pcs. Rent only.",  minDays:1, verified:true, listingTrust:4.9, totalQty:200, availableQty:200, available:true, photoUrl:null },
  { id:3,  listingType:"item",    title:"Teak Dining Set (6 Seater)",          category:"Furniture",    subtype:"both",  owner:"Ramesh Sharma",      ownerId:"u1",  ownerType:"individual", ownerTrust:4.8, rentPrice:800,  deposit:5000,  buyPrice:45000,  locality:"Koramangala",       city:"Bengaluru", rating:4.7, reviews:12,  emoji:"🪑", description:"Beautiful teak dining set, barely used.",            minDays:3, verified:true, listingTrust:4.6, totalQty:1,   availableQty:1,   available:true, photoUrl:null },
  { id:4,  listingType:"item",    title:"Power Drill + 40 Bit Set",            category:"Tools",        subtype:"both",  owner:"Mahindra Hardware",  ownerId:"u3",  ownerType:"commercial", ownerTrust:4.5, rentPrice:200,  deposit:1500,  buyPrice:3500,   locality:"JP Nagar",          city:"Bengaluru", rating:4.5, reviews:34,  emoji:"🔧", description:"Bosch professional drill set. 5 units available.",   minDays:1, verified:true, listingTrust:4.3, totalQty:5,   availableQty:5,   available:true, photoUrl:null },
  { id:11, listingType:"item",    title:"Sony 65\" 4K Smart TV",               category:"Electronics",  subtype:"buy",   owner:"Suresh Nambiar",     ownerId:"u13", ownerType:"individual", ownerTrust:4.6, rentPrice:null, deposit:0,     buyPrice:42000,  locality:"Banashankari",      city:"Bengaluru", rating:4.5, reviews:3,   emoji:"📺", description:"Selling Sony Bravia 65\" 4K TV. 2 years old.",       minDays:null, verified:true, listingTrust:4.4, totalQty:1, availableQty:1, available:true, photoUrl:null },
  { id:12, listingType:"item",    title:"Royal Enfield Bullet 350 (2019)",     category:"Vehicles",     subtype:"both",  owner:"Vikram Anand",       ownerId:"u14", ownerType:"individual", ownerTrust:4.7, rentPrice:800,  deposit:10000, buyPrice:85000,  locality:"Malleswaram",       city:"Bengaluru", rating:4.6, reviews:7,   emoji:"🏍", description:"2019 RE Bullet 350, 22,000 km.",                     minDays:1, verified:true, listingTrust:4.5, totalQty:1,   availableQty:1,   available:true, photoUrl:null },
  { id:5,  listingType:"venue",   title:"Shree Mahal Marriage Hall",           category:"Marriage Hall", owner:"Shree Events Pvt Ltd", ownerId:"u7", ownerType:"commercial", ownerTrust:4.7, priceHour:2000, priceHalfDay:7000, priceFullDay:12000, deposit:20000, locality:"Basaveshwara Nagar", city:"Bengaluru", rating:4.8, reviews:156, emoji:"💒", description:"AC hall, capacity 500. Full kitchen, parking.", verified:true, listingTrust:4.8, capacity:500, amenities:["AC","Kitchen","Parking","Stage","Sound System"], bookedSlots:{"2026-03-01":["Full Day"]}, available:true, photoUrl:null },
  { id:6,  listingType:"venue",   title:"Green Valley Playground",             category:"Playground",   owner:"BBMP Sports",         ownerId:"u8",  ownerType:"commercial", ownerTrust:4.5, priceHour:500,  priceHalfDay:1800, priceFullDay:3000, deposit:5000, locality:"Hebbal",             city:"Bengaluru", rating:4.3, reviews:41,  emoji:"⚽", description:"Full-size football ground with floodlights.",       verified:true, listingTrust:4.4, capacity:100, amenities:["Floodlights","Dressing Rooms","Parking"], bookedSlots:{}, available:true, photoUrl:null },
  { id:7,  listingType:"venue",   title:"The Loft Party Hall",                 category:"Party Hall",   owner:"Urban Spaces",        ownerId:"u9",  ownerType:"commercial", ownerTrust:4.6, priceHour:1500, priceHalfDay:5000, priceFullDay:8500, deposit:10000, locality:"Whitefield",         city:"Bengaluru", rating:4.6, reviews:67,  emoji:"🎉", description:"Rooftop party hall, capacity 150.",                  verified:true, listingTrust:4.7, capacity:150, amenities:["AC","DJ Setup","Parking"], bookedSlots:{}, available:true, photoUrl:null },
  { id:8,  listingType:"service", title:"Football Coaching — AIFF Certified", category:"Sports Coach", owner:"Arjun Nair",           ownerId:"u10", ownerType:"individual", ownerTrust:4.9, priceHour:800,  minHours:2, daysAvailable:["Mon","Wed","Fri","Sat","Sun"], travelRadius:10, locality:"Indiranagar", city:"Bengaluru", rating:4.9, reviews:44, emoji:"⚽", description:"AIFF certified coach. 12 years experience.", verified:true, listingTrust:4.8, deposit:0, available:true, photoUrl:null },
  { id:9,  listingType:"service", title:"Yoga & Meditation Sessions",          category:"Yoga Instructor", owner:"Deepa Krishnan",   ownerId:"u11", ownerType:"individual", ownerTrust:4.7, priceHour:600,  minHours:1, daysAvailable:["Mon","Tue","Wed","Thu","Fri","Sat"], travelRadius:5, locality:"Jayanagar", city:"Bengaluru", rating:4.7, reviews:88, emoji:"🧘", description:"RYT 500 certified. Morning sessions preferred.", verified:true, listingTrust:4.7, deposit:0, available:true, photoUrl:null },
  { id:10, listingType:"service", title:"Professional Wedding Photography",    category:"Photographer", owner:"Studio Lens",          ownerId:"u12", ownerType:"commercial", ownerTrust:4.8, priceHour:3500, minHours:4, daysAvailable:["Sat","Sun"], travelRadius:50, locality:"Koramangala", city:"Bengaluru", rating:4.8, reviews:120, emoji:"📸", description:"10 years experience. Full wedding coverage.", verified:true, listingTrust:4.9, deposit:10000, available:true, photoUrl:null },
];

// ─── UTILS ────────────────────────────────────────────────────────────────────
const fmt        = n => n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "";
const platformFee = r => Math.round(r * PLATFORM_FEE);
const preBookDep  = dep => Math.round(dep * PRE_BOOKING_DEPOSIT_PCT);
const trustColor  = t => t >= 4.5 ? "#10B981" : t >= 4.0 ? "#F59E0B" : "#EF4444";

// Recalculate trust from ratings array: weighted average of listing + owner ratings
const calcTrust = (ratings) => {
  if (!ratings || ratings.length === 0) return null;
  const avg = ratings.reduce((s, r) => s + (r.listing_rating + r.owner_rating) / 2, 0) / ratings.length;
  return Math.round(avg * 10) / 10;
};

const getCancelPolicy = (order) => {
  const dateStr = order.date || order.start_date;
  if (!dateStr) return { canCancelFree:true, penalty:0, refund:order.dep||order.total||0 };
  const slotHour = SLOT_START_HOUR[order.slot] ?? 8;
  const bookingStart = new Date(dateStr);
  bookingStart.setHours(slotHour, 0, 0, 0);
  const hoursUntil = (bookingStart - new Date()) / 3600000;
  const canCancelFree = hoursUntil > CANCEL_FREE_HOURS;
  const amount = order.dep || order.total || 0;
  const penalty = canCancelFree ? 0 : Math.round(amount * CANCEL_PENALTY_PCT);
  return { canCancelFree, penalty, refund:amount-penalty, hoursUntil:Math.max(0,hoursUntil).toFixed(1) };
};

// ─── MICRO UI ─────────────────────────────────────────────────────────────────
const Tag = ({ c="#10B981", children, small }) => (
  <span style={{ background:c+"18", color:c, border:`1px solid ${c}30`, borderRadius:20, padding:small?"1px 7px":"2px 9px", fontSize:small?9:10, fontWeight:800, letterSpacing:.5, whiteSpace:"nowrap" }}>{children}</span>
);

const Btn = ({ variant="primary", children, style:s={}, ...p }) => {
  const m = { primary:{bg:"#F59E0B",c:"#0C0E14"}, success:{bg:"#10B981",c:"#fff"}, danger:{bg:"#EF4444",c:"#fff"}, ghost:{bg:"#1C1F27",c:"#C0C8D8"}, outline:{bg:"transparent",c:"#F59E0B"}, blue:{bg:"#2563EB",c:"#fff"}, purple:{bg:"#7C3AED",c:"#fff"} }[variant]||{bg:"#F59E0B",c:"#0C0E14"};
  return <button style={{ background:m.bg, color:m.c, border:variant==="outline"?"1px solid #F59E0B":"none", borderRadius:9, padding:"9px 18px", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"'DM Sans',sans-serif", ...s }} {...p}>{children}</button>;
};

const Inp = ({ label, error, ...p }) => (
  <label style={{ display:"flex", flexDirection:"column", gap:5 }}>
    {label && <span style={{ fontSize:11, fontWeight:700, color:error?"#EF4444":"#9CA3AF", letterSpacing:.7, textTransform:"uppercase" }}>{label}{error?` — ${error}`:""}</span>}
    <input style={{ background:"#111318", border:`1px solid ${error?"#EF4444":"#252830"}`, borderRadius:9, padding:"10px 13px", color:"#F0EEE8", fontSize:13, outline:"none", fontFamily:"'DM Sans',sans-serif", width:"100%", boxSizing:"border-box" }} {...p} />
  </label>
);

const Textarea = ({ label, ...p }) => (
  <label style={{ display:"flex", flexDirection:"column", gap:5 }}>
    {label && <span style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, textTransform:"uppercase" }}>{label}</span>}
    <textarea style={{ background:"#111318", border:"1px solid #252830", borderRadius:9, padding:"10px 13px", color:"#F0EEE8", fontSize:13, outline:"none", fontFamily:"'DM Sans',sans-serif", resize:"none", height:80, width:"100%", boxSizing:"border-box" }} {...p} />
  </label>
);

const Modal = ({ onClose, children, maxW=540 }) => (
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
    <span style={{ fontWeight:700, fontSize:13, color:color||"#F0EEE8" }}>{r}</span>
  </div>
);

const Stars = ({ val, count, size=12 }) => (
  <span style={{ display:"inline-flex", alignItems:"center", gap:2 }}>
    {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize:size, color:val>=s?"#F59E0B":"#374151" }}>★</span>)}
    {count != null && <span style={{ color:"#6B7280", fontSize:11, marginLeft:3 }}>({count})</span>}
  </span>
);

const TrustBadge = ({ score }) => score != null ? (
  <span style={{ background:trustColor(score)+"20", color:trustColor(score), border:`1px solid ${trustColor(score)}40`, borderRadius:8, padding:"2px 8px", fontSize:11, fontWeight:800 }}>🛡 {Number(score).toFixed(1)}</span>
) : null;

const AvailBadge = ({ qty, listingType }) => {
  if (listingType==="service") return <Tag c="#10B981">Available</Tag>;
  if (qty===0) return <Tag c="#EF4444">Unavailable</Tag>;
  if (qty<=2) return <Tag c="#F97316">{qty} left</Tag>;
  return <Tag c="#10B981">{qty>50?"In Stock":`${qty} available`}</Tag>;
};

const typeStyle = { item:{color:"#F59E0B",label:"Item"}, venue:{color:"#6366F1",label:"Venue"}, service:{color:"#10B981",label:"Service"} };

// ─── STAR PICKER ─────────────────────────────────────────────────────────────
const StarPicker = ({ value, onChange, label }) => (
  <div style={{ marginBottom:12 }}>
    <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, textTransform:"uppercase", marginBottom:8 }}>{label}</div>
    <div style={{ display:"flex", gap:6 }}>
      {[1,2,3,4,5].map(s => (
        <button key={s} onClick={() => onChange(s)}
          style={{ fontSize:28, background:"none", border:"none", cursor:"pointer", color:value>=s?"#F59E0B":"#374151", transition:"color .15s, transform .1s", transform: value>=s?"scale(1.1)":"scale(1)" }}>★</button>
      ))}
      {value > 0 && (
        <span style={{ color:"#9CA3AF", fontSize:12, alignSelf:"center", marginLeft:4 }}>
          {["","Poor","Fair","Good","Great","Excellent"][value]}
        </span>
      )}
    </div>
  </div>
);

// ─── RATING MODAL ─────────────────────────────────────────────────────────────
const RatingModal = ({ order, onClose, onSubmitted }) => {
  const [listingRating, setListingRating] = useState(0);
  const [ownerRating,   setOwnerRating]   = useState(0);
  const [reviewText,    setReviewText]    = useState("");
  const [submitting,    setSubmitting]    = useState(false);
  const [done,          setDone]          = useState(false);

  const lt    = order.listing?.listingType;
  const title = order.listing?.title || "this booking";

  const handleSubmit = async () => {
    if (listingRating === 0 || ownerRating === 0) return;
    setSubmitting(true);
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      await supabase.from('reviews').insert([{
        booking_id:      typeof order.id === "string" && !order.id.startsWith("ord") && !order.id.startsWith("pur") ? order.id : null,
        reviewer_id:     user.id,
        listing_id:      typeof order.listing?.id === "string" ? order.listing.id : null,
        listing_rating:  listingRating,
        owner_rating:    ownerRating,
        review_text:     reviewText.trim() || null,
      }]);
    } catch(e) { /* still show success — save happens best-effort */ }
    setDone(true);
    setSubmitting(false);
    onSubmitted?.({ listingRating, ownerRating, reviewText, orderId: order.id });
  };

  if (done) return (
    <Modal onClose={onClose} maxW={420}>
      <div style={{ textAlign:"center", padding:"20px 0" }}>
        <div style={{ fontSize:56, marginBottom:12 }}>🌟</div>
        <div style={{ fontWeight:900, fontSize:20, marginBottom:8 }}>Thank you!</div>
        <div style={{ color:"#9CA3AF", fontSize:13, marginBottom:20 }}>Your rating helps build trust in the Leasio community.</div>
        <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
          <div style={{ background:"#0E1016", borderRadius:10, padding:"10px 20px" }}>
            <div style={{ fontSize:10, color:"#9CA3AF", fontWeight:700 }}>LISTING</div>
            <div style={{ fontWeight:900, color:"#F59E0B", fontSize:18 }}>{listingRating}/5 ★</div>
          </div>
          <div style={{ background:"#0E1016", borderRadius:10, padding:"10px 20px" }}>
            <div style={{ fontSize:10, color:"#9CA3AF", fontWeight:700 }}>OWNER</div>
            <div style={{ fontWeight:900, color:"#10B981", fontSize:18 }}>{ownerRating}/5 ★</div>
          </div>
        </div>
        <Btn variant="primary" style={{ marginTop:20, width:"100%" }} onClick={onClose}>Done</Btn>
      </div>
    </Modal>
  );

  return (
    <Modal onClose={onClose} maxW={460}>
      <MHead title="Rate Your Experience" onClose={onClose} />

      <div style={{ background:"#0E1016", borderRadius:10, padding:12, marginBottom:18, display:"flex", gap:10, alignItems:"center" }}>
        <span style={{ fontSize:32 }}>{order.listing?.emoji || "📦"}</span>
        <div>
          <div style={{ fontWeight:800, fontSize:13 }}>{title}</div>
          <div style={{ fontSize:11, color:"#9CA3AF" }}>
            {order.date && `📅 ${order.date}`}{order.slot && ` · ${order.slot}`}
          </div>
        </div>
      </div>

      <StarPicker value={listingRating} onChange={setListingRating}
        label={lt==="item" ? "Item Quality & Condition" : lt==="venue" ? "Venue Quality & Facilities" : "Service Quality"} />

      <StarPicker value={ownerRating} onChange={setOwnerRating}
        label={lt==="service" ? "Provider — Communication & Professionalism" : "Owner — Communication & Reliability"} />

      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, textTransform:"uppercase", marginBottom:6 }}>Review (optional)</div>
        <textarea
          value={reviewText} onChange={e => setReviewText(e.target.value)}
          placeholder="Share your experience to help others make better decisions..."
          style={{ background:"#111318", border:"1px solid #252830", borderRadius:9, padding:"10px 13px", color:"#F0EEE8", fontSize:13, outline:"none", fontFamily:"'DM Sans',sans-serif", resize:"none", height:90, width:"100%", boxSizing:"border-box" }} />
      </div>

      {(listingRating===0 || ownerRating===0) && (
        <div style={{ fontSize:11, color:"#F59E0B", marginBottom:10 }}>⚠ Please rate both the {lt==="service"?"service":"listing"} and the owner before submitting</div>
      )}

      <Btn variant="primary" style={{ width:"100%", opacity: (listingRating===0||ownerRating===0||submitting)?0.5:1 }}
        disabled={listingRating===0||ownerRating===0||submitting}
        onClick={handleSubmit}>
        {submitting ? "Submitting..." : "Submit Rating ★"}
      </Btn>
    </Modal>
  );
};

// ─── CANCEL / EDIT MODAL ──────────────────────────────────────────────────────
const CancelEditModal = ({ order, onClose, onCancelled, onRescheduled }) => {
  const [mode, setMode]             = useState("menu");
  const [newDate, setNewDate]       = useState(order.date||"");
  const [newSlot, setNewSlot]       = useState(order.slot||"");
  const [confirmCancel, setConfirm] = useState(false);
  const policy = getCancelPolicy(order);
  const isPurchase = order.type==="purchase"||order.status==="purchased";
  const lt = order.listing?.listingType;

  if (isPurchase) return (
    <Modal onClose={onClose} maxW={420}>
      <MHead title="Manage Order" onClose={onClose} />
      <InfoBox color="#EF4444" icon="⚠️" label="PURCHASES CANNOT BE CANCELLED"
        sub="Once a purchase is confirmed, cancellation is not available. Contact support if there is an issue." />
      <Btn variant="ghost" style={{ width:"100%" }} onClick={onClose}>Close</Btn>
    </Modal>
  );

  return (
    <Modal onClose={onClose} maxW={480}>
      <MHead title="Manage Booking" onClose={onClose} />

      {mode==="menu" && <>
        <div style={{ background:"#0E1016", borderRadius:12, padding:14, marginBottom:16 }}>
          <div style={{ fontWeight:800, marginBottom:4 }}>{order.listing?.title}</div>
          <div style={{ fontSize:12, color:"#9CA3AF" }}>
            {order.date&&`📅 ${order.date}`}{order.slot&&` · ${order.slot}`}{order.hours&&` · ${order.hours} hrs`}
          </div>
          <div style={{ fontSize:13, fontWeight:800, color:"#10B981", marginTop:8 }}>{fmt(order.dep||order.total)}</div>
        </div>
        <InfoBox color={policy.canCancelFree?"#10B981":"#EF4444"}
          icon={policy.canCancelFree?"✅":"⚠️"}
          label={policy.canCancelFree?"FREE CANCELLATION AVAILABLE":"CANCELLATION FEE APPLIES"}
          sub={policy.canCancelFree
            ? `You can cancel free — booking starts in ${policy.hoursUntil} hours.`
            : `Booking starts in ${policy.hoursUntil} hours. 50% fee (${fmt(policy.penalty)}) applies. Refund: ${fmt(policy.refund)}.`} />
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          <Btn variant="blue"   style={{ width:"100%" }} onClick={() => setMode("reschedule")}>📅 {lt==="item"?"Change Dates":"Reschedule Booking"}</Btn>
          <Btn variant="danger" style={{ width:"100%" }} onClick={() => setMode("cancel")}>✕ Cancel Booking</Btn>
          <Btn variant="ghost"  style={{ width:"100%" }} onClick={onClose}>Keep Booking</Btn>
        </div>
      </>}

      {mode==="reschedule" && <>
        <InfoBox color="#2563EB" icon="📅" label="RESCHEDULE BOOKING" sub="Free to change date and slot." />
        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:16 }}>
          <Inp label="New Date" type="date" value={newDate} min={new Date().toISOString().split("T")[0]} onChange={e => setNewDate(e.target.value)} />
          {lt==="venue" && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, marginBottom:8, textTransform:"uppercase" }}>New Slot</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {SLOTS.filter(s=>s!=="Custom Hours").map(slot => (
                  <button key={slot} onClick={() => setNewSlot(slot)}
                    style={{ background:newSlot===slot?"#2563EB18":"#111318", border:`1.5px solid ${newSlot===slot?"#2563EB":"#252830"}`, borderRadius:8, padding:"9px 14px", color:"#F0EEE8", cursor:"pointer", textAlign:"left", fontFamily:"'DM Sans',sans-serif", fontWeight:newSlot===slot?700:400, fontSize:13 }}>
                    {newSlot===slot?"✓ ":"○ "}{slot}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <Btn variant="ghost" onClick={() => setMode("menu")}>← Back</Btn>
          <Btn variant="success" style={{ flex:1 }} disabled={!newDate||(lt==="venue"&&!newSlot)}
            onClick={() => { onRescheduled(order, newDate, newSlot||order.slot); onClose(); }}>✓ Confirm Reschedule</Btn>
        </div>
      </>}

      {mode==="cancel" && <>
        <InfoBox color="#EF4444" icon="⚠️" label="CONFIRM CANCELLATION">
          <div style={{ fontSize:13, color:"#F0EEE8", lineHeight:1.8 }}>
            <Row l="Booking amount" r={fmt(order.dep||order.total)} />
            {policy.penalty>0 && <Row l="Cancellation fee (50%)" r={fmt(policy.penalty)} color="#EF4444" />}
            <Row l="You will receive" r={fmt(policy.refund)} color="#10B981" />
          </div>
        </InfoBox>
        {!policy.canCancelFree && <InfoBox color="#F59E0B" icon="💡" label="WHY A FEE?"
          sub={`Booking is within ${CANCEL_FREE_HOURS} hours of start. Owner has reserved this slot and may not rebook it.`} />}
        <div style={{ display:"flex", gap:6, alignItems:"flex-start", marginBottom:16, background:"#111318", border:"1px solid #252830", borderRadius:9, padding:12 }}>
          <input type="checkbox" id="cc" checked={confirmCancel} onChange={e=>setConfirm(e.target.checked)} style={{ marginTop:2, accentColor:"#EF4444" }} />
          <label htmlFor="cc" style={{ fontSize:12, color:"#9CA3AF", cursor:"pointer", lineHeight:1.5 }}>
            I agree to the cancellation policy. Refund of {fmt(policy.refund)} within 5-7 business days.
          </label>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <Btn variant="ghost" onClick={() => setMode("menu")}>← Back</Btn>
          <Btn variant="danger" style={{ flex:1 }} disabled={!confirmCancel}
            onClick={() => { onCancelled(order, policy); onClose(); }}>Confirm Cancellation</Btn>
        </div>
      </>}
    </Modal>
  );
};

// ─── BOOKING MODAL ────────────────────────────────────────────────────────────
const BookingModal = ({ listing, onClose, onBooked }) => {
  const [step, setStep]       = useState(1);
  const [bookForm, setBookForm] = useState({ date:"", slot:"", customHours:2, hours:2, qty:1, days:1, mode:"self", deliverySlot:"", renterName:"", renterPhone:"", renterAddress:"" });
  const [errors, setErrors]   = useState({});

  if (!listing) return null;
  const lt = listing.listingType;

  const calcTotal = () => {
    if (lt==="item")    return bookForm.days*(listing.rentPrice||0)*bookForm.qty;
    if (lt==="venue")   {
      if (bookForm.slot==="Full Day")       return listing.priceFullDay||0;
      if (bookForm.slot==="Half Day (4hrs)") return listing.priceHalfDay||0;
      if (bookForm.slot==="Custom Hours")    return (listing.priceHour||0)*bookForm.customHours;
      return (listing.priceHour||0)*(bookForm.slot.includes("Morning")||bookForm.slot.includes("Evening")?6:5);
    }
    if (lt==="service") return (listing.priceHour||0)*bookForm.hours;
    return 0;
  };

  const total     = calcTotal();
  const fee       = platformFee(total);
  const dep       = lt==="item" ? (listing.deposit||0) : total;
  const preDep    = lt==="item" ? preBookDep(dep) : dep;
  const remainDep = dep - preDep;
  const isSlotBooked = (date, slot) => listing.bookedSlots?.[date]?.includes(slot)||false;

  const validateStep1 = () => {
    const e={};
    if (!bookForm.date) e.date="Date is required";
    if (lt==="venue" && !bookForm.slot) e.slot="Please select a slot";
    if (lt==="item"  && !bookForm.endDate) e.endDate="End date required";
    if (lt==="item"  && bookForm.date && bookForm.endDate && new Date(bookForm.endDate)<=new Date(bookForm.date)) e.endDate="End date must be after start";
    setErrors(e); return Object.keys(e).length===0;
  };

  const validateStep3 = () => {
    const e={};
    if (!bookForm.renterName.trim()) e.renterName="Name required";
    if (bookForm.renterPhone.length!==10) e.renterPhone="Enter 10-digit number";
    if (!bookForm.renterAddress.trim()) e.renterAddress="Address required";
    setErrors(e); return Object.keys(e).length===0;
  };

  const handleNext = () => {
    if (step===1 && !validateStep1()) return;
    if (step===3 && !validateStep3()) return;
    setErrors({}); setStep(s=>s+1);
  };

  const payDeposit = () => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(script);
    script.onload = () => {
      const options = {
        key:'rzp_test_SHwlf6Ln7T1FjV', amount:Math.max(preDep,1)*100, currency:'INR',
        name:'Leasio', description:lt==="item"?'Pre-booking deposit':`Booking — ${listing.title}`,
        theme:{color:'#F59E0B'}, prefill:{name:bookForm.renterName, contact:bookForm.renterPhone},
        handler: function() {
          const order = {
            id:"ord"+Date.now(), listing, total, fee, dep,
            mode:bookForm.mode, status:"pending_handover", depositStatus:"held",
            ownerAddress: listing.full_address||listing.locality+", "+(listing.city||"Bengaluru"),
            ownerPhone:   listing.contact_phone||"+91 98765 43210",
            ownerName:    listing.owner||"Owner",
            ...bookForm
          };
          onBooked?.(order); onClose?.();
        },
      };
      new window.Razorpay(options).open();
    };
  };

  return (
    <Modal onClose={onClose} maxW={520}>
      <MHead title={`Book — ${listing.title.slice(0,30)}${listing.title.length>30?"…":""}`} onClose={onClose} />
      <div style={{ display:"flex", gap:4, marginBottom:18 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ flex:1, height:3, borderRadius:2, background:step>=i?"#F59E0B":"#252830", transition:"background .3s" }} />)}
      </div>
      <div style={{ display:"flex", gap:10, alignItems:"center", background:"#0E1016", borderRadius:10, padding:"10px 14px", marginBottom:16 }}>
        {listing.photoUrl ? <img src={listing.photoUrl} alt="" style={{ width:42, height:42, objectFit:"cover", borderRadius:8 }} /> : <span style={{ fontSize:28 }}>{listing.emoji}</span>}
        <div>
          <div style={{ fontWeight:800, fontSize:13 }}>{listing.title}</div>
          <div style={{ fontSize:11, color:"#9CA3AF" }}>Owner: <span style={{ color:"#F0EEE8", fontWeight:700 }}>{listing.owner}</span> · 📍 {listing.locality}</div>
        </div>
      </div>

      {/* STEP 1 */}
      {step===1 && <>
        {lt==="item" && <>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:4 }}>
            <Inp label="Start Date *" type="date" value={bookForm.date} error={errors.date}
              min={new Date().toISOString().split("T")[0]}
              onChange={e => { setBookForm(f=>({...f,date:e.target.value})); setErrors(er=>({...er,date:null})); }} />
            <Inp label="End Date *" type="date" error={errors.endDate}
              min={bookForm.date||new Date().toISOString().split("T")[0]}
              onChange={e => {
                const d = Math.max(1,Math.ceil((new Date(e.target.value)-new Date(bookForm.date))/86400000));
                setBookForm(f=>({...f,endDate:e.target.value,days:d}));
                setErrors(er=>({...er,endDate:null}));
              }} />
          </div>
          {bookForm.days>0&&bookForm.endDate&&<div style={{ fontSize:12, color:"#10B981", marginBottom:10 }}>✓ {bookForm.days} day{bookForm.days>1?"s":""}</div>}
          {listing.totalQty>1&&<div style={{ marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, marginBottom:6, textTransform:"uppercase" }}>Quantity (Max {listing.availableQty})</div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <Btn variant="ghost" style={{ padding:"6px 14px" }} onClick={() => setBookForm(f=>({...f,qty:Math.max(1,f.qty-1)}))}>−</Btn>
              <span style={{ fontWeight:900, fontSize:20, minWidth:30, textAlign:"center" }}>{bookForm.qty}</span>
              <Btn variant="ghost" style={{ padding:"6px 14px" }} onClick={() => setBookForm(f=>({...f,qty:Math.min(listing.availableQty,f.qty+1)}))}>+</Btn>
              <span style={{ fontSize:12, color:"#6B7280" }}>{listing.availableQty} available</span>
            </div>
          </div>}
        </>}

        {lt==="venue" && <>
          <Inp label="Date *" type="date" value={bookForm.date} error={errors.date}
            min={new Date().toISOString().split("T")[0]}
            onChange={e => { setBookForm(f=>({...f,date:e.target.value})); setErrors(er=>({...er,date:null})); }} />
          <div style={{ marginTop:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:errors.slot?"#EF4444":"#9CA3AF", letterSpacing:.7, marginBottom:8, textTransform:"uppercase" }}>
              Booking Type {errors.slot&&`— ${errors.slot}`}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {SLOTS.map(slot => {
                const booked = isSlotBooked(bookForm.date,slot);
                let price = slot==="Full Day"?listing.priceFullDay:slot==="Half Day (4hrs)"?listing.priceHalfDay:slot==="Custom Hours"?(listing.priceHour*bookForm.customHours):(listing.priceHour*(slot.includes("Morning")||slot.includes("Evening")?6:5));
                return (
                  <div key={slot}>
                    <button disabled={booked} onClick={() => { setBookForm(f=>({...f,slot})); setErrors(er=>({...er,slot:null})); }}
                      style={{ width:"100%", background:booked?"#1A1A22":bookForm.slot===slot?"#F59E0B20":"#111318", border:`1.5px solid ${booked?"#252830":bookForm.slot===slot?"#F59E0B":"#252830"}`, borderRadius:9, padding:"10px 14px", color:booked?"#374151":"#F0EEE8", cursor:booked?"not-allowed":"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", fontFamily:"'DM Sans',sans-serif" }}>
                      <span style={{ fontWeight:600, fontSize:13 }}>{booked?"🔴":bookForm.slot===slot?"✓":"○"} {slot==="Custom Hours"?"⏱ Custom Hours":slot}</span>
                      <span style={{ fontWeight:700, color:booked?"#374151":"#F59E0B" }}>{booked?"Booked":fmt(price)}</span>
                    </button>
                    {slot==="Custom Hours"&&bookForm.slot==="Custom Hours"&&(
                      <div style={{ background:"#0E1016", borderRadius:"0 0 9px 9px", padding:"10px 14px", border:"1.5px solid #F59E0B", borderTop:"none" }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", marginBottom:8, textTransform:"uppercase" }}>Hours? ({fmt(listing.priceHour)}/hr)</div>
                        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                          <Btn variant="ghost" style={{ padding:"6px 14px" }} onClick={() => setBookForm(f=>({...f,customHours:Math.max(1,f.customHours-1)}))}>−</Btn>
                          <span style={{ fontWeight:900, fontSize:20, minWidth:30, textAlign:"center" }}>{bookForm.customHours}</span>
                          <Btn variant="ghost" style={{ padding:"6px 14px" }} onClick={() => setBookForm(f=>({...f,customHours:Math.min(12,f.customHours+1)}))}>+</Btn>
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

        {lt==="service" && <>
          <Inp label="Date *" type="date" value={bookForm.date} error={errors.date}
            min={new Date().toISOString().split("T")[0]}
            onChange={e => { setBookForm(f=>({...f,date:e.target.value})); setErrors(er=>({...er,date:null})); }} />
          <div style={{ marginTop:12, marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, marginBottom:6, textTransform:"uppercase" }}>Hours (Min {listing.minHours})</div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <Btn variant="ghost" style={{ padding:"6px 14px" }} onClick={() => setBookForm(f=>({...f,hours:Math.max(listing.minHours,f.hours-1)}))}>−</Btn>
              <span style={{ fontWeight:900, fontSize:20, minWidth:30, textAlign:"center" }}>{bookForm.hours}</span>
              <Btn variant="ghost" style={{ padding:"6px 14px" }} onClick={() => setBookForm(f=>({...f,hours:f.hours+1}))}>+</Btn>
              <span style={{ fontSize:12, color:"#6B7280" }}>× {fmt(listing.priceHour)} = {fmt(bookForm.hours*listing.priceHour)}</span>
            </div>
          </div>
          <div style={{ background:"#0E1016", borderRadius:10, padding:12 }}>
            <div style={{ fontSize:11, color:"#9CA3AF", marginBottom:6, fontWeight:700 }}>AVAILABLE DAYS:</div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {DAYS.map(d => <span key={d} style={{ background:listing.daysAvailable?.includes(d)?"#10B98120":"#0E1016", color:listing.daysAvailable?.includes(d)?"#10B981":"#374151", border:`1px solid ${listing.daysAvailable?.includes(d)?"#10B98140":"#252830"}`, borderRadius:6, padding:"3px 8px", fontSize:11, fontWeight:700 }}>{d}</span>)}
            </div>
          </div>
        </>}

        {total>0&&<div style={{ background:"#0E1016", borderRadius:10, padding:12, marginTop:14 }}>
          <Row l="Subtotal" r={fmt(total)} />
          <Row l="Platform fee (1%)" r={`− ${fmt(fee)}`} color="#EF4444" />
          {lt==="item"&&dep>0&&<Row l="Security deposit" r={fmt(dep)} color="#F59E0B" />}
          {(lt==="venue"||lt==="service")&&<Row l="Advance deposit" r={fmt(dep)} color="#F59E0B" />}
        </div>}
        <div style={{ background:"#1C1F27", borderRadius:9, padding:10, marginTop:12, fontSize:11, color:"#9CA3AF", lineHeight:1.6 }}>
          🔁 <strong style={{ color:"#F0EEE8" }}>Cancellation:</strong> Free before 2 hours of start. Within 2 hours → 50% fee.
        </div>
      </>}

      {/* STEP 2 */}
      {step===2&&lt==="item"&&<>
        <InfoBox color="#2563EB" icon="🚚" label="HOW WILL YOU RECEIVE THE ITEM?" />
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[{mode:"self",icon:"🤝",label:"Self Pickup",desc:"Arrange with owner. Address revealed after deposit."},{mode:"app",icon:"🚚",label:"App-Managed Delivery",desc:"Leasio courier. OTP handover tracked in-app."}].map(({mode,icon,label,desc}) => (
            <button key={mode} onClick={() => setBookForm(f=>({...f,mode}))}
              style={{ background:bookForm.mode===mode?"#2563EB18":"#111318", border:`1.5px solid ${bookForm.mode===mode?"#2563EB":"#252830"}`, borderRadius:10, padding:14, cursor:"pointer", textAlign:"left", fontFamily:"'DM Sans',sans-serif" }}>
              <div style={{ fontWeight:700, color:"#F0EEE8", marginBottom:4 }}>{icon} {label}</div>
              <div style={{ fontSize:12, color:"#6B7280" }}>{desc}</div>
            </button>
          ))}
        </div>
        {bookForm.mode==="app"&&<div style={{ marginTop:12 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, marginBottom:8, textTransform:"uppercase" }}>Delivery Timeslot</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            {["Morning (8–12pm)","Afternoon (12–4pm)","Evening (4–8pm)","Night (8–10pm)"].map(ts => (
              <button key={ts} onClick={() => setBookForm(f=>({...f,deliverySlot:ts}))}
                style={{ background:bookForm.deliverySlot===ts?"#F59E0B20":"#111318", border:`1px solid ${bookForm.deliverySlot===ts?"#F59E0B":"#252830"}`, borderRadius:8, padding:"8px 10px", color:"#F0EEE8", cursor:"pointer", fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>{ts}</button>
            ))}
          </div>
        </div>}
      </>}

      {step===2&&(lt==="venue"||lt==="service")&&<>
        <InfoBox color="#6366F1" icon="📋" label="BOOKING SUMMARY">
          <Row l={lt==="venue"?"Slot":"Duration"} r={lt==="venue"?(bookForm.slot+(bookForm.slot==="Custom Hours"?` (${bookForm.customHours} hrs)`:"")):(`${bookForm.hours} hours`)} />
          <Row l="Date" r={bookForm.date} />
          <Row l="Amount" r={fmt(total)} />
          <Row l="Advance deposit (pay now)" r={fmt(dep)} color="#F59E0B" />
        </InfoBox>
        <InfoBox color="#F59E0B" icon="💡" label="DEPOSIT POLICY"
          sub="Deposit equals full booking amount. Full refund if owner cancels. 50% fee if you cancel within 2 hours of start." />
      </>}

      {/* STEP 3 */}
      {step===3&&<>
        <InfoBox color="#7C3AED" icon="🪪" label="YOUR DETAILS" sub="Shared with owner for coordination. Never public." />
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <Inp label="Full Name *" value={bookForm.renterName} error={errors.renterName}
            onChange={e => { setBookForm(f=>({...f,renterName:e.target.value})); setErrors(er=>({...er,renterName:null})); }}
            placeholder="As per Aadhaar" />
          <div>
            <Inp label="Mobile Number * (10 digits)" value={bookForm.renterPhone} error={errors.renterPhone}
              onChange={e => { const v=e.target.value.replace(/\D/g,"").slice(0,10); setBookForm(f=>({...f,renterPhone:v})); setErrors(er=>({...er,renterPhone:null})); }}
              placeholder="9876543210" maxLength={10} inputMode="numeric" />
            {bookForm.renterPhone.length>0&&bookForm.renterPhone.length<10&&<div style={{ color:"#EF4444", fontSize:11, marginTop:4 }}>⚠ {10-bookForm.renterPhone.length} more digits needed</div>}
            {bookForm.renterPhone.length===10&&<div style={{ color:"#10B981", fontSize:11, marginTop:4 }}>✓ Valid</div>}
          </div>
          <Textarea label="Your Full Address *" value={bookForm.renterAddress}
            onChange={e => { setBookForm(f=>({...f,renterAddress:e.target.value})); setErrors(er=>({...er,renterAddress:null})); }}
            placeholder="Flat, Street, Area, City, Pincode"
            style={{ border:`1px solid ${errors.renterAddress?"#EF4444":"#252830"}` }} />
          {errors.renterAddress&&<div style={{ color:"#EF4444", fontSize:11 }}>⚠ Address required</div>}
        </div>
      </>}

      {/* STEP 4 */}
      {step===4&&<>
        <InfoBox color="#10B981" icon="🔒" label="CONFIRM & PAY" />
        <div style={{ background:"#0E1016", borderRadius:10, padding:14, marginBottom:14 }}>
          <Row l="Your name" r={bookForm.renterName} />
          <Row l="Your phone" r={bookForm.renterPhone} />
          {lt==="item"?<>
            <Row l="Pre-booking deposit" r={fmt(preDep)} color="#F59E0B" />
            <Row l="Remaining deposit" r={fmt(remainDep)} />
            <Row l="Rent total" r={fmt(total)} />
          </>:<>
            <Row l={lt==="venue"?"Slot":"Duration"} r={lt==="venue"?(bookForm.slot+(bookForm.slot==="Custom Hours"?` (${bookForm.customHours} hrs)`:"")):(`${bookForm.hours} hrs`)} />
            <Row l="Date" r={bookForm.date} />
            <Row l="Pay now" r={fmt(dep)} color="#F59E0B" />
          </>}
          <div style={{ display:"flex", justifyContent:"space-between", paddingTop:8, marginTop:4, borderTop:"1px solid #252830" }}>
            <span style={{ fontWeight:800 }}>You pay now</span>
            <span style={{ fontWeight:900, fontSize:16, color:"#10B981" }}>{fmt(lt==="item"?preDep:dep)}</span>
          </div>
        </div>
        <InfoBox color="#2563EB" icon="ℹ️" label="WHAT HAPPENS NEXT">
          <div style={{ fontSize:12, color:"#9CA3AF", lineHeight:1.7 }}>
            ✓ Owner's address & phone revealed immediately<br/>
            ✓ Owner notified with your details<br/>
            ✓ {lt==="item"?"Pre-deposit refunded if owner doesn't confirm in 4 hours":"Full refund if owner cancels"}<br/>
            ✓ After your booking, you can leave a rating
          </div>
        </InfoBox>
        <Btn variant="primary" style={{ width:"100%" }} onClick={payDeposit}>Pay {fmt(lt==="item"?preDep:dep)} & Confirm Booking</Btn>
      </>}

      {step<4&&<div style={{ display:"flex", gap:8, marginTop:16 }}>
        {step>1&&<Btn variant="ghost" onClick={() => setStep(s=>s-1)}>← Back</Btn>}
        <Btn variant="primary" style={{ flex:1 }} onClick={handleNext}>Continue →</Btn>
      </div>}
    </Modal>
  );
};

// ─── PURCHASE MODAL ───────────────────────────────────────────────────────────
const PurchaseModal = ({ listing, onClose, onPurchased }) => {
  const [step, setStep]   = useState(1);
  const [form, setForm]   = useState({ name:"", phone:"", address:"", mode:"pickup" });
  const [errors, setErrors] = useState({});
  const [paid, setPaid]   = useState(false);
  if (!listing) return null;
  const price = listing.buyPrice;
  const platformCut = Math.round(price*0.01);

  const validate = () => {
    const e={};
    if (!form.name.trim()) e.name="Required";
    if (form.phone.length!==10) e.phone="Enter 10 digits";
    if (!form.address.trim()) e.address="Required";
    setErrors(e); return Object.keys(e).length===0;
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
        prefill:{name:form.name, contact:form.phone},
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

      {step===1&&<>
        <div style={{ background:"#0E1016", borderRadius:12, padding:16, marginBottom:14, display:"flex", gap:16, alignItems:"center" }}>
          {listing.photoUrl ? <img src={listing.photoUrl} alt="" style={{ width:64, height:64, objectFit:"cover", borderRadius:10 }} /> : <div style={{ fontSize:52 }}>{listing.emoji}</div>}
          <div>
            <div style={{ fontWeight:800, fontSize:15, marginBottom:4 }}>{listing.title}</div>
            <TrustBadge score={listing.ownerTrust} />
            <div style={{ fontSize:11, color:"#9CA3AF", marginTop:4 }}>Seller: <span style={{ color:"#F0EEE8", fontWeight:700 }}>{listing.owner}</span></div>
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
            <button key={v} onClick={() => setForm(f=>({...f,mode:v}))} style={{ flex:1, background:form.mode===v?"#10B98118":"#111318", border:`1.5px solid ${form.mode===v?"#10B981":"#252830"}`, borderRadius:9, padding:"10px 8px", cursor:"pointer", color:"#F0EEE8", fontFamily:"'DM Sans',sans-serif", fontWeight:form.mode===v?700:400, fontSize:12 }}>{l}</button>
          ))}
        </div>
        <Btn variant="success" style={{ width:"100%" }} onClick={() => setStep(2)}>Continue →</Btn>
      </>}

      {step===2&&<div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <InfoBox color="#7C3AED" icon="🪪" label="YOUR DETAILS" sub="Shared with seller for coordination." />
        <Inp label="Full Name *" value={form.name} error={errors.name}
          onChange={e => { setForm(f=>({...f,name:e.target.value})); setErrors(er=>({...er,name:null})); }} placeholder="As per Aadhaar" />
        <div>
          <Inp label="Mobile * (10 digits)" value={form.phone} error={errors.phone}
            onChange={e => { const v=e.target.value.replace(/\D/g,"").slice(0,10); setForm(f=>({...f,phone:v})); setErrors(er=>({...er,phone:null})); }}
            placeholder="9876543210" maxLength={10} inputMode="numeric" />
          {form.phone.length>0&&form.phone.length<10&&<div style={{ color:"#EF4444", fontSize:11, marginTop:4 }}>⚠ {10-form.phone.length} more needed</div>}
          {form.phone.length===10&&<div style={{ color:"#10B981", fontSize:11, marginTop:4 }}>✓ Valid</div>}
        </div>
        <Textarea label="Your Address *" value={form.address}
          onChange={e => { setForm(f=>({...f,address:e.target.value})); setErrors(er=>({...er,address:null})); }}
          placeholder="Full address" style={{ border:`1px solid ${errors.address?"#EF4444":"#252830"}` }} />
        {errors.address&&<div style={{ color:"#EF4444", fontSize:11 }}>⚠ Required</div>}
        <div style={{ display:"flex", gap:8 }}>
          <Btn variant="ghost" onClick={() => setStep(1)}>← Back</Btn>
          <Btn variant="success" style={{ flex:1 }} onClick={confirm}>Pay {fmt(price)} & Unlock Seller</Btn>
        </div>
      </div>}

      {step===3&&paid&&<>
        <InfoBox color="#10B981" icon="✅" label="PAYMENT RECEIVED — SELLER UNLOCKED" />
        <div style={{ background:"#0E1016", borderRadius:12, padding:16, marginBottom:14 }}>
          <div style={{ fontWeight:800, fontSize:15, marginBottom:4 }}>{listing.owner}</div>
          <div style={{ fontSize:13, color:"#9CA3AF", marginBottom:2 }}>📱 {listing.contact_phone||"+91 98765 43210"}</div>
          <div style={{ fontSize:13, color:"#9CA3AF" }}>📍 {listing.full_address||listing.locality+", "+(listing.city||"Bengaluru")}</div>
        </div>
        <InfoBox color="#F59E0B" icon="⚡" label="NEXT STEPS">
          <div style={{ fontSize:12, color:"#9CA3AF", lineHeight:1.7 }}>
            1. Contact seller to arrange {form.mode==="pickup"?"pickup":"delivery"}<br/>
            2. Inspect item on receipt<br/>
            3. Confirm receipt in app → payment released<br/>
            4. Raise dispute within 24h if needed
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
  const canRent  = lt==="item"&&(item.subtype==="rent"||item.subtype==="both")&&item.rentPrice;
  const canBuy   = lt==="item"&&(item.subtype==="buy" ||item.subtype==="both")&&item.buyPrice;
  const isRented = lt==="item"&&item.subtype!=="buy"&&item.availableQty===0;
  const isUnavail = isRented&&!canBuy;
  const primaryPrice = canRent?`${fmt(item.rentPrice)}/day`:canBuy?fmt(item.buyPrice):`${fmt(item.priceHour)}/hr`;

  return (
    <div onClick={() => !isUnavail&&onClick(item)}
      style={{ background:"#13151C", border:"1px solid #1E2130", borderRadius:14, overflow:"hidden", cursor:isUnavail?"not-allowed":"pointer", opacity:isUnavail?0.5:1, transition:"transform .2s, border-color .2s" }}
      onMouseEnter={e => { if(!isUnavail){e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.borderColor=ts.color+"50";} }}
      onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.borderColor="#1E2130"; }}>

      {/* Photo or emoji hero */}
      <div style={{ background:"#0E1016", height:110, display:"flex", alignItems:"center", justifyContent:"center", fontSize:50, position:"relative", overflow:"hidden" }}>
        {item.photoUrl
          ? <img src={item.photoUrl} alt={item.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : item.emoji}
        {isRented&&!canBuy&&<div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.65)", display:"flex", alignItems:"center", justifyContent:"center" }}><Tag c="#EF4444">Rented Out</Tag></div>}
        {item.photoUrl&&<div style={{ position:"absolute", top:6, right:6 }}><span style={{ background:"rgba(0,0,0,.6)", fontSize:16, padding:"2px 6px", borderRadius:6 }}>{item.emoji}</span></div>}
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
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
          <Stars val={item.rating} count={item.reviews} />
          {item.ownerTrust&&<TrustBadge score={item.ownerTrust} />}
        </div>
        {lt==="venue"&&<div style={{ fontSize:11, color:"#6B7280", marginTop:2 }}>👥 {item.capacity} capacity</div>}
        {lt==="service"&&<div style={{ fontSize:11, color:"#6B7280", marginTop:2 }}>📅 {item.daysAvailable?.join(", ")}</div>}
        <div style={{ fontSize:11, color:"#6B7280", marginTop:2 }}>📍 {item.locality}</div>
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
        {lt==="item"&&item.totalQty>1&&canRent&&<div style={{ fontSize:10, color:"#6B7280", marginTop:4 }}>{item.availableQty}/{item.totalQty} units</div>}
      </div>
    </div>
  );
};

// ─── CLOUDINARY UPLOAD (shared) ───────────────────────────────────────────────
const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD || "";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET || "leasio_unsigned";
async function uploadToCloudinary(file) {
  if (!CLOUD_NAME) throw new Error("VITE_CLOUDINARY_CLOUD not set");
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method:"POST", body:fd });
  if (!res.ok) throw new Error("Upload failed: " + res.statusText);
  return (await res.json()).secure_url;
}

// ─── AADHAAR VERIFICATION MODAL ───────────────────────────────────────────────
// Validates 12-digit format locally. Real UIDAI API verification requires
// government-approved KUA integration — use this as the submission layer.
const AadhaarModal = ({ user, onClose, onVerified }) => {
  const [step,        setStep]      = useState(1); // 1=number, 2=upload, 3=done
  const [number,      setNumber]    = useState("");
  const [imgUrl,      setImgUrl]    = useState(null);
  const [uploading,   setUploading] = useState(false);
  const [submitting,  setSubmitting] = useState(false);
  const [error,       setError]     = useState("");

  const numValid = /^\d{12}$/.test(number);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError("");
    try {
      const url = await uploadToCloudinary(file);
      setImgUrl(url);
    } catch(e) { setError("Upload failed: " + e.message); }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!numValid || !imgUrl) return;
    setSubmitting(true); setError("");
    try {
      // Store in user_profiles table — status = pending_verification
      const { error: e } = await supabase.from("user_profiles").upsert({
        id: user.id,
        aadhaar_number: number,          // store last 4 only in prod — full number here for demo
        aadhaar_image_url: imgUrl,
        verification_status: "pending",
        submitted_at: new Date().toISOString(),
      });
      if (e) throw e;
      setStep(3);
      onVerified("pending");
    } catch(e) { setError("Submission failed: " + e.message); }
    setSubmitting(false);
  };

  const inpStyle = { background:"#111318", border:`1px solid ${error?"#EF4444":"#252830"}`, borderRadius:9, padding:"12px 14px", color:"#F0EEE8", fontSize:15, outline:"none", fontFamily:"'DM Sans',sans-serif", width:"100%", boxSizing:"border-box", letterSpacing:3 };

  if (step === 3) return (
    <Modal onClose={onClose} maxW={420}>
      <div style={{ textAlign:"center", padding:"16px 0" }}>
        <div style={{ fontSize:52, marginBottom:12 }}>🪪</div>
        <div style={{ fontWeight:900, fontSize:20, marginBottom:8 }}>Aadhaar Submitted!</div>
        <div style={{ color:"#9CA3AF", fontSize:13, lineHeight:1.7, marginBottom:20 }}>
          Your Aadhaar details are under review.<br/>
          Verification typically takes <strong style={{ color:"#F0EEE8" }}>24–48 hours</strong>.<br/>
          Until then, you can post <strong style={{ color:"#F59E0B" }}>1 listing</strong> and make <strong style={{ color:"#F59E0B" }}>1 booking</strong>.
        </div>
        <div style={{ background:"#0E1016", borderRadius:12, padding:14, marginBottom:20, textAlign:"left" }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#F59E0B", marginBottom:8 }}>WHAT HAPPENS NEXT</div>
          <div style={{ fontSize:12, color:"#9CA3AF", lineHeight:1.8 }}>
            ✓ Our team reviews your Aadhaar image<br/>
            ✓ Number is matched against the image<br/>
            ✓ You get a notification when verified<br/>
            ✓ After verification: unlimited listings & bookings
          </div>
        </div>
        <Btn variant="primary" style={{ width:"100%" }} onClick={onClose}>Start Exploring</Btn>
      </div>
    </Modal>
  );

  return (
    <Modal onClose={null} maxW={460}>
      {/* No close button — deliberately blocking on first signup */}
      <div style={{ textAlign:"center", marginBottom:20 }}>
        <div style={{ fontSize:40, marginBottom:8 }}>🪪</div>
        <div style={{ fontWeight:900, fontSize:20, marginBottom:4 }}>Verify Your Identity</div>
        <div style={{ color:"#9CA3AF", fontSize:13 }}>Required to list or book on Leasio. Keeps the community safe.</div>
      </div>

      <div style={{ display:"flex", gap:4, marginBottom:20 }}>
        {[1,2].map(i => <div key={i} style={{ flex:1, height:3, borderRadius:2, background:step>=i?"#F59E0B":"#252830" }} />)}
      </div>

      {step === 1 && <>
        <InfoBox color="#2563EB" icon="🔒" label="YOUR AADHAAR NUMBER IS SAFE"
          sub="We store only the last 4 digits publicly. The full number is encrypted and used only for one-time verification." />
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, textTransform:"uppercase", marginBottom:8 }}>12-Digit Aadhaar Number</div>
          <input
            type="text" inputMode="numeric" maxLength={12}
            value={number} placeholder="XXXX XXXX XXXX"
            style={inpStyle}
            onChange={e => { const v = e.target.value.replace(/\D/g,"").slice(0,12); setNumber(v); setError(""); }}
          />
          {number.length > 0 && number.length < 12 && (
            <div style={{ color:"#EF4444", fontSize:11, marginTop:5 }}>⚠ {12 - number.length} more digits needed</div>
          )}
          {numValid && <div style={{ color:"#10B981", fontSize:11, marginTop:5 }}>✓ Valid format</div>}
        </div>
        {error && <div style={{ color:"#EF4444", fontSize:12, marginBottom:10 }}>{error}</div>}
        <Btn variant="primary" style={{ width:"100%", opacity:numValid?1:0.5 }}
          disabled={!numValid} onClick={() => setStep(2)}>Next — Upload Aadhaar Photo →</Btn>
        <div style={{ textAlign:"center", marginTop:12 }}>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#374151", fontSize:11, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
            Skip for now — I'll verify within 3 days
          </button>
        </div>
      </>}

      {step === 2 && <>
        <InfoBox color="#7C3AED" icon="📸" label="UPLOAD AADHAAR PHOTO"
          sub="Photo of front side showing your name, number, and photo. File stays private — never shared publicly." />

        {!imgUrl ? (
          <label style={{ display:"block", cursor: uploading?"wait":"pointer" }}>
            <div style={{ border:"2px dashed #252830", borderRadius:12, padding:"28px 16px", textAlign:"center", background:"#0E1016" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor="#F59E0B60"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="#252830"}>
              {uploading ? (
                <div style={{ color:"#F59E0B", fontWeight:700 }}>⏳ Uploading...</div>
              ) : (
                <>
                  <div style={{ fontSize:36, marginBottom:8 }}>📄</div>
                  <div style={{ fontSize:13, color:"#9CA3AF" }}>Click to upload Aadhaar photo</div>
                  <div style={{ fontSize:11, color:"#374151", marginTop:4 }}>JPG or PNG — front side only</div>
                </>
              )}
            </div>
            <input type="file" accept="image/*" style={{ display:"none" }} onChange={handleFile} />
          </label>
        ) : (
          <div style={{ position:"relative", borderRadius:12, overflow:"hidden", marginBottom:4 }}>
            <img src={imgUrl} alt="Aadhaar" style={{ width:"100%", maxHeight:200, objectFit:"cover", borderRadius:12 }} />
            <div style={{ position:"absolute", top:8, right:8 }}>
              <button onClick={() => setImgUrl(null)} style={{ background:"#EF4444", border:"none", borderRadius:6, color:"#fff", padding:"4px 10px", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>Retake</button>
            </div>
            <div style={{ position:"absolute", bottom:8, left:8, background:"rgba(16,185,129,.9)", borderRadius:6, padding:"3px 10px", fontSize:11, fontWeight:700, color:"#fff" }}>✓ Uploaded</div>
          </div>
        )}

        {error && <div style={{ color:"#EF4444", fontSize:12, marginTop:8, marginBottom:8 }}>{error}</div>}

        <div style={{ display:"flex", gap:8, marginTop:16 }}>
          <Btn variant="ghost" onClick={() => setStep(1)}>← Back</Btn>
          <Btn variant="primary" style={{ flex:1, opacity:imgUrl?1:0.5 }}
            disabled={!imgUrl || submitting} onClick={handleSubmit}>
            {submitting ? "Submitting..." : "Submit for Verification ✓"}
          </Btn>
        </div>
        <div style={{ textAlign:"center", marginTop:12 }}>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#374151", fontSize:11, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
            Skip for now — I'll verify within 3 days
          </button>
        </div>
      </>}
    </Modal>
  );
};

// ─── VERIFICATION BANNER ──────────────────────────────────────────────────────
const VerificationBanner = ({ profile, onVerifyNow, daysLeft }) => {
  if (!profile || profile.verification_status === "verified") return null;
  const isPending = profile.verification_status === "pending";
  const isExpired = daysLeft !== null && daysLeft <= 0;

  if (isPending) return (
    <div style={{ background:"#1C1F27", borderLeft:"4px solid #F59E0B", padding:"10px 20px", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
      <span style={{ fontSize:18 }}>⏳</span>
      <div style={{ flex:1 }}>
        <span style={{ fontWeight:700, fontSize:13 }}>Aadhaar verification pending</span>
        <span style={{ color:"#9CA3AF", fontSize:12, marginLeft:8 }}>Our team is reviewing your documents · 24–48 hours</span>
      </div>
      <Tag c="#F59E0B">Unverified</Tag>
    </div>
  );

  return (
    <div style={{ background: isExpired?"#2D0A0A":"#1A130A", borderLeft:`4px solid ${isExpired?"#EF4444":"#F59E0B"}`, padding:"10px 20px", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
      <span style={{ fontSize:18 }}>{isExpired?"🚫":"⚠️"}</span>
      <div style={{ flex:1 }}>
        {isExpired ? (
          <><span style={{ fontWeight:700, fontSize:13, color:"#EF4444" }}>Account restricted — </span><span style={{ color:"#9CA3AF", fontSize:12 }}>Aadhaar verification required to continue listing or booking.</span></>
        ) : (
          <><span style={{ fontWeight:700, fontSize:13 }}>Unverified account — </span><span style={{ color:"#9CA3AF", fontSize:12 }}>1 listing · 1 booking allowed. {daysLeft > 0 ? `${daysLeft} day${daysLeft > 1 ? "s" : ""} left to verify.` : "Verify now to unlock full access."}</span></>
        )}
      </div>
      <Btn variant={isExpired?"danger":"primary"} style={{ fontSize:12, padding:"6px 14px" }} onClick={onVerifyNow}>
        🪪 Verify Now
      </Btn>
    </div>
  );
};

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
const LoginScreen = ({ onLogin }) => {
  const [mode, setMode]       = useState('login');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handle = async () => {
    if (loading || !email || !password) return;
    setLoading(true); setError('');
    try {
      const fn = mode === 'login' ? supabase.auth.signInWithPassword : supabase.auth.signUp;
      const { data, error: e } = await fn.call(supabase.auth, { email, password });
      if (e) throw e;
      onLogin(data.user, mode === 'signup');
    } catch(e) { setError(mode === 'login' ? 'Invalid email or password' : 'Signup failed: ' + e.message); }
    setLoading(false);
  };

  // Enter key works from any field
  const onKey = e => { if (e.key === 'Enter') handle(); };

  const inp = { background:"#111318", border:"1px solid #252830", borderRadius:9, padding:"10px 13px", color:"#F0EEE8", fontSize:13, outline:"none", fontFamily:"'DM Sans',sans-serif", width:"100%", boxSizing:"border-box" };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", minHeight:"100vh", background:"#0C0E14", color:"#F0EEE8", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#13151C", border:"1px solid #252830", borderRadius:16, padding:32, width:"100%", maxWidth:380 }}>
        <div style={{ fontSize:32, fontWeight:900, color:"#F59E0B", marginBottom:4 }}>🏪 Leasio</div>
        <div style={{ color:"#6B7280", marginBottom:20, fontSize:13 }}>{mode==='login'?'Sign in to continue':'Create your account'}</div>
        <div style={{ display:"flex", gap:8, marginBottom:20 }}>
          {['login','signup'].map(m => <button key={m} onClick={()=>{ setMode(m); setError(''); }} style={{ flex:1, background:mode===m?"#F59E0B":"#111318", color:mode===m?"#0C0E14":"#9CA3AF", border:"1px solid #252830", borderRadius:8, padding:"8px", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>{m==='login'?'Sign In':'Sign Up'}</button>)}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <label style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <span style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, textTransform:"uppercase" }}>Email</span>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={onKey} placeholder="you@example.com" style={inp} autoFocus />
          </label>
          <label style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <span style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, textTransform:"uppercase" }}>Password</span>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={onKey} placeholder="••••••••" style={inp} />
          </label>
          {mode==='signup'&&(
            <div style={{ background:"#0E1016", borderRadius:9, padding:10, fontSize:11, color:"#6B7280", lineHeight:1.6 }}>
              🪪 After signing up, you'll be asked to verify your Aadhaar. Unverified accounts can post 1 listing and make 1 booking for the first 3 days.
            </div>
          )}
          {error&&<div style={{ color:"#EF4444", fontSize:12 }}>{error}</div>}
          <button onClick={handle} disabled={loading||!email||!password}
            style={{ background:"#F59E0B", color:"#0C0E14", border:"none", borderRadius:9, padding:"11px 18px", cursor: loading||!email||!password?"not-allowed":"pointer", fontWeight:700, fontSize:14, fontFamily:"'DM Sans',sans-serif", marginTop:4, opacity:loading||!email||!password?0.7:1 }}>
            {loading?'Please wait...':mode==='login'?'Sign In →':'Create Account →'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── ORDERS VIEW ──────────────────────────────────────────────────────────────
const OrdersView = ({ orders, setView, onManageBooking, onRateBooking }) => (
  <div style={{ padding:24, maxWidth:780, margin:"0 auto" }}>
    <div style={{ fontWeight:900, fontSize:22, marginBottom:4 }}>My Bookings</div>
    <div style={{ color:"#6B7280", marginBottom:22, fontSize:13 }}>All your rentals, venue bookings and service appointments</div>
    {orders.length===0 ? (
      <div style={{ textAlign:"center", color:"#6B7280", padding:"60px 0" }}>
        <div style={{ fontSize:40, marginBottom:8 }}>📦</div>
        <div>No bookings yet.</div>
        <Btn variant="primary" style={{ marginTop:16 }} onClick={() => setView("browse")}>Browse Listings</Btn>
      </div>
    ) : orders.map(order => {
      const isPurchase  = order.type==="purchase"||order.status==="purchased";
      const isCancelled = order.status==="cancelled";
      const isRated     = order.rated;
      const borderColor = isCancelled?"#6B7280":isPurchase?"#10B981":typeStyle[order.listing?.listingType]?.color||"#F59E0B";
      const policy      = !isPurchase&&!isCancelled ? getCancelPolicy(order) : null;

      // Show rate button if booking is in the past and not cancelled and not yet rated
      const bookingDate = order.date ? new Date(order.date) : null;
      const isPast = bookingDate && bookingDate < new Date();
      const canRate = !isPurchase && !isCancelled && !isRated && isPast;

      return (
        <div key={order.id} style={{ background:"#13151C", border:`1.5px solid ${borderColor}35`, borderRadius:14, padding:18, marginBottom:12, opacity:isCancelled?0.6:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
            <div>
              <div style={{ fontWeight:800 }}>{order.listing?.title||order.itemTitle||"Booking"}</div>
              <div style={{ display:"flex", gap:6, marginTop:6, flexWrap:"wrap" }}>
                {order.listing&&<Tag c={typeStyle[order.listing.listingType]?.color||"#F59E0B"}>{typeStyle[order.listing.listingType]?.label||"Item"}</Tag>}
                {isCancelled?<Tag c="#6B7280">✕ Cancelled</Tag>:isPurchase?<Tag c="#10B981">🛒 Purchased</Tag>:<Tag c="#2563EB">📋 Booked</Tag>}
                {!isPurchase&&!isCancelled&&policy&&<Tag c={policy.canCancelFree?"#10B981":"#EF4444"}>{policy.canCancelFree?"Free cancel":"Fee if cancelled"}</Tag>}
                {isRated&&<Tag c="#F59E0B">⭐ Rated</Tag>}
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontWeight:900, color:isCancelled?"#6B7280":"#10B981" }}>{fmt(isPurchase?order.price:order.total)}</div>
              {!isPurchase&&order.dep>0&&<div style={{ fontSize:11, color:"#F59E0B" }}>Deposit: {fmt(order.dep)}</div>}
            </div>
          </div>

          {order.date&&<div style={{ marginTop:6, fontSize:12, color:"#9CA3AF" }}>📅 {order.date}{order.slot?` · ${order.slot}`:""}{ order.hours?` · ${order.hours} hrs`:""}</div>}
          {order.deliverySlot&&<div style={{ marginTop:4, fontSize:12, color:"#2563EB", fontWeight:700 }}>🚚 Delivery: {order.deliverySlot}</div>}

          {/* Owner details */}
          {!isPurchase&&!isCancelled&&(
            <div style={{ marginTop:12, background:"#0E1016", borderRadius:10, padding:12 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#10B981", marginBottom:6 }}>📍 OWNER DETAILS</div>
              <div style={{ fontSize:13, color:"#F0EEE8", fontWeight:700 }}>{order.ownerName||order.listing?.owner||"Owner"}</div>
              <div style={{ fontSize:12, color:"#9CA3AF", marginTop:2 }}>📱 {order.ownerPhone||"+91 98765 43210"}</div>
              <div style={{ fontSize:12, color:"#9CA3AF", marginTop:2 }}>📍 {order.ownerAddress||order.listing?.full_address||order.listing?.locality||"On file"}</div>
            </div>
          )}

          {/* User's own rating if they've already rated */}
          {isRated&&order.myRating&&(
            <div style={{ marginTop:10, background:"#F59E0B0A", border:"1px solid #F59E0B25", borderRadius:10, padding:10 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#F59E0B", marginBottom:4 }}>YOUR RATING</div>
              <div style={{ display:"flex", gap:12 }}>
                <div><div style={{ fontSize:9, color:"#9CA3AF" }}>LISTING</div><Stars val={order.myRating.listing} size={14} /></div>
                <div><div style={{ fontSize:9, color:"#9CA3AF" }}>OWNER</div><Stars val={order.myRating.owner} size={14} /></div>
              </div>
              {order.myRating.text&&<div style={{ fontSize:11, color:"#9CA3AF", marginTop:6, fontStyle:"italic" }}>"{order.myRating.text}"</div>}
            </div>
          )}

          {isPurchase&&<div style={{ marginTop:8, fontSize:12, color:"#10B981" }}>✅ Seller address unlocked · Confirm receipt to release payment</div>}
          {isCancelled&&order.refundAmount!=null&&<div style={{ marginTop:8, fontSize:12, color:"#6B7280" }}>Refund: {fmt(order.refundAmount)} (5-7 days)</div>}

          <div style={{ display:"flex", gap:8, marginTop:12, flexWrap:"wrap" }}>
            {!isPurchase&&!isCancelled&&(
              <Btn variant="ghost" style={{ fontSize:12, padding:"6px 14px" }} onClick={() => onManageBooking(order)}>⚙ Manage</Btn>
            )}
            {canRate&&(
              <Btn variant="primary" style={{ fontSize:12, padding:"6px 14px" }} onClick={() => onRateBooking(order)}>⭐ Rate this Booking</Btn>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

// ─── ITEM DETAIL ──────────────────────────────────────────────────────────────
const ItemDetail = ({ item, setSelected, setBookingModal, setBuyModal }) => {
  const [reviews, setReviews] = useState([]);
  const lt = item.listingType;
  const ts = typeStyle[lt];

  useEffect(() => {
    if (typeof item.id !== 'string') return;
    supabase.from('reviews').select('*').eq('listing_id', item.id).order('created_at', {ascending:false}).limit(10)
      .then(({data}) => { if (data) setReviews(data); });
  }, [item.id]);

  const avgListingRating = reviews.length ? (reviews.reduce((s,r)=>s+r.listing_rating,0)/reviews.length).toFixed(1) : null;
  const avgOwnerRating   = reviews.length ? (reviews.reduce((s,r)=>s+r.owner_rating,0)/reviews.length).toFixed(1) : null;

  return (
    <div style={{ padding:24, maxWidth:780, margin:"0 auto" }}>
      <Btn variant="ghost" style={{ marginBottom:18 }} onClick={() => setSelected(null)}>← Back</Btn>
      <div style={{ background:"#13151C", border:"1px solid #1E2130", borderRadius:16, padding:24, marginBottom:20 }}>

        {/* Photo */}
        {item.photoUrl && (
          <div style={{ borderRadius:12, overflow:"hidden", marginBottom:18, height:220 }}>
            <img src={item.photoUrl} alt={item.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          </div>
        )}

        <div style={{ display:"flex", gap:18, flexWrap:"wrap" }}>
          {!item.photoUrl && <div style={{ fontSize:72, background:"#0E1016", borderRadius:14, padding:"16px 26px" }}>{item.emoji}</div>}
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
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>{item.amenities.map(a=><Tag key={a} c="#6366F1">{a}</Tag>)}</div>
            <div style={{ fontSize:12, color:"#6B7280", marginTop:6 }}>👥 Capacity: {item.capacity} persons</div>
          </div>
        )}

        {lt==="service"&&(
          <div style={{ marginTop:14, display:"flex", flexDirection:"column", gap:6 }}>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>{DAYS.map(d=><span key={d} style={{ fontSize:11, background:item.daysAvailable?.includes(d)?"#10B98120":"#111318", color:item.daysAvailable?.includes(d)?"#10B981":"#374151", border:`1px solid ${item.daysAvailable?.includes(d)?"#10B98140":"#252830"}`, borderRadius:6, padding:"3px 8px", fontWeight:700 }}>{d}</span>)}</div>
            <div style={{ fontSize:12, color:"#6B7280" }}>📍 Travels up to {item.travelRadius}km · Min {item.minHours} hr(s)</div>
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

        {/* Trust score breakdown from real reviews */}
        {reviews.length > 0 && (
          <div style={{ background:"#0E1016", borderRadius:12, padding:14, marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:800, color:"#F59E0B", marginBottom:10, letterSpacing:.6 }}>🛡 TRUST SCORE — FROM {reviews.length} VERIFIED BOOKING{reviews.length>1?"S":""}</div>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
              <div>
                <div style={{ fontSize:10, color:"#9CA3AF", fontWeight:700, marginBottom:4 }}>{lt==="service"?"SERVICE QUALITY":"LISTING QUALITY"}</div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <Stars val={parseFloat(avgListingRating)} size={14} />
                  <span style={{ fontWeight:900, color:"#F59E0B" }}>{avgListingRating}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize:10, color:"#9CA3AF", fontWeight:700, marginBottom:4 }}>OWNER RELIABILITY</div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <Stars val={parseFloat(avgOwnerRating)} size={14} />
                  <span style={{ fontWeight:900, color:"#10B981" }}>{avgOwnerRating}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reviews list */}
        {reviews.filter(r=>r.review_text).length > 0 && (
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, textTransform:"uppercase", marginBottom:10 }}>Recent Reviews</div>
            {reviews.filter(r=>r.review_text).slice(0,3).map((r,i) => (
              <div key={i} style={{ background:"#0E1016", borderRadius:10, padding:12, marginBottom:8 }}>
                <div style={{ display:"flex", gap:10, marginBottom:6 }}>
                  <Stars val={r.listing_rating} size={11} />
                  <span style={{ fontSize:10, color:"#6B7280" }}>· Owner {r.owner_rating}/5 ★</span>
                </div>
                <div style={{ fontSize:12, color:"#9CA3AF", lineHeight:1.6, fontStyle:"italic" }}>"{r.review_text}"</div>
              </div>
            ))}
          </div>
        )}

        <InfoBox color="#F59E0B" icon="🔒" label="ADDRESS PRIVACY SYSTEM"
          sub={lt==="item"?`Full address shown only after paying 20% pre-deposit (${fmt(preBookDep(item.deposit||1000))}).`:"Owner contact revealed after booking payment."} />
        <div style={{ background:"#1C1F27", borderRadius:9, padding:10, marginBottom:14, fontSize:11, color:"#9CA3AF", lineHeight:1.6 }}>
          🔁 <strong style={{ color:"#F0EEE8" }}>Cancellation Policy:</strong> Free before 2 hours of start. Within 2 hours → 50% fee.
        </div>

        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {lt==="item"&&(item.subtype==="rent"||item.subtype==="both")&&item.availableQty>0&&(
            <Btn variant="primary" style={{ flex:1, minWidth:140, padding:"11px 18px" }} onClick={() => setBookingModal(item)}>🔑 Rent Securely</Btn>
          )}
          {lt!=="item"&&item.availableQty!==0&&(
            <Btn variant="primary" style={{ flex:1, minWidth:140, padding:"11px 18px" }} onClick={() => setBookingModal(item)}>
              {lt==="venue"?"📅 Reserve Venue":"📋 Book Session"}
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
        <input style={{ flex:1, minWidth:200, background:"#111318", border:"1px solid #252830", borderRadius:9, padding:"9px 14px", color:"#F0EEE8", fontSize:13, outline:"none", fontFamily:"'DM Sans',sans-serif" }}
          placeholder="🔍 Search items, venues, services..." value={search} onChange={e=>setSearch(e.target.value)} />
        <div style={{ display:"flex", alignItems:"center", gap:6, background:"#111318", border:"1px solid #252830", borderRadius:9, padding:"0 12px" }}>
          <span>📍</span>
          <input style={{ background:"none", border:"none", color:"#F0EEE8", fontSize:13, outline:"none", width:140, fontFamily:"'DM Sans',sans-serif" }}
            placeholder="Search locality..." value={localInput}
            onChange={e => { setLocalInput(e.target.value); setLocality(e.target.value); }} />
          <button onClick={() => navigator.geolocation?.getCurrentPosition(p => {
            const loc=`${p.coords.latitude.toFixed(2)}°N`; setLocality(loc); setLocalInput(loc); toast("📍 GPS detected!");
          })} style={{ background:"none", border:"none", color:"#F59E0B", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>GPS</button>
        </div>
      </div>
      <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" }}>
        {[{v:"all",l:"All"},{v:"item",l:"📦 Items"},{v:"venue",l:"🏟 Venues"},{v:"service",l:"👤 Services"}].map(({v,l}) => (
          <Btn key={v} variant={filterLT===v?"primary":"ghost"} style={{ fontSize:12, padding:"6px 14px" }} onClick={() => { setFilterLT(v); setFilterSale(false); }}>{l}</Btn>
        ))}
        <Btn variant={filterSale?"success":"ghost"} style={{ fontSize:12, padding:"6px 14px" }} onClick={() => { setFilterSale(s=>!s); setFilterLT("all"); }}>🛒 For Sale</Btn>
        <div style={{ flex:1 }} />
        <select style={{ background:"#111318", border:"1px solid #252830", borderRadius:8, padding:"6px 12px", color:"#9CA3AF", fontSize:12, fontFamily:"'DM Sans',sans-serif", cursor:"pointer" }} value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
          <option value="All">All Categories</option>
          {allCats.map(c=><option key={c}>{c}</option>)}
        </select>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(262px, 1fr))", gap:14 }}>
        {filtered.map(item => <ListingCard key={item.id} item={item} onClick={it=>setSelected(it)} />)}
      </div>
      {filtered.length===0&&<div style={{ textAlign:"center", color:"#6B7280", padding:"60px 0" }}>
        <div style={{ fontSize:36, marginBottom:8 }}>🔍</div>
        <div>No listings match your search.</div>
      </div>}
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function Leasio() {
  const [listings,      setListings]      = useState([]);
  const [view,          setView]          = useState("browse");
  const [selected,      setSelected]      = useState(null);
  const [search,        setSearch]        = useState("");
  const [locality,      setLocality]      = useState("");
  const [filterLT,      setFilterLT]      = useState("all");
  const [filterSale,    setFilterSale]    = useState(false);
  const [filterCat,     setFilterCat]     = useState("All");
  const [toasts,        setToasts]        = useState([]);
  const [bookingModal,  setBookingModal]  = useState(null);
  const [buyModal,      setBuyModal]      = useState(null);
  const [orders,        setOrders]        = useState([]);
  const [currentUser,   setCurrentUser]   = useState(null);
  const [manageOrder,   setManageOrder]   = useState(null);
  const [rateOrder,     setRateOrder]     = useState(null);
  const [userProfile,   setUserProfile]   = useState(null);
  const [showAadhaar,   setShowAadhaar]   = useState(false);

  useEffect(() => {
    fetchListings().then(data => setListings(data.length?data:SEED)).catch(()=>setListings(SEED));
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({data:{session}}) => setCurrentUser(session?.user??null));
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_,session) => setCurrentUser(session?.user??null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    fetchMyBookings(currentUser.id).then(setOrders).catch(console.error);
    // Load or create user_profile
    supabase.from("user_profiles").select("*").eq("id", currentUser.id).single()
      .then(({data}) => {
        if (data) {
          setUserProfile(data);
        } else {
          // First login — create profile using the auth account's real creation date
          const profile = {
            id: currentUser.id,
            verification_status: "unverified",
            created_at: currentUser.created_at || new Date().toISOString(), // use real signup date
          };
          supabase.from("user_profiles").insert([profile]).then(() => setUserProfile(profile));
        }
      });
  }, [currentUser]);

  useEffect(() => {
    const l=document.createElement("link");
    l.href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap";
    l.rel="stylesheet"; document.head.appendChild(l);
  }, []);

  const toast = msg => { const id=Date.now(); setToasts(t=>[...t,{id,msg}]); setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),4000); };

  // ── Verification helpers ────────────────────────────────────────────────────
  const isVerified   = userProfile?.verification_status === "verified";
  const isPending    = userProfile?.verification_status === "pending";
  const isUnverified = !isVerified && !isPending;

  // How many days since account creation
  const accountAgeDays = userProfile?.created_at
    ? Math.floor((Date.now() - new Date(userProfile.created_at)) / 86400000)
    : 0;
  const gracePeriodDays = 3;
  const daysLeft     = Math.max(0, gracePeriodDays - accountAgeDays);
  const graceExpired = accountAgeDays >= gracePeriodDays;

  // Unverified limits: 1 listing, 1 booking (only within grace period)
  const myListingsCount = listings.filter(l => l.owner_id === currentUser?.id).length;
  const myBookingsCount = orders.length;

  const canList = () => {
    if (isVerified || isPending) return true; // pending users keep trial access
    if (graceExpired) return false;            // after 3 days, blocked
    return myListingsCount < 1;                // within grace: max 1
  };

  const canBook = () => {
    if (isVerified || isPending) return true;
    if (graceExpired) return false;
    return myBookingsCount < 1;
  };

  // Called after listing attempt when blocked
  const guardList = () => {
    if (canList()) return true;
    setShowAadhaar(true);
    toast("🪪 Please verify your Aadhaar to post more listings.");
    return false;
  };

  const guardBook = () => {
    if (canBook()) return true;
    setShowAadhaar(true);
    toast("🪪 Please verify your Aadhaar to make more bookings.");
    return false;
  };

  const handleBooked = async (order) => {
    if (!guardBook()) return; // Aadhaar limit check
    if (currentUser && order.listing.id && typeof order.listing.id==="string") {
      try {
        const {error:e} = await supabase.from('bookings').insert([{
          listing_id:    order.listing.id,
          renter_id:     currentUser.id,
          booking_type:  order.listing.listingType,
          status:        'pending_handover',
          start_date:    order.date||null,
          slot:          order.slot||null,
          hours:         order.hours||null,
          qty:           order.qty||1,
          delivery_mode: order.mode||'self',
          total_rent:    order.total,
          platform_fee:  order.fee,
          deposit_amount:order.dep,
          renter_name:   order.renterName,
          renter_phone:  order.renterPhone,
          renter_address:order.renterAddress,
          owner_address: order.ownerAddress||null,
          owner_phone:   order.ownerPhone||null,
        }]);
        if (e) toast('⚠️ Saved locally: '+e.message);
      } catch(err) { console.error(err); }
    }
    setOrders(o=>[...o,order]);
    setListings(ls=>ls.map(l => {
      if (l.id!==order.listing.id) return l;
      const newQty=Math.max(0,l.availableQty-(order.qty||1));
      return {...l, availableQty:newQty, available:newQty>0};
    }));
    toast("✅ Booking confirmed! Owner details unlocked.");
    setView("orders");
  };

  const handleCancelled = async (order, policy) => {
    if (typeof order.id==="string"&&!order.id.startsWith("ord")) {
      await supabase.from('bookings').update({status:'cancelled'}).eq('id',order.id);
    }
    setOrders(os=>os.map(o=>o.id===order.id?{...o,status:'cancelled',refundAmount:policy.refund}:o));
    toast(`✅ Cancelled. Refund of ${fmt(policy.refund)} in 5-7 days.`);
  };

  const handleRescheduled = async (order, newDate, newSlot) => {
    if (typeof order.id==="string"&&!order.id.startsWith("ord")) {
      await supabase.from('bookings').update({start_date:newDate,slot:newSlot}).eq('id',order.id);
    }
    setOrders(os=>os.map(o=>o.id===order.id?{...o,date:newDate,slot:newSlot}:o));
    toast("✅ Booking rescheduled!");
  };

  const handleRatingSubmitted = ({ listingRating, ownerRating, reviewText, orderId }) => {
    // Update the order locally to show rated badge and the rating itself
    setOrders(os=>os.map(o=>o.id===orderId?{
      ...o,
      rated:true,
      myRating:{ listing:listingRating, owner:ownerRating, text:reviewText }
    }:o));
    // Update listing trust score based on new rating
    const order = orders.find(o=>o.id===orderId);
    if (order?.listing?.id) {
      const newTrust = ((listingRating+ownerRating)/2).toFixed(1);
      setListings(ls=>ls.map(l => {
        if (l.id!==order.listing.id) return l;
        const totalRatings = (l.reviews||0)+1;
        const newRating = (((l.rating||4)*(totalRatings-1))+listingRating)/totalRatings;
        const newOwnerTrust = (((l.ownerTrust||4)*(totalRatings-1))+ownerRating)/totalRatings;
        return {...l, rating:Math.round(newRating*10)/10, reviews:totalRatings, ownerTrust:Math.round(newOwnerTrust*10)/10};
      }));
    }
    toast("⭐ Thanks! Your rating has been submitted and trust scores updated.");
  };

  if (!currentUser) return <LoginScreen onLogin={(user, isNewSignup) => {
    setCurrentUser(user);
    if (isNewSignup) setTimeout(() => setShowAadhaar(true), 600); // slight delay so main UI renders first
  }} />;

  const filtered = listings.filter(l => {
    const ms = !search||l.title.toLowerCase().includes(search.toLowerCase())||(l.description||"").toLowerCase().includes(search.toLowerCase());
    const mlt = filterLT==="all"||l.listingType===filterLT;
    const ml  = !locality||(l.locality||"").toLowerCase().includes(locality.toLowerCase())||(l.city||"").toLowerCase().includes(locality.toLowerCase());
    const mc  = filterCat==="All"||l.category===filterCat;
    const mSale = !filterSale||(l.listingType==="item"&&(l.subtype==="buy"||l.subtype==="both"));
    return ms&&mlt&&ml&&mc&&mSale;
  });
  const allCats = [...new Set(listings.map(l=>l.category))];

  const S = {
    app: { fontFamily:"'DM Sans',sans-serif", minHeight:"100vh", background:"#0C0E14", color:"#F0EEE8" },
    bar: { background:"rgba(12,14,20,.97)", backdropFilter:"blur(24px)", borderBottom:"1px solid #1E2130", padding:"0 20px", display:"flex", alignItems:"center", gap:10, height:58, position:"sticky", top:0, zIndex:100 },
    nav: a => ({ background:a?"#F59E0B":"transparent", color:a?"#0C0E14":"#9CA3AF", border:"none", borderRadius:7, padding:"5px 11px", cursor:"pointer", fontWeight:700, fontSize:12, fontFamily:"'DM Sans',sans-serif" }),
  };

  return (
    <div style={S.app}>
      <div style={{ position:"fixed", top:66, right:16, zIndex:300, display:"flex", flexDirection:"column", gap:8, pointerEvents:"none" }}>
        {toasts.map(t=><div key={t.id} style={{ background:"#13151C", border:"1px solid #252830", color:"#F0EEE8", padding:"10px 16px", borderRadius:10, fontWeight:600, fontSize:13, boxShadow:"0 8px 30px rgba(0,0,0,.5)", animation:"slideIn .3s ease" }}>{t.msg}</div>)}
      </div>

      <div style={S.bar}>
        <div style={{ fontSize:19, fontWeight:900, color:"#F59E0B", letterSpacing:-1, cursor:"pointer", whiteSpace:"nowrap" }} onClick={() => { setView("browse"); setSelected(null); }}>🏪 Leasio</div>
        <div style={{ flex:1 }} />
        {[{id:"browse",l:"Browse"},{id:"list",l:"+ List"},{id:"orders",l:"Orders"}].map(t=>(
          <button key={t.id} style={S.nav(view===t.id&&!selected)} onClick={() => {
            if (t.id === "list" && !guardList()) return;
            setView(t.id); setSelected(null);
          }}>{t.l}</button>
        ))}
        <button style={{ background:"none", border:"none", color:"#6B7280", fontSize:12, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}
          onClick={() => { supabase.auth.signOut(); setCurrentUser(null); }}>Sign Out</button>
      </div>

      {/* Verification banner — sits below topbar */}
      <VerificationBanner
        profile={userProfile}
        daysLeft={daysLeft}
        onVerifyNow={() => setShowAadhaar(true)}
      />

      {view==="browse"&&!selected&&(
        <div style={{ background:"linear-gradient(155deg,#130A00 0%,#080A14 50%,#0C0E14 100%)", borderBottom:"1px solid #1E2130", padding:"36px 24px 28px", textAlign:"center" }}>
          <div style={{ fontSize:10, fontWeight:800, color:"#F59E0B", letterSpacing:4, marginBottom:10 }}>INDIA'S SAFEST RENTAL MARKETPLACE</div>
          <div style={{ fontSize:34, fontWeight:900, letterSpacing:-1.5, lineHeight:1.1, marginBottom:10 }}>Items. Venues. Services.</div>
          <div style={{ color:"#6B7280", fontSize:13, maxWidth:500, margin:"0 auto 18px" }}>Rent or buy items, book venues, hire services — with escrow, OTP handover, and deposit safety.</div>
          <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
            {["📦 Rent or Buy","🏟 Book Venues","👤 Hire Services","🔒 Escrow","⭐ Verified Reviews","🔁 Free Cancellation*"].map(f=>(
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
            : <OrdersView orders={orders} setView={setView} onManageBooking={setManageOrder} onRateBooking={setRateOrder} />
      }

      {bookingModal&&<BookingModal listing={bookingModal} onClose={()=>setBookingModal(null)} onBooked={handleBooked} />}
      {buyModal&&<PurchaseModal listing={buyModal} onClose={()=>setBuyModal(null)} onPurchased={order => {
        setOrders(o=>[...o,{...order,id:"pur"+Date.now(),status:"purchased"}]);
        setListings(ls=>ls.map(l=>l.id===buyModal.id?{...l,availableQty:Math.max(0,l.availableQty-1)}:l));
        toast("✅ Purchase confirmed! Seller address unlocked."); setView("orders"); setBuyModal(null);
      }} />}
      {manageOrder&&<CancelEditModal order={manageOrder} onClose={()=>setManageOrder(null)} onCancelled={handleCancelled} onRescheduled={handleRescheduled} />}
      {rateOrder&&<RatingModal order={rateOrder} onClose={()=>setRateOrder(null)} onSubmitted={handleRatingSubmitted} />}
      {showAadhaar&&currentUser&&<AadhaarModal
        user={currentUser}
        onClose={() => setShowAadhaar(false)}
        onVerified={(status) => {
          setUserProfile(p => ({...p, verification_status: status}));
          setShowAadhaar(false);
        }}
      />}

      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)} }
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#0C0E14}::-webkit-scrollbar-thumb{background:#1E2130;border-radius:3px}
        select option{background:#111318}
      `}</style>
    </div>
  );
}
