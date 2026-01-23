import { Link } from "wouter";
import { Calendar } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Calendar className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">HangTime</h1>
          </Link>
          
        </div>
      </div>
    </header>
  );
}
