import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  const supabase = createPagesServerClient({ req, res });

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    switch (req.method) {
      case 'GET':
        return await getReviews(supabase, req.query, res);
      case 'POST':
        return await createReview(supabase, user.id, req.body, res);
      case 'PUT':
        return await updateReview(supabase, user.id, req.body, res);
      case 'DELETE':
        return await deleteReview(supabase, user.id, req.query.id, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Reviews API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getReviews(supabase, query, res) {
  try {
    const { space_id, user_id, booking_id } = query;

    let dbQuery = supabase
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviews_reviewer_id_fkey(first_name, last_name, avatar_url),
        reviewee:profiles!reviews_reviewee_id_fkey(first_name, last_name, avatar_url),
        space:parking_spaces(title, address),
        booking:bookings(start_datetime, end_datetime)
      `)
      .order('created_at', { ascending: false });

    if (space_id) {
      dbQuery = dbQuery.eq('space_id', space_id);
    }
    if (user_id) {
      dbQuery = dbQuery.eq('reviewee_id', user_id);
    }
    if (booking_id) {
      dbQuery = dbQuery.eq('booking_id', booking_id);
    }

    const { data, error } = await dbQuery;
    if (error) throw error;

    return res.status(200).json(data || []);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
}

async function createReview(supabase, userId, reviewData, res) {
  try {
    const {
      booking_id,
      reviewee_id,
      space_id,
      rating,
      comment,
      is_space_review = true
    } = reviewData;

    if (!booking_id || !reviewee_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Invalid review data' });
    }

    // Verify booking exists and user was part of it
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        *,
        space:parking_spaces(owner_id)
      `)
      .eq('id', booking_id)
      .single();

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if user can review this booking
    const canReview = booking.renter_id === userId || booking.space.owner_id === userId;
    if (!canReview) {
      return res.status(403).json({ error: 'Not authorized to review this booking' });
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', booking_id)
      .eq('reviewer_id', userId)
      .eq('is_space_review', is_space_review)
      .single();

    if (existingReview) {
      return res.status(400).json({ error: 'Review already exists for this booking' });
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        booking_id,
        reviewer_id: userId,
        reviewee_id,
        space_id: is_space_review ? space_id : null,
        rating,
        comment,
        is_space_review
      })
      .select(`
        *,
        reviewer:profiles!reviews_reviewer_id_fkey(first_name, last_name, avatar_url),
        reviewee:profiles!reviews_reviewee_id_fkey(first_name, last_name),
        space:parking_spaces(title)
      `)
      .single();

    if (error) throw error;

    // Create notification for reviewee
    await supabase
      .from('notifications')
      .insert({
        user_id: reviewee_id,
        type: 'review',
        title: 'New Review',
        message: `You received a new ${rating}-star review`,
        data: { review_id: data.id, rating }
      });

    return res.status(201).json(data);
  } catch (error) {
    console.error('Error creating review:', error);
    return res.status(500).json({ error: 'Failed to create review' });
  }
}

async function updateReview(supabase, userId, reviewData, res) {
  try {
    const { id, rating, comment } = reviewData;

    if (!id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Invalid review data' });
    }

    const { data, error } = await supabase
      .from('reviews')
      .update({
        rating,
        comment,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('reviewer_id', userId)
      .select(`
        *,
        reviewer:profiles!reviews_reviewer_id_fkey(first_name, last_name, avatar_url),
        reviewee:profiles!reviews_reviewee_id_fkey(first_name, last_name),
        space:parking_spaces(title)
      `)
      .single();

    if (error) throw error;

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error updating review:', error);
    return res.status(500).json({ error: 'Failed to update review' });
  }
}

async function deleteReview(supabase, userId, reviewId, res) {
  try {
    if (!reviewId) {
      return res.status(400).json({ error: 'Review ID is required' });
    }

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('reviewer_id', userId);

    if (error) throw error;

    return res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({ error: 'Failed to delete review' });
  }
}
