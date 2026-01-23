import { Link } from "wouter";
import { Plus } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Find the Perfect Time to Meet</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Coordinate schedules effortlessly with friends, family, or colleagues. 
            Create an event, share the link, and let everyone mark their availability.
          </p>
          <Link href="/create">
            <Button className="bg-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Create New Event
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
