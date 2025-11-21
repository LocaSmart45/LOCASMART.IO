import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Reservation } from '../../lib/supabase';

interface PropertyCalendarViewProps {
  reservations: Reservation[];
  propertyId?: string;
  onReservationClick?: (reservation: Reservation) => void;
}

export default function PropertyCalendarView({
  reservations,
  propertyId,
  onReservationClick,
}: PropertyCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const filteredReservations = useMemo(() => {
    if (propertyId) {
      return reservations.filter((r) => r.property_id === propertyId);
    }
    return reservations;
  }, [reservations, propertyId]);

  const monthReservations = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    return filteredReservations.filter((reservation) => {
      const checkIn = new Date(reservation.check_in);
      const checkOut = new Date(reservation.check_out);
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);

      return checkIn <= monthEnd && checkOut >= monthStart;
    });
  }, [filteredReservations, currentDate]);

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < (startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1); i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentDate]);

  const getReservationsForDay = (date: Date) => {
    return monthReservations.filter((reservation) => {
      const checkIn = new Date(reservation.check_in);
      const checkOut = new Date(reservation.check_out);
      checkIn.setHours(0, 0, 0, 0);
      checkOut.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);

      return date >= checkIn && date <= checkOut;
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthName = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const getReservationColor = (reservation: Reservation) => {
    if (reservation.status === 'cancelled') return 'bg-red-200 border-red-400 text-red-800';
    if (reservation.status === 'completed') return 'bg-slate-200 border-slate-400 text-slate-800';
    if (reservation.platform === 'airbnb') return 'bg-rose-200 border-rose-400 text-rose-800';
    if (reservation.platform === 'booking') return 'bg-blue-200 border-blue-400 text-blue-800';
    return 'bg-emerald-200 border-emerald-400 text-emerald-800';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-800 capitalize flex items-center">
          <CalendarIcon className="w-6 h-6 mr-2" />
          {monthName}
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToToday}
            className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Aujourd'hui
          </button>
          <button
            onClick={previousMonth}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
            aria-label="Mois précédent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
            aria-label="Mois suivant"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-slate-600 py-2"
          >
            {day}
          </div>
        ))}

        {daysInMonth.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dayReservations = getReservationsForDay(date);
          const isToday =
            date.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={`aspect-square border rounded-lg p-1 ${
                isToday
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              } transition`}
            >
              <div className="flex flex-col h-full">
                <div
                  className={`text-sm font-medium text-center ${
                    isToday ? 'text-blue-700' : 'text-slate-700'
                  }`}
                >
                  {date.getDate()}
                </div>
                <div className="flex-1 overflow-y-auto space-y-0.5 mt-1">
                  {dayReservations.slice(0, 3).map((reservation) => (
                    <button
                      key={reservation.id}
                      onClick={() => onReservationClick?.(reservation)}
                      className={`w-full text-xs px-1 py-0.5 rounded border truncate text-left ${getReservationColor(
                        reservation
                      )} hover:opacity-80 transition`}
                      title={`${reservation.guest_name} - ${reservation.platform}`}
                    >
                      {reservation.guest_name.split(' ')[0]}
                    </button>
                  ))}
                  {dayReservations.length > 3 && (
                    <div className="text-xs text-slate-500 text-center">
                      +{dayReservations.length - 3}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {monthReservations.length === 0 && (
        <div className="mt-6 text-center text-slate-500">
          Aucune réservation ce mois-ci
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-rose-200 border border-rose-400 rounded mr-2" />
          <span className="text-slate-600">Airbnb</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-200 border border-blue-400 rounded mr-2" />
          <span className="text-slate-600">Booking</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-emerald-200 border border-emerald-400 rounded mr-2" />
          <span className="text-slate-600">Direct</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-200 border border-red-400 rounded mr-2" />
          <span className="text-slate-600">Annulée</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-slate-200 border border-slate-400 rounded mr-2" />
          <span className="text-slate-600">Terminée</span>
        </div>
      </div>
    </div>
  );
}
