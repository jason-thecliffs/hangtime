import { Calendar } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <Calendar className="text-white w-4 h-4" />
            </div>
            <span className="font-bold text-lg text-gray-900">HangTime</span>
          </div>
          <div className="flex space-x-6 text-sm text-gray-600">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Contact Us</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
