import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './App.css';

function App() {
  const [equipmentName, setEquipmentName] = useState('');
  const [renterNumber, setRenterNumber] = useState('');
  const [rate, setRate] = useState('');
  const [availableEquipments, setAvailableEquipments] = useState([]);
  const [selectedId, setSelectedId] = useState('');

  // Fetch all available (checked-in) equipment for the checkout dropdown
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

  // Check-in form handler
  const handleCheckIn = async (e) => {
    e.preventDefault();
  
    const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
  
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
  
  

  // Check-out handler
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
    const checkOutDateStr = checkOutDate.toISOString().split('T')[0]; // 'YYYY-MM-DD'
  
    // ✅ Calculate number of full calendar days
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
  
  
  
  
  
  

  return (
    <div className="App">
      <h1>AI Equipment Tracker</h1>

      {/* Check-In Form */}
      <h2>Check In Equipment</h2>
      <form onSubmit={handleCheckIn}>
        <input
          type="text"
          placeholder="Equipment Name"
          value={equipmentName}
          onChange={(e) => setEquipmentName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Renter WhatsApp Number"
          value={renterNumber}
          onChange={(e) => setRenterNumber(e.target.value)}
          optional
        />
        <input
          type="number"
          placeholder="Rate (per day)"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          required
        />
        <button type="submit">Check In</button>
      </form>

      <hr />

      {/* Check-Out Form */}
      <h2>Check Out Equipment</h2>
      <form onSubmit={handleCheckOut}>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          required
        >
          <option value="">-- Select Equipment to Check Out --</option>
          {availableEquipments.map((item) => (
            <option key={item.id} value={item.id}>
              {item.equipment_name} (Rate: ${item.rate})
            </option>
          ))}
        </select>
        <button type="submit">Check Out</button>
      </form>
    </div>
  );
}

export default App;


