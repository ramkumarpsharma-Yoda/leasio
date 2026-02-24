import ListForm from './ListForm.jsx';
import React, { useState, useEffect, useRef } from "react";
import { supabase, fetchListings, createBooking, fetchMyBookings } from './supabase.js';


// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const PLATFORM_FEE = 0.01;
const PRE_BOOKING_DEPOSIT_PCT = 0.20; // 20% of security to unlock address
const BIZ_REG_FEE = 999;

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const SLOTS = ["Morning (6am–12pm)","Afternoon (12pm–5pm)","Evening (5pm–10pm)","Full Day","Half Day (4hrs)"];
const CATS_ITEM = ["Furniture","Tools","Electronics","Outdoor","Event","Vehicles","Other"];
const CATS_VENUE = ["Marriage Hall","Party Hall","Playground","Sports Court","Conference Room","Farmhouse","Other"];
const CATS_SERVICE = ["Sports Coach","Music Teacher","Yoga Instructor","Personal Trainer","Tutor","Chef","Photographer","Other"];

// ─── SEED DATA ─────────────────────────────────────────────────────────────────
const SEED = [
  // ITEMS -- subtype: "rent" | "buy" | "both"
  { id:1, listingType:"item", title:"Canon DSLR Camera + Lens Kit", category:"Electronics", subtype:"both", owner:"Priya Menon", ownerId:"u4", ownerType:"individual", ownerTrust:4.8, rentPrice:1200, deposit:15000, buyPrice:52000, locality:"HSR Layout", city:"Bengaluru", rating:4.8, reviews:23, emoji:"📷", description:"Canon 90D with 18-135mm lens. Perfect for events. Available to rent or buy outright.", minDays:2, verified:true, listingTrust:4.7, totalQty:1, availableQty:1, bookedDates:[], available:true },
  { id:2, listingType:"item", title:"Industrial Folding Chairs", category:"Event", subtype:"rent", owner:"Krishna Caterers", ownerId:"u2", ownerType:"commercial", ownerTrust:4.9, rentPrice:25, deposit:2000, buyPrice:null, locality:"Indiranagar", city:"Bengaluru", rating:4.9, reviews:87, emoji:"🪑", description:"Heavy duty folding chairs. Min 20 pcs. Rent only.", minDays:1, verified:true, listingTrust:4.9, totalQty:200, availableQty:200, bookedDates:[], available:true },
  { id:3, listingType:"item", title:"Teak Dining Set (6 Seater)", category:"Furniture", subtype:"both", owner:"Ramesh Sharma", ownerId:"u1", ownerType:"individual", ownerTrust:4.8, rentPrice:800, deposit:5000, buyPrice:45000, locality:"Koramangala", city:"Bengaluru", rating:4.7, reviews:12, emoji:"🪑", description:"Beautiful teak dining set, barely used. Happy to rent or sell.", minDays:3, verified:true, listingTrust:4.6, totalQty:1, availableQty:1, bookedDates:[], available:true },
  { id:4, listingType:"item", title:"Power Drill + 40 Bit Set", category:"Tools", subtype:"both", owner:"Mahindra Hardware", ownerId:"u3", ownerType:"commercial", ownerTrust:4.5, rentPrice:200, deposit:1500, buyPrice:3500, locality:"JP Nagar", city:"Bengaluru", rating:4.5, reviews:34, emoji:"🔧", description:"Bosch professional drill set. Buy or rent -- 5 units available.", minDays:1, verified:true, listingTrust:4.3, totalQty:5, availableQty:5, bookedDates:[], available:true },
  { id:11, listingType:"item", title:"Sony 65 4K Smart TV", category:"Electronics", subtype:"buy", owner:"Suresh Nambiar", ownerId:"u13", ownerType:"individual", ownerTrust:4.6, rentPrice:null, deposit:0, buyPrice:42000, locality:"Banashankari", city:"Bengaluru", rating:4.5, reviews:3, emoji:"📺", description:"Selling spare Sony Bravia 65 4K TV. 2 years old, upgrading. Box and remote included.", minDays:null, verified:true, listingTrust:4.4, totalQty:1, availableQty:1, bookedDates:[], available:true },
  { id:12, listingType:"item", title:"Royal Enfield Bullet 350 (2019)", category:"Vehicles", subtype:"both", owner:"Vikram Anand", ownerId:"u14", ownerType:"individual", ownerTrust:4.7, rentPrice:800, deposit:10000, buyPrice:85000, locality:"Malleswaram", city:"Bengaluru", rating:4.6, reviews:7, emoji:"🏍", description:"2019 RE Bullet 350, 22,000 km. Available for weekend rent or outright sale.", minDays:1, verified:true, listingTrust:4.5, totalQty:1, availableQty:1, bookedDates:[], available:true },

  // VENUES
  { id:5, listingType:"venue", title:"Shree Mahal Marriage Hall", category:"Marriage Hall", owner:"Shree Events Pvt Ltd", ownerId:"u7", ownerType:"commercial", ownerTrust:4.7, priceHour:2000, priceHalfDay:7000, priceFullDay:12000, deposit:20000, locality:"Basaveshwara Nagar", city:"Bengaluru", rating:4.8, reviews:156, emoji:"💒", description:"AC hall, capacity 500, catering kitchen, parking for 100 cars.", verified:true, listingTrust:4.8, capacity:500, amenities:["AC","Kitchen","Parking","Stage","Sound System"], bookedSlots:{ "2026-03-01":["Full Day"], "2026-03-15":["Morning (6am–12pm)","Evening (5pm–10pm)"] }, available:true },
  { id:6, listingType:"venue", title:"Green Valley Playground", category:"Playground", owner:"BBMP Sports", ownerId:"u8", ownerType:"commercial", ownerTrust:4.5, priceHour:500, priceHalfDay:1800, priceFullDay:3000, deposit:5000, locality:"Hebbal", city:"Bengaluru", rating:4.3, reviews:41, emoji:"⚽", description:"Full-size football ground, floodlights, dressing rooms.", verified:true, listingTrust:4.4, capacity:100, amenities:["Floodlights","Dressing Rooms","Drinking Water","Parking"], bookedSlots:{ "2026-02-20":["Morning (6am–12pm)"] }, available:true },
  { id:7, listingType:"venue", title:"The Loft Party Hall", category:"Party Hall", owner:"Urban Spaces", ownerId:"u9", ownerType:"commercial", ownerTrust:4.6, priceHour:1500, priceHalfDay:5000, priceFullDay:8500, deposit:10000, locality:"Whitefield", city:"Bengaluru", rating:4.6, reviews:67, emoji:"🎉", description:"Rooftop party hall, capacity 150. Fully decor-friendly.", verified:true, listingTrust:4.7, capacity:150, amenities:["AC","DJ Setup","Bar Counter","Decoration Allowed","Parking"], bookedSlots:{}, available:true },

  // SERVICES
  { id:8, listingType:"service", title:"Football Coaching — AIFF Certified", category:"Sports Coach", owner:"Arjun Nair", ownerId:"u10", ownerType:"individual", ownerTrust:4.9, priceHour:800, minHours:2, daysAvailable:["Mon","Wed","Fri","Sat","Sun"], travelRadius:10, locality:"Indiranagar", city:"Bengaluru", rating:4.9, reviews:44, emoji:"⚽", description:"AIFF certified coach. 12 years experience. Age groups 6–18.", verified:true, listingTrust:4.8, deposit:0, available:true },
  { id:9, listingType:"service", title:"Yoga & Meditation Sessions", category:"Yoga Instructor", owner:"Deepa Krishnan", ownerId:"u11", ownerType:"individual", ownerTrust:4.7, priceHour:600, minHours:1, daysAvailable:["Mon","Tue","Wed","Thu","Fri","Sat"], travelRadius:5, locality:"Jayanagar", city:"Bengaluru", rating:4.7, reviews:88, emoji:"🧘", description:"RYT 500 certified. Morning sessions preferred. Groups up to 10.", verified:true, listingTrust:4.7, deposit:0, available:true },
  { id:10, listingType:"service", title:"Professional Wedding Photography", category:"Photographer", owner:"Studio Lens", ownerId:"u12", ownerType:"commercial", ownerTrust:4.8, priceHour:3500, minHours:4, daysAvailable:["Sat","Sun"], travelRadius:50, locality:"Koramangala", city:"Bengaluru", rating:4.8, reviews:120, emoji:"📸", description:"10 years experience. Full wedding coverage, candid + traditional.", verified:true, listingTrust:4.9, deposit:10000, available:true },
];


// ─── UTILS ────────────────────────────────────────────────────────────────────
const fmt = n => n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "";
const platformFee = r => Math.round(r * PLATFORM_FEE);
const preBookDep = dep => Math.round(dep * PRE_BOOKING_DEPOSIT_PCT);
const MY_TRUST = 4.1;
const trustColor = t => t >= 4.5 ? "#10B981" : t >= 4.0 ? "#F59E0B" : "#EF4444";

// ─── MICRO UI ─────────────────────────────────────────────────────────────────
const Tag = ({ c = "#10B981", children, small }) => (
  <span style={{ background: c + "18", color: c, border: `1px solid ${c}30`, borderRadius: 20, padding: small ? "1px 7px" : "2px 9px", fontSize: small ? 9 : 10, fontWeight: 800, letterSpacing: .5, whiteSpace: "nowrap" }}>{children}</span>
);

const Btn = ({ variant = "primary", children, style: s = {}, ...p }) => {
  const m = { primary: { bg: "#F59E0B", c: "#0C0E14" }, success: { bg: "#10B981", c: "#fff" }, danger: { bg: "#EF4444", c: "#fff" }, ghost: { bg: "#1C1F27", c: "#C0C8D8" }, outline: { bg: "transparent", c: "#F59E0B" }, blue: { bg: "#2563EB", c: "#fff" }, purple: { bg: "#7C3AED", c: "#fff" } }[variant] || { bg: "#F59E0B", c: "#0C0E14" };
  return <button style={{ background: m.bg, color: m.c, border: variant === "outline" ? "1px solid #F59E0B" : "none", borderRadius: 9, padding: "9px 18px", cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "'DM Sans',sans-serif", ...s }} {...p}>{children}</button>;
};

const Inp = ({ label, ...p }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    {label && <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: .7, textTransform: "uppercase" }}>{label}</span>}
    <input style={{ background: "#111318", border: "1px solid #252830", borderRadius: 9, padding: "10px 13px", color: "#F0EEE8", fontSize: 13, outline: "none", fontFamily: "'DM Sans',sans-serif", width: "100%", boxSizing: "border-box" }} {...p} />
  </label>
);

const Textarea = ({ label, ...p }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    {label && <span style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: .7, textTransform: "uppercase" }}>{label}</span>}
    <textarea style={{ background: "#111318", border: "1px solid #252830", borderRadius: 9, padding: "10px 13px", color: "#F0EEE8", fontSize: 13, outline: "none", fontFamily: "'DM Sans',sans-serif", resize: "none", height: 80, width: "100%", boxSizing: "border-box" }} {...p} />
  </label>
);

const Modal = ({ onClose, children, maxW = 540 }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.88)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={e => e.target === e.currentTarget && onClose?.()}>
    <div style={{ background: "#13151C", border: "1px solid #252830", borderRadius: 18, padding: 24, width: "100%", maxWidth: maxW, maxHeight: "90vh", overflowY: "auto" }}>{children}</div>
  </div>
);

const MHead = ({ title, onClose }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
    <div style={{ fontWeight: 800, fontSize: 17 }}>{title}</div>
    <button onClick={onClose} style={{ background: "none", border: "none", color: "#6B7280", fontSize: 20, cursor: "pointer" }}>✕</button>
  </div>
);

const InfoBox = ({ color = "#10B981", icon, label, sub, children }) => (
  <div style={{ background: color + "12", border: `1.5px solid ${color}35`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
    {label && <div style={{ fontSize: 11, fontWeight: 800, color, marginBottom: 3, letterSpacing: .6 }}>{icon} {label}</div>}
    {sub && <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 8, lineHeight: 1.5 }}>{sub}</div>}
    {children}
  </div>
);

const Divider = () => <div style={{ height: 1, background: "#1E2130", margin: "14px 0" }} />;

const Row = ({ l, r, color }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #1A1D25" }}>
    <span style={{ color: "#6B7280", fontSize: 12 }}>{l}</span>
    <span style={{ fontWeight: 700, fontSize: 13, color: color || "#F0EEE8" }}>{r}</span>
  </div>
);

const Stars = ({ val, count }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
    {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 12, color: val >= s ? "#F59E0B" : "#374151" }}>★</span>)}
    {count != null && <span style={{ color: "#6B7280", fontSize: 11, marginLeft: 3 }}>({count})</span>}
  </span>
);

const TrustBadge = ({ score }) => (
  <span style={{ background: trustColor(score) + "20", color: trustColor(score), border: `1px solid ${trustColor(score)}40`, borderRadius: 8, padding: "2px 8px", fontSize: 11, fontWeight: 800 }}>🛡 {score.toFixed(1)}</span>
);

const AvailBadge = ({ qty, listingType }) => {
  if (listingType === "service") return <Tag c="#10B981">Available</Tag>;
  if (qty === 0) return <Tag c="#EF4444">Unavailable</Tag>;
  if (qty <= 2) return <Tag c="#F97316">{qty} left</Tag>;
  return <Tag c="#10B981">{qty > 50 ? "In Stock" : `${qty} available`}</Tag>;
};

// ─── LISTING TYPE ICON & COLOR ─────────────────────────────────────────────────
const typeStyle = { item: { color: "#F59E0B", label: "Item" }, venue: { color: "#6366F1", label: "Venue" }, service: { color: "#10B981", label: "Service" } };


// ─── BOOKING MODAL (unified for all listing types) ───────────────────────────
const BookingModal = ({ listing, onClose, onBooked, myAddress, setMyAddress }) => {
  const [step, setStep] = useState(1); // 1=dates/slots 2=mode 3=identity 4=pay-deposit 5=address-revealed
  const [bookForm, setBookForm] = useState({ date: "", slot: "", hours: 1, qty: 1, days: 1, mode: "self", deliverySlot: "", renterAddress: "", renterName: "", renterPhone: "" });
  const [preDepPaid, setPreDepPaid] = useState(false);

  if (!listing) return null;
  const lt = listing.listingType;

  const calcTotal = () => {
    if (lt === "item") return bookForm.days * listing.rentPrice * bookForm.qty;
    if (lt === "venue") {
      if (bookForm.slot === "Full Day") return listing.priceFullDay;
      if (bookForm.slot === "Half Day (4hrs)") return listing.priceHalfDay;
      return listing.priceHour * (bookForm.slot.includes("Morning") || bookForm.slot.includes("Evening") ? 6 : 4);
    }
    if (lt === "service") return listing.priceHour * bookForm.hours;
    return 0;
  };

  const total = calcTotal();
  const fee = platformFee(total);
  const dep = listing.deposit || 0;
  const preDep = preBookDep(dep);
  const remainDep = dep - preDep;

  const isSlotBooked = (date, slot) => {
    if (!listing.bookedSlots) return false;
    return listing.bookedSlots[date]?.includes(slot);
  };

  const isDateBooked = (date) => {
    if (!listing.bookedDates) return false;
    return listing.bookedDates.includes(date);
  };

  const payPreDeposit = () => {
  const options = {
    key: 'rzp_test_SHwlf6Ln7T1FjV',  // paste your Razorpay Test Key ID from Step 4
    amount: Math.max(preDep, 100) * 100,  // Razorpay takes amount in paise
    currency: 'INR',
    name: 'Leasio',
    description: 'Pre-booking deposit',
    theme: { color: '#F59E0B' },
    handler: function(response) {
      // Payment successful
      console.log('Payment ID:', response.razorpay_payment_id);
      setPreDepPaid(true);
      setStep(5);
    },
  };
  const rzp = new window.Razorpay(options);
  rzp.open();
};

  const finalConfirm = () => {
    const order = {
      id: "ord" + Date.now(), listing, total, fee, dep,
      mode: bookForm.mode, status: "pending_handover", depositStatus: "held",
      ...bookForm
    };
    onBooked?.(order);
    onClose?.();
  };

  const steps = lt === "item" ? 5 : lt === "venue" ? 5 : 4;

  return (
    <Modal onClose={onClose} maxW={520}>
      <MHead title={`Book — ${listing.title.slice(0, 30)}${listing.title.length > 30 ? "…" : ""}`} onClose={onClose} />
      <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
        {Array.from({ length: steps }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: step > i ? "#F59E0B" : "#252830", transition: "background .3s" }} />
        ))}
      </div>

      {/* STEP 1: Date/Slot/Qty */}
      {step === 1 && <>
        {lt === "item" && <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <Inp label="Start Date" type="date" value={bookForm.date}
              min={new Date().toISOString().split("T")[0]}
              onChange={e => setBookForm(f => ({ ...f, date: e.target.value }))} />
            <Inp label="End Date" type="date" onChange={e => {
              const d = Math.max(1, Math.ceil((new Date(e.target.value) - new Date(bookForm.date)) / 86400000));
              setBookForm(f => ({ ...f, endDate: e.target.value, days: d }));
            }} />
          </div>
          {listing.totalQty > 1 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: .7, marginBottom: 6, textTransform: "uppercase" }}>Quantity (Max {listing.availableQty})</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Btn variant="ghost" style={{ padding: "6px 14px" }} onClick={() => setBookForm(f => ({ ...f, qty: Math.max(1, f.qty - 1) }))}>−</Btn>
                <span style={{ fontWeight: 900, fontSize: 20, minWidth: 30, textAlign: "center" }}>{bookForm.qty}</span>
                <Btn variant="ghost" style={{ padding: "6px 14px" }} onClick={() => setBookForm(f => ({ ...f, qty: Math.min(listing.availableQty, f.qty + 1) }))}>+</Btn>
                <span style={{ fontSize: 12, color: "#6B7280" }}>{listing.availableQty} available</span>
              </div>
            </div>
          )}
        </>}

        {lt === "venue" && <>
          <Inp label="Date" type="date" value={bookForm.date} min={new Date().toISOString().split("T")[0]} onChange={e => setBookForm(f => ({ ...f, date: e.target.value }))} />
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: .7, marginBottom: 8, textTransform: "uppercase" }}>Select Time Slot</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {SLOTS.map(slot => {
                const booked = isSlotBooked(bookForm.date, slot);
                const price = slot === "Full Day" ? listing.priceFullDay : slot === "Half Day (4hrs)" ? listing.priceHalfDay : listing.priceHour * (slot.includes("Morning") || slot.includes("Evening") ? 6 : 5);
                return (
                  <button key={slot} disabled={booked} onClick={() => setBookForm(f => ({ ...f, slot }))}
                    style={{ background: booked ? "#1A1A22" : bookForm.slot === slot ? "#F59E0B20" : "#111318", border: `1.5px solid ${booked ? "#252830" : bookForm.slot === slot ? "#F59E0B" : "#252830"}`, borderRadius: 9, padding: "10px 14px", color: booked ? "#374151" : "#F0EEE8", cursor: booked ? "not-allowed" : "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "'DM Sans',sans-serif" }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{booked ? "🔴" : bookForm.slot === slot ? "✓" : "○"} {slot}</span>
                    <span style={{ fontWeight: 700, color: booked ? "#374151" : "#F59E0B" }}>{booked ? "Booked" : fmt(price)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>}

        {lt === "service" && <>
          <Inp label="Date" type="date" value={bookForm.date} min={new Date().toISOString().split("T")[0]} onChange={e => setBookForm(f => ({ ...f, date: e.target.value }))} />
          <div style={{ marginTop: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: .7, marginBottom: 6, textTransform: "uppercase" }}>Hours Required (Min {listing.minHours})</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Btn variant="ghost" style={{ padding: "6px 14px" }} onClick={() => setBookForm(f => ({ ...f, hours: Math.max(listing.minHours, f.hours - 1) }))}>−</Btn>
              <span style={{ fontWeight: 900, fontSize: 20, minWidth: 30, textAlign: "center" }}>{bookForm.hours}</span>
              <Btn variant="ghost" style={{ padding: "6px 14px" }} onClick={() => setBookForm(f => ({ ...f, hours: f.hours + 1 }))}>+</Btn>
              <span style={{ fontSize: 12, color: "#6B7280" }}>hrs × {fmt(listing.priceHour)} = {fmt(bookForm.hours * listing.priceHour)}</span>
            </div>
          </div>
          <div style={{ background: "#0E1016", borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 6, fontWeight: 700 }}>PROVIDER AVAILABLE ON:</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {DAYS.map(d => <span key={d} style={{ background: listing.daysAvailable.includes(d) ? "#10B98120" : "#0E1016", color: listing.daysAvailable.includes(d) ? "#10B981" : "#374151", border: `1px solid ${listing.daysAvailable.includes(d) ? "#10B98140" : "#252830"}`, borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700 }}>{d}</span>)}
            </div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 6 }}>📍 Travels up to {listing.travelRadius}km from {listing.locality}</div>
          </div>
        </>}

        {total > 0 && (
          <div style={{ background: "#0E1016", borderRadius: 10, padding: 12, marginTop: 14 }}>
            <Row l="Subtotal" r={fmt(total)} />
            <Row l="Platform fee (1%)" r={`− ${fmt(fee)}`} color="#EF4444" />
            {dep > 0 && <Row l="Security deposit" r={fmt(dep)} color="#F59E0B" />}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, marginTop: 4, borderTop: "1px solid #252830" }}>
              <span style={{ fontWeight: 800 }}>Total</span>
              <span style={{ fontWeight: 900, fontSize: 16, color: "#10B981" }}>{fmt(total + dep)}</span>
            </div>
          </div>
        )}
      </>}

      {/* STEP 2: Delivery mode */}
      {step === 2 && <>
        <InfoBox color="#2563EB" icon="🚚" label="HOW WILL YOU RECEIVE THE ITEM?">
        </InfoBox>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { mode: "self", icon: "🤝", label: "Self Pickup / Drop", desc: "Arrange directly with owner. Full address revealed after 20% pre-deposit. Your address also required." },
            { mode: "app", icon: "🚚", label: "App-Managed Delivery", desc: "Leasio arranges courier. Select timeslot. Delivery fee added. OTP handover tracked in-app." },
          ].map(({ mode, icon, label, desc }) => (
            <button key={mode} onClick={() => setBookForm(f => ({ ...f, mode }))}
              style={{ background: bookForm.mode === mode ? "#2563EB18" : "#111318", border: `1.5px solid ${bookForm.mode === mode ? "#2563EB" : "#252830"}`, borderRadius: 10, padding: 14, cursor: "pointer", textAlign: "left" }}>
              <div style={{ fontWeight: 700, color: "#F0EEE8", marginBottom: 4 }}>{icon} {label}</div>
              <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>{desc}</div>
            </button>
          ))}
        </div>

        {bookForm.mode === "app" && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: .7, marginBottom: 8, textTransform: "uppercase" }}>Select Delivery Timeslot</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {["Morning (8–12pm)","Afternoon (12–4pm)","Evening (4–8pm)","Night (8–10pm)"].map(ts => (
                <button key={ts} onClick={() => setBookForm(f => ({ ...f, deliverySlot: ts }))}
                  style={{ background: bookForm.deliverySlot === ts ? "#F59E0B20" : "#111318", border: `1px solid ${bookForm.deliverySlot === ts ? "#F59E0B" : "#252830"}`, borderRadius: 8, padding: "8px 10px", color: "#F0EEE8", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>{ts}</button>
              ))}
            </div>
            <div style={{ marginTop: 10, background: "#0E1016", borderRadius: 8, padding: 10 }}>
              <Row l="Delivery fee (estimated)" r="₹80 – ₹250" />
              <div style={{ fontSize: 11, color: "#6B7280", marginTop: 4 }}>Exact fee shown before final payment based on distance.</div>
            </div>
          </div>
        )}
      </>}

      {/* STEP 3: Identity */}
      {step === 3 && <>
        <InfoBox color="#7C3AED" icon="🪪" label="YOUR DETAILS ARE REQUIRED"
          sub={bookForm.mode === "self" ? "For self-pickup, your address is shared with the owner so they know who to expect. This prevents anonymous transactions." : "Required for delivery coordination and OTP verification."}>
        </InfoBox>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Inp label="Full Name (as per Aadhaar)" value={bookForm.renterName} onChange={e => setBookForm(f => ({ ...f, renterName: e.target.value }))} placeholder="Your legal name" />
          <Inp label="Mobile Number" value={bookForm.renterPhone} onChange={e => setBookForm(f => ({ ...f, renterPhone: e.target.value }))} placeholder="+91 XXXXX XXXXX" />
          <Textarea label="Your Full Address" value={bookForm.renterAddress} onChange={e => setBookForm(f => ({ ...f, renterAddress: e.target.value }))} placeholder="Flat/House no, Street, Area, City, Pincode" />
          <InfoBox color="#F59E0B" icon="🔒" label="ADDRESS PRIVACY"
            sub="Your address is only shared with the owner after they confirm your booking. It is never publicly visible." />
        </div>
      </>}

      {/* STEP 4: Pre-deposit to unlock owner address */}
      {step === 4 && <>
        <InfoBox color="#F59E0B" icon="🔒" label="PAY 20% PRE-BOOKING DEPOSIT TO UNLOCK OWNER ADDRESS"
          sub="This deposit prevents spam enquiries and proves you are serious. It is credited toward your full deposit.">
          <div style={{ fontSize: 28, fontWeight: 900, color: "#F59E0B", marginTop: 4 }}>{fmt(preDep)}</div>
          <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>20% of total deposit ({fmt(dep)})</div>
        </InfoBox>
        <div style={{ background: "#0E1016", borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <Row l="Pre-booking deposit (pay now)" r={fmt(preDep)} color="#F59E0B" />
          <Row l="Remaining deposit (at confirmation)" r={fmt(remainDep)} />
          <Row l="Rent (at confirmation)" r={fmt(total)} />
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, marginTop: 4, borderTop: "1px solid #252830" }}>
            <span style={{ fontWeight: 800 }}>Total commitment</span>
            <span style={{ fontWeight: 900, color: "#10B981" }}>{fmt(total + dep)}</span>
          </div>
        </div>
        <InfoBox color="#2563EB" icon="ℹ️" label="WHAT YOU GET AFTER PAYING">
          <div style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.7 }}>
            ✓ Owner's full address is revealed (exact pickup location)<br/>
            ✓ Owner is notified with your contact details<br/>
            ✓ Pre-deposit is fully refunded if owner doesn't confirm within 4 hours<br/>
            ✓ Booking slot is held for you for 4 hours
          </div>
        </InfoBox>
        {dep === 0 && (
          <InfoBox color="#10B981" icon="✓" label="NO DEPOSIT REQUIRED FOR THIS LISTING">
            <div style={{ fontSize: 12, color: "#9CA3AF" }}>This service requires no security deposit. Proceed to see provider details.</div>
          </InfoBox>
        )}
        <Btn variant="primary" style={{ width: "100%" }} onClick={payPreDeposit}>
          {dep === 0 ? "Confirm Booking" : `Pay ${fmt(Math.max(preDep, 1))} & Unlock Owner Address`}
        </Btn>
      </>}

      {/* STEP 5: Address revealed */}
      {step === 5 && preDepPaid && <>
        <InfoBox color="#10B981" icon="✅" label="PRE-DEPOSIT RECEIVED — OWNER DETAILS UNLOCKED">
        </InfoBox>
        <div style={{ background: "#0E1016", borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#10B981", marginBottom: 10, letterSpacing: .5 }}>📍 OWNER / PICKUP DETAILS (Only visible to you)</div>
          <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{listing.owner}</div>
          <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 4 }}>📱 +91 98765 43210</div>
          <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 4 }}>📍 {listing.locality === "HSR Layout" ? "42/3, 19th Cross, Sector 2, HSR Layout, Bengaluru – 560102" : `${listing.locality}, ${listing.city}`}</div>
          {bookForm.mode === "app" && <div style={{ fontSize: 13, color: "#F59E0B", marginTop: 6, fontWeight: 700 }}>🚚 Delivery Slot: {bookForm.deliverySlot}</div>}
        </div>
        <InfoBox color="#7C3AED" icon="📋" label="YOUR BOOKING SUMMARY">
          <Row l="Item" r={listing.title.slice(0, 28)} />
          {bookForm.days > 1 && <Row l="Duration" r={`${bookForm.days} days`} />}
          {bookForm.slot && <Row l="Slot" r={bookForm.slot} />}
          {bookForm.hours > 1 && <Row l="Hours" r={`${bookForm.hours} hrs`} />}
          <Row l="Rent" r={fmt(total)} />
          <Row l="Pre-deposit paid" r={fmt(preDep)} color="#10B981" />
          <Row l="Balance deposit" r={fmt(remainDep)} color="#F59E0B" />
        </InfoBox>
        <Btn variant="success" style={{ width: "100%" }} onClick={finalConfirm}>✓ Confirm Full Booking</Btn>
      </>}

      {step < 5 && (
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          {step > 1 && <Btn variant="ghost" onClick={() => setStep(s => s - 1)}>← Back</Btn>}
          {step < 4 && (
            <Btn variant="primary" style={{ flex: 1 }} onClick={() => setStep(s => s + 1)}
              disabled={
                (step === 1 && lt === "item" && !bookForm.date) ||
                (step === 1 && lt === "venue" && !bookForm.slot) ||
                (step === 1 && lt === "service" && !bookForm.date) ||
                (step === 3 && (!bookForm.renterName || !bookForm.renterPhone || !bookForm.renterAddress))
              }>
              Continue →
            </Btn>
          )}
        </div>
      )}
    </Modal>
  );
};


// ─── PURCHASE MODAL ──────────────────────────────────────────────────────────
const PurchaseModal = ({ listing, onClose, onPurchased }) => {
  const [step, setStep] = useState(1); // 1=confirm 2=details 3=address-reveal
  const [form, setForm] = useState({ name:"", phone:"", address:"", mode:"pickup" });
  const [paid, setPaid] = useState(false);
  if (!listing) return null;
  const price = listing.buyPrice;
  const platformCut = Math.round(price * 0.01);

  const confirm = () => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.body.appendChild(script);
    script.onload = () => {
      const options = {
        key: 'rzp_test_SHwlf6Ln7T1FjV',
        amount: price * 100,
        currency: 'INR',
        name: 'Leasio',
        description: listing.title,
        theme: { color: '#10B981' },
        handler: function(response) {
          setPaid(true);
          setStep(3);
          onPurchased?.({ listing, price, platformCut, ...form, type:'purchase', razorpay_payment_id: response.razorpay_payment_id });
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    };
  };

  return (
    <Modal onClose={onClose} maxW={500}>
      <MHead title={"Buy — " + listing.title.slice(0,28)} onClose={onClose} />
      <div style={{ display:"flex", gap:4, marginBottom:18 }}>
        {[1,2,3].map(s => <div key={s} style={{ flex:1, height:3, borderRadius:2, background:step>=s?"#10B981":"#252830", transition:"background .3s" }} />)}
      </div>

      {step === 1 && <>
        <div style={{ background:"#0E1016", borderRadius:12, padding:16, marginBottom:14, display:"flex", gap:16, alignItems:"center" }}>
          <div style={{ fontSize:52 }}>{listing.emoji}</div>
          <div>
            <div style={{ fontWeight:800, fontSize:15, marginBottom:4 }}>{listing.title}</div>
            <TrustBadge score={listing.ownerTrust} />
            <div style={{ fontSize:11, color:"#6B7280", marginTop:4 }}>📍 {listing.locality} (full address unlocked after payment)</div>
          </div>
        </div>
        <div style={{ background:"#0E1016", borderRadius:10, padding:14, marginBottom:14 }}>
          <Row l="Item price" r={fmt(price)} />
          <Row l="Platform fee (1%)" r={"- " + fmt(platformCut)} color="#EF4444" />
          <Row l="Seller receives" r={fmt(price - platformCut)} color="#10B981" />
          <div style={{ display:"flex", justifyContent:"space-between", paddingTop:8, marginTop:4, borderTop:"1px solid #252830" }}>
            <span style={{ fontWeight:800 }}>You pay</span>
            <span style={{ fontWeight:900, fontSize:18, color:"#10B981" }}>{fmt(price)}</span>
          </div>
        </div>
        <InfoBox color="#10B981" icon="🛒" label="SECURE PURCHASE — HOW IT WORKS"
          sub="Payment held by Leasio. Seller's full address revealed only after payment. You confirm receipt; funds released to seller. Dispute if item not as described.">
        </InfoBox>
        <div style={{ display:"flex", gap:8, marginBottom:10 }}>
          {[{v:"pickup",l:"🤝 Pickup from seller"},{v:"delivery",l:"🚚 Arrange delivery"}].map(({v,l}) => (
            <button key={v} onClick={() => setForm(f => ({...f, mode:v}))} style={{ flex:1, background:form.mode===v?"#10B98118":"#111318", border:`1.5px solid ${form.mode===v?"#10B981":"#252830"}`, borderRadius:9, padding:"10px 8px", cursor:"pointer", color:"#F0EEE8", fontFamily:"'DM Sans',sans-serif", fontWeight:form.mode===v?700:400, fontSize:12 }}>{l}</button>
          ))}
        </div>
      </>}

      {step === 2 && <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        <InfoBox color="#7C3AED" icon="🪪" label="YOUR DETAILS REQUIRED"
          sub="Your name and address are shared with the seller so they know who is coming to collect. This prevents anonymous transactions." />
        <Inp label="Full Name" value={form.name} onChange={e => setForm(f => ({...f,name:e.target.value}))} placeholder="As per Aadhaar" />
        <Inp label="Mobile Number" value={form.phone} onChange={e => setForm(f => ({...f,phone:e.target.value}))} placeholder="+91 XXXXX XXXXX" />
        <Textarea label="Your Address" value={form.address} onChange={e => setForm(f => ({...f,address:e.target.value}))} placeholder="Full address for pickup / delivery coordination" />
      </div>}

      {step === 3 && paid && <>
        <InfoBox color="#10B981" icon="✅" label="PAYMENT RECEIVED — SELLER DETAILS UNLOCKED">
        </InfoBox>
        <div style={{ background:"#0E1016", borderRadius:12, padding:16, marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#10B981", marginBottom:10, letterSpacing:.5 }}>📍 SELLER CONTACT (Only visible to you)</div>
          <div style={{ fontWeight:800, fontSize:15, marginBottom:4 }}>{listing.owner}</div>
          <div style={{ fontSize:13, color:"#9CA3AF", marginBottom:2 }}>📱 +91 98765 43210</div>
          <div style={{ fontSize:13, color:"#9CA3AF" }}>📍 {listing.locality === "Banashankari" ? "12, 3rd Cross, Banashankari 2nd Stage, Bengaluru – 560070" : listing.locality + ", " + (listing.city || "Bengaluru")}</div>
        </div>
        <InfoBox color="#F59E0B" icon="⚡" label="NEXT STEPS">
          <div style={{ fontSize:12, color:"#9CA3AF", lineHeight:1.7 }}>
            1. Contact seller to arrange {form.mode === "pickup" ? "pickup" : "delivery"}<br/>
            2. Inspect item on receipt<br/>
            3. Confirm receipt in app → payment released to seller<br/>
            4. Raise dispute within 24h if item not as described
          </div>
        </InfoBox>
      </>}

      <div style={{ display:"flex", gap:8, marginTop:16 }}>
        {step > 1 && step < 3 && <Btn variant="ghost" onClick={() => setStep(s => s-1)}>← Back</Btn>}
        {step === 1 && <Btn variant="success" style={{ flex:1 }} onClick={() => setStep(2)}>Continue →</Btn>}
        {step === 2 && <Btn variant="success" style={{ flex:1 }} disabled={!form.name || !form.phone || !form.address} onClick={confirm}>Pay {fmt(price)} & Unlock Seller Address</Btn>}
        {step === 3 && <Btn variant="ghost" style={{ flex:1 }} onClick={onClose}>Done</Btn>}
      </div>
    </Modal>
  );
};

// ─── LISTING CARD ─────────────────────────────────────────────────────────────
const ListingCard = ({ item, onClick }) => {
  const lt = item.listingType;
  const ts = typeStyle[lt];
  const isRentedOut = lt === "item" && item.subtype !== "buy" && item.availableQty === 0;
  const isSellOnly = lt === "item" && item.subtype === "buy";
  const canRent = lt === "item" && (item.subtype === "rent" || item.subtype === "both") && item.rentPrice;
  const canBuy  = lt === "item" && (item.subtype === "buy"  || item.subtype === "both") && item.buyPrice;
  const isUnavail = isRentedOut && !canBuy;

  const primaryPrice = canRent ? `${fmt(item.rentPrice)}/day`
    : canBuy ? fmt(item.buyPrice)
    : lt === "venue" ? `${fmt(item.priceHour)}/hr`
    : `${fmt(item.priceHour)}/hr`;

  return (
    <div onClick={() => !isUnavail && onClick(item)}
      style={{ background: "#13151C", border: "1px solid #1E2130", borderRadius: 14, overflow: "hidden", cursor: isUnavail ? "not-allowed" : "pointer", opacity: isUnavail ? 0.5 : 1, transition: "transform .2s, border-color .2s" }}
      onMouseEnter={e => { if (!isUnavail) { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = ts.color + "50"; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = "#1E2130"; }}>
      <div style={{ background: "#0E1016", height: 100, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50, position: "relative" }}>
        {item.emoji}
        {isRentedOut && !canBuy && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.65)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Tag c="#EF4444">Currently Rented Out</Tag>
        </div>}
      </div>
      <div style={{ padding: 13 }}>
        <div style={{ display: "flex", gap: 5, marginBottom: 7, flexWrap: "wrap", alignItems: "center" }}>
          <Tag c={ts.color}>{ts.label}</Tag>
          {canRent && canBuy && <Tag c="#10B981">Rent or Buy</Tag>}
          {canBuy && !canRent && <Tag c="#10B981">For Sale</Tag>}
          {canRent && !canBuy && <Tag c="#F59E0B">Rent Only</Tag>}
          {item.verified && <Tag c="#2563EB">🛡</Tag>}
          {lt === "item" && <AvailBadge qty={item.availableQty} listingType={lt} />}
        </div>
        <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 3, lineHeight: 1.3 }}>{item.title}</div>
        <Stars val={item.rating} count={item.reviews} />
        {lt === "venue" && <div style={{ fontSize: 11, color: "#6B7280", marginTop: 3 }}>👥 Capacity: {item.capacity}</div>}
        {lt === "service" && <div style={{ fontSize: 11, color: "#6B7280", marginTop: 3 }}>📅 {item.daysAvailable.join(", ")}</div>}
        <div style={{ fontSize: 11, color: "#6B7280", marginTop: 3 }}>📍 {item.locality}</div>
        <Divider />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 6 }}>
          <div>
            {canRent && <div><span style={{ fontWeight: 900, fontSize: 17, color: "#F59E0B" }}>{fmt(item.rentPrice)}</span><span style={{ color: "#6B7280", fontSize: 11 }}>/day</span></div>}
            {canBuy  && <div style={{ fontSize: canRent ? 11 : 17, fontWeight: 900, color: "#10B981" }}>{canRent ? "Buy: " : ""}{fmt(item.buyPrice)}</div>}
            {(lt === "venue" || lt === "service") && <div style={{ fontWeight: 900, fontSize: 17, color: ts.color }}>{primaryPrice}</div>}
          </div>
          {item.deposit > 0 && canRent && <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "#F59E0B" }}>🔒 deposit</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B" }}>{fmt(item.deposit)}</div>
          </div>}
        </div>
        {lt === "item" && item.totalQty > 1 && canRent && (
          <div style={{ fontSize: 10, color: "#6B7280", marginTop: 4 }}>{item.availableQty}/{item.totalQty} units available</div>
        )}
      </div>
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const LoginScreen = ({ onLogin }) => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      onLogin(data.user);
    } catch (e) {
      setError('Invalid email or password');
    }
    setLoading(false);
  };

  const handleSignup = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      onLogin(data.user);
    } catch (e) {
      setError('Signup failed: ' + e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", minHeight:"100vh", background:"#0C0E14", color:"#F0EEE8", display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#13151C", border:"1px solid #252830", borderRadius:16, padding:32, width:"100%", maxWidth:380 }}>
        <div style={{ fontSize:32, fontWeight:900, color:"#F59E0B", marginBottom:4 }}>🏪 Leasio</div>
        <div style={{ color:"#6B7280", marginBottom:20, fontSize:13 }}>{mode === 'login' ? 'Sign in to continue' : 'Create your account'}</div>

        <div style={{ display:"flex", gap:8, marginBottom:20 }}>
          <button onClick={() => setMode('login')} style={{ flex:1, background:mode==='login'?"#F59E0B":"#111318", color:mode==='login'?"#0C0E14":"#9CA3AF", border:"1px solid #252830", borderRadius:8, padding:"8px", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>Sign In</button>
          <button onClick={() => setMode('signup')} style={{ flex:1, background:mode==='signup'?"#F59E0B":"#111318", color:mode==='signup'?"#0C0E14":"#9CA3AF", border:"1px solid #252830", borderRadius:8, padding:"8px", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>Sign Up</button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <label style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <span style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, textTransform:"uppercase" }}>Email</span>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ background:"#111318", border:"1px solid #252830", borderRadius:9, padding:"10px 13px", color:"#F0EEE8", fontSize:13, outline:"none", fontFamily:"'DM Sans',sans-serif", width:"100%", boxSizing:"border-box" }}
            />
          </label>
          <label style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <span style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, textTransform:"uppercase" }}>Password</span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ background:"#111318", border:"1px solid #252830", borderRadius:9, padding:"10px 13px", color:"#F0EEE8", fontSize:13, outline:"none", fontFamily:"'DM Sans',sans-serif", width:"100%", boxSizing:"border-box" }}
            />
          </label>
          {error && <div style={{ color:"#EF4444", fontSize:12 }}>{error}</div>}
          <button
            onClick={mode === 'login' ? handleLogin : handleSignup}
            disabled={loading || !email || !password}
            style={{ background:"#F59E0B", color:"#0C0E14", border:"none", borderRadius:9, padding:"11px 18px", cursor:"pointer", fontWeight:700, fontSize:14, fontFamily:"'DM Sans',sans-serif", marginTop:4 }}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default function Leasio() {
  const [listings, setListings] = useState([]);

useEffect(() => {
  fetchListings()
    .then(data => setListings(data))
    .catch(err => console.error('Failed to load listings:', err));
}, []);
  const [view, setView] = useState("browse");
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [locality, setLocality] = useState("");
  const [filterLT, setFilterLT] = useState("all");
  const [filterSale, setFilterSale] = useState(false); // true = show "For Sale" items only
  const [filterCat, setFilterCat] = useState("All");
  const [toasts, setToasts] = useState([]);
  const [bookingModal, setBookingModal] = useState(null);
  const [buyModal, setBuyModal] = useState(null);
  const [orders, setOrders] = useState([]);
const [currentUser, setCurrentUser] = useState(null);

useEffect(() => {
  supabase.auth.getUser().then(({ data: { user } }) => {
    setCurrentUser(user);
  });
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => setCurrentUser(session?.user ?? null)
  );
  return () => subscription.unsubscribe();
}, []);

useEffect(() => {
  if (!currentUser) return;
  fetchMyBookings(currentUser.id).then(setOrders);
}, [currentUser]);
  const [myAddress] = useState("");
  const [listForm, setListForm] = useState({
    listingType: "item", title: "", category: "Electronics", subtype: "rent",
    ownerType: "individual", emoji: "📦", locality: "", description: "",
    rentPrice: "", priceHour: "", priceHalfDay: "", priceFullDay: "",
    deposit: "", buyPrice: "", minDays: 1, minHours: 1,
    totalQty: 1, daysAvailable: [], travelRadius: 10, capacity: ""
  });

  useEffect(() => {
    const l = document.createElement("link");
    l.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap";
    l.rel = "stylesheet"; document.head.appendChild(l);
  }, []);

  const toast = msg => { const id = Date.now(); setToasts(t => [...t, { id, msg }]); setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000); };

  const handleBooked = (order) => {
    setOrders(o => [...o, order]);
    // Decrement availability
    setListings(ls => ls.map(l => {
      if (l.id !== order.listing.id) return l;
      const newQty = Math.max(0, l.availableQty - (order.qty || 1));
      return { ...l, availableQty: newQty, available: newQty > 0 };
    }));
    toast(`✅ Booking confirmed! ${order.mode === "app" ? "Delivery slot locked." : "Owner address unlocked."}`);
    setView("orders");
  };

  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} />;
  const filtered = listings.filter(l => {
    const ms = l.title.toLowerCase().includes(search.toLowerCase()) || l.description.toLowerCase().includes(search.toLowerCase());
    const mlt = filterLT === "all" || l.listingType === filterLT;
    const ml = !locality || l.locality.toLowerCase().includes(locality.toLowerCase());
    const mc = filterCat === "All" || l.category === filterCat;
    const mSale = !filterSale || (l.listingType === "item" && (l.subtype === "buy" || l.subtype === "both"));
    return ms && mlt && ml && mc && mSale;
  });

  const allCats = [...new Set(listings.map(l => l.category))];

  // ── LIST FORM ──────────────────────────────────────────────────────────────
  

  // ── ORDERS VIEW ────────────────────────────────────────────────────────────
  const OrdersView = () => (
    <div style={{ padding: 24, maxWidth: 780, margin: "0 auto" }}>
      <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 4 }}>My Bookings</div>
      <div style={{ color: "#6B7280", marginBottom: 22, fontSize: 13 }}>All your rentals, venue bookings and service appointments</div>
      {orders.length === 0 ? (
        <div style={{ textAlign: "center", color: "#6B7280", padding: "60px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📦</div>
          <div>No bookings yet.</div>
          <Btn variant="primary" style={{ marginTop: 16 }} onClick={() => setView("browse")}>Browse Listings</Btn>
        </div>
      ) : orders.map(order => {
        const isPurchase = order.type === "purchase" || order.status === "purchased";
        const borderColor = isPurchase ? "#10B981" : typeStyle[order.listing?.listingType]?.color || "#F59E0B";
        return (
          <div key={order.id} style={{ background: "#13151C", border: `1.5px solid ${borderColor}35`, borderRadius: 14, padding: 18, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontWeight: 800 }}>{order.listing?.title || order.itemTitle}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap:"wrap" }}>
                  {order.listing && <Tag c={typeStyle[order.listing.listingType]?.color || "#F59E0B"}>{typeStyle[order.listing.listingType]?.label || "Item"}</Tag>}
                  {isPurchase ? <Tag c="#10B981">🛒 Purchased</Tag> : <Tag c="#2563EB">📋 Booked</Tag>}
                  {!isPurchase && order.mode && <Tag c={order.mode === "app" ? "#2563EB" : "#F59E0B"}>{order.mode === "app" ? "App Delivery" : "Self Pickup"}</Tag>}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 900, color: "#10B981" }}>{fmt(isPurchase ? order.price : order.total)}</div>
                {!isPurchase && order.dep > 0 && <div style={{ fontSize: 11, color: "#F59E0B" }}>Deposit: {fmt(order.dep)}</div>}
                {isPurchase && <div style={{ fontSize: 11, color: "#6B7280" }}>Platform fee: {fmt(order.platformCut)}</div>}
              </div>
            </div>
            {!isPurchase && order.deliverySlot && <div style={{ marginTop: 8, fontSize: 12, color: "#2563EB", fontWeight: 700 }}>🚚 Delivery: {order.deliverySlot}</div>}
            {!isPurchase && order.slot && <div style={{ marginTop: 4, fontSize: 12, color: "#6B7280" }}>⏰ Slot: {order.slot}</div>}
            {!isPurchase && order.hours && <div style={{ marginTop: 4, fontSize: 12, color: "#6B7280" }}>⏱ Duration: {order.hours} hours</div>}
            {isPurchase && <div style={{ marginTop: 8, fontSize: 12, color: "#10B981" }}>✅ Seller address unlocked · Confirm receipt in app to release payment</div>}
          </div>
        );
      })}
    </div>
  );

  // ── ITEM DETAIL ────────────────────────────────────────────────────────────
  const ItemDetail = () => {
    const item = selected;
    const lt = item.listingType;
    const ts = typeStyle[lt];
    return (
      <div style={{ padding: 24, maxWidth: 780, margin: "0 auto" }}>
        <Btn variant="ghost" style={{ marginBottom: 18 }} onClick={() => setSelected(null)}>← Back</Btn>
        <div style={{ background: "#13151C", border: "1px solid #1E2130", borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <div style={{ fontSize: 72, background: "#0E1016", borderRadius: 14, padding: "16px 26px" }}>{item.emoji}</div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                <Tag c={ts.color}>{ts.label}</Tag>
                {item.verified && <Tag c="#2563EB">🛡 Verified</Tag>}
                <AvailBadge qty={item.availableQty} listingType={lt} />
              </div>
              <div style={{ fontSize: 21, fontWeight: 900, marginBottom: 6, lineHeight: 1.2 }}>{item.title}</div>
              <Stars val={item.rating} count={item.reviews} />
              <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
                <TrustBadge score={item.ownerTrust} />
                <span style={{ fontSize: 11, color: "#6B7280" }}>{item.owner}</span>
              </div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 5 }}>📍 {item.locality}, {item.city} <span style={{ color: "#374151", fontSize: 11 }}>(full address after booking)</span></div>
            </div>
          </div>
          <div style={{ color: "#9CA3AF", lineHeight: 1.7, marginTop: 16, fontSize: 13 }}>{item.description}</div>

          {lt === "venue" && item.amenities && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", marginBottom: 8, textTransform: "uppercase", letterSpacing: .6 }}>Amenities</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {item.amenities.map(a => <Tag key={a} c="#6366F1">{a}</Tag>)}
              </div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 6 }}>👥 Capacity: {item.capacity} persons</div>
            </div>
          )}

          {lt === "service" && (
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{DAYS.map(d => <span key={d} style={{ fontSize: 11, background: item.daysAvailable.includes(d) ? "#10B98120" : "#111318", color: item.daysAvailable.includes(d) ? "#10B981" : "#374151", border: `1px solid ${item.daysAvailable.includes(d) ? "#10B98140" : "#252830"}`, borderRadius: 6, padding: "3px 8px", fontWeight: 700 }}>{d}</span>)}</div>
              <div style={{ fontSize: 12, color: "#6B7280" }}>📍 Travels up to {item.travelRadius}km · Min {item.minHours} hour(s) per booking</div>
            </div>
          )}

          <Divider />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 14 }}>
            {lt === "item" && (item.subtype === "rent" || item.subtype === "both") && item.rentPrice && <div style={{ background: "#0E1016", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700 }}>RENT/DAY</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: ts.color }}>{fmt(item.rentPrice)}</div>
              {item.totalQty > 1 && <div style={{ fontSize: 10, color: "#6B7280" }}>{item.availableQty}/{item.totalQty} units</div>}
            </div>}
            {lt === "venue" && <>
              <div style={{ background: "#0E1016", borderRadius: 10, padding: 12 }}><div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700 }}>PER HOUR</div><div style={{ fontSize: 18, fontWeight: 900, color: ts.color }}>{fmt(item.priceHour)}</div></div>
              <div style={{ background: "#0E1016", borderRadius: 10, padding: 12 }}><div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700 }}>HALF DAY</div><div style={{ fontSize: 18, fontWeight: 900, color: ts.color }}>{fmt(item.priceHalfDay)}</div></div>
              <div style={{ background: "#0E1016", borderRadius: 10, padding: 12 }}><div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700 }}>FULL DAY</div><div style={{ fontSize: 18, fontWeight: 900, color: ts.color }}>{fmt(item.priceFullDay)}</div></div>
            </>}
            {lt === "service" && <div style={{ background: "#0E1016", borderRadius: 10, padding: 12 }}><div style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700 }}>PER HOUR</div><div style={{ fontSize: 20, fontWeight: 900, color: ts.color }}>{fmt(item.priceHour)}</div></div>}
            {item.deposit > 0 && <div style={{ background: "#F59E0B12", border: "1.5px solid #F59E0B40", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 10, color: "#F59E0B", fontWeight: 700 }}>🔒 DEPOSIT</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#F59E0B" }}>{fmt(item.deposit)}</div>
              <div style={{ fontSize: 9, color: "#6B7280" }}>Held by Leasio</div>
            </div>}
            {item.buyPrice && <div style={{ background: "#10B98112", border: "1.5px solid #10B98140", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 10, color: "#10B981", fontWeight: 700 }}>BUY PRICE</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#10B981" }}>{fmt(item.buyPrice)}</div>
            </div>}
          </div>

          <InfoBox color="#F59E0B" icon="🔒" label="ADDRESS PRIVACY SYSTEM"
            sub={`Full pickup address shown only after paying 20% pre-deposit (${fmt(preBookDep(item.deposit || 1000))}). Your address is also required for this booking.`} />

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {lt === "item" && (item.subtype === "rent" || item.subtype === "both") && item.availableQty > 0 && (
              <Btn variant="primary" style={{ flex: 1, minWidth: 140, padding: "11px 18px" }} onClick={() => setBookingModal(item)}>🔑 Rent Securely</Btn>
            )}
            {lt !== "item" && item.availableQty !== 0 && (
              <Btn variant="primary" style={{ flex: 1, minWidth: 140, padding: "11px 18px" }} onClick={() => setBookingModal(item)}>
                {lt === "venue" ? "📅 Reserve Venue" : "📋 Book Session"}
              </Btn>
            )}
            {lt === "item" && item.buyPrice && (item.subtype === "buy" || item.subtype === "both") && (
              <Btn variant="success" style={{ flex: 1, minWidth: 140, padding: "11px 18px" }} onClick={() => setBuyModal(item)}>🛒 Buy Now — {fmt(item.buyPrice)}</Btn>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── BROWSE ─────────────────────────────────────────────────────────────────
  const BrowseView = () => (
    <div style={{ padding: 24, maxWidth: 1160, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <input style={{ flex: 1, minWidth: 200, background: "#111318", border: "1px solid #252830", borderRadius: 9, padding: "9px 14px", color: "#F0EEE8", fontSize: 13, outline: "none", fontFamily: "'DM Sans',sans-serif" }} placeholder="🔍 Search items, venues, services..." value={search} onChange={e => setSearch(e.target.value)} />
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#111318", border: "1px solid #252830", borderRadius: 9, padding: "0 12px" }}>
          <span>📍</span>
          <input style={{ background: "none", border: "none", color: "#F0EEE8", fontSize: 13, outline: "none", width: 140, fontFamily: "'DM Sans',sans-serif" }} placeholder="Locality" value={locality} onChange={e => setLocality(e.target.value)} />
          <button onClick={() => navigator.geolocation?.getCurrentPosition(p => { setLocality(`${p.coords.latitude.toFixed(2)}°N`); toast("📍 GPS detected!"); })} style={{ background: "none", border: "none", color: "#F59E0B", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans',sans-serif" }}>GPS</button>
        </div>
      </div>

      {/* Type filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {[{ v: "all", l: "All" }, { v: "item", l: "📦 Items" }, { v: "venue", l: "🏟 Venues" }, { v: "service", l: "👤 Services" }].map(({ v, l }) => (
          <Btn key={v} variant={filterLT === v ? "primary" : "ghost"} style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => { setFilterLT(v); setFilterSale(false); }}>{l}</Btn>
        ))}
        <Btn variant={filterSale ? "success" : "ghost"} style={{ fontSize: 12, padding: "6px 14px" }} onClick={() => { setFilterSale(s => !s); setFilterLT("all"); }}>🛒 For Sale</Btn>
        <div style={{ flex: 1 }} />
        <select style={{ background: "#111318", border: "1px solid #252830", borderRadius: 8, padding: "6px 12px", color: "#9CA3AF", fontSize: 12, fontFamily: "'DM Sans',sans-serif", cursor: "pointer" }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="All">All Categories</option>
          {allCats.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(262px, 1fr))", gap: 14 }}>
        {filtered.map(item => <ListingCard key={item.id} item={item} onClick={it => setSelected(it)} />)}
      </div>
      {filtered.length === 0 && (
        <div style={{ textAlign: "center", color: "#6B7280", padding: "60px 0" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
          <div style={{ marginBottom: 16 }}>No listings match your search. Try a different locality or category.</div>
        </div>
      )}
    </div>
  );

  const S = {
    app: { fontFamily: "'DM Sans',sans-serif", minHeight: "100vh", background: "#0C0E14", color: "#F0EEE8" },
    bar: { background: "rgba(12,14,20,.97)", backdropFilter: "blur(24px)", borderBottom: "1px solid #1E2130", padding: "0 20px", display: "flex", alignItems: "center", gap: 10, height: 58, position: "sticky", top: 0, zIndex: 100 },
    nav: a => ({ background: a ? "#F59E0B" : "transparent", color: a ? "#0C0E14" : "#9CA3AF", border: "none", borderRadius: 7, padding: "5px 11px", cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "'DM Sans',sans-serif" }),
  };

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500&display=swap" rel="stylesheet" />

      {/* Toasts */}
      <div style={{ position: "fixed", top: 66, right: 16, zIndex: 300, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
        {toasts.map(t => <div key={t.id} style={{ background: "#13151C", border: "1px solid #252830", color: "#F0EEE8", padding: "10px 16px", borderRadius: 10, fontWeight: 600, fontSize: 13, boxShadow: "0 8px 30px rgba(0,0,0,.5)", animation: "slideIn .3s ease" }}>{t.msg}</div>)}
      </div>

      {/* Topbar */}
      <div style={S.bar}>
        <div style={{ fontSize: 19, fontWeight: 900, color: "#F59E0B", letterSpacing: -1, cursor: "pointer", whiteSpace: "nowrap" }} onClick={() => { setView("browse"); setSelected(null); }}>🏪 Leasio</div>
        <div style={{ flex: 1 }} />
        {[{ id: "browse", l: "Browse" }, { id: "list", l: "+ List" }, { id: "orders", l: "Orders" }].map(t => (
          <button key={t.id} style={S.nav(view === t.id && !selected)} onClick={() => { setView(t.id); setSelected(null); }}>{t.l}</button>
        ))}
      </div>

      {/* Hero */}
      {view === "browse" && !selected && (
        <div style={{ background: "linear-gradient(155deg,#130A00 0%,#080A14 50%,#0C0E14 100%)", borderBottom: "1px solid #1E2130", padding: "36px 24px 28px", textAlign: "center" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#F59E0B", letterSpacing: 4, marginBottom: 10 }}>INDIA'S SAFEST RENTAL MARKETPLACE</div>
          <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 10 }}>Items. Venues. Services.</div>
          <div style={{ color: "#6B7280", fontSize: 13, maxWidth: 500, margin: "0 auto 18px" }}>Rent or buy items, book marriage halls & playgrounds, hire skilled services — with full escrow protection, OTP handover, and deposit safety.</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {["📦 Rent or Buy Items","🏟 Book Venues","👤 Hire Services","🔒 Escrow Protected","⚡ OTP Handover","📍 Locality-First Privacy"].map(f => (
              <div key={f} style={{ background: "#13151C", border: "1px solid #1E2130", borderRadius: 8, padding: "5px 12px", fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>{f}</div>
            ))}
          </div>
        </div>
      )}

      {selected ? <ItemDetail /> : view === "browse" ? <BrowseView /> : view === "list" ? <ListForm setListings={setListings} setView={setView} toast={toast} /> : <OrdersView />}
      {bookingModal && <BookingModal listing={bookingModal} onClose={() => setBookingModal(null)} onBooked={handleBooked} myAddress={myAddress} />}
      {buyModal && <PurchaseModal listing={buyModal} onClose={() => setBuyModal(null)} onPurchased={order => { setOrders(o => [...o, {...order, id:"pur"+Date.now(), status:"purchased"}]); setListings(ls => ls.map(l => l.id === buyModal.id ? {...l, availableQty: Math.max(0, l.availableQty-1)} : l)); toast("✅ Purchase confirmed! Seller address unlocked."); setView("orders"); setBuyModal(null); }} />}

      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)} }
        @keyframes spin { from{transform:rotate(0deg)}to{transform:rotate(360deg)} }
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:#0C0E14}::-webkit-scrollbar-thumb{background:#1E2130;border-radius:3px}
        select option{background:#111318}
        input[type=range]{accent-color:#F59E0B}
      `}</style>
    </div>
  );
}
