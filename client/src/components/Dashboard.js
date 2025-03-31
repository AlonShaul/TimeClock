// src/components/Dashboard.js
import React, { useState, useEffect } from 'react';

// Format ISO string into DD/MM/YY
function formatDate(isoString) {
  if (!isoString || isoString === "") return "00/00/00";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "00/00/00";
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

// Format ISO string into HH:MM
function formatTime(isoString) {
  if (!isoString || isoString === "") return "00:00";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "00:00";
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Calculate duration between checkin and checkout
function calculateDuration(checkin, checkout) {
  if (!checkin || !checkout) return "00:00";
  const start = new Date(checkin);
  const end = new Date(checkout);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "00:00";
  let diffMs = end - start;
  if(diffMs < 0) diffMs = 0;
  const diffMinutes = Math.floor(diffMs / 60000);
  const hh = String(Math.floor(diffMinutes / 60)).padStart(2, '0');
  const mm = String(diffMinutes % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

// Inline style to hide native appearance
const hideNativePicker = {
  WebkitAppearance: 'none',
  MozAppearance: 'textfield',
  appearance: 'none'
};

// DateInput component with a single icon on the right
const DateInput = ({ value, onChange }) => (
  <div className="relative">
    <input
      type="date"
      value={value}
      onChange={onChange}
      className="border border-gray-300 p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 pr-8 appearance-none"
      style={hideNativePicker}
    />
    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
      <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </span>
  </div>
);

// TimeInput component with a single icon on the right
const TimeInput = ({ value, onChange }) => (
  <div className="relative">
    <input
      type="time"
      value={value}
      onChange={onChange}
      className="border border-gray-300 p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 pr-8 appearance-none w-32"
      style={hideNativePicker}
    />
    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
      <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19a7 7 0 100-14 7 7 0 000 14z" />
      </svg>
    </span>
  </div>
);

const Dashboard = ({ user, onLogout }) => {
  // Berlin real-time clock
  const [berlinDate, setBerlinDate] = useState('');
  const [berlinTime, setBerlinTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const localString = now.toLocaleString('en-GB', { timeZone: 'Europe/Berlin' });
      const [datePart, timePart] = localString.split(', ');
      setBerlinDate(datePart);
      setBerlinTime(timePart);
    };
    updateTime();
    const intervalId = setInterval(updateTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // State for records and editing
  const [records, setRecords] = useState([]);
  const [editRecordId, setEditRecordId] = useState(null);

  // Fields for editing checkin and checkout
  const [checkinDate, setCheckinDate] = useState('');
  const [checkinTime, setCheckinTime] = useState('');
  const [checkoutDate, setCheckoutDate] = useState('');
  const [checkoutTime, setCheckoutTime] = useState('');

  const fetchRecords = async () => {
    try {
      const response = await fetch('http://localhost:5000/records');
      const data = await response.json();
      setRecords(data);
      return data;
    } catch (error) {
      console.error("Error fetching records", error);
      return [];
    }
  };

  useEffect(() => {
    if (user.role === 'manager') {
      fetchRecords();
    }
  }, [user]);

  // For regular users: Use German time from server for Check In / Check Out
  const handleCheckIn = async () => {
    try {
      const timeResponse = await fetch('http://localhost:5000/current-time');
      const timeData = await timeResponse.json();
      const germanTime = timeData.dateTime; // Assumes API returns 'dateTime'
      
      await fetch('http://localhost:5000/update-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          checkin: germanTime,
          checkout: ""
        }),
      });
      alert('Check-In saved!');
      fetchRecords();
    } catch (error) {
      console.error("Error checking in", error);
    }
  };

  const handleCheckOut = async () => {
    try {
      const allRecords = await fetchRecords();
      const timeResponse = await fetch('http://localhost:5000/current-time');
      const timeData = await timeResponse.json();
      const germanTime = timeData.dateTime;
      
      const userRecords = allRecords.filter(r => r.username === user.username);
      if (userRecords.length > 0) {
        const latestRecord = userRecords.reduce((prev, curr) => (prev.id > curr.id ? prev : curr));
        if (!latestRecord.checkout || latestRecord.checkout === "") {
          // Update the latest record if checkout is empty
          const response = await fetch(`http://localhost:5000/records/${latestRecord.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ checkout: germanTime }),
          });
          const data = await response.json();
          if (data.success) {
            alert('Check-Out saved!');
            fetchRecords();
          }
        } else {
          // If the latest record already has checkout, create a new record with empty checkin
          const response = await fetch('http://localhost:5000/update-time', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: user.username,
              checkin: "",
              checkout: germanTime
            }),
          });
          const data = await response.json();
          if (data.success) {
            alert('Check-Out saved as new record!');
            fetchRecords();
          }
        }
      } else {
        // No record exists: create a new record with empty checkin
        const response = await fetch('http://localhost:5000/update-time', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: user.username,
            checkin: "",
            checkout: germanTime
          }),
        });
        const data = await response.json();
        if (data.success) {
          alert('Check-Out saved!');
          fetchRecords();
        }
      }
    } catch (error) {
      console.error("Error checking out", error);
    }
  };

  // Admin: when clicking "Edit Record", populate edit fields
  const handleEditClick = (record) => {
    setEditRecordId(record.id);
    if (record.checkin) {
      const ms = Date.parse(record.checkin);
      if (!isNaN(ms)) {
        const d = new Date(ms);
        setCheckinDate(d.toISOString().split('T')[0]); 
        setCheckinTime(d.toTimeString().slice(0,5));     
      }
    } else {
      setCheckinDate('');
      setCheckinTime('');
    }
    if (record.checkout) {
      const ms = Date.parse(record.checkout);
      if (!isNaN(ms)) {
        const d = new Date(ms);
        setCheckoutDate(d.toISOString().split('T')[0]);
        setCheckoutTime(d.toTimeString().slice(0,5));
      }
    } else {
      setCheckoutDate('');
      setCheckoutTime('');
    }
  };

  const handleSaveEdit = async (id) => {
    let checkinIso = "";
    let checkoutIso = "";
    if (checkinDate && checkinTime) {
      checkinIso = new Date(`${checkinDate}T${checkinTime}`).toISOString();
    }
    if (checkoutDate && checkoutTime) {
      checkoutIso = new Date(`${checkoutDate}T${checkoutTime}`).toISOString();
    } else {
      checkoutIso = "";
    }
    try {
      const response = await fetch(`http://localhost:5000/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkin: checkinIso, checkout: checkoutIso }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Record updated successfully!');
        setEditRecordId(null);
        fetchRecords();
      }
    } catch (error) {
      console.error("Error saving edit", error);
    }
  };

  const handleCancelEdit = () => {
    setEditRecordId(null);
    setCheckinDate('');
    setCheckinTime('');
    setCheckoutDate('');
    setCheckoutTime('');
  };

  // Admin: Delete record
  const handleDeleteRecord = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        const response = await fetch(`http://localhost:5000/records/${id}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (data.success) {
          alert('Record deleted successfully!');
          fetchRecords();
        }
      } catch (error) {
        console.error("Error deleting record", error);
      }
    }
  };

  // Component rendering
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex flex-col items-center relative">
      {/* Logout button */}
      <button
        onClick={onLogout ? onLogout : () => window.location.reload()}
        className="absolute top-4 right-4 bg-white text-blue-500 px-4 py-2 rounded-full shadow-lg transform transition-transform duration-300 hover:scale-110"
      >
        Log Out
      </button>

      {/* Main card */}
      <div className="w-full max-w-4xl bg-white p-10 rounded-2xl shadow-2xl my-10 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Welcome, {user.username} {user.employeeNumber ? `(${user.employeeNumber} - ${user.department})` : ''}
        </h1>

        {/* Berlin Date & Time display */}
        <div className="mb-6 flex justify-center items-center w-full">
          <div className="flex justify-between items-center w-full max-w-md bg-blue-100 border border-blue-300 p-4 rounded-lg shadow-sm">
            <div className="flex flex-col items-center">
              <span className="text-gray-700 font-semibold">Date</span>
              <span className="text-xl font-bold text-blue-800">{berlinDate}</span>
            </div>
            <div className="w-px bg-blue-300 h-10 mx-4"></div>
            <div className="flex flex-col items-center">
              <span className="text-gray-700 font-semibold">Time</span>
              <span className="text-xl font-bold text-blue-800">{berlinTime}</span>
            </div>
          </div>
        </div>

        {/* Interface for regular users */}
        {(user.role === 'developer' || user.role === 'sales') && (
          <div className="flex flex-col items-center mb-10 space-y-4">
            <button
              onClick={handleCheckIn}
              className="bg-green-500 hover:bg-green-600 transition-colors text-white px-6 py-3 w-48 rounded-full font-medium"
            >
              Check In
            </button>
            <button
              onClick={handleCheckOut}
              className="bg-red-500 hover:bg-red-600 transition-colors text-white px-6 py-3 w-48 rounded-full font-medium"
            >
              Check Out
            </button>
          </div>
        )}

        {/* Interface for admin: Records List */}
        {user.role === 'manager' && (
          <div className="w-full">
            <h2 className="text-2xl font-semibold mb-4 text-center">Records List</h2>
            <ul className="space-y-4">
              {records.map(record => {
                const formattedCheckinDate = formatDate(record.checkin);
                const formattedCheckinTime = formatTime(record.checkin);
                const formattedCheckoutDate = formatDate(record.checkout);
                const formattedCheckoutTime = formatTime(record.checkout);
                const duration = calculateDuration(record.checkin, record.checkout);
                const isEditing = editRecordId === record.id;

                return (
                  <li
                    key={record.id}
                    className="border border-gray-300 p-4 rounded-lg shadow-sm hover:shadow-lg transition-shadow text-center relative"
                  >
                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteRecord(record.id)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors"
                      title="Delete Record"
                    >
                      &times;
                    </button>

                    <div className="mb-1">
                      <span className="font-semibold">User:</span> {record.username}
                    </div>
                    {!isEditing ? (
                      <>
                        <div className="mb-1">
                          <span className="font-semibold">Check-In:</span>{" "}
                          {formattedCheckinDate} {formattedCheckinTime}
                        </div>
                        <div className="mb-1">
                          <span className="font-semibold">Check-Out:</span>{" "}
                          {formattedCheckoutDate} {formattedCheckoutTime}
                        </div>
                        <div className="mb-1">
                          <span className="font-semibold">Duration:</span> {duration}
                        </div>
                        <button
                          onClick={() => handleEditClick(record)}
                          className="bg-yellow-500 hover:bg-yellow-600 transition-colors text-white p-2 rounded mt-2"
                        >
                          Edit Record
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center space-y-4">
                        {/* Editable Check-In */}
                        <div className="flex flex-col items-center">
                          <span className="font-semibold mb-1">Check-In</span>
                          <div className="flex items-center space-x-2">
                            <DateInput
                              value={checkinDate}
                              onChange={(e) => setCheckinDate(e.target.value)}
                            />
                            <TimeInput
                              value={checkinTime}
                              onChange={(e) => setCheckinTime(e.target.value)}
                            />
                          </div>
                        </div>
                        {/* Editable Check-Out */}
                        <div className="flex flex-col items-center">
                          <span className="font-semibold mb-1">Check-Out</span>
                          <div className="flex items-center space-x-2">
                            <DateInput
                              value={checkoutDate}
                              onChange={(e) => setCheckoutDate(e.target.value)}
                            />
                            <TimeInput
                              value={checkoutTime}
                              onChange={(e) => setCheckoutTime(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="mt-2">
                          <button
                            onClick={() => handleSaveEdit(record.id)}
                            className="bg-blue-500 hover:bg-blue-600 transition-colors text-white p-1 mx-2 rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-gray-500 hover:bg-gray-600 transition-colors text-white p-1 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
