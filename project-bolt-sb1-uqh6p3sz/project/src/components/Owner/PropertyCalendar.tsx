import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Reservation } from '../../lib/supabase';

interface PropertyCalendarProps {
  propertyId: string;
  reservations: Reservation[];
}

export default function PropertyCalendar({ propertyId, reservations }: PropertyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const propertyReservations = reservations.filter(r => r.property_id === propertyId);

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  function previousMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  }

  function isDateReserved(day: number) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);

    return propertyReservations.find(reservation => {
      const checkIn = new Date(reservation.check_in);
      const checkOut = new Date(reservation.check_out);
      return date >= checkIn && date < checkOut;
    });
  }

  function isCheckIn(day: number) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];

    return propertyReservations.find(reservation => {
      const checkIn = new Date(reservation.check_in).toISOString().split('T')[0];
      return dateStr === checkIn;
    });
  }

  function isCheckOut(day: number) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];

    return propertyReservations.find(reservation => {
      const checkOut = new Date(reservation.check_out).toISOString().split('T')[0];
      return dateStr === checkOut;
    });
  }

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const reservation = isDateReserved(day);
    const checkIn = isCheckIn(day);
    const checkOut = isCheckOut(day);
    const today = new Date();
    const isToday =
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear();

    days.push(
      <div
        key={day}
        className={`aspect-square p-1 border border-slate-200 relative ${
          reservation
            ? 'bg-emerald-100 border-emerald-300'
            : 'bg-white hover:bg-slate-50'
        } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
        title={reservation ? `${reservation.guest_name}` : ''}
      >
        <div className="flex flex-col h-full">
          <span className={`text-xs ${
            reservation ? 'font-semibold text-emerald-800' : 'text-slate-600'
          }`}>
            {day}
          </span>
          {checkIn && (
            <div className="text-[10px] text-emerald-700 font-medium mt-auto">
              Arrivée
            </div>
          )}
          {checkOut && (
            <div className="text-[10px] text-orange-700 font-medium mt-auto">
              Départ
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-semibold text-slate-600 pb-2">
            {day}
          </div>
        ))}
        {days}
      </div>

      <div className="flex items-center justify-center space-x-6 mt-6 pt-4 border-t border-slate-200">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-emerald-100 border border-emerald-300 rounded mr-2"></div>
          <span className="text-sm text-slate-600">Réservé</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-white border border-slate-200 rounded mr-2"></div>
          <span className="text-sm text-slate-600">Disponible</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-white border-2 border-blue-500 rounded mr-2"></div>
          <span className="text-sm text-slate-600">Aujourd'hui</span>
        </div>
      </div>
    </div>
  );
}
