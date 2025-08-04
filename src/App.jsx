import { useState, useEffect } from 'react';
import MaintenanceForm from './MaintenanceForm';
import { supabase } from './supabase';
import { exportEquipmentLog } from './utils/exportToExcel';
import './App.css';

function App() {
  const [equipmentName, setEquipmentName] = useState('');
  const [renterNumber, setRenterNumber] = useState('');
  const [rate, setRate] = useState('');
  const [availableEquipments, setAvailableEquipments] = useState([]);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    fetchAvailableEquipments();
  }, []);

  const fetchAvailableEquipments = async () => {
    const { data, error } = await supabase
      .from('equipment_log')
      .select('*')
      .eq('status', 'checked_in');

    if (error) {
      console.error('Failed to fetch available equipment:', error.message);
    } else {
      setAvailableEquipments(data);
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase.from('equipment_log').insert([
      {
        equipment_name: equipmentName,
        renter_number: renterNumber,
        rate: parseFloat(rate),
        status: 'checked_in',
        checked_in_at: today,
      },
    ]);

    if (error) {
      console.error('❌ Failed to check in:', error.message);
    } else {
      alert('✅ Equipment checked in!');
      setEquipmentName('');
      setRenterNumber('');
      setRate('');
      fetchAvailableEquipments();
    }
  };

  const handleCheckOut = async (e) => {
    e.preventDefault();

    const parsedId = parseInt(selectedId);
    if (isNaN(parsedId)) return;

    const { data: rows, error: fetchError } = await supabase
      .from('equipment_log')
      .select('*')
      .eq('id', parsedId)
      .limit(1);

    if (fetchError || !rows || rows.length === 0) {
      console.error('❌ Failed to fetch row:', fetchError?.message);
      return;
    }

    const item = rows[0];
    const checkInDate = new Date(item.checked_in_at);
    const checkOutDate = new Date();
    const checkOutDateStr = checkOutDate.toISOString().split('T')[0];

    const msInDay = 1000 * 60 * 60 * 24;
    const daysUsed = Math.max(
      Math.ceil((checkOutDate - checkInDate) / msInDay),
      1
    );

    const cost = Math.round(daysUsed * item.rate * 100) / 100;

    const { data, error } = await supabase
      .from('equipment_log')
      .update({
        status: 'checked_out',
        checked_out_at: checkOutDateStr,
        cost,
      })
      .eq('id', parsedId)
      .select();

    if (error) {
      console.error('❌ Failed to check out:', error.message);
    } else {
      console.log('✅ Checked out:', data);
      alert(`✅ Checked out!\nDays used: ${daysUsed}\nTotal cost: $${cost}`);
      setSelectedId('');
      fetchAvailableEquipments();
    }
  };

  const handleExport = async () => {
    const { data, error } = await supabase.from('equipment_log').select('*');
    if (error) {
      console.error("❌ Failed to fetch equipment log:", error.message);
      return;
    }
    exportEquipmentLog(data);
  };

return (
  <div className="min-h-screen bg-gray-50 font-sans">
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-10">
      <h1 className="text-4xl font-bold text-blue-700 text-center">AI Equipment Tracker</h1>

      {/* Check-In Form */}
      <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Check In Equipment</h2>
        <form onSubmit={handleCheckIn} className="space-y-4">
          <input
            type="text"
            placeholder="Equipment Name"
            value={equipmentName}
            onChange={(e) => setEquipmentName(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:border-blue-400"
          />
          <input
            type="text"
            placeholder="Renter WhatsApp Number"
            value={renterNumber}
            onChange={(e) => setRenterNumber(e.target.value)}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:border-blue-400"
          />
          <input
            type="number"
            placeholder="Rate (per day)"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:border-blue-400"
          />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            Check In
          </button>
        </form>
      </div>

      {/* Check-Out Form */}
      <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Check Out Equipment</h2>
        <form onSubmit={handleCheckOut} className="space-y-4">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:border-blue-400"
          >
            <option value="">-- Select Equipment --</option>
            {availableEquipments.map((item) => (
              <option key={item.id} value={item.id}>
                {item.equipment_name} (Rate: ${item.rate})
              </option>
            ))}
          </select>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            Check Out
          </button>
        </form>
      </div>

      {/* Export Button */}
      <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto text-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Export Equipment Log</h2>
        <button
          onClick={handleExport}
          className="bg-green-600 text-white py-2 px-6 rounded hover:bg-green-700"
        >
          Export to Excel
        </button>
      </div>

      {/* Maintenance Form */}
      <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
        <MaintenanceForm />
      </div>
    </div>
  </div>
);

}

export default App;
