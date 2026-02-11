import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, Box, ShoppingCart } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Package,
      title: "Inventory Management",
      description: "Track items with images, quantities, and costs",
      path: "/inventory",
    },
    {
      icon: Box,
      title: "Product Management",
      description: "Create gift boxes and calculate pricing",
      path: "/products",
    },
    {
      icon: ShoppingCart,
      title: "Order Tracking",
      description: "Manage orders with Kanban board",
      path: "/orders",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 text-foreground">
            Welcome to KhipuFlow
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The all-in-one operations platform for gift box businesses. 
            Manage inventory, build products, track orders, and coordinate deliveries — from a single dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map(({ icon: Icon, title, description, path }) => (
            <div
              key={path}
              className="bg-card border rounded-lg p-8 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(path)}
            >
              <Icon className="h-12 w-12 text-primary mb-4" />
              <h2 className="text-2xl font-semibold mb-2 text-foreground">{title}</h2>
              <p className="text-muted-foreground mb-6">{description}</p>
              <Button className="w-full">Get Started</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
