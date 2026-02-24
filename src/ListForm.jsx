const ListForm = ({ setListings, setView, toast }) => {
    const [listForm, setListForm] = useState({
  listingType: "item", title: "", category: "Electronics", subtype: "rent",
  ownerType: "individual", emoji: "📦", locality: "", description: "",
  rentPrice: "", priceHour: "", priceHalfDay: "", priceFullDay: "",
  deposit: "", buyPrice: "", minDays: 1, minHours: 1,
  totalQty: 1, daysAvailable: [], travelRadius: 10, capacity: ""
});
    const lt = listForm.listingType;
    const emojis = ["📦","🪑","🔧","📷","🔊","⛺","💒","⚽","🎉","🏟","🧘","📸","🚗","💡","🎸"];
    const toggleDay = d => setListForm(f => ({ ...f, daysAvailable: f.daysAvailable.includes(d) ? f.daysAvailable.filter(x => x !== d) : [...f.daysAvailable, d] }));
    const submit = () => {
      const base = { ...listForm, id: Date.now(), ownerTrust: 4.0, rating: 0, reviews: 0, verified: false, listingTrust: 4.0, available: true, availableQty: Number(listForm.totalQty) || 1, bookedDates: [], bookedSlots: {} };
      if (lt === "item") { base.rentPrice = Number(listForm.rentPrice); base.deposit = Number(listForm.deposit); base.buyPrice = listForm.buyPrice ? Number(listForm.buyPrice) : null; }
      if (lt === "venue") { base.priceHour = Number(listForm.priceHour); base.priceHalfDay = Number(listForm.priceHalfDay); base.priceFullDay = Number(listForm.priceFullDay); base.deposit = Number(listForm.deposit); base.capacity = Number(listForm.capacity); }
      if (lt === "service") { base.priceHour = Number(listForm.priceHour); base.minHours = Number(listForm.minHours); base.travelRadius = Number(listForm.travelRadius); base.deposit = 0; }
      setListings(ls => [...ls, base]);
      toast("🎉 Listing live!");
      setView("browse");
    };

    return (
      <div style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
        <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 4 }}>Create a Listing</div>
        <div style={{ color: "#6B7280", marginBottom: 20, fontSize: 13 }}>List an item, venue, or service</div>

        {/* Listing type selector */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[{ v: "item", icon: "📦", l: "Item" }, { v: "venue", icon: "🏟", l: "Venue" }, { v: "service", icon: "👤", l: "Service" }].map(({ v, icon, l }) => (
            <button key={v} onClick={() => setListForm(f => ({ ...f, listingType: v }))}
              style={{ flex: 1, background: listForm.listingType === v ? typeStyle[v].color + "20" : "#111318", border: `2px solid ${listForm.listingType === v ? typeStyle[v].color : "#252830"}`, borderRadius: 10, padding: "12px 8px", cursor: "pointer", color: "#F0EEE8", fontFamily: "'DM Sans',sans-serif" }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{l}</div>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Emoji */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: .7, marginBottom: 6, textTransform: "uppercase" }}>Icon</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {emojis.map(e => <button key={e} onClick={() => setListForm(f => ({ ...f, emoji: e }))} style={{ fontSize: 20, background: listForm.emoji === e ? "#F59E0B20" : "#111318", border: `1px solid ${listForm.emoji === e ? "#F59E0B" : "#252830"}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}>{e}</button>)}
            </div>
          </div>

          <Inp label="Title" placeholder={lt === "item" ? "e.g. Canon DSLR Camera" : lt === "venue" ? "e.g. Shree Marriage Hall" : "e.g. Football Coaching — AIFF Certified"} value={listForm.title} onChange={e => setListForm(f => ({ ...f, title: e.target.value }))} />

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: .7, marginBottom: 6, textTransform: "uppercase" }}>Category</div>
            <select style={{ background: "#111318", border: "1px solid #252830", borderRadius: 9, padding: "10px 13px", color: "#F0EEE8", fontSize: 13, width: "100%", fontFamily: "'DM Sans',sans-serif" }} value={listForm.category} onChange={e => setListForm(f => ({ ...f, category: e.target.value }))}>
              {(lt === "item" ? CATS_ITEM : lt === "venue" ? CATS_VENUE : CATS_SERVICE).map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {lt === "item" && <>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: .7, marginBottom: 8, textTransform: "uppercase" }}>What can users do with this listing?</div>
              <div style={{ display: "flex", gap: 6 }}>
                {[{v:"rent",l:"🔑 Rent Only"},{v:"buy",l:"🛒 Sell Only"},{v:"both",l:"🔑🛒 Rent & Sell"}].map(({v,l}) => (
                  <button key={v} onClick={() => setListForm(f => ({...f, subtype: v}))}
                    style={{ flex:1, background: listForm.subtype===v ? "#F59E0B20" : "#111318", border:`2px solid ${listForm.subtype===v ? "#F59E0B" : "#252830"}`, borderRadius:9, padding:"10px 6px", cursor:"pointer", color: listForm.subtype===v ? "#F59E0B" : "#9CA3AF", fontWeight:700, fontSize:11, fontFamily:"'DM Sans',sans-serif" }}>{l}</button>
                ))}
              </div>
            </div>
            {(listForm.subtype === "rent" || listForm.subtype === "both") && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Inp label="Rent Price (₹/day)" type="number" value={listForm.rentPrice} onChange={e => setListForm(f => ({ ...f, rentPrice: e.target.value }))} />
                <Inp label="Min Rental Days" type="number" value={listForm.minDays} onChange={e => setListForm(f => ({ ...f, minDays: e.target.value }))} />
              </div>
            )}
            {(listForm.subtype === "buy" || listForm.subtype === "both") && (
              <Inp label="Selling Price (₹)" type="number" value={listForm.buyPrice} onChange={e => setListForm(f => ({ ...f, buyPrice: e.target.value }))} />
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Inp label="Total Quantity Available" type="number" value={listForm.totalQty} onChange={e => setListForm(f => ({ ...f, totalQty: e.target.value }))} />
              {(listForm.subtype === "rent" || listForm.subtype === "both") && (
                <Inp label="Security Deposit (₹)" type="number" value={listForm.deposit} onChange={e => setListForm(f => ({ ...f, deposit: e.target.value }))} />
              )}
            </div>
          </>}

          {lt === "venue" && <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <Inp label="Price/Hour (₹)" type="number" value={listForm.priceHour} onChange={e => setListForm(f => ({ ...f, priceHour: e.target.value }))} />
              <Inp label="Half Day (₹)" type="number" value={listForm.priceHalfDay} onChange={e => setListForm(f => ({ ...f, priceHalfDay: e.target.value }))} />
              <Inp label="Full Day (₹)" type="number" value={listForm.priceFullDay} onChange={e => setListForm(f => ({ ...f, priceFullDay: e.target.value }))} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Inp label="Capacity (persons)" type="number" value={listForm.capacity} onChange={e => setListForm(f => ({ ...f, capacity: e.target.value }))} />
              <Inp label="Security Deposit (₹)" type="number" value={listForm.deposit} onChange={e => setListForm(f => ({ ...f, deposit: e.target.value }))} />
            </div>
          </>}

          {lt === "service" && <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Inp label="Rate (₹/hour)" type="number" value={listForm.priceHour} onChange={e => setListForm(f => ({ ...f, priceHour: e.target.value }))} />
              <Inp label="Min Hours/Booking" type="number" value={listForm.minHours} onChange={e => setListForm(f => ({ ...f, minHours: e.target.value }))} />
            </div>
            <Inp label="Travel Radius (km)" type="number" value={listForm.travelRadius} onChange={e => setListForm(f => ({ ...f, travelRadius: e.target.value }))} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: .7, marginBottom: 8, textTransform: "uppercase" }}>Available Days</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {DAYS.map(d => <button key={d} onClick={() => toggleDay(d)} style={{ background: listForm.daysAvailable.includes(d) ? "#10B98120" : "#111318", border: `1px solid ${listForm.daysAvailable.includes(d) ? "#10B981" : "#252830"}`, borderRadius: 7, padding: "6px 12px", color: listForm.daysAvailable.includes(d) ? "#10B981" : "#9CA3AF", cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "'DM Sans',sans-serif" }}>{d}</button>)}
              </div>
            </div>
          </>}

          <Inp label="Locality (shown publicly)" placeholder="e.g. Koramangala" value={listForm.locality} onChange={e => setListForm(f => ({ ...f, locality: e.target.value }))} />
          <InfoBox color="#F59E0B" icon="🔒" label="FULL ADDRESS IS PRIVATE" sub="Only your locality is shown publicly. Full address is revealed only to confirmed renters who have paid the 20% pre-booking deposit." />
          <Textarea label="Description" value={listForm.description} onChange={e => setListForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe your listing, condition, rules, etc." />
          <Btn variant="primary" style={{ padding: "12px 18px" }} disabled={!listForm.title || !listForm.locality} onClick={submit}>🚀 Publish Listing</Btn>
        </div>
      </div>
    );
  };
  export default ListForm;