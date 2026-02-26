import { supabase } from './supabase.js';
import React, { useState, useRef, useEffect } from "react";

const DAYS         = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const CATS_ITEM    = ["Furniture","Tools","Electronics","Outdoor","Event","Vehicles","Other"];
const CATS_VENUE   = ["Marriage Hall","Party Hall","Playground","Sports Court","Conference Room","Farmhouse","Other"];
const CATS_SERVICE = ["Sports Coach","Music Teacher","Yoga Instructor","Personal Trainer","Tutor","Chef","Photographer","Other"];
const typeStyle    = {
  item:    { color:"#F59E0B", label:"Item",    bg:"#F59E0B15" },
  venue:   { color:"#6366F1", label:"Venue",   bg:"#6366F115" },
  service: { color:"#10B981", label:"Service", bg:"#10B98115" },
};

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD   || "";
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET  || "leasio_unsigned";

async function uploadToCloudinary(file) {
  if (!CLOUD_NAME) throw new Error("VITE_CLOUDINARY_CLOUD not set");
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method:"POST", body:fd });
  if (!res.ok) { let d=res.statusText; try{const j=await res.json();d=j?.error?.message||d;}catch(_){} throw new Error(d); }
  return (await res.json()).secure_url;
}

const F = "'DM Sans', sans-serif";
const inp = (err) => ({ background:"#111318", border:`1px solid ${err?"#EF4444":"#252830"}`, borderRadius:9, padding:"10px 13px", color:"#F0EEE8", fontSize:13, outline:"none", fontFamily:F, width:"100%", boxSizing:"border-box" });
const Lbl = ({ text, field, errors }) => <span style={{ fontSize:11, fontWeight:700, letterSpacing:.7, textTransform:"uppercase", display:"block", marginBottom:5, color:errors?.[field]?"#EF4444":"#9CA3AF" }}>{text}{errors?.[field]?` — ${errors[field]}`:""}</span>;
const Row = ({ children, cols="1fr 1fr" }) => <div style={{ display:"grid", gridTemplateColumns:cols, gap:12 }}>{children}</div>;
const SectionCard = ({ title, icon, children }) => (
  <div style={{ background:"#13151C", border:"1px solid #1E2130", borderRadius:14, padding:20, marginBottom:16 }}>
    {title && <div style={{ fontSize:12, fontWeight:800, color:"#9CA3AF", letterSpacing:.8, textTransform:"uppercase", marginBottom:14, display:"flex", alignItems:"center", gap:6 }}><span>{icon}</span>{title}</div>}
    <div style={{ display:"flex", flexDirection:"column", gap:13 }}>{children}</div>
  </div>
);

const PhotoUploader = ({ photos, setPhotos, toast }) => {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const handleFiles = async (files) => {
    if (!files.length) return;
    if (photos.length + files.length > 5) { toast("⚠ Max 5 photos"); return; }
    setUploading(true);
    try { const urls = await Promise.all(Array.from(files).map(f=>uploadToCloudinary(f))); setPhotos(p=>[...p,...urls]); toast("✅ "+urls.length+" photo(s) uploaded!"); }
    catch(e) { toast("❌ "+e.message); }
    setUploading(false);
  };
  return (
    <div>
      <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, textTransform:"uppercase", marginBottom:8 }}>
        Photos — {photos.length}/5 {photos.length===0&&<span style={{ color:"#F59E0B" }}>· 3× more bookings with photos</span>}
      </div>
      <div onDrop={e=>{e.preventDefault();handleFiles(e.dataTransfer.files);}} onDragOver={e=>e.preventDefault()}
        onClick={()=>!uploading&&fileRef.current?.click()}
        style={{ border:"2px dashed #252830", borderRadius:12, padding:"18px 14px", textAlign:"center", cursor:uploading?"wait":"pointer", background:"#0E1016", transition:"border-color .2s", marginBottom:photos.length?10:0 }}
        onMouseEnter={e=>{if(!uploading)e.currentTarget.style.borderColor="#F59E0B60";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#252830";}}>
        {uploading ? <div style={{ color:"#F59E0B", fontWeight:700, fontSize:13 }}>⏳ Uploading...</div>
          : <><div style={{ fontSize:24, marginBottom:4 }}>📸</div><div style={{ fontSize:12, color:"#9CA3AF" }}>Click or drag &amp; drop · JPG or PNG · max 10MB each</div></>}
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={e=>handleFiles(e.target.files)} />
      </div>
      {photos.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8 }}>
          {photos.map((url,i) => (
            <div key={i} style={{ position:"relative", aspectRatio:"1", borderRadius:9, overflow:"hidden", border:`2px solid ${i===0?"#F59E0B":"#252830"}` }}>
              <img src={url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              <button onClick={()=>setPhotos(p=>p.filter((_,j)=>j!==i))} style={{ position:"absolute", top:4, right:4, background:"#EF4444", border:"none", borderRadius:"50%", width:18, height:18, color:"#fff", fontSize:10, cursor:"pointer", fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:F }}>✕</button>
              {i===0&&<div style={{ position:"absolute", bottom:4, left:4, background:"#F59E0B", borderRadius:4, fontSize:8, fontWeight:800, padding:"2px 5px", color:"#0C0E14" }}>MAIN</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PreviewCard = ({ f, photos, lt }) => {
  const ts = typeStyle[lt];
  const price = lt==="item" ? (f.rentPrice?`₹${Number(f.rentPrice).toLocaleString("en-IN")}/day`:f.buyPrice?`₹${Number(f.buyPrice).toLocaleString("en-IN")}`:"—") : f.priceHour?`₹${Number(f.priceHour).toLocaleString("en-IN")}/hr`:"—";
  return (
    <div style={{ background:"#13151C", border:`1.5px solid ${ts.color}40`, borderRadius:14, overflow:"hidden" }}>
      <div style={{ height:160, background:"#0E1016", display:"flex", alignItems:"center", justifyContent:"center", fontSize:56, position:"relative", overflow:"hidden" }}>
        {photos[0] ? <img src={photos[0]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : (f.emoji||"📦")}
        {photos[0]&&<div style={{ position:"absolute", top:8, right:8, background:"rgba(0,0,0,.6)", fontSize:20, padding:"3px 7px", borderRadius:7 }}>{f.emoji}</div>}
      </div>
      <div style={{ padding:14 }}>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
          <span style={{ fontSize:10, fontWeight:800, color:ts.color, background:ts.bg, borderRadius:6, padding:"2px 8px", letterSpacing:.5 }}>{ts.label.toUpperCase()}</span>
          {f.category&&<span style={{ fontSize:10, fontWeight:700, color:"#6B7280", background:"#1C1F27", borderRadius:6, padding:"2px 8px" }}>{f.category}</span>}
        </div>
        <div style={{ fontWeight:800, fontSize:14, marginBottom:4, lineHeight:1.3 }}>{f.title||<span style={{ color:"#374151" }}>Your listing title…</span>}</div>
        <div style={{ fontSize:12, color:"#9CA3AF", marginBottom:10, lineHeight:1.5, minHeight:36 }}>{f.description?f.description.slice(0,80)+(f.description.length>80?"…":""):<span style={{ color:"#252830" }}>Description will appear here…</span>}</div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontWeight:800, fontSize:16, color:ts.color }}>{price}</div>
          <div style={{ fontSize:11, color:"#6B7280" }}>{f.locality||"Locality"}{f.city?`, ${f.city}`:""}</div>
        </div>
        {f.ownerName&&<div style={{ marginTop:8, fontSize:11, color:"#6B7280", borderTop:"1px solid #1E2130", paddingTop:8 }}>👤 {f.ownerName}</div>}
      </div>
    </div>
  );
};

const ListForm = ({ setListings, setView, toast }) => {
  const [listForm, setListForm] = useState({ listingType:"item", title:"", category:"Electronics", subtype:"rent", ownerType:"individual", emoji:"📦", locality:"", description:"", rentPrice:"", priceHour:"", priceHalfDay:"", priceFullDay:"", deposit:"", buyPrice:"", minDays:1, minHours:1, totalQty:1, daysAvailable:[], travelRadius:10, capacity:"", city:"Bengaluru", fullAddress:"", phone:"", ownerName:"" });
  const [photos,     setPhotos]     = useState([]);
  const [errors,     setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);

  const lt  = listForm.listingType;
  const ts  = typeStyle[lt];
  const set = (k) => (e) => setListForm(f=>({...f,[k]:e.target.value}));
  const clrErr = (k) => setErrors(er=>({...er,[k]:null}));

  const emojiMap = { item:["📦","🪑","🔧","📷","🔊","⛺","🚗","💡","🎸","🏍","🔑","📺","🛋","🧰","⚡","🎮","👜","📚"], venue:["💒","🎉","🏟","⚽","🏸","🎭","🌿","🏡","🏢","🍽","🎪","🎬"], service:["👤","⚽","🧘","📸","🎵","🍳","📚","🏋","🎨","🎤","🖥","✂"] };

  useEffect(() => {
    supabase.auth.getUser().then(({ data:{ user } }) => {
      if (!user) return;
      supabase.from("user_profiles").select("full_name").eq("id", user.id).single().then(({ data }) => { if (data?.full_name) setListForm(f=>({...f,ownerName:data.full_name})); });
    });
  }, []);

  useEffect(() => {
    const defaults = { item:"Electronics", venue:"Marriage Hall", service:"Sports Coach" };
    const emojiDefaults = { item:"📦", venue:"💒", service:"👤" };
    setListForm(f=>({...f, category:defaults[lt], emoji:emojiDefaults[lt], daysAvailable:[] }));
  }, [lt]);

  const toggleDay = (d) => { clrErr("days"); setListForm(f=>({...f, daysAvailable:f.daysAvailable.includes(d)?f.daysAvailable.filter(x=>x!==d):[...f.daysAvailable,d]})); };

  const validate = () => {
    const e = {};
    if (!listForm.title.trim()) e.title="Required";
    if (!listForm.ownerName.trim()) e.ownerName="Required";
    if (!listForm.locality.trim()) e.locality="Required";
    if (!listForm.city.trim()) e.city="Required";
    if (!listForm.phone||listForm.phone.replace(/\D/g,"").length!==10) e.phone="10-digit number required";
    if (lt==="item"&&(listForm.subtype==="rent"||listForm.subtype==="both")&&!listForm.rentPrice) e.rentPrice="Required";
    if (lt==="item"&&(listForm.subtype==="buy"||listForm.subtype==="both")&&!listForm.buyPrice) e.buyPrice="Required";
    if ((lt==="venue"||lt==="service")&&!listForm.priceHour) e.priceHour="Required";
    if (lt==="service"&&listForm.daysAvailable.length===0) e.days="Select at least one day";
    if (!listForm.description.trim()) e.description="Required";
    setErrors(e); return Object.keys(e).length===0;
  };

  const submit = async () => {
    if (!validate()) { toast("⚠ Please fix the errors below"); return; }
    setSubmitting(true);
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      const base = { owner_id:user.id, owner_name:listForm.ownerName.trim(), listing_type:lt, subtype:listForm.subtype, category:listForm.category, title:listForm.title, description:listForm.description, emoji:listForm.emoji, locality:listForm.locality, city:listForm.city, full_address:listForm.fullAddress, contact_phone:listForm.phone.replace(/\D/g,""), rent_price:listForm.rentPrice?Number(listForm.rentPrice):null, buy_price:listForm.buyPrice?Number(listForm.buyPrice):null, deposit:Number(listForm.deposit)||0, min_days:Number(listForm.minDays)||1, total_qty:Number(listForm.totalQty)||1, available_qty:Number(listForm.totalQty)||1, price_hour:listForm.priceHour?Number(listForm.priceHour):null, price_half_day:listForm.priceHalfDay?Number(listForm.priceHalfDay):null, price_full_day:listForm.priceFullDay?Number(listForm.priceFullDay):null, capacity:listForm.capacity?Number(listForm.capacity):null, min_hours:Number(listForm.minHours)||1, days_available:listForm.daysAvailable, travel_radius:Number(listForm.travelRadius)||10, verified:false, listing_trust:4.0, rating:0, review_count:0, available:true, photo_url:photos[0]||null, photos };
      const { error } = await supabase.from('listings').insert([base]);
      if (error) { toast('❌ '+error.message); setSubmitting(false); return; }
      await supabase.from("user_profiles").update({ full_name:listForm.ownerName.trim() }).eq("id",user.id);
      toast('🎉 Listing is live!');
      setView('browse');
    } catch(e) { toast("❌ "+e.message); }
    setSubmitting(false);
  };

  return (
    <div style={{ fontFamily:F, background:"#0C0E14", minHeight:"100vh", paddingBottom:60 }}>

      {/* Header */}
      <div style={{ background:"#13151C", borderBottom:"1px solid #1E2130", padding:"18px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontWeight:900, fontSize:22, color:"#F0EEE8" }}>Create a Listing</div>
          <div style={{ color:"#6B7280", fontSize:13, marginTop:2 }}>List an item, venue, or service for rent or sale</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {[{v:"item",icon:"📦",l:"Item"},{v:"venue",icon:"🏟",l:"Venue"},{v:"service",icon:"👤",l:"Service"}].map(({v,icon,l}) => (
            <button key={v} onClick={()=>setListForm(f=>({...f,listingType:v}))}
              style={{ background:lt===v?typeStyle[v].bg:"#111318", border:`2px solid ${lt===v?typeStyle[v].color:"#252830"}`, borderRadius:10, padding:"10px 20px", cursor:"pointer", color:lt===v?typeStyle[v].color:"#6B7280", fontFamily:F, fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:6, transition:"all .15s" }}>
              <span style={{ fontSize:18 }}>{icon}</span>{l}
            </button>
          ))}
        </div>
      </div>

      {/* Two-column grid */}
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"24px 24px", display:"grid", gridTemplateColumns:"minmax(0,1fr) 320px", gap:24, alignItems:"start" }}>

        {/* LEFT: form */}
        <div>

          {/* Listing Details */}
          <SectionCard title="Listing Details" icon="✏️">
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, textTransform:"uppercase", marginBottom:8 }}>Icon</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {emojiMap[lt].map(e=>(
                  <button key={e} onClick={()=>setListForm(f=>({...f,emoji:e}))}
                    style={{ fontSize:20, background:listForm.emoji===e?"#F59E0B20":"#111318", border:`1px solid ${listForm.emoji===e?"#F59E0B":"#252830"}`, borderRadius:8, padding:"6px 10px", cursor:"pointer" }}>{e}</button>
                ))}
              </div>
            </div>
            <Row>
              <div>
                <Lbl text="Title *" field="title" errors={errors} />
                <input style={inp(errors.title)} value={listForm.title}
                  placeholder={lt==="item"?"e.g. Canon DSLR Camera":lt==="venue"?"e.g. Shree Marriage Hall":"e.g. Football Coaching"}
                  onChange={e=>{set("title")(e);clrErr("title");}} />
              </div>
              <div>
                <Lbl text="Your Name *" field="ownerName" errors={errors} />
                <input style={inp(errors.ownerName)} value={listForm.ownerName} placeholder="Name shown to renters"
                  onChange={e=>{set("ownerName")(e);clrErr("ownerName");}} />
              </div>
            </Row>
            <Row>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, textTransform:"uppercase", marginBottom:6 }}>Category</div>
                <select style={{ ...inp(false), cursor:"pointer" }} value={listForm.category} onChange={set("category")}>
                  {(lt==="item"?CATS_ITEM:lt==="venue"?CATS_VENUE:CATS_SERVICE).map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, textTransform:"uppercase", marginBottom:6 }}>Owner Type</div>
                <select style={{ ...inp(false), cursor:"pointer" }} value={listForm.ownerType} onChange={set("ownerType")}>
                  <option value="individual">Individual</option>
                  <option value="commercial">Business / Shop</option>
                </select>
              </div>
            </Row>
            <div>
              <Lbl text="Description *" field="description" errors={errors} />
              <textarea style={{ ...inp(errors.description), resize:"vertical", minHeight:90 }}
                placeholder="Condition, what's included, rules, availability notes…"
                value={listForm.description} onChange={e=>{set("description")(e);clrErr("description");}} />
            </div>
          </SectionCard>

          {/* Pricing */}
          <SectionCard title="Pricing & Details" icon="💰">
            {lt==="item" && <>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"#9CA3AF", letterSpacing:.7, textTransform:"uppercase", marginBottom:7 }}>Listing Type</div>
                <div style={{ display:"flex", gap:6 }}>
                  {[{v:"rent",l:"🔑 Rent Only"},{v:"buy",l:"🛒 Sell Only"},{v:"both",l:"🔑🛒 Rent & Sell"}].map(({v,l})=>(
                    <button key={v} onClick={()=>setListForm(f=>({...f,subtype:v}))}
                      style={{ flex:1, background:listForm.subtype===v?ts.color+"20":"#111318", border:`2px solid ${listForm.subtype===v?ts.color:"#252830"}`, borderRadius:9, padding:"9px 6px", cursor:"pointer", color:listForm.subtype===v?ts.color:"#9CA3AF", fontWeight:700, fontSize:11, fontFamily:F }}>{l}</button>
                  ))}
                </div>
              </div>
              <Row cols="1fr 1fr 1fr">
                {(listForm.subtype==="rent"||listForm.subtype==="both")&&<div><Lbl text="Rent / Day (₹) *" field="rentPrice" errors={errors} /><input type="number" style={inp(errors.rentPrice)} value={listForm.rentPrice} onChange={e=>{set("rentPrice")(e);clrErr("rentPrice");}} placeholder="500" /></div>}
                {(listForm.subtype==="buy"||listForm.subtype==="both")&&<div><Lbl text="Sell Price (₹) *" field="buyPrice" errors={errors} /><input type="number" style={inp(errors.buyPrice)} value={listForm.buyPrice} onChange={e=>{set("buyPrice")(e);clrErr("buyPrice");}} placeholder="15000" /></div>}
                {(listForm.subtype==="rent"||listForm.subtype==="both")&&<div><Lbl text="Security Deposit (₹)" field="" errors={{}} /><input type="number" style={inp(false)} value={listForm.deposit} onChange={set("deposit")} placeholder="2000" /></div>}
              </Row>
              <Row>
                <div><Lbl text="Total Quantity" field="" errors={{}} /><input type="number" style={inp(false)} value={listForm.totalQty} onChange={set("totalQty")} min={1} /></div>
                <div><Lbl text="Min Rental Days" field="" errors={{}} /><input type="number" style={inp(false)} value={listForm.minDays} onChange={set("minDays")} min={1} /></div>
              </Row>
            </>}

            {lt==="venue" && <>
              <Row cols="1fr 1fr 1fr">
                <div><Lbl text="Price / Hour (₹) *" field="priceHour" errors={errors} /><input type="number" style={inp(errors.priceHour)} value={listForm.priceHour} onChange={e=>{set("priceHour")(e);clrErr("priceHour");}} placeholder="2000" /></div>
                <div><Lbl text="Half Day (₹)" field="" errors={{}} /><input type="number" style={inp(false)} value={listForm.priceHalfDay} onChange={set("priceHalfDay")} placeholder="7000" /></div>
                <div><Lbl text="Full Day (₹)" field="" errors={{}} /><input type="number" style={inp(false)} value={listForm.priceFullDay} onChange={set("priceFullDay")} placeholder="12000" /></div>
              </Row>
              <Row>
                <div><Lbl text="Capacity (persons)" field="" errors={{}} /><input type="number" style={inp(false)} value={listForm.capacity} onChange={set("capacity")} placeholder="200" /></div>
                <div><Lbl text="Security Deposit (₹)" field="" errors={{}} /><input type="number" style={inp(false)} value={listForm.deposit} onChange={set("deposit")} placeholder="10000" /></div>
              </Row>
            </>}

            {lt==="service" && <>
              <Row>
                <div><Lbl text="Rate / Hour (₹) *" field="priceHour" errors={errors} /><input type="number" style={inp(errors.priceHour)} value={listForm.priceHour} onChange={e=>{set("priceHour")(e);clrErr("priceHour");}} placeholder="800" /></div>
                <div><Lbl text="Min Hours / Booking" field="" errors={{}} /><input type="number" style={inp(false)} value={listForm.minHours} onChange={set("minHours")} min={1} /></div>
              </Row>
              <div><Lbl text="Travel Radius (km)" field="" errors={{}} /><input type="number" style={inp(false)} value={listForm.travelRadius} onChange={set("travelRadius")} placeholder="10" /></div>
              <div>
                <span style={{ fontSize:11, fontWeight:700, color:errors.days?"#EF4444":"#9CA3AF", letterSpacing:.7, textTransform:"uppercase", display:"block", marginBottom:8 }}>Available Days *{errors.days?` — ${errors.days}`:""}</span>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {DAYS.map(d=><button key={d} onClick={()=>toggleDay(d)} style={{ background:listForm.daysAvailable.includes(d)?"#10B98120":"#111318", border:`1px solid ${listForm.daysAvailable.includes(d)?"#10B981":"#252830"}`, borderRadius:7, padding:"7px 13px", color:listForm.daysAvailable.includes(d)?"#10B981":"#9CA3AF", cursor:"pointer", fontWeight:700, fontSize:12, fontFamily:F }}>{d}</button>)}
                </div>
              </div>
            </>}
          </SectionCard>

          {/* Location & Contact */}
          <SectionCard title="Location & Contact" icon="📍">
            <Row>
              <div><Lbl text="City *" field="city" errors={errors} /><input style={inp(errors.city)} value={listForm.city} placeholder="e.g. Bengaluru" onChange={e=>{set("city")(e);clrErr("city");}} /></div>
              <div><Lbl text="Locality (public) *" field="locality" errors={errors} /><input style={inp(errors.locality)} value={listForm.locality} placeholder="e.g. Koramangala" onChange={e=>{set("locality")(e);clrErr("locality");}} /></div>
            </Row>
            <div><Lbl text="Full Address (private — after payment only)" field="" errors={{}} /><input style={inp(false)} value={listForm.fullAddress} placeholder="House no, Street, Landmark, Pincode" onChange={set("fullAddress")} /></div>
            <div>
              <Lbl text="Contact Number * (10 digits)" field="phone" errors={errors} />
              <input style={inp(errors.phone)} value={listForm.phone} placeholder="9876543210" maxLength={10} inputMode="numeric"
                onChange={e=>{const v=e.target.value.replace(/\D/g,"").slice(0,10);setListForm(f=>({...f,phone:v}));clrErr("phone");}} />
              {listForm.phone.length>0&&listForm.phone.length<10&&<div style={{ color:"#EF4444", fontSize:11, marginTop:4 }}>⚠ {10-listForm.phone.length} more digits needed</div>}
              {listForm.phone.length===10&&<div style={{ color:"#10B981", fontSize:11, marginTop:4 }}>✓ Valid</div>}
            </div>
            <div style={{ background:"#F59E0B0A", border:"1px solid #F59E0B25", borderRadius:10, padding:"10px 14px", fontSize:12, color:"#9CA3AF", lineHeight:1.6 }}>
              🔒 <strong style={{ color:"#F0EEE8" }}>Address and phone stay private.</strong> Only locality is shown publicly.
            </div>
          </SectionCard>

          {/* Photos */}
          <SectionCard title="Photos" icon="📸">
            <PhotoUploader photos={photos} setPhotos={setPhotos} toast={toast} />
          </SectionCard>

          {/* Submit */}
          <button onClick={submit} disabled={submitting}
            style={{ width:"100%", background:submitting?"#D97706":"#F59E0B", color:"#0C0E14", border:"none", borderRadius:12, padding:"16px 24px", cursor:submitting?"wait":"pointer", fontWeight:900, fontSize:16, fontFamily:F, opacity:submitting?0.8:1, transition:"all .2s" }}>
            {submitting ? "⏳ Publishing…" : "🚀 Publish Listing"}
          </button>
        </div>

        {/* RIGHT: sticky preview */}
        <div className="leasio-preview-col">
          <div style={{ position:"sticky", top:24 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#6B7280", letterSpacing:.8, textTransform:"uppercase", marginBottom:10 }}>Live Preview</div>
            <PreviewCard f={listForm} photos={photos} lt={lt} />
            <div style={{ marginTop:16, background:"#13151C", border:"1px solid #1E2130", borderRadius:14, padding:16 }}>
              <div style={{ fontSize:11, fontWeight:800, color:"#F59E0B", letterSpacing:.7, marginBottom:10 }}>💡 TIPS FOR MORE BOOKINGS</div>
              {[["📸","Add 3+ photos — listings with photos get 3× more inquiries"],["✍️","Detailed description builds trust — mention condition and what's included"],["💰","Price competitively — check similar listings first"],["📍","Use the exact locality name people search for"]].map(([icon,tip])=>(
                <div key={tip} style={{ display:"flex", gap:8, marginBottom:8, fontSize:12, color:"#9CA3AF", lineHeight:1.5 }}><span style={{ flexShrink:0 }}>{icon}</span><span>{tip}</span></div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Responsive: hide preview column and collapse grid on mobile */}
      <style>{`
        @media (max-width: 860px) {
          .leasio-preview-col { display: none !important; }
        }
        @media (max-width: 860px) {
          [style*="minmax(0,1fr) 320px"] { grid-template-columns: 1fr !important; }
        }
      `}</style>

    </div>
  );
};

export default ListForm;
