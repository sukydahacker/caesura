"""
Backend tests for Live Products Admin functionality
- GET /api/admin/products/live: Fetches all approved products for admin
- PUT /api/admin/products/{id}/status: Updates product status (live, out_of_stock, disabled)
- GET /api/products: Storefront - filters products by is_approved=True AND status in ['live', 'out_of_stock']
"""
import pytest
import requests
import os
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test fixtures
@pytest.fixture(scope="module")
def admin_session():
    """Create admin session token via MongoDB"""
    import subprocess
    result = subprocess.run([
        'mongosh', '--quiet', '--eval', '''
        use('test_database');
        var sessionToken = 'pytest_admin_' + Date.now();
        db.user_sessions.deleteMany({session_token: /pytest_admin/});
        db.user_sessions.insertOne({
            user_id: 'user_02b6bf33eca1',
            session_token: sessionToken,
            expires_at: new Date(Date.now() + 24*60*60*1000),
            created_at: new Date()
        });
        print(sessionToken);
        '''
    ], capture_output=True, text=True)
    token = result.stdout.strip()
    yield token
    # Cleanup
    subprocess.run([
        'mongosh', '--quiet', '--eval', f'''
        use('test_database');
        db.user_sessions.deleteMany({{session_token: '{token}'}});
        '''
    ])


@pytest.fixture
def api_client(admin_session):
    """Requests session with admin auth"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {admin_session}"
    })
    return session


class TestStorefrontProducts:
    """Test /api/products (public storefront endpoint)"""
    
    def test_storefront_returns_only_approved_live_products(self):
        """Storefront should only show products where is_approved=True AND status in ['live', 'out_of_stock']"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        products = response.json()
        assert isinstance(products, list)
        
        # Verify all returned products meet criteria
        for product in products:
            assert product.get('is_approved') == True, f"Product {product.get('product_id')} should be approved"
            assert product.get('product_status') in ['live', 'out_of_stock'], \
                f"Product {product.get('product_id')} has invalid status: {product.get('product_status')}"
            # Disabled products should NOT appear
            assert product.get('product_status') != 'disabled'


class TestAdminLiveProducts:
    """Test /api/admin/products/live endpoint"""
    
    def test_get_live_products_requires_auth(self):
        """Should return 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/products/live")
        assert response.status_code == 401
    
    def test_get_live_products_returns_all_approved(self, api_client):
        """Admin endpoint should return ALL approved products (including disabled)"""
        response = api_client.get(f"{BASE_URL}/api/admin/products/live")
        assert response.status_code == 200
        
        products = response.json()
        assert isinstance(products, list)
        assert len(products) >= 1, "Should have at least one approved product"
        
        # Verify all products are approved
        for product in products:
            assert product.get('is_approved') == True
            assert product.get('is_active') == True
            # Should include enriched fields
            assert 'creator_name' in product
            assert 'units_sold' in product
    
    def test_live_products_includes_all_statuses(self, api_client):
        """Admin endpoint should show live, out_of_stock, AND disabled products"""
        response = api_client.get(f"{BASE_URL}/api/admin/products/live")
        assert response.status_code == 200
        
        products = response.json()
        # Any status is valid
        valid_statuses = ['live', 'out_of_stock', 'disabled']
        for product in products:
            status = product.get('product_status', 'live')  # default to live
            assert status in valid_statuses, f"Invalid status: {status}"


class TestProductStatusUpdate:
    """Test PUT /api/admin/products/{id}/status endpoint"""
    
    @pytest.fixture
    def test_product_id(self):
        """Get a product ID for testing status changes"""
        response = requests.get(f"{BASE_URL}/api/products")
        products = response.json()
        if products:
            return products[0]['product_id']
        pytest.skip("No products available for testing")
    
    def test_update_status_requires_auth(self, test_product_id):
        """Should return 401 without authentication"""
        response = requests.put(
            f"{BASE_URL}/api/admin/products/{test_product_id}/status",
            json={"status": "disabled"}
        )
        assert response.status_code == 401
    
    def test_update_status_to_disabled(self, api_client, test_product_id):
        """Should successfully disable a product"""
        # Disable product
        response = api_client.put(
            f"{BASE_URL}/api/admin/products/{test_product_id}/status",
            json={"status": "disabled"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data['new_status'] == 'disabled'
        
        # Verify product is hidden from storefront
        storefront_response = requests.get(f"{BASE_URL}/api/products")
        storefront_products = storefront_response.json()
        product_ids = [p['product_id'] for p in storefront_products]
        assert test_product_id not in product_ids, "Disabled product should be hidden from storefront"
        
        # Verify product still appears in admin panel
        admin_response = api_client.get(f"{BASE_URL}/api/admin/products/live")
        admin_products = admin_response.json()
        admin_product_ids = [p['product_id'] for p in admin_products]
        assert test_product_id in admin_product_ids, "Disabled product should still appear in admin"
        
        # Revert to live
        api_client.put(
            f"{BASE_URL}/api/admin/products/{test_product_id}/status",
            json={"status": "live"}
        )
    
    def test_update_status_to_out_of_stock(self, api_client, test_product_id):
        """Should successfully mark product as out of stock"""
        response = api_client.put(
            f"{BASE_URL}/api/admin/products/{test_product_id}/status",
            json={"status": "out_of_stock"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data['new_status'] == 'out_of_stock'
        
        # Out of stock products should still appear on storefront
        storefront_response = requests.get(f"{BASE_URL}/api/products")
        storefront_products = storefront_response.json()
        product_ids = [p['product_id'] for p in storefront_products]
        assert test_product_id in product_ids, "Out of stock product should still appear on storefront"
        
        # Revert to live
        api_client.put(
            f"{BASE_URL}/api/admin/products/{test_product_id}/status",
            json={"status": "live"}
        )
    
    def test_update_status_to_live(self, api_client, test_product_id):
        """Should successfully re-enable a product"""
        # First disable
        api_client.put(
            f"{BASE_URL}/api/admin/products/{test_product_id}/status",
            json={"status": "disabled"}
        )
        
        # Re-enable
        response = api_client.put(
            f"{BASE_URL}/api/admin/products/{test_product_id}/status",
            json={"status": "live"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data['new_status'] == 'live'
        
        # Product should appear on storefront
        storefront_response = requests.get(f"{BASE_URL}/api/products")
        storefront_products = storefront_response.json()
        product_ids = [p['product_id'] for p in storefront_products]
        assert test_product_id in product_ids, "Re-enabled product should appear on storefront"
    
    def test_update_status_invalid_status(self, api_client, test_product_id):
        """Should reject invalid status values"""
        response = api_client.put(
            f"{BASE_URL}/api/admin/products/{test_product_id}/status",
            json={"status": "invalid_status"}
        )
        assert response.status_code == 400
        data = response.json()
        assert 'Invalid status' in data.get('detail', '')
    
    def test_update_status_nonexistent_product(self, api_client):
        """Should return 404 for non-existent product"""
        response = api_client.put(
            f"{BASE_URL}/api/admin/products/nonexistent_product_123/status",
            json={"status": "live"}
        )
        assert response.status_code == 404


class TestStorefrontFiltering:
    """Test that storefront correctly filters products by status"""
    
    def test_storefront_excludes_disabled_products(self, api_client):
        """Disabled products should NOT appear on storefront"""
        # Get initial product count
        initial_response = requests.get(f"{BASE_URL}/api/products")
        initial_products = initial_response.json()
        
        if len(initial_products) == 0:
            pytest.skip("No products to test")
        
        # Get a product and disable it
        test_product_id = initial_products[0]['product_id']
        api_client.put(
            f"{BASE_URL}/api/admin/products/{test_product_id}/status",
            json={"status": "disabled"}
        )
        
        # Check storefront - should have one less product
        after_response = requests.get(f"{BASE_URL}/api/products")
        after_products = after_response.json()
        
        assert len(after_products) == len(initial_products) - 1, \
            f"Storefront should have {len(initial_products) - 1} products after disabling one"
        
        # Verify disabled product is not in list
        product_ids = [p['product_id'] for p in after_products]
        assert test_product_id not in product_ids
        
        # Cleanup - re-enable
        api_client.put(
            f"{BASE_URL}/api/admin/products/{test_product_id}/status",
            json={"status": "live"}
        )
