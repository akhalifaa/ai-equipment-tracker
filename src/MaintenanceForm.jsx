import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export default function MaintenanceForm() {
  const [checkedInEquipments, setCheckedInEquipments] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [generatedMessage, setGeneratedMessage] = useState('');

  // Fetch only checked-in equipment
  useEffect(() => {
    const fetchEquipments = async () => {
      const { data, error } = await supabase
        .from('equipment_log')
        .select('*')
        .eq('status', 'checked_in')
        .order('id', { ascending: true });

      if (error) {
        console.error('Failed to fetch checked-in equipment:', error.message);
      } else {
        setCheckedInEquipments(data);
      }
    };

    fetchEquipments();
  }, []);

  const handleGenerate = (e) => {
    e.preventDefault();

    const selected = checkedInEquipments.find(
      (item) => item.id === parseInt(selectedId)
    );

    if (!selected) {
      alert('Select a valid equipment');
      return;
    }

    const message = `🔧 Maintenance Request

Equipment: ${selected.equipment_name} (ID: ${selected.id})
Issue: ${issueDescription}
Checked in on: ${selected.checked_in_at || 'N/A'}
Renter contact: ${selected.renter_number || 'N/A'}`;

    setGeneratedMessage(message);
  };

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold mb-2">🔧 Generate Maintenance Request</h2>
      <form onSubmit={handleGenerate} className="space-y-2">
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="border p-2 w-full"
          required
        >
          <option value="">Select equipment</option>
          {checkedInEquipments.map((item) => (
            <option key={item.id} value={item.id}>
              {item.equipment_name} (ID: {item.id})
            </option>
          ))}
        </select>

        <textarea
          value={issueDescription}
          onChange={(e) => setIssueDescription(e.target.value)}
          placeholder="Describe the issue..."
          className="border p-2 w-full"
          required
        />

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Generate Message
        </button>
      </form>

      {generatedMessage && (
        <div className="mt-4 bg-gray-100 p-3 rounded border">
          <pre>{generatedMessage}</pre>
          <button
            onClick={() => {
              navigator.clipboard.writeText(generatedMessage);
              alert('Copied to clipboard!');
            }}
            className="mt-2 bg-green-600 text-white px-3 py-1 rounded"
          >
            Copy Message
          </button>
        </div>
      )}
    </div>
  );
}
