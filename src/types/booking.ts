export interface ServiceType {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: number | null;
  active: boolean;
}

export interface AppointmentData {
  id: string;
  serviceId: string;
  service: ServiceType;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientNie: string | null;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  adminNotes: string | null;
  createdAt: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface BookingFormData {
  serviceId: string;
  date: string;
  startTime: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientNie: string;
  notes: string;
}

export interface OfficeSettingsData {
  id: string;
  firmName: string;
  firmEmail: string;
  firmPhone: string;
  firmAddress: string;
  startHour: number;
  endHour: number;
  slotDurationMin: number;
  lunchStartHour: number;
  lunchEndHour: number;
  workDays: number[];
  maxAppointmentsPerDay: number;
}
