// ─────────────────────────────────────────────────────────────────────────────
//  src/supabase.js  — drop this file into your project root
//  Install first:  npm install @supabase/supabase-js
// ─────────────────────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';

// Get these from: Supabase Dashboard → Project Settings → API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const CLOUDINARY_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD;


export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// ─────────────────────────────────────────────────────────────────────────────
//  AUTH HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Send OTP to phone number  (Supabase uses E.164 format: +919876543210)
export async function sendOtp(phone) {
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) throw error;
}

// Verify OTP entered by user
export async function verifyOtp(phone, token) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });
  if (error) throw error;
  return data.user;
}

// Get currently logged-in user
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Sign out
export async function signOut() {
  await supabase.auth.signOut();
}


// ─────────────────────────────────────────────────────────────────────────────
//  LISTINGS
// ─────────────────────────────────────────────────────────────────────────────

// Fetch all available listings (with owner profile joined)
export async function fetchListings({ city, listingType, category, search } = {}) {
  let query = supabase
    .from('listings')
    .select(`
      *,
      profiles:owner_id (
        id, full_name, owner_type, trust_score, aadhaar_verified
      )
    `)
    .eq('available', true)
    .order('created_at', { ascending: false });

  if (city)        query = query.eq('city', city);
  if (listingType) query = query.eq('listing_type', listingType);
  if (category)    query = query.eq('category', category);
  if (search)      query = query.ilike('title', `%${search}%`);

  const { data, error } = await query;
  if (error) throw error;

  // Map DB snake_case → app camelCase (matches your existing SEED shape)
  return data.map(mapListing);
}

// Fetch single listing by id
export async function fetchListing(id) {
  const { data, error } = await supabase
    .from('listings')
    .select('*, profiles:owner_id(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return mapListing(data);
}

// Create a new listing
export async function createListing(listing, ownerId) {
  const { data, error } = await supabase
    .from('listings')
    .insert([{
      owner_id:       ownerId,
      listing_type:   listing.listingType,
      subtype:        listing.subtype,
      category:       listing.category,
      title:          listing.title,
      description:    listing.description,
      emoji:          listing.emoji,
      locality:       listing.locality,
      city:           listing.city || 'Bengaluru',
      full_address:   listing.fullAddress,   // stored but hidden from public
      rent_price:     listing.rentPrice   || null,
      buy_price:      listing.buyPrice    || null,
      deposit:        listing.deposit     || 0,
      min_days:       listing.minDays     || 1,
      total_qty:      listing.totalQty    || 1,
      available_qty:  listing.totalQty    || 1,
      price_hour:     listing.priceHour   || null,
      price_half_day: listing.priceHalfDay|| null,
      price_full_day: listing.priceFullDay|| null,
      capacity:       listing.capacity    || null,
      amenities:      listing.amenities   || [],
      price_per_hour: listing.priceHour   || null,
      min_hours:      listing.minHours    || 1,
      days_available: listing.daysAvailable|| [],
      travel_radius:  listing.travelRadius || 10,
    }])
    .select()
    .single();
  if (error) throw error;
  return mapListing(data);
}

// Decrement available qty when booked
export async function decrementQty(listingId, qty = 1) {
  const { error } = await supabase.rpc('decrement_qty', {
    listing_id: listingId,
    amount: qty,
  });
  if (error) throw error;
}

// Restore qty on rental end
export async function restoreQty(listingId, qty = 1) {
  const { error } = await supabase.rpc('restore_qty', {
    listing_id: listingId,
    amount: qty,
  });
  if (error) throw error;
}


// ─────────────────────────────────────────────────────────────────────────────
//  BOOKED SLOTS (venues)
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchBookedSlots(listingId) {
  const { data, error } = await supabase
    .from('booked_slots')
    .select('date, slot')
    .eq('listing_id', listingId);
  if (error) throw error;

  // Return as { "2026-03-01": ["Full Day"], ... } — same shape your app uses
  return data.reduce((acc, row) => {
    if (!acc[row.date]) acc[row.date] = [];
    acc[row.date].push(row.slot);
    return acc;
  }, {});
}

export async function bookSlot(listingId, date, slot, bookingId) {
  const { error } = await supabase
    .from('booked_slots')
    .insert([{ listing_id: listingId, date, slot, booking_id: bookingId }]);
  if (error) throw error;
}


// ─────────────────────────────────────────────────────────────────────────────
//  BOOKINGS
// ─────────────────────────────────────────────────────────────────────────────

export async function createBooking(booking, renterId) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const { data, error } = await supabase
    .from('bookings')
    .insert([{
      listing_id:       booking.listing.id,
      renter_id:        renterId,
      booking_type:     booking.listing.listingType === 'item' ? 'rental'
                      : booking.listing.listingType,
      status:           'pending_handover',
      start_date:       booking.date || null,
      end_date:         booking.endDate || null,
      slot:             booking.slot   || null,
      hours:            booking.hours  || null,
      qty:              booking.qty    || 1,
      delivery_mode:    booking.mode   || 'self',
      delivery_slot:    booking.deliverySlot || null,
      total_rent:       booking.total,
      platform_fee:     booking.fee,
      deposit_amount:   booking.dep,
      pre_deposit_paid: booking.preDep || 0,
      renter_name:      booking.renterName,
      renter_phone:     booking.renterPhone,
      renter_address:   booking.renterAddress,
      handover_otp:     otp,
      deposit_status:   'held',
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchMyBookings(renterId) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      listings:listing_id (
        id, title, emoji, listing_type, locality, city, full_address,
        owner_id, rent_price, buy_price, price_hour, deposit,
        profiles:owner_id (full_name, phone)
      )
    `)
    .eq('renter_id', renterId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  return data.map(b => ({
    id: b.id,
    listing: b.listings ? {
      id: b.listings.id,
      title: b.listings.title,
      emoji: b.listings.emoji,
      listingType: b.listings.listing_type,
      locality: b.listings.locality,
      city: b.listings.city,
      full_address: b.listings.full_address,
      owner: b.listings.profiles?.full_name || 'Owner',
      ownerPhone: b.listings.profiles?.phone || '+91 98765 43210',
    } : null,
    total: b.total_rent,
    fee: b.platform_fee,
    dep: b.deposit_amount,
    mode: b.delivery_mode,
    slot: b.slot,
    hours: b.hours,
    date: b.start_date,
    status: b.status,
    renterName: b.renter_name,
    renterPhone: b.renter_phone,
    renterAddress: b.renter_address,
    ownerAddress: b.listings?.full_address || b.listings?.locality + ', ' + (b.listings?.city || 'Bengaluru'),
    ownerPhone: b.listings?.profiles?.phone || '+91 98765 43210',
    type: b.booking_type === 'purchase' ? 'purchase' : 'rental',
  }));
}

// Confirm handover (renter enters OTP)
export async function confirmHandover(bookingId, otp) {
  // First check OTP matches
  const { data: booking } = await supabase
    .from('bookings')
    .select('handover_otp')
    .eq('id', bookingId)
    .single();

  if (booking.handover_otp !== otp) throw new Error('Invalid OTP');

  const { error } = await supabase
    .from('bookings')
    .update({
      handover_done: true,
      handover_at:   new Date().toISOString(),
      status:        'active',
      rent_first_half_released: true,  // triggers manual Razorpay release in POC
    })
    .eq('id', bookingId);
  if (error) throw error;
}

// Confirm return (owner side)
export async function confirmReturn(bookingId, hasDispute = false) {
  const update = hasDispute
    ? { status: 'disputed', deposit_status: 'disputed' }
    : {
        return_done: true,
        return_at:   new Date().toISOString(),
        status:      'completed',
        deposit_status: 'refunded',
        rent_second_half_released: true,
      };

  const { error } = await supabase
    .from('bookings')
    .update(update)
    .eq('id', bookingId);
  if (error) throw error;
}


// ─────────────────────────────────────────────────────────────────────────────
//  CONDITION PHOTOS (Cloudinary upload)
// ─────────────────────────────────────────────────────────────────────────────

// Your Cloudinary upload preset (unsigned) — set up in Cloudinary dashboard
//const CLOUDINARY_CLOUD = 'dl3whvu6p';
const CLOUDINARY_PRESET = 'leasio_conditions';  // unsigned preset

export async function uploadConditionPhoto(file, bookingId, phase) {
  // Upload to Cloudinary directly from browser (no server needed)
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_PRESET);
  formData.append('folder', `leasio/bookings/${bookingId}/${phase}`);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
    { method: 'POST', body: formData }
  );
  const { secure_url } = await res.json();

  // Save URL to Supabase
  const { error } = await supabase
    .from('condition_photos')
    .insert([{ booking_id: bookingId, phase, url: secure_url }]);
  if (error) throw error;

  return secure_url;
}


// ─────────────────────────────────────────────────────────────────────────────
//  REVIEWS
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchReviews(listingId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles:reviewer_id (full_name)')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function submitReview({ listingId, bookingId, reviewerId, rating, comment, role }) {
  const { error } = await supabase
    .from('reviews')
    .insert([{ listing_id: listingId, booking_id: bookingId, reviewer_id: reviewerId, rating, comment, role }]);
  if (error) throw error;
}


// ─────────────────────────────────────────────────────────────────────────────
//  MAPPER — DB row → app object (camelCase, same shape as SEED)
// ─────────────────────────────────────────────────────────────────────────────
function mapListing(row) {
  return {
    id:             row.id,
    listingType:    row.listing_type,
    subtype:        row.subtype,
    category:       row.category,
    title:          row.title,
    description:    row.description,
    emoji:          row.emoji || '📦',
    locality:       row.locality,
    city:           row.city,
    // full_address intentionally NOT mapped here — only revealed post-deposit
    owner:          row.profiles?.full_name || 'Unknown',
    ownerId:        row.owner_id,
    ownerType:      row.profiles?.owner_type || 'individual',
    ownerTrust:     row.profiles?.trust_score || 4.0,
    verified:       row.verified,
    rentPrice:      row.rent_price,
    buyPrice:       row.buy_price,
    deposit:        row.deposit,
    minDays:        row.min_days,
    totalQty:       row.total_qty,
    availableQty:   row.available_qty,
    available:      row.available,
    priceHour:      row.price_hour   || row.price_per_hour,
    priceHalfDay:   row.price_half_day,
    priceFullDay:   row.price_full_day,
    capacity:       row.capacity,
    amenities:      row.amenities    || [],
    minHours:       row.min_hours,
    daysAvailable:  row.days_available || [],
    travelRadius:   row.travel_radius,
    listingTrust:   row.listing_trust,
    rating:         row.rating,
    reviews:        row.review_count,
    bookedSlots:    {},   // fetched separately via fetchBookedSlots()
    bookedDates:    [],
  };
}
