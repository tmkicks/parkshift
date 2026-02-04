// Database service functions that accept authenticated Supabase client

// Profile operations
export const profileService = {
  async getProfile(supabaseClient, userId) {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateProfile(supabaseClient, userId, updates) {
    const { data, error } = await supabaseClient
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async createProfile(supabaseClient, profile) {
    const { data, error } = await supabaseClient
      .from('profiles')
      .insert(profile)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Vehicle operations
export const vehicleService = {
  async getUserVehicles(supabaseClient, userId) {
    const { data, error } = await supabaseClient
      .from('vehicles')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async addVehicle(supabaseClient, vehicle) {
    const { data, error } = await supabaseClient
      .from('vehicles')
      .insert(vehicle)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateVehicle(supabaseClient, vehicleId, updates) {
    const { data, error } = await supabaseClient
      .from('vehicles')
      .update(updates)
      .eq('id', vehicleId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteVehicle(supabaseClient, vehicleId) {
    const { error } = await supabaseClient
      .from('vehicles')
      .delete()
      .eq('id', vehicleId);
    
    if (error) throw error;
  },

  async setPrimaryVehicle(supabaseClient, userId, vehicleId) {
    // Remove primary from all user vehicles
    await supabaseClient
      .from('vehicles')
      .update({ is_primary: false })
      .eq('user_id', userId);
    
    // Set new primary
    const { data, error } = await supabaseClient
      .from('vehicles')
      .update({ is_primary: true })
      .eq('id', vehicleId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Payment methods operations
export const paymentService = {
  async getUserPaymentMethods(supabaseClient, userId) {
    const { data, error } = await supabaseClient
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async addPaymentMethod(supabaseClient, paymentMethod) {
    const { data, error } = await supabaseClient
      .from('payment_methods')
      .insert(paymentMethod)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deletePaymentMethod(supabaseClient, paymentMethodId) {
    const { error } = await supabaseClient
      .from('payment_methods')
      .delete()
      .eq('id', paymentMethodId);
    
    if (error) throw error;
  },

  async setDefaultPaymentMethod(supabaseClient, userId, paymentMethodId) {
    // Remove default from all user payment methods
    await supabaseClient
      .from('payment_methods')
      .update({ is_default: false })
      .eq('user_id', userId);
    
    // Set new default
    const { data, error } = await supabaseClient
      .from('payment_methods')
      .update({ is_default: true })
      .eq('id', paymentMethodId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Parking spaces operations
export const spaceService = {
  async searchSpaces(supabaseClient, filters) {
    let query = supabaseClient
      .from('parking_spaces')
      .select(`
        *,
        owner:profiles!user_id(first_name, last_name, avatar_url),
        reviews(rating),
        bookings!inner(start_datetime, end_datetime)
      `)
      .eq('is_active', true)
      .eq('is_available', true);

    // Apply location filter
    if (filters.latitude && filters.longitude && filters.radius) {
      // This is a simplified distance calculation - in production, use PostGIS
      const latRange = filters.radius / 111; // Rough km to degree conversion
      const lngRange = filters.radius / (111 * Math.cos(filters.latitude * Math.PI / 180));
      
      query = query
        .gte('latitude', filters.latitude - latRange)
        .lte('latitude', filters.latitude + latRange)
        .gte('longitude', filters.longitude - lngRange)
        .lte('longitude', filters.longitude + lngRange);
    }

    // Apply vehicle size filters
    if (filters.vehicle_length) {
      query = query.gte('length_cm', filters.vehicle_length);
    }
    if (filters.vehicle_width) {
      query = query.gte('width_cm', filters.vehicle_width);
    }
    if (filters.vehicle_height) {
      query = query.gte('height_cm', filters.vehicle_height);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getUserSpaces(supabaseClient, userId) {
    const { data, error } = await supabaseClient
      .from('parking_spaces')
      .select(`
        *,
        reviews(rating),
        bookings(id, start_datetime, end_datetime, status)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getSpaceById(supabaseClient, spaceId) {
    const { data, error } = await supabaseClient
      .from('parking_spaces')
      .select(`
        *,
        owner:profiles!user_id(first_name, last_name, avatar_url, phone),
        reviews(rating, comment, reviewer:profiles!reviewer_id(first_name, last_name)),
        availability_slots(date, start_hour, end_hour, is_available)
      `)
      .eq('id', spaceId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async createSpace(supabaseClient, space) {
    const { data, error } = await supabaseClient
      .from('parking_spaces')
      .insert(space)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateSpace(supabaseClient, spaceId, updates) {
    const { data, error } = await supabaseClient
      .from('parking_spaces')
      .update(updates)
      .eq('id', spaceId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteSpace(supabaseClient, spaceId) {
    const { error } = await supabaseClient
      .from('parking_spaces')
      .delete()
      .eq('id', spaceId);
    
    if (error) throw error;
  }
};

// Booking operations
export const bookingService = {
  async createBooking(supabaseClient, booking) {
    const { data, error } = await supabaseClient
      .from('bookings')
      .insert(booking)
      .select(`
        *,
        space:parking_spaces(title, address, user_id),
        vehicle:vehicles(make, model, license_plate),
        renter:profiles(first_name, last_name, phone)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getUserBookings(supabaseClient, userId, type = 'renter') {
    let query = supabaseClient
      .from('bookings')
      .select(`
        *,
        space:parking_spaces(title, address, images, user_id),
        vehicle:vehicles(make, model, license_plate),
        renter:profiles(first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    if (type === 'renter') {
      query = query.eq('renter_id', userId);
    } else {
      query = query
        .select(`
          *,
          space:parking_spaces!inner(title, address, images),
          vehicle:vehicles(make, model, license_plate),
          renter:profiles(first_name, last_name, phone)
        `)
        .eq('parking_spaces.user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async updateBookingStatus(supabaseClient, bookingId, status) {
    const { data, error } = await supabaseClient
      .from('bookings')
      .update({ status, updated_at: new Date() })
      .eq('id', bookingId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Message operations
export const messageService = {
  async getConversations(supabaseClient, userId) {
    const { data, error } = await supabaseClient
      .from('messages')
      .select(`
        booking_id,
        sender:profiles!sender_id(id, first_name, last_name, avatar_url),
        recipient:profiles!recipient_id(id, first_name, last_name, avatar_url),
        content,
        created_at,
        is_read
      `)
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group by conversation (booking_id or participant pair)
    const conversations = {};
    data.forEach(message => {
      const key = message.booking_id || `${Math.min(message.sender.id, message.recipient.id)}-${Math.max(message.sender.id, message.recipient.id)}`;
      if (!conversations[key]) {
        conversations[key] = {
          id: key,
          booking_id: message.booking_id,
          participant: message.sender.id === userId ? message.recipient : message.sender,
          lastMessage: message,
          unreadCount: 0
        };
      }
      if (!message.is_read && message.recipient.id === userId) {
        conversations[key].unreadCount++;
      }
    });

    return Object.values(conversations);
  },

  async getMessages(supabaseClient, bookingId, senderId, recipientId) {
    let query = supabaseClient
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(first_name, last_name, avatar_url),
        recipient:profiles!recipient_id(first_name, last_name, avatar_url)
      `)
      .order('created_at', { ascending: true });

    if (bookingId) {
      query = query.eq('booking_id', bookingId);
    } else {
      query = query
        .or(`and(sender_id.eq.${senderId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${senderId})`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async sendMessage(supabaseClient, message) {
    const { data, error } = await supabaseClient
      .from('messages')
      .insert(message)
      .select(`
        *,
        sender:profiles!sender_id(first_name, last_name, avatar_url),
        recipient:profiles!recipient_id(first_name, last_name, avatar_url)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async markAsRead(supabaseClient, messageIds) {
    const { error } = await supabaseClient
      .from('messages')
      .update({ is_read: true })
      .in('id', messageIds);
    
    if (error) throw error;
  }
};

// Notification operations
export const notificationService = {
  async getUserNotifications(supabaseClient, userId) {
    const { data, error } = await supabaseClient
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async createNotification(supabaseClient, notification) {
    const { data, error } = await supabaseClient
      .from('notifications')
      .insert(notification)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async markAsRead(supabaseClient, notificationIds) {
    const { error } = await supabaseClient
      .from('notifications')
      .update({ is_read: true })
      .in('id', notificationIds);
    
    if (error) throw error;
  }
};

// Review operations
export const reviewService = {
  async createReview(supabaseClient, review) {
    const { data, error } = await supabaseClient
      .from('reviews')
      .insert(review)
      .select(`
        *,
        reviewer:profiles!reviewer_id(first_name, last_name, avatar_url)
      `)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getSpaceReviews(supabaseClient, spaceId) {
    const { data, error } = await supabaseClient
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviewer_id(first_name, last_name, avatar_url)
      `)
      .eq('space_id', spaceId)
      .eq('is_space_review', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getUserReviews(supabaseClient, userId, isSpaceReview = true) {
    const { data, error } = await supabaseClient
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviewer_id(first_name, last_name, avatar_url),
        space:parking_spaces(title)
      `)
      .eq('reviewee_id', userId)
      .eq('is_space_review', isSpaceReview)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

// Dispute operations
export const disputeService = {
  async createDispute(supabaseClient, dispute) {
    const { data, error } = await supabaseClient
      .from('disputes')
      .insert(dispute)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getUserDisputes(supabaseClient, userId) {
    const { data, error } = await supabaseClient
      .from('disputes')
      .select(`
        *,
        booking:bookings(
          id,
          total_amount,
          start_datetime,
          end_datetime,
          space:parking_spaces(title)
        ),
        complainant:profiles!complainant_id(first_name, last_name),
        respondent:profiles!respondent_id(first_name, last_name)
      `)
      .or(`complainant_id.eq.${userId},respondent_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async updateDispute(supabaseClient, disputeId, updates) {
    const { data, error } = await supabaseClient
      .from('disputes')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', disputeId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Parking/Listing service functions for database operations
export const listingService = {
  async createListing(supabase, userId, listingData) {
    const { data, error } = await supabase
      .from('parking_spaces')
      .insert({
        user_id: userId, // Consistent naming with other tables
        ...listingData,
        created_at: new Date().toISOString(),
        is_active: true
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getUserListings(supabase, userId) {
    const { data, error } = await supabase
      .from('parking_spaces')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getPublicListings(supabase, filters = {}) {
    let query = supabase
      .from('parking_spaces')
      .select('*')
      .eq('is_active', true);

    // Add filters if provided
    if (filters.city) {
      query = query.ilike('address', `%${filters.city}%`);
    }
    if (filters.minPrice) {
      query = query.gte('hourly_rate', filters.minPrice);
    }
    if (filters.maxPrice) {
      query = query.lte('hourly_rate', filters.maxPrice);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async updateListing(supabase, listingId, userId, updateData) {
    const { data, error } = await supabase
      .from('parking_spaces')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', listingId)
      .eq('user_id', userId) // Ensure user owns the listing
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteListing(supabase, listingId, userId) {
    const { error } = await supabase
      .from('parking_spaces')
      .delete()
      .eq('id', listingId)
      .eq('user_id', userId); // Ensure user owns the listing
    
    if (error) throw error;
  },

  async toggleListingStatus(supabase, listingId, userId, isActive) {
    const { data, error } = await supabase
      .from('parking_spaces')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', listingId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Availability management service
export const availabilityService = {
  async getListingAvailability(supabase, listingId) {
    const { data, error } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('space_id', listingId)
      .order('date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },

  async updateAvailability(supabase, listingId, availabilityData) {
    // First, delete existing availability for the listing
    await supabase
      .from('availability_slots')
      .delete()
      .eq('space_id', listingId);

    // Convert availability object to array format
    const availabilitySlots = Object.entries(availabilityData)
      .filter(([date, settings]) => settings.available) // Only insert available days
      .map(([date, settings]) => ({
        space_id: listingId,
        date,
        is_available: true,
        start_hour: settings.allDay ? 0 : parseInt(settings.startTime.split(':')[0]),
        end_hour: settings.allDay ? 24 : parseInt(settings.endTime.split(':')[0]) // 24 = midnight next day
      }));

    // Insert new availability slots
    if (availabilitySlots.length > 0) {
      const { data, error } = await supabase
        .from('availability_slots')
        .insert(availabilitySlots)
        .select();
      
      if (error) throw error;
      return data;
    }
    
    return [];
  },

  async getAvailabilityForDate(supabase, listingId, date) {
    const { data, error } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('space_id', listingId)
      .eq('date', date)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
    return data;
  },

  async checkAvailability(supabase, listingId, startDate, endDate) {
    const { data, error } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('space_id', listingId)
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('is_available', true);
    
    if (error) throw error;
    return data || [];
  }
};
