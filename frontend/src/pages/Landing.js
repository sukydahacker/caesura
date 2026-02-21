import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import { ArrowRight, Sparkles, Shirt, Package } from 'lucide-react';

export default function Landing() {
  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onLogin={handleLogin} />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden noise-texture bg-white">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.pexels.com/photos/30783645/pexels-photo-30783645.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
            alt="Hero background"
            className="w-full h-full object-cover opacity-10"
          />
        </div>
        
        <div className="relative z-10 max-w-[1600px] mx-auto px-6 md:px-12 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl"
          >
            <h1 className="font-heading text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter leading-[0.8] mb-8">
              Your Design.
              <br />
              <span className="text-[#0047FF]">Your Fashion.</span>
            </h1>
            
            <p className="font-subheading text-lg md:text-xl max-w-2xl mb-12 text-muted-foreground leading-relaxed">
              Caesura is a premium streetwear marketplace where creators upload their designs and turn them into wearable art. Print-on-demand meets community-driven fashion.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleLogin}
                size="lg"
                className="h-14 px-10 rounded-full font-subheading text-base bg-primary hover:bg-primary/90 transition-transform hover:scale-105"
                data-testid="hero-upload-design-btn"
              >
                Upload Your Design
                <Sparkles className="ml-2 h-5 w-5" />
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/marketplace'}
                size="lg"
                variant="outline"
                className="h-14 px-10 rounded-full font-subheading text-base border-2 border-primary hover:bg-primary hover:text-white transition-transform hover:scale-105"
                data-testid="hero-browse-marketplace-btn"
              >
                Browse Marketplace
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32 bg-[#F8F8F8]">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12">
          <h2 className="font-heading text-4xl md:text-6xl font-bold tracking-tight mb-20 text-foreground">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-heading text-2xl font-semibold text-foreground">1. Upload Your Design</h3>
              <p className="text-muted-foreground leading-relaxed">
                Sign in with Google and upload your artwork. Our platform handles the rest.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                <Shirt className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-heading text-2xl font-semibold text-foreground">2. Preview on Apparel</h3>
              <p className="text-muted-foreground leading-relaxed">
                See your design on T-shirts and hoodies. Choose sizes and set your price.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                <Package className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-heading text-2xl font-semibold text-foreground">3. Start Selling</h3>
              <p className="text-muted-foreground leading-relaxed">
                Publish to our marketplace. When someone buys, we handle printing and shipping.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-primary text-white">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-5xl md:text-7xl font-bold tracking-tight mb-8">
              Ready to Create?
            </h2>
            <p className="font-subheading text-xl mb-12 opacity-90">
              Join our community of creators and start selling your designs today.
            </p>
            <Button 
              onClick={handleLogin}
              size="lg"
              className="h-14 px-10 rounded-full font-subheading text-base bg-white text-black hover:bg-white/90 transition-transform hover:scale-105"
              data-testid="cta-get-started-btn"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-heading text-2xl font-bold">CAESURA</p>
            <p className="text-sm text-muted-foreground">© 2026 Caesura. Premium streetwear marketplace.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}