import { Link } from "react-router-dom";
import { Shield, FileText } from "lucide-react";

export function EditorialLinks() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-t border-border pt-5 mt-6">
      <Link 
        to="/editorial-policy" 
        className="flex items-center gap-2 hover:text-primary transition-colors rounded-full bg-muted/50 px-4 py-2 hover:bg-muted"
      >
        <Shield className="w-4 h-4" />
        সম্পাদকীয় নীতিমালা
      </Link>
      <Link 
        to="/corrections-policy" 
        className="flex items-center gap-2 hover:text-primary transition-colors rounded-full bg-muted/50 px-4 py-2 hover:bg-muted"
      >
        <FileText className="w-4 h-4" />
        সংশোধনী নীতিমালা
      </Link>
    </div>
  );
}
