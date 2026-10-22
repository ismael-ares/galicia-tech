import { calendarDay } from '@/lib/calendar';
import { Agenda } from '@/components/catalog';
export default function Page(){return <Agenda today={calendarDay(new Date())}/>;}
