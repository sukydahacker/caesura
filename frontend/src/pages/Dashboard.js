import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/Navbar';
import { Plus, Trash2, Package } from 'lucide-react';
import { uploadDesignImage, createDesign, getDesigns, deleteDesign, createProduct, getMyProducts } from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Dashboard() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState(null);
  
  // Upload form
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // Product form
  const [apparelType, setApparelType] = useState('tshirt');
  const [price, setPrice] = useState('999');
  const [productTitle, setProductTitle] = useState('');
  const [productDescription, setProductDescription] = useState('');

  useEffect(() => {
    fetchDesigns();
    fetchMyProducts();
  }, []);

  const fetchDesigns = async () => {
    try {
      const response = await getDesigns();
      setDesigns(response.data);
    } catch (error) {
      toast.error('Failed to load designs');
    } finally {
      setLoading(false);
    }
  };

  const [myProducts, setMyProducts] = useState([]);
  
  const fetchMyProducts = async () => {
    try {
      const response = await getMyProducts();
      setMyProducts(response.data);
    } catch (error) {
      console.error('Failed to load products');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !title) {
      toast.error('Please select a file and enter a title');
      return;
    }

    setUploading(true);
    try {
      // Upload image
      const uploadResponse = await uploadDesignImage(uploadFile);
      const imageUrl = uploadResponse.data.image_url;

      // Create design
      await createDesign({
        title,
        description,
        image_url: imageUrl,
        tags: []
      });

      toast.success('Design uploaded successfully!');
      setUploadDialogOpen(false);
      resetUploadForm();
      fetchDesigns();
    } catch (error) {
      toast.error('Failed to upload design');
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadPreview(null);
    setTitle('');
    setDescription('');
  };

  const handleDeleteDesign = async (designId) => {
    if (!window.confirm('Are you sure you want to delete this design?')) return;
    
    try {
      await deleteDesign(designId);
      toast.success('Design deleted');
      fetchDesigns();
    } catch (error) {
      toast.error('Failed to delete design');
    }
  };

  const handleCreateProduct = async () => {
    if (!productTitle || !price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createProduct({
        design_id: selectedDesign.design_id,
        title: productTitle,
        description: productDescription,
        apparel_type: apparelType,
        price: parseFloat(price),
        mockup_image: selectedDesign.image_url
      });

      toast.success('Product created successfully!');
      setProductDialogOpen(false);
      setSelectedDesign(null);
      setProductTitle('');
      setProductDescription('');
      setPrice('999');
    } catch (error) {
      toast.error('Failed to create product');
    }
  };

  const openProductDialog = (design) => {
    setSelectedDesign(design);
    setProductTitle(design.title);
    setProductDescription(design.description || '');
    setProductDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" data-testid="dashboard-loading"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark">
      <Navbar />
      
      <div className="pt-24 pb-12 px-6 md:px-12 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="font-heading text-5xl font-bold tracking-tight mb-2">Creator Dashboard</h1>
            <p className="text-muted-foreground font-subheading">Manage your designs and products</p>
          </div>
          
          <Button 
            onClick={() => setUploadDialogOpen(true)}
            size="lg"
            className="rounded-full font-subheading bg-[#0047FF] hover:bg-[#0047FF]/90"
            data-testid="upload-new-design-btn"
          >
            <Plus className="mr-2 h-5 w-5" />
            Upload Design
          </Button>
        </div>

        {designs.length === 0 ? (
          <div className="text-center py-20" data-testid="no-designs-message">
            <Package className="h-20 w-20 mx-auto mb-6 text-muted-foreground" />
            <h3 className="font-heading text-2xl font-semibold mb-2">No designs yet</h3>
            <p className="text-muted-foreground mb-6">Start by uploading your first design</p>
            <Button 
              onClick={() => setUploadDialogOpen(true)}
              className="rounded-full"
              data-testid="upload-first-design-btn"
            >
              Upload Your First Design
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="designs-grid">
            {designs.map((design, index) => (
              <motion.div
                key={design.design_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group relative bg-card border border-border overflow-hidden"
                data-testid={`design-card-${index}`}
              >
                <div className="aspect-square bg-muted relative overflow-hidden">
                  <img 
                    src={design.image_url} 
                    alt={design.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <div className="p-6">
                  <h3 className="font-heading text-xl font-semibold mb-2" data-testid={`design-title-${index}`}>{design.title}</h3>
                  {design.description && (
                    <p className="text-sm text-muted-foreground mb-4">{design.description}</p>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => openProductDialog(design)}
                      size="sm"
                      className="flex-1 rounded-full font-subheading"
                      data-testid={`create-product-btn-${index}`}
                    >
                      <Package className="mr-2 h-4 w-4" />
                      Create Product
                    </Button>
                    
                    <Button 
                      onClick={() => handleDeleteDesign(design.design_id)}
                      size="sm"
                      variant="destructive"
                      className="rounded-full"
                      data-testid={`delete-design-btn-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md" data-testid="upload-design-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Upload Design</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">Design Image</Label>
              <Input 
                id="file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-2"
                data-testid="design-file-input"
              />
            </div>
            
            {uploadPreview && (
              <div className="aspect-square bg-muted rounded overflow-hidden">
                <img src={uploadPreview} alt="Preview" className="w-full h-full object-contain" data-testid="design-preview-image" />
              </div>
            )}
            
            <div>
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter design title"
                className="mt-2"
                data-testid="design-title-input"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea 
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your design"
                className="mt-2"
                data-testid="design-description-input"
              />
            </div>
            
            <Button 
              onClick={handleUpload}
              disabled={uploading}
              className="w-full rounded-full"
              data-testid="upload-design-submit-btn"
            >
              {uploading ? 'Uploading...' : 'Upload Design'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="sm:max-w-md" data-testid="create-product-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Create Product</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedDesign && (
              <div className="aspect-square bg-muted rounded overflow-hidden">
                <img src={selectedDesign.image_url} alt={selectedDesign.title} className="w-full h-full object-contain" />
              </div>
            )}
            
            <div>
              <Label htmlFor="apparelType">Apparel Type</Label>
              <Select value={apparelType} onValueChange={setApparelType}>
                <SelectTrigger className="mt-2" data-testid="apparel-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tshirt">T-Shirt</SelectItem>
                  <SelectItem value="hoodie">Hoodie</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="productTitle">Product Title</Label>
              <Input 
                id="productTitle"
                value={productTitle}
                onChange={(e) => setProductTitle(e.target.value)}
                placeholder="Enter product title"
                className="mt-2"
                data-testid="product-title-input"
              />
            </div>
            
            <div>
              <Label htmlFor="productDescription">Description</Label>
              <Textarea 
                id="productDescription"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Product description"
                className="mt-2"
                data-testid="product-description-input"
              />
            </div>
            
            <div>
              <Label htmlFor="price">Price (₹)</Label>
              <Input 
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="999"
                className="mt-2"
                data-testid="product-price-input"
              />
            </div>
            
            <Button 
              onClick={handleCreateProduct}
              className="w-full rounded-full"
              data-testid="create-product-submit-btn"
            >
              Create Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}