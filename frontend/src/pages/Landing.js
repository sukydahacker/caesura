import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { ArrowRight, Upload, Palette, Truck, ShieldCheck, Star } from 'lucide-react';
import { useRef } from 'react';

export default function Landing() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  const handleLogin = () => {
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
  };

  const staggerContainer = {
    initial: {},
    whileInView: { transition: { staggerChildren: 0.1 } },
    viewport: { once: true }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar onLogin={handleLogin} />
      
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden">
        <motion.div 
          style={{ opacity: heroOpacity, y: heroY }}
          className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-20 pt-32 pb-20 w-full"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-6"
              >
                CREATOR-DRIVEN STREETWEAR
              </motion.p>
              
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter leading-[0.9] mb-8"
              >
                Your designs,
                <br />
                <span className="text-[#0047FF]">brought to life.</span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="font-subheading text-lg md:text-xl max-w-xl text-muted-foreground leading-relaxed mb-10"
              >
                Caesura transforms your creative vision into premium streetwear. 
                Upload, preview, sell — we handle the rest.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button 
                  onClick={handleLogin}
                  size="lg"
                  className="h-14 px-10 rounded-full font-subheading text-base bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  data-testid="hero-start-creating-btn"
                >
                  Start Creating
                  <Upload className="ml-2 h-5 w-5" />
                </Button>
                
                <Button 
                  onClick={() => window.location.href = '/marketplace'}
                  size="lg"
                  variant="outline"
                  className="h-14 px-10 rounded-full font-subheading text-base border-2 border-foreground/20 hover:border-foreground hover:bg-transparent transition-all hover:scale-[1.02] active:scale-[0.98]"
                  data-testid="hero-shop-collection-btn"
                >
                  Shop the Collection
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="lg:col-span-5 relative"
            >
              <div className="aspect-[4/5] relative">
                <img 
                  src="https://images.unsplash.com/photo-1508427953056-b00b8d78ebf5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzl8MHwxfHNlYXJjaHwxfHxzdHJlZXR3ZWFyJTIwZmFzaGlvbiUyMG1vZGVsJTIwbWluaW1hbHxlbnwwfHx8fDE3NzE3NzYwNDZ8MA&ixlib=rb-4.1.0&q=85"
                  alt="Streetwear fashion"
                  className="w-full h-full object-cover"
                />
                <div className="absolute -bottom-6 -left-6 bg-white p-4 shadow-2xl">
                  <p className="font-mono text-xs tracking-wider text-muted-foreground">FEATURED</p>
                  <p className="font-heading text-lg font-bold">Limited Drop</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* What is Caesura Section */}
      <section className="py-32 md:py-40 bg-[#FAFAFA]">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <motion.div {...fadeInUp} className="lg:col-span-5">
              <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4">
                THE PLATFORM
              </p>
              <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
                What is Caesura?
              </h2>
              <p className="font-subheading text-lg text-muted-foreground leading-relaxed mb-6">
                Caesura is the bridge between your imagination and the world. 
                A premium marketplace where independent creators sell original 
                streetwear — no inventory, no upfront costs, no limits.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Every piece is made-to-order, ensuring zero waste and maximum 
                creative freedom. Your art, your rules.
              </p>
            </motion.div>
            
            <motion.div 
              {...fadeInUp}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-7"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-[3/4]">
                  <img 
                    src="https://images.unsplash.com/photo-1581655353564-df123a1eb820?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNzl8MHwxfHNlYXJjaHwxfHxncmFwaGljJTIwdHNoaXJ0JTIwZGVzaWduJTIwbW9ja3VwJTIwd2hpdGV8ZW58MHx8fHwxNzcxNzc2MDUyfDA&ixlib=rb-4.1.0&q=85"
                    alt="T-shirt mockup"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-[3/4] mt-12">
                  <img 
                    src="https://images.unsplash.com/photo-1627225793904-a2f900a6e4cf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNzl8MHwxfHNlYXJjaHw0fHxncmFwaGljJTIwdHNoaXJ0JTIwZGVzaWduJTIwbW9ja3VwJTIwd2hpdGV8ZW58MHx8fHwxNzcxNzc2MDUyfDA&ixlib=rb-4.1.0&q=85"
                    alt="Streetwear model"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Creator Section */}
      <section className="py-32 md:py-40 bg-white">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-20">
          <motion.div {...fadeInUp} className="max-w-4xl mb-20">
            <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4">
              FOR CREATORS
            </p>
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
              You design.<br />
              We produce.<br />
              <span className="text-[#0047FF]">You sell.</span>
            </h2>
          </motion.div>
          
          <motion.div 
            {...staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8"
          >
            {[
              {
                number: "01",
                title: "Zero Inventory",
                description: "No upfront costs. No storage. We print and ship each order on demand."
              },
              {
                number: "02", 
                title: "Full Creative Control",
                description: "Your designs, your prices, your brand. We're just the production partner."
              },
              {
                number: "03",
                title: "80% Revenue Share",
                description: "Keep the majority of every sale. Your creativity should pay off."
              }
            ].map((item, index) => (
              <motion.div 
                key={index}
                variants={{
                  initial: { opacity: 0, y: 30 },
                  whileInView: { opacity: 1, y: 0 }
                }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="space-y-4"
              >
                <span className="font-mono text-5xl font-bold text-[#0047FF]/20">{item.number}</span>
                <h3 className="font-heading text-2xl font-bold">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Shopper Section */}
      <section className="py-32 md:py-40 bg-[#09090B] text-white">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeInUp}>
              <p className="font-mono text-xs tracking-[0.3em] text-white/50 mb-4">
                FOR SHOPPERS
              </p>
              <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-8">
                Wear what
                <br />
                no one else has.
              </h2>
              <p className="text-lg text-white/70 leading-relaxed mb-8 max-w-lg">
                Every piece on Caesura is original art from independent creators. 
                No mass production. No copies. Just authentic streetwear that 
                tells a story.
              </p>
              <div className="space-y-4">
                {[
                  "Curated designs from vetted artists",
                  "Premium quality printing and fabrics",
                  "Supporting independent creators directly"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-[#0047FF] rounded-full" />
                    <span className="text-white/80">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            
            <motion.div 
              {...fadeInUp}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="aspect-square">
                <img 
                  src="https://images.unsplash.com/photo-1622236405896-f0ee41309aa3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzl8MHwxfHNlYXJjaHwyfHxzdHJlZXR3ZWFyJTIwZmFzaGlvbiUyMG1vZGVsJTIwbWluaW1hbHxlbnwwfHx8fDE3NzE3NzYwNDZ8MA&ixlib=rb-4.1.0&q=85"
                  alt="Unique streetwear"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-32 md:py-40 bg-white">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-20">
          <motion.div {...fadeInUp} className="text-center mb-20">
            <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4">
              THE PROCESS
            </p>
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              How it works
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                icon: <Upload className="h-8 w-8" />,
                title: "Upload",
                description: "Sign in and upload your original artwork in high resolution."
              },
              {
                icon: <Palette className="h-8 w-8" />,
                title: "Preview",
                description: "See your design on T-shirts and hoodies. Adjust and perfect."
              },
              {
                icon: <ShieldCheck className="h-8 w-8" />,
                title: "Approval",
                description: "Our team reviews for quality. Once approved, you're live."
              },
              {
                icon: <Truck className="h-8 w-8" />,
                title: "Sell & Ship",
                description: "Customers order. We print and ship. You earn."
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative"
              >
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-border -translate-x-1/2 z-0" />
                )}
                <div className="relative z-10 space-y-4">
                  <div className="w-16 h-16 bg-[#FAFAFA] flex items-center justify-center">
                    {step.icon}
                  </div>
                  <h3 className="font-heading text-xl font-bold">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Showcase Section */}
      <section className="py-32 md:py-40 bg-[#FAFAFA]">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-20">
          <motion.div {...fadeInUp} className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
            <div>
              <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4">
                THE COLLECTION
              </p>
              <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Featured drops
              </h2>
            </div>
            <Button 
              onClick={() => window.location.href = '/marketplace'}
              variant="outline"
              className="rounded-full font-subheading border-foreground/20 hover:border-foreground hover:bg-transparent"
              data-testid="view-all-btn"
            >
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                image: "https://images.unsplash.com/photo-1739001411231-4fc0f4140259?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNzl8MHwxfHNlYXJjaHwzfHxncmFwaGljJTIwdHNoaXJ0JTIwZGVzaWduJTIwbW9ja3VwJTIwd2hpdGV8ZW58MHx8fHwxNzcxNzc2MDUyfDA&ixlib=rb-4.1.0&q=85",
                title: "Urban Canvas",
                type: "T-Shirt",
                creator: "@artisan_co"
              },
              {
                image: "https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
                title: "Midnight Form",
                type: "T-Shirt",
                creator: "@noir_studio"
              },
              {
                image: "https://images.unsplash.com/photo-1722310752951-4d459d28c678?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNzl8MHwxfHNlYXJjaHwyfHxncmFwaGljJTIwdHNoaXJ0JTIwZGVzaWduJTIwbW9ja3VwJTIwd2hpdGV8ZW58MHx8fHwxNzcxNzc2MDUyfDA&ixlib=rb-4.1.0&q=85",
                title: "Pure Form",
                type: "T-Shirt",
                creator: "@minimal_labs"
              }
            ].map((product, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onClick={() => window.location.href = '/marketplace'}
                className="group cursor-pointer"
                data-testid={`featured-product-${index}`}
              >
                <div className="aspect-[3/4] mb-4 overflow-hidden bg-white">
                  <img 
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <p className="font-mono text-xs tracking-wider text-muted-foreground mb-1">{product.type}</p>
                <h3 className="font-heading text-xl font-bold mb-1">{product.title}</h3>
                <p className="text-sm text-muted-foreground">{product.creator}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quality & Trust Section */}
      <section className="py-32 md:py-40 bg-white">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeInUp} className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="aspect-square bg-[#FAFAFA] flex items-center justify-center">
                    <ShieldCheck className="h-16 w-16 text-[#0047FF]" />
                  </div>
                  <div className="aspect-square bg-[#09090B] flex items-center justify-center">
                    <Star className="h-16 w-16 text-white" />
                  </div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="aspect-square bg-[#09090B] flex items-center justify-center">
                    <span className="font-heading text-5xl font-bold text-white">100%</span>
                  </div>
                  <div className="aspect-square bg-[#FAFAFA] flex items-center justify-center">
                    <span className="font-heading text-5xl font-bold">80/20</span>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div {...fadeInUp} className="order-1 lg:order-2">
              <p className="font-mono text-xs tracking-[0.3em] text-muted-foreground mb-4">
                OUR PROMISE
              </p>
              <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-8">
                Curated quality,
                <br />
                <span className="text-[#0047FF]">always.</span>
              </h2>
              <div className="space-y-6">
                <p className="text-muted-foreground leading-relaxed">
                  Every design on Caesura is reviewed by our team. We ensure originality, 
                  print quality, and creative merit before anything goes live.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Our 80/20 revenue split means creators keep the lion's share. 
                  We only succeed when our community thrives.
                </p>
                <div className="pt-4">
                  <p className="font-heading text-lg font-bold mb-2">What you get:</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Premium cotton apparel (180-200 GSM)</li>
                    <li>• DTG printing for vibrant, lasting colors</li>
                    <li>• Quality control on every single order</li>
                    <li>• Global shipping with tracking</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 md:py-40 bg-[#09090B]">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-20">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1] mb-8">
              Turn your ideas
              <br />
              into streetwear.
            </h2>
            <p className="font-subheading text-lg md:text-xl text-white/60 mb-12 max-w-2xl mx-auto">
              Join thousands of creators who've launched their fashion brand with zero upfront cost.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleLogin}
                size="lg"
                className="h-14 px-12 rounded-full font-subheading text-base bg-white text-[#09090B] hover:bg-white/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                data-testid="final-cta-create-btn"
              >
                Start Creating Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                onClick={() => window.location.href = '/marketplace'}
                size="lg"
                variant="outline"
                className="h-14 px-12 rounded-full font-subheading text-base border-white/30 text-white hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                data-testid="final-cta-shop-btn"
              >
                Explore the Shop
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-border/50 bg-white">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <p className="font-heading text-3xl font-bold mb-4">CAESURA</p>
              <p className="text-muted-foreground max-w-sm leading-relaxed">
                The premium marketplace for creator-driven streetwear. 
                Your designs, your brand, your success.
              </p>
            </div>
            <div>
              <p className="font-heading font-bold mb-4">Platform</p>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="/marketplace" className="hover:text-foreground transition-colors">Shop</a></li>
                <li><a href="/dashboard" className="hover:text-foreground transition-colors">Create</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <p className="font-heading font-bold mb-4">Company</p>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 Caesura. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Made for creators, by creators.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
