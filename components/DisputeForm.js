import { useState } from 'react';
import { AlertTriangle, X, Send, Upload } from 'lucide-react';
import { createClientComponentClient, createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';
import { disputeService } from '../lib/database';

export default function DisputeForm({ booking, user, onSuccess, onCancel }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const supabase = createPagesBrowserClient();

  const disputeReasons = [
    'Space not as described',
    'Access issues',
    'Safety concerns',
    'Cleanliness issues',
    'No-show (owner)',
    'No-show (renter)',
    'Payment dispute',
    'Damage claim',
    'Other'
  ];

  const handleFileUpload = async (files) => {
    if (evidence.length + files.length > 5) {
      toast.error('Maximum 5 evidence files allowed');
      return;
    }

    setUploading(true);
    const newEvidence = [];

    try {
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`);
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `disputes/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('files')
          .getPublicUrl(filePath);

        newEvidence.push({
          url: publicUrl,
          name: file.name,
          type: file.type
        });
      }

      setEvidence([...evidence, ...newEvidence]);
      if (newEvidence.length > 0) {
        toast.success(`${newEvidence.length} file(s) uploaded`);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveEvidence = (index) => {
    const newEvidence = [...evidence];
    newEvidence.splice(index, 1);
    setEvidence(newEvidence);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason || !description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const disputeData = {
        booking_id: booking.id,
        complainant_id: user.id,
        respondent_id: user.id === booking.renter_id ? booking.space.owner_id : booking.renter_id,
        reason,
        description: description.trim(),
        evidence_files: evidence,
        status: 'open'
      };

      const dispute = await disputeService.createDispute(supabase, disputeData);
      toast.success('Dispute submitted successfully');
      onSuccess(dispute);
    } catch (error) {
      console.error('Error submitting dispute:', error);
      toast.error('Failed to submit dispute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-bold text-gray-900">Report Dispute</h2>
            </div>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Please provide detailed information about the issue. Our team will review and respond within 24 hours.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Booking Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Booking Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Space:</span>
                <span className="ml-2 font-medium">{booking.space?.title}</span>
              </div>
              <div>
                <span className="text-gray-600">Booking ID:</span>
                <span className="ml-2 font-mono text-xs">{booking.id}</span>
              </div>
              <div>
                <span className="text-gray-600">Date:</span>
                <span className="ml-2 font-medium">
                  {new Date(booking.start_datetime).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Amount:</span>
                <span className="ml-2 font-medium">€{booking.total_amount}</span>
              </div>
            </div>
          </div>

          {/* Dispute Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What is the main issue? *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Select a reason</option>
              {disputeReasons.map((reasonOption) => (
                <option key={reasonOption} value={reasonOption}>
                  {reasonOption}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide a detailed explanation of the issue, including what happened, when it occurred, and what resolution you're seeking..."
              rows={6}
              maxLength={1000}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/1000 characters
            </p>
          </div>

          {/* Evidence Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Evidence (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Upload photos, screenshots, or documents that support your case (max 5 files, 10MB each)
            </p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                className="hidden"
                id="evidence-upload"
                disabled={uploading || evidence.length >= 5}
              />
              <label
                htmlFor="evidence-upload"
                className={`cursor-pointer flex flex-col items-center justify-center py-4 ${
                  uploading || evidence.length >= 5 ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'
                }`}
              >
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  {uploading
                    ? 'Uploading...'
                    : evidence.length >= 5
                    ? 'Maximum files reached'
                    : 'Click to upload files or drag and drop'
                  }
                </p>
              </label>
            </div>

            {/* Evidence List */}
            {evidence.length > 0 && (
              <div className="mt-4 space-y-2">
                {evidence.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      {file.type.startsWith('image/') ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                          📄
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEvidence(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Important:</p>
                <ul className="text-yellow-700 mt-1 space-y-1">
                  <li>• False or fraudulent disputes may result in account suspension</li>
                  <li>• Both parties will be notified of this dispute</li>
                  <li>• If no response is received within 48 hours, automatic refund may be processed</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading || !reason || !description.trim()}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send size={16} />
              {loading ? 'Submitting...' : 'Submit Dispute'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
