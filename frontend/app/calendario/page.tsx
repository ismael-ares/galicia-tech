import {calendarDay} from '@/lib/calendar';
import {CalendarScreen} from '@/components/calendar-screen';
export default function Page(){return <CalendarScreen today={calendarDay(new Date())}/>;}
