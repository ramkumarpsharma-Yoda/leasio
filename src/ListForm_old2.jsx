import { supabase } from './supabase.js';
import React, { useState, useRef } from "react";

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const CATS_ITEM    = ["Furniture","Tools","Electronics","Outdoor","Event","Vehicles","Other"];
const CATS_VENUE   = ["Marriage Hall","Party Hall","Playground","Sports Court","Conference Room","Farmhouse","Other"];
const CATS_SERVICE = ["Sports Coach","Music Teacher","Yoga Instructor","Personal Trainer","Tutor","Chef","Photographer","Other"];
const typeStyle    = { item:{color:"#F59E0B",label:"Item"}, venue:{color:"#6366F1",label:"Venue"}, service:{color:"#10B981",label:"Service"} };

const Inp = ({ label, error, ...p }) => (
  <label style={{ display:"flex", flexDirection:"column", gap:5 }}>
    {label && <span style={{ fontSize:11, fontWeight:700, color: error?"#EF4444":"#9CA3AF", letterSpacing:.7, textTransform:"uppercase" }}>{label}{error ? ` — ${error}`:""}</span>}
    <input style={{ background:"#111318", border:`1px solid ${error?"#EF4444":"#252830"}`, borderRadius:9, padding:"10px 13px", color:"#F0EEE8", fontSize:13, outline:"none", fontFamily:"'DM Sans',sans-serif", width:"100%", boxSizing:"border-box" }} {...p} />
  </label>
);

const Textarea = ({ label, ...p }) => (
  <label style={{ display:"flex", flexDirection:"column", gap:5 }}>
    {label && <span style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, textTransform:"uppercase" }}>{label}</span>}
    <textarea style={{ background:"#111318", border:"1px solid #252830", borderRadius:9, padding:"10px 13px", color:"#F0EEE8", fontSize:13, outline:"none", fontFamily:"'DM Sans',sans-serif", resize:"none", height:80, width:"100%", boxSizing:"border-box" }} {...p} />
  </label>
);

const Btn = ({ variant="primary", children, style:s={}, ...p }) => {
  const m = { primary:{bg:"#F59E0B",c:"#0C0E14"}, success:{bg:"#10B981",c:"#fff"}, ghost:{bg:"#1C1F27",c:"#C0C8D8"}, danger:{bg:"#EF4444",c:"#fff"} }[variant]||{bg:"#F59E0B",c:"#0C0E14"};
  return <button style={{ background:m.bg, color:m.c, border:"none", borderRadius:9, padding:"9px 18px", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"'DM Sans',sans-serif", ...s }} {...p}>{children}</button>;
};

const InfoBox = ({ color="#10B981", icon, label, sub, children }) => (
  <div style={{ background:color+"12", border:`1.5px solid ${color}35`, borderRadius:12, padding:14, marginBottom:12 }}>
    {label && <div style={{ fontSize:11, fontWeight:800, color, marginBottom:3, letterSpacing:.6 }}>{icon} {label}</div>}
    {sub && <div style={{ fontSize:12, color:"#9CA3AF", marginBottom:8, lineHeight:1.5 }}>{sub}</div>}
    {children}
  </div>
);

// ─── CLOUDINARY PHOTO UPLOAD ─────────────────────────────────────────────────
// You must create a free unsigned upload preset in Cloudinary dashboard:
// Settings → Upload → Add upload preset → Signing Mode: Unsigned → Save
// Then set the preset name below (or in .env as VITE_CLOUDINARY_PRESET)
const CLOUD_NAME   = import.meta.env.VITE_CLOUDINARY_CLOUD || "";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET || "leasio_unsigned";

async function uploadToCloudinary(file) {
  if (!CLOUD_NAME) throw new Error("VITE_CLOUDINARY_CLOUD not set in environment variables");
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method:"POST", body:fd });
  if (!res.ok) throw new Error("Upload failed: " + res.statusText);
  const data = await res.json();
  return data.secure_url;
}

// ─── PHOTO UPLOADER COMPONENT ────────────────────────────────────────────────
const PhotoUploader = ({ photos, setPhotos, toast }) => {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files) => {
    if (!files.length) return;
    if (photos.length + files.length > 5) { toast("⚠ Max 5 photos allowed"); return; }
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map(f => uploadToCloudinary(f)));
      setPhotos(p => [...p, ...urls]);
      toast("✅ " + urls.length + " photo(s) uploaded!");
    } catch(e) {
      toast("❌ Upload failed: " + e.message);
    }
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div>
      <span style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, textTransform:"uppercase", display:"block", marginBottom:8 }}>
        Photos (up to 5) {photos.length > 0 && `— ${photos.length} uploaded`}
      </span>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => !uploading && fileRef.current?.click()}
        style={{ border:"2px dashed #252830", borderRadius:12, padding:"20px 16px", textAlign:"center", cursor: uploading?"wait":"pointer", background:"#0E1016", transition:"border-color .2s" }}
        onMouseEnter={e => { if(!uploading) e.currentTarget.style.borderColor="#F59E0B60"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor="#252830"; }}>
        {uploading ? (
          <div style={{ color:"#F59E0B", fontWeight:700 }}>⏳ Uploading...</div>
        ) : (
          <>
            <div style={{ fontSize:28, marginBottom:6 }}>📸</div>
            <div style={{ fontSize:13, color:"#9CA3AF" }}>Click or drag &amp; drop photos here</div>
            <div style={{ fontSize:11, color:"#374151", marginTop:4 }}>JPG, PNG — max 5 photos, 10MB each</div>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:"none" }}
          onChange={e => handleFiles(e.target.files)} />
      </div>

      {/* Photo previews */}
      {photos.length > 0 && (
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:10 }}>
          {photos.map((url, i) => (
            <div key={i} style={{ position:"relative", width:80, height:80 }}>
              <img src={url} alt="" style={{ width:80, height:80, objectFit:"cover", borderRadius:8, border:"1px solid #252830" }} />
              <button
                onClick={() => setPhotos(p => p.filter((_,j) => j!==i))}
                style={{ position:"absolute", top:-6, right:-6, background:"#EF4444", border:"none", borderRadius:"50%", width:20, height:20, color:"#fff", fontSize:11, cursor:"pointer", fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif" }}>✕</button>
              {i === 0 && <div style={{ position:"absolute", bottom:2, left:2, background:"#F59E0B", borderRadius:4, fontSize:8, fontWeight:800, padding:"1px 4px", color:"#0C0E14" }}>MAIN</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── MAIN LIST FORM ───────────────────────────────────────────────────────────
const ListForm = ({ setListings, setView, toast }) => {
  const [listForm, setListForm] = useState({
    listingType:"item", title:"", category:"Electronics", subtype:"rent",
    ownerType:"individual", emoji:"📦", locality:"", description:"",
    rentPrice:"", priceHour:"", priceHalfDay:"", priceFullDay:"",
    deposit:"", buyPrice:"", minDays:1, minHours:1,
    totalQty:1, daysAvailable:[], travelRadius:10, capacity:"",
    city:"", fullAddress:"", phone:""
  });
  const [photos, setPhotos] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const lt = listForm.listingType;
  const emojis = ["📦","🪑","🔧","📷","🔊","⛺","💒","⚽","🎉","🏟","🧘","📸","🚗","💡","🎸","🏍","🔑","💼","🎭","🌿"];

  const toggleDay = d => setListForm(f => ({
    ...f, daysAvailable: f.daysAvailable.includes(d) ? f.daysAvailable.filter(x=>x!==d) : [...f.daysAvailable, d]
  }));

  const validate = () => {
    const e = {};
    if (!listForm.title.trim()) e.title = "Required";
    if (!listForm.locality.trim()) e.locality = "Required";
    if (!listForm.city.trim()) e.city = "Required";
    if (!listForm.phone.trim()) e.phone = "Required";
    if (listForm.phone && listForm.phone.replace(/\D/g,"").length !== 10) e.phone = "Must be 10 digits";
    if (lt==="item" && (listForm.subtype==="rent"||listForm.subtype==="both") && !listForm.rentPrice) e.rentPrice = "Required";
    if (lt==="item" && (listForm.subtype==="buy"||listForm.subtype==="both") && !listForm.buyPrice) e.buyPrice = "Required";
    if (lt==="venue" && !listForm.priceHour) e.priceHour = "Required";
    if (lt==="service" && !listForm.priceHour) e.priceHour = "Required";
    if (lt==="service" && listForm.daysAvailable.length===0) e.days = "Select at least one day";
    if (!listForm.description.trim()) e.description = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) { toast("⚠ Please fix the errors below"); return; }
    setSubmitting(true);
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      const base = {
        owner_id: user.id,
        listing_type: listForm.listingType,
        subtype: listForm.subtype,
        category: listForm.category,
        title: listForm.title,
        description: listForm.description,
        emoji: listForm.emoji,
        locality: listForm.locality,
        city: listForm.city,
        full_address: listForm.fullAddress,
        contact_phone: listForm.phone.replace(/\D/g,""),
        rent_price: listForm.rentPrice ? Number(listForm.rentPrice) : null,
        buy_price: listForm.buyPrice ? Number(listForm.buyPrice) : null,
        deposit: Number(listForm.deposit)||0,
        min_days: Number(listForm.minDays)||1,
        total_qty: Number(listForm.totalQty)||1,
        available_qty: Number(listForm.totalQty)||1,
        price_hour: listForm.priceHour ? Number(listForm.priceHour) : null,
        price_half_day: listForm.priceHalfDay ? Number(listForm.priceHalfDay) : null,
        price_full_day: listForm.priceFullDay ? Number(listForm.priceFullDay) : null,
        capacity: listForm.capacity ? Number(listForm.capacity) : null,
        min_hours: Number(listForm.minHours)||1,
        days_available: listForm.daysAvailable,
        travel_radius: Number(listForm.travelRadius)||10,
        verified: false,
        listing_trust: 4.0,
        rating: 0,
        review_count: 0,
        available: true,
        // Photo — first photo is main, rest stored in photos array
        photo_url: photos[0] || null,
        photos: photos,
      };

      const { error } = await supabase.from('listings').insert([base]);
      if (error) { toast('❌ Error: ' + error.message); setSubmitting(false); return; }
      toast('🎉 Listing is live!');
      setView('browse');
    } catch(e) {
      toast("❌ " + e.message);
    }
    setSubmitting(false);
  };

  const inpStyle = (field) => ({ background:"#111318", border:`1px solid ${errors[field]?"#EF4444":"#252830"}`, borderRadius:9, padding:"10px 13px", color:"#F0EEE8", fontSize:13, width:"100%", outline:"none", fontFamily:"'DM Sans',sans-serif", boxSizing:"border-box" });
  const lbl = (text, field) => <span style={{ fontSize:11, fontWeight:700, color: errors[field]?"#EF4444":"#9CA3AF", letterSpacing:.7, textTransform:"uppercase", display:"block", marginBottom:5 }}>{text}{errors[field] ? ` — ${errors[field]}` : ""}</span>;

  return (
    <div style={{ padding:24, maxWidth:600, margin:"0 auto" }}>
      <div style={{ fontWeight:900, fontSize:22, marginBottom:4 }}>Create a Listing</div>
      <div style={{ color:"#6B7280", marginBottom:20, fontSize:13 }}>List an item, venue, or service for rent or sale</div>

      {/* Type selector */}
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        {[{v:"item",icon:"📦",l:"Item"},{v:"venue",icon:"🏟",l:"Venue"},{v:"service",icon:"👤",l:"Service"}].map(({v,icon,l}) => (
          <button key={v} onClick={() => setListForm(f => ({...f, listingType:v}))}
            style={{ flex:1, background: listForm.listingType===v ? typeStyle[v].color+"20" : "#111318", border:`2px solid ${listForm.listingType===v ? typeStyle[v].color : "#252830"}`, borderRadius:10, padding:"12px 8px", cursor:"pointer", color:"#F0EEE8", fontFamily:"'DM Sans',sans-serif" }}>
            <div style={{ fontSize:24, marginBottom:4 }}>{icon}</div>
            <div style={{ fontWeight:700, fontSize:13 }}>{l}</div>
          </button>
        ))}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

        {/* Emoji */}
        <div>
          <span style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, textTransform:"uppercase", display:"block", marginBottom:6 }}>Icon</span>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {emojis.map(e => (
              <button key={e} onClick={() => setListForm(f => ({...f, emoji:e}))}
                style={{ fontSize:20, background: listForm.emoji===e?"#F59E0B20":"#111318", border:`1px solid ${listForm.emoji===e?"#F59E0B":"#252830"}`, borderRadius:8, padding:"6px 10px", cursor:"pointer" }}>{e}</button>
            ))}
          </div>
        </div>

        {/* Photos */}
        <PhotoUploader photos={photos} setPhotos={setPhotos} toast={toast} />
        {photos.length === 0 && (
          <div style={{ fontSize:11, color:"#6B7280", marginTop:-8 }}>💡 Listings with photos get 3× more bookings</div>
        )}

        {/* Title */}
        <div>
          {lbl("Title *", "title")}
          <input style={inpStyle("title")}
            placeholder={lt==="item"?"e.g. Canon DSLR Camera":lt==="venue"?"e.g. Shree Marriage Hall":"e.g. Football Coaching"}
            value={listForm.title} onChange={e => { setListForm(f=>({...f,title:e.target.value})); setErrors(er=>({...er,title:null})); }} />
        </div>

        {/* Category */}
        <div>
          <span style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, textTransform:"uppercase", display:"block", marginBottom:6 }}>Category</span>
          <select style={{ ...inpStyle(""), cursor:"pointer" }} value={listForm.category} onChange={e => setListForm(f=>({...f,category:e.target.value}))}>
            {(lt==="item"?CATS_ITEM:lt==="venue"?CATS_VENUE:CATS_SERVICE).map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Item fields */}
        {lt==="item" && <>
          <div>
            <span style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, textTransform:"uppercase", display:"block", marginBottom:8 }}>Listing Type</span>
            <div style={{ display:"flex", gap:6 }}>
              {[{v:"rent",l:"🔑 Rent Only"},{v:"buy",l:"🛒 Sell Only"},{v:"both",l:"🔑🛒 Rent & Sell"}].map(({v,l}) => (
                <button key={v} onClick={() => setListForm(f=>({...f,subtype:v}))}
                  style={{ flex:1, background: listForm.subtype===v?"#F59E0B20":"#111318", border:`2px solid ${listForm.subtype===v?"#F59E0B":"#252830"}`, borderRadius:9, padding:"10px 6px", cursor:"pointer", color: listForm.subtype===v?"#F59E0B":"#9CA3AF", fontWeight:700, fontSize:11, fontFamily:"'DM Sans',sans-serif" }}>{l}</button>
              ))}
            </div>
          </div>
          {(listForm.subtype==="rent"||listForm.subtype==="both") && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                {lbl("Rent Price (₹/day) *", "rentPrice")}
                <input type="number" style={inpStyle("rentPrice")} value={listForm.rentPrice}
                  onChange={e=>{setListForm(f=>({...f,rentPrice:e.target.value}));setErrors(er=>({...er,rentPrice:null}));}} />
              </div>
              <Inp label="Min Rental Days" type="number" value={listForm.minDays} onChange={e=>setListForm(f=>({...f,minDays:e.target.value}))} />
            </div>
          )}
          {(listForm.subtype==="buy"||listForm.subtype==="both") && (
            <div>
              {lbl("Selling Price (₹) *", "buyPrice")}
              <input type="number" style={inpStyle("buyPrice")} value={listForm.buyPrice}
                onChange={e=>{setListForm(f=>({...f,buyPrice:e.target.value}));setErrors(er=>({...er,buyPrice:null}));}} />
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <Inp label="Total Quantity" type="number" value={listForm.totalQty} onChange={e=>setListForm(f=>({...f,totalQty:e.target.value}))} />
            {(listForm.subtype==="rent"||listForm.subtype==="both") && (
              <Inp label="Security Deposit (₹)" type="number" value={listForm.deposit} onChange={e=>setListForm(f=>({...f,deposit:e.target.value}))} />
            )}
          </div>
        </>}

        {/* Venue fields */}
        {lt==="venue" && <>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
            <div>
              {lbl("Price/Hour (₹) *", "priceHour")}
              <input type="number" style={inpStyle("priceHour")} value={listForm.priceHour}
                onChange={e=>{setListForm(f=>({...f,priceHour:e.target.value}));setErrors(er=>({...er,priceHour:null}));}} />
            </div>
            <Inp label="Half Day (₹)" type="number" value={listForm.priceHalfDay} onChange={e=>setListForm(f=>({...f,priceHalfDay:e.target.value}))} />
            <Inp label="Full Day (₹)" type="number" value={listForm.priceFullDay} onChange={e=>setListForm(f=>({...f,priceFullDay:e.target.value}))} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <Inp label="Capacity (persons)" type="number" value={listForm.capacity} onChange={e=>setListForm(f=>({...f,capacity:e.target.value}))} />
            <Inp label="Security Deposit (₹)" type="number" value={listForm.deposit} onChange={e=>setListForm(f=>({...f,deposit:e.target.value}))} />
          </div>
        </>}

        {/* Service fields */}
        {lt==="service" && <>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              {lbl("Rate (₹/hour) *", "priceHour")}
              <input type="number" style={inpStyle("priceHour")} value={listForm.priceHour}
                onChange={e=>{setListForm(f=>({...f,priceHour:e.target.value}));setErrors(er=>({...er,priceHour:null}));}} />
            </div>
            <Inp label="Min Hours/Booking" type="number" value={listForm.minHours} onChange={e=>setListForm(f=>({...f,minHours:e.target.value}))} />
          </div>
          <Inp label="Travel Radius (km)" type="number" value={listForm.travelRadius} onChange={e=>setListForm(f=>({...f,travelRadius:e.target.value}))} />
          <div>
            <span style={{ fontSize:11, fontWeight:700, color: errors.days?"#EF4444":"#9CA3AF", letterSpacing:.7, textTransform:"uppercase", display:"block", marginBottom:8 }}>
              Available Days *{errors.days ? ` — ${errors.days}` : ""}
            </span>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {DAYS.map(d => (
                <button key={d} onClick={() => { toggleDay(d); setErrors(er=>({...er,days:null})); }}
                  style={{ background: listForm.daysAvailable.includes(d)?"#10B98120":"#111318", border:`1px solid ${listForm.daysAvailable.includes(d)?"#10B981":"#252830"}`, borderRadius:7, padding:"6px 12px", color: listForm.daysAvailable.includes(d)?"#10B981":"#9CA3AF", cursor:"pointer", fontWeight:700, fontSize:12, fontFamily:"'DM Sans',sans-serif" }}>{d}</button>
              ))}
            </div>
          </div>
        </>}

        {/* Location */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div>
            {lbl("City *", "city")}
            <input style={inpStyle("city")} placeholder="e.g. Mumbai" value={listForm.city}
              onChange={e=>{setListForm(f=>({...f,city:e.target.value}));setErrors(er=>({...er,city:null}));}} />
          </div>
          <div>
            {lbl("Locality (public) *", "locality")}
            <input style={inpStyle("locality")} placeholder="e.g. Andheri West" value={listForm.locality}
              onChange={e=>{setListForm(f=>({...f,locality:e.target.value}));setErrors(er=>({...er,locality:null}));}} />
          </div>
        </div>

        <Inp label="Full Address (Private — revealed only to confirmed renters)"
          placeholder="House no, Street, Landmark, Pincode" value={listForm.fullAddress}
          onChange={e=>setListForm(f=>({...f,fullAddress:e.target.value}))} />

        {/* Contact phone */}
        <div>
          {lbl("Your Contact Number * (10 digits)", "phone")}
          <input style={inpStyle("phone")} placeholder="9876543210" maxLength={10} inputMode="numeric"
            value={listForm.phone}
            onChange={e=>{
              const v=e.target.value.replace(/\D/g,"").slice(0,10);
              setListForm(f=>({...f,phone:v}));
              setErrors(er=>({...er,phone:null}));
            }} />
          {listForm.phone.length>0&&listForm.phone.length<10&&<div style={{ color:"#EF4444", fontSize:11, marginTop:4 }}>⚠ {10-listForm.phone.length} more digits needed</div>}
          {listForm.phone.length===10&&<div style={{ color:"#10B981", fontSize:11, marginTop:4 }}>✓ Valid</div>}
        </div>

        <InfoBox color="#F59E0B" icon="🔒" label="FULL ADDRESS IS PRIVATE"
          sub="Only your locality is shown publicly. Full address & phone are revealed only to confirmed renters after payment." />

        {/* Description */}
        <div>
          {lbl("Description *", "description")}
          <textarea style={{ ...inpStyle("description"), resize:"none", height:90 }}
            placeholder="Describe your listing, condition, rules, what's included..." value={listForm.description}
            onChange={e=>{setListForm(f=>({...f,description:e.target.value}));setErrors(er=>({...er,description:null}));}} />
        </div>

        <Btn variant="primary" style={{ padding:"13px 18px", fontSize:15, opacity: submitting?0.7:1 }}
          disabled={submitting} onClick={submit}>
          {submitting ? "⏳ Publishing..." : "🚀 Publish Listing"}
        </Btn>
      </div>
    </div>
  );
};

export default ListForm;
