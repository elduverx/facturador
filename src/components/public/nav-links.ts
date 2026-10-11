import { BookOpen, Target, Calendar, HelpCircle } from 'lucide-react';

// Shared by the navbar (client) and the footer (server), so it must not live in a 'use client' file.
export const NAV_LINKS = [
  { label: 'Guías', href: '/servicios', icon: BookOpen },
  { label: 'Método', href: '/metodo', icon: Target },
  { label: 'Reserva', href: '/reservar', icon: Calendar },
  { label: 'FAQ', href: '/faq', icon: HelpCircle },
];
