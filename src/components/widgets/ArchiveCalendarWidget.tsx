import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { bn } from "date-fns/locale";

export function ArchiveCalendarWidget() {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>(new Date());

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      navigate(`/search?date=${formattedDate}`);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-border flex flex-col mb-8">
      <div className="flex items-center gap-2 border-b-2 border-primary pb-2 mb-4 mx-4 mt-4 text-headline">
        <CalendarIcon className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-black tracking-wide uppercase">আর্কাইভ</h3>
      </div>
      
      <div className="p-2 pb-4 flex justify-center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          locale={bn}
          className="rounded-md"
        />
      </div>
    </div>
  );
}
