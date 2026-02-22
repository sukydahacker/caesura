import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/Navbar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, XCircle, Users, FileImage, BarChart3, 
  Settings, Package, Clock, DollarSign, TrendingUp,
  AlertCircle, Loader2, ShoppingBag
} from 'lucide-react';
import { 
  getPendingCreators, approveCreator, suspendCreator, rejectCreator,
  getPendingDesigns, approveDesign, rejectDesign,
  getPrintifyBlueprints, getAdminAnalytics, getMe, getAdminOrders,
  getLiveProducts, updateProductStatus
} from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('creators');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  // Creators
  const [pendingCreators, setPendingCreators] = useState([]);
  const [loadingCreators, setLoadingCreators] = useState(false);
  
  // Designs
  const [pendingDesigns, setPendingDesigns] = useState([]);
  const [loadingDesigns, setLoadingDesigns] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [blueprints, setBlueprints] = useState([]);
  const [selectedBlueprint, setSelectedBlueprint] = useState(6); // Default T-shirt
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionType, setActionType] = useState(''); // 'creator' or 'design'
  
  // Analytics
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  
  // Printify
  const [printifyData, setPrintifyData] = useState(null);
  const [loadingPrintify, setLoadingPrintify] = useState(false);

  // Orders
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Live Products
  const [liveProducts, setLiveProducts] = useState([]);
  const [loadingLiveProducts, setLoadingLiveProducts] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const response = await getMe();
      const userData = response.data;
      setUser(userData);
      
      if (userData.role !== 'admin') {
        toast.error('Access denied. Admin privileges required.');
        navigate('/dashboard');
        return;
      }
      
      setLoading(false);
      loadCreators();
    } catch (error) {
      toast.error('Failed to verify admin access');
      navigate('/');
    }
  };

  const loadCreators = async () => {
    setLoadingCreators(true);
    try {
      const response = await getPendingCreators();
      setPendingCreators(response.data);
    } catch (error) {
      toast.error('Failed to load pending creators');
    } finally {
      setLoadingCreators(false);
    }
  };

  const loadDesigns = async () => {
    setLoadingDesigns(true);
    try {
      const response = await getPendingDesigns();
      setPendingDesigns(response.data);
    } catch (error) {
      toast.error('Failed to load pending designs');
    } finally {
      setLoadingDesigns(false);
    }
  };

  const loadAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const response = await getAdminAnalytics();
      setAnalytics(response.data);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadPrintify = async () => {
    setLoadingPrintify(true);
    try {
      const response = await getPrintifyBlueprints();
      setPrintifyData(response.data);
      setBlueprints(response.data.blueprints || []);
    } catch (error) {
      toast.error('Failed to load Printify data');
    } finally {
      setLoadingPrintify(false);
    }
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await getAdminOrders();
      setOrders(response.data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadLiveProducts = async () => {
    setLoadingLiveProducts(true);
    try {
      const response = await getLiveProducts();
      setLiveProducts(response.data);
    } catch (error) {
      toast.error('Failed to load live products');
    } finally {
      setLoadingLiveProducts(false);
    }
  };

  const handleProductStatusChange = async (productId, newStatus) => {
    const product = liveProducts.find(p => p.product_id === productId);
    const actionText = newStatus === 'disabled' ? 'disable' : newStatus === 'out_of_stock' ? 'mark as out of stock' : 're-enable';
    const successText = newStatus === 'disabled' ? 'disabled' : newStatus === 'out_of_stock' ? 'marked as out of stock' : 're-enabled';
    
    if (newStatus === 'disabled' && product?.units_sold > 0) {
      if (!window.confirm(`This product has ${product.units_sold} units sold. Disabling will hide it from the storefront but won't affect existing orders. Continue?`)) {
        return;
      }
    }
    
    if (!window.confirm(`Are you sure you want to ${actionText} "${product?.title}"?`)) {
      return;
    }
    
    try {
      await updateProductStatus(productId, newStatus);
      toast.success(`Product ${successText} successfully`);
      loadLiveProducts();
      loadAnalytics(); // Refresh analytics
    } catch (error) {
      toast.error(`Failed to ${actionText} product`);
    }
  };

  const handleApproveCreator = async (userId) => {
    try {
      await approveCreator(userId);
      toast.success('Creator approved!');
      loadCreators();
    } catch (error) {
      toast.error('Failed to approve creator');
    }
  };

  const handleSuspendCreator = async (userId) => {
    if (!window.confirm('Are you sure you want to suspend this creator? All their products will be deactivated.')) return;
    
    try {
      await suspendCreator(userId);
      toast.success('Creator suspended');
      loadCreators();
    } catch (error) {
      toast.error('Failed to suspend creator');
    }
  };

  const openRejectDialog = (item, type) => {
    setSelectedDesign(item);
    setActionType(type);
    setRejectDialogOpen(true);
  };

  const handleRejectCreator = async () => {
    if (!selectedDesign) return;
    
    try {
      await rejectCreator(selectedDesign.user_id, rejectReason);
      toast.success('Creator rejected');
      setRejectDialogOpen(false);
      setRejectReason('');
      loadCreators();
    } catch (error) {
      toast.error('Failed to reject creator');
    }
  };

  const openApproveDesignDialog = (design) => {
    setSelectedDesign(design);
    setApproveDialogOpen(true);
  };

  const handleApproveDesign = async () => {
    if (!selectedDesign) return;
    
    try {
      await approveDesign(selectedDesign.design_id, selectedBlueprint, false);
      toast.success('Design approved and product created!');
      setApproveDialogOpen(false);
      loadDesigns();
    } catch (error) {
      toast.error('Failed to approve design');
    }
  };

  const handleRejectDesign = async () => {
    if (!selectedDesign) return;
    
    try {
      await rejectDesign(selectedDesign.design_id, rejectReason);
      toast.success('Design rejected');
      setRejectDialogOpen(false);
      setRejectReason('');
      loadDesigns();
    } catch (error) {
      toast.error('Failed to reject design');
    }
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    if (value === 'creators') loadCreators();
    if (value === 'designs') loadDesigns();
    if (value === 'products') loadLiveProducts();
    if (value === 'orders') loadOrders();
    if (value === 'analytics') loadAnalytics();
    if (value === 'printify') loadPrintify();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-12 px-6 md:px-12 max-w-[1600px] mx-auto">
        <div className="mb-8">
          <h1 className="font-heading text-5xl font-bold tracking-tight mb-2">Admin Panel</h1>
          <p className="text-muted-foreground font-subheading">Manage creators, designs, and platform operations</p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="bg-secondary p-1 rounded-full">
            <TabsTrigger value="creators" className="rounded-full" data-testid="tab-creators">
              <Users className="h-4 w-4 mr-2" />
              Creators
            </TabsTrigger>
            <TabsTrigger value="designs" className="rounded-full" data-testid="tab-designs">
              <FileImage className="h-4 w-4 mr-2" />
              Designs
            </TabsTrigger>
            <TabsTrigger value="products" className="rounded-full" data-testid="tab-products">
              <Package className="h-4 w-4 mr-2" />
              Live Products
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-full" data-testid="tab-orders">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-full" data-testid="tab-analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="printify" className="rounded-full" data-testid="tab-printify">
              <Settings className="h-4 w-4 mr-2" />
              Setup
            </TabsTrigger>
          </TabsList>

          {/* Pending Creators Tab */}
          <TabsContent value="creators" className="space-y-6">
            {loadingCreators ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pendingCreators.length === 0 ? (
              <div className="text-center py-20 border border-border rounded" data-testid="no-pending-creators">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-heading text-xl font-semibold mb-2">No Pending Creators</h3>
                <p className="text-muted-foreground">All creator applications have been reviewed</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="pending-creators-grid">
                {pendingCreators.map((creator, index) => (
                  <motion.div
                    key={creator.user_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border border-border p-6 rounded space-y-4"
                    data-testid={`creator-card-${index}`}
                  >
                    <div className="flex items-start gap-4">
                      {creator.picture ? (
                        <img src={creator.picture} alt={creator.name} className="w-16 h-16 rounded-full" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                          <Users className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-heading text-lg font-semibold" data-testid={`creator-name-${index}`}>{creator.name}</h3>
                        <p className="text-sm text-muted-foreground">{creator.email}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Joined: {new Date(creator.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApproveCreator(creator.user_id)}
                        size="sm"
                        className="flex-1 rounded-full bg-green-600 hover:bg-green-700"
                        data-testid={`approve-creator-btn-${index}`}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => openRejectDialog(creator, 'creator')}
                        size="sm"
                        variant="destructive"
                        className="rounded-full"
                        data-testid={`reject-creator-btn-${index}`}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Pending Designs Tab */}
          <TabsContent value="designs" className="space-y-6">
            {loadingDesigns ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : pendingDesigns.length === 0 ? (
              <div className="text-center py-20 border border-border rounded" data-testid="no-pending-designs">
                <FileImage className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-heading text-xl font-semibold mb-2">No Pending Designs</h3>
                <p className="text-muted-foreground">All designs have been reviewed</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="pending-designs-grid">
                {pendingDesigns.map((design, index) => (
                  <motion.div
                    key={design.design_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border border-border rounded overflow-hidden"
                    data-testid={`design-card-${index}`}
                  >
                    <div className="aspect-square bg-muted relative">
                      <img 
                        src={design.image_url} 
                        alt={design.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    
                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="font-heading text-lg font-semibold mb-1" data-testid={`design-title-${index}`}>{design.title}</h3>
                        {design.description && (
                          <p className="text-sm text-muted-foreground">{design.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Submitted: {new Date(design.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => openApproveDesignDialog(design)}
                          size="sm"
                          className="flex-1 rounded-full bg-green-600 hover:bg-green-700"
                          data-testid={`approve-design-btn-${index}`}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => openRejectDialog(design, 'design')}
                          size="sm"
                          variant="destructive"
                          className="rounded-full"
                          data-testid={`reject-design-btn-${index}`}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Live Products Tab */}
          <TabsContent value="products" className="space-y-6">
            {loadingLiveProducts ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : liveProducts.length === 0 ? (
              <div className="text-center py-20 border border-border rounded" data-testid="no-live-products">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-heading text-xl font-semibold mb-2">No Live Products</h3>
                <p className="text-muted-foreground">Products will appear here once designs are approved</p>
              </div>
            ) : (
              <div className="space-y-4" data-testid="live-products-list">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-muted-foreground">Showing {liveProducts.length} product(s)</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {liveProducts.map((product, index) => (
                    <motion.div
                      key={product.product_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border border-border rounded overflow-hidden bg-white"
                      data-testid={`live-product-card-${index}`}
                    >
                      <div className="aspect-square bg-muted relative">
                        <img 
                          src={product.mockup_image || product.design_image} 
                          alt={product.title}
                          className="w-full h-full object-contain"
                        />
                        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${
                          product.product_status === 'live' ? 'bg-green-100 text-green-700' :
                          product.product_status === 'out_of_stock' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {product.product_status === 'live' ? 'LIVE' : 
                           product.product_status === 'out_of_stock' ? 'OUT OF STOCK' : 'DISABLED'}
                        </div>
                      </div>
                      
                      <div className="p-4 space-y-3">
                        <div>
                          <h3 className="font-heading text-lg font-semibold mb-1" data-testid={`product-title-${index}`}>{product.title}</h3>
                          <p className="text-sm text-muted-foreground">by {product.creator_name || 'Unknown Creator'}</p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="font-bold text-lg">₹{product.price?.toFixed(2) || '999.00'}</span>
                            <span className="text-sm text-muted-foreground">{product.units_sold || 0} sold</span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-2">Change Status:</p>
                          <div className="flex gap-2 flex-wrap">
                            {product.product_status !== 'live' && (
                              <Button
                                onClick={() => handleProductStatusChange(product.product_id, 'live')}
                                size="sm"
                                className="rounded-full bg-green-600 hover:bg-green-700 text-xs"
                                data-testid={`enable-product-btn-${index}`}
                              >
                                Enable
                              </Button>
                            )}
                            {product.product_status !== 'out_of_stock' && (
                              <Button
                                onClick={() => handleProductStatusChange(product.product_id, 'out_of_stock')}
                                size="sm"
                                variant="outline"
                                className="rounded-full text-xs"
                                data-testid={`out-of-stock-btn-${index}`}
                              >
                                Out of Stock
                              </Button>
                            )}
                            {product.product_status !== 'disabled' && (
                              <Button
                                onClick={() => handleProductStatusChange(product.product_id, 'disabled')}
                                size="sm"
                                variant="destructive"
                                className="rounded-full text-xs"
                                data-testid={`disable-product-btn-${index}`}
                              >
                                Disable
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* All Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            {loadingOrders ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-20 border border-border rounded" data-testid="no-orders">
                <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-heading text-xl font-semibold mb-2">No Orders Yet</h3>
                <p className="text-muted-foreground">Orders will appear here once customers start purchasing</p>
              </div>
            ) : (
              <div className="space-y-4" data-testid="admin-orders-list">
                {orders.map((order, index) => (
                  <motion.div
                    key={order.order_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border border-border p-6 rounded bg-white"
                    data-testid={`order-card-${index}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-heading text-lg font-semibold mb-1">
                          Order #{order.order_id.slice(-8).toUpperCase()}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'paid' ? 'bg-green-100 text-green-700' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {order.status.toUpperCase()}
                        </span>
                        <p className="font-heading text-xl font-bold mt-2">₹{order.total_amount.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="border-t border-border pt-4 mb-4">
                      <h4 className="font-semibold mb-3 text-sm">Items:</h4>
                      <div className="space-y-2">
                        {order.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex justify-between text-sm bg-muted/50 p-3 rounded">
                            <div>
                              <p className="font-medium">{item.title}</p>
                              {item.creator_name && (
                                <p className="text-xs text-muted-foreground">Creator: {item.creator_name}</p>
                              )}
                              <p className="text-xs text-muted-foreground">Size: {item.size} × {item.quantity}</p>
                            </div>
                            <p className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Revenue Splits */}
                    {order.revenue_splits && order.revenue_splits.length > 0 && (
                      <div className="border-t border-border pt-4 mb-4">
                        <h4 className="font-semibold mb-3 text-sm">Revenue Split:</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {order.revenue_splits.map((split, splitIndex) => (
                            <div key={splitIndex} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Creator (80%):</span>
                                <span className="font-semibold text-green-600">₹{split.creator_amount.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Platform (20%):</span>
                                <span className="font-semibold text-blue-600">₹{split.platform_amount.toFixed(2)}</span>
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Status: {split.status === 'pending' ? '⏳ Pending Settlement' : '✅ Completed'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Shipping Address */}
                    <div className="border-t border-border pt-4">
                      <h4 className="font-semibold mb-2 text-sm">Shipping To:</h4>
                      <div className="text-sm text-muted-foreground">
                        <p>{order.shipping_address.name}</p>
                        <p>{order.shipping_address.address}</p>
                        <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.pincode}</p>
                        <p>{order.shipping_address.phone}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {loadingAnalytics ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : analytics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Users Stats */}
                <div className="border border-border p-6 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <Users className="h-8 w-8 text-[#0047FF]" />
                    <span className="text-3xl font-heading font-bold">{analytics.users.total}</span>
                  </div>
                  <h3 className="font-semibold">Total Users</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Creators: {analytics.users.creators}</p>
                    <p className="text-yellow-600">Pending: {analytics.users.pending_creators}</p>
                    <p className="text-green-600">Approved: {analytics.users.approved_creators}</p>
                  </div>
                </div>

                {/* Designs Stats */}
                <div className="border border-border p-6 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <FileImage className="h-8 w-8 text-[#0047FF]" />
                    <span className="text-3xl font-heading font-bold">{analytics.designs.total}</span>
                  </div>
                  <h3 className="font-semibold">Total Designs</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="text-yellow-600">Pending: {analytics.designs.pending}</p>
                    <p className="text-green-600">Approved: {analytics.designs.approved}</p>
                  </div>
                </div>

                {/* Products Stats */}
                <div className="border border-border p-6 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <Package className="h-8 w-8 text-[#0047FF]" />
                    <span className="text-3xl font-heading font-bold">{analytics.products.total}</span>
                  </div>
                  <h3 className="font-semibold">Live Products</h3>
                  <p className="text-sm text-muted-foreground">Available on marketplace</p>
                </div>

                {/* Orders Stats */}
                <div className="border border-border p-6 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <TrendingUp className="h-8 w-8 text-[#0047FF]" />
                    <span className="text-3xl font-heading font-bold">{analytics.orders.total}</span>
                  </div>
                  <h3 className="font-semibold">Total Orders</h3>
                  <p className="text-sm text-muted-foreground">
                    {analytics.orders.total_units} units sold
                  </p>
                </div>

                {/* Revenue Stats */}
                <div className="border border-[#0047FF] p-6 rounded space-y-2 md:col-span-2 bg-[#0047FF]/5">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-10 w-10 text-[#0047FF]" />
                    <div>
                      <p className="text-sm text-muted-foreground">Gross Revenue</p>
                      <p className="text-4xl font-heading font-bold">₹{analytics.revenue.total_revenue.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex gap-6 pt-4 border-t border-border">
                    <div>
                      <p className="text-sm text-muted-foreground">Platform Earnings (20%)</p>
                      <p className="text-2xl font-semibold text-green-600">
                        ₹{analytics.revenue.platform_earnings.toFixed(2)}
                        {analytics.revenue.platform_earnings === 0 && analytics.orders.total > 0 && (
                          <span className="text-xs text-yellow-600 ml-2">⏳ Pending settlement</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Creator Earnings (80%)</p>
                      <p className="text-2xl font-semibold">
                        ₹{analytics.revenue.creator_earnings.toFixed(2)}
                        {analytics.revenue.creator_earnings === 0 && analytics.orders.total > 0 && (
                          <span className="text-xs text-yellow-600 ml-2">⏳ Pending settlement</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Failed to load analytics</p>
              </div>
            )}
          </TabsContent>

          {/* Printify Setup Tab */}
          <TabsContent value="printify" className="space-y-6">
            {loadingPrintify ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : printifyData ? (
              <div className="space-y-6">
                {/* Status Card */}
                <div className={`border ${printifyData.mock_mode ? 'border-yellow-600 bg-yellow-600/5' : 'border-green-600 bg-green-600/5'} p-6 rounded`}>
                  <div className="flex items-center gap-3">
                    {printifyData.mock_mode ? (
                      <>
                        <AlertCircle className="h-8 w-8 text-yellow-600" />
                        <div>
                          <h3 className="font-heading text-lg font-semibold text-yellow-600">Mock Mode Active</h3>
                          <p className="text-sm text-muted-foreground">Printify API credentials not configured. Using mock data for development.</p>
                          <Button 
                            onClick={() => window.open('/PRINTIFY_SETUP.md', '_blank')}
                            variant="outline"
                            size="sm"
                            className="mt-3 rounded-full"
                          >
                            View Setup Guide
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-8 w-8 text-green-600" />
                        <div>
                          <h3 className="font-heading text-lg font-semibold text-green-600">Printify Connected</h3>
                          <p className="text-sm text-muted-foreground">Real-time integration active</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Blueprints */}
                <div>
                  <h3 className="font-heading text-2xl font-bold mb-4">Available Blueprints</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {blueprints.map((blueprint) => (
                      <div key={blueprint.id} className="border border-border p-6 rounded space-y-3">
                        {blueprint.images && blueprint.images[0] && (
                          <img src={blueprint.images[0]} alt={blueprint.title} className="w-full h-40 object-contain bg-muted rounded" />
                        )}
                        <div>
                          <h4 className="font-heading font-semibold">{blueprint.title}</h4>
                          <p className="text-sm text-muted-foreground">{blueprint.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {blueprint.brand} - {blueprint.model}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>

      {/* Approve Design Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Approve Design</DialogTitle>
            <DialogDescription>
              Select product type and approve this design. A Printify product will be created automatically.
            </DialogDescription>
          </DialogHeader>
          
          {selectedDesign && (
            <div className="space-y-4">
              <div className="aspect-square bg-muted rounded overflow-hidden">
                <img src={selectedDesign.image_url} alt={selectedDesign.title} className="w-full h-full object-contain" />
              </div>
              
              <div>
                <Label>Product Type</Label>
                <select
                  value={selectedBlueprint}
                  onChange={(e) => setSelectedBlueprint(parseInt(e.target.value))}
                  className="w-full mt-2 p-2 border border-border rounded bg-background"
                >
                  <option value={6}>T-Shirt (Unisex Heavy Cotton)</option>
                  <option value={77}>Hoodie (Unisex Heavy Blend)</option>
                </select>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleApproveDesign}
                  className="flex-1 rounded-full bg-green-600 hover:bg-green-700"
                  data-testid="confirm-approve-design-btn"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve & Create Product
                </Button>
                <Button
                  onClick={() => setApproveDialogOpen(false)}
                  variant="outline"
                  className="rounded-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              Reject {actionType === 'creator' ? 'Creator' : 'Design'}
            </DialogTitle>
            <DialogDescription>
              Provide a reason for rejection. This will be recorded for reference.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason for Rejection</Label>
              <Textarea
                id="reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason..."
                className="mt-2"
                rows={4}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={actionType === 'creator' ? handleRejectCreator : handleRejectDesign}
                variant="destructive"
                className="flex-1 rounded-full"
                data-testid="confirm-reject-btn"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Confirm Rejection
              </Button>
              <Button
                onClick={() => {
                  setRejectDialogOpen(false);
                  setRejectReason('');
                }}
                variant="outline"
                className="rounded-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
