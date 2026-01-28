import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Package, CheckCircle2, Upload, Loader2 } from "lucide-react";

const DeliveryConfirmation = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [driverNotes, setDriverNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Load order details by token
  const { data, isLoading, error } = useQuery({
    queryKey: ["delivery-confirmation-public", token],
    queryFn: async () => {
      const { data: confirmation, error: confError } = await supabase
        .from("delivery_confirmations")
        .select(`
          *,
          orders (
            id,
            client_name,
            product_name,
            quantity,
            delivery_info,
            status
          )
        `)
        .eq("driver_token", token)
        .maybeSingle();

      if (confError) throw confError;
      if (!confirmation) throw new Error("Invalid delivery link");
      
      return confirmation;
    },
    enabled: !!token,
  });

  const order = data?.orders as any;
  const isAlreadyConfirmed = data?.confirmed_at;

  // Handle photo selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }

      setPhotoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Compress and upload photo
  const compressAndUploadPhoto = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = async () => {
          // Create canvas for compression
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions (max 1200px)
          let width = img.width;
          let height = img.height;
          const maxSize = 1200;
          
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to blob
          canvas.toBlob(async (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }
            
            // Upload to Supabase Storage
            const fileName = `${data?.id}_${Date.now()}.jpg`;
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('delivery-photos')
              .upload(fileName, blob, {
                contentType: 'image/jpeg',
                upsert: false,
              });
            
            if (uploadError) {
              reject(uploadError);
              return;
            }
            
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('delivery-photos')
              .getPublicUrl(uploadData.path);
            
            resolve(publicUrl);
          }, 'image/jpeg', 0.8);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  // Confirm delivery mutation
  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!photoFile) {
        throw new Error("Please upload a delivery photo");
      }

      setIsUploading(true);
      
      // Upload photo
      const photoUrl = await compressAndUploadPhoto(photoFile);
      
      // Update delivery confirmation - trigger will automatically set order status to Completed
      const { error: updateError } = await supabase
        .from("delivery_confirmations")
        .update({
          confirmed_at: new Date().toISOString(),
          delivery_photo_url: photoUrl,
          driver_notes: driverNotes || null,
        })
        .eq("id", data?.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      setIsUploading(false);
      toast.success("Delivery confirmed successfully!");
      // Refresh data
      window.location.reload();
    },
    onError: (error: any) => {
      setIsUploading(false);
      toast.error(error.message || "Failed to confirm delivery");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Invalid Delivery Link</h2>
            <p className="text-muted-foreground">
              This delivery confirmation link is invalid or has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAlreadyConfirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h2 className="text-xl font-semibold mb-2">Delivery Already Confirmed</h2>
            <p className="text-muted-foreground mb-4">
              This delivery was confirmed on{" "}
              {new Date(data.confirmed_at).toLocaleString()}
            </p>
            {data.delivery_photo_url && (
              <div className="mt-4">
                <img
                  src={data.delivery_photo_url}
                  alt="Delivery photo"
                  className="rounded-lg w-full"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-safe">
      <div className="max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Confirm Delivery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order Summary */}
            <div className="space-y-3 pb-6 border-b">
              <h3 className="font-semibold text-lg">Order Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client:</span>
                  <span className="font-medium">{order.client_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product:</span>
                  <span className="font-medium">{order.product_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity:</span>
                  <span className="font-medium">{order.quantity}</span>
                </div>
                {order.delivery_info && (
                  <div className="mt-3">
                    <span className="text-muted-foreground">Delivery Address:</span>
                    <p className="font-medium mt-1">{order.delivery_info}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Photo Upload */}
            <div className="space-y-3">
              <Label htmlFor="photo" className="text-base font-semibold">
                Delivery Photo *
              </Label>
              <div className="space-y-3">
                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                {photoPreview && (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full rounded-lg border"
                    />
                  </div>
                )}
                {!photoPreview && (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Take a photo of the delivered package
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Driver Notes */}
            <div className="space-y-3">
              <Label htmlFor="notes" className="text-base font-semibold">
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes about the delivery..."
                value={driverNotes}
                onChange={(e) => setDriverNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Confirm Button */}
            <Button
              onClick={() => confirmMutation.mutate()}
              disabled={!photoFile || confirmMutation.isPending || isUploading}
              className="w-full h-12 text-base"
              size="lg"
            >
              {isUploading || confirmMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Confirming Delivery...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Confirm Delivery
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              By confirming, you verify that the order has been successfully delivered.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeliveryConfirmation;
