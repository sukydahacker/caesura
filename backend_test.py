import requests
import json
import sys
import tempfile
from datetime import datetime
from pathlib import Path
import base64
from io import BytesIO
from PIL import Image
import io

class CaesuraAPITester:
    def __init__(self, base_url="https://caesura-admin-debug.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.session_token = "test_session_1771657037215"  # Test session from MongoDB
        self.user_id = "test-user-1771657037215"
        self.tests_run = 0
        self.tests_passed = 0
        
        # Storage for created resources
        self.created_design_id = None
        self.created_product_id = None
        self.cart_item_id = None
        self.order_id = None

    def headers(self):
        """Get headers with authentication"""
        return {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.session_token}'
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = headers or self.headers()

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.text else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text[:200]}...")
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth_me(self):
        """Test authentication endpoint"""
        success, response = self.run_test(
            "Get Current User (/auth/me)",
            "GET",
            "auth/me",
            200
        )
        if success and 'user_id' in response:
            print(f"   User: {response.get('name')} ({response.get('email')})")
            return True
        return False

    def test_upload_design_image(self):
        """Test design image upload"""
        # Create a simple test image
        img = Image.new('RGB', (100, 100), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        url = f"{self.base_url}/upload/design"
        files = {'file': ('test.png', img_bytes, 'image/png')}
        headers = {'Authorization': f'Bearer {self.session_token}'}  # No Content-Type for multipart
        
        self.tests_run += 1
        print(f"\n🔍 Testing Upload Design Image...")
        
        try:
            response = requests.post(url, files=files, headers=headers, timeout=30)
            success = response.status_code == 200
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                return True, response.json()
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                print(f"Response: {response.text[:200]}...")
                return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_create_design(self, image_url):
        """Test creating a design"""
        design_data = {
            "title": "Test Design",
            "description": "A test design for API testing",
            "image_url": image_url,
            "tags": ["test", "api"]
        }
        
        success, response = self.run_test(
            "Create Design",
            "POST",
            "designs",
            200,
            data=design_data
        )
        
        if success and 'design_id' in response:
            self.created_design_id = response['design_id']
            print(f"   Created design: {self.created_design_id}")
            return True
        return False

    def test_get_designs(self):
        """Test getting user's designs"""
        success, response = self.run_test(
            "Get User Designs",
            "GET",
            "designs",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} designs")
            return True
        return False

    def test_get_design(self):
        """Test getting a specific design"""
        if not self.created_design_id:
            print("❌ Skipping - No design ID available")
            return False
            
        success, response = self.run_test(
            "Get Specific Design",
            "GET",
            f"designs/{self.created_design_id}",
            200
        )
        
        if success and response.get('design_id') == self.created_design_id:
            return True
        return False

    def test_create_product(self):
        """Test creating a product from design"""
        if not self.created_design_id:
            print("❌ Skipping - No design ID available")
            return False
            
        product_data = {
            "design_id": self.created_design_id,
            "title": "Test Product T-Shirt",
            "description": "Test product description",
            "apparel_type": "tshirt",
            "sizes": ["S", "M", "L", "XL"],
            "price": 999.0
        }
        
        success, response = self.run_test(
            "Create Product",
            "POST",
            "products",
            200,
            data=product_data
        )
        
        if success and 'product_id' in response:
            self.created_product_id = response['product_id']
            print(f"   Created product: {self.created_product_id}")
            return True
        return False

    def test_get_products(self):
        """Test getting marketplace products"""
        success, response = self.run_test(
            "Get Marketplace Products",
            "GET",
            "products",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} products")
            return True
        return False

    def test_get_product(self):
        """Test getting a specific product"""
        if not self.created_product_id:
            print("❌ Skipping - No product ID available")
            return False
            
        success, response = self.run_test(
            "Get Specific Product",
            "GET",
            f"products/{self.created_product_id}",
            200
        )
        
        if success and response.get('product_id') == self.created_product_id:
            return True
        return False

    def test_add_to_cart(self):
        """Test adding product to cart"""
        if not self.created_product_id:
            print("❌ Skipping - No product ID available")
            return False
            
        cart_data = {
            "product_id": self.created_product_id,
            "size": "M",
            "quantity": 1
        }
        
        success, response = self.run_test(
            "Add to Cart",
            "POST",
            "cart",
            200,
            data=cart_data
        )
        
        if success and response.get('message') == 'Added to cart':
            self.cart_item_id = response.get('cart_item_id')
            return True
        return False

    def test_get_cart(self):
        """Test getting cart items"""
        success, response = self.run_test(
            "Get Cart",
            "GET",
            "cart",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} cart items")
            return True
        return False

    def test_update_cart_item(self):
        """Test updating cart item quantity"""
        if not self.cart_item_id:
            print("❌ Skipping - No cart item ID available")
            return False
            
        success, response = self.run_test(
            "Update Cart Item",
            "PUT",
            f"cart/{self.cart_item_id}",
            200,
            data={"quantity": 2}
        )
        
        return success

    def test_create_payment_order(self):
        """Test creating payment order"""
        success, response = self.run_test(
            "Create Payment Order",
            "POST",
            "payments/create-order",
            200,
            data={"amount": 999.0}
        )
        
        if success and 'order_id' in response:
            print(f"   Payment order: {response['order_id']}")
            return True
        return False

    def test_verify_payment(self):
        """Test payment verification (mock)"""
        success, response = self.run_test(
            "Verify Payment (Mock)",
            "POST",
            "payments/verify",
            200,
            data={"mock": True}
        )
        
        if success and response.get('verified') and response.get('mock'):
            return True
        return False

    def test_create_order(self):
        """Test creating an order"""
        if not self.created_product_id:
            print("❌ Skipping - No product ID available")
            return False
            
        order_data = {
            "items": [
                {
                    "product_id": self.created_product_id,
                    "title": "Test Product T-Shirt",
                    "size": "M",
                    "quantity": 2,
                    "price": 999.0
                }
            ],
            "total_amount": 1998.0,
            "razorpay_order_id": "order_mock_123",
            "razorpay_payment_id": "pay_mock_123",
            "shipping_address": {
                "name": "Test User",
                "email": "test@example.com",
                "phone": "+91 9999999999",
                "address": "123 Test Street",
                "city": "Test City",
                "state": "Test State",
                "pincode": "123456"
            }
        }
        
        success, response = self.run_test(
            "Create Order",
            "POST",
            "orders",
            200,
            data=order_data
        )
        
        if success and 'order_id' in response:
            self.order_id = response['order_id']
            print(f"   Created order: {self.order_id}")
            return True
        return False

    def test_get_orders(self):
        """Test getting user's orders"""
        success, response = self.run_test(
            "Get User Orders",
            "GET",
            "orders",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} orders")
            return True
        return False

    def test_get_order(self):
        """Test getting a specific order"""
        if not self.order_id:
            print("❌ Skipping - No order ID available")
            return False
            
        success, response = self.run_test(
            "Get Specific Order",
            "GET",
            f"orders/{self.order_id}",
            200
        )
        
        if success and response.get('order_id') == self.order_id:
            return True
        return False

    def test_remove_from_cart(self):
        """Test removing item from cart"""
        if not self.cart_item_id:
            print("❌ Skipping - No cart item ID available")
            return False
            
        success, response = self.run_test(
            "Remove from Cart",
            "DELETE",
            f"cart/{self.cart_item_id}",
            200
        )
        
        return success

    def test_delete_design(self):
        """Test deleting a design"""
        if not self.created_design_id:
            print("❌ Skipping - No design ID available")
            return False
            
        success, response = self.run_test(
            "Delete Design",
            "DELETE",
            f"designs/{self.created_design_id}",
            200
        )
        
        return success

def main():
    """Run comprehensive API tests"""
    print("🚀 Starting Caesura API Tests...")
    print("=" * 50)
    
    tester = CaesuraAPITester()
    
    # Test sequence following the user journey
    tests = [
        # Authentication
        ("Authentication", tester.test_auth_me),
        
        # Design Management
        ("Upload Design Image", lambda: tester.test_upload_design_image()[0] if tester.test_upload_design_image()[0] else False),
        ("Create Design", lambda: tester.test_create_design(tester.test_upload_design_image()[1].get('image_url', '')) if tester.test_upload_design_image()[0] else False),
        ("Get User Designs", tester.test_get_designs),
        ("Get Specific Design", tester.test_get_design),
        
        # Product Management
        ("Create Product", tester.test_create_product),
        ("Get Marketplace Products", tester.test_get_products),
        ("Get Specific Product", tester.test_get_product),
        
        # Shopping Cart
        ("Add to Cart", tester.test_add_to_cart),
        ("Get Cart", tester.test_get_cart),
        ("Update Cart Item", tester.test_update_cart_item),
        
        # Payment & Orders
        ("Create Payment Order", tester.test_create_payment_order),
        ("Verify Payment", tester.test_verify_payment),
        ("Create Order", tester.test_create_order),
        ("Get User Orders", tester.test_get_orders),
        ("Get Specific Order", tester.test_get_order),
        
        # Cleanup
        ("Remove from Cart", tester.test_remove_from_cart),
        ("Delete Design", tester.test_delete_design),
    ]
    
    # Handle design image upload and use for create design
    upload_success, upload_response = tester.test_upload_design_image()
    if upload_success:
        image_url = upload_response.get('image_url', '')
        tester.test_create_design(image_url)
    
    # Run remaining tests
    for test_name, test_func in tests[2:]:  # Skip first 2 as we already ran them
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with error: {str(e)}")
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Tests completed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())