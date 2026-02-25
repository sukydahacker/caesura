import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { 
  Plus, Trash2, Package, DollarSign, TrendingUp, AlertCircle, 
  CheckCircle, Clock, Eye, Edit3, MoreHorizontal, ShoppingBag
} from 'lucide-react';
import { 
  uploadDesignImage, createDesign, getDesigns, deleteDesign, 
  getMyProducts, getCreatorEarnings, getMe 
} from '@/lib/api';
import { toast } from 'sonner';
import DesignUploadFlow from '@/components/DesignUploadFlow';
import { PRINT_PRESETS, GARMENT_COLORS, DESIGN_STATES } from '@/config/printPresets';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Design status badge component
const StatusBadge = ({ status }) => {
  const configs = {
    draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
    submitted: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Under Review' },
    approved: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Approved' },
    live: { bg: 'bg-green-100', text: 'text-green-700', label: 'Live' },
    rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending' }
  };
  
  const config = configs[status] || configs.draft;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

// Enhanced design card with product previews
const DesignCard = ({ design, index, onDelete, onViewProducts }) => {
  const productCount = design.product_configs?.length || 0;
  const enabledProducts = design.product_configs?.filter(p => p.enabled !== false) || [];
  
  // Get first product preview color
  const firstProduct = enabledProducts[0];
  const previewColor = firstProduct?.color || 'white';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative bg-white border border-border overflow-hidden"
      data-testid={`design-card-${index}`}
    >
      {/* Design image with product overlay preview */}
      <div className="aspect-square bg-muted relative overflow-hidden">
        <img 
          src={design.image_url} 
          alt={design.title}
          className="w-full h-full object-contain p-4"
          style={{ 
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'10\' height=\'10\' fill=\'%23f0f0f0\'/%3E%3Crect x=\'10\' y=\'10\' width=\'10\' height=\'10\' fill=\'%23f0f0f0\'/%3E%3C/svg%3E")',
            backgroundSize: '20px 20px'
          }}
        />
        
        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <StatusBadge status={design.approval_status} />
        </div>
        
        {/* Quick actions overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="rounded-full"
              onClick={() => onViewProducts(design)}
              data-testid={`view-products-btn-${index}`}
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
          </div>
        </div>
      </div>
      
      {/* Design info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-lg font-semibold truncate" data-testid={`design-title-${index}`}>
              {design.title}
            </h3>
            {design.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{design.description}</p>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewProducts(design)}>
                <Eye className="h-4 w-4 mr-2" />
                View Products
              </DropdownMenuItem>
              {design.approval_status === 'draft' && (
                <DropdownMenuItem onClick={() => onDelete(design.design_id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Product summary */}
        {enabledProducts.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {enabledProducts.length} product{enabledProducts.length !== 1 ? 's' : ''}
              </span>
              <div className="flex -space-x-1">
                {enabledProducts.slice(0, 3).map((product, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border-2 border-white"
                    style={{ backgroundColor: GARMENT_COLORS[product.color]?.hex || '#fff' }}
                    title={`${PRINT_PRESETS[product.productType]?.name} - ${GARMENT_COLORS[product.color]?.name}`}
                  />
                ))}
                {enabledProducts.length > 3 && (
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-muted flex items-center justify-center text-xs font-medium">
                    +{enabledProducts.length - 3}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Rejection reason */}
        {design.approval_status === 'rejected' && design.rejection_reason && (
          <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-700">
            <strong>Feedback:</strong> {design.rejection_reason}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Product detail modal/view
const ProductsView = ({ design, open, onClose }) => {
  if (!design || !open) return null;
  
  const products = design.product_configs || [];
  
  return (
    <div className={`fixed inset-0 z-50 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <div 
        className={`absolute inset-0 bg-black/50 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: open ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-border p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="font-heading text-xl font-bold">{design.title}</h2>
            <p className="text-sm text-muted-foreground">Product previews</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <span className="sr-only">Close</span>
            ×
          </Button>
        </div>
        
        <div className="p-6">
          {/* Design preview */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex gap-4">
              <div className="w-24 h-24 rounded overflow-hidden flex-shrink-0" style={{ 
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'10\' height=\'10\' fill=\'%23ddd\'/%3E%3Crect x=\'10\' y=\'10\' width=\'10\' height=\'10\' fill=\'%23ddd\'/%3E%3C/svg%3E")'
              }}>
                <img src={design.image_url} alt={design.title} className="w-full h-full object-contain" />
              </div>
              <div>
                <StatusBadge status={design.approval_status} />
                {design.design_analysis && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {design.design_analysis.width} × {design.design_analysis.height}px
                    {design.design_analysis.color_count && ` • ${design.design_analysis.color_count} colors`}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Products grid */}
          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {products.map((product, index) => {
                const preset = PRINT_PRESETS[product.productType];
                const color = GARMENT_COLORS[product.color];
                const mockupUrl = preset?.mockupImages?.[product.color] || preset?.mockupImages?.white;
                
                return (
                  <div 
                    key={index}
                    className={`border rounded-lg overflow-hidden ${
                      product.enabled === false ? 'opacity-50' : ''
                    }`}
                  >
                    {/* Simple mockup preview */}
                    <div className="aspect-[4/5] bg-muted relative">
                      <img 
                        src={mockupUrl}
                        alt={preset?.name}
                        className="w-full h-full object-cover"
                      />
                      {/* Design overlay */}
                      <div 
                        className="absolute pointer-events-none"
                        style={{
                          top: product.productType === 'cap' ? '35%' : '25%',
                          left: product.productType === 'varsity_jacket' ? '25%' : '50%',
                          width: product.productType === 'varsity_jacket' ? '18%' : 
                                 product.productType === 'cap' ? '40%' : '50%',
                          transform: 'translateX(-50%)'
                        }}
                      >
                        <img 
                          src={design.image_url}
                          alt="Design"
                          className="w-full h-auto mix-blend-multiply"
                        />
                      </div>
                      {product.enabled === false && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">Disabled</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3">
                      <h4 className="font-medium text-sm">{preset?.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div 
                          className="w-4 h-4 rounded-full border border-border"
                          style={{ backgroundColor: color?.hex }}
                        />
                        <span className="text-xs text-muted-foreground">{color?.name}</span>
                      </div>
                      <p className="text-sm font-semibold mt-2">₹{preset?.basePrice}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No products configured for this design</p>
            </div>
          )}
          
          {/* Status info */}
          {design.approval_status === 'submitted' && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Under Review</p>
                  <p className="text-sm text-yellow-700">
                    Your design is being reviewed by our team. This typically takes 24-48 hours.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {design.approval_status === 'live' && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Live on Marketplace</p>
                  <p className="text-sm text-green-700">
                    Your products are available for purchase in the marketplace.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default function Dashboard() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [productsViewOpen, setProductsViewOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [myProducts, setMyProducts] = useState([]);

  useEffect(() => {
    fetchUserData();
    fetchDesigns();
    fetchMyProducts();
    fetchEarnings();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await getMe();
      setUser(response.data);
    } catch (error) {
      console.error('Failed to load user data');
    }
  };

  const fetchEarnings = async () => {
    try {
      const response = await getCreatorEarnings();
      setEarnings(response.data);
    } catch (error) {
      console.error('Failed to load earnings');
    }
  };

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

  const fetchMyProducts = async () => {
    try {
      const response = await getMyProducts();
      setMyProducts(response.data);
    } catch (error) {
      console.error('Failed to load products');
    }
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

  const handleViewProducts = (design) => {
    setSelectedDesign(design);
    setProductsViewOpen(true);
  };

  const handleUploadComplete = async (designData) => {
    try {
      // Upload the image first
      const uploadResponse = await uploadDesignImage(designData.file);
      const imageUrl = uploadResponse.data.image_url;
      
      // Create the design with all metadata
      await createDesign({
        title: designData.title,
        description: designData.description,
        image_url: imageUrl,
        products: designData.products,
        analysis: designData.analysis,
        tags: []
      });
      
      fetchDesigns();
    } catch (error) {
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" data-testid="dashboard-loading"></div>
      </div>
    );
  }

  // Separate designs by status
  const liveDesigns = designs.filter(d => d.approval_status === 'live' || d.approval_status === 'approved');
  const pendingDesigns = designs.filter(d => d.approval_status === 'submitted' || d.approval_status === 'pending');
  const draftDesigns = designs.filter(d => d.approval_status === 'draft');
  const rejectedDesigns = designs.filter(d => d.approval_status === 'rejected');

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      
      <div className="pt-24 pb-12 px-6 md:px-12 max-w-[1600px] mx-auto">
        {/* Creator Status Banner */}
        {user && user.role === 'creator' && user.creator_status && (
          <div className={`mb-8 p-6 rounded border ${
            user.creator_status === 'pending' ? 'border-yellow-500 bg-yellow-50' :
            user.creator_status === 'approved' ? 'border-green-500 bg-green-50' :
            user.creator_status === 'suspended' ? 'border-red-500 bg-red-50' :
            'border-red-500 bg-red-50'
          }`}>
            <div className="flex items-center gap-3">
              {user.creator_status === 'pending' && (
                <>
                  <Clock className="h-6 w-6 text-yellow-600" />
                  <div>
                    <h3 className="font-heading font-semibold text-yellow-700">Creator Account Pending</h3>
                    <p className="text-sm text-yellow-600">Your creator application is under review. You'll be notified once approved.</p>
                  </div>
                </>
              )}
              {user.creator_status === 'approved' && (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="font-heading font-semibold text-green-700">Creator Account Active</h3>
                    <p className="text-sm text-green-600">You can upload designs and create products.</p>
                  </div>
                </>
              )}
              {user.creator_status === 'suspended' && (
                <>
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  <div>
                    <h3 className="font-heading font-semibold text-red-700">Account Suspended</h3>
                    <p className="text-sm text-red-600">Your creator account has been suspended. Contact support for details.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Earnings Summary */}
        {earnings && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white border border-border p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-[#0047FF]/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-[#0047FF]" />
                </div>
                <h3 className="font-subheading font-semibold">Total Earnings</h3>
              </div>
              <p className="text-3xl font-heading font-bold">₹{earnings.total_earnings.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground mt-1">Lifetime earnings</p>
            </div>

            <div className="bg-white border border-border p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <h3 className="font-subheading font-semibold">Pending</h3>
              </div>
              <p className="text-3xl font-heading font-bold text-yellow-600">₹{earnings.pending_earnings.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground mt-1">Awaiting fulfillment</p>
            </div>

            <div className="bg-white border border-border p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="font-subheading font-semibold">Total Orders</h3>
              </div>
              <p className="text-3xl font-heading font-bold">{earnings.total_orders}</p>
              <p className="text-sm text-muted-foreground mt-1">Products sold</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-2">Creator Dashboard</h1>
            <p className="text-muted-foreground font-subheading">Upload designs, preview products, track your sales</p>
          </div>
          
          <div className="flex gap-4">
            {user?.role === 'admin' && (
              <Button 
                onClick={() => window.location.href = '/admin'}
                variant="outline"
                size="lg"
                className="rounded-full font-subheading"
                data-testid="admin-panel-btn"
              >
                Admin Panel
              </Button>
            )}
            
            <Button 
              onClick={() => setUploadDialogOpen(true)}
              size="lg"
              className="rounded-full font-subheading bg-[#0047FF] hover:bg-[#0047FF]/90"
              data-testid="upload-new-design-btn"
              disabled={user?.creator_status !== 'approved' && user?.role !== 'admin'}
            >
              <Plus className="mr-2 h-5 w-5" />
              Upload Design
            </Button>
          </div>
        </div>

        {/* Empty state */}
        {designs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg border border-border" data-testid="no-designs-message">
            <Package className="h-20 w-20 mx-auto mb-6 text-muted-foreground" />
            <h3 className="font-heading text-2xl font-semibold mb-2">No designs yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Upload your first design to see it come to life on T-shirts, hoodies, and more
            </p>
            <Button 
              onClick={() => setUploadDialogOpen(true)}
              className="rounded-full bg-[#0047FF] hover:bg-[#0047FF]/90"
              data-testid="upload-first-design-btn"
            >
              <Plus className="mr-2 h-5 w-5" />
              Upload Your First Design
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Live Designs */}
            {liveDesigns.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <h2 className="font-heading text-2xl font-bold">Live ({liveDesigns.length})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="live-designs-grid">
                  {liveDesigns.map((design, index) => (
                    <DesignCard
                      key={design.design_id}
                      design={design}
                      index={index}
                      onDelete={handleDeleteDesign}
                      onViewProducts={handleViewProducts}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Pending Designs */}
            {pendingDesigns.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <h2 className="font-heading text-2xl font-bold">Under Review ({pendingDesigns.length})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="pending-designs-grid">
                  {pendingDesigns.map((design, index) => (
                    <DesignCard
                      key={design.design_id}
                      design={design}
                      index={index}
                      onDelete={handleDeleteDesign}
                      onViewProducts={handleViewProducts}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Draft Designs */}
            {draftDesigns.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <h2 className="font-heading text-2xl font-bold">Drafts ({draftDesigns.length})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="draft-designs-grid">
                  {draftDesigns.map((design, index) => (
                    <DesignCard
                      key={design.design_id}
                      design={design}
                      index={index}
                      onDelete={handleDeleteDesign}
                      onViewProducts={handleViewProducts}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Rejected Designs */}
            {rejectedDesigns.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <h2 className="font-heading text-2xl font-bold">Rejected ({rejectedDesigns.length})</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="rejected-designs-grid">
                  {rejectedDesigns.map((design, index) => (
                    <DesignCard
                      key={design.design_id}
                      design={design}
                      index={index}
                      onDelete={handleDeleteDesign}
                      onViewProducts={handleViewProducts}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* My Products Section (Legacy) */}
        {myProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="font-heading text-2xl font-bold tracking-tight mb-8">My Products (Legacy)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="my-products-grid">
              {myProducts.map((product, index) => (
                <motion.div
                  key={product.product_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="group relative bg-white border border-border overflow-hidden rounded-lg"
                  data-testid={`product-card-${index}`}
                >
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    <img 
                      src={product.mockup_image} 
                      alt={product.title}
                      className="w-full h-full object-contain"
                    />
                    {!product.is_approved && (
                      <div className="absolute top-3 right-3 bg-yellow-500 text-white px-3 py-1 text-xs font-semibold rounded-full">
                        Pending
                      </div>
                    )}
                    {product.is_approved && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 text-xs font-semibold rounded-full">
                        Approved
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                      {product.apparel_type === 'tshirt' ? 'T-Shirt' : 'Hoodie'}
                    </p>
                    <h3 className="font-heading text-lg font-semibold">{product.title}</h3>
                    <p className="font-semibold mt-1">₹{product.price}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload Flow Dialog */}
      <DesignUploadFlow 
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onComplete={handleUploadComplete}
      />

      {/* Products View Panel */}
      <ProductsView
        design={selectedDesign}
        open={productsViewOpen}
        onClose={() => {
          setProductsViewOpen(false);
          setSelectedDesign(null);
        }}
      />
    </div>
  );
}
